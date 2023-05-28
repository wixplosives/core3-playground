import path from "@file-services/path";
import type { FileTree } from "./components/file-tree";
import { directoryNameToIcon, fileNameToIcon } from "./icons/path-to-icon";

const sortHandlesByName = (a: FileSystemHandle, b: FileSystemHandle) => (a.name >= b.name ? 1 : -1);

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
  openedDirectories: Set<string>,
  depth = 0
): AsyncGenerator<FileTree.Item> {
  for await (const childHandle of readDirectoryHandle(directoryHandle)) {
    const childPath = path.join(directoryPath, childHandle.name);
    const isDirectory = childHandle.kind === "directory";
    yield {
      id: childPath,
      depth,
      label: childHandle.name,
      iconUrl: isDirectory ? directoryNameToIcon(childHandle.name) : fileNameToIcon(childHandle.name),
    };
    if (isDirectory && openedDirectories.has(childPath)) {
      yield* readDirectoryDeep(childHandle, childPath, openedDirectories, depth + 1);
    }
  }
}

export async function collectIntoArray<T>(asyncIter: AsyncIterable<T>): Promise<T[]> {
  const collected: T[] = [];
  for await (const item of asyncIter) {
    collected.push(item);
  }
  return collected;
}

export async function getDeepFileHandle(
  rootDirectoryHandle: FileSystemDirectoryHandle,
  pathToFile: string[]
): Promise<FileSystemFileHandle> {
  let currentDirectoryHandle = rootDirectoryHandle;
  for (const [idx, pathName] of pathToFile.entries()) {
    const isLast = idx === pathName.length - 1;
    if (isLast) {
      return await currentDirectoryHandle.getFileHandle(pathName);
    } else {
      currentDirectoryHandle = await currentDirectoryHandle.getDirectoryHandle(pathName);
    }
  }
  throw new Error(`cannot retrieve file handle for ${pathToFile.join("/")}`);
}
