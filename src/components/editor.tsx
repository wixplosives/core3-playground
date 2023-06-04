import React from "react";
import { StatusBar } from "./status-bar";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";

export namespace Editor {
  export interface Props {
    onOpenLocal?: FileExplorer.Props["onOpenLocal"];
    onFileTreeItemClick?: FileExplorer.Props["onItemClick"];
    fileTreeItems?: FileExplorer.Props["items"];
  }
}

export const Editor = React.memo<Editor.Props>(({ onOpenLocal, onFileTreeItemClick, fileTreeItems }) => (
  <Grid
    content={<Tabs />}
    panel={<FileExplorer items={fileTreeItems} onOpenLocal={onOpenLocal} onItemClick={onFileTreeItemClick} />}
    sidebar={<Sidebar />}
    status={<StatusBar />}
  />
));

Editor.displayName = "Editor";
