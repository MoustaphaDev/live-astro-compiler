// @ts-ignore
import { transform, initialize, parse } from "@astrojs/compiler";
import astroWasm from "@astrojs/compiler/astro.wasm?url";
import type { CompileOptions } from "./types";

let isCompilerInitialized = false;

async function astroCompiler(code: string, options: CompileOptions) {
  if (!isCompilerInitialized) {
    // initialize astro compiler
    await initialize({ wasmURL: astroWasm });
    isCompilerInitialized = true;
  }
  if (options.action === "parse") {
    const parseResult = await parse(code);
    return JSON.stringify(parseResult, null, 2);
  } else if (options.action === "transform") {
    const compileResult = await transform(code, { sourcemap: "inline" });
    return compileResult.code;
  }
  throw new Error("Invalid action");
}

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
