import React from "react";
import classes from "./tabs.module.css";

export namespace Tabs {
  export interface Props {
    tabs?: Tab[] | undefined;
    selectedTabIdx?: number | undefined;
    onTabClick?: ((tabId: string) => unknown) | undefined;
  }

  export interface Tab {
    id: string;
    title: string;
    tooltip?: string | undefined;
  }
}

export const Tabs: React.FC<Tabs.Props> = React.memo(({ tabs, selectedTabIdx, onTabClick }) => {
  const onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (event.target instanceof HTMLElement && typeof event.target.dataset["id"] === "string") {
      onTabClick?.(event.target.dataset["id"]);
    }
  };
  return (
    <header className={classes["tabs"]} onClick={onClick}>
      {tabs?.map(({ title, id, tooltip }, idx) => (
        <span
          key={id}
          title={tooltip}
          className={selectedTabIdx === idx ? `${classes["tab"]!} ${classes["selected"]!}` : classes["tab"]}
          data-id={id}
        >
          {title}
        </span>
      ))}
    </header>
  );
});

Tabs.displayName = "Tabs";
