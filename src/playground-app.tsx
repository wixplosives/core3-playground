import { extname } from "@file-services/path";
import { del, get, update } from "idb-keyval";
import { Editor } from "./components/editor";
import { openProjectsIDBKey } from "./constants";
import { createBrowserFileSystem, type BrowserFileSystem } from "./fs/browser-file-system";
import { imageMimeTypes } from "./helpers/dom";
import { ignoreRejections } from "./helpers/javascript";
import { ProjectsManager } from "./projects-manager";

export class PlaygroundApp {
  projects = new ProjectsManager();
  savedProjectNames?: readonly string[] | undefined;
  private savedDirectoryHandles?: Record<string, FileSystemDirectoryHandle> | undefined;
  constructor(private changeSignal: () => void) {}
  onFileTreeItemClick = async (filePath: string, itemType: string, altKey: boolean) => {
    const project = this.projects.getActiveProject();
    if (!project) {
      return;
    }
    const { id, fs, openDirectories, openFiles } = project;
    if (itemType === "directory") {
      if (openDirectories.has(filePath)) {
        openDirectories.delete(filePath);
      } else {
        openDirectories.add(filePath);
      }
      await this.projects.updateFileTreeItems(id);
    } else if (itemType === "file") {
      const itemIdx = openFiles.findIndex(({ filePath: match }) => filePath === match);
      if (itemIdx !== -1) {
        this.projects.updateSelectedFileIdx(id, itemIdx);
      } else if (await fs.fileExists(filePath)) {
        const openFile = await this.getOpenFileType(filePath, fs, altKey);
        this.projects.openFile(id, openFile);
      }
    }
    this.changeSignal?.();
  };

  selectOpenedFile = (filePath: string) => {
    const project = this.projects.getActiveProject();
    if (!project) {
      return;
    }
    project.selectedFileIdx = project.openFiles.findIndex(({ filePath: match }) => match === filePath);
    this.changeSignal?.();
  };

  closeOpenFile = (tabId: string) => {
    const project = this.projects.getActiveProject();
    if (!project) {
      return;
    }
    const file = this.projects.closeFile(project.id, tabId);
    if (file) {
      this.closeFileCleanup(file);
    }
    this.changeSignal?.();
  };

  openLocalProject = async () => {
    const directoryHandle = await ignoreRejections(window.showDirectoryPicker());
    if (directoryHandle) {
      await this.saveProject(directoryHandle);
      await this.loadSavedProjects();
      await this.projects.openProject(directoryHandle.name, createBrowserFileSystem(directoryHandle));
      this.changeSignal?.();
    }
  };

  openSavedProject = async (projectName: string) => {
    const savedDirectoryHandle = this.savedDirectoryHandles?.[projectName];
    if (!savedDirectoryHandle) {
      return;
    }
    if (!(await this.handleHasPermission(savedDirectoryHandle))) {
      return;
    }
    await this.projects.openProject(savedDirectoryHandle.name, createBrowserFileSystem(savedDirectoryHandle));
    this.changeSignal?.();
  };

  removeSavedProject = async () => {
    await del(openProjectsIDBKey);
    await this.loadSavedProjects();
    this.changeSignal?.();
  };

  async loadSavedProjects() {
    const savedDirectoryHandles = await get<Record<string, FileSystemDirectoryHandle>>(openProjectsIDBKey);
    this.savedDirectoryHandles = savedDirectoryHandles;
    this.savedProjectNames = savedDirectoryHandles && Object.keys(savedDirectoryHandles);
    this.changeSignal?.();
  }

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

  // TODO: move to preview management
  private async getOpenFileType(itemId: string, fs: BrowserFileSystem, showAsPreview: boolean) {
    const fileExtension = extname(itemId);
    const imageMimeType = imageMimeTypes.get(fileExtension);
    const openFile: Editor.OpenFile = imageMimeType
      ? {
          type: "image-viewer",
          filePath: itemId,
          imageUrl: URL.createObjectURL(new Blob([await fs.readFile(itemId)], { type: imageMimeType })),
        }
      : showAsPreview
      ? { type: "preview", filePath: itemId }
      : {
          type: "code-editor",
          filePath: itemId,
          fileContents: await fs.readTextFile(itemId),
        };

    return openFile;
  }

  private closeFileCleanup(openFile: Editor.OpenFile) {
    if (openFile.type === "image-viewer") {
      URL.revokeObjectURL(openFile.imageUrl);
    }
  }
}
