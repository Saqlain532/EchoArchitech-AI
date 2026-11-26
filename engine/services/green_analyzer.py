import ast
from pathlib import PurePosixPath
from typing import Dict, Iterable, List, Tuple

from tree_sitter import Language, Parser
import tree_sitter_javascript
import tree_sitter_typescript


MAX_FILES_PER_COMMIT = 20
MAX_FILE_BYTES = 64 * 1024
MAX_TOTAL_BYTES = 512 * 1024
MAX_FINDINGS_PER_COMMIT = 100

LANGUAGES = {
    '.py': 'python',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
}

IGNORED_DIRECTORIES = {
    '.git',
    '.venv',
    'build',
    'coverage',
    'dist',
    'node_modules',
    'vendor',
    'venv',
    '__pycache__',
}

JS_LOOP_NODES = {
    'do_statement',
    'for_in_statement',
    'for_statement',
    'while_statement',
}

JS_SEARCH_METHODS = {'includes'}


def is_supported_source_path(path: str) -> bool:
    normalized_path = path.replace('\\', '/').lstrip('/')
    parts = PurePosixPath(normalized_path).parts
    return (
        PurePosixPath(normalized_path).suffix.lower() in LANGUAGES
        and not any(part.lower() in IGNORED_DIRECTORIES for part in parts)
    )


def _python_findings(path: str, source: str) -> Tuple[List[Dict], bool]:
    try:
        tree = ast.parse(source, filename=path)
    except SyntaxError:
        return [], False

    findings = []

    class SearchVisitor(ast.NodeVisitor):
        def __init__(self):
            self.loop_depth = 0

        def visit_For(self, node):
            self.loop_depth += 1
            self.generic_visit(node)
            self.loop_depth -= 1

        def visit_AsyncFor(self, node):
            self.visit_For(node)

        def visit_FunctionDef(self, node):
            previous_depth = self.loop_depth
            self.loop_depth = 0
            for statement in node.body:
                self.visit(statement)
            self.loop_depth = previous_depth

        def visit_AsyncFunctionDef(self, node):
            self.visit_FunctionDef(node)

        def visit_While(self, node):
            self.loop_depth += 1
            self.generic_visit(node)
            self.loop_depth -= 1

        def visit_Compare(self, node):
            if self.loop_depth and any(isinstance(op, (ast.In, ast.NotIn)) for op in node.ops):
                findings.append(_search_finding(
                    path,
                    'python',
                    node.lineno,
                    node.col_offset,
                    self.loop_depth,
                ))
            self.generic_visit(node)

        def visit_Call(self, node):
            if (
                self.loop_depth
                and isinstance(node.func, ast.Name)
                and node.func.id == 'set'
                and node.args
            ):
                findings.append(_construction_finding(
                    path,
                    'python',
                    node.lineno,
                    node.col_offset,
                    self.loop_depth,
                ))
            self.generic_visit(node)

    try:
        SearchVisitor().visit(tree)
    except RecursionError:
        return [], False
    return _deduplicate_findings(findings), True


def _javascript_language(path: str) -> Language:
    suffix = PurePosixPath(path).suffix.lower()
    if suffix == '.tsx':
        return Language(tree_sitter_typescript.language_tsx())
    if suffix == '.ts':
        return Language(tree_sitter_typescript.language_typescript())
    return Language(tree_sitter_javascript.language())


def _javascript_findings(path: str, source: str) -> Tuple[List[Dict], bool]:
    parser = Parser(_javascript_language(path))
    tree = parser.parse(source.encode('utf-8'))
    if tree.root_node.has_error:
        return [], False

    findings = []

    function_nodes = {
        'arrow_function',
        'function_declaration',
        'function_expression',
        'generator_function',
        'method_definition',
    }

    pending = [(tree.root_node, 0)]
    while pending:
        node, loop_depth = pending.pop()
        if node.type in function_nodes:
            loop_depth = 0
        next_depth = loop_depth + (1 if node.type in JS_LOOP_NODES else 0)
        if node.type == 'call_expression' and next_depth:
            callee = node.child_by_field_name('function')
            if callee and callee.type == 'member_expression':
                method = callee.child_by_field_name('property')
                if method and method.text.decode('utf-8', errors='replace') in JS_SEARCH_METHODS:
                    row, column = node.start_point
                    findings.append(_search_finding(
                        path,
                        'typescript' if PurePosixPath(path).suffix.lower() in {'.ts', '.tsx'} else 'javascript',
                        row + 1,
                        column,
                        next_depth,
                    ))
        if node.type == 'new_expression' and next_depth:
            constructor = node.child_by_field_name('constructor')
            if constructor and constructor.text.decode('utf-8', errors='replace') == 'Set':
                row, column = node.start_point
                findings.append(_construction_finding(
                    path,
                    'typescript' if PurePosixPath(path).suffix.lower() in {'.ts', '.tsx'} else 'javascript',
                    row + 1,
                    column,
                    next_depth,
                ))
        pending.extend((child, next_depth) for child in reversed(node.children))
    return _deduplicate_findings(findings), True


