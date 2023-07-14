import path from "@file-services/path";
import type { BrowserFileSystem } from "../fs/browser-file-system";
import { ignoreRejections } from "./javascript";

export const coduxConfigFileName = "codux.config.json";

export interface CoduxConfigFile {
  boardGlobalSetup?: string;
}

export async function getCoduxConfig(
  fs: BrowserFileSystem,
  directoryPath: string,
): Promise<CoduxConfigFile | undefined> {
  const configFileHandle = await ignoreRejections(fs.openFile(path.join(directoryPath, coduxConfigFileName)));
  return configFileHandle?.json() as Promise<{ boardGlobalSetup?: string }>;
}
