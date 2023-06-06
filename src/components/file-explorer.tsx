import React from "react";
import { IndentedList } from "./indented-list";
import classes from "./file-explorer.module.css";

export namespace FileExplorer {
  export interface Props {
    items?: IndentedList.Item[] | undefined;
    onItemClick?: IndentedList.Props["onItemClick"];
    onOpenLocal?: (() => unknown) | undefined;
    savedProjectNames?: string[] | undefined;
    onOpenSaved?: ((projectName: string) => unknown) | undefined;
    onClearSaved?: (() => unknown) | undefined;
  }
}

export const FileExplorer: React.FC<FileExplorer.Props> = React.memo(
  ({ items, onOpenLocal, onItemClick, savedProjectNames, onOpenSaved, onClearSaved }) => {
    const onOpenSavedClicked: React.MouseEventHandler<HTMLButtonElement> = ({ currentTarget }) => {
      if (typeof currentTarget.dataset["project"] === "string") {
        onOpenSaved?.(currentTarget.dataset["project"]);
      }
    };

    return (
      <>
        {items && <IndentedList className={classes["fileTree"]} items={items} onItemClick={onItemClick} />}
        <button className={classes["openLocal"]} disabled={!window.showDirectoryPicker} onClick={onOpenLocal}>
          Open Local
        </button>
        {!!savedProjectNames?.length && <button onClick={onClearSaved}>Clear Saved</button>}
        {savedProjectNames &&
          savedProjectNames.map((savedProjectName) => (
            <button
              key={`project-${savedProjectName}`}
              className={classes["openSaved"]}
              onClick={onOpenSavedClicked}
              data-project={savedProjectName}
            >
              Open {savedProjectName}
            </button>
          ))}
      </>
    );
  }
);

FileExplorer.displayName = "FileExplorer";
