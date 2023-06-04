import type React from "react";
import { IndentedList, type IndentedListItem, type IndentedListProps } from "./indented-list";
import classes from "./file-explorer.module.css";

export interface FileExplorerProps {
  items?: IndentedListItem[] | undefined;
  onOpenLocal?: (() => unknown) | undefined;
  onItemClick?: IndentedListProps["onItemClick"];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ items, onOpenLocal, onItemClick }) => {
  return (
    <>
      {items && <IndentedList className={classes["fileTree"]} items={items} onItemClick={onItemClick} />}
      <button disabled={!window.showDirectoryPicker} onClick={onOpenLocal}>
        Open Local
      </button>
    </>
  );
};
