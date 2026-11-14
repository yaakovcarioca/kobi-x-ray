import { describe, expect, it } from 'vitest';
import { parseJsonc } from './jsonc.js';
import { buildRepoIndex } from './repoIndex.js';
import { resolveImport } from './resolve.js';

describe('parseJsonc', () => {
  it('tolerates comments and trailing commas', () => {
    const text = `{
      // line comment
      "a": "http://x/y", /* block */
      "b": [1, 2,],
    }`;
    expect(parseJsonc(text)).toEqual({ a: 'http://x/y', b: [1, 2] });
  });

  it('returns null for garbage', () => {
    expect(parseJsonc('{ nope')).toBeNull();
  });
});

describe('javascript resolution', () => {
  const index = buildRepoIndex(
    [
      'apps/web/src/main.tsx',
      'apps/web/src/lib/api.ts',
      'apps/web/src/components/index.ts',
      'apps/web/src/styles.css',
      'packages/core/src/index.ts',
      'packages/core/src/graph.ts',
    ],
    new Map([
      ['apps/web/tsconfig.json', '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }'],
      ['packages/core/package.json', '{ "name": "@acme/core" }'],
    ]),
  );
  const resolve = (spec: string, from = 'apps/web/src/main.tsx') =>
    resolveImport(index, from, 'typescript', { spec });

  it('resolves relative paths, extensions and index files', () => {
    expect(resolve('./lib/api').internal).toEqual(['apps/web/src/lib/api.ts']);
    expect(resolve('./components').internal).toEqual(['apps/web/src/components/index.ts']);
    expect(resolve('./styles.css').internal).toEqual(['apps/web/src/styles.css']);
  });

  it('maps emitted .js specifiers back to .ts sources', () => {
    expect(resolve('./graph.js', 'packages/core/src/index.ts').internal).toEqual([
      'packages/core/src/graph.ts',
    ]);
  });

  it('follows tsconfig path aliases', () => {
    expect(resolve('@/lib/api').internal).toEqual(['apps/web/src/lib/api.ts']);
  });

  it('links workspace packages by name', () => {
    expect(resolve('@acme/core').internal).toEqual(['packages/core/src/index.ts']);
    expect(resolve('@acme/core/graph').internal).toEqual(['packages/core/src/graph.ts']);
  });

  it('reports third-party packages as external', () => {
    expect(resolve('react-dom/client')).toEqual({ internal: [], external: 'react-dom' });
    expect(resolve('@scope/pkg/deep')).toEqual({ internal: [], external: '@scope/pkg' });
    expect(resolve('node:fs')).toEqual({ internal: [], external: 'node:fs' });
  });
});

describe('python resolution', () => {
  const index = buildRepoIndex(
    [
      'app/__init__.py',
      'app/main.py',
      'app/models/__init__.py',
      'app/models/user.py',
      'tools/json.py',
    ],
    new Map(),
  );
  const resolve = (ref: { spec: string; level?: number; names?: string[] }, from = 'app/main.py') =>
    resolveImport(index, from, 'python', ref);

  it('resolves absolute modules and packages', () => {
    expect(resolve({ spec: 'app.models.user' }).internal).toEqual(['app/models/user.py']);
    expect(resolve({ spec: 'app.models' }).internal).toEqual(['app/models/__init__.py']);
  });

  it('treats from-import names as submodules when they exist', () => {
    expect(resolve({ spec: 'app.models', names: ['user'] }).internal).toEqual([
      'app/models/user.py',
    ]);
    expect(resolve({ spec: 'app.models', names: ['Base'] }).internal).toEqual([
      'app/models/__init__.py',
    ]);
  });

  it('resolves relative imports', () => {
    expect(resolve({ spec: '', level: 1, names: ['models'] }).internal).toEqual([
      'app/models/__init__.py',
    ]);
    expect(resolve({ spec: 'main', level: 2 }, 'app/models/user.py').internal).toEqual([
      'app/main.py',
    ]);
  });

  it('does not confuse stdlib modules with unrelated local files', () => {
    expect(resolve({ spec: 'json' })).toEqual({ internal: [], external: 'json' });
  });
});

describe('go resolution', () => {
  const index = buildRepoIndex(
    [
      'go.mod',
      'main.go',
      'internal/store/store.go',
      'internal/store/cache.go',
      'internal/store/store_test.go',
    ],
    new Map([['go.mod', 'module example.com/app\n\ngo 1.22\n']]),
  );

  it('fans out to the files of the imported package', () => {
    const result = resolveImport(index, 'main.go', 'go', {
      spec: 'example.com/app/internal/store',
    });
    expect(result.internal).toEqual(['internal/store/store.go', 'internal/store/cache.go']);
  });

  it('keeps other imports external', () => {
    expect(resolveImport(index, 'main.go', 'go', { spec: 'fmt' })).toEqual({
      internal: [],
      external: 'fmt',
    });
  });
});

describe('rust resolution', () => {
  const index = buildRepoIndex(
    [
      'Cargo.toml',
      'src/main.rs',
      'src/parser.rs',
      'src/parser/lexer.rs',
      'src/ast/mod.rs',
      'src/ast/node.rs',
    ],
    new Map([['Cargo.toml', '[package]\nname = "my-app"\n']]),
  );
  const resolve = (spec: string, from: string, mod = false) =>
    resolveImport(index, from, 'rust', { spec, mod }).internal;

  it('resolves mod declarations to sibling or nested files', () => {
    expect(resolve('parser', 'src/main.rs', true)).toEqual(['src/parser.rs']);
    expect(resolve('ast', 'src/main.rs', true)).toEqual(['src/ast/mod.rs']);
    expect(resolve('lexer', 'src/parser.rs', true)).toEqual(['src/parser/lexer.rs']);
  });

  it('resolves crate, super and own-crate paths to the deepest file', () => {
    expect(resolve('crate::ast::node::Node', 'src/parser.rs')).toEqual(['src/ast/node.rs']);
    expect(resolve('super::node::Node', 'src/ast/mod.rs')).toEqual([]);
    expect(resolve('super::ast::Node', 'src/parser.rs')).toEqual(['src/ast/mod.rs']);
    expect(resolve('my_app::parser::parse', 'src/main.rs')).toEqual(['src/parser.rs']);
  });

  it('falls back to the crate entry for root-level items', () => {
    expect(resolve('crate::Config', 'src/parser.rs')).toEqual(['src/main.rs']);
  });

  it('reports unknown crates as external', () => {
    expect(resolveImport(index, 'src/main.rs', 'rust', { spec: 'serde::Serialize' })).toEqual({
      internal: [],
      external: 'serde',
    });
  });
});
