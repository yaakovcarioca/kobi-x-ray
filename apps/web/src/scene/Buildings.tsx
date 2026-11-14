import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { heightOf, type CityModel } from '../model/cityModel';
import {
  complexityRamp,
  complexityScore,
  DIM,
  heatRamp,
  languageColor,
  setRgb,
  type ColorMode,
} from '../model/colors';
import { Role, type Relations } from '../model/relations';
import { useStore } from '../state/store';
import { live } from './live';

/** Share of the lot left free around a full-width building. */
const GUTTER = 0.86;

function computeTargets(
  model: CityModel,
  mode: ColorMode,
  relations: Relations | null,
  heights: Float32Array,
  colors: Float32Array,
): void {
  const { replay, fileOfPath, files, languages } = model;
  for (let i = 0; i < heights.length; i++) {
    heights[i] = heightOf(replay.lines[i]!);
    const offset = i * 3;
    const role = relations ? relations.roles[i]! : Role.Self;
    if (role === Role.None) {
      setRgb(colors, offset, DIM);
      continue;
    }
    if (mode === 'heat') heatRamp(replay.heat(i), colors, offset);
    else if (mode === 'language') languageColor(languages[i]!, colors, offset);
    else complexityRamp(complexityScore(files[fileOfPath[i]!]), colors, offset);

    if (relations && role === Role.Transitive) {
      // Second-order dependents stay visible but recede.
      colors[offset]! *= 0.55;
      colors[offset + 1]! *= 0.55;
      colors[offset + 2]! *= 0.55;
    }
  }
}

/** One instanced box per path; heights and colours ease towards the replay state. */
export function Buildings({ model, relations }: { model: CityModel; relations: Relations | null }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = model.paths.length;

  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0); // origin at the base so scaling grows upwards
    return box;
  }, []);

  const buffers = useMemo(() => {
    live.heights = new Float32Array(count);
    return {
      targetHeights: new Float32Array(count),
      colors: new Float32Array(count * 3),
      targetColors: new Float32Array(count * 3),
      applied: '',
      relations: undefined as Relations | null | undefined,
      settling: true,
    };
  }, [count, model]);

  useLayoutEffect(() => {
    const instance = mesh.current;
    if (!instance) return;
    instance.instanceColor = new THREE.InstancedBufferAttribute(buffers.colors, 3);
    // Instance matrices change every frame while animating; a fixed, generous
    // bounding sphere keeps raycasting correct without recomputing it.
    const reach = Math.hypot(model.layout.width, model.layout.depth) / 2 + 400;
    instance.boundingSphere = new THREE.Sphere(new THREE.Vector3(), reach);
    buffers.applied = '';
  }, [buffers, model]);

  useFrame((_, delta) => {
    const instance = mesh.current;
    if (!instance) return;
    const { commitIndex, colorMode, playing } = useStore.getState();

    const key = `${commitIndex}|${colorMode}`;
    if (key !== buffers.applied || buffers.relations !== relations) {
      computeTargets(model, colorMode, relations, buffers.targetHeights, buffers.targetColors);
      buffers.applied = key;
      buffers.relations = relations;
      buffers.settling = true;
    }
    if (!buffers.settling) return;

    // Snappier easing while the film plays so growth keeps up with commits.
    const ease = 1 - Math.exp(-Math.min(delta, 0.1) * (playing ? 14 : 9));
    const { lots } = model.layout;
    const heights = live.heights;
    const { targetHeights, colors, targetColors } = buffers;
    const matrices = instance.instanceMatrix.array as Float32Array;
    let moving = false;

    for (let i = 0; i < count; i++) {
      const target = targetHeights[i]!;
      let height = heights[i]!;
      if (height !== target) {
        height += (target - height) * ease;
        if (Math.abs(target - height) < 0.004) height = target;
        else moving = true;
        heights[i] = height;
      }

      const c = i * 3;
      for (let k = 0; k < 3; k++) {
        const goal = targetColors[c + k]!;
        const now = colors[c + k]!;
        if (now === goal) continue;
        const next = now + (goal - now) * ease;
        if (Math.abs(goal - next) < 0.002) colors[c + k] = goal;
        else {
          colors[c + k] = next;
          moving = true;
        }
      }

      const lot = i * 4;
      // Files that do not exist yet (or any more) collapse to nothing; a
      // zero-height box would still draw its footprint as a dark square.
      const fill = height > 0 ? model.footprint[i]! * GUTTER : 0;
      const m = i * 16;
      matrices[m] = lots[lot + 2]! * fill;
      matrices[m + 5] = height;
      matrices[m + 10] = lots[lot + 3]! * fill;
      matrices[m + 12] = lots[lot]!;
      matrices[m + 13] = model.baseY[i]!;
      matrices[m + 14] = lots[lot + 1]!;
      matrices[m + 15] = 1;
    }

    instance.instanceMatrix.needsUpdate = true;
    if (instance.instanceColor) instance.instanceColor.needsUpdate = true;
    buffers.settling = moving;
  });

  const onMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.instanceId !== undefined) useStore.getState().hover(event.instanceId);
  };
  const onOut = () => useStore.getState().hover(null);
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    // A click that ends a camera drag is not a selection.
    if (event.delta > 4 || event.instanceId === undefined) return;
    event.stopPropagation();
    useStore.getState().select(event.instanceId);
  };

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      onPointerMove={onMove}
      onPointerOut={onOut}
      onClick={onClick}
    >
      <meshLambertMaterial />
    </instancedMesh>
  );
}
