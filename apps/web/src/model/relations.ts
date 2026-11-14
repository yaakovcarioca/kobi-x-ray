import { blastRadius } from '@kobi-xray/core';
import type { CityModel } from './cityModel';

/** How a building relates to the current selection. */
export const Role = {
  None: 0,
  Self: 1,
  Import: 2,
  Dependent: 3,
  /** Depends on the selection through at least one intermediate file. */
  Transitive: 4,
} as const;

export interface Relations {
  /** Role per path index. */
  roles: Uint8Array;
  /** Path indices the selection imports. */
  imports: number[];
  /** Path indices that import the selection directly. */
  dependents: number[];
  /** Total number of files in the blast radius (direct + transitive). */
  blast: number;
  /** Number of affected files per hop distance (index 0 = direct). */
  blastByDepth: number[];
}

const toPaths = (model: CityModel, ids: readonly number[]) =>
  ids.map((id) => model.pathOfFile[id]!).filter((path) => path >= 0);

/** Relations for a selected building, or `null` when nothing is selected. */
export function relationsOfFile(model: CityModel, path: number): Relations {
  const roles = new Uint8Array(model.paths.length);
  roles[path] = Role.Self;
  const file = model.files[model.fileOfPath[path]!];
  if (!file) return { roles, imports: [], dependents: [], blast: 0, blastByDepth: [] };

  const blast = blastRadius(model.files, file.id);
  const blastByDepth: number[] = [];
  blast.ids.forEach((id, i) => {
    const depth = blast.depths[i]!;
    blastByDepth[depth - 1] = (blastByDepth[depth - 1] ?? 0) + 1;
    const target = model.pathOfFile[id]!;
    if (target >= 0) roles[target] = depth === 1 ? Role.Dependent : Role.Transitive;
  });

  const imports = toPaths(model, file.imports);
  // A file can be both imported by and an importer of the selection (cycle);
  // the dependent role wins because it is the one that can break.
  for (const target of imports) if (roles[target] === Role.None) roles[target] = Role.Import;

  return {
    roles,
    imports,
    dependents: toPaths(model, file.importedBy),
    blast: blast.ids.length,
    blastByDepth,
  };
}

/** Marks every building inside a directory as selected. */
export function relationsOfDistrict(model: CityModel, dir: string): Relations {
  const roles = new Uint8Array(model.paths.length);
  const prefix = `${dir}/`;
  model.paths.forEach((path, i) => {
    if (path.startsWith(prefix)) roles[i] = Role.Self;
  });
  return { roles, imports: [], dependents: [], blast: 0, blastByDepth: [] };
}
