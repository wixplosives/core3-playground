import type { IndentedList } from "../components/indented-list";
import { directoryNameToIcon, fileNameToIcon } from "../helpers/icons";
import { ignoreRejections } from "../helpers/javascript";
import type { FileSystemDirectoryItem, FileSystemFileItem } from "./async-fs-api";
import type { BrowserFileSystem } from "./browser-file-system";

export async function* generateIndentedFsItems(
  directoryItem: FileSystemDirectoryItem,
  expandedDirectories: ReadonlySet<string>,
  ignoredDirectories: ReadonlySet<string> = new Set<string>(),
  depth = 0,
): AsyncGenerator<IndentedList.Item> {
  for await (const item of directoryItem) {
    const isDirectory = item.type === "directory";
    const isExpanded = expandedDirectories.has(item.path.href);
    if (isDirectory && ignoredDirectories.has(item.name)) {
      continue;
    }
    yield {
      id: item.path.href,
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

export function* pathChainToRoot(currentUrl: URL) {
  let lastUrl: URL | undefined;
  while (lastUrl?.href !== currentUrl.href) {
    yield currentUrl;
    lastUrl = currentUrl;
    currentUrl = new URL("..", currentUrl);
  }
}

export async function findUp(contextUrl: URL, fileName: string, fs: BrowserFileSystem) {
  for (const directoryUrl of pathChainToRoot(contextUrl)) {
    const configFilePath = new URL(fileName, directoryUrl);
    const configFileHandle = await ignoreRejections(fs.openFile(configFilePath));
    if (configFileHandle) {
      return configFileHandle;
    }
  }
  return;
}

export async function* findFiles(
  directoryItem: FileSystemDirectoryItem,
  filterFile: (fileItem: FileSystemFileItem) => boolean,
  filterDirectory: (fileItem: FileSystemDirectoryItem) => boolean,
): AsyncGenerator<FileSystemFileItem> {
  for await (const item of directoryItem) {
    if (item.type === "file") {
      if (filterFile(item)) {
        yield item;
      }
    } else if (item.type === "directory" && filterDirectory(item)) {
      yield* findFiles(item, filterFile, filterDirectory);
    }
  }
}
