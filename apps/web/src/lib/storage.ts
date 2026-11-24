import { Debouncer } from "@tanstack/react-pacer";

export interface StateStorage<R = unknown> {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => R;
  removeItem: (name: string) => R;
}

export interface DeferredStorage<TValue> {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: TValue) => void;
  removeItem: (name: string) => void;
  flush: () => void;
}

export function createMemoryStorage(): StateStorage {
  const store = new Map<string, string>();
  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
  };
}

function isStateStorage(
  storage: Partial<StateStorage> | null | undefined,
): storage is StateStorage {
  return (
    storage !== null &&
    storage !== undefined &&
    typeof storage.getItem === "function" &&
    typeof storage.setItem === "function" &&
    typeof storage.removeItem === "function"
  );
}

export function resolveStorage(storage: Partial<StateStorage> | null | undefined): StateStorage {
  return isStateStorage(storage) ? storage : createMemoryStorage();
}

/** Read a previous layout key until the browser can persist the Lancer copy. */
export function resolveLayoutStorage(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined,
): StateStorage {
  if (!isStateStorage(storage)) return createMemoryStorage();
  const previous = (key: string) => key.replace(/^lancer:/, "t3code:");
  return {
    getItem(key) {
      const current = storage.getItem(key);
      if (current !== null) return current;
      const legacy = storage.getItem(previous(key));
      if (legacy === null) return null;
      try {
        storage.setItem(key, legacy);
        storage.removeItem(previous(key));
      } catch {
        // A full store or read-only browser can still restore the previous layout.
      }
      return legacy;
    },
    setItem(key, value) {
      storage.setItem(key, value);
      storage.removeItem(previous(key));
    },
    removeItem(key) {
      storage.removeItem(previous(key));
      storage.removeItem(key);
    },
  };
}

export function createDeferredStorage<TValue>(
  baseStorage: Partial<StateStorage> | null | undefined,
  serialize: (value: TValue) => string,
  debounceMs: number = 300,
): DeferredStorage<TValue> {
  const resolvedStorage = resolveStorage(baseStorage);
  const debouncedSetItem = new Debouncer(
    (name: string, value: TValue) => {
      resolvedStorage.setItem(name, serialize(value));
    },
    { wait: debounceMs },
  );

  return {
    getItem: (name) => resolvedStorage.getItem(name),
    setItem: (name, value) => {
      debouncedSetItem.maybeExecute(name, value);
    },
    removeItem: (name) => {
      debouncedSetItem.cancel();
      // cancel() leaves the captured value in Pacer's lastArgs.
      debouncedSetItem.reset();
      resolvedStorage.removeItem(name);
    },
    flush: () => {
      debouncedSetItem.flush();
    },
  };
}
