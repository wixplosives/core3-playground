import path from "@file-services/path";
import React, { Suspense, useMemo } from "react";
import { loadScript, loadStylesheet } from "../helpers/dom";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { Tabs } from "./tabs";
import classes from "./editor.module.css";
import { monacoJsBundle, monacoCssBundle } from "../constants";

const CodeEditor = React.lazy(async () => {
  await Promise.all([loadScript(monacoJsBundle), loadStylesheet(monacoCssBundle)]);
  return import("./code-editor");
});

export namespace Editor {
  export interface Props {
    openFiles?: OpenFile[] | undefined;
    selectedFileIdx?: number | undefined;
    onTabClick?: Tabs.Props["onTabClick"];
    onTabClose?: Tabs.Props["onTabClose"];
    onOpenLocal?: FileExplorer.Props["onOpenLocal"];
    onFileTreeItemClick?: FileExplorer.Props["onItemClick"];
    fileTreeItems?: FileExplorer.Props["items"];
    savedProjectNames?: FileExplorer.Props["savedProjectNames"];
    onOpenSaved?: FileExplorer.Props["onOpenSaved"];
    onClearSaved?: FileExplorer.Props["onClearSaved"];
  }

  export interface OpenFile {
    filePath: string;
    fileContents: string;
  }
}

export const Editor = React.memo<Editor.Props>(
  ({
    onOpenLocal,
    onFileTreeItemClick,
    fileTreeItems,
    openFiles,
    selectedFileIdx,
    onTabClick,
    savedProjectNames,
    onOpenSaved,
    onClearSaved,
    onTabClose,
  }) => {
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
            <Tabs tabs={tabs} selectedTabIdx={selectedFileIdx} onTabClick={onTabClick} onTabClose={onTabClose} />
            {openFile && (
              <Suspense fallback={"Loading..."}>
                <CodeEditor
                  className={classes["codeEditor"]}
                  value={openFile.fileContents}
                  filePath={openFile.filePath}
                />
              </Suspense>
            )}
          </>
        }
        panel={
          <FileExplorer
            items={fileTreeItems}
            onOpenLocal={onOpenLocal}
            onItemClick={onFileTreeItemClick}
            savedProjectNames={savedProjectNames}
            onOpenSaved={onOpenSaved}
            onClearSaved={onClearSaved}
          />
        }
        sidebar={<Sidebar />}
        status={<StatusBar />}
      />
    );
  }
);

Editor.displayName = "Editor";
