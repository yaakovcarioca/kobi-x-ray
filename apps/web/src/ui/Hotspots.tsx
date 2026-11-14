import { rankHotspots } from '@kobi-xray/core';
import { useMemo, useState } from 'react';
import type { CityModel } from '../model/cityModel';
import { useStore } from '../state/store';
import { splitPath } from './format';
import './overlays.css';

/** The riskiest files at the playhead: hot, complex and widely depended upon. */
export function Hotspots({ model }: { model: CityModel }) {
  const commitIndex = useStore((s) => s.commitIndex);
  const selected = useStore((s) => s.selected);
  const [open, setOpen] = useState(true);

  const ranked = useMemo(() => {
    const heatOf = (id: number) => {
      const path = model.pathOfFile[id]!;
      return path >= 0 && model.replay.lines[path]! > 0 ? model.replay.heat(path) : 0;
    };
    return rankHotspots(model.files, heatOf, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, commitIndex]);

  return (
    <section className="hotspots" aria-label="Hotspots">
      <button type="button" className="hotspots-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>Hotspots</span>
        <span className="hotspots-chevron" aria-hidden>
          {open ? '–' : '+'}
        </span>
      </button>
      {open && (
        <ol className="hotspots-list">
          {ranked.length === 0 && <li className="hotspots-empty">Nothing is hot at this point in history.</li>}
          {ranked.map((hotspot, i) => {
            const path = model.pathOfFile[hotspot.id]!;
            const { dir, name } = splitPath(model.files[hotspot.id]!.path);
            return (
              <li key={hotspot.id}>
                <button
                  type="button"
                  className={`hotspot${path === selected ? ' is-selected' : ''}`}
                  onClick={() => useStore.getState().select(path)}
                  onMouseEnter={() => useStore.getState().hover(path)}
                  onMouseLeave={() => useStore.getState().hover(null)}
                >
                  <span className="num hotspot-rank">{i + 1}</span>
                  <span className="hotspot-text">
                    <span className="mono hotspot-name">{name}</span>
                    <span className="mono hotspot-dir">{dir || './'}</span>
                  </span>
                  <span className="mini-heat">
                    <span style={{ clipPath: `inset(0 ${100 - Math.round(hotspot.heat * 100)}% 0 0)` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
