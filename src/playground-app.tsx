import { createRoot, type Root } from "react-dom/client";
import { type Compilation, type LibraryVersions } from "./compilation/compilation-worker";
import { Editor } from "./components/editor";
import { createRPCWorker, type RPCWorker } from "./rpc/rpc-worker";
import { collectIntoArray, ignoreRejections, readDirectoryDeep } from "./w3c-file-system";
import type { FileTree } from "./components/file-tree";

const compilationWorkerName = "Compilation";
const compilationBundleName = "compilation-worker.js";
const defaultLibVersions: LibraryVersions = {
  typescript: "5.0.4",
  sass: "1.62.1",
  immutable: "4.3.0",
};

export class PlaygroundApp {
  private openDirectories = new Set<string>();
  private appRoot: Root | undefined;
  private rootDirectoryHandle: FileSystemDirectoryHandle | undefined;
  private fileTreeItems: FileTree.Item[] | undefined;

  public showUI(container: HTMLElement) {
    this.appRoot = createRoot(container);
    this.renderApp();
  }

  private onFileTreeItemClick = async (itemId: string) => {
    if (this.openDirectories.has(itemId)) {
      this.openDirectories.delete(itemId);
    } else {
      this.openDirectories.add(itemId);
    }
    if (this.rootDirectoryHandle) {
      await this.calculateFileTreeItems(this.rootDirectoryHandle);
      this.renderApp();
    }
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

  private renderApp() {
    this.appRoot?.render(
      <Editor
        onOpenLocal={this.onOpenLocal}
        onFileTreeItemClick={this.onFileTreeItemClick}
        fileTreeItems={this.fileTreeItems}
      />
    );
  }

  private async calculateFileTreeItems(directoryHandle: FileSystemDirectoryHandle) {
    this.fileTreeItems = await collectIntoArray(readDirectoryDeep(directoryHandle, "/", this.openDirectories));
  }

  private async initializeProject(rootDirectoryHandle: FileSystemDirectoryHandle) {
    globalThis.compilation?.close();
    const compilationWorkerURL = new URL(compilationBundleName, import.meta.url);
    const compilationWorker = createRPCWorker<Compilation>(compilationWorkerURL, compilationWorkerName);
    globalThis.compilation = compilationWorker;

    const packageLockHandle = await ignoreRejections(rootDirectoryHandle.getFileHandle("package-lock.json"));
    const libVersions = packageLockHandle ? await this.getLibVersions(packageLockHandle) : defaultLibVersions;
    await compilationWorker.api.initialize(libVersions);
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
