import { type CompilerModule, type CompilerModuleAndWasm, compilerModuleAndWasmCache } from "./cache"
import { getCompilerVersionsByType } from "./utils"

const ASTRO_COMPILER_NPM_REGISTRY_URL = "https://registry.npmjs.org/@astrojs/compiler"

const REMOTE_COMPILER_PREFIX = "https://esm.sh/@astrojs/compiler"

function getRemoteCompilerModuleURL(version: string)
{
    return `${REMOTE_COMPILER_PREFIX}@${version}`
}

export function getRemoteCompilerWasmURL(version: string)
{
    return `${REMOTE_COMPILER_PREFIX}@${version}/dist/astro.wasm`
}

export async function fetchAllCompilerVersions(): Promise<string[] | null>
{
    try {
        const response = await fetch(ASTRO_COMPILER_NPM_REGISTRY_URL)
        const data = await response.json()
        const versions = Object.keys(data.versions);
        return versions
    } catch (error) {
        console.error('Error fetching versions:', error)
        return null
    }
}

export async function fetchCompilerModule(version: string): Promise<CompilerModule | null>
{
    try {
        const compilerModuleURL = getRemoteCompilerModuleURL(version)
        const compilerModuleNamespace = (await import(compilerModuleURL)) as CompilerModule

        return compilerModuleNamespace
    } catch (error) {
        console.error('Error fetching compiler module:\n', error)
        return null
    }

}


export async function fetchLatestProductionCompilerVersion(): Promise<string>
{
    const allCompilerVersions = await fetchAllCompilerVersions();
    if (!allCompilerVersions) {
        throw new Error("Failed to load compiler versions")
    }
    const productionCompilerVersions = getCompilerVersionsByType({ allCompilerVersions, type: "production" })
    const latestProductionCompilerVersion = productionCompilerVersions.at(-1);

    if (!latestProductionCompilerVersion) {
        throw new Error("No production compiler versions found")
    }
    return latestProductionCompilerVersion
}

export async function fetchCompilerModuleAndWASM(version: string): Promise<CompilerModuleAndWasm | null>
{
    let compilerModuleAndWasm = compilerModuleAndWasmCache.get(version)
    if (compilerModuleAndWasm) {
        return compilerModuleAndWasm
    }
    const compilerModuleNamespace = await fetchCompilerModule(version)
    const compilerWasmUrl = getRemoteCompilerWasmURL(version)

    if (!compilerModuleNamespace || !compilerWasmUrl) {
        console.warn(`Failed to load compiler module for version ${version}`)
        return null
    }
    compilerModuleAndWasm = {
        module: compilerModuleNamespace,
        wasmURL: compilerWasmUrl
    }
    compilerModuleAndWasmCache.set(version, compilerModuleAndWasm)

    return compilerModuleAndWasm
}