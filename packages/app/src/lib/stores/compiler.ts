// ################################ DERIVED SIGNALS HERE ################################
import {
  createEffect,
  createMemo,
  createReaction,
  createResource,
  on,
} from "solid-js";
import type {
  ConsumedConvertToTSXOptions,
  ConsumedParseOptions,
  ConsumedTransformOptions,
  FunctionGeneric,
  TransformTabToResultMap,
  TSXTabToResultMap,
} from "../types";
import {
  code,
  currentCompilerVersion,
  filename,
  hasCompilerVersionChangeBeenHandled,
  mode,
  normalizedFilename,
  parsePosition,
  selectedTransformTab,
  selectedTSXTab,
  setHasCompilerVersionChangeBeenHandled,
  transformAnnotateSourceFile,
  transformAstroGlobalArgs,
  transformCompact,
  transformInternalURL,
  transformRenderScript,
  transformResultScopedSlot,
  transformSourcemap,
  viewDetailedResults,
} from ".";
import { remoteCompilerModule } from "../compiler";
import { returnFunctionReferenceFromHash } from "./utils";
import { setCompilerWithFallbackHandling } from "../compiler/module";
import { debugLog, isNullish, isObject } from "../utils";

import type { TransformResult, TSXResult } from "@astrojs/compiler/types";
import type { CompilerModule } from "../compiler/fetch";

async function transformWrapper(
  options: ConsumedTransformOptions,
  transformFn: CompilerModule["transform"],
): Promise<TransformResult> {
  const transformResult = await transformFn(options.code ?? "", {
    resolvePath: async (path) => path,
    ...options.transformOptions,
  });
  return transformResult;
}

async function parseWrapper(
  options: ConsumedParseOptions,
  parseFn: CompilerModule["parse"],
): Promise<string> {
  const parseResult = await parseFn(options.code ?? "", options.parseOptions);
  return JSON.stringify(parseResult, null, 2);
}

async function convertToTSXWrapper(
  options: ConsumedConvertToTSXOptions,
  convertToTSXFn: CompilerModule["convertToTSX"],
): Promise<TSXResult> {
  const convertToTSXResult = await convertToTSXFn(
    options.code ?? "",
    options.convertToTSXOptions,
  );
  return convertToTSXResult;
}

type CreateWrapperCompilerFunctions = {
  getTransformResult: FunctionGeneric<TransformResult | undefined>;
  getTSXResult: FunctionGeneric<TSXResult | undefined>;
  getParseResult: FunctionGeneric<string | undefined>;
};
function createWrapperCompilerFunctions() {
  if (!remoteCompilerModule) {
    // throw new Error("Compiler not initialized");
    return {
      getTransformResult: () => ({ code: null }),
      getTSXResult: () => null,
      getParseResult: () => null,
    } as unknown as CreateWrapperCompilerFunctions;
  }
  const { convertToTSX, parse, transform } = remoteCompilerModule;

  const getTransformResult = async (
    transformOptions: ConsumedTransformOptions,
  ) => {
    debugLog("Computing getTransformResult...");
    try {
      return await transformWrapper(transformOptions, transform);
    } catch (e) {
      // TODO better err handling
      // idea introduce a signal holding the errors and
      // nicely display them in the UI
      // throw e;
      console.error(e);
    }
  };

  const getTSXResult = async (
    convertToTSXOptions: ConsumedConvertToTSXOptions,
  ) => {
    debugLog("Computing getTSXResult...");
    try {
      return await convertToTSXWrapper(convertToTSXOptions, convertToTSX);
    } catch (e) {
      // TODO better err handling
      // throw e;
      console.error(e);
    }
  };

  const getParseResult = async (parseOptions: ConsumedParseOptions) => {
    debugLog("Computing getParseResult...");
    try {
      return await parseWrapper(parseOptions, parse);
    } catch (e) {
      // TODO better err handling
      // throw e;
      console.error(e);
    }
  };

  return {
    getTransformResult,
    getTSXResult,
    getParseResult,
  };
}

