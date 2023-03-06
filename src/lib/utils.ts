import { getHighlighter, type Highlighter } from "shiki";
// @ts-ignore
import { transform, initialize, parse } from "@astrojs/compiler";
import astroWasm from "@astrojs/compiler/astro.wasm?url";
import { shikiTheme } from "./store";
import type { AvailableThemes, CompileOptions } from "./types";

const highlighterCacheAsync = new Map<string, Promise<Highlighter>>();
export let highlighter: Highlighter;

export async function setHightlighter(theme: AvailableThemes) {
  let highlighterAsync = highlighterCacheAsync.get(theme);
  if (!highlighterAsync) {
    highlighterAsync = getHighlighter({
      theme: theme,
      langs: ["typescript", "tsx", "javascript"],
    });
  }
  try {
    highlighter = await highlighterAsync;
    highlighterCacheAsync.set(theme, highlighterAsync);
  } catch (e) {
    !highlighter && highlighterCacheAsync.delete(theme);
    throw e;
  }
}

let isCompilerInitialized = false;

async function astroCompiler(code: string, options: CompileOptions) {
  if (!isCompilerInitialized) {
    // initialize shiki highlighter
    await setHightlighter(shikiTheme());
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

export function highlight(code: string) {
  return highlighter.codeToHtml(code, { lang: "js" });
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
