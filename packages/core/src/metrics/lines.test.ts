import { describe, expect, it } from 'vitest';
import { countLines, looksBinary } from './lines.js';

describe('countLines', () => {
  it('handles empty content', () => {
    expect(countLines('')).toEqual({ lines: 0, sloc: 0 });
  });

  it('counts blank lines separately from source lines', () => {
    expect(countLines('a\n\n  \nb\n')).toEqual({ lines: 4, sloc: 2 });
  });

  it('counts a final line without newline', () => {
    expect(countLines('a\nb')).toEqual({ lines: 2, sloc: 2 });
  });

  it('treats CRLF like LF', () => {
    expect(countLines('a\r\n\r\nb\r\n')).toEqual({ lines: 3, sloc: 2 });
  });
});

describe('looksBinary', () => {
  it('detects NUL bytes', () => {
    expect(looksBinary(new Uint8Array([104, 0, 105]))).toBe(true);
    expect(looksBinary(new TextEncoder().encode('hello'))).toBe(false);
  });
});
