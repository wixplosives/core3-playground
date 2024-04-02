import remapping from "@ampproject/remapping";
import type { AnalyzedModule } from "../helpers/module-graph-resolver";
import {
  createEmptySourceMap,
  filePathSourceMapPrefix,
  getReferencedSourceMap,
  inlineJsSourceMap,
  type SourceMapLike,
} from "../helpers/source-maps";
import { compileUsingTypescript, extractModuleRequests } from "../helpers/typescript";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const javascriptAnalyzer: ModuleAnalyzer = {
  test: isJavaScriptFile,
  async analyze({ filePath, fs, ts, specifierResolver }) {
    const fileContents = await fs.readTextFile(filePath);
    const start = performance.now();
    const sourceFile = ts.createSourceFile(filePath, fileContents, ts.ScriptTarget.Latest);
    performance.measure(`Parse ${filePath}`, { start });
    const { hasESM, specifiers: requests } = extractModuleRequests(ts, sourceFile);
    const existingSourceMap = await getReferencedSourceMap(filePath, fileContents, fs, specifierResolver);

    if (hasESM) {
      const contentsWihoutMap = existingSourceMap
        ? fileContents.slice(0, existingSourceMap.sourceMappingURLIdx)
        : fileContents;
      const { outputText, sourceMapText } = compileUsingTypescript(
        ts,
        filePath,
        contentsWihoutMap,
        createCompilerOptions(ts),
      );
      if (!sourceMapText) {
        throw new Error("Expected source map to be generated");
      }

      const sourceMap = (
        existingSourceMap
          ? remapping([sourceMapText, JSON.stringify(existingSourceMap.sourceMap)], () => null)
          : JSON.parse(sourceMapText)
      ) as SourceMapLike;
      if (!existingSourceMap) {
        sourceMap.sources = [filePathSourceMapPrefix + filePath];
      }
      const analyzedModule: AnalyzedModule = {
        compiledContents: inlineJsSourceMap(sourceMap, outputText),
        requests,
      };

      return analyzedModule;
    }

    const sourceMap = existingSourceMap ? existingSourceMap.sourceMap : createEmptySourceMap(filePath, fileContents);
    const compiledContents = inlineJsSourceMap(sourceMap, fileContents);
    const analyzedModule: AnalyzedModule = { compiledContents, requests };

    return analyzedModule;
  },
};

export function isJavaScriptFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".js" || fileExtension === ".cjs" || fileExtension === ".mjs";
}

function createCompilerOptions(ts: typeof import("typescript")): import("typescript").CompilerOptions {
  return {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    sourceMap: true,
    inlineSources: true,
  };
}
