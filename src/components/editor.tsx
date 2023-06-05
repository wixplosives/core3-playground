import React, { useMemo } from "react";
import path from "@file-services/path";
import { StatusBar } from "./status-bar";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";

export namespace Editor {
  export interface Props {
    openFiles?: OpenFile[] | undefined;
    selectedFileIdx?: number | undefined;
    onTabClick?: Tabs.Props["onTabClick"];
    onOpenLocal?: FileExplorer.Props["onOpenLocal"];
    onFileTreeItemClick?: FileExplorer.Props["onItemClick"];
    fileTreeItems?: FileExplorer.Props["items"];
  }

  export interface OpenFile {
    filePath: string;
    fileContents: string;
  }
}

export const Editor = React.memo<Editor.Props>(
  ({ onOpenLocal, onFileTreeItemClick, fileTreeItems, openFiles, selectedFileIdx, onTabClick }) => {
    const tabs = useMemo(
      () =>
        openFiles?.map(
          ({ filePath }): Tabs.Tab => ({ id: filePath, title: path.basename(filePath), tooltip: filePath })
        ) ?? [],
      [openFiles]
    );
    const openFile = openFiles && selectedFileIdx !== undefined ? openFiles[selectedFileIdx] : undefined;

    return (
      <Grid
        content={
          <>
            <Tabs tabs={tabs} selectedTabIdx={selectedFileIdx} onTabClick={onTabClick} />
            <pre>{openFile?.fileContents}</pre>
          </>
        }
        panel={<FileExplorer items={fileTreeItems} onOpenLocal={onOpenLocal} onItemClick={onFileTreeItemClick} />}
        sidebar={<Sidebar />}
        status={<StatusBar />}
      />
    );
  }
);

Editor.displayName = "Editor";
