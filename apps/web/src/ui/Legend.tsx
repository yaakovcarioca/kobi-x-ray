import { COMPLEXITY_STOPS, HEAT_STOPS, LANGUAGE_COLORS, rampCss } from '../model/colors';
import { useStore } from '../state/store';
import './overlays.css';

/** Explains what the city encodes, and the arc colours while a file is selected. */
export function Legend() {
  const colorMode = useStore((s) => s.colorMode);
  const hasSelection = useStore((s) => s.selected !== null);

  return (
    <div className="legend">
      {colorMode === 'language' ? (
        <ul className="legend-swatches">
          {Object.entries(LANGUAGE_COLORS).map(([language, color]) => (
            <li key={language}>
              <i style={{ background: color }} />
              {language}
            </li>
          ))}
        </ul>
      ) : (
        <div className="legend-ramp">
          <span>{colorMode === 'heat' ? 'cold' : 'simple'}</span>
          <i
            style={{ background: rampCss(colorMode === 'heat' ? HEAT_STOPS : COMPLEXITY_STOPS) }}
          />
          <span>{colorMode === 'heat' ? 'recent churn + fixes' : 'complex'}</span>
        </div>
      )}
      <p className="legend-note">Height: lines · Width: files that import it</p>
      {hasSelection && (
        <ul className="legend-swatches">
          <li>
            <i className="legend-line" style={{ background: 'var(--imports)' }} />
            imports
          </li>
          <li>
            <i className="legend-line" style={{ background: 'var(--dependents)' }} />
            imported by
          </li>
        </ul>
      )}
    </div>
  );
}
