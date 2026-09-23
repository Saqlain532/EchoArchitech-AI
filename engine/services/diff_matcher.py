import os
import re
from typing import List, Dict, Any, Tuple

class DiffMatcher:
    @staticmethod
    def normalize_path(path: str) -> str:
        """Normalize file paths for consistent cross-platform matching."""
        if not path:
            return ""
        clean = path.strip().replace('\\', '/')
        # Remove leading ./ or /
        clean = re.sub(r'^\.?/+', '', clean)
        return clean.lower()

    @classmethod
    def match_file(cls, commit_file: str, target_file: str) -> bool:
        """
        Check if a file modified in a commit corresponds to a task target file.
        Supports exact match, relative subdirectory match, and suffix matching.
        """
        norm_commit = cls.normalize_path(commit_file)
        norm_target = cls.normalize_path(target_file)

        if not norm_commit or not norm_target:
            return False

        # 1. Exact match
        if norm_commit == norm_target:
            return True

        # 2. Suffix match (e.g. "src/routes/auth.js" matches "routes/auth.js")
        if norm_commit.endswith('/' + norm_target):
            return True
        if norm_target.endswith('/' + norm_commit):
            return True

        # 3. Basename & immediate parent directory match
        commit_parts = norm_commit.split('/')
        target_parts = norm_target.split('/')

        if len(commit_parts) >= 2 and len(target_parts) >= 2:
            if commit_parts[-2:] == target_parts[-2:]:
                return True

        # 4. Strict filename match if unique and specific (e.g. Dockerfile, schema.prisma)
        if len(commit_parts) > 0 and len(target_parts) > 0:
            commit_base = commit_parts[-1]
            target_base = target_parts[-1]
            if commit_base == target_base and commit_base in ['dockerfile', 'package.json', 'schema.prisma', 'requirements.txt']:
                return True

        return False

    @classmethod
    def evaluate_task_match(
        cls,
        task: Dict[str, Any],
        modified_files: List[str],
        commit_message: str = ''
    ) -> Dict[str, Any]:
        """
        Evaluates whether a commit's modified files satisfy a Task's targetFiles
        or matches the task's day/title in the commit message.
        """
        target_files = task.get('targetFiles', [])
        day_number = task.get('dayNumber', 0)
        task_title = task.get('title', '')

        matched_targets = []
        matched_commit_files = []

        # 1. Compare target files against commit modified files
        for target in target_files:
            for commit_file in modified_files:
                if cls.match_file(commit_file, target):
                    if target not in matched_targets:
                        matched_targets.append(target)
                    if commit_file not in matched_commit_files:
                        matched_commit_files.append(commit_file)

        # Score based on proportion of target files touched
        total_targets = len(target_files) if target_files else 1
        file_match_score = len(matched_targets) / total_targets

        # 2. Check commit message heuristics
        msg_lower = (commit_message or '').lower()
        message_match = False
        message_reason = ""

        # Check for explicit day references like "day 1", "day-1", "[day 1]"
        day_pattern = rf'\bday[- _]?{day_number}\b'
        if day_number and re.search(day_pattern, msg_lower):
            message_match = True
            message_reason = f"Commit message explicitly references Day {day_number}"

        # Check for task title keywords
        clean_title = re.sub(r'[^a-zA-Z0-9\s]', '', task_title).lower()
        title_words = [w for w in clean_title.split() if len(w) > 3 and w not in ['setup', 'implement', 'create', 'build', 'task']]
        if len(title_words) >= 2:
            matches_words = [w for w in title_words if w in msg_lower]
            if len(matches_words) >= 2:
                message_match = True
                message_reason = f"Commit message matches keywords: {', '.join(matches_words)}"

        # 3. Determine overall match
        is_matched = False
        reason = ""

        if len(matched_targets) > 0 and file_match_score >= 0.5:
            is_matched = True
            reason = f"Matched {len(matched_targets)}/{len(target_files)} target files: {matched_targets}"
        elif len(matched_targets) > 0 and message_match:
            is_matched = True
            reason = f"Matched target files {matched_targets} + {message_reason}"
        elif message_match and len(modified_files) > 0:
            is_matched = True
            reason = message_reason

        return {
            "matched": is_matched,
            "score": max(file_match_score, 0.8 if message_match else 0.0),
            "matched_targets": matched_targets,
            "matched_commit_files": matched_commit_files,
            "reason": reason,
        }
