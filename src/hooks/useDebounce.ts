import { useEffect, useState } from 'react';

/**
 * Debounce a value — only returns the latest value after the user has
 * stopped changing it for `delay` ms.
 *
 * Use case: search inputs, filters — anything where you don't want to
 * fire a network request on every keystroke.
 *
 * How it works: every time `value` changes, we schedule a timeout to
 * update `debouncedValue`. If `value` changes again before that timeout
 * fires, the cleanup function cancels the pending timeout and a new one
 * is scheduled. Only the LAST value in a burst of changes survives.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup runs BEFORE the next effect, or on unmount.
    // This is what cancels the previous timer when value changes again.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}