import { useEffect, useRef } from 'react';
import type { CityModel } from '../model/cityModel';
import { useStore } from '../state/store';
import { formatDate, formatNumber } from './format';
import { PauseIcon, PlayIcon, StepIcon } from './Icons';
import './timeline.css';

const PLAYED = '#8494a6';
const PLAYED_FIX = '#e5484d';
const AHEAD = '#263040';

/** Histogram of lines changed over the life of the repository. */
function drawActivity(canvas: HTMLCanvasElement, model: CityModel, progress: number): void {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const { activity, fixShare } = model;
  let max = 0;
  for (const value of activity) max = Math.max(max, value);
  if (max === 0) return;

  const slot = width / activity.length;
  const bar = Math.max(1, slot - 1);
  for (let i = 0; i < activity.length; i++) {
    // Square root keeps quiet periods visible next to huge import commits.
    const tall = Math.max(1, Math.sqrt(activity[i]! / max) * (height - 2));
    const x = i * slot;
    const played = (i + 0.5) / activity.length <= progress;
    context.fillStyle = played ? PLAYED : AHEAD;
    context.fillRect(x, height - tall, bar, tall);
    if (played && fixShare[i]! > 0) {
      const fix = tall * fixShare[i]!;
      context.fillStyle = PLAYED_FIX;
      context.fillRect(x, height - fix, bar, fix);
    }
  }
}

export function Timeline({ model }: { model: CityModel }) {
  const commitIndex = useStore((s) => s.commitIndex);
  const playing = useStore((s) => s.playing);
  const speed = useStore((s) => s.speed);
  const { setPosition, togglePlay, step, cycleSpeed } = useStore.getState();
  const canvas = useRef<HTMLCanvasElement>(null);

  const total = model.commitCount;
  const progress = total === 0 ? 1 : commitIndex / total;
  const commit = commitIndex > 0 ? model.snapshot.timeline.commits[commitIndex - 1] : null;

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const draw = () => drawActivity(element, model, progress);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => observer.disconnect();
  }, [model, progress]);

  return (
    <footer className="timeline">
      <div className="timeline-controls">
        <button
          type="button"
          className="icon-button"
          onClick={() => step(-1)}
          aria-label="Previous commit"
        >
          <StepIcon back />
        </button>
        <button
          type="button"
          className="play-button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play history'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => step(1)}
          aria-label="Next commit"
        >
          <StepIcon />
        </button>
        <button
          type="button"
          className="speed-button num"
          onClick={cycleSpeed}
          aria-label="Playback speed"
        >
          {speed}×
        </button>
      </div>

      <div className="timeline-main">
        <div className="timeline-track">
          <canvas ref={canvas} className="timeline-activity" />
          <div className="timeline-playhead" style={{ left: `${progress * 100}%` }} />
          <input
            type="range"
            className="timeline-range"
            min={0}
            max={total}
            step={1}
            value={commitIndex}
            aria-label="Commit"
            aria-valuetext={
              commit ? `${formatDate(commit.time)}: ${commit.subject}` : 'Before the first commit'
            }
            onChange={(event) => {
              useStore.setState({ playing: false });
              setPosition(Number(event.target.value));
            }}
          />
        </div>

        <div className="timeline-meta">
          <span className="num timeline-count">
            {formatNumber(commitIndex)} / {formatNumber(total)}
          </span>
          {commit ? (
            <>
              <span className="timeline-date">{formatDate(commit.time)}</span>
              <span className="mono timeline-hash">{commit.hash.slice(0, 7)}</span>
              <span
                className={`timeline-subject${commit.fix ? ' is-fix' : ''}`}
                title={commit.subject}
              >
                {commit.subject}
              </span>
              <span className="timeline-author">
                {model.snapshot.timeline.authors[commit.author]}
              </span>
            </>
          ) : (
            <span className="timeline-subject">Before the first commit</span>
          )}
        </div>
      </div>
    </footer>
  );
}
