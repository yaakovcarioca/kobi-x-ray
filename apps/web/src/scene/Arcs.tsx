import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { heightOf, type CityModel } from '../model/cityModel';
import type { Relations } from '../model/relations';
import { useStore } from '../state/store';

const IMPORTS = '#4c9dff';
const DEPENDENTS = '#f08c3a';
const SEGMENTS = 20;
/** Beyond this many arcs the scene turns into a hairball; the panel lists the rest. */
const MAX_ARCS = 300;

type Point = [number, number, number];

function roof(model: CityModel, path: number): THREE.Vector3 {
  const lot = path * 4;
  return new THREE.Vector3(
    model.layout.lots[lot]!,
    model.baseY[path]! + heightOf(model.replay.lines[path]!),
    model.layout.lots[lot + 1]!,
  );
}

/** Samples arcs from each source roof to each target roof as line segment pairs. */
function arcPoints(model: CityModel, from: number[], to: number[]): Point[] {
  const points: Point[] = [];
  const curve = new THREE.QuadraticBezierCurve3();
  const sample = new THREE.Vector3();
  for (const source of from) {
    for (const target of to) {
      curve.v0.copy(roof(model, source));
      curve.v2.copy(roof(model, target));
      const span = curve.v0.distanceTo(curve.v2);
      curve.v1
        .addVectors(curve.v0, curve.v2)
        .multiplyScalar(0.5)
        .setY(Math.max(curve.v0.y, curve.v2.y) + 1 + span * 0.32);
      let previous: Point | null = null;
      for (let i = 0; i <= SEGMENTS; i++) {
        curve.getPoint(i / SEGMENTS, sample);
        const point: Point = [sample.x, sample.y, sample.z];
        if (previous) points.push(previous, point);
        previous = point;
      }
    }
  }
  return points;
}

function FlowingArcs({ points, color }: { points: Point[]; color: string }) {
  const line = useRef<{ material: { dashOffset: number } }>(null);
  // Dashes travel from importer to imported file: the direction of dependency.
  useFrame((_, delta) => {
    if (line.current) line.current.material.dashOffset -= delta * 1.6;
  });
  if (points.length === 0) return null;
  return (
    <Line
      ref={line as never}
      points={points}
      segments
      color={color}
      lineWidth={1.6}
      dashed
      dashSize={0.9}
      gapSize={0.35}
      transparent
      opacity={0.9}
      depthTest={false}
      renderOrder={2}
    />
  );
}

/** Blue arcs to what the selection imports, orange arcs from what depends on it. */
export function Arcs({ model, relations }: { model: CityModel; relations: Relations | null }) {
  const selected = useStore((s) => s.selected);
  const commitIndex = useStore((s) => s.commitIndex);

  const { imports, dependents } = useMemo(() => {
    if (selected === null || !relations) return { imports: [], dependents: [] };
    return {
      imports: arcPoints(model, [selected], relations.imports.slice(0, MAX_ARCS)),
      dependents: arcPoints(model, relations.dependents.slice(0, MAX_ARCS), [selected]),
    };
    // Roof heights depend on the playhead, so arcs follow the time travel.
  }, [model, relations, selected, commitIndex]);

  return (
    <>
      <FlowingArcs points={imports} color={IMPORTS} />
      <FlowingArcs points={dependents} color={DEPENDENTS} />
    </>
  );
}
