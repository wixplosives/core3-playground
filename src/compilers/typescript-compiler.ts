import type ts from "typescript";

interface SourceMapLike {
  sources?: [string];
}

const sourceMapURLPrefix = `//# sourceMappingURL=`;
const filePathSourceMapPrefix = `project://`;

export function compileUsingTypescript(
  { transpileModule }: typeof ts,
  filePath: string,
  fileContents: string,
  compilerOptions: ts.CompilerOptions
): string {
  const { outputText, sourceMapText } = transpileModule(fileContents, {
    compilerOptions,
    fileName: filePath,
  });

  if (sourceMapText) {
    const originalSourceMap = JSON.parse(sourceMapText) as SourceMapLike;
    const sourceFilePath = filePathSourceMapPrefix + filePath;
    const fixedSourceMap = hasSingleOrigin(originalSourceMap)
      ? overrideSourceMapFilePath(originalSourceMap, sourceFilePath)
      : originalSourceMap;
    return inlineSourceMap(fixedSourceMap, outputText);
  }
  return outputText;
}

function inlineSourceMap(sourceMap: SourceMapLike, outputText: string): string {
  const sourceMappingURLIdx = outputText.lastIndexOf(sourceMapURLPrefix);
  if (sourceMappingURLIdx !== -1) {
    const base64SourceMapUri = createBase64DataURI(JSON.stringify(sourceMap));
    return outputText.slice(0, sourceMappingURLIdx + sourceMapURLPrefix.length) + base64SourceMapUri;
  }
  return outputText;
}

function overrideSourceMapFilePath(sourceMap: SourceMapLike, filePath: string): SourceMapLike {
  const sourceMapCopy: SourceMapLike = { ...sourceMap };
  sourceMapCopy.sources = [filePath];
  return sourceMapCopy;
}

function hasSingleOrigin({ sources }: SourceMapLike) {
  return Array.isArray(sources) && sources.length === 1 && typeof sources[0] === "string";
}

function createBase64DataURI(value: string, mimeType = `application/json`): string {
  return `data:${mimeType};base64,${btoa(value)}`;
}
