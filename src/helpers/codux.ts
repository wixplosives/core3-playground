import path from "@file-services/path";
import type { BrowserFileSystem } from "../fs/browser-file-system";
import { ignoreRejections } from "./javascript";

export const coduxConfigFileName = "codux.config.json";

export interface CoduxConfigFile {
  boardGlobalSetup?: string;
}

export async function getCoduxConfig(
  fs: BrowserFileSystem,
  contextPath: string,
): Promise<{ configFilePath: string; config: CoduxConfigFile } | undefined> {
  for (const directoryPath of pathChainToRoot(contextPath)) {
    const configFilePath = path.join(directoryPath, coduxConfigFileName);
    const configFileHandle = await ignoreRejections(fs.openFile(configFilePath));
    if (configFileHandle) {
      const config = (await configFileHandle?.json()) as CoduxConfigFile;
      return { configFilePath, config };
    }
  }
  return undefined;
}

function* pathChainToRoot(currentPath: string) {
  let lastPath: string | undefined;
  while (lastPath !== currentPath) {
    yield currentPath;
    lastPath = currentPath;
    currentPath = path.dirname(currentPath);
  }
}
