const integer = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatNumber = (value: number) => integer.format(value);

/** 1234 → "1.2K". Used where space is tight. */
export const formatCompact = (value: number) =>
  value < 10_000 ? integer.format(value) : compact.format(value);

/** Formats unix seconds; an em dash for "never". */
export const formatDate = (seconds: number) => (seconds > 0 ? date.format(seconds * 1000) : '—');

/** Splits a path into its directory (with trailing slash) and file name. */
export function splitPath(path: string): { dir: string; name: string } {
  const cut = path.lastIndexOf('/');
  return cut === -1
    ? { dir: '', name: path }
    : { dir: path.slice(0, cut + 1), name: path.slice(cut + 1) };
}

export const plural = (count: number, word: string) =>
  `${formatNumber(count)} ${word}${count === 1 ? '' : 's'}`;
