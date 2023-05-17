import React from "react";
import { FileTree } from "./file-tree";
import { Tree } from "./tree";

export interface FileTreeProps {
  roots?: FileTree.ItemType[] | undefined;
  onOpenLocal?(): void;
}

export const FileExplorer: React.FC<FileTreeProps> = ({ roots, onOpenLocal }) => {
  return roots ? (
    <Tree<FileTree.ItemType> roots={roots} ItemComp={FileTree.Item} />
  ) : (
    <button onClick={onOpenLocal}>Open Local</button>
  );
};
