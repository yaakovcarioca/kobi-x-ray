import type { ImportRef } from '../types.js';
import { unquote, type GrammarSpec, type SyntaxNode } from './spec.js';

function literal(node: SyntaxNode | null | undefined): string | null {
  if (!node) return null;
  if (node.type === 'string') return unquote(node.text);
  // `import(`./x`)` without substitutions is still a static specifier.
  if (node.type === 'template_string' && !node.text.includes('${')) return unquote(node.text);
  return null;
}

function extract(node: SyntaxNode, out: ImportRef[]): void {
  if (node.type === 'call_expression') {
    const callee = node.childForFieldName('function');
    if (!callee) return;
    const isImport = callee.type === 'import';
    const isRequire = callee.type === 'identifier' && callee.text === 'require';
    if (!isImport && !isRequire) return;
    const spec = literal(node.childForFieldName('arguments')?.namedChildren[0]);
    if (spec) out.push({ spec });
    return;
  }
  // import_statement and re-exporting export_statement share the `source` field.
  const spec = literal(node.childForFieldName('source'));
  if (spec) out.push({ spec });
}

/** Shared by the javascript, typescript and tsx grammars. */
export const javascriptSpec: GrammarSpec = {
  branches: new Set([
    'if_statement',
    'for_statement',
    'for_in_statement',
    'while_statement',
    'do_statement',
    'switch_case',
    'catch_clause',
    'ternary_expression',
    '&&',
    '||',
    '??',
  ]),
  functions: new Set([
    'function_declaration',
    'function_expression',
    'generator_function',
    'generator_function_declaration',
    'arrow_function',
    'method_definition',
  ]),
  importNodes: new Set(['import_statement', 'export_statement', 'call_expression']),
  extract,
};
