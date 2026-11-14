import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon } from './Icons';

/**
 * Copies a Markdown briefing to the clipboard. `build` runs on click so the
 * (potentially large) text is only generated when asked for.
 */
export function CopyContextButton({ build, label }: { build: () => string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(build());
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <button type="button" className="copy-context" onClick={copy}>
      {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
      <span aria-live="polite">
        {state === 'copied' ? 'Copied to clipboard' : state === 'failed' ? 'Clipboard blocked by the browser' : label}
      </span>
    </button>
  );
}
