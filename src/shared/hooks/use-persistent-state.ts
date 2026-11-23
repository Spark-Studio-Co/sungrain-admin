"use client";

import { useEffect, useState } from "react";

type PersistentStateOptions<T> = {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  enabled?: boolean;
};

function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: PersistentStateOptions<T> = {}
) {
  const { serialize = JSON.stringify, deserialize = JSON.parse, enabled = true } = options;
  const [value, setValue] = useState<T>(defaultValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHasHydrated(true);
      return;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        setValue(deserialize(storedValue));
        setRestoredFromStorage(true);
      }
    } catch {
      window.localStorage.removeItem(key);
    } finally {
      setHasHydrated(true);
    }
  }, [deserialize, key, enabled]);

  useEffect(() => {
    if (!hasHydrated || !enabled) return;

    try {
      window.localStorage.setItem(key, serialize(value));
    } catch {
      // Storage can be unavailable in private mode; keep the in-memory state.
    }
  }, [hasHydrated, key, serialize, value, enabled]);

  const clearPersistedValue = () => {
    if (enabled) window.localStorage.removeItem(key);
    setRestoredFromStorage(false);
    setValue(defaultValue);
  };

  return {
    value,
    setValue,
    hasHydrated,
    restoredFromStorage,
    clearPersistedValue,
  } as const;
}

export { usePersistentState };
