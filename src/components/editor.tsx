import path from "@file-services/path";
import React, { Suspense, useMemo } from "react";
import { monacoCssBundle, monacoJsBundle } from "../constants";
import { loadScript, loadStylesheet } from "../helpers/dom";
import classes from "./editor.module.css";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { ImageViewer } from "./image-viewer";
import { Preview } from "./preview";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { Tabs } from "./tabs";
import type { DevtoolsProps } from "react-devtools-inline";

const CodeEditor = React.lazy(async () => {
  await Promise.all([loadScript(monacoJsBundle), loadStylesheet(monacoCssBundle)]);
  return import("./code-editor");
});

export namespace Editor {
  export interface Props {
    openFiles?: readonly OpenFile[] | undefined;
    selectedFileIdx?: number | undefined;
    onTabClick?: Tabs.Props["onTabClick"];
    onTabClose?: Tabs.Props["onTabClose"];
    onOpenLocal?: FileExplorer.Props["onOpenLocal"];
    onFileTreeItemClick?: FileExplorer.Props["onItemClick"];
    fileTreeItems?: FileExplorer.Props["items"];
    savedProjectNames?: FileExplorer.Props["savedProjectNames"];
    onOpenSaved?: FileExplorer.Props["onOpenSaved"];
    onClearSaved?: FileExplorer.Props["onClearSaved"];
    onPreviewLoad?: Preview.Props["onPreviewLoad"];
    onPreviewClose?: Preview.Props["onPreviewClose"];
    devTools?: Map<string, React.ComponentType<DevtoolsProps>>;
  }

  export type OpenFile = OpenTextFile | OpenImageFile | Preview;

  export interface OpenImageFile {
    type: "image-viewer";
    filePath: string;
    imageUrl: string;
  }

  export interface OpenTextFile {
    type: "code-editor";
    filePath: string;
    fileContents: string;
  }

  export interface Preview {
    type: "preview";
    filePath: string;
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
    onPreviewLoad,
    onPreviewClose,
    devTools,
  }) => {
    const tabs = useMemo(
      () =>
        openFiles?.map(
          ({ filePath }): Tabs.Tab => ({ id: filePath, title: path.basename(filePath), tooltip: filePath }),
        ) ?? [],
      [openFiles],
    );
    const openFile = openFiles && selectedFileIdx !== undefined ? openFiles[selectedFileIdx] : undefined;

    return (
      <Grid
        content={
          <>
            <Tabs tabs={tabs} selectedTabIdx={selectedFileIdx} onTabClick={onTabClick} onTabClose={onTabClose} />
            {openFile?.type === "code-editor" && (
              <Suspense fallback={"Loading..."}>
                <CodeEditor
                  className={classes["codeEditor"]}
                  value={openFile.fileContents}
                  filePath={openFile.filePath}
                  key={openFile.filePath}
                />
              </Suspense>
            )}
            {openFile?.type === "image-viewer" && (
              <ImageViewer
                className={classes["imageViewer"]}
                imageUrl={openFile.imageUrl}
                filePath={openFile.filePath}
                key={openFile.filePath}
              />
            )}
            {openFile?.type === "preview" && (
              <Preview
                className={classes["preview"]}
                filePath={openFile.filePath}
                onPreviewLoad={onPreviewLoad}
                onPreviewClose={onPreviewClose}
                DevTools={devTools?.get(openFile.filePath)}
                key={openFile.filePath}
              />
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
  },
);

Editor.displayName = "Editor";
