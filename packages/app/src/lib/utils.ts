// @ts-ignore
import type { TransformResult } from "@astrojs/compiler/types";
import type {
  ConsumedConvertToTSXOptions,
  ConsumedParseOptions,
  ConsumedTransformOptions,
} from "./types";
import { initializeCompilerModuleAndWASM, remoteCompilerModule } from "./compiler";
import { compilerModuleAndWasmCache } from "./compiler/cache";
import { remoteCompilerVersion } from "./compiler/module";

// after the compiler module and wasm are loaded
// we can assume that the compiler module and
// wasm are defined
await initializeCompilerModuleAndWASM();

const
  {
    convertToTSX,
    initialize,
    parse,
    transform,
  } = remoteCompilerModule!

let isCompilerInitialized = false;

async function initializeCompiler()
{
  if (!isCompilerInitialized) {
    const { wasmURL } = compilerModuleAndWasmCache.get(remoteCompilerVersion)!
    await initialize({ wasmURL });
    const { setIsAstroCompilerInitialized } = await import("./stores");
    setIsAstroCompilerInitialized(true);
    isCompilerInitialized = true;
  }
}

async function transformCode(
  options: ConsumedTransformOptions
): Promise<TransformResult>
{
  await initializeCompiler();
  const transformResult = await transform(
    options.code ?? "",
    options.transformOptions
  );
  return transformResult;
}

async function parseCode(options: ConsumedParseOptions): Promise<string>
{
  await initializeCompiler();
  const parseResult = await parse(options.code ?? "", options.parseOptions);
  return JSON.stringify(parseResult, null, 2);
}

async function convertToTSXCode(
  options: ConsumedConvertToTSXOptions
): Promise<string>
{
  await initializeCompiler();
  const convertToTSXResult = await convertToTSX(
    options.code ?? "",
    options.convertToTSXOptions
  );
  return convertToTSXResult.code;
}

export const getTransformResult = async (
  transformOptions: ConsumedTransformOptions
) =>
{
  try {
    return await transformCode(transformOptions);
  } catch (e) {
    // TODO better err handling
    // idea introduce a signal holding the errors and
    // nicely display them in the UI
    // throw e;
    console.error(e);
  }
};

export const getTSXResult = async (
  convertToTSXOptions: ConsumedConvertToTSXOptions
) =>
{
  try {
    return await convertToTSXCode(convertToTSXOptions);
  } catch (e) {
    // TODO better err handling
    // throw e;
    console.error(e);
  }
};

export const getParseResult = async (parseOptions: ConsumedParseOptions) =>
{
  try {
    return await parseCode(parseOptions);
  } catch (e) {
    // TODO better err handling
    // throw e;
    console.error(e);
  }
};

function utf16ToUTF8(x: string)
{
  return unescape(encodeURIComponent(x));
}

// adapted from https://github.com/evanw/source-map-visualization/blob/gh-pages/code.js#L1621
export async function createHashFromCompiledCode(code: string | undefined)
{
  // Check for both "//" and "/*" comments
  if (!code) {
    console.warn(`No code was pasted`);
    return;
  }
  let match = /\/(\/)[#@] *sourceMappingURL=([^\s]+)/.exec(code);
  if (!match)
    match =
      /\/(\*)[#@] *sourceMappingURL=((?:[^\s*]|\*[^/])+)(?:[^*]|\*[^/])*\*\//.exec(
        code
      );

  // Check for a non-empty data URL payload
  if (!match) {
    console.warn(
      `Failed to find an embedded "//}# sourceMappingURL=" comment in the pasted text'`
    );
    return;
  }
  if (!match[2]) {
    console.warn(
      `Failed to find an embedded "/${match[1]}# sourceMappingURL=" comment in the pasted text'`
    );
    return;
  }

  let map;
  try {
    // Use "new URL" to ensure that the URL has a protocol (e.g. "data:" or "https:")
    map = await fetch(new URL(match[2])).then((r) => r.text());
  } catch (e) {
    console.warn(
      `Failed to parse the URL in the "/${match[1]
      // @ts-expect-error
      }# sourceMappingURL=" comment: ${(e && e.message) || e}`
    );
    return;
  }

  code = utf16ToUTF8(code);
  map = utf16ToUTF8(map);

  let codeLength = `${code.length}\0`;
  let mapLength = `${map.length}\0`;
  const hash = btoa(`${codeLength}${code}${mapLength}${map}`);
  return hash;
}
