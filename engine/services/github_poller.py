import logging
import re
import requests
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import quote
from bson import ObjectId
from pymongo.errors import PyMongoError

from db import get_commits_collection, get_projects_collection
from services.green_analysis_service import GreenAnalysisService
from services.green_analyzer import (
    MAX_FILE_BYTES,
    MAX_FILES_PER_COMMIT,
    MAX_TOTAL_BYTES,
    is_supported_source_path,
)
from services.task_scheduler import TaskScheduler

logger = logging.getLogger('engine.github_poller')

MAX_GREEN_ANALYSES_PER_SCAN = 5
MAX_GREEN_FILES_PER_SCAN = 10
GITHUB_PATH_PART = re.compile(r'^[A-Za-z0-9_.-]+$')


class GitHubPoller:
    HEADERS = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EchoArchitech-AI-Engine/1.0'
    }

    @classmethod
    def fetch_recent_commits(
        cls,
        owner: str,
        repo: str,
        branch: str = 'main',
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch recent commits from a public GitHub repository without requiring authentication.
        """
        url = f"https://api.github.com/repos/{owner}/{repo}/commits"
        params = {'sha': branch, 'per_page': limit}

        try:
            resp = requests.get(url, headers=cls.HEADERS, params=params, timeout=10)
            if resp.status_code == 404 and branch == 'main':
                # Try 'master' branch fallback
                params['sha'] = 'master'
                resp = requests.get(url, headers=cls.HEADERS, params=params, timeout=10)

            if resp.status_code != 200:
                logger.warning(
                    f"GitHub API returned status {resp.status_code} for {owner}/{repo}: {resp.text[:200]}"
                )
                return []

            commits_data = resp.json()
            if not isinstance(commits_data, list):
                return []

            return commits_data
        except Exception as e:
            logger.error(f"Error fetching commits from GitHub for {owner}/{repo}: {e}")
            return []

    @classmethod
    def fetch_commit_files(cls, owner: str, repo: str, sha: str) -> List[str]:
        """
        Fetch detailed list of files modified in a specific public commit.
        """
        file_data = cls.fetch_commit_file_data(owner, repo, sha)
        if file_data is None:
            return []
        return [f.get('filename') for f in file_data if f.get('filename')]

    @classmethod
    def fetch_commit_file_data(
        cls,
        owner: str,
        repo: str,
        sha: str,
    ) -> Optional[List[Dict[str, Any]]]:
        """Fetch public commit file metadata once for sync and Green analysis."""
        if not cls._valid_repo_part(owner) or not cls._valid_repo_part(repo):
            logger.warning('Skipping commit metadata fetch for invalid repository identifier.')
            return None
        if not re.fullmatch(r'[0-9a-fA-F]{7,64}', sha or ''):
            logger.warning('Skipping commit metadata fetch for invalid commit identifier.')
            return None

        url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
        try:
            resp = requests.get(url, headers=cls.HEADERS, timeout=10)
            if resp.status_code != 200:
                logger.warning(
                    "GitHub API returned status %s while fetching commit metadata.",
                    resp.status_code,
                )
                return None
            data = resp.json()
            if not isinstance(data, dict):
                return None
            files = data.get('files', [])
            if not isinstance(files, list):
                return None
            return [f for f in files if isinstance(f, dict)]
        except (requests.RequestException, ValueError, TypeError) as e:
            logger.error("Error fetching commit metadata for %s: %s", sha, e)
            return None

    @staticmethod
    def _valid_repo_part(value: str) -> bool:
        return bool(
            isinstance(value, str)
            and value not in {'.', '..'}
            and GITHUB_PATH_PART.fullmatch(value)
        )

    @classmethod
    def fetch_source_files(
        cls,
        owner: str,
        repo: str,
        sha: str,
        file_data: List[Dict[str, Any]],
        max_files: int = MAX_FILES_PER_COMMIT,
    ) -> Tuple[List[Tuple[str, str]], List[Dict[str, str]], int]:
        """Fetch bounded source files from the fixed public raw-content host."""
        if (
            not cls._valid_repo_part(owner)
            or not cls._valid_repo_part(repo)
            or not re.fullmatch(r'[0-9a-fA-F]{7,64}', sha or '')
        ):
            return [], [{'filePath': '', 'reason': 'invalid repository or commit identifier'}], 0

        sources = []
        skipped = []
        total_bytes = 0
        attempted = 0
        max_files = min(max_files, MAX_FILES_PER_COMMIT)

        for item in file_data:
            path = item.get('filename')
            if not isinstance(path, str) or not path:
                skipped.append({'filePath': '', 'reason': 'invalid GitHub file metadata'})
                continue

            normalized = path.replace('\\', '/').lstrip('/')
            if item.get('status') == 'removed':
                skipped.append({'filePath': normalized, 'reason': 'file was deleted in this commit'})
                continue
            if not is_supported_source_path(normalized):
                skipped.append({'filePath': normalized, 'reason': 'unsupported or generated file'})
                continue
            if any(part == '..' for part in normalized.split('/')):
                skipped.append({'filePath': normalized, 'reason': 'unsafe repository path'})
                continue
            if attempted >= max_files:
                skipped.append({'filePath': normalized, 'reason': 'source-file scan limit reached'})
                continue

            declared_size = item.get('size')
            if isinstance(declared_size, int) and declared_size > MAX_FILE_BYTES:
                skipped.append({'filePath': normalized, 'reason': 'file exceeds analysis size limit'})
                continue
            if total_bytes >= MAX_TOTAL_BYTES:
                skipped.append({'filePath': normalized, 'reason': 'commit analysis size limit reached'})
                continue

            attempted += 1
            raw_url = (
                'https://raw.githubusercontent.com/'
                f'{quote(owner, safe="")}/{quote(repo, safe="")}/'
                f'{quote(sha, safe="")}/{quote(normalized, safe="/")}'
            )
            response = None
            try:
                response = requests.get(
                    raw_url,
                    headers={'User-Agent': cls.HEADERS['User-Agent']},
                    timeout=(3, 5),
                    stream=True,
                    allow_redirects=False,
                )
                if response.status_code != 200:
                    skipped.append({'filePath': normalized, 'reason': 'source content unavailable'})
                    continue

                content_length = response.headers.get('Content-Length')
                if content_length and int(content_length) > MAX_FILE_BYTES:
                    skipped.append({'filePath': normalized, 'reason': 'file exceeds analysis size limit'})
                    continue

                chunks = []
                file_bytes = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if not chunk:
                        continue
                    file_bytes += len(chunk)
                    if file_bytes > MAX_FILE_BYTES or total_bytes + file_bytes > MAX_TOTAL_BYTES:
                        break
                    chunks.append(chunk)

                if file_bytes > MAX_FILE_BYTES:
                    skipped.append({'filePath': normalized, 'reason': 'file exceeds analysis size limit'})
                    continue
                if total_bytes + file_bytes > MAX_TOTAL_BYTES:
                    skipped.append({'filePath': normalized, 'reason': 'commit analysis size limit reached'})
                    continue

                content = b''.join(chunks)
                if b'\x00' in content:
                    skipped.append({'filePath': normalized, 'reason': 'binary content is not analyzed'})
                    continue
                try:
                    source = content.decode('utf-8-sig')
                except UnicodeDecodeError:
                    skipped.append({'filePath': normalized, 'reason': 'source is not UTF-8 text'})
                    continue

                total_bytes += file_bytes
                sources.append((normalized, source))
            except (requests.RequestException, ValueError) as e:
                logger.warning("Could not retrieve source for %s: %s", normalized, e)
                skipped.append({'filePath': normalized, 'reason': 'source content unavailable'})
            finally:
                if response is not None:
                    response.close()

        return sources, skipped, attempted

    @classmethod
    def _record_green_commit(
        cls,
        project_id: str,
        owner: str,
        repo: str,
        commit: Dict[str, Any],
        file_data: Optional[List[Dict[str, Any]]],
        max_files: int,
    ) -> Tuple[int, int, int]:
        sha = commit.get('sha') or commit.get('fullHash') or commit.get('hash', '')
        if not sha:
            return 0, 0, 0

        try:
            if file_data is None:
                source_files, skipped, requests_made = [], [], 0
            else:
                source_files, skipped, requests_made = cls.fetch_source_files(
                    owner,
                    repo,
                    sha,
                    file_data,
                    max_files,
                )

            metadata = commit.get('commit', {})
            commit_meta = metadata.get('commit', metadata)
            author_info = commit_meta.get('author', {})
            GreenAnalysisService.record_analysis(
                str(project_id),
                f'{owner}/{repo}',
                {
                    'sha': sha,
                    'hash': sha[:7],
                    'message': commit_meta.get('message', ''),
                    'timestamp': author_info.get('date'),
                },
                source_files,
                skipped,
                metadata_available=file_data is not None,
            )
            return 1, 0, requests_made
        except PyMongoError as e:
            logger.error("Could not save Green analysis for commit %s: %s", sha, e)
            return 0, 1, 0

    @classmethod
    def scan_project_green_insights(cls, project_id: str) -> Dict[str, Any]:
        """Re-analyze source files from the latest public commits without advancing tasks."""
        p_oid = ObjectId(project_id) if isinstance(project_id, str) else project_id
        project = get_projects_collection().find_one({'_id': p_oid})
        if not project:
            raise ValueError(f"Project not found with ID {project_id}")

        repo_info = project.get('repo', {})
        owner = repo_info.get('owner', '')
        name = repo_info.get('name', '')
        if not owner or not name:
            full_name = repo_info.get('fullName', '')
            url = repo_info.get('url', '')
            if full_name and '/' in full_name:
                owner, name = full_name.strip().split('/', 1)
            elif url and 'github.com/' in url:
                parts = url.split('github.com/')[-1].strip().rstrip('.git').split('/')
                if len(parts) >= 2:
                    owner, name = parts[0], parts[1]

        if not cls._valid_repo_part(owner) or not cls._valid_repo_part(name):
            raise ValueError('No valid public GitHub repository configured (missing owner/name).')

        synced_commits = list(
            get_commits_collection()
            .find({'projectId': p_oid})
            .sort('timestamp', -1)
            .limit(MAX_GREEN_ANALYSES_PER_SCAN)
        )
        analyses_scanned = 0
        analysis_errors = 0
        files_requested = 0

        for synced_commit in synced_commits:
            if analyses_scanned + analysis_errors >= MAX_GREEN_ANALYSES_PER_SCAN:
                break
            if files_requested >= MAX_GREEN_FILES_PER_SCAN:
                break

            sha = synced_commit.get('fullHash') or synced_commit.get('hash', '')
            file_data = cls.fetch_commit_file_data(owner, name, sha)
            commit = {
                'sha': sha,
                'commit': {
                    'message': synced_commit.get('message', ''),
                    'author': {'date': synced_commit.get('timestamp')},
                },
            }
            created, errors, requested = cls._record_green_commit(
                project_id,
                owner,
                name,
                commit,
                file_data,
                MAX_GREEN_FILES_PER_SCAN - files_requested,
            )
            analyses_scanned += created
            analysis_errors += errors
            files_requested += requested

        return {
            'projectId': str(project_id),
            'repo': f'{owner}/{name}',
            'status': 'success',
            'greenAnalysesScanned': analyses_scanned,
            'greenAnalysisErrors': analysis_errors,
            'commitsChecked': len(synced_commits),
        }

    @classmethod
    def sync_project_repo(cls, project_id: str) -> Dict[str, Any]:
        """
        Polls the public GitHub repository configured for the project,
        extracts modified files from recent commits, and triggers task scheduler.
        """
        projects_col = get_projects_collection()
        p_oid = ObjectId(project_id) if isinstance(project_id, str) else project_id
        project = projects_col.find_one({'_id': p_oid})

        if not project:
            raise ValueError(f"Project not found with ID {project_id}")

        repo_info = project.get('repo', {})
        owner = repo_info.get('owner', '')
        name = repo_info.get('name', '')
        branch = repo_info.get('branch', 'main')

        # If owner/name not explicitly split, parse from url or fullName
        if not owner or not name:
            full_name = repo_info.get('fullName', '')
            url = repo_info.get('url', '')
            if full_name and '/' in full_name:
                parts = full_name.strip().split('/')
                owner, name = parts[0], parts[1]
            elif url and 'github.com/' in url:
                path = url.split('github.com/')[-1].strip().rstrip('.git')
                parts = path.split('/')
                if len(parts) >= 2:
                    owner, name = parts[0], parts[1]

        if not owner or not name:
            return {
                'projectId': str(project_id),
                'status': 'error',
                'message': 'No valid public GitHub repository configured (missing owner/name).'
            }

        logger.info(f"🔍 Polling public GitHub repository: {owner}/{name} (branch: {branch})...")
        raw_commits = cls.fetch_recent_commits(owner, name, branch=branch, limit=10)

        if not raw_commits:
            return {
                'projectId': str(project_id),
                'repo': f"{owner}/{name}",
                'status': 'success',
                'commitsCount': 0,
                'message': 'No new commits or unable to reach GitHub repository.',
                'currentDay': project.get('currentDay', 1),
                'progressPercent': 0,
            }

        structured_commits = []
        for c in raw_commits:
            sha = c.get('sha', '')
            short_hash = sha[:7]
            commit_meta = c.get('commit', {})
            author_info = commit_meta.get('author', {})
            message = commit_meta.get('message', '')

            file_data = cls.fetch_commit_file_data(owner, name, sha)
            files = [
                f.get('filename')
                for f in file_data or []
                if f.get('filename')
            ]

            commit = {
                'hash': short_hash,
                'fullHash': sha,
                'message': message,
                'author': author_info.get('name', 'developer'),
                'timestamp': author_info.get('date'),
                'modifiedFiles': files,
            }
            structured_commits.append(commit)

        # Process through task scheduler
        result = TaskScheduler.process_commits_for_project(str(project_id), structured_commits)
        result['repo'] = f"{owner}/{name}"
        result['polledCommits'] = len(structured_commits)
        return result
