import type { ImportRef } from '../types.js';
import type { GrammarSpec, SyntaxNode } from './spec.js';

/** Expands a `use` tree (`a::{b, c::d}`) into one flat path per leaf. */
function flattenUse(node: SyntaxNode, prefix: string, out: string[]): void {
  const withPrefix = (path: string) => (prefix ? `${prefix}::${path}` : path);
  switch (node.type) {
    case 'scoped_use_list': {
      const path = node.childForFieldName('path');
      const list = node.childForFieldName('list');
      const next = path ? withPrefix(path.text) : prefix;
      if (list) flattenUse(list, next, out);
      break;
    }
    case 'use_list':
      for (const child of node.namedChildren) flattenUse(child, prefix, out);
      break;
    case 'use_as_clause': {
      const path = node.childForFieldName('path');
      if (path) flattenUse(path, prefix, out);
      break;
    }
    case 'use_wildcard':
      out.push(withPrefix(node.text.replace(/::\*$/, '')));
      break;
    case 'self':
      // `use a::{self}` refers to `a` itself.
      if (prefix) out.push(prefix);
      break;
    default:
      out.push(withPrefix(node.text));
  }
}

function extract(node: SyntaxNode, out: ImportRef[]): void {
  if (node.type === 'mod_item') {
    // `mod foo { ... }` is inline; only `mod foo;` points at another file.
    const inline = node.namedChildren.some((child) => child.type === 'declaration_list');
    const name = node.childForFieldName('name');
    if (!inline && name) out.push({ spec: name.text, mod: true });
    return;
  }
  const argument = node.childForFieldName('argument');
  if (!argument) return;
  const paths: string[] = [];
  flattenUse(argument, '', paths);
  for (const spec of paths) out.push({ spec: spec.replace(/\s+/g, '') });
}

export const rustSpec: GrammarSpec = {
  branches: new Set([
    'if_expression',
    'while_expression',
    'for_expression',
    'loop_expression',
    'match_arm',
    '&&',
    '||',
  ]),
  functions: new Set(['function_item', 'closure_expression']),
  importNodes: new Set(['mod_item', 'use_declaration']),
  extract,
};
