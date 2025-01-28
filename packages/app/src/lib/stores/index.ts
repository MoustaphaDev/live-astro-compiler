import { createBreakpoints } from "@solid-primitives/media";
import { SearchParamsHelpers, usePersistentSignal } from "./utils";
import { breakpoints, INITIAL_CODE } from "../consts";
import { createSignal } from "solid-js";
import type { StoredSearchParams } from "~/lib/types";
import { getFallbackCompilerVersion } from "../compiler/module";
import { createCompilerOutputGetter } from "./compiler";
import { LAST_USED_COMPILER_VERSION_KEY } from "../compiler/storage";
import { createEffect } from "solid-js";
import { debugLog } from "../utils";

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
// ILL NEED TO CREATE A FALLBACK SYSTEM IF I EVER NEED TO CHANGE THEM

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

// advanced view signals
export const [viewDetailedResults, setViewDetailedResults] =
  usePersistentSignal<StoredSearchParams["viewDetailedResults"]>({
    key: "view-detailed-results",
    initialValueSetter: (persisted) =>
      urlSearchParams.viewDetailedResults ?? persisted ?? false,
  });

export const [selectedTransformTab, setSelectedTransformTab] =
  usePersistentSignal<StoredSearchParams["selectedTransformTab"]>({
    key: "selected-transform-tab",
    initialValueSetter: (persisted) =>
      urlSearchParams.selectedTransformTab ?? persisted ?? "code",
  });

export const [selectedTSXTab, setSelectedTSXTab] = usePersistentSignal<
  StoredSearchParams["selectedTSXTab"]
>({
  key: "selected-tsx-tab",
  initialValueSetter: (persisted) =>
    urlSearchParams.selectedTSXTab ?? persisted ?? "code",
});

import.meta.env.DEV &&
  createEffect(() => {
    debugLog(
      "selectedTSXTab:%s\nselectedTransformTab:%s",
      selectedTSXTab(),
      selectedTransformTab(),
    );
  });

// ################################ COMPILER SIGNALS HERE ################################

// Since the compiler types don't change very often, we can just hard code
// the options and it

// Parse options
export const [parsePosition, setParsePosition] = usePersistentSignal<
  StoredSearchParams["parsePosition"]
>({
  key: "parse-position",
  initialValueSetter: (persisted) =>
    urlSearchParams.parsePosition ?? persisted ?? false,
});

// Transform options
export const [transformInternalURL, setTransformInternalURL] =
  usePersistentSignal<StoredSearchParams["transformInternalURL"]>({
    key: "transform-internalURL",
    initialValueSetter: (persisted) =>
      urlSearchParams.transformInternalURL ?? persisted ?? "",
  });

export const [transformSourcemap, setTransformSourcemap] = usePersistentSignal<
  StoredSearchParams["transformSourcemap"]
>({
  key: "transform-sourcemap",
  initialValueSetter: (persisted) =>
    urlSearchParams.transformSourcemap ?? persisted ?? false,
});

export const [transformAstroGlobalArgs, setTransformAstroGlobalArgs] =
  usePersistentSignal<StoredSearchParams["transformAstroGlobalArgs"]>({
    key: "transform-astroGlobalArgs",
    initialValueSetter: (persisted) =>
      urlSearchParams.transformAstroGlobalArgs ?? persisted ?? "",
  });

export const [transformCompact, setTranformCompact] = usePersistentSignal<
  StoredSearchParams["transformCompact"]
>({
  key: "transform-compact",
  initialValueSetter: (persisted) =>
    urlSearchParams.transformCompact ?? persisted ?? false,
});

export const [transformAnnotateSourceFile, setTransformAnnotateSourceFile] =
  usePersistentSignal<StoredSearchParams["transformAnnotateSourceFile"]>({
    key: "transform-annotate-source",
    initialValueSetter: (persisted) =>
      urlSearchParams.transformAnnotateSourceFile ?? persisted ?? false,
  });

export const [transformResultScopedSlot, setTransformResultScopedSlot] =
  usePersistentSignal<StoredSearchParams["transformResultScopedSlot"]>({
    key: "transform-resultScopedSlot",
    initialValueSetter: (persisted) =>
      urlSearchParams.transformResultScopedSlot ?? persisted ?? false,
  });

export const [transformRenderScript, setTransformRenderScript] =
  usePersistentSignal<StoredSearchParams["transformRenderScript"]>({
    key: "render-script",
    initialValueSetter: (persisted) =>
      urlSearchParams.transformRenderScript ?? persisted ?? true,
  });

// Common options (convertToTSX, transform)
export const [filename, setFilename] = usePersistentSignal<
  StoredSearchParams["filename"]
>({
  key: "filename",
  initialValueSetter: (persisted) => urlSearchParams.filename ?? persisted,
});

export const [normalizedFilename, setNormalizedFilename] = usePersistentSignal<
  StoredSearchParams["normalizedFilename"]
>({
  key: "normalizedFilename",
  initialValueSetter: (persisted) =>
    urlSearchParams.normalizedFilename ?? persisted,
});

// ################################ HOOKS AND EFFECTS HERE ################################
export const { getCompilerOutput, getOutputByMode } =
  createCompilerOutputGetter();

SearchParamsHelpers.trackStateSignals({
  currentCompilerVersion,
  code,
  wordWrapped,
  mode,
  viewDetailedResults,
  selectedTSXTab,
  selectedTransformTab,
  parsePosition,
  transformInternalURL,
  filename,
  normalizedFilename,
  transformSourcemap,
  transformAstroGlobalArgs,
  transformAnnotateSourceFile,
  transformCompact,
  transformResultScopedSlot,
  transformRenderScript,
});
