// @ts-ignore
import { transform, initialize, parse } from "@astrojs/compiler";
import type { TransformResult, ParseResult } from "@astrojs/compiler/types";
import astroWasm from "@astrojs/compiler/astro.wasm?url";
import type { CompileOptions, Modes } from "./types";
import { setIsAstroCompilerInitialized } from "./store";

let isCompilerInitialized = false;

async function astroCompiler(code: string, options: CompileOptions) {
  if (!isCompilerInitialized) {
    // initialize astro compiler
    await initialize({ wasmURL: astroWasm });
    setIsAstroCompilerInitialized(true);
    isCompilerInitialized = true;
  }
  if (options.action === "parse") {
    const parseResult = (await parse(code)) as ParseResult;
    return JSON.stringify(parseResult, null, 2);
  } else if (options.action === "transform") {
    const compileResult = (await transform(code, {
      sourcemap: "inline",
    })) as TransformResult;
    return compileResult.code;
  }
  throw new Error("Invalid action");
}

// export function isTransformOuput(
//   copmilerOutput: TransformResult | ParseResult,
//   mode?: Modes
// ): copmilerOutput is TransformResult {
//   return (
//     (copmilerOutput as TransformResult).code !== undefined ||
//     mode === "transform"
//   );
// }

export const getTransformResult = async (code: string) => {
  try {
    const transformedCode = await astroCompiler(code, {
      action: "transform",
    });
    return transformedCode;
  } catch (e) {
    throw e;
  }
};

export const getParseResult = async (code: string) => {
  try {
    const parsedCode = await astroCompiler(code, { action: "parse" });
    return parsedCode;
  } catch (e) {
    throw e;
  }
};
