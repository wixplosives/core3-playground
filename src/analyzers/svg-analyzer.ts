import { createBase64DataURIModule } from "../helpers/url";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const svgAnalyzer: ModuleAnalyzer = {
  test: isSvgFile,
  async analyze({ filePath, fs }) {
    const fileContents = await fs.readFile(filePath);
    // TODO: actually implement this
    return {
      compiledContents: `${createBase64DataURIModule(filePath, fileContents)}
exports.ReactComponent = () => null;\n`,
      requests: [],
    };
  },
};

function isSvgFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".svg";
}
