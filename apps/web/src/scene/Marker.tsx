import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { CityModel } from '../model/cityModel';
import { live } from './live';

/** Wireframe outline hugging one building, following its animated height. */
export function Marker({ model, path, color }: { model: CityModel; path: number | null; color: string }) {
  const outline = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, []);

  useFrame(() => {
    const target = outline.current;
    if (!target) return;
    const height = path === null ? 0 : (live.heights[path] ?? 0);
    target.visible = path !== null && height > 0;
    if (!target.visible || path === null) return;
    const lot = path * 4;
    const { lots } = model.layout;
    const fill = model.footprint[path]! * 0.86 + 0.06;
    target.position.set(lots[lot]!, model.baseY[path]!, lots[lot + 1]!);
    target.scale.set(lots[lot + 2]! * fill, height + 0.04, lots[lot + 3]! * fill);
  });

  return (
    <lineSegments ref={outline} geometry={geometry} visible={false} renderOrder={3}>
      <lineBasicMaterial color={color} depthTest={false} transparent />
    </lineSegments>
  );
}
