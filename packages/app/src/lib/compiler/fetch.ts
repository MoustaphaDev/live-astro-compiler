import {
  type CompilerModule,
  type CompilerModuleAndWasm,
  compilerModuleAndWasmCache,
} from "./cache";
import { getCompilerVersionsByType } from "./utils";

const ASTRO_COMPILER_NPM_REGISTRY_URL =
  "https://registry.npmjs.org/@astrojs/compiler";
const REMOTE_COMPILER_PREFIX = "https://esm.sh/@astrojs/compiler";

export function getRemoteCompilerModuleURL(version: string) {
  return `${REMOTE_COMPILER_PREFIX}@${version}`;
}

export function getRemoteCompilerWasmURL(version: string) {
  return `${REMOTE_COMPILER_PREFIX}@${version}/dist/astro.wasm`;
}

export async function fetchAllCompilerVersions(): Promise<string[] | null> {
  try {
    const response = await fetch(ASTRO_COMPILER_NPM_REGISTRY_URL);
    const data = await response.json();
    const versions = Object.keys(data.versions);
    return versions.reverse();
  } catch (error) {
    console.error("Error fetching versions:", error);
    return null;
  }
}

async function fetchCompilerModule(version: string): Promise<CompilerModule> {
  try {
    const compilerModuleURL = getRemoteCompilerModuleURL(version);
    const compilerModuleNamespace = (await import(
      /* @vite-ignore */ compilerModuleURL
    )) as CompilerModule;
    return compilerModuleNamespace;
  } catch (error) {
    // TODO: handle error better
    console.error("Error fetching compiler module:\n", error);
    throw error;
  }
}

export async function fetchLatestProductionCompilerVersion(): Promise<string> {
  const allCompilerVersions = await fetchAllCompilerVersions();
  if (!allCompilerVersions) {
    throw new Error("Failed to load compiler versions");
  }
  const { productionVersions: productionCompilerVersions } =
    getCompilerVersionsByType(allCompilerVersions);
  const latestProductionCompilerVersion = productionCompilerVersions[0];

  if (!latestProductionCompilerVersion) {
    throw new Error("No production compiler versions found");
  }
  return latestProductionCompilerVersion;
}

export async function fetchCompilerModuleAndWASM(
  version: string,
): Promise<CompilerModuleAndWasm | null> {
  let compilerModuleAndWasm = compilerModuleAndWasmCache.get(version);
  if (compilerModuleAndWasm) {
    return compilerModuleAndWasm;
  }

  const compilerModuleNamespace = await fetchCompilerModule(version);
  const compilerWasmUrl = getRemoteCompilerWasmURL(version);
  if (!compilerModuleNamespace || !compilerWasmUrl) {
    console.warn(
      `Failed to fetch compiler module or wasm for version ${version}`,
    );
    return null;
  }
  compilerModuleAndWasm = {
    module: compilerModuleNamespace,
    wasmURL: compilerWasmUrl,
  };
  compilerModuleAndWasmCache.set(version, compilerModuleAndWasm);

  return compilerModuleAndWasm;
}
