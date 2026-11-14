import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';

/** Seconds a full replay takes at 1× regardless of how long the history is. */
const FILM_SECONDS = 40;
/** Short histories would crawl; never play slower than this many commits per second. */
const MIN_RATE = 3;

/** Advances the playhead while playing. Lives in the canvas to share its frame loop. */
export function Playback() {
  useFrame((_, delta) => {
    const { playing, model, position, speed, setPosition } = useStore.getState();
    if (!playing || !model) return;
    const rate = Math.max(MIN_RATE, model.commitCount / FILM_SECONDS) * speed;
    const next = position + Math.min(delta, 0.1) * rate;
    setPosition(next);
    if (next >= model.commitCount) useStore.setState({ playing: false });
  });
  return null;
}
