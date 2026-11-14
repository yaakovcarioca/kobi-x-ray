import type { FileNode, Language } from '@kobi-xray/core';

export type ColorMode = 'heat' | 'language' | 'complexity';

type Rgb = readonly [number, number, number];

const hex = (value: string): Rgb => {
  const n = parseInt(value.slice(1), 16);
  // Buildings are lit in linear space; convert from sRGB once.
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [linear((n >> 16) & 255), linear((n >> 8) & 255), linear(n & 255)];
};

/** Temperature ramp: slate when cold, through amber, to red when hot. */
export const HEAT_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#4a5a6c'],
  [0.18, '#66788a'],
  [0.42, '#d8b04a'],
  [0.68, '#ec7f31'],
  [1, '#e5383b'],
];

/** Complexity ramp: same slate, towards a cool cyan-white for dense logic. */
export const COMPLEXITY_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#4a5a6c'],
  [0.4, '#3f8fb0'],
  [0.75, '#6fd0d6'],
  [1, '#f1f7c4'],
];

export const LANGUAGE_COLORS: Record<Language, string> = {
  typescript: '#3b82d6',
  javascript: '#e3c94a',
  python: '#58a66d',
  go: '#35b8cf',
  rust: '#d98a5f',
  other: '#5d6978',
};

export const DIM: Rgb = hex('#1b222c');
export const GONE: Rgb = hex('#3a4450');

function compile(stops: ReadonlyArray<readonly [number, string]>) {
  const points = stops.map(([at, color]) => [at, hex(color)] as const);
  return (t: number, out: Float32Array, offset: number): void => {
    const x = t <= 0 ? 0 : t >= 1 ? 1 : t;
    let i = 1;
    while (i < points.length - 1 && points[i]![0] < x) i++;
    const [a, ca] = points[i - 1]!;
    const [b, cb] = points[i]!;
    const k = b === a ? 0 : (x - a) / (b - a);
    out[offset] = ca[0] + (cb[0] - ca[0]) * k;
    out[offset + 1] = ca[1] + (cb[1] - ca[1]) * k;
    out[offset + 2] = ca[2] + (cb[2] - ca[2]) * k;
  };
}

export const heatRamp = compile(HEAT_STOPS);
export const complexityRamp = compile(COMPLEXITY_STOPS);

const LANGUAGE_RGB = Object.fromEntries(
  Object.entries(LANGUAGE_COLORS).map(([language, color]) => [language, hex(color)]),
) as Record<Language, Rgb>;

export function languageColor(language: Language, out: Float32Array, offset: number): void {
  const [r, g, b] = LANGUAGE_RGB[language];
  out[offset] = r;
  out[offset + 1] = g;
  out[offset + 2] = b;
}

/** 0..1 complexity score: decision points per function-sized chunk of code. */
export function complexityScore(file: FileNode | undefined): number {
  if (!file || file.complexity <= 1) return 0;
  return Math.min(1, Math.log2(file.complexity) / 8);
}

export function setRgb(out: Float32Array, offset: number, color: Rgb): void {
  out[offset] = color[0];
  out[offset + 1] = color[1];
  out[offset + 2] = color[2];
}

/** CSS gradient string for a ramp, used by the legend. */
export function rampCss(stops: ReadonlyArray<readonly [number, string]>): string {
  return `linear-gradient(90deg, ${stops.map(([at, color]) => `${color} ${at * 100}%`).join(', ')})`;
}
