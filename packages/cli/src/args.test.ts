import { describe, expect, it } from 'vitest';
import { DEFAULT_PORT, parseArgs, UsageError } from './args.js';

describe('parseArgs', () => {
  it('uses sensible defaults', () => {
    expect(parseArgs([])).toEqual({
      dir: '.',
      port: DEFAULT_PORT,
      open: true,
      history: true,
      json: null,
      help: false,
      version: false,
    });
  });

  it('reads the directory and flags in any order', () => {
    const options = parseArgs(['--no-open', '../repo', '-p', '5000', '--json', 'out.json', '--no-history']);
    expect(options).toMatchObject({ dir: '../repo', port: 5000, open: false, history: false, json: 'out.json' });
  });

  it('rejects unknown options, bad ports and extra arguments', () => {
    expect(() => parseArgs(['--nope'])).toThrow(UsageError);
    expect(() => parseArgs(['--port', 'abc'])).toThrow(UsageError);
    expect(() => parseArgs(['--port'])).toThrow(UsageError);
    expect(() => parseArgs(['a', 'b'])).toThrow(UsageError);
  });
});
