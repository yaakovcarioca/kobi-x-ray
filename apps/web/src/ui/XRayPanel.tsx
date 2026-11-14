import { fileContextMarkdown, fileHistory } from '@kobi-xray/core';
import { useMemo, useState } from 'react';
import type { CityModel } from '../model/cityModel';
import type { Relations } from '../model/relations';
import { useStore } from '../state/store';
import { CopyContextButton } from './CopyContextButton';
import { formatDate, formatNumber, plural, splitPath } from './format';
import { CloseIcon } from './Icons';
import './panel.css';

const PREVIEW = 8;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stat" title={hint}>
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

/** Clickable list of related files, collapsed to a preview when long. */
function FileList({
  model,
  paths,
  tone,
}: {
  model: CityModel;
  paths: number[];
  tone: 'imports' | 'dependents';
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? paths : paths.slice(0, PREVIEW);
  return (
    <ul className="file-list">
      {shown.map((path) => {
        const { dir, name } = splitPath(model.paths[path]!);
        return (
          <li key={path}>
            <button
              type="button"
              className="file-row mono"
              onClick={() => useStore.getState().select(path)}
              onMouseEnter={() => useStore.getState().hover(path)}
              onMouseLeave={() => useStore.getState().hover(null)}
            >
              <i className={`dot dot-${tone}`} />
              <span className="file-row-path">
                {name}
                <span className="file-row-dir">{dir}</span>
              </span>
            </button>
          </li>
        );
      })}
      {paths.length > PREVIEW && (
        <li>
          <button type="button" className="link" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show fewer' : `Show all ${formatNumber(paths.length)}`}
          </button>
        </li>
      )}
    </ul>
  );
}

/** Stacked bar: how many files break at each hop away from the selection. */
function BlastBar({ byDepth, total }: { byDepth: number[]; total: number }) {
  return (
    <div
      className="blast-bar"
      role="img"
      aria-label={byDepth.map((n, i) => `${n} at ${i + 1} hops`).join(', ')}
    >
      {byDepth.map((count, depth) => (
        <span
          key={depth}
          style={{ flexGrow: count, opacity: Math.max(0.25, 1 - depth * 0.22) }}
          title={`${plural(count, 'file')} ${depth === 0 ? 'import it directly' : `${depth + 1} hops away`}`}
        />
      ))}
      {total === 0 && <span className="is-empty" style={{ flexGrow: 1 }} />}
    </div>
  );
}

export function XRayPanel({
  model,
  path,
  relations,
}: {
  model: CityModel;
  path: number;
  relations: Relations;
}) {
  const commitIndex = useStore((s) => s.commitIndex);
  const file = model.files[model.fileOfPath[path]!];
  const fullPath = model.paths[path]!;
  const { dir, name } = splitPath(fullPath);
  const { timeline } = model.snapshot;

  const history = useMemo(() => fileHistory(timeline, path), [timeline, path]);
  // The full history is computed once; the playhead only trims what is shown.
  const visible = useMemo(() => {
    let end = history.commits.length;
    while (end > 0 && history.commits[end - 1]! >= commitIndex) end--;
    return history.commits.slice(0, end);
  }, [history, commitIndex]);

  const lines = model.replay.lines[path]!;
  const heat = model.replay.heat(path);
  const exists = lines > 0;
  const atHead = commitIndex === model.commitCount;

  return (
    <aside className="panel scroll" aria-label="File X-Ray">
      <header className="panel-header">
        <div className="panel-title">
          <h2 className="mono">{name}</h2>
          <p className="mono panel-dir">{dir || './'}</p>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => useStore.getState().select(null)}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </header>

      {!exists && (
        <p className="panel-note">
          {visible.length === 0
            ? 'This file has not been created yet at this point in history.'
            : 'This file was deleted before this point in history.'}
        </p>
      )}
      {exists && !file && (
        <p className="panel-note">
          This file no longer exists at HEAD, so only its history is known.
        </p>
      )}

      <section className="panel-section">
        <div className="heat-row">
          <span>Heat</span>
          <div className="heat-meter">
            <span style={{ clipPath: `inset(0 ${100 - Math.round(heat * 100)}% 0 0)` }} />
          </div>
          <span className="num">{Math.round(heat * 100)}%</span>
        </div>
        <dl className="stats">
          <Stat label="Lines" value={formatNumber(lines)} hint="At the playhead" />
          <Stat label="Commits" value={formatNumber(visible.length)} hint="Up to the playhead" />
          <Stat
            label="Bug fixes"
            value={formatNumber(model.replay.fixes[path]!)}
            hint="Commits whose subject looks like a fix"
          />
          {file && (
            <>
              <Stat
                label="Complexity"
                value={file.complexity ? formatNumber(file.complexity) : '—'}
                hint="Cyclomatic, whole file"
              />
              <Stat label="Functions" value={formatNumber(file.functions)} />
              <Stat label="Language" value={file.language} />
            </>
          )}
        </dl>
      </section>

      {file && (
        <>
          <section className="panel-section">
            <h3>Blast radius</h3>
            <p className="blast-number">
              <strong className="num">{formatNumber(relations.blast)}</strong>
              <span>
                {relations.blast === 1 ? 'file' : 'files'} can break if this changes
                {relations.blastByDepth.length > 1 &&
                  `, up to ${relations.blastByDepth.length} hops away`}
              </span>
            </p>
            <BlastBar byDepth={relations.blastByDepth} total={relations.blast} />
            {!atHead && (
              <p className="panel-footnote">Dependencies are shown as they are at HEAD.</p>
            )}
          </section>

          <section className="panel-section">
            <h3>
              Imported by{' '}
              <span className="num count">{formatNumber(relations.dependents.length)}</span>
            </h3>
            {relations.dependents.length ? (
              <FileList model={model} paths={relations.dependents} tone="dependents" />
            ) : (
              <p className="panel-empty">Nothing imports this file.</p>
            )}
          </section>

          <section className="panel-section">
            <h3>
              Imports <span className="num count">{formatNumber(relations.imports.length)}</span>
            </h3>
            {relations.imports.length ? (
              <FileList model={model} paths={relations.imports} tone="imports" />
            ) : (
              <p className="panel-empty">No imports from this repository.</p>
            )}
            {file.external.length > 0 && (
              <p className="externals mono" title={file.external.join('\n')}>
                {file.external.slice(0, 10).join(' · ')}
                {file.external.length > 10 && ` · +${file.external.length - 10}`}
              </p>
            )}
          </section>
        </>
      )}

      {visible.length > 0 && (
        <section className="panel-section">
          <h3>History</h3>
          <p className="panel-meta">
            {history.authors
              .slice(0, 3)
              .map((author) => `${author.name} (${author.commits})`)
              .join(', ')}
          </p>
          <ol className="commit-list">
            {visible
              .slice(-5)
              .reverse()
              .map((index) => {
                const commit = timeline.commits[index]!;
                return (
                  <li key={index}>
                    <button
                      type="button"
                      className="commit-row"
                      title="Travel to this commit"
                      onClick={() => useStore.getState().step(index + 1 - commitIndex)}
                    >
                      <span className="num commit-date">{formatDate(commit.time)}</span>
                      <span className={`commit-subject${commit.fix ? ' is-fix' : ''}`}>
                        {commit.subject}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ol>
        </section>
      )}

      {file && (
        <footer className="panel-footer">
          <CopyContextButton
            label="Copy context for Claude / Cursor"
            build={() => fileContextMarkdown(model.snapshot, file.id)}
          />
        </footer>
      )}
    </aside>
  );
}
