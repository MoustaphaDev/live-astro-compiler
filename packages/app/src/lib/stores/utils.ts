import { debounce } from "@solid-primitives/scheduled";
import { type Accessor, createSignal } from "solid-js";
import { StoredSearchParams, type StoredSignals } from "../types";
import * as fflate from "fflate";
import { debugLog } from "../utils";

// doesn't match all signatures of signals, this is just what we need
export type PersistentSignal<T> = [Accessor<T>, PersistentSignalSetter<T>];
type PersistentSignalSetter<T> = (v: T | SignalSetterFunction<T>) => T;
type SignalSetterFunction<T> = (prev?: T) => T;

type PersistantSignalOptions<T> = {
  saveDelay?: number;
  key: string;
  initialValueSetter: (persistedValue?: T | undefined) => T;
};

function isVFunction<T>(
  value: T | SignalSetterFunction<T>,
): value is SignalSetterFunction<T> {
  return typeof value === "function";
}

// TODO: refactor to not need to be passed a generic type
// automatically infer the return type, if possible

export function usePersistentSignal<T>({
  saveDelay = 1500,
  key,
  initialValueSetter,
}: PersistantSignalOptions<T>): PersistentSignal<T> {
  const persistedValue = getPersistedValue(key);
  const valueOnLoad = initialValueSetter(persistedValue);

  // Persist the initial value to localStorage regardless
  // of whether it was loaded from localStorage or not
  setPersistentValue(key, valueOnLoad);

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
  }) satisfies PersistentSignalSetter<T>;

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
      ? (JSON.parse(item) as U)
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

/**
 * This function is used to return a function reference from a hash of functions
 * This is useful when we expect to pass to `createResource` a fetcher that can change
 * @param hash The hash containing the functions
 * @param functionToPick The function to pick from the hash
 * @returns A function that will call the functionToPick from the hash
 */
export function returnFunctionReferenceFromHash<
  Hash extends Record<string, (...args: any[]) => any>,
  FnToPick extends keyof Hash,
  FnToReturn extends Hash[FnToPick],
>(hash: Hash, functionToPick: FnToPick) {
  return (...args: Parameters<FnToReturn>): ReturnType<FnToReturn> => {
    return hash[functionToPick](...args);
  };
}

// TODO: implement caching to avoid
// re-computing the stateful URL when
// its dependencies haven't changed
export class SearchParamsHelpers {
  private static stateSignals: StoredSignals;
  static trackStateSignals(stateSignals: StoredSignals) {
    this.stateSignals = stateSignals;
  }
  static computePlaygroundStatefulURL() {
    const hashedPlaygroundStateSnapshot =
      this.computeHashedPlaygroundStateSnapshot();
    const urlParams = hashedPlaygroundStateSnapshot
      ? `?${new URLSearchParams(
          `?editor-state=${hashedPlaygroundStateSnapshot}`,
        ).toString()}`
      : "";
    const statefulUrl = `${window.location.origin}${window.location.pathname}${urlParams}`;
    return statefulUrl;
  }

  static clearPlaygroundStateFromURL() {
    // remove the search params from the URL
    window.history.replaceState({}, "", window.location.pathname);
  }

  static parsePlaygroundStateFromURL(): Partial<StoredSearchParams> {
    const urlParams = new URLSearchParams(window.location.search);
    const stringifiedEditorStateSnapshot = urlParams.get("editor-state");

    if (!stringifiedEditorStateSnapshot) {
      debugLog("No editor state found in URL");
      return {};
    }
    try {
      const binaryData = new Uint8Array(
        JSON.parse(window.atob(stringifiedEditorStateSnapshot)),
      );
      const decompressedBinaryData = fflate.decompressSync(binaryData);
      const decoder = new TextDecoder();
      const decompressedSnapshotString = decoder.decode(decompressedBinaryData);

      debugLog("Found editor state in URL");
      return JSON.parse(decompressedSnapshotString);
    } catch (err) {
      debugLog("Failed to parse editor state from URL");
      return {};
    }
  }

  private static computeHashedPlaygroundStateSnapshot(): string | null {
    const playgroundStateSnapshot = this.getPlaygroundStateSnapshot();
    if (Object.keys(playgroundStateSnapshot).length === 0) {
      return null;
    }
    try {
      const stringifiedSnapshot = JSON.stringify(playgroundStateSnapshot);
      const binarifiedSnapshot = fflate.strToU8(stringifiedSnapshot);
      const compressedSnapshot = fflate.compressSync(binarifiedSnapshot, {
        level: 9,
      });
      const stringifiedCompressedSnapshot = JSON.stringify(
        Array.from(compressedSnapshot),
      );
      return window.btoa(stringifiedCompressedSnapshot);
    } catch (err) {
      return null;
    }
  }

  private static getPlaygroundStateSnapshot(): StoredSearchParams {
    debugLog("Computing editor state snapshot");
    return {
      currentCompilerVersion: this.stateSignals.currentCompilerVersion?.(),
      code: this.stateSignals.code?.(),
      wordWrapped: this.stateSignals.wordWrapped?.(),
      mode: this.stateSignals.mode?.(),
      parsePosition: this.stateSignals.parsePosition?.(),
      transformInternalURL: this.stateSignals.transformInternalURL?.(),
      filename: this.stateSignals.filename?.(),
      normalizedFilename: this.stateSignals.normalizedFilename?.(),
      transformSourcemap: this.stateSignals.transformSourcemap?.(),
      transformAstroGlobalArgs: this.stateSignals.transformAstroGlobalArgs?.(),
      transformCompact: this.stateSignals.transformCompact?.(),
      transformResultScopedSlot:
        this.stateSignals.transformResultScopedSlot?.(),
      viewDetailedResults: this.stateSignals.viewDetailedResults?.(),
      selectedTransformTab: this.stateSignals.selectedTransformTab?.(),
      selectedTSXTab: this.stateSignals.selectedTSXTab?.(),
    };
  }
}
