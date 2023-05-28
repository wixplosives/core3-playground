import React, { useCallback } from "react";
import { FileTree } from "./file-tree";
import classes from "./file-explorer.module.css";

export interface FileTreeProps {
  items?: FileTree.Item[] | undefined;
  onDirectoryOpened?(directoryHandle: FileSystemDirectoryHandle): void;
  onItemClick?(itemId: string): void;
}

export const FileExplorer: React.FC<FileTreeProps> = ({ items, onDirectoryOpened, onItemClick }) => {
  const onOpenLocal = useCallback(() => {
    window
      .showDirectoryPicker()
      .then((directoryHandle) => onDirectoryOpened?.(directoryHandle))
      .catch(() => undefined);
  }, [onDirectoryOpened]);

  return (
    <>
      {items && <FileTree className={classes["fileTree"]} items={items} onItemClick={onItemClick} />}
      {!!window.showDirectoryPicker && <button onClick={onOpenLocal}>Open Local</button>}
    </>
  );
};
