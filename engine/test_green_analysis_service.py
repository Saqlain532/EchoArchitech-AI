import unittest
from unittest.mock import patch

from bson import ObjectId
from fastapi import HTTPException

from services.green_analysis_service import GreenAnalysisService


class FakeCollection:
    def __init__(self):
        self.document = None

    def create_index(self, *args, **kwargs):
        return 'project_commit_unique'

    def update_one(self, query, update, upsert=False):
        if self.document is None:
            self.document = {'_id': ObjectId(), **update['$set']}
        else:
            self.document.update(update['$set'])

    def find_one(self, query, projection=None):
        if (
            self.document
            and self.document['projectId'] == query['projectId']
            and self.document['commitHash'] == query['commitHash']
        ):
            return self.document
        return None


class TestGreenAnalysisService(unittest.TestCase):
    def test_records_findings_without_persisting_source_code(self):
        project_id = str(ObjectId())
        collection = FakeCollection()
        source = 'for item in items:\n    if item in known:\n        pass\n'

        with patch(
            'services.green_analysis_service.get_green_analyses_collection',
            return_value=collection,
        ):
            result = GreenAnalysisService.record_analysis(
                project_id,
                'sample-owner/sample-repo',
                {
                    'sha': 'a' * 40,
                    'hash': 'a' * 7,
                    'message': 'Optimize repeated lookup',
                },
                [('src/checks.py', source)],
                [],
            )

        self.assertEqual(result['analysisStatus'], 'complete')
        self.assertEqual(result['filesAnalyzed'], 1)
        self.assertEqual(len(result['findings']), 1)
        self.assertNotIn('source', collection.document)
        self.assertNotIn(source, str(collection.document))
        self.assertEqual(result['projectId'], project_id)

    def test_green_insights_route_serializes_recent_reports(self):
        from main import get_project_green_insights

        project_id = str(ObjectId())
        with patch(
            'main.GreenAnalysisService.get_recent',
            return_value=[{'commitHash': 'a' * 40, 'findings': []}],
        ):
            result = get_project_green_insights(project_id)

        self.assertTrue(result['success'])
        self.assertEqual(result['data']['projectId'], project_id)
        self.assertEqual(result['data']['analyses'][0]['commitHash'], 'a' * 40)

    def test_green_insights_route_rejects_invalid_project_id(self):
        from main import get_project_green_insights

        with self.assertRaises(HTTPException) as raised:
            get_project_green_insights('not-an-object-id')

        self.assertEqual(raised.exception.status_code, 400)

    def test_green_scan_route_scans_synced_commits(self):
        from main import scan_project_green_insights

        project_id = str(ObjectId())
        with patch(
            'main.GitHubPoller.scan_project_green_insights',
            return_value={'projectId': project_id, 'greenAnalysesScanned': 2},
        ) as scan:
            result = scan_project_green_insights(project_id)

        self.assertTrue(result['success'])
        self.assertEqual(result['data']['greenAnalysesScanned'], 2)
        scan.assert_called_once_with(project_id)

    def test_green_scan_route_rejects_invalid_project_id(self):
        from main import scan_project_green_insights

        with self.assertRaises(HTTPException) as raised:
            scan_project_green_insights('not-an-object-id')

        self.assertEqual(raised.exception.status_code, 400)


if __name__ == '__main__':
    unittest.main()
