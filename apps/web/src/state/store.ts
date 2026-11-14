import type { Snapshot } from '@kobi-xray/core';
import { create } from 'zustand';
import { buildCityModel, type CityModel } from '../model/cityModel';
import type { ColorMode } from '../model/colors';

export type Status = 'loading' | 'ready' | 'empty';

export const SPEEDS = [0.5, 1, 2, 4] as const;

interface State {
  status: Status;
  error: string | null;
  model: CityModel | null;

  /** Fractional playhead: number of commits applied. */
  position: number;
  /** Integer part of `position`; the replay is always seeked to this. */
  commitIndex: number;
  playing: boolean;
  speed: number;

  /** Selected / hovered building (path index). */
  selected: number | null;
  hovered: number | null;
  /** Selected district (directory path). */
  district: string | null;
  colorMode: ColorMode;
  /** Camera slowly orbits the city on its own (demos, recordings). */
  cinematic: boolean;

  load(snapshot: Snapshot): void;
  fail(message: string | null): void;
  setPosition(position: number): void;
  step(delta: number): void;
  togglePlay(): void;
  cycleSpeed(): void;
  select(path: number | null): void;
  selectFile(fileId: number): void;
  selectDistrict(dir: string | null): void;
  hover(path: number | null): void;
  setColorMode(mode: ColorMode): void;
  setCinematic(on: boolean): void;
}

export const useStore = create<State>((set, get) => ({
  status: 'loading',
  error: null,
  model: null,
  position: 0,
  commitIndex: 0,
  playing: false,
  speed: 1,
  selected: null,
  hovered: null,
  district: null,
  colorMode: 'heat',
  cinematic: new URLSearchParams(globalThis.location?.search ?? '').has('cinematic'),

  load(snapshot) {
    const model = buildCityModel(snapshot);
    model.replay.seek(model.commitCount);
    set({
      status: 'ready',
      error: null,
      model,
      position: model.commitCount,
      commitIndex: model.commitCount,
      playing: false,
      selected: null,
      hovered: null,
      district: null,
    });
  },

  fail(message) {
    set({ status: 'empty', error: message });
  },

  setPosition(position) {
    const { model } = get();
    if (!model) return;
    const clamped = Math.max(0, Math.min(model.commitCount, position));
    const commitIndex = Math.floor(clamped);
    if (commitIndex !== get().commitIndex) model.replay.seek(commitIndex);
    set({ position: clamped, commitIndex });
  },

  step(delta) {
    set({ playing: false });
    get().setPosition(get().commitIndex + delta);
  },

  togglePlay() {
    const { model, playing, position } = get();
    if (!model) return;
    // Pressing play at the end restarts the film from the first commit.
    if (!playing && position >= model.commitCount) get().setPosition(0);
    set({ playing: !playing });
  },

  cycleSpeed() {
    const current = SPEEDS.indexOf(get().speed as (typeof SPEEDS)[number]);
    set({ speed: SPEEDS[(current + 1) % SPEEDS.length]! });
  },

  select(path) {
    set({ selected: path, district: null });
  },

  selectFile(fileId) {
    const path = get().model?.pathOfFile[fileId];
    if (path !== undefined && path >= 0) set({ selected: path, district: null });
  },

  selectDistrict(dir) {
    set({ district: dir, selected: null });
  },

  hover(path) {
    if (path !== get().hovered) set({ hovered: path });
  },

  setColorMode(colorMode) {
    set({ colorMode });
  },

  setCinematic(cinematic) {
    set({ cinematic });
  },
}));
