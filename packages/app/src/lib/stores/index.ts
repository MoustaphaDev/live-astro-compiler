import { createBreakpoints } from "@solid-primitives/media";
import * as fflate from "fflate";
import { usePersistantSignal } from "./utils";
import { createStore } from "solid-js/store";
import { INITIAL_CODE, breakpoints } from "../consts";
import
{
  batch,
  createEffect,
  createRenderEffect,
  createResource,
  createSignal,
  on,
} from "solid-js";
import type {
  ConsumedConvertToTSXOptions,
  ConsumedParseOptions,
  ConsumedTransformOptions,
  EditorsHash,
  StoredSearchParams,
} from "~/lib/types";
import
{
  createHashFromCompiledCode,
  getParseResult,
  getTSXResult,
  getTransformResult,
} from "~/lib/utils";
import { remoteCompilerModule, remoteCompilerVersion } from "../compiler/module";

const DEFAULT_COMPILER_VERSION = "2.3.2"

// Here's the state initialization flow:
// 1. Get the initial value from the URL search params
// 2. Otherwise get the persisted value from localStorage
// 3. Fallback to a default value if specified

// ################################ EDITOR SIGNALS HERE ################################
const hookResult = useSearchParams();
const { setUrlSearchParamsRecord, getSearchParams } = hookResult;
export const { getStatefulURL } = hookResult;

const urlSearchParams = getSearchParams();

// TODOL refactor `usePersistantSignal` to not need to be passed a generic type
export const [code, setCode] = usePersistantSignal<StoredSearchParams["code"]>({
  key: "code-input-value",
  initialValueSetter: (persisted) =>
  {
    return urlSearchParams.code ?? persisted ?? INITIAL_CODE;
  },
});

export const [currentCompilerVersion, setCurrentCompilerVersion] = usePersistantSignal<StoredSearchParams["currentCompilerVersion"]>({
  key: "current-compiler-version",
  initialValueSetter: (persisted) =>
  {
    return urlSearchParams.currentCompilerVersion ?? persisted ?? remoteCompilerVersion;
  },
});

export const [mode, setMode] = usePersistantSignal<StoredSearchParams["mode"]>({
  key: "compiler-mode",
  initialValueSetter: (persisted) =>
    urlSearchParams.mode ?? persisted ?? "transform",
});

export const [wordWrapped, setWordWrapped] = usePersistantSignal<
  StoredSearchParams["wordWrapped"]
>({
  key: "inputbox-wordwrap",
  initialValueSetter: (persisted) =>
    urlSearchParams.wordWrapped ?? persisted ?? false,
});

export const [isAstroCompilerInitialized, setIsAstroCompilerInitialized] =
  createSignal(false);

export const [sourceMapVisualizerUrl, setSourceMapVisualizerUrl] = createSignal<
  null | string
>(null);

export const [showSourceMapVisualizer, setShowSourceMapVisualizer] =
  createSignal(false);

export const [showMobilePreview, setShowMobilePreview] = createSignal(false);
export const breakpointMatches = createBreakpoints(breakpoints);

// ################################ COMPILER SIGNALS HERE ################################

// Since the compiler types don't change very often, we can just hard code
// the options and it

// Parse options
export const [parsePosition, setParsePosition] = usePersistantSignal<
  StoredSearchParams["parsePosition"]
>({
  key: "parse-position",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.parsePosition,
});

// Transform options
export const [transformInternalURL, setTransformInternalURL] =
  usePersistantSignal<StoredSearchParams["transformInternalURL"]>({
    key: "transform-internalURL",
    initialValueSetter: (persisted) =>
      persisted ?? urlSearchParams?.transformInternalURL,
  });

export const [transformSourcemap, setTransformSourcemap] = usePersistantSignal<
  StoredSearchParams["transformSourcemap"]
>({
  key: "transform-sourcemap",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.transformSourcemap,
});

export const [transformAstroGlobalArgs, setTransformAstroGlobalArgs] =
  usePersistantSignal<StoredSearchParams["transformAstroGlobalArgs"]>({
    key: "transform-astroGlobalArgs",
    initialValueSetter: (persisted) =>
      persisted ?? urlSearchParams?.transformAstroGlobalArgs,
  });

export const [transformCompact, setTranformCompact] = usePersistantSignal<
  StoredSearchParams["transformCompact"]
>({
  key: "transform-compact",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.transformCompact,
});

export const [transformResultScopedSlot, setTransformResultScopedSlot] =
  usePersistantSignal<StoredSearchParams["transformResultScopedSlot"]>({
    key: "transform-resultScopedSlot",
    initialValueSetter: (persisted) =>
      persisted ?? urlSearchParams?.transformResultScopedSlot,
  });

// Common options (convertToTSX, transform)
export const [filename, setFilename] = usePersistantSignal<
  StoredSearchParams["filename"]
>({
  key: "filename",
  initialValueSetter: (persisted) => persisted ?? urlSearchParams?.filename,
});

export const [normalizedFilename, setNormalizedFilename] = usePersistantSignal<
  StoredSearchParams["normalizedFilename"]
>({
  key: "normalizedFilename",
  initialValueSetter: (persisted) =>
    persisted ?? urlSearchParams?.normalizedFilename,
});

