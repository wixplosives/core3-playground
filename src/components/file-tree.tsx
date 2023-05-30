import React from "react";
import classes from "./file-tree.module.css";

export namespace FileTree {
  export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    items: Item[];
    onItemClick?(itemId: string): void;
  }

  export interface Item {
    id: string;
    label: string;
    depth: number;
    iconUrl: string;
  }
}

export const FileTree = React.memo<FileTree.Props>(function FileTree({ items, onItemClick, ...rootProps }) {
  const onClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    if (event.target instanceof HTMLElement && event.target.dataset["id"]) {
      onItemClick?.(event.target.dataset["id"]);
    }
  };

  return (
    <div {...rootProps} onClick={onClick}>
      {items.map((item) => (
        <div
          className={classes["item"]}
          style={{ [`--depth`]: item.depth } as React.CSSProperties}
          key={item.id}
          data-id={item.id}
        >
          {<img src={item.iconUrl} className={classes["icon"]} style={{ width: "1.2em", height: "1.2em" }} />}
          {item.label}
        </div>
      ))}
    </div>
  );
});
