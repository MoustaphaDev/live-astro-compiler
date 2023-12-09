// ################################ DERIVED SIGNALS HERE ################################

import { createEffect, createResource, createUniqueId, on } from "solid-js";
import type {
  ConsumedConvertToTSXOptions,
  ConsumedParseOptions,
  ConsumedTransformOptions,
  EditorsHash,
} from "../types";
import {
  code,
  currentCompilerVersion,
  filename,
  hasCompilerVersionChangeBeenHandled,
  mode,
  normalizedFilename,
  parsePosition,
  setHasCompilerVersionChangeBeenHandled,
  setShowSourceMapVisualizer,
  transformAstroGlobalArgs,
  transformCompact,
  transformInternalURL,
  transformResultScopedSlot,
  transformSourcemap,
} from ".";
import {
  initializeCompilerWithDefaultVersion,
  remoteCompilerModule,
} from "../compiler";
import type { TransformResult } from "@astrojs/compiler";
import type { CompilerModule } from "../compiler/cache";
import { asyncDebounce } from "./utils";

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

let functionReference: (arg: any) => any = () => {};

const uniqueIds: string[] = [];
let count = 0;
function createWrapperCompilerFunctions() {
  const { convertToTSX, parse, transform } = remoteCompilerModule!;
  console.log("Wrapper compiler functions call");
  const uniqueId = createUniqueId();
  uniqueIds.push(uniqueId);

  console.log("Generated unique id: ", uniqueId);

  const getTransformResult = asyncDebounce(
    async (transformOptions: ConsumedTransformOptions) => {
      // test if the function reference has changed
      const hasReferenceChanged = functionReference !== getTransformResult;
      console.log("Has reference changed: ", hasReferenceChanged);
      // check if the reference has changed
      // @ts-ignore
      const foundUID = getTransformResult[uniqueIds[0]];
      console.log("Found UID: ", foundUID);
      try {
        return await transformCode(transformOptions, transform);
      } catch (e) {
        // TODO better err handling
        // idea introduce a signal holding the errors and
        // nicely display them in the UI
        // throw e;
        console.error(e);
      }
    },
  );
  if (count === 0) {
    functionReference = getTransformResult;
    count++;
  }

  const getTSXResult = asyncDebounce(
    async (convertToTSXOptions: ConsumedConvertToTSXOptions) => {
      try {
        return await convertToTSXCode(convertToTSXOptions, convertToTSX);
      } catch (e) {
        // TODO better err handling
        // throw e;
        console.error(e);
      }
    },
  );

  const getParseResult = asyncDebounce(
    async (parseOptions: ConsumedParseOptions) => {
      try {
        return await parseCode(parseOptions, parse);
      } catch (e) {
        // TODO better err handling
        // throw e;
        console.error(e);
      }
    },
  );

  // mark the functions to check if the reference has changed
  // @ts-ignore
  getTransformResult[uniqueId] = true;
  // @ts-ignore
  getTSXResult[uniqueId] = true;
  // @ts-ignore
  getParseResult[uniqueId] = true;

  return {
    getTransformResult,
    getTSXResult,
    getParseResult,
  };
}

await initializeCompilerWithDefaultVersion();
setHasCompilerVersionChangeBeenHandled(true);
function createCompilerOutputGetter() {
  let compilerFunctions = createWrapperCompilerFunctions();
  const consumedTransformOptions = () => {
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

  const consumedParseOptions = () => {
    return {
      code: code(),
      parseOptions: {
        position: parsePosition(),
      },
    } satisfies ConsumedParseOptions;
  };

  const consumedTSXOptions = () => {
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
    returnFunctionReferenceFromHash(compilerFunctions, "getTransformResult"),
  );
  const [parseResult] = createResource(
    consumedParseOptions,
    returnFunctionReferenceFromHash(compilerFunctions, "getParseResult"),
  );
  const [tsxResult] = createResource(
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

  // ################################ EFFECTS HERE ################################
  createEffect(mode, async () => {
    if (mode() === "TSX") {
      setShowSourceMapVisualizer(false);
    }
  });

  createEffect(
    on(
      currentCompilerVersion,
      () => {
        // update the compiler functions
        Object.assign(compilerFunctions, createWrapperCompilerFunctions());
      },
      { defer: true },
    ),
  );

  return {
    getCompilerOutput,
    getOutputByMode,
  };
}

function returnFunctionReferenceFromHash<
  Hash extends Record<string, (...args: any[]) => any>,
  FnToPick extends keyof Hash,
  FnToReturn extends Hash[FnToPick],
>(hash: Hash, functionToPick: FnToPick) {
  return (...args: Parameters<FnToReturn>): ReturnType<FnToReturn> => {
    return hash[functionToPick](...args);
  };
}

// ################################ EXPORTS HERE ################################
export const { getCompilerOutput, getOutputByMode } =
  createCompilerOutputGetter();
