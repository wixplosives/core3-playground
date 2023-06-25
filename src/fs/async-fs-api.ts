export interface AsyncFileSystem {
  statFile(filePath: string): Promise<FileSystemStats>;
  readFile(filePath: string): Promise<Uint8Array>;
  readTextFile(filePath: string): Promise<string>;
  readJSONFile(filePath: string): Promise<unknown>;
  fileExists(filePath: string): Promise<boolean>;
  directoryExists(filePath: string): Promise<boolean>;

  openFile(filePath: string): Promise<FileSystemFileItem>;
  openDirectory(directoryPath: string): Promise<FileSystemDirectoryItem>;
}

export interface FileSystemFileItem {
  type: "file";
  name: string;
  path: string;
  stat(): Promise<FileSystemStats>;
  buffer(): Promise<Uint8Array>;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export interface FileSystemDirectoryItem {
  type: "directory";
  name: string;
  path: string;
  [Symbol.asyncIterator](): AsyncIterator<FileSystemDirectoryItem | FileSystemFileItem>;
}

export interface FileSystemStats {
  size: number;
  lastModified: number;
}
