import React, { Suspense, useMemo } from "react";
import path from "@file-services/path";
import { StatusBar } from "./status-bar";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";
import classes from "./editor.module.css";

const monacoJsBundle = "vendors/monaco.js";
const monacoCssBundle = "vendors/monaco.css";

const CodeEditor = React.lazy(async () => {
  await Promise.all([loadScript(monacoJsBundle), loadStylesheet(monacoCssBundle)]);
  return await import("./code-editor");
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

const loadScript = async (targetUrl: string) => {
  const existingScriptEl = document.querySelector(`script[src="${targetUrl}"]`);
  if (existingScriptEl) {
    return;
  }
  const scriptElement = document.body.appendChild(document.createElement("script"));
  await loadWithTrigger(scriptElement, "src", targetUrl);
};

const loadStylesheet = async (targetUrl: string) => {
  const existingLinkEl = document.querySelector(`link[href="${targetUrl}"]`);
  if (existingLinkEl) {
    return;
  }
  const linkEl = document.head.appendChild(document.createElement("link"));
  linkEl.rel = "stylesheet";
  await loadWithTrigger(linkEl, "href", targetUrl);
};

function loadWithTrigger<T extends HTMLElement, K extends keyof T>(element: T, key: K, value: T[K]) {
  return new Promise<unknown>((res, rej) => {
    element.addEventListener("load", res, { once: true });
    element.addEventListener("error", rej, { once: true });
    element[key] = value;
  });
}
