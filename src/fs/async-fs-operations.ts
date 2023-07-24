import path from "@file-services/path";
import type { IndentedList } from "../components/indented-list";
import { directoryNameToIcon, fileNameToIcon } from "../helpers/icons";
import { ignoreRejections } from "../helpers/javascript";
import type { FileSystemDirectoryItem } from "./async-fs-api";
import type { BrowserFileSystem } from "./browser-file-system";

export async function* generateIndentedFsItems(
  directoryItem: FileSystemDirectoryItem,
  expandedDirectories: ReadonlySet<string>,
  ignoredDirectories: ReadonlySet<string> = new Set<string>(),
  depth = 0,
): AsyncGenerator<IndentedList.Item> {
  for await (const item of directoryItem) {
    const isDirectory = item.type === "directory";
    const isExpanded = expandedDirectories.has(item.path);
    if (isDirectory && ignoredDirectories.has(item.name)) {
      continue;
    }
    yield {
      id: item.path,
      depth,
      label: item.name,
      iconUrl: isDirectory ? directoryNameToIcon(item.name, isExpanded) : fileNameToIcon(item.name),
      type: item.type,
    };
    if (isDirectory && isExpanded) {
      yield* generateIndentedFsItems(item, expandedDirectories, ignoredDirectories, depth + 1);
    }
  }
}

export function* pathChainToRoot(currentPath: string) {
  let lastPath: string | undefined;
  while (lastPath !== currentPath) {
    yield currentPath;
    lastPath = currentPath;
    currentPath = path.dirname(currentPath);
  }
}

export async function findUp(fs: BrowserFileSystem, contextPath: string, fileName: string) {
  for (const directoryPath of pathChainToRoot(contextPath)) {
    const configFilePath = path.join(directoryPath, fileName);
    const configFileHandle = await ignoreRejections(fs.openFile(configFilePath));
    if (configFileHandle) {
      return configFileHandle;
    }
  }
  return;
}
