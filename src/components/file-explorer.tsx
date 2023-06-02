import type React from "react";
import { FileTree } from "./file-tree";
import classes from "./file-explorer.module.css";

export interface FileTreeProps {
  items?: FileTree.Item[] | undefined;
  onOpenLocal?: (() => unknown) | undefined;
  onItemClick?: ((itemId: string) => unknown) | undefined;
}

export const FileExplorer: React.FC<FileTreeProps> = ({ items, onOpenLocal, onItemClick }) => {
  return (
    <>
      {items && <FileTree className={classes["fileTree"]} items={items} onItemClick={onItemClick} />}
      <button disabled={!window.showDirectoryPicker} onClick={onOpenLocal}>
        Open Local
      </button>
    </>
  );
};
