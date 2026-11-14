import type { ImportRef } from '../types.js';
import type { GrammarSpec, SyntaxNode } from './spec.js';

function importedName(node: SyntaxNode): string | null {
  if (node.type === 'dotted_name') return node.text;
  if (node.type === 'aliased_import') return node.childForFieldName('name')?.text ?? null;
  return null;
}

function extract(node: SyntaxNode, out: ImportRef[]): void {
  if (node.type === 'import_statement') {
    for (const child of node.namedChildren) {
      const spec = importedName(child);
      if (spec) out.push({ spec, level: 0 });
    }
    return;
  }

  // from <module> import a, b
  const moduleNode = node.childForFieldName('module_name');
  if (!moduleNode) return;
  let spec = moduleNode.text;
  let level = 0;
  if (moduleNode.type === 'relative_import') {
    while (level < spec.length && spec[level] === '.') level++;
    spec = spec.slice(level);
  }
  const names: string[] = [];
  for (const child of node.namedChildren) {
    if (child.startIndex === moduleNode.startIndex) continue;
    const name = importedName(child);
    if (name) names.push(name);
  }
  out.push({ spec, level, names });
}

export const pythonSpec: GrammarSpec = {
  branches: new Set([
    'if_statement',
    'elif_clause',
    'for_statement',
    'while_statement',
    'except_clause',
    'conditional_expression',
    'boolean_operator',
    'case_clause',
    'for_in_clause',
    'if_clause',
  ]),
  functions: new Set(['function_definition', 'lambda']),
  importNodes: new Set(['import_statement', 'import_from_statement']),
  extract,
};
