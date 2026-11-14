import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type ComponentRef } from 'react';
import * as THREE from 'three';
import type { CityModel } from '../model/cityModel';
import { useStore } from '../state/store';

/** Orbit controls plus a gentle glide towards whatever gets selected. */
export function CameraRig({ model }: { model: CityModel }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((state) => state.camera);
  const goal = useRef<THREE.Vector3 | null>(null);
  const selected = useStore((s) => s.selected);
  const district = useStore((s) => s.district);
  const side = model.layout.width;

  // Frame the whole city whenever a new snapshot loads.
  useEffect(() => {
    // About 1.75 city widths away: the diagonal fits a 42° field of view.
    camera.position.set(side * 0.95, side * 0.85 + 4, side * 1.2);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [camera, side]);

  useEffect(() => {
    if (selected !== null) {
      const lot = selected * 4;
      goal.current = new THREE.Vector3(model.layout.lots[lot]!, 0, model.layout.lots[lot + 1]!);
    } else if (district !== null) {
      const found = model.layout.districts.find((entry) => entry.path === district);
      if (found) goal.current = new THREE.Vector3(found.x, 0, found.z);
    }
  }, [model, selected, district]);

  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit || !goal.current) return;
    const step = goal.current.clone().sub(orbit.target);
    if (step.lengthSq() < 0.0004) {
      goal.current = null;
      return;
    }
    // Move camera and target together so the viewing angle is preserved.
    step.multiplyScalar(1 - Math.exp(-delta * 5));
    orbit.target.add(step);
    camera.position.add(step);
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={2}
      maxDistance={side * 4 + 40}
      // Dragging manually cancels any glide in progress.
      onStart={() => (goal.current = null)}
    />
  );
}
