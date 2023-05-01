/* eslint-disable @typescript-eslint/require-await */
import path from "@file-services/path";
import {
  FileSystemConstants,
  type IFileSystem,
  type IFileSystemPromiseActions,
  type BufferEncoding,
  type IDirectoryEntry,
  type IFileSystemStats,
  type ReadFileOptions,
  type RmOptions,
  type StatSyncOptions,
  type WriteFileOptions,
} from "./fs-api";
import type { WatchEventListener, IWatchEvent } from "./watch-api";

const posixPath = path.posix;

export interface IMemFileSystem extends IFileSystem {
  root: IFsMemDirectoryNode;
}

export interface IFsMemStatsEntry extends IFileSystemStats, IDirectoryEntry {}

export interface IFsMemNode {
  type: "file" | "dir" | "symlink";
  entry: IFsMemStatsEntry;
}

export type IFsMemNodeType = IFsMemFileNode | IFsMemDirectoryNode | IFsMemSymlinkNode;

export interface IFsMemFileNode extends IFsMemNode {
  type: "file";
  contents: Uint8Array;
}

export interface IFsMemDirectoryNode extends IFsMemNode {
  type: "dir";
  contents: Map<string, IFsMemNodeType>;
}

export interface IFsMemSymlinkNode extends IFsMemNode {
  type: "symlink";
  target: string;
}

