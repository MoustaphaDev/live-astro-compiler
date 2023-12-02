import { CompilerModule, CompilerModuleAndWasm } from "./cache"

const ASTRO_COMPILER_NPM_REGISTRY_URL = "https://registry.npmjs.org/astro"

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

