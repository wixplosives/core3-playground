import type { AnalyzedModule } from "../helpers/module-graph-resolver";
import { inlineExternalJsSourceMap } from "../helpers/source-maps";
import { compileUsingTypescript, extractModuleRequests } from "../helpers/typescript";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const javascriptAnalyzer: ModuleAnalyzer = {
  test: isJavaScriptFile,
  async analyze({ filePath, fs, ts, specifierResolver }) {
    const fileContents = await fs.readTextFile(filePath);
    const start = performance.now();
    const sourceFile = ts.createSourceFile(filePath, fileContents, ts.ScriptTarget.Latest);
    performance.measure(`Parse ${filePath}`, { start });
    const { hasESM, specifiers } = extractModuleRequests(ts, sourceFile);
    const withInlinedSourcemaps = await inlineExternalJsSourceMap(filePath, fileContents, fs, specifierResolver);
    const compiledContents = hasESM
      ? compileUsingTypescript(ts, filePath, withInlinedSourcemaps, createCompilerOptions(ts))
      : withInlinedSourcemaps;
    const analyzedModule: AnalyzedModule = { compiledContents, requests: specifiers };

    return analyzedModule;
  },
};

export function isJavaScriptFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".js" || fileExtension === ".cjs" || fileExtension === ".mjs";
}

function createCompilerOptions(ts: typeof import("typescript")): import("typescript").CompilerOptions {
  return {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    sourceMap: false,
  };
}
