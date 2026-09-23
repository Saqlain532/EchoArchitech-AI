import logging
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Dict, Any

from db import get_projects_collection, get_tasks_collection, get_commits_collection
from services.diff_matcher import DiffMatcher

logger = logging.getLogger('engine.task_scheduler')

class TaskScheduler:
    @classmethod
    def record_commit(cls, project_id: str, commit_data: Dict[str, Any]) -> bool:
        """
        Idempotently records a commit in the commits collection.
        Returns True if newly inserted, False if already exists.
        """
        commits_col = get_commits_collection()
        p_oid = ObjectId(project_id) if isinstance(project_id, str) else project_id
        commit_hash = commit_data.get('hash', '')

        if not commit_hash:
            return False

        existing = commits_col.find_one({'projectId': p_oid, 'hash': commit_hash})
        if existing:
            return False

        timestamp = commit_data.get('timestamp')
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except Exception:
                timestamp = datetime.now(timezone.utc)
        elif not isinstance(timestamp, datetime):
            timestamp = datetime.now(timezone.utc)

        doc = {
            'projectId': p_oid,
            'hash': commit_hash,
            'fullHash': commit_data.get('fullHash', commit_hash),
            'message': commit_data.get('message', ''),
            'author': commit_data.get('author', 'developer'),
            'timestamp': timestamp,
            'filesChanged': len(commit_data.get('modifiedFiles', [])),
            'modifiedFiles': commit_data.get('modifiedFiles', []),
            'createdAt': datetime.now(timezone.utc),
            'updatedAt': datetime.now(timezone.utc),
        }

        commits_col.insert_one(doc)
        return True

    @classmethod
    def process_commits_for_project(
        cls,
        project_id: str,
        commits_list: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Process a list of commits against project tasks.
        Matches modified files, marks tasks completed, and advances the project sprint day.
        """
        projects_col = get_projects_collection()
        tasks_col = get_tasks_collection()

        p_oid = ObjectId(project_id) if isinstance(project_id, str) else project_id
        project = projects_col.find_one({'_id': p_oid})
        if not project:
            raise ValueError(f"Project not found with ID {project_id}")

        current_day = project.get('currentDay', 1)
        total_days = project.get('totalDays', 14)

        # Get all tasks for this project
        all_tasks = list(tasks_col.find({'projectId': p_oid}))
        completed_task_ids = []
        new_commits_count = 0

        # Sort commits chronologically if possible
        for commit in commits_list:
            is_new = cls.record_commit(project_id, commit)
            if is_new:
                new_commits_count += 1

            modified_files = commit.get('modifiedFiles', [])
            commit_msg = commit.get('message', '')
            commit_hash = commit.get('hash', '')
            commit_author = commit.get('author', 'developer')

            # Evaluate against each uncompleted task
            for task in all_tasks:
                if task.get('status') == 'Completed':
                    continue

                eval_result = DiffMatcher.evaluate_task_match(task, modified_files, commit_msg)
                if eval_result.get('matched'):
                    task_id = task['_id']
                    logger.info(
                        f"🎯 Commit [{commit_hash[:7]}] matched Task [{task.get('title')}] "
                        f"(Day {task.get('dayNumber')}): {eval_result.get('reason')}"
                    )

                    now = datetime.now(timezone.utc)
                    linked_commit = {
                        'hash': commit_hash,
                        'message': commit_msg,
                        'author': commit_author,
                        'timestamp': now,
                    }

                    tasks_col.update_one(
                        {'_id': task_id},
                        {
                            '$set': {
                                'status': 'Completed',
                                'completedAt': now,
                                'updatedAt': now,
                            },
                            '$push': {
                                'linkedCommits': linked_commit
                            }
                        }
                    )

                    task['status'] = 'Completed'
                    completed_task_ids.append(str(task_id))

        # Check if day advancement is warranted
        # Re-fetch tasks to calculate fresh statistics
        updated_tasks = list(tasks_col.find({'projectId': p_oid}))
        total_tasks_count = len(updated_tasks)
        completed_tasks_count = sum(1 for t in updated_tasks if t.get('status') == 'Completed')

        # Check current day tasks status
        current_day_tasks = [t for t in updated_tasks if t.get('dayNumber') == current_day]
        current_day_all_done = (
            len(current_day_tasks) > 0 and
            all(t.get('status') == 'Completed' for t in current_day_tasks)
        )

        new_current_day = current_day
        if current_day_all_done and current_day < total_days:
            # Advance to next day
            new_current_day = current_day + 1
            logger.info(f"🚀 All tasks for Day {current_day} completed! Advancing to Day {new_current_day}.")

        project_status = project.get('status', 'In Progress')
        if total_tasks_count > 0 and completed_tasks_count >= total_tasks_count:
            project_status = 'Completed'
        elif project_status == 'Draft':
            project_status = 'In Progress'

        # Update project record
        projects_col.update_one(
            {'_id': p_oid},
            {
                '$set': {
                    'currentDay': new_current_day,
                    'status': project_status,
                    'repo.lastSync': datetime.now(timezone.utc),
                    'updatedAt': datetime.now(timezone.utc),
                }
            }
        )

        progress_percent = (
            round((completed_tasks_count / total_tasks_count) * 100, 1)
            if total_tasks_count > 0 else 0
        )

        return {
            'projectId': str(project_id),
            'newCommitsRecorded': new_commits_count,
            'tasksCompleted': len(completed_task_ids),
            'completedTaskIds': completed_task_ids,
            'currentDay': new_current_day,
            'totalDays': total_days,
            'totalTasks': total_tasks_count,
            'completedTasks': completed_tasks_count,
            'progressPercent': progress_percent,
            'projectStatus': project_status,
        }