export function createMemoryFs(): IMemFileSystem {
  const root: IFsMemDirectoryNode = createMemDirectory("memory-fs-root");
  const eventListeners = new Set<WatchEventListener>();
  const textEncoder = new TextEncoder();
  realpathSync.native = realpathSync;

  let workingDirectoryPath: string = posixPath.sep;
  const chmodSync = (..._args: unknown[]) => undefined;
  return {
    root,
    ...posixPath,
    resolve: resolvePath,
    watchService: {
      addGlobalListener(listener) {
        eventListeners.add(listener);
      },
      removeGlobalListener(listener) {
        eventListeners.delete(listener);
      },
      clearGlobalListeners() {
        eventListeners.clear();
      },
    },
    caseSensitive: true,
    cwd,
    chdir,
    copyFileSync,
    existsSync,
    lstatSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    realpathSync,
    readlinkSync,
    renameSync,
    rmdirSync,
    rmSync,
    statSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
    chmodSync,
    promises: {
      readFile: async function readFile(...args: [string]) {
        return readFileSync(...args);
      } as IFileSystemPromiseActions["readFile"],
      async writeFile(...args) {
        return writeFileSync(...args);
      },
      async unlink(filePath) {
        return unlinkSync(filePath);
      },
      readdir: async function readdir(...args: [string]) {
        return readdirSync(...args);
      } as IFileSystemPromiseActions["readdir"],
      async mkdir(directoryPath, ...args) {
        return mkdirSync(directoryPath, ...args);
      },
      async rmdir(directoryPath) {
        return rmdirSync(directoryPath);
      },
      async exists(nodePath) {
        return existsSync(nodePath);
      },
      async stat(nodePath) {
        return statSync(nodePath);
      },
      async lstat(nodePath) {
        return lstatSync(nodePath);
      },
      async realpath(nodePath) {
        return realpathSync(nodePath);
      },
      async rename(srcPath, destPath) {
        return renameSync(srcPath, destPath);
      },
      async copyFile(...args) {
        return copyFileSync(...args);
      },
      async readlink(path) {
        return readlinkSync(path);
      },
      async symlink(...args) {
        return symlinkSync(...args);
      },
      async rm(...args) {
        return rmSync(...args);
      },
      async chmod(...args) {
        return chmodSync(...args);
      },
    },
  };

  function resolvePath(...pathSegments: string[]): string {
    return posixPath.resolve(workingDirectoryPath, ...pathSegments);
  }

  function cwd(): string {
    return workingDirectoryPath;
  }

  function chdir(directoryPath: string): void {
    workingDirectoryPath = resolvePath(directoryPath);
  }

  function readFileSync(filePath: string, options?: { encoding?: null; flag?: string } | null): Uint8Array;
  function readFileSync(
    filePath: string,
    options: { encoding: BufferEncoding; flag?: string } | BufferEncoding
  ): string;
  function readFileSync(filePath: string, options?: ReadFileOptions): string | Uint8Array {
    const resolvedPath = resolvePath(filePath);
    const fileNode = getNode(resolvedPath);

    if (!fileNode) {
      throw createFsError(resolvedPath, FsErrorCodes.NO_FILE, "ENOENT");
    } else if (fileNode.type === "dir") {
      throw createFsError(resolvedPath, FsErrorCodes.PATH_IS_DIRECTORY, "EISDIR");
    }

    const encoding = typeof options === "string" ? options : options?.encoding;
    return encoding === null || encoding == undefined
      ? fileNode.contents
      : new TextDecoder(encoding).decode(fileNode.contents);
  }

  function writeFileSync(filePath: string, fileContent: string | Uint8Array, _options?: WriteFileOptions): void {
    if (_options) {
      _options;
    }
    if (filePath === "") {
      throw createFsError(filePath, FsErrorCodes.NO_FILE_OR_DIRECTORY, "ENOENT");
    }

    const resolvedPath = resolvePath(filePath);
    const existingNode = getNode(resolvedPath);
    if (existingNode) {
      if (existingNode.type === "dir") {
        throw createFsError(resolvedPath, FsErrorCodes.PATH_IS_DIRECTORY, "EISDIR");
      }
      const modificationTime = new Date();
      existingNode.entry = { ...existingNode.entry, mtime: modificationTime, ctime: modificationTime };
      existingNode.contents =
        typeof fileContent === "string" ? textEncoder.encode(fileContent) : new Uint8Array(fileContent);
      emitWatchEvent({ path: resolvedPath, stats: existingNode.entry });
    } else {
      const parentPath = posixPath.dirname(resolvedPath);
      const parentNode = getNode(parentPath);

      if (!parentNode || parentNode.type !== "dir") {
        throw createFsError(resolvedPath, FsErrorCodes.CONTAINING_NOT_EXISTS, "ENOENT");
      }

      const fileName = posixPath.basename(resolvedPath);
      const currentDate = new Date();
      const newFileNode: IFsMemFileNode = {
        type: "file",
        entry: {
          name: fileName,
          birthtime: currentDate,
          ctime: currentDate,
          mtime: currentDate,
          isFile: returnsTrue,
          isDirectory: returnsFalse,
          isSymbolicLink: returnsFalse,
        },
        contents: typeof fileContent === "string" ? textEncoder.encode(fileContent) : new Uint8Array(fileContent),
      };
      parentNode.contents.set(fileName, newFileNode);
      emitWatchEvent({ path: resolvedPath, stats: newFileNode.entry });
    }
  }

  function unlinkSync(filePath: string): void {
    const resolvedPath = resolvePath(filePath);
    const parentPath = posixPath.dirname(resolvedPath);
    const parentNode = getNode(parentPath);

    if (!parentNode || parentNode.type !== "dir") {
      throw createFsError(resolvedPath, FsErrorCodes.NO_FILE, "ENOENT");
    }

    const fileName = posixPath.basename(resolvedPath);
    const fileNode = parentNode.contents.get(fileName);

    if (!fileNode) {
      throw createFsError(resolvedPath, FsErrorCodes.NO_FILE, "ENOENT");
    } else if (fileNode.type === "dir") {
      throw createFsError(resolvedPath, FsErrorCodes.PATH_IS_DIRECTORY, "EISDIR");
    }

    parentNode.contents.delete(fileName);
    emitWatchEvent({ path: resolvedPath, stats: null });
  }

  function readdirSync(
    directoryPath: string,
    options?: { encoding?: BufferEncoding | null; withFileTypes?: false } | BufferEncoding | null
  ): string[];
  function readdirSync(
    directoryPath: string,
    options?: { encoding?: BufferEncoding | null; withFileTypes?: true } | BufferEncoding | null
  ): IDirectoryEntry[];
  function readdirSync(
    directoryPath: string,
    options?: { encoding?: BufferEncoding | null; withFileTypes?: boolean } | BufferEncoding | null
  ): string[] | IDirectoryEntry[] {
    const resolvedPath = resolvePath(directoryPath);
    const directoryNode = getNode(resolvedPath);

    if (!directoryNode) {
      throw createFsError(resolvedPath, FsErrorCodes.NO_DIRECTORY, "ENOENT");
    } else if (directoryNode.type === "file") {
      throw createFsError(resolvedPath, FsErrorCodes.PATH_IS_FILE, "ENOTDIR");
    }

    return !!options && typeof options === "object" && options.withFileTypes
      ? Array.from(directoryNode.contents.values(), ({ entry }) => entry)
      : Array.from(directoryNode.contents.keys());
  }

  function mkdirSync(directoryPath: string, options?: { recursive?: boolean }): string | undefined {
    const resolvedPath = resolvePath(directoryPath);
    const parentPath = posixPath.dirname(resolvedPath);
    let parentNode = getNode(parentPath);
    const recursive = options?.recursive;

    if (!parentNode) {
      if (recursive) {
        mkdirSync(parentPath, options);
        parentNode = getNode(parentPath) as IFsMemDirectoryNode;
      } else {
        throw createFsError(resolvedPath, FsErrorCodes.CONTAINING_NOT_EXISTS, "ENOENT");
      }
    } else if (parentNode.type !== "dir") {
      throw createFsError(resolvedPath, FsErrorCodes.PATH_IS_FILE, "ENOTDIR");
    } else if (parentPath === resolvedPath) {
      if (recursive) {
        return;
      } else {
        throw createFsError(resolvedPath, FsErrorCodes.PATH_ALREADY_EXISTS, "EEXIST");
      }
    }

    const directoryName = posixPath.basename(resolvedPath);
    const existingNode = parentNode.contents.get(directoryName);

    if (existingNode) {
      if (recursive && existingNode.type === "dir") {
        return;
      }
      throw createFsError(resolvedPath, FsErrorCodes.PATH_ALREADY_EXISTS, "EEXIST");
    }

    const newDirNode: IFsMemDirectoryNode = createMemDirectory(directoryName);
    parentNode.contents.set(directoryName, newDirNode);
    emitWatchEvent({ path: resolvedPath, stats: newDirNode.entry });
    return;
  }

  function rmdirSync(directoryPath: string): void {
    const resolvedPath = resolvePath(directoryPath);
    const parentPath = posixPath.dirname(resolvedPath);
    const parentNode = getNode(parentPath);

    if (!parentNode || parentNode.type !== "dir") {
      throw createFsError(resolvedPath, FsErrorCodes.NO_DIRECTORY, "ENOENT");
    }

    const directoryName = posixPath.basename(resolvedPath);
    const directoryNode = parentNode.contents.get(directoryName);

    if (!directoryNode || directoryNode.type !== "dir") {
      throw createFsError(resolvedPath, FsErrorCodes.NO_DIRECTORY, "ENOENT");
    } else if (directoryNode.contents.size > 0) {
      throw createFsError(resolvedPath, FsErrorCodes.DIRECTORY_NOT_EMPTY, "ENOTEMPTY");
    }

    parentNode.contents.delete(directoryName);
    emitWatchEvent({ path: resolvedPath, stats: null });
  }

  function rmSync(targetPath: string, { force, recursive }: RmOptions = {}): void {
    const resolvedPath = resolvePath(targetPath);
    const parentPath = posixPath.dirname(resolvedPath);
    const parentNode = getNode(parentPath);

    if (!parentNode || parentNode.type !== "dir") {
      if (force) {
        return;
      } else {
        throw createFsError(resolvedPath, FsErrorCodes.NO_DIRECTORY, "ENOENT");
      }
    }

    const targetName = posixPath.basename(resolvedPath);
    const targetNode = parentNode.contents.get(targetName);

    if (!targetNode) {
      if (force) {
        return;
      } else {
        throw createFsError(resolvedPath, FsErrorCodes.NO_DIRECTORY, "ENOENT");
      }
    }
    if (targetNode.type === "dir" && !recursive) {
      throw createFsError(resolvedPath, FsErrorCodes.PATH_IS_DIRECTORY, "EISDIR");
    }

    parentNode.contents.delete(targetName);
    emitWatchEvent({ path: resolvedPath, stats: null });
  }

  function existsSync(nodePath: string): boolean {
    return !!getNode(resolvePath(nodePath));
  }

  function statSync(nodePath: string, options?: StatSyncOptions & { throwIfNoEntry?: true }): IFileSystemStats;
  function statSync(
    nodePath: string,
    options: StatSyncOptions & { throwIfNoEntry: false }
  ): IFileSystemStats | undefined;
  function statSync(nodePath: string, options?: StatSyncOptions): IFileSystemStats | undefined {
    const resolvedPath = resolvePath(nodePath);
    const node = getNode(resolvedPath);
    if (!node) {
      const throwIfNoEntry = options?.throwIfNoEntry ?? true;
      if (throwIfNoEntry) {
        throw createFsError(resolvedPath, FsErrorCodes.NO_FILE_OR_DIRECTORY, "ENOENT");
      } else {
        return undefined;
      }
    }
    return node.entry;
  }

  function lstatSync(nodePath: string, options?: StatSyncOptions & { throwIfNoEntry?: true }): IFileSystemStats;
  function lstatSync(
    nodePath: string,
    options: StatSyncOptions & { throwIfNoEntry: false }
  ): IFileSystemStats | undefined;
  function lstatSync(nodePath: string, options?: StatSyncOptions): IFileSystemStats | undefined {
    const resolvedPath = resolvePath(nodePath);
    const node = getRawNode(resolvedPath);
    if (!node) {
      const throwIfNoEntry = options?.throwIfNoEntry ?? true;
      if (throwIfNoEntry) {
        throw createFsError(resolvedPath, FsErrorCodes.NO_FILE_OR_DIRECTORY, "ENOENT");
      } else {
        return undefined;
      }
    }
    return node.entry;
  }

  function realpathSync(nodePath: string): string {
    const resolvedPath = resolvePath(nodePath);
    let currentPath = "/";
    let node: IFsMemNodeType | undefined = root;
    for (const depthName of resolvedPath.split(posixPath.sep)) {
      if (!node) {
        break;
      }
      if (depthName === "") {
        continue;
      }
      if (node.type === "dir") {
        node = node.contents.get(depthName);
        currentPath = posixPath.join(currentPath, depthName);
        while (node?.type === "symlink") {
          currentPath = posixPath.resolve(posixPath.dirname(currentPath), node.target);
          node = getRawNode(currentPath);
        }
      } else {
        node = undefined;
      }
    }
    if (!node) {
      throw createFsError(resolvedPath, FsErrorCodes.NO_FILE_OR_DIRECTORY, "ENOENT");
    }
    return currentPath;
  }

  function readlinkSync(nodePath: string): string {
    const resolvedPath = resolvePath(nodePath);
    const node = getRawNode(resolvedPath);
    if (!node) {
      throw createFsError(resolvedPath, FsErrorCodes.NO_FILE_OR_DIRECTORY, "ENOENT");
    } else if (node.type !== "symlink") {
      throw createFsError(resolvedPath, FsErrorCodes.PATH_IS_INVALID, "EINVAL");
    }
    return node.target;
  }

  function renameSync(sourcePath: string, destinationPath: string): void {
    const resolvedSourcePath = resolvePath(sourcePath);
    const resolvedDestinationPath = resolvePath(destinationPath);
    const sourceParentPath = posixPath.dirname(resolvedSourcePath);
    const sourceParentNode = getNode(sourceParentPath);

    if (!sourceParentNode || sourceParentNode.type !== "dir") {
      throw createFsError(resolvedSourcePath, FsErrorCodes.CONTAINING_NOT_EXISTS, "ENOENT");
    }

    const sourceName = posixPath.basename(resolvedSourcePath);
    const sourceNode = sourceParentNode.contents.get(sourceName);

    if (!sourceNode) {
      throw createFsError(resolvedSourcePath, FsErrorCodes.NO_FILE_OR_DIRECTORY, "ENOENT");
    }

    const destinationParentPath = posixPath.dirname(resolvedDestinationPath);
    const destinationParentNode = getNode(destinationParentPath);

    if (!destinationParentNode || destinationParentNode.type !== "dir") {
      throw createFsError(resolvedDestinationPath, FsErrorCodes.CONTAINING_NOT_EXISTS, "ENOENT");
    }

    const destinationName = posixPath.basename(resolvedDestinationPath);
    const destinationNode = destinationParentNode.contents.get(destinationName);

    if (destinationNode) {
      if (destinationNode.type === "dir") {
        if (destinationNode.contents.size > 0) {
          throw createFsError(resolvedDestinationPath, FsErrorCodes.DIRECTORY_NOT_EMPTY, "ENOTEMPTY");
        }
      } else {
        throw createFsError(resolvedDestinationPath, FsErrorCodes.PATH_ALREADY_EXISTS, "EEXIST");
      }
    }

    sourceParentNode.contents.delete(sourceName);
    const modificationTime = new Date();
    sourceNode.entry = { ...sourceNode.entry, name: destinationName, mtime: modificationTime, ctime: modificationTime };
    destinationParentNode.contents.set(destinationName, sourceNode);

    emitWatchEvent({ path: resolvedSourcePath, stats: null });
    emitWatchEvent({ path: resolvedDestinationPath, stats: sourceNode.entry });
  }

  function copyFileSync(sourcePath: string, destinationPath: string, flags = 0): void {
    const resolvedSourcePath = resolvePath(sourcePath);
    const resolvedDestinationPath = resolvePath(destinationPath);
    const sourceFileNode = getNode(resolvedSourcePath);

    if (!sourceFileNode) {
      throw createFsError(resolvedSourcePath, FsErrorCodes.NO_FILE_OR_DIRECTORY, "ENOENT");
    }

    if (sourceFileNode.type !== "file") {
      throw createFsError(resolvedSourcePath, FsErrorCodes.PATH_IS_DIRECTORY, "EISDIR");
    }

    const destParentPath = posixPath.dirname(resolvedDestinationPath);
    const destParentNode = getNode(destParentPath);

    if (!destParentNode || destParentNode.type !== "dir") {
      throw createFsError(resolvedDestinationPath, FsErrorCodes.CONTAINING_NOT_EXISTS, "ENOENT");
    }

    const targetName = posixPath.basename(resolvedDestinationPath);
    const destinationFileNode = destParentNode.contents.get(targetName);

    if (destinationFileNode) {
      const shouldOverride = !(flags & FileSystemConstants.COPYFILE_EXCL);

      if (!shouldOverride) {
        throw createFsError(resolvedDestinationPath, FsErrorCodes.PATH_ALREADY_EXISTS, "EEXIST");
      }

      if (destinationFileNode.type !== "file") {
        throw createFsError(resolvedDestinationPath, FsErrorCodes.PATH_IS_DIRECTORY, "EISDIR");
      }
    }

    const modificationTime = new Date();
    const newFileNode: IFsMemFileNode = {
      ...sourceFileNode,
      entry: { ...sourceFileNode.entry, name: targetName, mtime: modificationTime, ctime: modificationTime },
    };
    destParentNode.contents.set(targetName, newFileNode);

    emitWatchEvent({ path: resolvedDestinationPath, stats: newFileNode.entry });
  }

  function symlinkSync(target: string, linkPath: string, _type: unknown) {
    const resolvedLinkPath = resolvePath(linkPath);
    if (getNode(resolvedLinkPath)) {
      throw createFsError(resolvedLinkPath, FsErrorCodes.PATH_ALREADY_EXISTS, "EEXIST");
    }

    const parentLinkPath = posixPath.dirname(resolvedLinkPath);
    const parentNode = getNode(parentLinkPath);
    if (!parentNode) {
      throw createFsError(resolvedLinkPath, FsErrorCodes.NO_FILE, "ENOENT");
    }
    if (parentNode.type === "file") {
      throw createFsError(resolvedLinkPath, FsErrorCodes.PATH_IS_FILE, "ENOTDIR");
    }

    const currentDate = new Date(Date.now());
    const fileName = posixPath.basename(resolvedLinkPath);
    const symlinkNode: IFsMemSymlinkNode = {
      type: "symlink",
      entry: {
        name: fileName,
        birthtime: currentDate,
        ctime: currentDate,
        mtime: currentDate,
        isFile: returnsFalse,
        isDirectory: returnsFalse,
        isSymbolicLink: returnsTrue,
      },
      target,
    };

    parentNode.contents.set(fileName, symlinkNode);
    emitWatchEvent({ path: resolvedLinkPath, stats: symlinkNode.entry });
  }

  function getNode(nodePath: string): IFsMemFileNode | IFsMemDirectoryNode | undefined {
    let node = getRawNode(nodePath);
    while (node?.type === "symlink") {
      nodePath = posixPath.resolve(posixPath.dirname(nodePath), node.target);
      node = getRawNode(nodePath);
    }
    return node;
  }

  function getRawNode(nodePath: string): IFsMemNodeType | undefined {
    let currentPath = "/";
    let node: IFsMemNodeType | undefined = root;
    for (const depthName of nodePath.split(posixPath.sep)) {
      if (!node) {
        break;
      }
      if (depthName === "") {
        continue;
      }
      while (node?.type === "symlink") {
        currentPath = posixPath.resolve(posixPath.dirname(currentPath), node.target);
        node = getRawNode(currentPath);
      }
      if (node?.type === "dir") {
        node = node.contents.get(depthName);
        currentPath = posixPath.join(currentPath, depthName);
      } else {
        node = undefined;
      }
    }

    return node;
  }

  function emitWatchEvent(watchEvent: IWatchEvent): void {
    for (const listener of eventListeners) {
      listener(watchEvent);
    }
  }
}

