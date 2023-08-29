import path from "@file-services/path";
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

export async function findUp(contextPath: string, fileName: string, fs: BrowserFileSystem) {
  for (const directoryPath of pathChainToRoot(contextPath)) {
    const configFilePath = path.join(directoryPath, fileName);
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

export async function getContainingPackageInfo(filePath: string, fs: BrowserFileSystem) {
  const packageJsonItem = await findUp(path.dirname(filePath), "package.json", fs);
  if (!packageJsonItem) {
    throw new Error(`Could not find package.json for ${filePath}`);
  }

  interface PackageJsonLike {
    name: string;
    version: string;
  }

  const { name: packageName, version: packageVersion } = (await packageJsonItem.json()) as PackageJsonLike;

  const packagePath = path.dirname(packageJsonItem.path);
  const pathInPackage = path.relative(packagePath, filePath);
  return {
    packagePath,
    packageName,
    packageVersion,
    pathInPackage,
  };
}
