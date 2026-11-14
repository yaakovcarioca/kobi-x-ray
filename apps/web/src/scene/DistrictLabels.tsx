import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { basename } from '@kobi-xray/core';
import { PLATFORM, type CityModel } from '../model/cityModel';
import { useStore } from '../state/store';

const MAX_LABELS = 28;

/** Names the largest districts so the city can be read like a map. */
export function DistrictLabels({ model }: { model: CityModel }) {
  const labelled = useMemo(() => {
    const total = model.paths.length;
    return model.layout.districts
      .filter((district) => district.depth <= 2 && district.files >= Math.max(3, total * 0.012))
      .sort((a, b) => b.files - a.files)
      .slice(0, MAX_LABELS);
  }, [model]);

  return (
    <>
      {labelled.map((district) => (
        <Html
          key={district.path}
          // Anchor on a platform edge, out of the buildings' way. Nested
          // districts use the opposite edge so parent and child never collide.
          position={[
            district.x,
            district.depth * PLATFORM,
            district.z + (district.depth === 1 ? district.d / 2 : -district.d / 2),
          ]}
          center
          zIndexRange={[4, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <button
            type="button"
            className={`district-label depth-${district.depth}`}
            style={{ pointerEvents: 'auto' }}
            onClick={() => useStore.getState().selectDistrict(district.path)}
          >
            {district.depth === 1 ? district.path : basename(district.path)}
          </button>
        </Html>
      ))}
    </>
  );
}
