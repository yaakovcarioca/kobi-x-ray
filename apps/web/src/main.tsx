import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useStore } from './state/store';
import './styles/base.css';

// Handle for scripted demos and recordings: `kobiXray.store.getState().select(…)`.
(window as unknown as { kobiXray: unknown }).kobiXray = { store: useStore };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
