import { compileUsingTypescript, extractModuleRequests } from "../helpers/typescript";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const typescriptAnalyzer: ModuleAnalyzer = {
  test: isTypeScriptFile,
  async analyze({ filePath, fs, ts }) {
    const compilerOptions: import("typescript").CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      sourceMap: true,
      inlineSources: true,
    };
    const fileContents = await fs.readTextFile(filePath);
    const compiledContents = compileUsingTypescript(ts, filePath, fileContents, compilerOptions);
    const start = performance.now();
    const sourceFile = ts.createSourceFile(filePath, compiledContents, ts.ScriptTarget.Latest);
    performance.measure(`Parse ${filePath} (compiled output)`, { start });
    return { compiledContents, requests: extractModuleRequests(ts, sourceFile).specifiers };
  },
};

function isTypeScriptFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".ts" || fileExtension === ".tsx" || fileExtension === ".mts" || fileExtension === ".cts";
}
