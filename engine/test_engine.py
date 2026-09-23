import unittest
from bson import ObjectId
from services.diff_matcher import DiffMatcher
from services.task_scheduler import TaskScheduler
from db import Database, get_projects_collection, get_tasks_collection

class TestEngine(unittest.TestCase):
    def test_diff_matcher_exact(self):
        self.assertTrue(DiffMatcher.match_file('src/routes/auth.js', 'src/routes/auth.js'))
        self.assertTrue(DiffMatcher.match_file('src\\routes\\auth.js', 'src/routes/auth.js'))

    def test_diff_matcher_suffix(self):
        self.assertTrue(DiffMatcher.match_file('backend/src/routes/auth.js', 'src/routes/auth.js'))
        self.assertTrue(DiffMatcher.match_file('src/routes/auth.js', 'routes/auth.js'))

    def test_evaluate_task_match(self):
        task = {
            'dayNumber': 1,
            'title': 'Setup Authentication Service',
            'targetFiles': ['src/routes/auth.js', 'src/models/user.js']
        }
        modified_files = ['src/routes/auth.js']
        eval_result = DiffMatcher.evaluate_task_match(task, modified_files, 'feat: add auth routes for day 1')
        self.assertTrue(eval_result['matched'])
        self.assertIn('src/routes/auth.js', eval_result['matched_targets'])

    def test_atlas_connection(self):
        db = Database.connect()
        self.assertIsNotNone(db)
        # Check if projects collection exists
        projects = list(get_projects_collection().find().limit(1))
        self.assertIsInstance(projects, list)
        print(f"Atlas connectivity verified! Sample projects found: {len(projects)}")

if __name__ == '__main__':
    unittest.main()
