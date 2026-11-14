import { districtContextMarkdown } from '@kobi-xray/core';
import { useMemo } from 'react';
import type { CityModel } from '../model/cityModel';
import { useStore } from '../state/store';
import { CopyContextButton } from './CopyContextButton';
import { formatNumber, splitPath } from './format';
import { CloseIcon } from './Icons';
import './panel.css';

/** Summary of a directory: size, coupling across its boundary, biggest files. */
export function DistrictPanel({ model, dir }: { model: CityModel; dir: string }) {
  const commitIndex = useStore((s) => s.commitIndex);

  const summary = useMemo(() => {
    const prefix = `${dir}/`;
    const inside = model.files.filter((file) => file.path.startsWith(prefix));
    const member = new Set(inside.map((file) => file.id));
    const incoming = new Set<number>();
    const outgoing = new Set<number>();
    for (const file of inside) {
      for (const id of file.importedBy) if (!member.has(id)) incoming.add(id);
      for (const id of file.imports) if (!member.has(id)) outgoing.add(id);
    }
    return { inside, incoming: incoming.size, outgoing: outgoing.size };
  }, [model, dir]);

  // Hottest files first, at the playhead.
  const ranked = useMemo(() => {
    return summary.inside
      .map((file) => {
        const path = model.pathOfFile[file.id]!;
        return {
          path,
          heat: path >= 0 ? model.replay.heat(path) : 0,
          lines: path >= 0 ? model.replay.lines[path]! : 0,
        };
      })
      .filter((entry) => entry.path >= 0 && entry.lines > 0)
      .sort((a, b) => b.heat - a.heat || b.lines - a.lines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, model, commitIndex]);

  const lines = ranked.reduce((sum, entry) => sum + entry.lines, 0);
  const { dir: parent, name } = splitPath(dir);

  return (
    <aside className="panel scroll" aria-label="Directory X-Ray">
      <header className="panel-header">
        <div className="panel-title">
          <h2 className="mono">{name}/</h2>
          <p className="mono panel-dir">{parent || './'}</p>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => useStore.getState().selectDistrict(null)}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </header>

      <section className="panel-section">
        <dl className="stats">
          <div className="stat">
            <dt>Files</dt>
            <dd className="num">{formatNumber(ranked.length)}</dd>
          </div>
          <div className="stat">
            <dt>Lines</dt>
            <dd className="num">{formatNumber(lines)}</dd>
          </div>
          <div className="stat" title="Outside files that import something in here">
            <dt>Used by</dt>
            <dd className="num">{formatNumber(summary.incoming)}</dd>
          </div>
          <div className="stat" title="Outside files this directory imports">
            <dt>Depends on</dt>
            <dd className="num">{formatNumber(summary.outgoing)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel-section">
        <h3>Hottest files</h3>
        {ranked.length === 0 && (
          <p className="panel-empty">No files here at this point in history.</p>
        )}
        <ul className="file-list">
          {ranked.slice(0, 12).map((entry) => (
            <li key={entry.path}>
              <button
                type="button"
                className="file-row mono"
                onClick={() => useStore.getState().select(entry.path)}
              >
                <span className="mini-heat">
                  <span
                    style={{ clipPath: `inset(0 ${100 - Math.round(entry.heat * 100)}% 0 0)` }}
                  />
                </span>
                <span className="file-row-path">
                  {model.paths[entry.path]!.slice(dir.length + 1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer className="panel-footer">
        <CopyContextButton
          label="Copy module context for Claude / Cursor"
          build={() => districtContextMarkdown(model.snapshot, dir)}
        />
      </footer>
    </aside>
  );
}
