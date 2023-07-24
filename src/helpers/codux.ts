import { findUp } from "../fs/async-fs-operations";
import type { BrowserFileSystem } from "../fs/browser-file-system";

export const coduxConfigFileName = "codux.config.json";

export interface CoduxConfigFile {
  boardGlobalSetup?: string;
}

export async function getCoduxConfig(
  fs: BrowserFileSystem,
  contextPath: string,
): Promise<{ configFilePath: string; config: CoduxConfigFile } | undefined> {
  const configFileItem = await findUp(fs, contextPath, coduxConfigFileName);
  if (configFileItem) {
    const config = (await configFileItem?.json()) as CoduxConfigFile;
    return { configFilePath: configFileItem.path, config };
  }
  return undefined;
}
