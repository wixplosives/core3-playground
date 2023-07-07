import type { IFileSystemPath } from "@file-services/types";
import type { IWatchService } from "./watch-api";

/**
 * SYNC and ASYNC base file system.
 * Contains a subset of `fs`, watch service, and path methods.
 */
export interface IFileSystem extends IFileSystemSyncActions, IFileSystemPath {
  watchService: IWatchService;
  caseSensitive: boolean;
  promises: IFileSystemPromiseActions;
}

export interface IFileSystemSyncActions {
  /**
   * Get the current working directory.
   * Non-absolute calls to any file system method are resolved using this path.
   *
   * @returns absolute path to the current working directory.
   */
  cwd(): string;

  /**
   * Change the working directory.
   *
   * @directoryPath path to the new working directory.
   */
  chdir(directoryPath: string): void;

  /**
   * Copy `sourcePath` to `destinationPath`.
   * By default, if destination already exists, it will be overwritten.
   *
   * @param flags passing `FileSystemConstants.COPYFILE_EXCL` will cause operation to fail if destination exists.
   */
  copyFileSync(sourcePath: string, destinationPath: string, flags?: number): void;

  /**
   * Read the entire contents of a file.
   */
  readFileSync(path: string, options?: { encoding?: null; flag?: string } | null): Uint8Array;
  readFileSync(path: string, options: { encoding: BufferEncoding; flag?: string } | BufferEncoding): string;
  readFileSync(path: string, options?: ReadFileOptions): string | Uint8Array;

  /**
   * Write data to a file, replacing the file if already exists.
   * `encoding` is used when a string `content` (not `Uint8Array`) was provided (with default 'utf8').
   */
  writeFileSync(path: string, data: string | Uint8Array, options?: WriteFileOptions): void;

  /**
   * Delete a name and possibly the file it refers to.
   */
  unlinkSync(filePath: string): void;

  /**
   * Read the names of items in a directory.
   */
  readdirSync(
    directoryPath: string,
    options?: { encoding: BufferEncoding | null; withFileTypes?: false } | BufferEncoding | null,
  ): string[];
  readdirSync(directoryPath: string, options: { withFileTypes: true }): IDirectoryEntry[];

  /**
   * Create a new directory.
   */
  mkdirSync(directoryPath: string, options?: { recursive?: boolean }): string | undefined;

  /**
   * Delete an existing directory.
   */
  rmdirSync(directoryPath: string): void;

  /**
   * Check if a path points to an existing file/directory/link.
   *
   * @param path possible file path.
   * @param statFn optional custom stat function (e.g. lstat to detect links).
   */
  existsSync(path: string): boolean;

  /**
   * Get path's `IFileSystemStats`.
   */
  statSync(path: string, options?: StatSyncOptions & { throwIfNoEntry?: true }): IFileSystemStats;
  statSync(path: string, options: StatSyncOptions & { throwIfNoEntry: false }): IFileSystemStats | undefined;
  statSync(path: string, options?: StatSyncOptions): IFileSystemStats | undefined;

  /**
   * Get path's `IFileSystemStats`. Does not dereference symbolic links.
   */
  lstatSync(path: string, options?: StatSyncOptions & { throwIfNoEntry?: true }): IFileSystemStats;
  lstatSync(path: string, options: StatSyncOptions & { throwIfNoEntry: false }): IFileSystemStats | undefined;
  lstatSync(path: string, options?: StatSyncOptions): IFileSystemStats | undefined;

  /**
   * Get the canonicalized absolute pathname.
   * If path is linked, returns the actual target path.
   */
  realpathSync: {
    (path: string): string;
    native(path: string): string;
  };

  /**
   * Rename (move) a file or a directory
   */
  renameSync(sourcePath: string, destinationPath: string): void;

  /**
   * Read value of a symbolic link.
   */
  readlinkSync(path: string): string;

  /**
   * Creates a symbolic link for `target` at `path`. default type is 'file'.
   */
  symlinkSync(target: string, path: string, type?: "dir" | "file" | "junction"): void;

  /**
   * Removes files and directories.
   */
  rmSync(path: string, options?: RmOptions): void;

  /**
   * Changes the permissions of a file.
   */
  chmodSync(path: string, mode: number | string): void;
}

export interface IFileSystemPromiseActions {
  /**
   * Copy `sourcePath` to `destinationPath`.
   * By default, if destination already exists, it will be overwritten.
   *
   * @param flags passing `FileSystemConstants.COPYFILE_EXCL` will cause operation to fail if destination exists.
   */
  copyFile(sourcePath: string, destinationPath: string, flags?: number): Promise<void>;

  /**
   * Read the entire contents of a file.
   */
  readFile(path: string, options?: { encoding?: null; flag?: string } | null): Promise<Uint8Array>;
  readFile(path: string, options: { encoding: BufferEncoding; flag?: string } | BufferEncoding): Promise<string>;
  readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array>;

