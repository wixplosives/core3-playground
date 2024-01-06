export interface AsyncFileSystem {
  statFile(fileUrl: URL): Promise<FileSystemStats>;
  readFile(fileUrl: URL): Promise<Uint8Array>;
  readTextFile(fileUrl: URL): Promise<string>;
  readJSONFile(fileUrl: URL): Promise<unknown>;
  fileExists(fileUrl: URL): Promise<boolean>;
  directoryExists(directoryURL: URL): Promise<boolean>;

  openFile(fileUrl: URL): Promise<FileSystemFileItem>;
  openDirectory(directoryURL: URL): Promise<FileSystemDirectoryItem>;
}

export interface FileSystemFileItem {
  type: "file";
  name: string;
  path: URL;
  stat(): Promise<FileSystemStats>;
  buffer(): Promise<Uint8Array>;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export interface FileSystemDirectoryItem {
  type: "directory";
  name: string;
  path: URL;
  [Symbol.asyncIterator](): AsyncIterator<FileSystemDirectoryItem | FileSystemFileItem>;
}

export interface FileSystemStats {
  size: number;
  lastModified: number;
}
