export interface LineCount {
  /** Total lines, counted the way `git diff --numstat` does. */
  lines: number;
  /** Lines containing at least one non-whitespace character. */
  sloc: number;
}

export function countLines(content: string): LineCount {
  if (content.length === 0) return { lines: 0, sloc: 0 };
  let lines = 0;
  let sloc = 0;
  let hasInk = false;
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code === 10) {
      lines++;
      if (hasInk) sloc++;
      hasInk = false;
    } else if (code !== 32 && code !== 9 && code !== 13) {
      hasInk = true;
    }
  }
  // Last line without a trailing newline still counts.
  if (content.charCodeAt(content.length - 1) !== 10) {
    lines++;
    if (hasInk) sloc++;
  }
  return { lines, sloc };
}

/** Heuristic binary check: a NUL byte in the first few kilobytes. */
export function looksBinary(bytes: Uint8Array): boolean {
  const end = Math.min(bytes.length, 8000);
  for (let i = 0; i < end; i++) {
    if (bytes[i] === 0) return true;
  }
  return false;
}
