import type { FileAnalysis, ImportRef } from '../types.js';
import { goSpec } from './go.js';
import { javascriptSpec } from './javascript.js';
import { pythonSpec } from './python.js';
import { rustSpec } from './rust.js';
import type { GrammarSpec, SyntaxNode } from './spec.js';

const SPECS: Record<string, GrammarSpec> = {
  javascript: javascriptSpec,
  typescript: javascriptSpec,
  tsx: javascriptSpec,
  python: pythonSpec,
  go: goSpec,
  rust: rustSpec,
};

/**
 * Single pass over a syntax tree collecting imports, function count and a
 * cyclomatic complexity estimate (1 + number of decision points).
 */
export function analyzeTree(root: SyntaxNode, grammar: string): FileAnalysis {
  const spec = SPECS[grammar];
  if (!spec) return { imports: [], complexity: 0, functions: 0 };

  const imports: ImportRef[] = [];
  let complexity = 1;
  let functions = 0;

  const cursor = root.walk();
  try {
    for (;;) {
      const type = cursor.nodeType;
      if (spec.branches.has(type)) complexity++;
      if (spec.functions.has(type)) functions++;
      if (spec.importNodes.has(type)) spec.extract(cursor.currentNode, imports);

      if (cursor.gotoFirstChild()) continue;
      let moved = false;
      while (!moved) {
        if (cursor.gotoNextSibling()) moved = true;
        else if (!cursor.gotoParent()) return { imports, complexity, functions };
      }
    }
  } finally {
    cursor.delete();
  }
}
