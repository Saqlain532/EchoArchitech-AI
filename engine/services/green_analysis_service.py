from datetime import datetime, timezone
from typing import Dict, Iterable, List, Tuple

from bson import ObjectId
from pymongo import ASCENDING

from db import get_green_analyses_collection
from services.green_analyzer import analyze_source_files


class GreenAnalysisService:
    _index_ready = False

    @staticmethod
    def _collection():
        collection = get_green_analyses_collection()
        if not GreenAnalysisService._index_ready:
            collection.create_index(
                [('projectId', ASCENDING), ('commitHash', ASCENDING)],
                unique=True,
                name='project_commit_unique',
            )
            GreenAnalysisService._index_ready = True
        return collection

    @classmethod
    def has_analysis(cls, project_id: str, commit_hash: str) -> bool:
        p_oid = ObjectId(project_id) if isinstance(project_id, str) else project_id
        return cls._collection().find_one(
            {
                'projectId': p_oid,
                'commitHash': commit_hash,
                'retryable': {'$ne': True},
            },
            {'_id': 1},
        ) is not None

    @classmethod
    def record_analysis(
        cls,
        project_id: str,
        repo: str,
        commit: Dict,
        source_files: Iterable[Tuple[str, str]],
        fetch_skipped: List[Dict],
        metadata_available: bool = True,
    ) -> Dict:
        p_oid = ObjectId(project_id) if isinstance(project_id, str) else project_id
        analysis = analyze_source_files(source_files)
        all_skipped = analysis['filesSkipped'] + fetch_skipped
        skipped = all_skipped[:50]
        status = 'partial' if all_skipped else 'complete'
        if not metadata_available:
            status = 'unavailable'
        retryable = (
            not metadata_available
            or any(item.get('reason') == 'source content unavailable' for item in fetch_skipped)
        )

        commit_hash = commit.get('sha') or commit.get('hash')
        if not commit_hash:
            raise ValueError('Commit SHA is required to record Green analysis')
        timestamp = commit.get('timestamp')
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except ValueError:
                timestamp = None

        now = datetime.now(timezone.utc)
        document = {
            'projectId': p_oid,
            'repo': repo,
            'commitHash': commit_hash,
            'shortHash': commit.get('hash') or commit_hash[:7],
            'message': commit.get('message', ''),
            'timestamp': timestamp,
            'analysisStatus': status,
            'retryable': retryable,
            'filesAnalyzed': analysis['filesAnalyzed'],
            'filesSkippedCount': len(all_skipped),
            'filesSkipped': skipped,
            'findingCount': analysis['findingCount'],
            'findingsTruncatedCount': analysis['findingsTruncatedCount'],
            'findings': analysis['findings'],
            'estimateType': 'static-relative',
            'analyzedAt': now,
            'createdAt': now,
            'updatedAt': now,
        }

        collection = cls._collection()
        collection.update_one(
            {'projectId': p_oid, 'commitHash': commit_hash},
            {'$set': document},
            upsert=True,
        )
        result = collection.find_one({'projectId': p_oid, 'commitHash': commit_hash})
        return cls.serialize(result)

    @classmethod
    def get_recent(cls, project_id: str, limit: int = 20) -> List[Dict]:
        p_oid = ObjectId(project_id) if isinstance(project_id, str) else project_id
        documents = cls._collection().find({'projectId': p_oid}).sort(
            'analyzedAt',
            -1,
        ).limit(limit)
        return [cls.serialize(document) for document in documents]

    @staticmethod
    def serialize(document: Dict) -> Dict:
        if not document:
            return {}
        result = dict(document)
        if result.get('_id') is not None:
            result['_id'] = str(result['_id'])
        if result.get('projectId') is not None:
            result['projectId'] = str(result['projectId'])
        for field in ('timestamp', 'analyzedAt', 'createdAt', 'updatedAt'):
            value = result.get(field)
            if hasattr(value, 'isoformat'):
                result[field] = value.isoformat()
        return result
