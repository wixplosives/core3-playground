import React from "react";
import type { Tree } from "./tree";
import { directoryNameToIcon, fileNameToIcon } from "../icons/path-to-icon";
import classes from "./file-tree.module.css";

export namespace FileTree {
  export type ItemType = FileItem | DirectoryItem;

  export interface FileItem extends BaseItem {
    type: "file";
  }

  export interface DirectoryItem extends BaseItem {
    type: "directory";
    children: ItemType[];
  }

  export interface BaseItem extends Tree.Item {
    type: string;
    name: string;
    path: string;
    iconUrl?: string;
  }
}

const flipBoolean = (value = false) => !value;

export namespace FileTree {
  export const Item = React.memo(function FileTreeItem({ item, depth }: Tree.ItemProps<ItemType>) {
    const [open, toggleOpen] = React.useReducer(flipBoolean, true);
    if (item.type === "directory") {
      const childDepth = depth + 1;
      return (
        <>
          <div
            className={classes["root"]}
            style={{ [`--depth`]: depth } as React.CSSProperties}
            key={item.path}
            onClick={toggleOpen}
          >
            <img
              src={item.iconUrl || directoryNameToIcon(item.name)}
              className={classes["icon"]}
              style={{ width: "1.2em", height: "1.2em" }}
            />
            {item.name}
          </div>
          {open
            ? item.children.map((childItem) => <Item depth={childDepth} key={childItem.path} item={childItem} />)
            : null}
        </>
      );
    } else if (item.type === "file") {
      return (
        <div className={classes["root"]} key={item.path} style={{ [`--depth`]: depth } as React.CSSProperties}>
          <img
            src={item.iconUrl || fileNameToIcon(item.name)}
            className={classes["icon"]}
            style={{ width: "1.2em", height: "1.2em" }}
          />
          {item.name}
        </div>
      );
    } else {
      return null;
    }
  });
}
