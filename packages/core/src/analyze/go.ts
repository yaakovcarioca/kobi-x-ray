import type { ImportRef } from '../types.js';
import { unquote, type GrammarSpec, type SyntaxNode } from './spec.js';

function extract(node: SyntaxNode, out: ImportRef[]): void {
  const path = node.childForFieldName('path');
  if (path) out.push({ spec: unquote(path.text) });
}

export const goSpec: GrammarSpec = {
  branches: new Set([
    'if_statement',
    'for_statement',
    'expression_case',
    'type_case',
    'communication_case',
    '&&',
    '||',
  ]),
  functions: new Set(['function_declaration', 'method_declaration', 'func_literal']),
  importNodes: new Set(['import_spec']),
  extract,
};
