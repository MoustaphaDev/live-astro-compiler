import TTLCache from "@isaacs/ttlcache";
import { getCompilerVersionsByType } from "./utils";

const ASTRO_COMPILER_NPM_REGISTRY_URL =
  "https://registry.npmjs.org/@astrojs/compiler";
const REMOTE_COMPILER_PREFIX = "https://esm.sh/@astrojs/compiler";

/**
 * This cache is used to cache the result of the `fetchAllCompilerVersions` function
 * for 10 seconds to avoid useless requests to the npm registry and for a snappier UI
 */
const compilerVersionsCache = new TTLCache<
  "allCompilerVersions",
  Awaited<ReturnType<typeof fetchAllCompilerVersions>>
>({
  max: 1,
  ttl: 10000,
});

export function getRemoteCompilerModuleURL(version: string) {
  return `${REMOTE_COMPILER_PREFIX}@${version}`;
}

export function getRemoteCompilerWasmURL(version: string) {
  return `${REMOTE_COMPILER_PREFIX}@${version}/dist/astro.wasm`;
}

type FetchCompilerModuleOptions = {
  /**
   *  If true, the fetch will not use the cache. Defaults to false.
   * @param noCache
   */
  noCache?: boolean;
};

/**
 * @param options Object containing options for fetching compiler versions
 * @returns The list of compiler versions or null if the fetch failed
 */
export async function fetchAllCompilerVersions(
  options: FetchCompilerModuleOptions = {},
): Promise<string[] | null> {
  const noCacheMark = {
    cache: "no-store",
  } as const;
  try {
    const response = await fetch(
      ASTRO_COMPILER_NPM_REGISTRY_URL,
      options?.noCache ? noCacheMark : {},
    );
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

export type CompilerModule = typeof import("@astrojs/compiler");
export type CompilerModuleAndWasm = {
  module: CompilerModule;
  wasmURL: string;
};
export async function fetchCompilerModuleAndWASM(
  version: string,
): Promise<CompilerModuleAndWasm | null> {
  const compilerModuleNamespace = await fetchCompilerModule(version);
  const compilerWasmUrl = getRemoteCompilerWasmURL(version);
  if (!compilerModuleNamespace || !compilerWasmUrl) {
    console.warn(
      `Failed to fetch compiler module or wasm for version ${version}`,
    );
    return null;
  }
  const compilerModuleAndWasm = {
    module: compilerModuleNamespace,
    wasmURL: compilerWasmUrl,
  };

  return compilerModuleAndWasm;
}

type FetcherReturnType = Awaited<ReturnType<typeof fetchAllCompilerVersions>>;
export async function compilerVersionFetcher(
  _: any,
  info: {
    value: FetcherReturnType | undefined;
    refetching: boolean;
  },
) {
  if (info.refetching) {
    const fetchedCompilerVersions = await fetchAllCompilerVersions({
      noCache: true,
    });
    compilerVersionsCache.set("allCompilerVersions", fetchedCompilerVersions);
    return fetchedCompilerVersions;
  }
  const cachedCompilerVersions = compilerVersionsCache.get(
    "allCompilerVersions",
  );
  if (cachedCompilerVersions) {
    return cachedCompilerVersions;
  }
  const fetchedCompilerVersions = await fetchAllCompilerVersions();
  compilerVersionsCache.set("allCompilerVersions", fetchedCompilerVersions);
  return fetchedCompilerVersions;
}
