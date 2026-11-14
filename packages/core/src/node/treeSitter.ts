import { createRequire } from 'node:module';
import Parser from 'web-tree-sitter';
import { analyzeTree } from '../analyze/index.js';
import type { FileAnalysis } from '../types.js';

const require = createRequire(import.meta.url);

let runtime: Promise<void> | null = null;
const parsers = new Map<string, Promise<Parser>>();

async function createParser(grammar: string): Promise<Parser> {
  runtime ??= Parser.init();
  await runtime;
  const wasm = require.resolve(`tree-sitter-wasms/out/tree-sitter-${grammar}.wasm`);
  const language = await Parser.Language.load(wasm);
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
}

/** Lazily loads (and caches) the WASM parser for a grammar. */
export function getParser(grammar: string): Promise<Parser> {
  let parser = parsers.get(grammar);
  if (!parser) {
    parser = createParser(grammar);
    parsers.set(grammar, parser);
  }
  return parser;
}

/** Parses source text and runs the analysis pass, freeing the tree afterwards. */
export async function analyzeSource(content: string, grammar: string): Promise<FileAnalysis> {
  const parser = await getParser(grammar);
  const tree = parser.parse(content);
  try {
    return analyzeTree(tree.rootNode, grammar);
  } finally {
    tree.delete();
  }
}
