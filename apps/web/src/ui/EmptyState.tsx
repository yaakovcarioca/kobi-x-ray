import { useState, type DragEvent } from 'react';
import { parseSnapshot } from '../state/loadSnapshot';
import { useStore } from '../state/store';
import './empty.css';

/** Shown when no CLI is serving a snapshot: explains how to get one, or accepts a file. */
export function EmptyState() {
  const error = useStore((s) => s.error);
  const [dragging, setDragging] = useState(false);

  const open = async (file: File | undefined) => {
    if (!file) return;
    try {
      useStore.getState().load(parseSnapshot(await file.text()));
    } catch (cause) {
      useStore
        .getState()
        .fail(cause instanceof Error ? cause.message : 'Could not read that file.');
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void open(event.dataTransfer.files[0]);
  };

  return (
    <main
      className={`empty${dragging ? ' is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="empty-card">
        <h1>Kobi X-Ray</h1>
        <p className="empty-lead">
          See a repository as a city: files are buildings, folders are districts, and the timeline
          replays every commit.
        </p>

        <ol className="empty-steps">
          <li>
            <span>Run it inside any git repository</span>
            <code className="mono">npx kobi-xray</code>
          </li>
          <li>
            <span>Or export a snapshot and open it here</span>
            <code className="mono">npx kobi-xray --json city.json</code>
          </li>
        </ol>

        <label className="empty-open">
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => void open(event.target.files?.[0])}
          />
          Open a snapshot file
        </label>
        <p className="empty-hint">
          or drop it anywhere on this page. Nothing is uploaded: the file is read in your browser.
        </p>
        {error && (
          <p className="empty-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
