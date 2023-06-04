import React from "react";
import classes from "./indented-list.module.css";

export namespace IndentedList {
  export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    items: Item[];
    onItemClick?: ((itemId: string, itemType: string) => unknown) | undefined;
  }

  export interface Item {
    id: string;
    label: string;
    depth: number;
    iconUrl: string;
    type: string;
  }
}

export const IndentedList = React.memo<IndentedList.Props>(({ items, onItemClick, ...rootProps }) => {
  const onClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    if (event.target instanceof HTMLElement && event.target.dataset["id"] && event.target.dataset["type"]) {
      onItemClick?.(event.target.dataset["id"], event.target.dataset["type"]);
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
          data-type={item.type}
        >
          {<img src={item.iconUrl} className={classes["icon"]} style={{ width: "1.2em", height: "1.2em" }} />}
          {item.label}
        </div>
      ))}
    </div>
  );
});

IndentedList.displayName = "IndentedList";
