import { Canvas } from '@react-three/fiber';
import type { CityModel } from '../model/cityModel';
import { useRelations } from '../state/selectors';
import { useStore } from '../state/store';
import { Arcs } from './Arcs';
import { Buildings } from './Buildings';
import { CameraRig } from './CameraRig';
import { DistrictLabels } from './DistrictLabels';
import { Districts } from './Districts';
import { Marker } from './Marker';
import { Playback } from './Playback';

const BACKGROUND = '#0b0e13';

export function CityScene({ model }: { model: CityModel }) {
  const relations = useRelations();
  const selected = useStore((s) => s.selected);
  const hovered = useStore((s) => s.hovered);
  const side = model.layout.width;

  return (
    <Canvas
      className="scene"
      flat
      dpr={[1, 2]}
      camera={{ fov: 42, near: 0.1, far: side * 12 + 600 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={(event) => {
        if (event.type === 'click') useStore.getState().select(null);
      }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, side * 1.6 + 30, side * 5 + 120]} />

      {/* Cool sky fill plus a warm key light so faces read as distinct planes. */}
      <hemisphereLight args={['#c9d6e8', '#232a35', 1.5]} />
      <directionalLight position={[side * 0.6, side * 1.2 + 10, side * 0.35]} intensity={2.1} color="#fff1dd" />
      <directionalLight position={[-side, side * 0.5, -side * 0.7]} intensity={0.5} color="#9db7dd" />

      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <planeGeometry args={[side * 40 + 400, side * 40 + 400]} />
        <meshBasicMaterial color="#0d1117" />
      </mesh>

      <Districts model={model} />
      <Buildings model={model} relations={relations} />
      <Arcs model={model} relations={relations} />
      <Marker model={model} path={hovered === selected ? null : hovered} color="#9fb0c3" />
      <Marker model={model} path={selected} color="#ffffff" />
      <DistrictLabels model={model} />

      <CameraRig model={model} />
      <Playback />
    </Canvas>
  );
}
