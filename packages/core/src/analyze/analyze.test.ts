import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../node/treeSitter.js';

const specs = async (source: string, grammar: string) =>
  (await analyzeSource(source, grammar)).imports.map((ref) => ref.spec);

describe('javascript / typescript', () => {
  it('collects static, re-export, dynamic and require imports', async () => {
    const source = `
      import a from './a';
      import type { B } from "../b";
      export * from './c';
      export { d } from './d';
      const e = await import('./e');
      const f = require('f-pkg');
      const notAnImport = load('./nope');
    `;
    expect(await specs(source, 'typescript')).toEqual([
      './a',
      '../b',
      './c',
      './d',
      './e',
      'f-pkg',
    ]);
  });

  it('parses JSX with the tsx grammar', async () => {
    const result = await analyzeSource(
      `import React from 'react';\nexport const A = () => <div />;`,
      'tsx',
    );
    expect(result.imports).toEqual([{ spec: 'react' }]);
    expect(result.functions).toBe(1);
  });

  it('estimates cyclomatic complexity', async () => {
    const source = `
      function f(x) {
        if (x > 1 && x < 5) return 1;
        for (const y of x) { while (y) {} }
        return x ? 1 : 2;
      }
    `;
    const result = await analyzeSource(source, 'javascript');
    // 1 + if + && + for + while + ternary
    expect(result.complexity).toBe(6);
    expect(result.functions).toBe(1);
  });
});

describe('python', () => {
  it('collects absolute and relative imports', async () => {
    const result = await analyzeSource(
      [
        'import os',
        'import a.b as ab',
        'from a.b import c, d as e',
        'from . import x',
        'from ..pkg import y',
      ].join('\n'),
      'python',
    );
    expect(result.imports).toEqual([
      { spec: 'os', level: 0 },
      { spec: 'a.b', level: 0 },
      { spec: 'a.b', level: 0, names: ['c', 'd'] },
      { spec: '', level: 1, names: ['x'] },
      { spec: 'pkg', level: 2, names: ['y'] },
    ]);
  });

  it('counts branches', async () => {
    const result = await analyzeSource(
      'def f(x):\n  if x and x > 1:\n    return 1\n  elif x:\n    return 2\n',
      'python',
    );
    // 1 + if + and + elif
    expect(result.complexity).toBe(4);
  });
});

describe('go', () => {
  it('collects single and grouped imports', async () => {
    const source =
      'package main\nimport "fmt"\nimport (\n  x "example.com/m/pkg"\n  _ "embed"\n)\n';
    expect(await specs(source, 'go')).toEqual(['fmt', 'example.com/m/pkg', 'embed']);
  });
});

describe('rust', () => {
  it('collects mod declarations and flattens use trees', async () => {
    const source = `
      mod parser;
      mod inline { fn f() {} }
      use crate::a::b;
      use super::{c, d::e as f, g::*};
      use std::collections::{self, HashMap};
    `;
    const result = await analyzeSource(source, 'rust');
    expect(result.imports).toEqual([
      { spec: 'parser', mod: true },
      { spec: 'crate::a::b' },
      { spec: 'super::c' },
      { spec: 'super::d::e' },
      { spec: 'super::g' },
      { spec: 'std::collections' },
      { spec: 'std::collections::HashMap' },
    ]);
  });
});

describe('unknown grammar', () => {
  it('fails loudly instead of returning empty analysis', async () => {
    await expect(analyzeSource('x', 'cobol')).rejects.toThrow();
  });
});
