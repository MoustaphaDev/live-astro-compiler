import { getDefaultCompilerVersionToLoad, switchCompiler } from "./module";
export { switchCompiler, remoteCompilerModule } from "./module";

export async function initializeCompilerModuleAndWASM()
{
    const defaultCompilerVersionToLoad = await getDefaultCompilerVersionToLoad()

    // initialize the compiler module with the default compiler version
    await switchCompiler(defaultCompilerVersionToLoad)
}
