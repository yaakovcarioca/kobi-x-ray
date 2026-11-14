import { useMemo } from 'react';
import type { CityModel } from '../model/cityModel';
import type { ColorMode } from '../model/colors';
import { useStore } from '../state/store';
import { formatCompact, plural } from './format';
import { Search } from './Search';
import './topbar.css';

const MODES: Array<{ id: ColorMode; label: string }> = [
  { id: 'heat', label: 'Heat' },
  { id: 'complexity', label: 'Complexity' },
  { id: 'language', label: 'Language' },
];

export function TopBar({ model }: { model: CityModel }) {
  const colorMode = useStore((s) => s.colorMode);
  const commitIndex = useStore((s) => s.commitIndex);
  const { repo } = model.snapshot;

  // Size of the city at the playhead, not at HEAD.
  const { files, lines } = useMemo(() => {
    let alive = 0;
    let total = 0;
    const counts = model.replay.lines;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i]! > 0) {
        alive++;
        total += counts[i]!;
      }
    }
    return { files: alive, lines: total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, commitIndex]);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="topbar-name">Kobi X-Ray</span>
      </div>

      <div className="topbar-repo">
        <span className="mono topbar-repo-name">{repo.name}</span>
        {repo.branch && <span className="mono topbar-ref">{repo.branch}</span>}
        <span className="num topbar-stats">
          {plural(files, 'file')} · {formatCompact(lines)} lines
        </span>
      </div>

      <Search model={model} />

      <div className="segmented" role="radiogroup" aria-label="Colour buildings by">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={colorMode === mode.id}
            className={colorMode === mode.id ? 'is-active' : ''}
            onClick={() => useStore.getState().setColorMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </header>
  );
}
