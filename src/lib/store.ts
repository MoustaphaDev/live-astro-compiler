import { type Accessor, createResource, createSignal } from "solid-js";
import { getParseResult, getTransformResult } from "~/lib/utils";
import { debounce } from "@solid-primitives/scheduled";
import type { Modes } from "./types";

export const [code, setCode] = usePersistantSignal("code-input-value", "");

// export const [shikiTheme, setShikiTheme] = usePersistantSignal<AvailableThemes>(
//   "playground-theme",
//   "vitesse-dark",
//   0
// );

export const [mode, setMode] = usePersistantSignal<Modes>(
  "compiler-mode",
  "transform"
);

export const [transformResult] = createResource(code, getTransformResult);
export const [parseResult] = createResource(code, getParseResult);

export const isCompilerLoaded = () =>
  !transformResult.loading && !parseResult.loading;

export const compilerOutput = () => {
  if (mode() === "parse") {
    return parseResult();
  }
  return transformResult();
};

function usePersistantSignal<T>(
  key: string,
  initialValue: T,
  saveDelay = 1500
): [Accessor<T>, (value: T) => void] {
  const valueToPassToSignal = getPersistantValue(key, initialValue);
  const [getter, _setter] = createSignal(valueToPassToSignal);

  // Return a wrapped version of createSignal's setter function that ...
  // ... persists the new value to localStorage.

  const savePersistentValue = debounce((key: string, value) => {
    setPersistentValue(key, value);
  }, saveDelay);

  const setter = (updatedValue: T) => {
    _setter(() => updatedValue);
    savePersistentValue(key, updatedValue);
  };

  return [getter, setter];
}

/*
 * Only primitive types, objects and arrays are supported
 */
export function getPersistantValue<T>(key: string, initialValue: T): T {
  let value: T;
  if (typeof window === "undefined") {
    value = initialValue;
  }
  try {
    // Get from local storage by key
    const item = window.localStorage.getItem(key);
    // Parse stored json or if none return the initial value
    value = item ? JSON.parse(item) : initialValue;
  } catch (error) {
    // If error also return the initial valvue
    console.warn(error);
    value = initialValue;
  }
  return value;
}

export function setPersistentValue<T>(
  key: string,
  value: T,
  onSet?: (key: string, value: T) => void
): T {
  window.localStorage.setItem(key, JSON.stringify(value));
  onSet?.(key, value);
  return value;
}
