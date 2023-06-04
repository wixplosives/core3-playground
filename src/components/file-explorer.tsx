import React from "react";
import { IndentedList } from "./indented-list";
import classes from "./file-explorer.module.css";

export namespace FileExplorer {
  export interface Props {
    items?: IndentedList.Item[] | undefined;
    onItemClick?: IndentedList.Props["onItemClick"];
    onOpenLocal?: (() => unknown) | undefined;
  }
}

export const FileExplorer: React.FC<FileExplorer.Props> = React.memo(({ items, onOpenLocal, onItemClick }) => {
  return (
    <>
      {items && <IndentedList className={classes["fileTree"]} items={items} onItemClick={onItemClick} />}
      <button disabled={!window.showDirectoryPicker} onClick={onOpenLocal}>
        Open Local
      </button>
    </>
  );
});

FileExplorer.displayName = "FileExplorer";
