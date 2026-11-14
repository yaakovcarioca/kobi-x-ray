import { useEffect } from 'react';
import { CityScene } from './scene/CityScene';
import { fetchSnapshot } from './state/loadSnapshot';
import { useRelations } from './state/selectors';
import { useStore } from './state/store';
import { useHotkeys } from './state/useHotkeys';
import { DistrictPanel } from './ui/DistrictPanel';
import { EmptyState } from './ui/EmptyState';
import { Hotspots } from './ui/Hotspots';
import { Legend } from './ui/Legend';
import { Timeline } from './ui/Timeline';
import { Tooltip } from './ui/Tooltip';
import { TopBar } from './ui/TopBar';
import { XRayPanel } from './ui/XRayPanel';

export function App() {
  const status = useStore((s) => s.status);
  const model = useStore((s) => s.model);
  const selected = useStore((s) => s.selected);
  const district = useStore((s) => s.district);
  const relations = useRelations();
  useHotkeys();

  useEffect(() => {
    let cancelled = false;
    fetchSnapshot().then(
      (snapshot) => {
        if (cancelled) return;
        if (snapshot) useStore.getState().load(snapshot);
        else useStore.getState().fail(null);
      },
      (error: unknown) => {
        if (!cancelled)
          useStore.getState().fail(error instanceof Error ? error.message : String(error));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') return <div className="loading">Loading the city…</div>;
  if (status === 'empty' || !model) return <EmptyState />;

  return (
    <div className="app">
      <CityScene model={model} />
      <TopBar model={model} />
      <Hotspots model={model} />
      <Legend />
      {selected !== null && relations && (
        <XRayPanel key={selected} model={model} path={selected} relations={relations} />
      )}
      {district !== null && <DistrictPanel key={district} model={model} dir={district} />}
      <Timeline model={model} />
      <Tooltip model={model} />
    </div>
  );
}
