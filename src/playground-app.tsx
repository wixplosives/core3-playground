import { extname } from "@file-services/path";
import { del, get, update } from "idb-keyval";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { type Compilation, type LibraryVersions } from "./compilation-worker";
import { Editor } from "./components/editor";
import type { IndentedList } from "./components/indented-list";
import {
  compilationBundleName,
  compilationWorkerName,
  defaultLibVersions,
  ignoredFileTreeDirectories,
  openProjectsIDBKey,
} from "./constants";
import { generateIndentedFsItems } from "./fs/async-fs-operations";
import { createBrowserFileSystem, type BrowserFileSystem } from "./fs/browser-file-system";
import { imageMimeTypes } from "./helpers/dom";
import { clamp, collectIntoArray, ignoreRejections } from "./helpers/javascript";
import { createRPCWorker, type RPCWorker } from "./rpc/rpc-worker";

export class PlaygroundApp {
  private fs: BrowserFileSystem | undefined;

  private appRoot: Root | undefined;
  private openDirectories = new Set<string>();
  private savedDirectoryHandles?: Record<string, FileSystemDirectoryHandle> | undefined;
  private compilation?: RPCWorker<Compilation> | undefined;

  // passed to UI
  private openFiles: readonly Editor.OpenFile[] = [];
  private selectedFileIdx = -1;
  private fileTreeItems: readonly IndentedList.Item[] | undefined;
  private savedProjectNames?: readonly string[] | undefined;

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
      <React.StrictMode>
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
          onTabClose={this.onTabClose}
        />
      </React.StrictMode>
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
      if (itemIdx !== -1) {
        this.selectedFileIdx = itemIdx;
      } else if (this.fs && (await this.fs.fileExists(itemId))) {
        const fileExtension = extname(itemId);
        const imageMimeType = imageMimeTypes.get(fileExtension);
        const openFile: Editor.OpenFile = imageMimeType
          ? {
              type: "image-viewer",
              filePath: itemId,
              imageUrl: URL.createObjectURL(new Blob([await this.fs.readFile(itemId)], { type: imageMimeType })),
            }
          : {
              type: "code-editor",
              filePath: itemId,
              fileContents: await this.fs.readTextFile(itemId),
            };
        this.openFiles = [...this.openFiles, openFile];
        this.selectedFileIdx = this.openFiles.length - 1;
      }
    }
    this.renderApp();
  };

  private onTabClick = (tabId: string) => {
    this.selectedFileIdx = this.openFiles.findIndex(({ filePath }) => tabId === filePath);
    this.renderApp();
  };

  private closeFile = (openFile: Editor.OpenFile) => {
    if (openFile.type === "image-viewer") {
      URL.revokeObjectURL(openFile.imageUrl);
    }
  };

  private onTabClose = (tabId: string) => {
    const { openFiles } = this;
    const targetFileIdx = openFiles.findIndex(({ filePath }) => tabId === filePath);
    if (targetFileIdx === -1) {
      return;
    }
    this.closeFile(openFiles[targetFileIdx]!);
    this.openFiles = [...openFiles.slice(0, targetFileIdx), ...openFiles.slice(targetFileIdx + 1)];
    if (targetFileIdx === this.selectedFileIdx) {
      this.selectedFileIdx = this.openFiles.length ? clamp(targetFileIdx, 0, this.openFiles.length - 1) : -1;
    } else if (this.selectedFileIdx > targetFileIdx) {
      this.selectedFileIdx--;
    }
    this.renderApp();
  };

  private async setRootDirectoryHandle(directoryHandle: FileSystemDirectoryHandle) {
    for (const openFile of this.openFiles) {
      this.closeFile(openFile);
    }
    this.openFiles = [];
    this.openDirectories.clear();
    this.fs = createBrowserFileSystem(directoryHandle);
    await this.calculateFileTreeItems();
    this.renderApp();
    await this.initializeProject(this.fs);
  }

  private onOpenLocal = async () => {
    const directoryHandle = await ignoreRejections(window.showDirectoryPicker());
    if (directoryHandle) {
      await this.saveProject(directoryHandle);
      await this.loadSavedProjects();
      await this.setRootDirectoryHandle(directoryHandle);
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
  };

  private async saveProject(directoryHandle: FileSystemDirectoryHandle) {
    await update<Record<string, FileSystemDirectoryHandle>>(openProjectsIDBKey, (savedProjects = {}) => {
      savedProjects[directoryHandle.name] = directoryHandle;
      return savedProjects;
    });
  }

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
    this.fileTreeItems = this.fs
      ? await collectIntoArray(
          generateIndentedFsItems(await this.fs.openDirectory("/"), this.openDirectories, ignoredFileTreeDirectories)
        )
      : undefined;
  }

  private async initializeProject(fs: BrowserFileSystem) {
    this.compilation?.close();
    const compilationWorkerURL = new URL(compilationBundleName, import.meta.url);
    const compilationWorker = createRPCWorker<Compilation>(compilationWorkerURL, {
      name: compilationWorkerName,
      type: "module",
    });
    this.compilation = compilationWorker;

    const rootPackageLockPath = "/package-lock.json";
    const libVersions = (await fs.fileExists(rootPackageLockPath))
      ? this.getLibVersions((await fs.readJSONFile(rootPackageLockPath)) as PackageLock)
      : defaultLibVersions;
    await compilationWorker.api.initialize(libVersions);
    // const contents = await compilationWorker.api.compile("/a.ts", `export const a = 123;\nthrow new Error('wow');`);
    // console.log(contents);
    // (0, eval)(`(function (exports){${contents}\n})({})`);
  }

  private getLibVersions({ packages = {} }: PackageLock): LibraryVersions {
    const typescriptVersion = packages[packagePath("typescript")]?.version ?? defaultLibVersions.typescript;
    const sassVersion = packages[packagePath("sass")]?.version ?? defaultLibVersions.sass;
    const immutableVersion =
      packages[packagePath(`sass/${packagePath("immutable")}`)]?.version ??
      packages[packagePath("immutable")]?.version ??
      defaultLibVersions.immutable;

    return { typescript: typescriptVersion, sass: sassVersion, immutable: immutableVersion };
  }
}

interface PackageLock {
  packages?: Record<string, { version?: string }>;
}

const packagePath = <T extends string>(packageName: T) => `node_modules/${packageName}` as const;
