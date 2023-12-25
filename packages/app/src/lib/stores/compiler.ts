// ################################ DERIVED SIGNALS HERE ################################
import { createEffect, createMemo, createResource, on } from "solid-js";
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
import { toast } from "solid-sonner";
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
const cachedResults = new Map();
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
    console.log("Compute getTransformResult");
    try {
      const result = await transformCode(transformOptions, transform);
      cachedResults.set("transform", result);
      return result;
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
    console.log("Compute getTSXResult");
    try {
      const result = await convertToTSXCode(convertToTSXOptions, convertToTSX);
      cachedResults.set("tsx", result);
      return result;
    } catch (e) {
      // TODO better err handling
      // throw e;
      console.error(e);
    }
  };

  const getParseResult = async (parseOptions: ConsumedParseOptions) => {
    console.log("Compute getParseResult");
    try {
      const result = await parseCode(parseOptions, parse);
      cachedResults.set("parse", result);
      return result;
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
  // The resources were always updated when the value of `code` changes,
  // leading to MANY unnecessary computations
  // Ideally, they should only get updated when the value of `code` has
  // changed and the `mode` switched to the one that relates to a particular
  // compiler function.
  // This is a simple way to somehow make a computation that yields a new `code`
  // only when the `code` has changed AND the `mode` is set to a specific one
  // A drawback of this approach is `code` is duplicated in memory 3 times
  // but I think it's worth it for the performance gain and the simplicity of the code
  const valueToTransform = createMemo((prevCode: string) => {
    if (mode() === "transform") return code()!;
    return prevCode;
  }, code()!);

  const valueToParse = createMemo((prevCode: string) => {
    if (mode() === "parse") return code()!;
    return prevCode;
  }, code()!);

  const valueToconvertToTSX = createMemo((prevCode: string) => {
    if (mode() === "TSX") return code()!;
    return prevCode;
  }, code()!);

  let compilerFunctions = createWrapperCompilerFunctions();
  const consumedTransformOptions = () => {
    return {
      code: valueToTransform(),
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
      code: valueToParse(),
      parseOptions: {
        position: parsePosition(),
      },
    } satisfies ConsumedParseOptions;
  };

  const consumedTSXOptions = () => {
    return {
      code: valueToconvertToTSX(),
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

  function invalidateCompilerFunctions(args: [string | undefined, boolean]) {
    const [, hasCompilerVersionChangeBeenHandled] = args;
    if (!hasCompilerVersionChangeBeenHandled) {
      return;
    }
    // update the compiler functions
    Object.assign(compilerFunctions, createWrapperCompilerFunctions());

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
  createEffect(
    on(
      [currentCompilerVersion, hasCompilerVersionChangeBeenHandled],
      invalidateCompilerFunctions,
      { defer: true },
    ),
  );

  return {
    getCompilerOutput,
    getOutputByMode,
  };
}

export async function initializeCompiler(version: string) {
  const compilerInitializingPromise = setCompilerWithFallbackHandling(version);
  toast.promise(compilerInitializingPromise, {
    loading: "Loading compiler",
    success: () => {
      return "Compiler loaded";
    },
    error: "Failed to load compiler",
  });
  await compilerInitializingPromise;
  setHasCompilerVersionChangeBeenHandled(true);
}
