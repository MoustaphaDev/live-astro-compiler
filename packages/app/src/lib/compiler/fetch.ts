import TTLCache from "@isaacs/ttlcache";
import { getCompilerVersionsByType } from "./utils";
import { toast } from "solid-sonner";

const ASTRO_COMPILER_NPM_REGISTRY_URL =
  "https://registry.npmjs.org/@astrojs/compiler";
const REMOTE_COMPILER_PREFIX = "https://esm.sh/@astrojs/compiler";

type FetcherReturnType = Awaited<ReturnType<typeof fetchAllCompilerVersions>>;

/**
 * This cache is used to cache the result of the `fetchAllCompilerVersions` function
 * for 10 seconds to avoid useless requests to the npm registry and for a snappier UI
 */
const compilerVersionsCache = new TTLCache<
  "allCompilerVersions",
  FetcherReturnType
>({
  max: 1,
  ttl: 10000,
});

export function getRemoteCompilerModuleURL(version: string) {
  return `${REMOTE_COMPILER_PREFIX}@${version}`;
}

export function getRemoteCompilerWasmURL(version: string) {
  const base = `${REMOTE_COMPILER_PREFIX}@${version}`;
  const urls = {
    url: `${base}/dist/astro.wasm`,
    fallback: `${base}/astro.wasm`,
  };
  return urls;
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
): Promise<string[]> {
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
    throw error;
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
  let allCompilerVersions: FetcherReturnType;
  try {
    allCompilerVersions = await fetchAllCompilerVersions();
  } catch (e) {
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

export type CompilerModule = typeof import("@astrojs/compiler/types");
export type CompilerModuleAndWasm = {
  module: CompilerModule;
  wasmURL: {
    url: string;
    fallback: string;
  };
};
export async function fetchCompilerModuleAndWASM(
  version: string,
): Promise<CompilerModuleAndWasm | null> {
  const compilerModuleNamespace = await fetchCompilerModule(version);
  const compilerWasmUrl = getRemoteCompilerWasmURL(version);
  if (!compilerModuleNamespace) {
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

export async function compilerVersionFetcher(
  _: any,
  info: {
    value: FetcherReturnType | undefined;
    refetching: boolean;
  },
) {
  if (info.refetching) {
    const fetchedCompilerVersions = await safeGetCompilerVersions({
      noCache: true,
    });
    maybeUpdateCache(fetchedCompilerVersions);
    return fetchedCompilerVersions;
  }
  const cachedCompilerVersions = compilerVersionsCache.get(
    "allCompilerVersions",
  );
  if (cachedCompilerVersions) {
    toast.success("Successfully fetched compiler versions (cache hit)");
    return cachedCompilerVersions;
  }

  const fetchedCompilerVersions = await safeGetCompilerVersions();
  maybeUpdateCache(fetchedCompilerVersions);

  return fetchedCompilerVersions;
}

// TODO: I don't like having the toast, part of the core logic of
// the compiler module, but for sake of simplicity I'll leave
// it here for now
async function safeGetCompilerVersions(
  options: FetchCompilerModuleOptions = {},
) {
  try {
    const fetchedCompilerVersionsPromise = fetchAllCompilerVersions(options);
    toast.promise(fetchedCompilerVersionsPromise, {
      loading: "Fetching compiler versions...",
      success: "Successfully fetched compiler versions",
      error: "Failed to fetch compiler versions, please reload the app.",
    });
    const fetchedCompilerVersions = await fetchedCompilerVersionsPromise;
    return fetchedCompilerVersions;
  } catch (e) {
    toast.error("Failed to fetch compiler versions, please reload the app.");
    return [];
  }
}

function maybeUpdateCache(fetchedCompilerVersions: FetcherReturnType) {
  fetchedCompilerVersions.length > 0 &&
    compilerVersionsCache.set("allCompilerVersions", fetchedCompilerVersions);
}
