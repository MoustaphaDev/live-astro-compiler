import type { CompilerModule, CompilerModuleAndWasm } from "./cache";
import type { CompatibilityStatus } from "./storage";

// the tests don't need to be sophisted,
// just need to make sure the loaded compiler version is working

// Later we want to test each compiler options too

// tests should follow this format:
// <functionality>Test(compilerModule: CompilerModule): Promise<boolean>
const testSuite = {
    async transformTest(compilerModule: CompilerModule)
    {
        const { code } = await compilerModule.transform(`<div>Hello World</div>`,)
        if (code.includes("Hello World")) {
            return true
        }
        return false
    }

    ,
    async convertToTSXTest(compilerModule: CompilerModule)
    {
        const { code } = await compilerModule.convertToTSX(`<div>Hello World</div>`,)
        if (code.includes(`sourceMappingURL=data:application/json;`)) {
            return true
        }
        return false
    }
    ,
    async parseTest(compilerModule: CompilerModule)
    {
        const { diagnostics } = await compilerModule.parse(`<div>Hello World</div>`,)
        if (Array.isArray(diagnostics)) {
            return true
        }
        return false
    }
}

type TestResults = {
    [k in keyof typeof testSuite extends `${infer functionality}Test` ? functionality : never]: CompatibilityStatus

}

export async function runCompilerCompatibilityTestsWithPlayground({ module: compilerModule, wasmURL }: CompilerModuleAndWasm): Promise<TestResults>
{
    await compilerModule.initialize({ wasmURL })
    const testResults = {} as TestResults
    for (const [testName, testFn] of Object.entries(testSuite)) {
        const functionalityName = testName.replace("Test", "") as keyof TestResults
        const result = await testFn(compilerModule)
        if (result) {
            testResults[functionalityName] = "compatible"
            continue
        }
        testResults[functionalityName] = "incompatible"
    }
    return testResults
}