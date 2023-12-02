// export const compilerModule = 

import { CompilerModule } from "./cache"
import { fetchCompilerModuleAndWASM, fetchLatestProductionCompilerVersion } from "./fetch"
import { runCompilerCompatibilityTestsWithPlayground } from "./in-browser-tests"
import { getLastUsedCompilerVersion, getStoredCompilerDetails, storeCompilerDetails } from "./storage"

export let remoteCompilerModule: CompilerModule | null = null
export let remoteCompilerVersion = await getDefaultCompilerVersionToLoad()

export async function switchCompiler(version: string)
{
    let compilerModuleAndWasm = await fetchCompilerModuleAndWASM(version)
    let isMarked: boolean;

    if (!compilerModuleAndWasm) {
        console.warn(`Failed to load compiler module for version ${version}`)
        const { compilerVersionToLoad, isMarked: _isMarked } = await getDefaultCompilerVersionToLoadAndMarkingState()
        version = compilerVersionToLoad
        isMarked = _isMarked
        const maybecompilerModuleAndWasm = await fetchCompilerModuleAndWASM(version)
        if (!maybecompilerModuleAndWasm) {
            throw new Error("Failed to load compiler module")
        }
        compilerModuleAndWasm = maybecompilerModuleAndWasm
    }

    const { module: compilerModule, wasmURL } = compilerModuleAndWasm

    if (!isMarked!) {
        // run compatibility tests
        // later implement this like described in our detailed design
        // for now, just run the tests
        const testResults = await runCompilerCompatibilityTestsWithPlayground({ module: compilerModule, wasmURL })

        storeCompilerDetails({
            version,
            compatibilityMap: testResults
        })

    }
    remoteCompilerModule = compilerModule
    remoteCompilerVersion = version
}

// the marking state is used to determine if we should run the compatibility tests or not
async function getDefaultCompilerVersionToLoadAndMarkingState(): Promise<{ compilerVersionToLoad: string; isMarked: boolean }>
{
    const lastUsedCompilerVersion = getLastUsedCompilerVersion();
    let isMarked = false;
    if (lastUsedCompilerVersion) {
        const maybeStoredCompilerDetails = getStoredCompilerDetails(lastUsedCompilerVersion)
        if (!maybeStoredCompilerDetails) {
            console.warn(`Failed to load stored compiler details for version ${lastUsedCompilerVersion}`)
            return {
                compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
                isMarked
            }
        }
        isMarked = true
        // TODO: later manage this like in our design
        for (const [functionality, compatibilityStatus] of Object.entries(maybeStoredCompilerDetails.compatibilityMap)) {
            if (compatibilityStatus === "incompatible") {
                // if any is incompatible, load the latest production version
                console.warn(`Compiler version ${lastUsedCompilerVersion} is incompatible`)
                return {
                    compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
                    isMarked
                }
            }
            if (compatibilityStatus === "partially-compatible") {
                console.warn(`Compiler version ${lastUsedCompilerVersion} is partially compatible`)
                return {
                    compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
                    isMarked
                }
            }
        }

        return {
            compilerVersionToLoad: lastUsedCompilerVersion,
            isMarked: isMarked
        }
    }
    return {
        compilerVersionToLoad: await fetchLatestProductionCompilerVersion(),
        isMarked
    }
}


export async function getDefaultCompilerVersionToLoad(): Promise<string>
{
    const { compilerVersionToLoad } = await getDefaultCompilerVersionToLoadAndMarkingState()
    return compilerVersionToLoad
}