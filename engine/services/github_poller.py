import logging
import requests
from typing import List, Dict, Any, Optional
from bson import ObjectId

from db import get_projects_collection
from services.task_scheduler import TaskScheduler

logger = logging.getLogger('engine.github_poller')

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
        url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
        try:
            resp = requests.get(url, headers=cls.HEADERS, timeout=10)
            if resp.status_code != 200:
                return []
            data = resp.json()
            files = data.get('files', [])
            return [f.get('filename') for f in files if f.get('filename')]
        except Exception as e:
            logger.error(f"Error fetching commit files for {sha}: {e}")
            return []

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

            # Get modified files for this commit
            files = cls.fetch_commit_files(owner, name, sha)

            structured_commits.append({
                'hash': short_hash,
                'fullHash': sha,
                'message': message,
                'author': author_info.get('name', 'developer'),
                'timestamp': author_info.get('date'),
                'modifiedFiles': files,
            })

        # Process through task scheduler
        result = TaskScheduler.process_commits_for_project(str(project_id), structured_commits)
        result['repo'] = f"{owner}/{name}"
        result['polledCommits'] = len(structured_commits)
        return result
