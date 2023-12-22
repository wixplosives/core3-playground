import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const jsonAnalyzer: ModuleAnalyzer = {
  test: isJsonFile,
  async analyze({ filePath, fs }) {
    return { compiledContents: await fs.readTextFile(filePath), requests: [] };
  },
};

export function isJsonFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".json";
}
