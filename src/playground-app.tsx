import { del, get, update } from "idb-keyval";
import { createRoot, type Root } from "react-dom/client";
import { type Compilation, type LibraryVersions } from "./compilation/compilation-worker";
import { Editor } from "./components/editor";
import { createRPCWorker, type RPCWorker } from "./rpc/rpc-worker";
import { collectIntoArray, getDeepFileHandle, ignoreRejections, readDirectoryDeep } from "./w3c-file-system";
import type { IndentedList } from "./components/indented-list";

const openProjectsIDBKey = "playground-projects";
const compilationWorkerName = "Compilation";
const compilationBundleName = "compilation-worker.js";
const defaultLibVersions: LibraryVersions = {
  typescript: "5.1.3",
  sass: "1.62.1",
  immutable: "4.3.0",
};

export class PlaygroundApp {
  private appRoot: Root | undefined;
  private rootDirectoryHandle?: FileSystemDirectoryHandle | undefined;
  private openDirectories = new Set<string>();
  private savedDirectoryHandles?: Record<string, FileSystemDirectoryHandle> | undefined;

  // passed to UI
  private openFiles: Editor.OpenFile[] = [];
  private selectedFileIdx = -1;
  private fileTreeItems: IndentedList.Item[] | undefined;
  private savedProjectNames?: string[] | undefined;

  public showUI(container: HTMLElement) {
    this.appRoot = createRoot(container);
    this.renderApp();
  }

  public async loadSavedProjects() {
    const savedDirectoryHandles = await get<Record<string, FileSystemDirectoryHandle>>(openProjectsIDBKey);
    this.savedDirectoryHandles = savedDirectoryHandles;
    this.savedProjectNames = savedDirectoryHandles && Object.keys(savedDirectoryHandles);
  }

  private renderApp() {
    this.appRoot?.render(
      <Editor
        openFiles={this.openFiles}
        selectedFileIdx={this.selectedFileIdx}
        fileTreeItems={this.fileTreeItems}
        savedProjectNames={this.savedProjectNames}
        onTabClick={this.onTabClick}
        onOpenLocal={this.onOpenLocal}
        onFileTreeItemClick={this.onFileTreeItemClick}
        onOpenSaved={this.onOpenSaved}
        onClearSaved={this.onClearSaved}
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
      await this.calculateFileTreeItems();
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

  private async setRootDirectoryHandle(directoryHandle: FileSystemDirectoryHandle) {
    if (this.rootDirectoryHandle !== directoryHandle) {
      this.rootDirectoryHandle = directoryHandle;
      this.openFiles = [];
      await this.calculateFileTreeItems();
    }
  }

  private onOpenLocal = async () => {
    const directoryHandle = await ignoreRejections(window.showDirectoryPicker());
    if (directoryHandle) {
      await this.setRootDirectoryHandle(directoryHandle);
      await update<Record<string, FileSystemDirectoryHandle>>(openProjectsIDBKey, (savedProjects = {}) => {
        savedProjects[directoryHandle.name] = directoryHandle;
        return savedProjects;
      });
      await this.loadSavedProjects();
      this.renderApp();
      await this.initializeProject(directoryHandle);
    }
  };

  private onOpenSaved = async (projectName: string) => {
    const savedDirectoryHandle = this.savedDirectoryHandles?.[projectName];
    if (!savedDirectoryHandle) {
      return;
    }
    if (!(await this.handleHasPermission(savedDirectoryHandle))) {
      return;
    }
    await this.setRootDirectoryHandle(savedDirectoryHandle);
    this.renderApp();
  };

  private async handleHasPermission(fileSystemHandle: FileSystemHandle) {
    if ((await fileSystemHandle.queryPermission()) === "granted") {
      return true;
    }
    return (await fileSystemHandle.requestPermission()) === "granted";
  }

  private onClearSaved = async () => {
    await del(openProjectsIDBKey);
    await this.loadSavedProjects();
    this.renderApp();
  };

  private async calculateFileTreeItems() {
    this.fileTreeItems = this.rootDirectoryHandle
      ? await collectIntoArray(readDirectoryDeep(this.rootDirectoryHandle, "/", this.openDirectories))
      : undefined;
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
