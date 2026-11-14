import type Parser from 'web-tree-sitter';
import type { ImportRef } from '../types.js';

export type SyntaxNode = Parser.SyntaxNode;

/** Everything the generic tree walker needs to know about one grammar. */
export interface GrammarSpec {
  /** Node types (named or anonymous tokens) that add one decision point. */
  branches: ReadonlySet<string>;
  /** Node types that declare a function-like scope. */
  functions: ReadonlySet<string>;
  /** Node types that may carry an import; `extract` is called for each. */
  importNodes: ReadonlySet<string>;
  extract(node: SyntaxNode, out: ImportRef[]): void;
}

/** Strips the surrounding quotes of a string literal node. */
export function unquote(text: string): string {
  if (text.length >= 2) {
    const first = text[0];
    const last = text[text.length - 1];
    if ((first === '"' || first === "'" || first === '`') && first === last) {
      return text.slice(1, -1);
    }
  }
  return text;
}
