import { createStore } from '@mantou/gem';

import { logger } from 'src/logger';

export function createCacheStore<T extends Record<string, any>>(
  storageKey: string,
  initStore: T,
  options?: { cacheExcludeKeys?: (keyof T)[]; prefix?: string },
) {
  const cacheExcludeKeys = new Set(options?.cacheExcludeKeys || []);
  const key = options?.prefix ? `${options.prefix}@${storageKey}` : storageKey;

  let storeCache: T | undefined = undefined;
  try {
    storeCache = JSON.parse(localStorage.getItem(key) || '{}');
  } catch (err) {
    logger.warn(err);
  }

  const store = createStore<T>(storeCache ? { ...initStore, ...storeCache } : initStore);

  const setStore = () => {
    localStorage.setItem(
      key,
      JSON.stringify(Object.fromEntries(Object.entries(store).filter(([key]) => !cacheExcludeKeys.has(key)))),
    );
  };

  window.addEventListener('pagehide', setStore);

  return [store, setStore] as const;
}
