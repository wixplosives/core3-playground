import React from "react";
import { StatusBar } from "./status-bar";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";
import type { FileTree } from "./file-tree";

export interface EditorProps {
  onOpenLocal?(): unknown;
  onFileTreeItemClick?(itemId: string): unknown;
  fileTreeItems?: FileTree.Item[] | undefined;
}

export const Editor = React.memo<EditorProps>(({ onOpenLocal, onFileTreeItemClick, fileTreeItems }) => (
  <Grid
    header={<Header />}
    left={<Tabs />}
    panel={<FileExplorer items={fileTreeItems} onOpenLocal={onOpenLocal} onItemClick={onFileTreeItemClick} />}
    right={<Sidebar />}
    footer={<StatusBar />}
  />
));

Editor.displayName = "Editor";
