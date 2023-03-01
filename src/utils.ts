import { getHighlighter, setWasm, setCDN, type Highlighter } from "shiki";
import onigasm from "shiki/dist/onig.wasm?url";
// @ts-ignore
import { transform, initialize } from "@astrojs/compiler";
import astroWasm from "@astrojs/compiler/astro.wasm?url";
import { type AvailableThemes, DEFAULT_THEME } from "~/consts";

const shikiFolderPath = new URL("../node_modules/shiki", import.meta.url);

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
async function astroCompiler(code: string) {
  if (!isCompilerInitialized) {
    // initialize shiki
    setCDN(shikiFolderPath.href);
    setWasm(onigasm);
    await setHightlighter(DEFAULT_THEME);
    // initialize astro compiler
    await initialize({ wasmURL: astroWasm });
    isCompilerInitialized = true;
  }
  const compiledResult = await transform(code);
  return compiledResult.code;
}

export function highlight(code: string) {
  return highlighter.codeToHtml(code, { lang: "js" });
}

export const compile = async (code: string) => {
  try {
    const compiledCode = await astroCompiler(code);
    return compiledCode;
  } catch (e) {
    throw e;
  }
};
