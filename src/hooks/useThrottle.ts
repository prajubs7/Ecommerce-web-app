import { useRef, useCallback } from 'react';

/**
 * Throttle a callback — guarantees it runs at most once per `limit` ms,
 * no matter how many times it's called in that window.
 *
 * Use case: scroll handlers, resize handlers, mousemove — high-frequency
 * events where you want REGULAR updates, not just the final one.
 *
 * Debounce vs throttle, in one line:
 * - Debounce: wait for silence, then act once (search box)
 * - Throttle: act at a steady rate no matter what (infinite scroll, drag)
 */
export function useThrottle<Args extends unknown[]>(
  callback: (...args: Args) => void,
  limit = 300
) {
  const lastRun = useRef(Date.now() - limit); // allow immediate first call

  return useCallback(
    (...args: Args) => {
      const now = Date.now();
      if (now - lastRun.current >= limit) {
        lastRun.current = now;
        callback(...args);
      }
    },
    [callback, limit]
  );
}