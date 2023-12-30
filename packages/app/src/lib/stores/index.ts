import { createBreakpoints } from "@solid-primitives/media";
import { SearchParamsHelpers, usePersistentSignal } from "./utils";
import { INITIAL_CODE, breakpoints } from "../consts";
import { createSignal } from "solid-js";
import type { StoredSearchParams } from "~/lib/types";
import { getFallbackCompilerVersion } from "../compiler/module";
import { createCompilerOutputGetter, initializeCompiler } from "./compiler";
import { LAST_USED_COMPILER_VERSION_KEY } from "../compiler/storage";

// Here's the state initialization flow:
// 1. Get the initial value from the URL search params
// 2. Otherwise get the persisted value from localStorage
// 3. Fallback to a default value if specified

// ################################ EDITOR SIGNALS HERE ################################
const urlSearchParams = SearchParamsHelpers.parsePlaygroundStateFromURL();
SearchParamsHelpers.clearPlaygroundStateFromURL();

// IMPORTANT: DO NOT CHANGE ANY OF THE KEY NAMES
// AS THEY ARE USED TO GENERATE THE STATEFUL LINKS
// AND CHANGING THEM WILL BREAK THE PREVIOUSLY GENERATED LINKS

// TODO refactor `usePersistantSignal` to not need to be passed a generic type
const { fallbackCompilerVersion } = await getFallbackCompilerVersion();
export const [currentCompilerVersion, setCurrentCompilerVersion] =
  usePersistentSignal<StoredSearchParams["currentCompilerVersion"]>({
    // current-compiler-version
    key: LAST_USED_COMPILER_VERSION_KEY,
    initialValueSetter: (persisted) => {
      return (
        urlSearchParams.currentCompilerVersion ??
        persisted ??
        fallbackCompilerVersion
      );
    },
  });

export const [
  hasCompilerVersionChangeBeenHandled,
  setHasCompilerVersionChangeBeenHandled,
] = createSignal(false);

export const [code, setCode] = usePersistentSignal<StoredSearchParams["code"]>({
  key: "code-input-value",
  initialValueSetter: (persisted) => {
    return urlSearchParams.code ?? persisted ?? INITIAL_CODE;
  },
});

export const [mode, setMode] = usePersistentSignal<StoredSearchParams["mode"]>({
  key: "compiler-mode",
  initialValueSetter: (persisted) =>
    urlSearchParams.mode ?? persisted ?? "transform",
});

export const [wordWrapped, setWordWrapped] = usePersistentSignal<
  StoredSearchParams["wordWrapped"]
>({
  key: "inputbox-wordwrap",
  initialValueSetter: (persisted) =>
    urlSearchParams.wordWrapped ?? persisted ?? false,
});

export const [showSourceMapVisualizer, setShowSourceMapVisualizer] =
  createSignal(false);

export const [showMobilePreview, setShowMobilePreview] = createSignal(false);
export const breakpointMatches = createBreakpoints(breakpoints);

// ################################ COMPILER SIGNALS HERE ################################

// Since the compiler types don't change very often, we can just hard code
// the options and it

// Parse options
export const [parsePosition, setParsePosition] = usePersistentSignal<
  StoredSearchParams["parsePosition"]
>({
  key: "parse-position",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.parsePosition ?? false,
});

// Transform options
export const [transformInternalURL, setTransformInternalURL] =
  usePersistentSignal<StoredSearchParams["transformInternalURL"]>({
    key: "transform-internalURL",
    initialValueSetter: (persisted) =>
      persisted ?? urlSearchParams?.transformInternalURL ?? "",
  });

export const [transformSourcemap, setTransformSourcemap] = usePersistentSignal<
  StoredSearchParams["transformSourcemap"]
>({
  key: "transform-sourcemap",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.transformSourcemap ?? false,
});

export const [transformAstroGlobalArgs, setTransformAstroGlobalArgs] =
  usePersistentSignal<StoredSearchParams["transformAstroGlobalArgs"]>({
    key: "transform-astroGlobalArgs",
    initialValueSetter: (persisted) =>
      persisted ?? urlSearchParams?.transformAstroGlobalArgs ?? "",
  });

export const [transformCompact, setTranformCompact] = usePersistentSignal<
  StoredSearchParams["transformCompact"]
>({
  key: "transform-compact",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.transformCompact ?? false,
});

export const [transformResultScopedSlot, setTransformResultScopedSlot] =
  usePersistentSignal<StoredSearchParams["transformResultScopedSlot"]>({
    key: "transform-resultScopedSlot",
    initialValueSetter: (persisted) =>
      persisted ?? urlSearchParams?.transformResultScopedSlot ?? false,
  });

// Common options (convertToTSX, transform)
export const [filename, setFilename] = usePersistentSignal<
  StoredSearchParams["filename"]
>({
  key: "filename",
  initialValueSetter: (persisted) => persisted ?? urlSearchParams?.filename,
});

export const [normalizedFilename, setNormalizedFilename] = usePersistentSignal<
  StoredSearchParams["normalizedFilename"]
>({
  key: "normalizedFilename",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.normalizedFilename,
});

// ################################ HOOKS AND EFFECTS HERE ################################
export const { getCompilerOutput, getOutputByMode } =
  createCompilerOutputGetter();

SearchParamsHelpers.trackStateSignals({
  currentCompilerVersion,
  code,
  wordWrapped,
  mode,
  parsePosition,
  transformInternalURL,
  filename,
  normalizedFilename,
  transformSourcemap,
  transformAstroGlobalArgs,
  transformCompact,
  transformResultScopedSlot,
});