export function createCompilerOutputGetter() {
  const compilerFunctions = createWrapperCompilerFunctions();
  let currentCycleCompilerVersion = currentCompilerVersion();
  // invalidate the memo cache when the compiler version changes
  const codeMemoInvalidator = {
    equals: (a: any, b: any) =>
      a === b && currentCycleCompilerVersion === currentCompilerVersion(),
  };
  // The resources were always updated when the value of `code` changes,
  // leading to MANY unnecessary computations
  // Ideally, they should only get updated when the value of `code` has
  // changed and the `mode` switched to the one that relates to a particular
  // compiler function.
  // This is a simple way to somehow make a computation that yields a new `code`
  // only when the `code` has changed AND the `mode` is set to a specific one
  // A drawback of this approach is `code` is duplicated in memory 3 times
  // but I think it's worth it for the performance gain and the simplicity of the code
  // Later we could refactor this to instead keep track state changes instead
  // of the values themselves to avoid duplication
  const codeToTransform = createMemo(
    (prevCode: string) => {
      if (mode() === "transform") return code()!;
      return prevCode;
    },
    code()!,
    codeMemoInvalidator,
  );

  const codeToParse = createMemo(
    (prevCode: string) => {
      if (mode() === "parse") return code()!;
      return prevCode;
    },
    code()!,
    codeMemoInvalidator,
  );

  const codeToConvertToTSX = createMemo(
    (prevCode: string) => {
      if (mode() === "TSX") return code()!;
      return prevCode;
    },
    code()!,
    codeMemoInvalidator,
  );

  const consumedTransformOptions = () => {
    return {
      code: codeToTransform(),
      transformOptions: {
        internalURL: transformInternalURL(),
        filename: filename(),
        normalizedFilename: normalizedFilename(),
        sourcemap: transformSourcemap(),
        astroGlobalArgs: transformAstroGlobalArgs(),
        compact: transformCompact(),
        resultScopedSlot: transformResultScopedSlot(),
        renderScript: transformRenderScript(),
        annotateSourceFile: transformAnnotateSourceFile(),
      },
    } satisfies ConsumedTransformOptions;
  };

  const consumedParseOptions = () => {
    return {
      code: codeToParse(),
      parseOptions: {
        position: parsePosition(),
      },
    } satisfies ConsumedParseOptions;
  };

  const consumedTSXOptions = () => {
    return {
      code: codeToConvertToTSX(),
      convertToTSXOptions: {
        filename: filename(),
        normalizedFilename: normalizedFilename(),
      },
    } satisfies ConsumedConvertToTSXOptions;
  };

  const [transformResult, { refetch: refetchTransformResult }] = createResource(
    consumedTransformOptions,
    returnFunctionReferenceFromHash(compilerFunctions, "getTransformResult"),
  );
  const [parseResult, { refetch: refetchParseResult }] = createResource(
    consumedParseOptions,
    returnFunctionReferenceFromHash(compilerFunctions, "getParseResult"),
  );
  const [tsxResult, { refetch: refetchTsxResult }] = createResource(
    consumedTSXOptions,
    returnFunctionReferenceFromHash(compilerFunctions, "getTSXResult"),
  );

  // ################################ HOOKS AND UTILITY FUNCTIONS HERE ################################
  function getCompilerOutput() {
    return {
      parseResult,
      tsxResult,
      transformResult: () => transformResult()?.code,
    };
  }

  // rename this `getOutputOfCurrentMode`?
  function getOutputByMode() {
    switch (mode()) {
      case "transform": {
        const _transformResult = transformResult();
        if (!viewDetailedResults()) {
          return _transformResult?.code;
        }
        if (!_transformResult) return;
        const transformTabToResultMap =
          createTransformTabToResultMap(_transformResult);
        const transformTab = selectedTransformTab();
        const content = isCode(transformTab)
          ? _transformResult?.code
          : transformTabToResultMap[transformTab];
        return content;
      }
      case "TSX": {
        const _tsxResult = tsxResult();
        if (!viewDetailedResults()) {
          return _tsxResult?.code;
        }
        if (!_tsxResult) return;
        const tsxTabToResultMap = createTSXTabToResultMap(_tsxResult);
        const tsxTab = selectedTSXTab();
        const content = isCode(tsxTab)
          ? _tsxResult?.code
          : tsxTabToResultMap[tsxTab];
        return content;
      }
      case "parse":
        return parseResult();
    }
  }

  function invalidateCompilerFunctions() {
    debugLog("Reassigning compiler functions...");
    // update the compiler functions
    Object.assign(compilerFunctions, createWrapperCompilerFunctions());
    currentCycleCompilerVersion = currentCompilerVersion();
    refetchResourceOfCurrentMode();
  }

  function refetchResourceOfCurrentMode() {
    // refetch the results for the current mode
    // defer fetching of the other results
    // this doesn't work as expected currently
    // After when switching compiler versions, when switching modes
    // the other results are not fetched until the `code` changes
    // switch (mode()) {
    //   case "TSX":
    //     refetchTsxResult();
    //     break;
    //   case "parse":
    //     refetchParseResult();
    //     break;
    //   case "transform":
    //     refetchTransformResult();
    //     break;
    // }
    // this is a quick fix for the above issue
    // refetch all the results when switching compiler versions
    refectchAllResources();
  }

  function refectchAllResources() {
    refetchTsxResult();
    refetchParseResult();
    refetchTransformResult();
  }

  // ################################ EFFECTS HERE ################################
  // invalidate the compiler functions when the compiler version changes
  createEffect(
    on([currentCompilerVersion], invalidateCompilerFunctions, { defer: true }),
  );

  // invalidate the compiler functions when the compiler has been initialized
  const track = createReaction(() => invalidateCompilerFunctions());
  track(() => hasCompilerVersionChangeBeenHandled());

  return {
    getCompilerOutput,
    getOutputByMode,
  };
}

function isCode(code: unknown): code is "code" {
  return code === "code";
}

export function unWrapOutput(
  output: ReturnType<
    ReturnType<typeof createCompilerOutputGetter>["getOutputByMode"]
  >,
): string {
  if (isNullish(output)) return "";
  return isObject(output) ? JSON.stringify(output, null, 2) : output;
}

// maybe use a map instead of an object?
function createTransformTabToResultMap(
  transformResult: TransformResult,
): TransformTabToResultMap {
  const {
    clientOnlyComponents,
    containsHead,
    css,
    diagnostics,
    hydratedComponents,
    map,
    propagation,
    scope,
    scripts,
    styleError,
    serverComponents,
  } = transformResult;
  return {
    css: { css, styleError },
    hydration: {
      clientOnlyComponents,
      hydratedComponents,
    },
    scripts: {
      scripts,
    },
    misc: {
      containsHead,
      diagnostics,
      map,
      propagation,
      scope,
      serverComponents,
    },
  } as const;
}

function createTSXTabToResultMap(tsxResult: TSXResult): TSXTabToResultMap {
  const { code, diagnostics, map, metaRanges } = tsxResult;
  return {
    code,
    misc: {
      diagnostics,
      map,
      metaRanges,
    },
  } as const;
}

export async function initializeCompiler(version: string) {
  await setCompilerWithFallbackHandling(version);
  setHasCompilerVersionChangeBeenHandled(true);
}
