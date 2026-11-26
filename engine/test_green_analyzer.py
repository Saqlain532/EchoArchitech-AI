import unittest

from services.green_analyzer import analyze_source_files


class TestGreenAnalyzer(unittest.TestCase):
    def test_python_membership_search_inside_loop_suggests_set(self):
        result = analyze_source_files([(
            'src/checks.py',
            'for item in incoming:\n    if item in existing:\n        pass\n',
        )])

        self.assertEqual(result['filesAnalyzed'], 1)
        self.assertEqual(len(result['findings']), 1)
        finding = result['findings'][0]
        self.assertEqual(finding['language'], 'python')
        self.assertEqual(finding['line'], 2)
        self.assertIn('set', finding['suggestion'])
        self.assertEqual(finding['estimateType'], 'static-relative')

    def test_typescript_search_inside_nested_loops_has_higher_relative_impact(self):
        source = (
            'for (const item of incoming) {\n'
            '  for (const candidate of candidates) {\n'
            '    if (known.includes(candidate)) {}\n'
            '  }\n'
            '}\n'
        )
        result = analyze_source_files([('src/check.ts', source)])

        self.assertEqual(len(result['findings']), 1)
        self.assertEqual(result['findings'][0]['language'], 'typescript')
        self.assertEqual(result['findings'][0]['potentialImpact'], 'high')
        self.assertEqual(result['findings'][0]['line'], 3)

    def test_unsupported_and_invalid_files_are_reported_as_skipped(self):
        result = analyze_source_files([
            ('node_modules/pkg/index.js', 'for (;;) {}'),
            ('src/unknown.go', 'for {}'),
            ('src/broken.js', 'function {'),
        ])

        self.assertEqual(result['filesAnalyzed'], 0)
        self.assertEqual(result['findings'], [])
        self.assertEqual(len(result['filesSkipped']), 3)
        self.assertEqual(result['filesSkipped'][0]['filePath'], 'node_modules/pkg/index.js')

    def test_nested_python_linear_search_is_high_impact(self):
        source = (
            'for item in incoming:\n'
            '    for candidate in candidates:\n'
            '        if candidate in known:\n'
            '            pass\n'
        )
        result = analyze_source_files([('src/nested.py', source)])

        self.assertEqual(result['findings'][0]['potentialImpact'], 'high')
        self.assertEqual(result['findings'][0]['line'], 3)

    def test_findings_are_capped_per_commit(self):
        source = ''.join(
            f'for item_{index} in incoming:\n'
            f'    if item_{index} in known:\n'
            '        pass\n'
            for index in range(101)
        )
        result = analyze_source_files([('src/many.py', source)])

        self.assertEqual(len(result['findings']), 100)
        self.assertEqual(result['findingCount'], 101)
        self.assertEqual(result['findingsTruncatedCount'], 1)

    def test_set_construction_inside_loops_suggests_reusing_the_collection(self):
        python_result = analyze_source_files([(
            'src/cache.py',
            'for item in items:\n    lookup = set(values)\n',
        )])
        typescript_result = analyze_source_files([(
            'src/cache.ts',
            'for (const item of items) {\n  const lookup = new Set(values);\n}\n',
        )])

        self.assertEqual(
            python_result['findings'][0]['ruleId'],
            'repeated-collection-construction',
        )
        self.assertEqual(
            typescript_result['findings'][0]['ruleId'],
            'repeated-collection-construction',
        )


if __name__ == '__main__':
    unittest.main()
