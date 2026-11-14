import {
  detectLanguage,
  indexPaths,
  layoutCity,
  TimelineReplay,
  type CityLayout,
  type FileNode,
  type Language,
  type Snapshot,
} from '@kobi-xray/core';

export const ACTIVITY_BUCKETS = 240;
/** Height of one district platform step. */
export const PLATFORM = 0.07;

export interface CityModel {
  snapshot: Snapshot;
  files: FileNode[];
  /** Every path in the timeline; one building instance per entry. */
  paths: string[];
  layout: CityLayout;
  /** Path index → file id at HEAD, or -1 for files that no longer exist. */
  fileOfPath: Int32Array;
  /** File id → path index. */
  pathOfFile: Int32Array;
  /** Language per path, including files that only exist in history. */
  languages: Language[];
  /** Fraction of its lot a building covers (grows with fan-in). */
  footprint: Float32Array;
  /** Height of the ground under each building (nested districts stack up). */
  baseY: Float32Array;
  replay: TimelineReplay;
  commitCount: number;
  /** Lines changed per timeline bucket, for the activity strip. */
  activity: Float32Array;
  /** Share of each bucket that came from bug-fix commits (0..1). */
  fixShare: Float32Array;
}

/** Building height for a line count. Sub-linear so giants do not dwarf the city. */
export function heightOf(lines: number): number {
  return lines > 0 ? Math.max(0.1, 0.034 * Math.pow(lines, 0.75)) : 0;
}

export function buildCityModel(snapshot: Snapshot): CityModel {
  const { files, timeline } = snapshot;
  const paths = timeline.paths;
  const index = indexPaths(timeline);

  const fileOfPath = new Int32Array(paths.length).fill(-1);
  const pathOfFile = new Int32Array(files.length).fill(-1);
  for (const file of files) {
    const path = index.get(file.path);
    if (path === undefined) continue;
    fileOfPath[path] = file.id;
    pathOfFile[file.id] = path;
  }

  const footprint = new Float32Array(paths.length);
  const baseY = new Float32Array(paths.length);
  for (let i = 0; i < paths.length; i++) {
    const file = files[fileOfPath[i]!];
    // 31 dependents or more fill the lot; isolated files stay slim.
    const reach = file ? Math.min(1, Math.log2(1 + file.importedBy.length) / 5) : 0;
    footprint[i] = 0.36 + 0.5 * reach;
    let depth = 0;
    const path = paths[i]!;
    for (let c = 0; c < path.length; c++) if (path.charCodeAt(c) === 47) depth++;
    baseY[i] = depth * PLATFORM;
  }

  const commitCount = timeline.commits.length;
  const buckets = Math.max(1, Math.min(ACTIVITY_BUCKETS, commitCount));
  const activity = new Float32Array(buckets);
  const fixes = new Float32Array(buckets);
  timeline.commits.forEach((commit, c) => {
    const bucket = Math.min(buckets - 1, Math.floor((c / commitCount) * buckets));
    let changed = 0;
    for (let i = 0; i < commit.changes.length; i += 3) {
      changed += commit.changes[i + 1]! + commit.changes[i + 2]!;
    }
    activity[bucket]! += changed;
    if (commit.fix) fixes[bucket]! += changed;
  });
  const fixShare = fixes.map((value, i) => (activity[i]! > 0 ? value / activity[i]! : 0));

  return {
    snapshot,
    files,
    paths,
    layout: layoutCity(paths),
    languages: paths.map(detectLanguage),
    fileOfPath,
    pathOfFile,
    footprint,
    baseY,
    replay: new TimelineReplay(timeline),
    commitCount,
    activity,
    fixShare,
  };
}
