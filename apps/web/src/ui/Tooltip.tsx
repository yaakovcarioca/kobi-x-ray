import { useEffect, useRef } from 'react';
import type { CityModel } from '../model/cityModel';
import { useStore } from '../state/store';
import { formatNumber } from './format';
import './overlays.css';

/** Path and size of the hovered building, following the cursor. */
export function Tooltip({ model }: { model: CityModel }) {
  const hovered = useStore((s) => s.hovered);
  // Re-render on scrub so the line count tracks the playhead.
  useStore((s) => s.commitIndex);
  const element = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const place = () => {
      const node = element.current;
      if (!node) return;
      // Flip to the left of the cursor near the right edge of the window.
      const flip = pointer.current.x > window.innerWidth - 320;
      node.style.transform = `translate(${pointer.current.x + (flip ? -14 : 14)}px, ${pointer.current.y + 16}px) translateX(${flip ? '-100%' : '0'})`;
    };
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      place();
    };
    window.addEventListener('pointermove', onMove);
    place();
    return () => window.removeEventListener('pointermove', onMove);
  }, [hovered]);

  if (hovered === null) return null;
  const lines = model.replay.lines[hovered]!;
  const file = model.files[model.fileOfPath[hovered]!];
  return (
    <div ref={element} className="tooltip" role="status">
      <span className="mono">{model.paths[hovered]}</span>
      <span className="num tooltip-meta">
        {formatNumber(lines)} lines
        {file && ` · ${formatNumber(file.importedBy.length)} dependents`}
      </span>
    </div>
  );
}
