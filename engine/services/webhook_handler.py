import hmac
import hashlib
import logging
from typing import Dict, Any, Optional
from bson import ObjectId

from config import settings
from db import get_projects_collection
from services.task_scheduler import TaskScheduler

logger = logging.getLogger('engine.webhook_handler')

class WebhookHandler:
    @classmethod
    def verify_signature(cls, payload_body: bytes, signature_header: Optional[str]) -> bool:
        """
        Verifies GitHub X-Hub-Signature-256 against configured secret.
        If no secret is configured, allows public testing.
        """
        if not settings.WEBHOOK_SECRET or not signature_header:
            return True

        if not signature_header.startswith('sha256='):
            return False

        expected_sig = signature_header.split('sha256=')[-1]
        computed_sig = hmac.new(
            settings.WEBHOOK_SECRET.encode('utf-8'),
            payload_body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_sig, expected_sig)

    @classmethod
    def handle_github_push(
        cls,
        payload: Dict[str, Any],
        project_id_param: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes GitHub push event payload.
        Maps the repository to the database project and triggers task scheduler.
        """
        repo_data = payload.get('repository', {})
        full_name = repo_data.get('full_name', '').lower()
        html_url = repo_data.get('html_url', '').lower()

        projects_col = get_projects_collection()
        project = None

        # 1. Lookup by query parameter if provided
        if project_id_param:
            try:
                project = projects_col.find_one({'_id': ObjectId(project_id_param)})
            except Exception:
                pass

        # 2. Lookup by repository full name or url
        if not project and full_name:
            project = projects_col.find_one({
                '$or': [
                    {'repo.fullName': {'$regex': f"^{full_name}$", '$options': 'i'}},
                    {'repo.url': {'$regex': full_name, '$options': 'i'}},
                ]
            })

        if not project:
            logger.warning(f"No matching project found for repository '{full_name}'")
            return {
                'status': 'ignored',
                'message': f"No active project found matching repository '{full_name}'.",
                'repo': full_name,
            }

        commits = payload.get('commits', [])
        logger.info(f"📥 Received GitHub push webhook with {len(commits)} commits for project {project['_id']}")

        structured_commits = []
        for c in commits:
            sha = c.get('id', '')
            short_hash = sha[:7]
            message = c.get('message', '')
            author = c.get('author', {}).get('name', 'developer')
            timestamp = c.get('timestamp')

            # Aggregate added and modified files
            added = c.get('added', [])
            modified = c.get('modified', [])
            all_modified = list(set(added + modified))

            structured_commits.append({
                'hash': short_hash,
                'fullHash': sha,
                'message': message,
                'author': author,
                'timestamp': timestamp,
                'modifiedFiles': all_modified,
            })

        result = TaskScheduler.process_commits_for_project(str(project['_id']), structured_commits)
        result['status'] = 'processed'
        return result
