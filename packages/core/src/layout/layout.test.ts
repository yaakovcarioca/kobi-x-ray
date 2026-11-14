import { describe, expect, it } from 'vitest';
import { layoutCity } from './city.js';
import { squarify } from './squarify.js';

describe('squarify', () => {
  it('fills the rectangle with areas proportional to weights', () => {
    const weights = [6, 6, 4, 3, 2, 2, 1];
    const rects: Array<{ w: number; h: number; x: number; y: number }> = [];
    squarify(weights, 0, 0, 6, 4, (i, x, y, w, h) => {
      rects[i] = { x, y, w, h };
    });
    expect(rects).toHaveLength(7);
    rects.forEach((rect, i) => expect(rect.w * rect.h).toBeCloseTo(weights[i]!, 6));
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(-1e-9);
      expect(rect.y).toBeGreaterThanOrEqual(-1e-9);
      expect(rect.x + rect.w).toBeLessThanOrEqual(6 + 1e-9);
      expect(rect.y + rect.h).toBeLessThanOrEqual(4 + 1e-9);
    }
  });

  it('keeps cells close to square', () => {
    const ratios: number[] = [];
    squarify(new Array(16).fill(1), 0, 0, 4, 4, (_i, _x, _y, w, h) =>
      ratios.push(Math.max(w / h, h / w)),
    );
    expect(Math.max(...ratios)).toBeLessThan(1.5);
  });

  it('ignores empty input', () => {
    let calls = 0;
    squarify([], 0, 0, 1, 1, () => calls++);
    expect(calls).toBe(0);
  });
});

describe('layoutCity', () => {
  const paths = [
    'README.md',
    'src/a.ts',
    'src/b.ts',
    'src/ui/x.tsx',
    'src/ui/y.tsx',
    'test/a.test.ts',
  ];
  const layout = layoutCity(paths);
  const lot = (i: number) => ({
    x: layout.lots[i * 4]!,
    z: layout.lots[i * 4 + 1]!,
    w: layout.lots[i * 4 + 2]!,
    d: layout.lots[i * 4 + 3]!,
  });

  it('gives every file a lot with positive area', () => {
    for (let i = 0; i < paths.length; i++) {
      expect(lot(i).w).toBeGreaterThan(0);
      expect(lot(i).d).toBeGreaterThan(0);
    }
  });

  it('lists districts parents first with file counts', () => {
    expect(layout.districts.map((d) => d.path)).toEqual(['src', 'src/ui', 'test']);
    expect(layout.districts.find((d) => d.path === 'src')).toMatchObject({ depth: 1, files: 4 });
    expect(layout.districts.find((d) => d.path === 'src/ui')).toMatchObject({ depth: 2, files: 2 });
  });

  it('keeps files inside their district', () => {
    const ui = layout.districts.find((d) => d.path === 'src/ui')!;
    for (const i of [3, 4]) {
      const { x, z } = lot(i);
      expect(Math.abs(x - ui.x)).toBeLessThanOrEqual(ui.w / 2);
      expect(Math.abs(z - ui.z)).toBeLessThanOrEqual(ui.d / 2);
    }
  });

  it('does not overlap lots', () => {
    for (let a = 0; a < paths.length; a++) {
      for (let b = a + 1; b < paths.length; b++) {
        const A = lot(a);
        const B = lot(b);
        const apartX = Math.abs(A.x - B.x) >= (A.w + B.w) / 2 - 1e-4;
        const apartZ = Math.abs(A.z - B.z) >= (A.d + B.d) / 2 - 1e-4;
        expect(apartX || apartZ).toBe(true);
      }
    }
  });

  it('is deterministic and centred on the origin', () => {
    expect(Array.from(layoutCity(paths).lots)).toEqual(Array.from(layout.lots));
    expect(layout.width).toBeCloseTo(layout.depth);
    for (let i = 0; i < paths.length; i++) {
      expect(Math.abs(lot(i).x)).toBeLessThanOrEqual(layout.width / 2);
    }
  });
});
