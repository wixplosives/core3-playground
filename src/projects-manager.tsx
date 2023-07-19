import { type Compilation, type LibraryVersions } from "./compilation-worker";
import { Editor } from "./components/editor";
import type { IndentedList } from "./components/indented-list";
import {
  compilationBundleName,
  compilationWorkerName,
  defaultLibVersions,
  ignoredFileTreeDirectories,
} from "./constants";
import { generateIndentedFsItems } from "./fs/async-fs-operations";
import type { BrowserFileSystem } from "./fs/browser-file-system";
import { clamp, collectIntoArray } from "./helpers/javascript";
import { createRPCWorker, type RPCWorker } from "./rpc/rpc-worker";
import { PreviewManager } from "./preview-manager";

export interface ProjectHost {
  id: string;
  fs: BrowserFileSystem;
  compilation: RPCWorker<Compilation>;
  previews: PreviewManager;
  openDirectories: Set<string>;
  fileTreeItems: readonly IndentedList.Item[] | undefined;
  openFiles: readonly Editor.OpenFile[];
  selectedFileIdx: number;
}

export class ProjectsManager {
  private activeProjects = new Map<string, ProjectHost>();
  private lastOpenedProject?: string;
  getActiveProject() {
    if (!this.lastOpenedProject) {
      return;
    }
    return this.getProject(this.lastOpenedProject);
  }
  getProject(id: string): ProjectHost {
    const projectHost = this.activeProjects.get(id);
    if (!projectHost) {
      throw new Error(`Project ${id} not found`);
    }
    return projectHost;
  }
  async openProject(id: string, fs: BrowserFileSystem) {
    if (this.activeProjects.has(id)) {
      return this.getProject(id);
    }
    // TODO: we are closing all until we handle multiple open projects in gui
    this.closeAllProjects();
    const projectHost = await this.createProjectHost(id, fs);
    this.lastOpenedProject = id;
    this.activeProjects.set(id, projectHost);
    return projectHost;
  }
  closeProject(id: string) {
    const projectServices = this.activeProjects.get(id);
    if (projectServices) {
      projectServices.compilation.close();
      projectServices.previews.closeAll();
      this.activeProjects.delete(id);
    }
  }
  closeAllProjects() {
    for (const project of this.activeProjects.values()) {
      this.closeProject(project.id);
    }
    this.activeProjects.clear();
  }

  openFile(id: string, openFile: Editor.OpenFile) {
    const projectHost = this.getProject(id);
    projectHost.selectedFileIdx = projectHost.openFiles.length;
    projectHost.openFiles = [...projectHost.openFiles, openFile];
  }
  closeFile(id: string, filePathToClose: string) {
    const project = this.getProject(id);
    const { openFiles, selectedFileIdx } = project;
    const targetFileIdx = openFiles.findIndex(({ filePath }) => filePathToClose === filePath);
    if (targetFileIdx === -1) {
      return;
    }
    const openFile = openFiles[targetFileIdx]!;

    // this.closeFile(openFiles[targetFileIdx]!);
    project.openFiles = [...openFiles.slice(0, targetFileIdx), ...openFiles.slice(targetFileIdx + 1)];
    if (targetFileIdx === selectedFileIdx) {
      project.selectedFileIdx = openFiles.length ? clamp(targetFileIdx, 0, openFiles.length - 1) : -1;
    } else if (project.selectedFileIdx > targetFileIdx) {
      project.selectedFileIdx--;
    }
    return openFile;
  }
  updateSelectedFileIdx(id: string, selectedFileIdx: number) {
    const projectHost = this.getProject(id);
    projectHost.selectedFileIdx = selectedFileIdx;
  }
  async updateFileTreeItems(id: string) {
    const projectHost = this.getProject(id);
    projectHost.fileTreeItems = await this.calculateFileTreeItems(projectHost.fs, projectHost.openDirectories);
  }
  private async createProjectHost(id: string, fs: BrowserFileSystem): Promise<ProjectHost> {
    const compilation = await this.createCompilation(fs);
    const previews = new PreviewManager(fs, compilation);
    const openDirectories = new Set<string>();
    const fileTreeItems = await this.calculateFileTreeItems(fs, openDirectories);
    return {
      id,
      fs,
      compilation,
      previews,
      fileTreeItems,
      openDirectories,
      openFiles: [],
      selectedFileIdx: -1,
    };
  }
  private async createCompilation(fs: BrowserFileSystem) {
    const compilationWorkerURL = new URL(compilationBundleName, import.meta.url);
    const compilationWorker = createRPCWorker<Compilation>(compilationWorkerURL, {
      name: compilationWorkerName,
      type: "module",
    });
    const rootPackageLockPath = "/package-lock.json";
    const libVersions = (await fs.fileExists(rootPackageLockPath))
      ? this.getLibVersions((await fs.readJSONFile(rootPackageLockPath)) as PackageLock)
      : defaultLibVersions;
    await compilationWorker.api.initialize(libVersions);
    return compilationWorker;
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
  private async calculateFileTreeItems(fs: BrowserFileSystem, openDirectories: Set<string>) {
    return await collectIntoArray(
      generateIndentedFsItems(await fs.openDirectory("/"), openDirectories, ignoredFileTreeDirectories),
    );
  }
}

interface PackageLock {
  packages?: Record<string, { version?: string }>;
}

const packagePath = <T extends string>(packageName: T) => `node_modules/${packageName}` as const;
