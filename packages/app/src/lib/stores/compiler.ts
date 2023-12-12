// ################################ DERIVED SIGNALS HERE ################################

import { createEffect, createResource, on } from "solid-js";
import type {
  ConsumedConvertToTSXOptions,
  ConsumedParseOptions,
  ConsumedTransformOptions,
} from "../types";
import {
  code,
  currentCompilerVersion,
  filename,
  mode,
  normalizedFilename,
  parsePosition,
  setHasCompilerVersionChangeBeenHandled,
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
import { asyncDebounce, returnFunctionReferenceFromHash } from "./utils";
import type { CompilerModule } from "../compiler/fetch";

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

function createWrapperCompilerFunctions() {
  const { convertToTSX, parse, transform } = remoteCompilerModule!;

  const getTransformResult = asyncDebounce(
    async (transformOptions: ConsumedTransformOptions) => {
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

  return {
    getTransformResult,
    getTSXResult,
    getParseResult,
  };
}
// TODO: find a better place for this
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

  // ################################ EFFECTS HERE ################################
  createEffect(
    on(
      currentCompilerVersion,
      () => {
        // update the compiler functions
        Object.assign(compilerFunctions, createWrapperCompilerFunctions());

        // refetch the results
        refetchTransformResult();
        refetchParseResult();
        refetchTsxResult();
      },
      { defer: true },
    ),
  );

  return {
    getCompilerOutput,
    getOutputByMode,
  };
}

// ################################ EXPORTS HERE ################################
export const { getCompilerOutput, getOutputByMode } =
  createCompilerOutputGetter();
