// export const compilerModule =

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

export let remoteCompilerModule: CompilerModule | null = null;
export let remoteCompilerVersion = (await getDefaultCompilerVersionToLoad())
  .compilerVersionToLoad;

/**
 *
 * @param version the version of the compiler to load
 * @returns The status of the operation
 */
export async function setCompiler(version: string): Promise<{
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
  // teardown the previous compiler module
  console.info("Tearing down compiler...");
  remoteCompilerModule?.teardown();
  console.info("Tore down compiler!");

  remoteCompilerModule = compilerModule;
  remoteCompilerVersion = version;

  // initialize the compiler wasm
  console.info("Initializing compiler...");
  await remoteCompilerModule.initialize({ wasmURL });
  console.info("Initialized compiler!");
  return {
    status: "success",
  };
}

// the marking state is used to determine if we should run the compatibility tests or not
export async function getDefaultCompilerVersionToLoad(): Promise<{
  compilerVersionToLoad: string;
}> {
  const lastUsedCompilerVersion = getLastUsedCompilerVersion();
  if (lastUsedCompilerVersion) {
    const maybeStoredCompilerDetails = getStoredCompilerDetails(
      lastUsedCompilerVersion,
    );

    if (!maybeStoredCompilerDetails) {
      console.warn(
        `Failed to load stored compiler details for version ${lastUsedCompilerVersion}`,
      );
      return {
        compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
      };
    }
    // TODO: later manage this like in our design
    for (const [functionality, compatibilityStatus] of Object.entries(
      maybeStoredCompilerDetails.compatibilityMap,
    )) {
      if (compatibilityStatus === "incompatible") {
        // if any is incompatible, load the latest production version
        console.warn(
          `Compiler version ${lastUsedCompilerVersion} is incompatible`,
        );
        return {
          compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
        };
      }
      if (compatibilityStatus === "partially-compatible") {
        console.warn(
          `Compiler version ${lastUsedCompilerVersion} is partially compatible`,
        );
        return {
          compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
        };
      }
    }

    return {
      compilerVersionToLoad: lastUsedCompilerVersion,
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
