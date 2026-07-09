/**
 * renderTracker
 *
 * Development-only utility to COUNT and LOG component renders.
 * Helps prove that memoization is actually working.
 *
 * Usage:
 *   const renders = renderTracker.track('ProductCard');
 *   // Inside render: renders.current shows the count
 *
 * Senior dev note: Never leave this in production.
 * Use React DevTools Profiler for production profiling.
 */

const counts: Record<string, number> = {};

export const renderTracker = {
  track(componentName: string): number {
    if (!import.meta.env.DEV) return 0;
    counts[componentName] = (counts[componentName] ?? 0) + 1;
    return counts[componentName];
  },

  reset(componentName?: string) {
    if (componentName) {
      counts[componentName] = 0;
    } else {
      Object.keys(counts).forEach((k) => (counts[k] = 0));
    }
  },

  getAll() {
    return { ...counts };
  },

  logAll() {
    console.table(counts);
  },
};