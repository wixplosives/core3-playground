import path from "@file-services/path";
import postcssSCSS from "postcss-scss";
import { createCssModule, createStyleInjectModule } from "../helpers/css";
import { compileUsingSass } from "../helpers/sass";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";
import { readCssAndInlineAssets } from "./css-analyzer";

export const sassAnalyzer: ModuleAnalyzer = {
  test: isSassFile,
  async analyze({ filePath, fileExtension, sass, fs, cssAssetResolver, sassModuleResolver }) {
    const readSassFileContents = (filePath: string) =>
      readCssAndInlineAssets(filePath, fs, cssAssetResolver, postcssSCSS);

    const css = await compileUsingSass(sass, filePath, readSassFileContents, sassModuleResolver);

    const baseWithoutExt = path.basename(filePath, fileExtension);
    const isSassModule = path.extname(baseWithoutExt) === ".module";

    const compiledContents = isSassModule
      ? await createCssModule(filePath, css, readSassFileContents, cssAssetResolver)
      : createStyleInjectModule(filePath, css);

    return {
      compiledContents,
      requests: [],
    };
  },
};

function isSassFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".scss" || fileExtension === ".sass";
}
