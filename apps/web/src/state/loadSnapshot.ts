import type { Snapshot } from '@kobi-xray/core';

/** Minimal structural check so a random JSON file fails with a clear message. */
export function parseSnapshot(text: string): Snapshot {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const snapshot = data as Partial<Snapshot> | null;
  if (
    !snapshot ||
    snapshot.schema !== 1 ||
    !Array.isArray(snapshot.files) ||
    !snapshot.timeline ||
    !Array.isArray(snapshot.timeline.commits) ||
    !Array.isArray(snapshot.timeline.paths)
  ) {
    throw new Error('That JSON is not a Kobi X-Ray snapshot.');
  }
  return snapshot as Snapshot;
}

/**
 * Loads the snapshot served by the CLI. Resolves to `null` when the page is
 * opened without a CLI behind it (static hosting).
 */
export async function fetchSnapshot(): Promise<Snapshot | null> {
  let response: Response;
  try {
    response = await fetch('/api/snapshot');
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('json')) return null;
  return parseSnapshot(await response.text());
}
