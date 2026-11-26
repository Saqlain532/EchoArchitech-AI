import unittest
from unittest.mock import patch

from bson import ObjectId

from services.github_poller import GitHubPoller, TaskScheduler


class MockResponse:
    def __init__(self, content=b'', status_code=200, headers=None):
        self.content = content
        self.status_code = status_code
        self.headers = headers or {'Content-Length': str(len(content))}
        self.closed = False

    def iter_content(self, chunk_size):
        for offset in range(0, len(self.content), chunk_size):
            yield self.content[offset:offset + chunk_size]

    def close(self):
        self.closed = True


class TestGreenPoller(unittest.TestCase):
    def test_fetch_source_files_uses_fixed_host_and_skips_unsupported_files(self):
        response = MockResponse(b'for item in items:\n    if item in known:\n        pass\n')
        metadata = [
            {'filename': 'src/checks.py', 'size': 48},
            {'filename': 'README.md', 'size': 20},
        ]

        with patch('services.github_poller.requests.get', return_value=response) as get:
            files, skipped, requests_made = GitHubPoller.fetch_source_files(
                'sample-owner',
                'sample-repo',
                'a' * 40,
                metadata,
            )

        self.assertEqual(len(files), 1)
        self.assertEqual(files[0][0], 'src/checks.py')
        self.assertEqual(len(skipped), 1)
        self.assertEqual(skipped[0]['reason'], 'unsupported or generated file')
        self.assertEqual(requests_made, 1)
        self.assertTrue(get.call_args.args[0].startswith('https://raw.githubusercontent.com/'))
        self.assertFalse(get.call_args.kwargs['allow_redirects'])
        self.assertTrue(response.closed)

    def test_invalid_repo_path_does_not_make_network_request(self):
        with patch('services.github_poller.requests.get') as get:
            files, skipped, _ = GitHubPoller.fetch_source_files(
                'owner/other',
                'repo',
                'a' * 40,
                [{'filename': 'src/check.py'}],
            )

        self.assertEqual(files, [])
        self.assertEqual(len(skipped), 1)
        get.assert_not_called()

    def test_parent_path_in_github_file_metadata_is_not_fetched(self):
        with patch('services.github_poller.requests.get') as get:
            files, skipped, _ = GitHubPoller.fetch_source_files(
                'sample-owner',
                'sample-repo',
                'a' * 40,
                [{'filename': '../outside.py', 'size': 10}],
            )

        self.assertEqual(files, [])
        self.assertEqual(skipped[0]['reason'], 'unsafe repository path')
        get.assert_not_called()

    def test_source_size_limit_is_enforced_before_download(self):
        with patch('services.github_poller.requests.get') as get:
            files, skipped, _ = GitHubPoller.fetch_source_files(
                'sample-owner',
                'sample-repo',
                'a' * 40,
                [{'filename': 'src/large.py', 'size': 100000}],
            )

        self.assertEqual(files, [])
        self.assertEqual(skipped[0]['reason'], 'file exceeds analysis size limit')
        get.assert_not_called()

    def test_sync_records_commits_without_scanning_green_insights(self):
        project_id = str(ObjectId())
        commit = {
            'sha': 'a' * 40,
            'commit': {
                'message': 'Optimize lookup',
                'author': {'name': 'developer', 'date': '2026-01-01T00:00:00Z'},
            },
        }

        with patch(
            'services.github_poller.get_projects_collection',
            return_value=type('Projects', (), {
                'find_one': lambda self, query: {
                    '_id': query['_id'],
                    'repo': {'owner': 'sample-owner', 'name': 'sample-repo', 'branch': 'main'},
                },
            })(),
        ), patch.object(GitHubPoller, 'fetch_recent_commits', return_value=[commit]), patch.object(
            GitHubPoller,
            'fetch_commit_file_data',
            return_value=[{'filename': 'src/checks.py'}],
        ), patch(
            'services.github_poller.GreenAnalysisService.record_analysis'
        ) as record_analysis, patch.object(
            TaskScheduler,
            'process_commits_for_project',
            return_value={'tasksCompleted': 0},
        ) as process_commits:
            result = GitHubPoller.sync_project_repo(project_id)

        self.assertEqual(process_commits.call_args.args[1][0]['modifiedFiles'], ['src/checks.py'])
        self.assertNotIn('greenAnalysesCreated', result)
        record_analysis.assert_not_called()

    def test_scan_reanalyzes_recent_synced_commits_without_task_sync(self):
        project_id = str(ObjectId())
        sha = 'b' * 40
        synced_commit = {
            'fullHash': sha,
            'hash': sha[:7],
            'message': 'change',
        }

        class FakeCursor:
            def sort(self, *args):
                return self

            def limit(self, *args):
                return self

            def __iter__(self):
                return iter([synced_commit])

        class FakeCommits:
            def find(self, query):
                return FakeCursor()

        with patch(
            'services.github_poller.get_projects_collection',
            return_value=type('Projects', (), {
                'find_one': lambda self, query: {
                    '_id': query['_id'],
                    'repo': {'owner': 'sample-owner', 'name': 'sample-repo', 'branch': 'main'},
                },
            })(),
        ), patch(
            'services.github_poller.get_commits_collection',
            return_value=FakeCommits(),
        ), patch.object(
            GitHubPoller,
            'fetch_commit_file_data',
            return_value=[{'filename': 'src/checks.py'}],
        ), patch.object(
            GitHubPoller,
            'fetch_source_files',
            return_value=([('src/checks.py', 'pass')], [], 1),
        ), patch(
            'services.github_poller.GreenAnalysisService.record_analysis',
        ) as record_analysis, patch.object(
            TaskScheduler, 'process_commits_for_project'
        ) as process_commits:
            result = GitHubPoller.scan_project_green_insights(project_id)

        self.assertEqual(result['greenAnalysesScanned'], 1)
        record_analysis.assert_called_once()
        process_commits.assert_not_called()


if __name__ == '__main__':
    unittest.main()
