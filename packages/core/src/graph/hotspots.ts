import type { FileNode } from '../types.js';

export interface Hotspot {
  id: number;
  /** Unbounded risk score; only meaningful for ranking. */
  risk: number;
  heat: number;
}

/**
 * Risk of a file: how hot it is, scaled by how complex it is and how many
 * files depend on it. A cold file is never a hotspot, however large.
 */
export function riskScore(file: FileNode, heat: number): number {
  const size = Math.log2(2 + (file.complexity > 0 ? file.complexity : file.sloc / 10));
  const reach = Math.log2(2 + file.importedBy.length);
  return heat * size * reach;
}

/** Ranks files by risk, hottest first. `heatOf` returns 0..1 for a file id. */
export function rankHotspots(
  files: readonly FileNode[],
  heatOf: (id: number) => number,
  limit = 10,
): Hotspot[] {
  const ranked: Hotspot[] = [];
  for (const file of files) {
    const heat = heatOf(file.id);
    if (heat <= 0) continue;
    ranked.push({ id: file.id, heat, risk: riskScore(file, heat) });
  }
  ranked.sort((a, b) => b.risk - a.risk || a.id - b.id);
  return ranked.slice(0, limit);
}
