import { debounce } from "@solid-primitives/scheduled";
import { type Accessor, createSignal } from "solid-js";

// doesn't match all overloads of signals, this is just what we need
type PersistantSignal<T> = [Accessor<T>, PersistantSignalSetter<T>];
type PersistantSignalSetter<T> = (v: T | SignalSetterFunction<T>) => T;
type SignalSetterFunction<T> = (prev?: T) => T;

type PersistantSignalOptions<T> = {
  saveDelay?: number;
  key: string;
  initialValueSetter: (persistedValue: T) => T;
};

function isVFunction<T>(
  value: T | SignalSetterFunction<T>,
): value is SignalSetterFunction<T> {
  return typeof value === "function";
}

// TODOL refactor to not need to be passed a generic type
// automatically infer the return type

export function usePersistantSignal<T>({
  saveDelay = 1500,
  key,
  initialValueSetter,
}: PersistantSignalOptions<T>): PersistantSignal<T> {
  const persistedValue = getPersistedValue(key);
  const valueOnLoad = initialValueSetter(persistedValue);

  if (persistedValue === null) {
    setPersistentValue(key, valueOnLoad);
  }

  const [getter, _setter] = createSignal(valueOnLoad);

  const onAfterSet = debounce((key: string, value: T) => {
    setPersistentValue(key, value);
  }, saveDelay);

  // Return a wrapped version of createSignal's setter function that ...
  // ... persists the new value to localStorage.
  const setter = ((v) => {
    const updatedValue = _setter((prev) => {
      if (isVFunction(v)) {
        return v(prev);
      }
      return v;
    });
    onAfterSet(key, updatedValue);
    return updatedValue;
  }) satisfies PersistantSignalSetter<T>;

  return [getter, setter];
}

/*
 * Only primitive types, objects and arrays are supported
 */
export function getPersistedValue<U = any>(key: string) {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    // Get from local storage by key
    const item = window.localStorage.getItem(key);
    // Parse stored json or if none return the initial value
    return item && typeof item !== "undefined" && item !== "undefined"
      ? ((console.log({ item }), JSON.parse(item)) as U)
      : null;
  } catch (error) {
    // If error also return the initial valvue
    console.warn(error);
    return null;
  }
}

export function setPersistentValue<T>(key: string, value: T): T {
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

type DebouncedFunction<T> = (...args: any) => Promise<T>;
export function asyncDebounce<T>(
  fn: DebouncedFunction<T>,
  ms = 500,
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout;
  return async (...args: any) => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(async () => {
        resolve(await fn(...args));
      }, ms);
    });
  };
}
