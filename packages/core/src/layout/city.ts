import { squarify } from './squarify.js';

export interface District {
  /** Directory path (never the repository root). */
  path: string;
  /** Nesting level, 1 for top-level directories. */
  depth: number;
  /** Centre of the district on the ground plane. */
  x: number;
  z: number;
  /** Extent along x and z. */
  w: number;
  d: number;
  /** Number of files anywhere below this directory. */
  files: number;
}

export interface CityLayout {
  /** Four floats per path: centre x, centre z, width, depth of its lot. */
  lots: Float32Array;
  /** Parents before children. */
  districts: District[];
  /** Overall footprint; the city is centred on the origin. */
  width: number;
  depth: number;
}

export interface LayoutOptions {
  /** Margin between a district border and its content, in lot units. */
  padding?: number;
}

interface Dir {
  path: string;
  depth: number;
  dirs: Map<string, Dir>;
  files: number[];
  weight: number;
  count: number;
}

function buildTree(paths: readonly string[]): Dir {
  const root: Dir = { path: '', depth: 0, dirs: new Map(), files: [], weight: 0, count: 0 };
  for (let i = 0; i < paths.length; i++) {
    const segments = paths[i]!.split('/');
    let dir = root;
    for (let s = 0; s < segments.length - 1; s++) {
      const name = segments[s]!;
      let next = dir.dirs.get(name);
      if (!next) {
        next = {
          path: dir.path === '' ? name : `${dir.path}/${name}`,
          depth: dir.depth + 1,
          dirs: new Map(),
          files: [],
          weight: 0,
          count: 0,
        };
        dir.dirs.set(name, next);
      }
      dir = next;
    }
    dir.files.push(i);
  }
  return root;
}

/**
 * Lays every path out on a nested treemap: directories become districts,
 * files become equally sized lots. The layout only depends on the set of
 * paths, so it stays stable while the timeline is scrubbed.
 */
export function layoutCity(paths: readonly string[], options: LayoutOptions = {}): CityLayout {
  const padding = options.padding ?? 0.35;
  const lots = new Float32Array(paths.length * 4);
  const districts: District[] = [];
  const root = buildTree(paths);

  // Each file lot has unit area; a directory needs room for its content plus
  // the padding ring around it.
  const measure = (dir: Dir): void => {
    let content = dir.files.length;
    let count = dir.files.length;
    for (const child of dir.dirs.values()) {
      measure(child);
      content += child.weight;
      count += child.count;
    }
    dir.count = count;
    const side = Math.sqrt(content);
    dir.weight = dir.depth === 0 ? content : (side + 2 * padding) ** 2;
  };
  measure(root);

  const place = (dir: Dir, x: number, y: number, w: number, h: number): void => {
    if (dir.depth > 0) {
      districts.push({ path: dir.path, depth: dir.depth, x: x + w / 2, z: y + h / 2, w, d: h, files: dir.count });
      const pad = Math.min(padding, w * 0.2, h * 0.2);
      x += pad;
      y += pad;
      w -= 2 * pad;
      h -= 2 * pad;
    }

    type Item = { weight: number; name: string; dir?: Dir; file?: number };
    const items: Item[] = [];
    for (const [name, child] of dir.dirs) items.push({ weight: child.weight, name, dir: child });
    for (const file of dir.files) items.push({ weight: 1, name: paths[file]!, file });
    items.sort((a, b) => b.weight - a.weight || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    squarify(
      items.map((item) => item.weight),
      x,
      y,
      w,
      h,
      (index, rx, ry, rw, rh) => {
        const item = items[index]!;
        if (item.dir) {
          place(item.dir, rx, ry, rw, rh);
        } else {
          const offset = item.file! * 4;
          lots[offset] = rx + rw / 2;
          lots[offset + 1] = ry + rh / 2;
          lots[offset + 2] = rw;
          lots[offset + 3] = rh;
        }
      },
    );
  };

  const side = Math.sqrt(root.weight);
  place(root, -side / 2, -side / 2, side, side);
  return { lots, districts, width: side, depth: side };
}
