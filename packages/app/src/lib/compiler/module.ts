// export const compilerModule =

import { toast } from "solid-sonner";
import {
  type CompilerModule,
  fetchCompilerModuleAndWASM,
  fetchLatestProductionCompilerVersion,
} from "./fetch";
import { runCompilerCompatibilityTestsWithPlayground } from "./in-browser-tests";
import {
  getLastUsedCompilerVersion,
  getStoredCompilerDetails,
  storeCompilerDetails,
} from "./storage";
import { createPromiseAndActions } from "./utils";

export let remoteCompilerModule: CompilerModule | null = null;

export async function initializeCompilerWithDefaultVersion() {
  const { compilerVersionToLoad: defaultCompilerVersionToLoad } =
    await getDefaultCompilerVersionToLoad();

  // initialize the compiler module with the default compiler version
  await setCompilerWithFallbackHandling(defaultCompilerVersionToLoad);
}

/**
 *
 * @param version the version of the compiler to load
 * @returns The status of the operation
 */
async function setCompiler(version: string): Promise<{
  status: "success" | "failure";
}> {
  let compilerModuleAndWasm = await fetchCompilerModuleAndWASM(version);
  if (!compilerModuleAndWasm) {
    return {
      status: "failure",
    };
  }

  const { module: compilerModule, wasmURL } = compilerModuleAndWasm;
  const { isMarked } = getCompilerMarkingState(version);

  console.log({ isMarked });
  if (!isMarked!) {
    // run compatibility tests
    // later implement this like described in our detailed design
    // for now, just run the tests
    const testResults = await runCompilerCompatibilityTestsWithPlayground({
      module: compilerModule,
      wasmURL,
    });
    storeCompilerDetails({
      version,
      compatibilityMap: testResults,
    });
  }

  const isCompatible = await checkCompatibitly(version);
  if (!isCompatible) {
    return {
      status: "failure",
    };
  }

  // teardown the previous compiler module
  remoteCompilerModule?.teardown();

  // set the new compiler module
  remoteCompilerModule = compilerModule;

  // initialize the compiler wasm
  try {
    await remoteCompilerModule.initialize({ wasmURL: wasmURL.url });
  } catch (error) {
    try {
      await remoteCompilerModule.initialize({ wasmURL: wasmURL.fallback });
    } catch {
      return {
        status: "failure",
      };
    }
  }
  return {
    status: "success",
  };
}

export async function setCompilerWithFallbackHandling(
  version: string,
  afterCompilerChange: () => Promise<void> | void = () => {},
) {
  const {
    promise: loadingCompilerPromise,
    resolver: triggerSuccess,
    rejecter: triggerFailure,
  } = createPromiseAndActions();
  const compilerLoadingToast = toast.promise(loadingCompilerPromise, {
    loading: `Loading compiler v${version}`,
    success: `Compiler v${version} loaded`,
    error: `Failed to load compiler v${version}`,
  });
  try {
    const { status } = await setCompiler(version);
    if (status === "failure") {
      let { compilerVersionToLoad: fallbackCompilerVersion } =
        await getDefaultCompilerVersionToLoad();
      const { status: fallbackStatus } = await setCompiler(
        fallbackCompilerVersion,
      );
      if (fallbackStatus === "failure") {
        toast.error(
          "An error occured while loading the compiler, please reload the page",
        );
        return;
      }
      fallbackCompilerVersion =
        getLastUsedCompilerVersion() ?? fallbackCompilerVersion;
      toast.error(
        `An error occured while loading the compiler, falling back to v${fallbackCompilerVersion}`,
      );
      // TODO: handle failure here too
      version = fallbackCompilerVersion;

      if (!version) {
        throw new Error("No fallback compiler version was found");
      }
      toast.dismiss(compilerLoadingToast);
      return;
    }
    await afterCompilerChange();
    triggerSuccess();
  } catch {
    triggerFailure();
  }
}

// the marking state is used to determine if we should run the compatibility tests or not
export async function getDefaultCompilerVersionToLoad(): Promise<{
  compilerVersionToLoad: string;
}> {
  const lastUsedCompilerVersion = getLastUsedCompilerVersion();
  if (!lastUsedCompilerVersion) {
    return {
      compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
    };
  }

  return {
    compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
  };
}

/**
 *
 * @param version the version of the compiler to check the marking state for
 * —
 * The marking state is used to determine if we should run the compatibility tests or not.
 * If the compiler version is marked as incompatible, we load the latest production version.
 * If the compiler version is marked as partially compatible, we load the latest production version
 * (later we could cherry pick which options work and gray out in the UI the ones that don't).
 * If the compiler version is marked as compatible, we load the compiler version without running the compatibility tests.
 */
function getCompilerMarkingState(version: string): { isMarked: boolean } {
  let isMarked = false;
  const maybeStoredCompilerDetails = getStoredCompilerDetails(version);
  if (!maybeStoredCompilerDetails) {
    return {
      isMarked,
    };
  }
  isMarked = true;
  // TODO: later manage this like in our design
  // right now, the results of the tests aren't
  // surfaced in the UI
  for (const [functionality, compatibilityStatus] of Object.entries(
    maybeStoredCompilerDetails.compatibilityMap,
  )) {
    if (compatibilityStatus === "incompatible") {
      // if any is incompatible, load the latest production version
      console.warn(`Compiler version ${version} is incompatible`);
      return {
        isMarked,
      };
    }
    if (compatibilityStatus === "partially-compatible") {
      console.warn(`Compiler version ${version} is partially compatible`);
      return {
        isMarked,
      };
    }
  }

  return {
    isMarked,
  };
}

async function checkCompatibitly(version: string) {
  const maybeStoredCompilerDetails = getStoredCompilerDetails(version);
  if (!maybeStoredCompilerDetails) {
    console.warn(
      `Failed to load stored compiler details for version ${version}`,
    );
    return false;
  }
  // TODO: later manage this like in our design
  for (const [functionality, compatibilityStatus] of Object.entries(
    maybeStoredCompilerDetails.compatibilityMap,
  )) {
    console.log({ functionality, compatibilityStatus });
    if (compatibilityStatus === "incompatible") {
      // if any is incompatible, load the latest production version
      console.warn(`Compiler version ${version} is incompatible`);
      return false;
    }
    if (compatibilityStatus === "partially-compatible") {
      console.warn(`Compiler version ${version} is partially compatible`);
      return false;
    }
  }
  return true;
}
