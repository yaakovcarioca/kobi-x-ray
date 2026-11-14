import type { ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PLATFORM, type CityModel } from '../model/cityModel';
import { useStore } from '../state/store';

/** Platform shade per nesting level: deeper districts sit slightly lighter. */
const SHADES = ['#131922', '#161d27', '#1a222d', '#1e2733', '#222c39'];
const SELECTED = '#2b3b52';

/** Flat slabs marking directories; nested directories stack like terraces. */
export function Districts({ model }: { model: CityModel }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const selected = useStore((s) => s.district);
  const { districts } = model.layout;

  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.translate(0, -0.5, 0); // top face at y = 0
    return box;
  }, []);

  useLayoutEffect(() => {
    const instance = mesh.current;
    if (!instance) return;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    districts.forEach((district, i) => {
      matrix.makeScale(district.w * 0.985, PLATFORM, district.d * 0.985);
      matrix.setPosition(district.x, district.depth * PLATFORM, district.z);
      instance.setMatrixAt(i, matrix);
      const shade = SHADES[Math.min(district.depth, SHADES.length) - 1]!;
      instance.setColorAt(i, color.set(district.path === selected ? SELECTED : shade));
    });
    instance.instanceMatrix.needsUpdate = true;
    if (instance.instanceColor) instance.instanceColor.needsUpdate = true;
    instance.computeBoundingSphere();
  }, [districts, selected]);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4 || event.instanceId === undefined) return;
    event.stopPropagation();
    useStore.getState().selectDistrict(districts[event.instanceId]!.path);
  };

  if (districts.length === 0) return null;
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, districts.length]} onClick={onClick}>
      <meshLambertMaterial />
    </instancedMesh>
  );
}
