import path from "@file-services/path";
import type { BrowserFileSystem } from "../fs/browser-file-system";
import type { AsyncSpecifierResolver } from "./specifier-resolver";
import { createBase64DataURI } from "./url";

export interface SourceMapLike {
  sources?: string[];
  sourcesContent?: string[];
}

export const filePathSourceMapPrefix = `project://`;
const jsSourceMapURLPrefix = `//# sourceMappingURL=`;
const cssSourceMapURLPrefix = `/*# sourceMappingURL=`;

export function inlineJsSourceMap(sourceMap: SourceMapLike, outputText: string): string {
  const sourceMappingURLIdx = outputText.lastIndexOf(jsSourceMapURLPrefix);
  if (sourceMappingURLIdx !== -1) {
    const base64SourceMapUri = createBase64DataURI(JSON.stringify(sourceMap), `application/json`);
    return outputText.slice(0, sourceMappingURLIdx + jsSourceMapURLPrefix.length) + base64SourceMapUri;
  }
  return outputText;
}
function inlineCssSourceMap(sourceMap: SourceMapLike, outputText: string): string {
  const sourceMappingURLIdx = outputText.lastIndexOf(cssSourceMapURLPrefix);
  if (sourceMappingURLIdx !== -1) {
    const base64SourceMapUri = createBase64DataURI(JSON.stringify(sourceMap), `application/json`);
    return outputText.slice(0, sourceMappingURLIdx + cssSourceMapURLPrefix.length) + base64SourceMapUri + " */";
  }
  return outputText;
}

export function overrideSourceMapFilePath(sourceMap: SourceMapLike, filePath: string): SourceMapLike {
  const sourceMapCopy: SourceMapLike = { ...sourceMap };
  sourceMapCopy.sources = [filePath];
  return sourceMapCopy;
}

export function hasSingleSource({ sources }: SourceMapLike) {
  return Array.isArray(sources) && sources.length === 1 && typeof sources[0] === "string";
}

export async function inlineExternalJsSourceMap(
  filePath: string,
  fileContents: string,
  fs: BrowserFileSystem,
  resolver: AsyncSpecifierResolver,
) {
  const sourceMappingURLIdx = fileContents.lastIndexOf(jsSourceMapURLPrefix);

  if (sourceMappingURLIdx !== -1) {
    const sourceMapTarget = fileContents.slice(sourceMappingURLIdx + jsSourceMapURLPrefix.length).trim();
    if (isNotLocalSourceMap(sourceMapTarget)) {
      return fileContents;
    }
    const { resolvedFile: resolvedMapPath } = await resolver(path.dirname(filePath), `./${sourceMapTarget}`);
    if (resolvedMapPath) {
      const sourceMap = await inlineSourcesIntoSourceMap(fs, resolvedMapPath, resolver);
      return inlineJsSourceMap(sourceMap, fileContents);
    }
  }
  return `${fileContents}\n//# sourceURL=${filePathSourceMapPrefix + filePath}\n`;
}

export async function inlineExternalCssSourceMap(
  filePath: string,
  fileContents: string,
  fs: BrowserFileSystem,
  resolver: AsyncSpecifierResolver,
) {
  const sourceMappingURLIdx = fileContents.lastIndexOf(cssSourceMapURLPrefix);

  if (sourceMappingURLIdx !== -1) {
    let sourceMapTarget = fileContents.slice(sourceMappingURLIdx + cssSourceMapURLPrefix.length).trim();
    sourceMapTarget = sourceMapTarget.endsWith("*/") ? sourceMapTarget.slice(0, -2).trimEnd() : sourceMapTarget;
    if (isNotLocalSourceMap(sourceMapTarget)) {
      return fileContents;
    }
    const { resolvedFile: resolvedMapPath } = await resolver(path.dirname(filePath), `./${sourceMapTarget}`);
    if (resolvedMapPath) {
      const sourceMap = await inlineSourcesIntoSourceMap(fs, resolvedMapPath, resolver);
      return inlineCssSourceMap(sourceMap, fileContents);
    }
  }
  return `${fileContents}\n/*# sourceURL=${filePathSourceMapPrefix + filePath} */\n`;
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
): Promise<SourceMapLike> {
  const sourceMap = (await fs.readJSONFile(sourceMapPath)) as SourceMapLike;
  if (sourceMap.sources?.length) {
    const mapFileContext = path.dirname(sourceMapPath);
    sourceMap.sourcesContent ??= [];
    for (const [idx, source] of sourceMap.sources.entries()) {
      const { resolvedFile: resolvedSourcePath } = await resolver(mapFileContext, `./${source}`);
      if (!resolvedSourcePath) {
        continue;
      }
      sourceMap.sources[idx] = filePathSourceMapPrefix + resolvedSourcePath;
      if (resolvedSourcePath && typeof sourceMap.sourcesContent[idx] !== "string") {
        sourceMap.sourcesContent[idx] = await fs.readTextFile(resolvedSourcePath);
      }
    }
  }
  return sourceMap;
}
