import { blastRadius } from '../graph/blast.js';
import { fileHistory, indexPaths } from '../timeline/history.js';
import type { FileNode, Snapshot } from '../types.js';

export interface ContextOptions {
  /** Maximum entries per list before it is truncated. */
  maxList?: number;
}

const day = (seconds: number) =>
  seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : 'n/a';

function describe(file: FileNode): string {
  const parts = [`${file.lines} lines`];
  if (file.complexity > 0) parts.push(`complexity ${file.complexity}`);
  parts.push(`fan-in ${file.importedBy.length}`);
  return `\`${file.path}\` — ${parts.join(', ')}`;
}

function list(items: string[], max: number, empty: string): string {
  if (items.length === 0) return `_${empty}_`;
  const shown = items.slice(0, max).map((item) => `- ${item}`);
  if (items.length > max) shown.push(`- …and ${items.length - max} more`);
  return shown.join('\n');
}

function header(snapshot: Snapshot, title: string): string[] {
  const { repo } = snapshot;
  const ref = [repo.branch, repo.head].filter(Boolean).join(' @ ');
  return [
    `# X-Ray context: \`${title}\``,
    '',
    `Repository: **${repo.name}**${ref ? ` (${ref})` : ''}`,
    '',
  ];
}

/**
 * Markdown briefing for one file: what it is, what it touches and what breaks
 * if it changes. Meant to be pasted into an AI coding agent before a refactor.
 */
export function fileContextMarkdown(
  snapshot: Snapshot,
  fileId: number,
  options: ContextOptions = {},
): string {
  const max = options.maxList ?? 40;
  const { files, timeline } = snapshot;
  const file = files[fileId];
  if (!file) return '';

  const out = header(snapshot, file.path);
  out.push('## Summary', '');
  out.push(`- Language: ${file.language}`);
  out.push(`- Size: ${file.lines} lines (${file.sloc} non-blank), ${file.functions} functions`);
  if (file.complexity > 0) out.push(`- Cyclomatic complexity (whole file): ${file.complexity}`);
  out.push(`- Fan-in: ${file.importedBy.length} files import it`);
  out.push(`- Fan-out: ${file.imports.length} internal imports`);

  const pathIndex = indexPaths(timeline).get(file.path);
  if (pathIndex !== undefined) {
    const history = fileHistory(timeline, pathIndex);
    if (history.commits.length > 0) {
      out.push(
        `- Churn: ${history.commits.length} commits (${history.fixes} bug fixes), ` +
          `+${history.added}/-${history.deleted} lines, first seen ${day(history.firstSeen)}, ` +
          `last changed ${day(history.lastTouch)}`,
      );
      const owners = history.authors.slice(0, 3).map((a) => `${a.name} (${a.commits})`);
      out.push(`- Main authors: ${owners.join(', ')}`);
    }
  }

  out.push('', '## Imports (what this file depends on)', '');
  out.push(
    list(
      file.imports.map((id) => describe(files[id]!)),
      max,
      'No internal imports.',
    ),
  );

  out.push('', '## Imported by (direct dependents)', '');
  out.push(
    list(
      file.importedBy.map((id) => describe(files[id]!)),
      max,
      'Nothing imports this file.',
    ),
  );

  const blast = blastRadius(files, fileId);
  out.push('', '## Blast radius', '');
  if (blast.ids.length === 0) {
    out.push('Changing this file cannot break any other file through imports.');
  } else {
    out.push(
      `${blast.ids.length} files depend on this file directly or transitively ` +
        `(${blast.direct} direct, up to ${blast.maxDepth} hops away).`,
      '',
    );
    const transitive = blast.ids
      .map((id, i) => ({ id, depth: blast.depths[i]! }))
      .filter((entry) => entry.depth > 1)
      .map((entry) => `\`${files[entry.id]!.path}\` (${entry.depth} hops)`);
    out.push(list(transitive, max, 'No transitive dependents beyond the direct ones.'));
  }

  if (file.external.length > 0) {
    out.push('', '## External dependencies', '');
    out.push(file.external.map((name) => `\`${name}\``).join(', '));
  }

  out.push(
    '',
    '## Notes for the agent',
    '',
    '- Read the direct dependents before changing any exported signature.',
    '- Keep the public surface stable unless every dependent above is updated in the same change.',
    '',
  );
  return out.join('\n');
}

/**
 * Markdown briefing for a directory: its files, and the imports crossing its
 * boundary in both directions.
 */
export function districtContextMarkdown(
  snapshot: Snapshot,
  dir: string,
  options: ContextOptions = {},
): string {
  const max = options.maxList ?? 40;
  const { files } = snapshot;
  const prefix = dir === '' ? '' : `${dir}/`;
  const inside = files.filter((file) => file.path.startsWith(prefix));
  if (inside.length === 0) return '';
  const member = new Set(inside.map((file) => file.id));

  const incoming = new Map<number, number>();
  const outgoing = new Map<number, number>();
  let internalEdges = 0;
  for (const file of inside) {
    for (const id of file.imports) {
      if (member.has(id)) internalEdges++;
      else outgoing.set(id, (outgoing.get(id) ?? 0) + 1);
    }
    for (const id of file.importedBy) {
      if (!member.has(id)) incoming.set(id, (incoming.get(id) ?? 0) + 1);
    }
  }
  const byCount = (map: Map<number, number>) =>
    [...map]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => `\`${files[id]!.path}\` (${count} imports)`);

  const out = header(snapshot, dir === '' ? '/' : `${dir}/`);
  const lines = inside.reduce((sum, file) => sum + file.lines, 0);
  out.push('## Summary', '');
  out.push(`- ${inside.length} files, ${lines} lines`);
  out.push(`- ${internalEdges} imports stay inside the module`);
  out.push(
    `- ${outgoing.size} outside files are depended on; ${incoming.size} outside files depend on it`,
  );

  out.push('', '## Files (largest first)', '');
  const largest = [...inside].sort((a, b) => b.lines - a.lines).map(describe);
  out.push(list(largest, max, 'Empty.'));

  out.push('', '## Used by (outside files importing this module)', '');
  out.push(list(byCount(incoming), max, 'Nothing outside imports this module.'));

  out.push('', '## Depends on (outside files this module imports)', '');
  out.push(list(byCount(outgoing), max, 'No dependencies outside the module.'));
  out.push('');
  return out.join('\n');
}