function createMemDirectory(name: string): IFsMemDirectoryNode {
  const currentDate = new Date();
  return {
    type: "dir",
    contents: new Map<string, IFsMemNodeType>(),
    entry: {
      name,
      birthtime: currentDate,
      ctime: currentDate,
      mtime: currentDate,
      isFile: returnsFalse,
      isDirectory: returnsTrue,
      isSymbolicLink: returnsFalse,
    },
  };
}

const returnsTrue = () => true;
const returnsFalse = () => false;

function createFsError(
  path: string,
  message: FsErrorCodes,
  code: "ENOENT" | "EEXIST" | "EISDIR" | "ENOTDIR" | "ENOTEMPTY" | "EINVAL"
): Error {
  const error = new Error(`${path} ${message}`);
  (error as Error & { path: string }).path = path;
  (error as Error & { code: string }).code = code;
  throw error;
}

enum FsErrorCodes {
  NO_FILE = "ENOENT: no such file",
  NO_DIRECTORY = "ENOENT: no such directory",
  NO_FILE_OR_DIRECTORY = "ENOENT: no such file or directory",

  PATH_IS_FILE = "ENOTDIR: path points to a file",
  PATH_IS_DIRECTORY = "EISDIR: path points to a directory",
  PATH_IS_INVALID = "EINVAL: invalid argument",

  CONTAINING_NOT_EXISTS = "ENOENT: containing directory does not exist",
  DIRECTORY_NOT_EMPTY = "ENOTEMPTY: directory is not empty",

  PATH_ALREADY_EXISTS = "EEXIST: path already exists",
}
