
export type CompilerModule = typeof import("@astrojs/compiler")

export type CompilerModuleAndWasm = {
    module: CompilerModule,
    wasmURL: string
}

export function createCompilerCache()
{
    const cache = new Map<string, CompilerModuleAndWasm>()
    return cache;
}


export const compilerModuleAndWasmCache = createCompilerCache()
