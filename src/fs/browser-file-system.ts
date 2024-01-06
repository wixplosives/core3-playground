import { ignoreRejections } from "../helpers/javascript";
import type { AsyncFileSystem, FileSystemDirectoryItem, FileSystemFileItem } from "./async-fs-api";

export interface BrowserFileSystem extends AsyncFileSystem {
  root: FileSystemDirectoryHandle;
}

export function createBrowserFileSystem(
  rootDirectoryHandle: FileSystemDirectoryHandle,
  fileHandleCache?: Map<string, FileSystemFileHandle | undefined>,
  directoryHandleCache?: Map<string, FileSystemDirectoryHandle | undefined>,
): BrowserFileSystem {
  return {
    root: rootDirectoryHandle,
    async statFile(fileUrl) {
      const fileHandle = await getEnsuredFileHandle(fileUrl);
      const file = await fileHandle.getFile();
      return {
        size: file.size,
        lastModified: file.lastModified,
      };
    },
    async readFile(fileUrl) {
      const fileHandle = await getEnsuredFileHandle(fileUrl);
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    readTextFile,
    async readJSONFile(fileUrl) {
      const fileContents = await readTextFile(fileUrl);
      return safeJSONParse(fileUrl, fileContents);
    },
    async fileExists(fileUrl) {
      const fileHandle = await getFileHandle(fileUrl);
      return !!fileHandle;
    },
    async directoryExists(directoryUrl) {
      const directoryHandle = await getDirectoryHandle(directoryUrl);
      return !!directoryHandle;
    },
    async openFile(fileUrl) {
      const fileHandle = await getEnsuredFileHandle(fileUrl);
      return createFileItem(fileHandle, fileUrl);
    },
    async openDirectory(directoryUrl) {
      const directoryHandle = await getDirectoryHandle(directoryUrl);
      if (!directoryHandle) {
        throw new Error(`cannot get directory handle for ${directoryUrl.href}`);
      }
      return createDirectoryItem(directoryHandle, directoryUrl);
    },
  };

  async function readTextFile(fileUrl: URL) {
    const fileHandle = await getEnsuredFileHandle(fileUrl);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async function getEnsuredFileHandle(fileUrl: URL) {
    const fileHandle = await getFileHandle(fileUrl);
    if (!fileHandle) {
      throw new Error(`cannot get file handle for ${fileUrl.href}`);
    }
    return fileHandle;
  }

  async function getFileHandle(fileUrl: URL): Promise<FileSystemFileHandle | undefined> {
    if (fileHandleCache?.has(fileUrl.href)) {
      return fileHandleCache.get(fileUrl.href);
    }
    const parentURL = new URL("..", fileUrl);
    const parentHandle = await getDirectoryHandle(parentURL);
    const fileName = basenameURL(fileUrl);
    const fileHandle = await ignoreRejections(parentHandle?.getFileHandle(fileName));
    fileHandleCache?.set(fileUrl.href, fileHandle);
    return fileHandle;
  }

  async function getDirectoryHandle(directoryUrl: URL): Promise<FileSystemDirectoryHandle | undefined> {
    if (directoryHandleCache?.has(directoryUrl.href)) {
      return directoryHandleCache.get(directoryUrl.href);
    }
    const parentUrl = new URL("..", directoryUrl);
    if (parentUrl.href === directoryUrl.href) {
      return rootDirectoryHandle;
    }
    const parentHandle = await getDirectoryHandle(parentUrl);
    const directoryName = basenameURL(directoryUrl);
    const directoryHandle = await ignoreRejections(parentHandle?.getDirectoryHandle(directoryName));
    directoryHandleCache?.set(directoryUrl.href, directoryHandle);
    return directoryHandle;
  }
}

function createFileItem(fileHandle: FileSystemFileHandle, fileUrl: URL): FileSystemFileItem {
  return {
    type: "file",
    name: fileHandle.name,
    path: fileUrl,
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
      return safeJSONParse(fileUrl, fileContents);
    },
    async text() {
      const file = await fileHandle.getFile();
      return file.text();
    },
  };
}

function createDirectoryItem(directoryHandle: FileSystemDirectoryHandle, directoryUrl: URL): FileSystemDirectoryItem {
  return {
    type: "directory",
    name: directoryHandle.name,
    path: directoryUrl,
    get [Symbol.asyncIterator]() {
      return () => createDirectoryIterator(directoryHandle, directoryUrl);
    },
  };
}

async function* createDirectoryIterator(
  directoryHandle: FileSystemDirectoryHandle,
  directoryUrl: URL,
): AsyncGenerator<FileSystemDirectoryItem | FileSystemFileItem> {
  for await (const handle of readDirectoryHandleSorted(directoryHandle)) {
    if (handle.kind === "file") {
      yield createFileItem(handle, new URL(handle.name, directoryUrl));
    } else if (handle.kind === "directory") {
      yield createDirectoryItem(handle, new URL(handle.name + "/", directoryUrl));
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

function safeJSONParse(fileUrl: URL, fileContents: string) {
  try {
    return JSON.parse(fileContents) as unknown;
  } catch (e) {
    throw new Error(`parsing ${fileUrl.href}`, { cause: e });
  }
}

export function pathFromURL(url: URL) {
  return decodeURIComponent(url.pathname);
}

function basenameURL(url: URL) {
  let path = pathFromURL(url);
  if (path.endsWith("/") && path.length > 1) {
    path = path.slice(0, -1);
  }
  return path.split("/").pop()!;
}
