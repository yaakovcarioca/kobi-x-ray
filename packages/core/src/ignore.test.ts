import { describe, expect, it } from 'vitest';
import { shouldIgnore } from './ignore.js';

describe('shouldIgnore', () => {
  it('skips dependency and build directories at any depth', () => {
    expect(shouldIgnore('node_modules/react/index.js')).toBe(true);
    expect(shouldIgnore('apps/web/dist/main.js')).toBe(true);
    expect(shouldIgnore('crates/a/target/debug/x.rs')).toBe(true);
  });

  it('skips lockfiles, binaries and minified bundles', () => {
    expect(shouldIgnore('package-lock.json')).toBe(true);
    expect(shouldIgnore('public/logo.PNG')).toBe(true);
    expect(shouldIgnore('static/app.min.js')).toBe(true);
  });

  it('keeps regular source files', () => {
    expect(shouldIgnore('src/build.ts')).toBe(false);
    expect(shouldIgnore('dist.ts')).toBe(false);
    expect(shouldIgnore('docs/guide.md')).toBe(false);
  });
});
