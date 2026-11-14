import { useMemo } from 'react';
import { relationsOfDistrict, relationsOfFile, type Relations } from '../model/relations';
import { useStore } from './store';

/** Relations of the current selection (file or district), memoised per selection. */
export function useRelations(): Relations | null {
  const model = useStore((s) => s.model);
  const selected = useStore((s) => s.selected);
  const district = useStore((s) => s.district);
  return useMemo(() => {
    if (!model) return null;
    if (selected !== null) return relationsOfFile(model, selected);
    if (district !== null) return relationsOfDistrict(model, district);
    return null;
  }, [model, selected, district]);
}