  /**
   * Write data to a file, replacing the file if already exists.
   * `encoding` is used when a string `content` (not `Uint8Array`) was provided (with default 'utf8').
   */
  writeFile(path: string, data: string | Uint8Array, options?: WriteFileOptions): Promise<void>;

  /**
   * Delete a name and possibly the file it refers to.
   */
  unlink(filePath: string): Promise<void>;

  /**
   * Read the names of items in a directory.
   */
  readdir(
    directoryPath: string,
    options?: { encoding?: BufferEncoding | null; withFileTypes?: false } | BufferEncoding | null,
  ): Promise<string[]>;
  readdir(directoryPath: string, options: { withFileTypes: true }): Promise<IDirectoryEntry[]>;

  /**
   * Create a directory.
   */
  mkdir(directoryPath: string, options?: { recursive?: boolean }): Promise<string | undefined>;

  /**
   * Delete a directory.
   */
  rmdir(directoryPath: string): Promise<void>;

  /**
   * Check if a path points to an existing file/directory/link.
   *
   * @param path possible file path.
   * @param statFn optional custom stat function (e.g. lstat to detect links).
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get path's `IFileSystemStats`.
   */
  stat(path: string): Promise<IFileSystemStats>;

  /**
   * Get path's `IFileSystemStats`. Does not dereference symbolic links.
   */
  lstat(path: string): Promise<IFileSystemStats>;

  /**
   * Gets the canonicalized absolute pathname.
   * If path is linked, returns the actual target path.
   */
  realpath(path: string): Promise<string>;

  /**
   * Rename (move) a file or a directory
   */
  rename(sourcePath: string, destinationPath: string): Promise<void>;

  /**
   * Read value of a symbolic link.
   */
  readlink(path: string): Promise<string>;

  /**
   * Creates a symbolic link for `target` at `path`. default type is 'file'.
   */
  symlink(target: string, path: string, type?: "dir" | "file" | "junction"): Promise<void>;

  /**
   * Removes files and directories.
   */
  rm(path: string, options?: RmOptions): Promise<void>;

  /**
   * Changes the permissions of a file.
   */
  chmod(path: string, mode: number | string): Promise<void>;
}

export type BufferEncoding =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "latin1"
  | "binary"
  | "hex";

export interface StatSyncOptions {
  /**
   * Whether an exception will be thrown if no file system entry exists, rather than returning `undefined`.
   * @default true
   */
  throwIfNoEntry?: boolean;
}

export type WriteFileOptions =
  | {
      encoding?: BufferEncoding | null;
      mode?: number | string;
      flag?: string;
    }
  | BufferEncoding
  | null;

export type ReadFileOptions =
  | {
      encoding?: BufferEncoding | null;
      flag?: string;
    }
  | BufferEncoding
  | null;

export enum FileSystemConstants {
  /**
   * When passed as a flag to `copyFile` or `copyFileSync`,
   * causes operation to fail if destination already exists.
   */
  COPYFILE_EXCL = 1,
}

export interface IDirectoryContents<T extends Uint8Array | string = string> {
  [nodeName: string]: T | IDirectoryContents<T>;
}

/**
 * Subset of the original `fs.Dirent` class.
 */
export interface IDirectoryEntry {
  /**
   * Base name of the entry.
   *
   * @example `package.json`
   */
  name: string;

  /**
   * Whether the entry points to a file.
   */
  isFile(): boolean;

  /**
   * Whether the entry points to a directory.
   */
  isDirectory(): boolean;

  /**
   * Whether the entry is a symbolic link.
   */
  isSymbolicLink(): boolean;
}

/**
 * Subset of the original `fs.Stats` interface
 */
export interface IFileSystemStats {
  /**
   * Creation time
   */
  birthtime: Date;

  ctime: Date;

  /**
   * Modification time
   */
  mtime: Date;

  /**
   * is the path pointing to a file
   */
  isFile(): boolean;

  /**
   * is the path pointing to a directory
   */
  isDirectory(): boolean;

  /**
   * is the path pointing to a symbolic link
   */
  isSymbolicLink(): boolean;
}

/**
 * Descriptor object for an existing file system path.
 */
export interface IFileSystemDescriptor {
  /**
   * Base name of the file system node.
   *
   * @example 'package.json'
   */
  name: string;

  /**
   * Absolute path to the file system node.
   *
   * @example '/path/to/package.json'
   */
  path: string;
}

export interface RmOptions {
  /**
   * When `true`, exceptions will be ignored if `path` does not exist.
   * @default false
   */
  force?: boolean | undefined;

  /**
   * If `true`, perform a recursive directory removal.
   * @default false
   */
  recursive?: boolean | undefined;
}
