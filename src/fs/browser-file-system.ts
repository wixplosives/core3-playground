import path from "@file-services/path";
import type { AsyncFileSystem, FileSystemDirectoryItem, FileSystemFileItem } from "./async-fs-api";
import { ignoreRejections } from "../helpers/javascript";

export interface BrowserFileSystem extends AsyncFileSystem {
  root: FileSystemDirectoryHandle;
}

export function createBrowserFileSystem(rootDirectoryHandle: FileSystemDirectoryHandle): BrowserFileSystem {
  return {
    root: rootDirectoryHandle,
    async statFile(filePath) {
      const fileHandle = await getEnsuredFileHandle(rootDirectoryHandle, filePath);
      const file = await fileHandle.getFile();
      return {
        size: file.size,
        lastModified: file.lastModified,
      };
    },
    async readFile(filePath) {
      const fileHandle = await getEnsuredFileHandle(rootDirectoryHandle, filePath);
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    readTextFile,
    async readJSONFile(filePath: string) {
      const fileContents = await readTextFile(filePath);
      return safeJSONParse(filePath, fileContents);
    },
    async fileExists(filePath) {
      const fileHandle = await getDeepFileHandle(rootDirectoryHandle, filePath);
      return !!fileHandle;
    },
    async directoryExists(directoryPath) {
      const directoryHandle = await getDeepDirectoryHandle(rootDirectoryHandle, directoryPath);
      return !!directoryHandle;
    },
    async openFile(filePath) {
      const fileHandle = await getEnsuredFileHandle(rootDirectoryHandle, filePath);
      return createFileItem(fileHandle, filePath);
    },
    async openDirectory(directoryPath) {
      const directoryHandle = await getDeepDirectoryHandle(rootDirectoryHandle, directoryPath);
      if (!directoryHandle) {
        throw new Error(`cannot get directory handle for ${directoryPath}`);
      }
      return createDirectoryItem(directoryHandle, directoryPath);
    },
  };

  async function readTextFile(filePath: string) {
    const fileHandle = await getEnsuredFileHandle(rootDirectoryHandle, filePath);
    const file = await fileHandle.getFile();
    return file.text();
  }
}

async function getEnsuredFileHandle(rootDirectoryHandle: FileSystemDirectoryHandle, filePath: string) {
  const fileHandle = await getDeepFileHandle(rootDirectoryHandle, filePath);
  if (!fileHandle) {
    throw new Error(`cannot get file handle for ${filePath}`);
  }
  return fileHandle;
}

function createFileItem(fileHandle: FileSystemFileHandle, filePath: string): FileSystemFileItem {
  return {
    type: "file",
    name: fileHandle.name,
    path: filePath,
    async stat() {
      const file = await fileHandle.getFile();
      return {
        size: file.size,
        lastModified: file.lastModified,
      };
    },
    async buffer() {
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    async json() {
      const file = await fileHandle.getFile();
      const fileContents = await file.text();
      return safeJSONParse(filePath, fileContents);
    },
    async text() {
      const file = await fileHandle.getFile();
      return file.text();
    },
  };
}

function createDirectoryItem(
  directoryHandle: FileSystemDirectoryHandle,
  directoryPath: string
): FileSystemDirectoryItem {
  return {
    type: "directory",
    name: directoryHandle.name,
    path: directoryPath,
    get [Symbol.asyncIterator]() {
      return () => createDirectoryIterator(directoryHandle, directoryPath);
    },
  };
}

async function* createDirectoryIterator(
  directoryHandle: FileSystemDirectoryHandle,
  directoryPath: string
): AsyncGenerator<FileSystemDirectoryItem | FileSystemFileItem> {
  for await (const handle of readDirectoryHandleSorted(directoryHandle)) {
    const itemPath = path.join(directoryPath, handle.name);
    if (handle.kind === "file") {
      yield createFileItem(handle, itemPath);
    } else if (handle.kind === "directory") {
      yield createDirectoryItem(handle, itemPath);
    }
  }
}

const sortHandlesByName = (a: FileSystemHandle, b: FileSystemHandle) => (a.name >= b.name ? 1 : -1);

/** Generate sorted lists of files and directories that the directory contains */
async function* readDirectoryHandleSorted(directoryHandle: FileSystemDirectoryHandle) {
  const files: FileSystemFileHandle[] = [];
  const directories: FileSystemDirectoryHandle[] = [];

  for await (const handle of directoryHandle.values()) {
    if (handle.kind === "file") {
      files.push(handle);
    } else if (handle.kind === "directory") {
      directories.push(handle);
    }
  }

  directories.sort(sortHandlesByName);
  files.sort(sortHandlesByName);

  yield* directories;
  yield* files;
}

async function getDeepFileHandle(
  rootDirectoryHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<FileSystemFileHandle | undefined> {
  const fileBasename = path.basename(filePath);
  const parentPath = path.dirname(filePath);
  const parentHandle = await getDeepDirectoryHandle(rootDirectoryHandle, parentPath);
  return await ignoreRejections(parentHandle?.getFileHandle(fileBasename));
}

async function getDeepDirectoryHandle(
  rootDirectoryHandle: FileSystemDirectoryHandle,
  directoryPath: string
): Promise<FileSystemDirectoryHandle | undefined> {
  const directoryChain = directoryPath.split("/");
  let currentDirectoryHandle = rootDirectoryHandle;
  const lastIdx = directoryChain.length - 1;
  for (const [idx, pathName] of directoryChain.entries()) {
    try {
      if (pathName !== "" && pathName !== ".") {
        currentDirectoryHandle = await currentDirectoryHandle.getDirectoryHandle(pathName);
      }
      if (idx === lastIdx) {
        return currentDirectoryHandle;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function safeJSONParse(filePath: string, fileContents: string) {
  try {
    return JSON.parse(fileContents) as unknown;
  } catch (e) {
    throw new Error(`parsing ${filePath}`, { cause: e });
  }
}
