/**
 * Things loaded the first time they are wanted — the demo apps, each its own
 * chunk. Asking again while one is on its way does not fetch it twice, and a
 * load that failed says so instead of leaving a blank page.
 */
export type Lazy<T> = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; value: T };

export interface LazyLoader<T> {
  /** Where the named thing is; null for a name it does not know. */
  (name: string): Lazy<T> | null;
  /** Forgets a failure and asks again. */
  retry(name: string): void;
}

export function lazyLoader<T>(
  loaders: Readonly<Record<string, () => Promise<T>>>,
  changed: () => void,
): LazyLoader<T> {
  const known = new Map<string, Lazy<T>>();

  const load = (name: string, loader: () => Promise<T>): void => {
    known.set(name, { state: 'loading' });
    loader()
      .then(
        (value) => known.set(name, { state: 'ready', value }),
        () => known.set(name, { state: 'failed' }),
      )
      .finally(changed);
  };

  const get = (name: string): Lazy<T> | null => {
    const loader = Object.hasOwn(loaders, name) ? loaders[name] : undefined;
    if (!loader) return null;
    if (!known.has(name)) load(name, loader);
    return known.get(name)!;
  };

  return Object.assign(get, {
    retry(name: string): void {
      const loader = loaders[name];
      if (loader && known.get(name)?.state === 'failed') load(name, loader);
    },
  });
}
