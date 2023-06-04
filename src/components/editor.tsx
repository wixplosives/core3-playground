import React from "react";
import { StatusBar } from "./status-bar";
import { FileExplorer, type FileExplorerProps } from "./file-explorer";
import { Grid } from "./grid";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";

export interface EditorProps {
  onOpenLocal?: FileExplorerProps["onOpenLocal"];
  onFileTreeItemClick?: FileExplorerProps["onItemClick"];
  fileTreeItems?: FileExplorerProps["items"];
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
