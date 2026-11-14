import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'currentColor',
  'aria-hidden': true,
};

export const PlayIcon = () => (
  <svg {...base}>
    <path d="M4 2.5v11a.5.5 0 0 0 .76.43l9-5.5a.5.5 0 0 0 0-.86l-9-5.5A.5.5 0 0 0 4 2.5Z" />
  </svg>
);

export const PauseIcon = () => (
  <svg {...base}>
    <rect x="3" y="2" width="3.5" height="12" rx="0.75" />
    <rect x="9.5" y="2" width="3.5" height="12" rx="0.75" />
  </svg>
);

export const StepIcon = ({ back = false }: { back?: boolean }) => (
  <svg {...base} style={back ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M3 3v10a.5.5 0 0 0 .78.42L10 9.2V13h2V3h-2v3.8L3.78 2.58A.5.5 0 0 0 3 3Z" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="7" cy="7" r="4.25" />
    <path d="m10.2 10.2 3.3 3.3" />
  </svg>
);

export const CopyIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
  </svg>
);

export const CheckIcon = () => (
  <svg
    {...base}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 8.5 3.2 3.2L13 4.8" />
  </svg>
);
