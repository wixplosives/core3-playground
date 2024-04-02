import path from "@file-services/path";
import type { BrowserFileSystem } from "../fs/browser-file-system";
import type { AsyncSpecifierResolver } from "./specifier-resolver";
import { createBase64DataURI } from "./url";

export interface SourceMapLike {
  version: 3;
  names: string[];
  mappings: string;
  file?: string;
  sources?: string[];
  sourcesContent?: string[];
}

export const filePathSourceMapPrefix = `project://`;
const jsSourceMapURLPrefix = `//# sourceMappingURL=`;
const cssSourceMapURLPrefix = `/*# sourceMappingURL=`;

export function inlineJsSourceMap(sourceMap: SourceMapLike, outputText: string): string {
  const base64SourceMapUri = createBase64DataURI(JSON.stringify(sourceMap), `application/json`);
  const sourceMappingURLIdx = outputText.lastIndexOf(jsSourceMapURLPrefix);
  return sourceMappingURLIdx !== -1
    ? outputText.slice(0, sourceMappingURLIdx + jsSourceMapURLPrefix.length) + base64SourceMapUri
    : outputText + `\n${jsSourceMapURLPrefix}${base64SourceMapUri}`;
}
function inlineCssSourceMap(sourceMap: SourceMapLike, outputText: string): string {
  const sourceMappingURLIdx = outputText.lastIndexOf(cssSourceMapURLPrefix);
  if (sourceMappingURLIdx !== -1) {
    const base64SourceMapUri = createBase64DataURI(JSON.stringify(sourceMap), `application/json`);
    return outputText.slice(0, sourceMappingURLIdx + cssSourceMapURLPrefix.length) + base64SourceMapUri + " */";
  }
  return outputText;
}

export async function getReferencedSourceMap(
  filePath: string,
  fileContents: string,
  fs: BrowserFileSystem,
  resolver: AsyncSpecifierResolver,
): Promise<{ sourceMap: SourceMapLike; sourceMappingURLIdx: number } | undefined> {
  const sourceMappingURLIdx = fileContents.lastIndexOf(jsSourceMapURLPrefix);

  if (sourceMappingURLIdx === -1) {
    return;
  }
  const sourceMapTarget = fileContents.slice(sourceMappingURLIdx + jsSourceMapURLPrefix.length).trim();
  if (isNotLocalSourceMap(sourceMapTarget)) {
    return;
  }
  const { resolvedFile: resolvedMapPath } = await resolver(path.dirname(filePath), `./${sourceMapTarget}`);
  if (!resolvedMapPath || path.extname(resolvedMapPath) !== ".map") {
    return;
  }
  const sourceMap = await inlineSourcesIntoSourceMap(fs, resolvedMapPath, resolver);
  return { sourceMap, sourceMappingURLIdx };
}

export async function inlineExternalCssSourceMap(
  filePath: string,
  fileContents: string,
  fs: BrowserFileSystem,
  resolver: AsyncSpecifierResolver,
  sourceURLPrefix = filePathSourceMapPrefix,
) {
  const sourceMappingURLIdx = fileContents.lastIndexOf(cssSourceMapURLPrefix);

  if (sourceMappingURLIdx !== -1) {
    let sourceMapTarget = fileContents.slice(sourceMappingURLIdx + cssSourceMapURLPrefix.length).trim();
    sourceMapTarget = sourceMapTarget.endsWith("*/") ? sourceMapTarget.slice(0, -2).trimEnd() : sourceMapTarget;
    if (isNotLocalSourceMap(sourceMapTarget)) {
      return fileContents;
    }
    const { resolvedFile: resolvedMapPath } = await resolver(path.dirname(filePath), `./${sourceMapTarget}`);
    if (resolvedMapPath && path.extname(resolvedMapPath) === ".map") {
      const sourceMap = await inlineSourcesIntoSourceMap(fs, resolvedMapPath, resolver);
      return inlineCssSourceMap(sourceMap, fileContents);
    }
  }
  return `${fileContents}\n/*# sourceURL=${sourceURLPrefix + filePath} */\n`;
}

function isNotLocalSourceMap(sourceMapTarget: string) {
  return (
    sourceMapTarget.startsWith("data:") || sourceMapTarget.startsWith("http:") || sourceMapTarget.startsWith("https:")
  );
}

async function inlineSourcesIntoSourceMap(
  fs: BrowserFileSystem,
  sourceMapPath: string,
  resolver: AsyncSpecifierResolver,
  sourceURLPrefix = filePathSourceMapPrefix,
): Promise<SourceMapLike> {
  const sourceMap = (await fs.readJSONFile(sourceMapPath)) as SourceMapLike;
  if (sourceMap.sources?.length) {
    const mapFileContext = path.dirname(sourceMapPath);
    sourceMap.sourcesContent ??= [];
    for (const [idx, source] of sourceMap.sources.entries()) {
      const { resolvedFile: resolvedSourcePath } = await resolver(mapFileContext, `./${source}`);
      const originalSourcePath = resolvedSourcePath ? resolvedSourcePath : path.join(mapFileContext, source);
      sourceMap.sources[idx] = sourceURLPrefix + originalSourcePath;
      if (resolvedSourcePath && typeof sourceMap.sourcesContent[idx] !== "string") {
        sourceMap.sourcesContent[idx] = await fs.readTextFile(resolvedSourcePath);
      }
    }
  }
  return sourceMap;
}

export function createEmptySourceMap(filePath: string, fileContents: string): SourceMapLike {
  return {
    version: 3,
    sources: [filePathSourceMapPrefix + filePath],
    sourcesContent: [fileContents],
    mappings: "",
    names: [],
  };
}
