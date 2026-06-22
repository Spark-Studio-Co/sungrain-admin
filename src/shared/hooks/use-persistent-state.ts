"use client";

import { useEffect, useState } from "react";

type PersistentStateOptions<T> = {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
};

function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: PersistentStateOptions<T> = {}
) {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;
  const [value, setValue] = useState<T>(defaultValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

  useEffect(() => {
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
  }, [deserialize, key]);

  useEffect(() => {
    if (!hasHydrated) return;

    try {
      window.localStorage.setItem(key, serialize(value));
    } catch {
      // Storage can be unavailable in private mode; keep the in-memory state.
    }
  }, [hasHydrated, key, serialize, value]);

  const clearPersistedValue = () => {
    window.localStorage.removeItem(key);
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