// ################################ DERIVED SIGNALS HERE ################################

const consumedTransformOptions = () =>
{
  return {
    code: code(),
    transformOptions: {
      internalURL: transformInternalURL(),
      filename: filename(),
      normalizedFilename: normalizedFilename(),
      sourcemap: transformSourcemap(),
      astroGlobalArgs: transformAstroGlobalArgs(),
      compact: transformCompact(),
      resultScopedSlot: transformResultScopedSlot(),
    },
  } satisfies ConsumedTransformOptions;
};

const consumedParseOptions = () =>
{
  return {
    code: code(),
    parseOptions: {
      position: parsePosition(),
    },
  } satisfies ConsumedParseOptions;
};

const consumedTSXOptions = () =>
{
  return {
    code: code(),
    convertToTSXOptions: {
      filename: filename(),
      normalizedFilename: normalizedFilename(),
    },
  } satisfies ConsumedConvertToTSXOptions;
};

const [transformResult] = createResource(
  consumedTransformOptions,
  getTransformResult
);
const [parseResult] = createResource(consumedParseOptions, getParseResult);
export const [tsxResult] = createResource(consumedTSXOptions, getTSXResult);

export const compilerOutput = () =>
{
  switch (mode()) {
    case "parse":
      return parseResult();
    case "transform":
      return transformResult();
    case "TSX":
      return tsxResult();
    default:
      throw new Error("Invalid option");
  }
};


// ################################ HOOKS AND UTILITY FUNCTIONS HERE ################################

export function useCompilerOutput(editorInstances: EditorsHash)
{
  const isString = (value: unknown): value is string =>
    typeof value === "string";
  function getResult()
  {
    const _output = compilerOutput();
    const output = isString(_output) ? _output : _output?.code;
    return output;
  }

  createEffect(
    on(compilerOutput, () =>
    {
      editorInstances?.codeCompiler?.setValue(getResult() ?? "");
    })
  );
  return {
    unwrappedCompilerOutput: getResult,
  };
}

function useSearchParams()
{
  const decoded = _getDecodedURLState();
  const [urlSearchParamsRecord, setUrlSearchParamsRecord] =
    createStore<StoredSearchParams>(decoded);

  function getStatefulURL()
  {
    const encoded = _getEncodedURLState();
    const urlParams = encoded
      ? `?${new URLSearchParams(`?editor-state=${encoded}`).toString()}`
      : "";
    const statefulUrl = `${window.location.origin}${window.location.pathname}${urlParams}`;
    return statefulUrl;
  }

  function _getSearchParams(): StoredSearchParams
  {
    return { ...urlSearchParamsRecord };
  }


  function _getEncodedURLState(): string | null
  {
    if (Object.keys(urlSearchParamsRecord).length === 0) {
      return null;
    }
    const stringified = JSON.stringify(urlSearchParamsRecord);
    try {
      const unint8Data = fflate.strToU8(stringified);
      const compressedData = fflate.compressSync(unint8Data, { level: 9 });
      const compressedString = JSON.stringify(Array.from(compressedData));
      return window.btoa(compressedString);
    } catch (err) {
      return null;
    }
  }

  function _getDecodedURLState(): StoredSearchParams
  {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get("editor-state");

    if (!state) {
      return {};
    }
    try {
      const compressedArray = new Uint8Array(JSON.parse(window.atob(state)));
      const decompressedArray = fflate.decompressSync(compressedArray);
      const decoder = new TextDecoder();
      const decompressedString = decoder.decode(decompressedArray);

      return JSON.parse(decompressedString);
    } catch (err) {
      return {};
    }
  }

  return {
    setUrlSearchParamsRecord,
    getStatefulURL,
    getSearchParams: _getSearchParams,
  };
}

// ################################ EFFECTS HERE ################################ 
createEffect(
  on([tsxResult, mode], async () =>
  {
    if (mode() !== "TSX") {
      batch(() =>
      {
        setSourceMapVisualizerUrl(null);
        setShowSourceMapVisualizer(false);
      });
      return;
    }
    const hash = await createHashFromCompiledCode(tsxResult());
    const hasError = !hash;
    const url = `https://evanw.github.io/source-map-visualization/#${hash}`;
    if (!hasError) {
      batch(() =>
      {
        setSourceMapVisualizerUrl(url);
        setShowSourceMapVisualizer(true);
      });
      return;
    }
    console.error("Failed to create hash from compiled code");
    batch(() =>
    {
      setSourceMapVisualizerUrl(null);
      setShowSourceMapVisualizer(false);
    });
  })
);

createRenderEffect(() =>
{
  // initialize the search params state
  setUrlSearchParamsRecord({
    code: code(),
    wordWrapped: wordWrapped(),
    mode: mode(),
    parsePosition: parsePosition(),
    transformInternalURL: transformInternalURL(),
    filename: filename(),
    normalizedFilename: normalizedFilename(),
    transformSourcemap: transformSourcemap(),
    transformAstroGlobalArgs: transformAstroGlobalArgs(),
    transformCompact: transformCompact(),
    transformResultScopedSlot: transformResultScopedSlot(),
  });

  // remove the search params from the URL
  window.history.replaceState({}, "", window.location.pathname);
});