def _search_finding(
    path: str,
    language: str,
    line: int,
    column: int,
    loop_depth: int,
) -> Dict:
    is_nested = loop_depth > 1
    if language == 'python':
        suggestion = (
            'If the searched collection is a list and is not changed in the loop, '
            'build a set once before the loop and use set membership. Items must be hashable; '
            'the set uses additional memory, so benchmark the trade-off.'
        )
        example = 'lookup = set(values)\nfor item in items:\n    if item in lookup:\n        ...'
    else:
        suggestion = (
            'If the receiver is an array and is not changed in the loop, build a Set once '
            'before the loop and replace repeated includes checks with Set.has. '
            'A Set uses additional memory; benchmark the trade-off.'
        )
        example = 'const lookup = new Set(values);\nfor (const item of items) {\n  if (lookup.has(item)) { /* ... */ }\n}'

    return {
        'ruleId': 'repeated-linear-search',
        'language': language,
        'filePath': path,
        'line': line,
        'column': column + 1,
        'title': 'Repeated collection search inside a loop',
        'explanation': (
            'A linear membership or search operation appears inside a loop. For large '
            'collections, repeated scans can increase CPU work; static analysis cannot '
            'confirm the collection type, size, or runtime impact.'
        ),
        'suggestion': suggestion,
        'example': example,
        'potentialImpact': 'high' if is_nested else 'medium',
        'confidence': 'medium',
        'estimateType': 'static-relative',
    }


def _construction_finding(
    path: str,
    language: str,
    line: int,
    column: int,
    loop_depth: int,
) -> Dict:
    if language == 'python':
        suggestion = (
            'If the source collection is unchanged during the loop, build the set once '
            'before entering the loop to avoid repeating its construction.'
        )
        example = 'lookup = set(values)\nfor item in items:\n    process(item, lookup)'
    else:
        suggestion = (
            'If the source collection is unchanged during the loop, construct the Set once '
            'before entering the loop and reuse it.'
        )
        example = 'const lookup = new Set(values);\nfor (const item of items) {\n  process(item, lookup);\n}'

    return {
        'ruleId': 'repeated-collection-construction',
        'language': language,
        'filePath': path,
        'line': line,
        'column': column + 1,
        'title': 'Collection built repeatedly inside a loop',
        'explanation': (
            'A set construction appears inside a loop and may repeat allocation and '
            'iteration work. Hoisting it is only equivalent when the source collection '
            'does not change during the loop.'
        ),
        'suggestion': suggestion,
        'example': example,
        'potentialImpact': 'high' if loop_depth > 1 else 'medium',
        'confidence': 'medium',
        'estimateType': 'static-relative',
    }


def _deduplicate_findings(findings: List[Dict]) -> List[Dict]:
    unique = {}
    for finding in findings:
        key = (finding['ruleId'], finding['filePath'], finding['line'], finding['column'])
        unique[key] = finding
    return list(unique.values())


def analyze_source_files(files: Iterable[Tuple[str, str]]) -> Dict:
    findings = []
    skipped = []
    analyzed = 0
    total_bytes = 0
    file_count = 0

    for path, source in files:
        file_count += 1
        if file_count > MAX_FILES_PER_COMMIT:
            skipped.append({'filePath': path, 'reason': 'commit file limit reached'})
            continue

        normalized_path = path.replace('\\', '/').lstrip('/')
        parts = PurePosixPath(normalized_path).parts
        language = LANGUAGES.get(PurePosixPath(normalized_path).suffix.lower())

        if not language or any(part.lower() in IGNORED_DIRECTORIES for part in parts):
            skipped.append({'filePath': normalized_path, 'reason': 'unsupported or generated file'})
            continue

        if not isinstance(source, str):
            skipped.append({'filePath': normalized_path, 'reason': 'source content unavailable'})
            continue

        file_bytes = len(source.encode('utf-8'))
        if file_bytes > MAX_FILE_BYTES:
            skipped.append({'filePath': normalized_path, 'reason': 'file exceeds analysis size limit'})
            continue
        if total_bytes + file_bytes > MAX_TOTAL_BYTES:
            skipped.append({'filePath': normalized_path, 'reason': 'commit analysis size limit reached'})
            continue

        total_bytes += file_bytes
        if language == 'python':
            file_findings, parsed = _python_findings(normalized_path, source)
        else:
            file_findings, parsed = _javascript_findings(normalized_path, source)
        if not parsed:
            skipped.append({'filePath': normalized_path, 'reason': 'source could not be parsed'})
            continue
        analyzed += 1
        findings.extend(file_findings)

    findings.sort(key=lambda finding: (finding['filePath'], finding['line'], finding['column']))
    return {
        'filesAnalyzed': analyzed,
        'filesSkipped': skipped,
        'findingCount': len(findings),
        'findingsTruncatedCount': max(0, len(findings) - MAX_FINDINGS_PER_COMMIT),
        'findings': findings[:MAX_FINDINGS_PER_COMMIT],
        'estimateType': 'static-relative',
    }
