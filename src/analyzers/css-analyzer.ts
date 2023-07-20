import path from "@file-services/path";
import postcss from "postcss";
import type { BrowserFileSystem } from "../fs/browser-file-system";
import { createCssModule, createStyleInjectModule, inlineCSSUrls } from "../helpers/css";
import { inlineExternalCssSourceMap } from "../helpers/source-maps";
import type { AsyncSpecifierResolver } from "../helpers/specifier-resolver";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const cssAnalyzer: ModuleAnalyzer = {
  test: isCssFile,
  async analyze({ filePath, fs, fileExtension, specifierResolver, cssAssetResolver }) {
    const baseWithoutExt = path.basename(filePath, fileExtension);
    const isCssModule = path.extname(baseWithoutExt) === ".module";

    const getFileContents = (filePath: string): Promise<string> =>
      readCssAndInlineAssets(filePath, fs, cssAssetResolver);

    const withInlinedAssets = await getFileContents(filePath);
    const withInlinedSourcemaps = await inlineExternalCssSourceMap(filePath, withInlinedAssets, fs, specifierResolver);

    const compiledContents = isCssModule
      ? await createCssModule(filePath, withInlinedSourcemaps, getFileContents, specifierResolver)
      : createStyleInjectModule(filePath, withInlinedSourcemaps);

    return { compiledContents, requests: [] };
  },
};

export async function readCssAndInlineAssets(
  filePath: string,
  fs: BrowserFileSystem,
  cssAssetResolver: AsyncSpecifierResolver,
  syntax?: postcss.Syntax,
): Promise<string> {
  const contextPath = path.dirname(filePath);
  const fileContents = await fs.readTextFile(filePath);

  const start = performance.now();
  const { root } = postcss().process(fileContents, { from: filePath, syntax: syntax! });
  performance.measure(`Parse ${filePath}`, { start });

  await inlineCSSUrls(contextPath, root, cssAssetResolver, fs);
  return root.toString(syntax?.stringify);
}

function isCssFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".css";
}
