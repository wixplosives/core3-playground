import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const svgAnalyzer: ModuleAnalyzer = {
  test: isSvgFile,
  analyze() {
    // TODO: actually implement this
    return { compiledContents: "exports.ReactComponent = () => null;", requests: [] };
  },
};

function isSvgFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".svg";
}
