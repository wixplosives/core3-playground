import path from "@file-services/path";
import type { IndentedList } from "../components/indented-list";
import { directoryNameToIcon, fileNameToIcon } from "./icons";

const sortHandlesByName = (a: FileSystemHandle, b: FileSystemHandle) => (a.name >= b.name ? 1 : -1);

export function getPathToFile(filePath: string): string[] {
  const pathToFile = filePath.split("/");
  pathToFile.shift();
  return pathToFile;
}

/** Generate sorted lists of files and directories that the directory contains */
export async function* readDirectoryHandle(directoryHandle: FileSystemDirectoryHandle) {
  const files: FileSystemFileHandle[] = [];
  const directories: FileSystemDirectoryHandle[] = [];

  for await (const entry of directoryHandle.values()) {
    if (entry.kind === "file") {
      files.push(entry);
    } else if (entry.kind === "directory") {
      directories.push(entry);
    }
  }

  directories.sort(sortHandlesByName);
  files.sort(sortHandlesByName);

  yield* directories;
  yield* files;
}

export async function* readDirectoryDeep(
  directoryHandle: FileSystemDirectoryHandle,
  directoryPath: string,
  expandedDirectories: Set<string>,
  depth = 0
): AsyncGenerator<IndentedList.Item> {
  for await (const childHandle of readDirectoryHandle(directoryHandle)) {
    const childPath = path.join(directoryPath, childHandle.name);
    const isDirectory = childHandle.kind === "directory";
    const isExpanded = expandedDirectories.has(childPath);
    if (isDirectory && childHandle.name === ".git") {
      continue;
    }
    yield {
      id: childPath,
      depth,
      label: childHandle.name,
      iconUrl: isDirectory ? directoryNameToIcon(childHandle.name, isExpanded) : fileNameToIcon(childHandle.name),
      type: childHandle.kind,
    };
    if (isDirectory && isExpanded) {
      yield* readDirectoryDeep(childHandle, childPath, expandedDirectories, depth + 1);
    }
  }
}

export async function getDeepFileHandle(
  rootDirectoryHandle: FileSystemDirectoryHandle,
  pathToFile: string[]
): Promise<FileSystemFileHandle | undefined> {
  let currentDirectoryHandle = rootDirectoryHandle;
  const lastIdx = pathToFile.length - 1;
  for (const [idx, pathName] of pathToFile.entries()) {
    try {
      if (idx === lastIdx) {
        return await currentDirectoryHandle.getFileHandle(pathName);
      } else {
        currentDirectoryHandle = await currentDirectoryHandle.getDirectoryHandle(pathName);
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}
