import { useEffect } from 'react';
import { useStore } from './store';

/** Space plays, arrows step through commits, C toggles the cinematic orbit, Escape clears the selection. */
export function useHotkeys(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // The timeline range handles its own arrow keys; text inputs keep theirs.
        if ((target as HTMLInputElement).type !== 'range' || event.key !== ' ') return;
      }
      const store = useStore.getState();
      switch (event.key) {
        case ' ':
          // Let a focused button handle Space itself, otherwise it fires twice.
          if (target?.tagName === 'BUTTON') return;
          store.togglePlay();
          break;
        case 'ArrowLeft':
          store.step(event.shiftKey ? -10 : -1);
          break;
        case 'ArrowRight':
          store.step(event.shiftKey ? 10 : 1);
          break;
        case 'c':
          store.setCinematic(!store.cinematic);
          break;
        case 'Escape':
          store.select(null);
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
