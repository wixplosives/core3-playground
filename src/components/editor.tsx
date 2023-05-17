/* eslint-disable no-console */
import path from "@file-services/path";
import React, { useCallback, useState } from "react";
import { StatusBar } from "./status-bar";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";
import type { FileTree } from "./file-tree";
import { sampleDirectoryData } from "../sample-data";

export const Editor: React.FC = () => {
  const [_roots, setRoots] = useState<FileTree.DirectoryItem[]>();

  const onOpenLocal = useCallback(() => {
    // eslint-disable-next-line no-console
    openLocal()
      .then((loadedRoot) => setRoots([loadedRoot]))
      .catch(console.error);
  }, []);

  return (
    <Grid
      header={<Header />}
      left={<Tabs />}
      main={<FileExplorer roots={sampleDirectoryData} onOpenLocal={onOpenLocal} />}
      right={<Sidebar />}
      footer={<StatusBar />}
    />
  );
};

// async function* iterateDirectoryDeep(
//   directoryPath: string,
//   directoryHandle: FileSystemDirectoryHandle,
//   openedDirPaths: Set<string>
// ): AsyncGenerator<string, void, unknown> {
//   for await (const entry of directoryHandle.values()) {
//     const entryPath = path.join(directoryPath, entry.name);
//     yield entryPath;
//     if (entry.kind === "directory" && openedDirPaths.has(entryPath)) {
//       yield* iterateDirectoryDeep(entryPath, entry, openedDirPaths);
//     }
//   }
// }

async function openLocal() {
  const dirHandle = await window.showDirectoryPicker();

  const openedDirPaths = new Set(["/packages"]);
  return dirHandleToDirItem("/", dirHandle, openedDirPaths);
}

async function dirHandleToDirItem(
  directoryPath: string,
  directoryHandle: FileSystemDirectoryHandle,
  openedDirPaths: Set<string>
): Promise<FileTree.DirectoryItem> {
  const children: FileTree.ItemType[] = [];
  for await (const entry of directoryHandle.values()) {
    const entryPath = path.join(directoryPath, entry.name);
    console.log({ entryPath });
    if (entry.kind === "file") {
      children.push({ id: entryPath, name: entry.name, path: entryPath, type: "file" } satisfies FileTree.FileItem);
    } else if (entry.kind === "directory") {
      children.push(
        openedDirPaths.has(entryPath)
          ? await dirHandleToDirItem(entryPath, entry, openedDirPaths)
          : { type: "directory", children: [], id: entryPath, name: entry.name, path: entryPath }
      );
    }
  }

  return {
    type: "directory",
    id: directoryPath,
    path: directoryPath,
    children,
    name: directoryHandle.name,
  };
}
