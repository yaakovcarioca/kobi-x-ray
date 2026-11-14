export type PlaceRect = (item: number, x: number, y: number, w: number, h: number) => void;

/**
 * Squarified treemap (Bruls, Huizing & van Wijk). `weights` must be sorted in
 * descending order; `place` receives the index of each item and its rectangle.
 */
export function squarify(
  weights: ArrayLike<number>,
  x: number,
  y: number,
  w: number,
  h: number,
  place: PlaceRect,
): void {
  const n = weights.length;
  let total = 0;
  for (let i = 0; i < n; i++) total += weights[i]!;
  if (n === 0 || total <= 0 || w <= 0 || h <= 0) return;

  let start = 0;
  while (start < n) {
    const short = Math.min(w, h);
    const scale = (w * h) / total;
    const shortSq = short * short;

    // Worst aspect ratio of a row with the given sum, largest and smallest area.
    const worst = (sum: number, max: number, min: number) => {
      const area = sum * scale;
      const areaSq = area * area;
      return Math.max((shortSq * max * scale) / areaSq, areaSq / (shortSq * min * scale));
    };

    const max = weights[start]!;
    let sum = max;
    let end = start + 1;
    let ratio = worst(sum, max, max);
    while (end < n) {
      const next = weights[end]!;
      const candidate = worst(sum + next, max, next);
      if (candidate > ratio) break;
      sum += next;
      ratio = candidate;
      end++;
    }

    const thickness = (sum * scale) / short;
    if (w >= h) {
      // Row is a vertical strip on the left edge.
      let cursor = y;
      for (let i = start; i < end; i++) {
        const length = (weights[i]! * scale) / thickness;
        place(i, x, cursor, thickness, length);
        cursor += length;
      }
      x += thickness;
      w -= thickness;
    } else {
      // Row is a horizontal strip on the top edge.
      let cursor = x;
      for (let i = start; i < end; i++) {
        const length = (weights[i]! * scale) / thickness;
        place(i, cursor, y, length, thickness);
        cursor += length;
      }
      y += thickness;
      h -= thickness;
    }
    total -= sum;
    start = end;
  }
}
