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

export const [isWordWrap, setWordWrap] = usePersistantSignal(
  "inputbox-wordwrap",
  false
);

export const [transformResult] = createResource(code, getTransformResult);
export const [parseResult] = createResource(code, getParseResult);

export const compilerOutput = () => {
  if (mode() === "parse") {
    return parseResult();
  }
  return transformResult();
};

export const [isAstroCompilerInitialized, setIsAstroCompilerInitialized] =
  createSignal(false);

// doesn't match all overloads of signals to simplify to code
type PersistantSetter<T> = (v: T | SetterFunction<T>) => T;
type PersistantSignal<T> = [Accessor<T>, PersistantSetter<T>];
type SetterFunction<T> = (prev?: T) => T;

function isVFunction<T>(
  value: T | SetterFunction<T>
): value is SetterFunction<T> {
  return typeof value === "function";
}

export function usePersistantSignal<T>(
  key: string,
  initialValue: T,
  saveDelay = 1500
): PersistantSignal<T> {
  const valueToPassToSignal = getPersistantValue(key, initialValue);
  const [getter, _setter] = createSignal(valueToPassToSignal);

  // Return a wrapped version of createSignal's setter function that ...
  // ... persists the new value to localStorage.

  const savePersistentValue = debounce((key: string, value) => {
    setPersistentValue(key, value);
  }, saveDelay);

  const setter: PersistantSetter<T> = (v) => {
    const updatedValue = _setter((prev) => {
      if (isVFunction(v)) {
        return v(prev);
      }
      return v;
    });
    savePersistentValue(key, v);
    return updatedValue;
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

export function setPersistentValue<T>(key: string, value: T): T {
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}
