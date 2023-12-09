import { getDefaultCompilerVersionToLoad, setCompiler } from "./module";
export { setCompiler, remoteCompilerModule } from "./module";

export async function initializeCompilerWithDefaultVersion() {
  const { compilerVersionToLoad: defaultCompilerVersionToLoad } =
    await getDefaultCompilerVersionToLoad();

  // initialize the compiler module with the default compiler version
  await setCompiler(defaultCompilerVersionToLoad);
}
