import { useState } from 'react';

// React's "adjust state when props change" pattern: runs `reset` during render
// (not in an effect) when `deps` change, and on first render, if `when` holds.
export function useResetOnChange(deps: readonly unknown[], reset: () => void, when = true) {
  const [prev, setPrev] = useState<readonly unknown[] | null>(null);
  if (prev === null || deps.some((d, i) => !Object.is(d, prev[i]))) {
    setPrev(deps);
    if (when) reset();
  }
}
