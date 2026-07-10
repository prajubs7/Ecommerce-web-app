import { Suspense, lazy, type ComponentType } from 'react';
import { PageLoader }                    from '../components/PageLoader';

interface LazyRouteProps {
  fallback?: React.ReactNode;
}

export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <PageLoader />
) {
  const LazyComponent = lazy(importFn);

  return function LazyRoute(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}