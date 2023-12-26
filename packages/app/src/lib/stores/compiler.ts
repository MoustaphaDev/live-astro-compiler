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
} from "../types";
import {
  code,
  mode,
  currentCompilerVersion,
  setHasCompilerVersionChangeBeenHandled,
  filename,
  normalizedFilename,
  parsePosition,
  transformAstroGlobalArgs,
  transformCompact,
  transformInternalURL,
  transformResultScopedSlot,
  transformSourcemap,
  hasCompilerVersionChangeBeenHandled,
} from ".";
import { remoteCompilerModule } from "../compiler";
import type { TransformResult } from "@astrojs/compiler";
import { returnFunctionReferenceFromHash } from "./utils";
import type { CompilerModule } from "../compiler/fetch";
import { setCompilerWithFallbackHandling } from "../compiler/module";

async function transformCode(
  options: ConsumedTransformOptions,
  transformFn: CompilerModule["transform"],
): Promise<TransformResult> {
  const transformResult = await transformFn(
    options.code ?? "",
    options.transformOptions,
  );
  return transformResult;
}

async function parseCode(
  options: ConsumedParseOptions,
  parseFn: CompilerModule["parse"],
): Promise<string> {
  const parseResult = await parseFn(options.code ?? "", options.parseOptions);
  return JSON.stringify(parseResult, null, 2);
}

async function convertToTSXCode(
  options: ConsumedConvertToTSXOptions,
  convertToTSXFn: CompilerModule["convertToTSX"],
): Promise<string> {
  const convertToTSXResult = await convertToTSXFn(
    options.code ?? "",
    options.convertToTSXOptions,
  );
  return convertToTSXResult.code;
}

type CreateWrapperCompilerFunctions = {
  getTransformResult: FunctionGeneric<TransformResult | undefined>;
  getTSXResult: FunctionGeneric<string | undefined>;
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
    console.log("Computing getTransformResult...");
    try {
      return await transformCode(transformOptions, transform);
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
    console.log("Computing getTSXResult...");
    try {
      return await convertToTSXCode(convertToTSXOptions, convertToTSX);
    } catch (e) {
      // TODO better err handling
      // throw e;
      console.error(e);
    }
  };

  const getParseResult = async (parseOptions: ConsumedParseOptions) => {
    console.log("Computing getParseResult...");
    try {
      return await parseCode(parseOptions, parse);
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
      case "TSX":
        return tsxResult();
      case "parse":
        return parseResult();
      case "transform":
        return transformResult()?.code;
    }
  }

  function invalidateCompilerFunctions(...args: unknown[]) {
    console.log("Reassigning compiler functions...");
    // update the compiler functions
    Object.assign(compilerFunctions, createWrapperCompilerFunctions());
    currentCycleCompilerVersion = currentCompilerVersion();
    refetchResourceOfCurrentMode();
  }

  function refetchResourceOfCurrentMode() {
    // refetch the results for the current mode
    // defer fetching of the other results
    switch (mode()) {
      case "TSX":
        refetchTsxResult();
        break;
      case "parse":
        refetchParseResult();
        break;
      case "transform":
        refetchTransformResult();
        break;
    }
  }

  // ################################ EFFECTS HERE ################################
  // invalidate the compiler functions when the compiler version changes
  createEffect(
    on(currentCompilerVersion, invalidateCompilerFunctions, { defer: true }),
  );

  // invalidate the compiler functions when the compiler has been initialized
  const track = createReaction(() => invalidateCompilerFunctions());
  track(() => hasCompilerVersionChangeBeenHandled());

  return {
    getCompilerOutput,
    getOutputByMode,
  };
}

export async function initializeCompiler(version: string) {
  await setCompilerWithFallbackHandling(version);
  setHasCompilerVersionChangeBeenHandled(true);
}
