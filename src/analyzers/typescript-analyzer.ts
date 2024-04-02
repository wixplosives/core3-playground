import { filePathSourceMapPrefix, inlineJsSourceMap, type SourceMapLike } from "../helpers/source-maps";
import { compileUsingTypescript, extractModuleRequests } from "../helpers/typescript";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const typescriptAnalyzer: ModuleAnalyzer = {
  test: isTypeScriptFile,
  async analyze({ filePath, fs, ts }) {
    const compilerOptions = createCompilerOptions(ts);
    const fileContents = await fs.readTextFile(filePath);
    const { outputText, sourceMapText } = compileUsingTypescript(ts, filePath, fileContents, compilerOptions);
    if (!sourceMapText) {
      throw new Error("Expected source map to be generated");
    }
    const sourceMap = JSON.parse(sourceMapText) as SourceMapLike;
    sourceMap.sources = [filePathSourceMapPrefix + filePath];
    const compiledContents = inlineJsSourceMap(sourceMap, outputText);

    const start = performance.now();
    const sourceFile = ts.createSourceFile(filePath, compiledContents, ts.ScriptTarget.Latest);
    performance.measure(`Parse ${filePath} (compiled output)`, { start });

    const requests = extractModuleRequests(ts, sourceFile).specifiers;

    return { compiledContents, requests };
  },
};

function createCompilerOptions(ts: typeof import("typescript")): import("typescript").CompilerOptions {
  return {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSXDev,
    sourceMap: true,
    inlineSources: true,
  };
}

function isTypeScriptFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".ts" || fileExtension === ".tsx" || fileExtension === ".mts" || fileExtension === ".cts";
}
