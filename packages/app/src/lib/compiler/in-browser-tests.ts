import type { CompilerModule, CompilerModuleAndWasm } from "./fetch";

// Right now they don't have any effect, but later, this will
// allow us to display which compiler functionalities aren't available
// depending on the chosen compiler version

// the tests don't need to be sophisted,
// just need to make sure the loaded compiler version is working

// Later we want to test each compiler options too

// tests should follow this format:
// <functionality>Test(compilerModule: CompilerModule): Promise<boolean>
const testSuite = {
  async transformTest(compilerModule: CompilerModule) {
    const { code } = await compilerModule.transform(`<div>Hello World</div>`);
    if (code.includes("Hello World")) {
      return true;
    }
    return false;
  },

  async convertToTSXTest(compilerModule: CompilerModule) {
    const { code } = await compilerModule.convertToTSX(
      `<div>Hello World</div>`,
    );
    if (code.includes(`sourceMappingURL=data:application/json;`)) {
      return true;
    }
    return false;
  },
  async parseTest(compilerModule: CompilerModule) {
    const { diagnostics } = await compilerModule.parse(
      `<div>Hello World</div>`,
    );
    if (Array.isArray(diagnostics)) {
      return true;
    }
    return false;
  },
};

type TestedFunctionalitiesName =
  keyof typeof testSuite extends `${infer functionality}Test`
    ? functionality
    : never;
export type CompatibilityStatus =
  | "compatible"
  | "incompatible"
  | "partially-compatible";
export type CompatibilityMap = {
  [k in TestedFunctionalitiesName]: CompatibilityStatus;
};

type TestResults = CompatibilityMap;

export async function runCompilerCompatibilityTestsWithPlayground({
  module: compilerModule,
  wasmURL,
}: CompilerModuleAndWasm): Promise<TestResults> {
  try {
    await compilerModule.initialize({ wasmURL: wasmURL.url });
  } catch (e) {
    try {
      await compilerModule.initialize({ wasmURL: wasmURL.fallback });
    } catch {
      return {
        transform: "incompatible",
        convertToTSX: "incompatible",
        parse: "incompatible",
      };
    }
  }
  const testResults = {} as TestResults;
  for (const [testName, testFn] of Object.entries(testSuite)) {
    const functionalityName = testName.replace("Test", "") as keyof TestResults;
    let result: Awaited<ReturnType<typeof testFn>>;
    try {
      result = await testFn(compilerModule);
      if (result) {
        testResults[functionalityName] = "compatible";
        continue;
      }
    } catch (e) {}
    testResults[functionalityName] = "incompatible";
  }
  compilerModule.teardown?.();
  return testResults;
}
