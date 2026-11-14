/**
 * Per-frame scene state shared between components without going through
 * React: the animated height of every building as currently drawn.
 */
export const live = {
  heights: new Float32Array(0),
};
