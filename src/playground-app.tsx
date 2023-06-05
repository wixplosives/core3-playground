import { createRoot, type Root } from "react-dom/client";
import { type Compilation, type LibraryVersions } from "./compilation/compilation-worker";
import { Editor } from "./components/editor";
import { createRPCWorker, type RPCWorker } from "./rpc/rpc-worker";
import { collectIntoArray, getDeepFileHandle, ignoreRejections, readDirectoryDeep } from "./w3c-file-system";
import type { IndentedList } from "./components/indented-list";

const compilationWorkerName = "Compilation";
const compilationBundleName = "compilation-worker.js";
const defaultLibVersions: LibraryVersions = {
  typescript: "5.1.3",
  sass: "1.62.1",
  immutable: "4.3.0",
};

export class PlaygroundApp {
  private openDirectories = new Set<string>();
  private openFiles: Editor.OpenFile[] = [];
  private selectedFileIdx = -1;

  private appRoot: Root | undefined;
  private rootDirectoryHandle: FileSystemDirectoryHandle | undefined;
  private fileTreeItems: IndentedList.Item[] | undefined;

  public showUI(container: HTMLElement) {
    this.appRoot = createRoot(container);
    this.renderApp();
  }

  private renderApp() {
    this.appRoot?.render(
      <Editor
        openFiles={this.openFiles}
        selectedFileIdx={this.selectedFileIdx}
        onTabClick={this.onTabClick}
        onOpenLocal={this.onOpenLocal}
        onFileTreeItemClick={this.onFileTreeItemClick}
        fileTreeItems={this.fileTreeItems}
      />
    );
  }

  private onFileTreeItemClick = async (itemId: string, itemType: string) => {
    if (itemType === "directory") {
      if (this.openDirectories.has(itemId)) {
        this.openDirectories.delete(itemId);
      } else {
        this.openDirectories.add(itemId);
      }
      if (this.rootDirectoryHandle) {
        await this.calculateFileTreeItems(this.rootDirectoryHandle);
      }
    } else if (itemType === "file") {
      const itemIdx = this.openFiles.findIndex(({ filePath }) => itemId === filePath);
      if (itemIdx === -1) {
        const pathToFile = getPathToFile(itemId);
        if (this.rootDirectoryHandle) {
          const fileHandle = await getDeepFileHandle(this.rootDirectoryHandle, pathToFile);
          if (fileHandle) {
            const file = await fileHandle.getFile();
            const fileContents = await file.text();
            this.openFiles = [...this.openFiles, { filePath: itemId, fileContents }];
            this.selectedFileIdx = this.openFiles.length - 1;
          }
        }
      } else {
        this.selectedFileIdx = itemIdx;
      }
    }
    this.renderApp();
  };

  private onTabClick = (tabId: string) => {
    this.selectedFileIdx = this.openFiles.findIndex(({ filePath }) => tabId === filePath);
    this.renderApp();
  };

  private onOpenLocal = async () => {
    const directoryHandle = await ignoreRejections(window.showDirectoryPicker());
    if (directoryHandle) {
      this.openDirectories.clear();
      this.rootDirectoryHandle = directoryHandle;
      await this.calculateFileTreeItems(directoryHandle);
      this.renderApp();
      await this.initializeProject(directoryHandle);
    }
  };

  private async calculateFileTreeItems(directoryHandle: FileSystemDirectoryHandle) {
    this.fileTreeItems = await collectIntoArray(readDirectoryDeep(directoryHandle, "/", this.openDirectories));
  }

  private async initializeProject(rootDirectoryHandle: FileSystemDirectoryHandle) {
    globalThis.compilation?.close();
    const compilationWorkerURL = new URL(compilationBundleName, import.meta.url);
    const compilationWorker = createRPCWorker<Compilation>(compilationWorkerURL, {
      name: compilationWorkerName,
      type: "module",
    });
    globalThis.compilation = compilationWorker;

    const packageLockHandle = await ignoreRejections(rootDirectoryHandle.getFileHandle("package-lock.json"));
    const libVersions = packageLockHandle ? await this.getLibVersions(packageLockHandle) : defaultLibVersions;
    await compilationWorker.api.initialize(libVersions);
    // const contents = await compilationWorker.api.compile("/a.ts", `export const a = 123;\nthrow new Error('wow');`);
    // console.log(contents);
    // (0, eval)(`(function (exports){${contents}\n})({})`);
  }

  private async getLibVersions(packageLockHandle: FileSystemFileHandle): Promise<LibraryVersions> {
    const packageLockFile = await packageLockHandle.getFile();
    const packageLock = JSON.parse(await packageLockFile.text()) as PackageLock;
    const { packages = {} } = packageLock;
    const typescriptVersion = packages["node_modules/typescript"]?.version ?? defaultLibVersions.typescript;
    const sassVersion = packages["node_modules/sass"]?.version ?? defaultLibVersions.sass;
    const immutableVersion =
      packages["node_modules/sass/node_modules/immutable"]?.version ??
      packages["node_modules/immutable"]?.version ??
      defaultLibVersions.immutable;

    return { typescript: typescriptVersion, sass: sassVersion, immutable: immutableVersion };
  }
}

declare namespace globalThis {
  let compilation: RPCWorker<Compilation> | undefined;
}

interface PackageLock {
  packages?: Record<string, { version?: string }>;
}

function getPathToFile(itemId: string): string[] {
  const pathToFile = itemId.split("/");
  pathToFile.shift();
  return pathToFile;
}
