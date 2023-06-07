import React from "react";
import { classNames } from "../helpers/dom";
import classes from "./tabs.module.css";
import cssUtils from "./utils.module.css";

export namespace Tabs {
  export interface Props {
    tabs?: Tab[] | undefined;
    selectedTabIdx?: number | undefined;
    onTabClick?: ((tabId: string) => unknown) | undefined;
    onTabClose?: ((tabId: string) => unknown) | undefined;
  }

  export interface Tab {
    id: string;
    title: string;
    tooltip?: string | undefined;
  }
}

export const Tabs: React.FC<Tabs.Props> = React.memo(({ tabs, selectedTabIdx, onTabClick, onTabClose }) => {
  const onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (event.target instanceof HTMLElement && typeof event.target.dataset["id"] === "string") {
      onTabClick?.(event.target.dataset["id"]);
    }
  };
  const onAuxClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (event.button === 1 && event.target instanceof HTMLElement && typeof event.target.dataset["id"] === "string") {
      onTabClose?.(event.target.dataset["id"]);
    }
  };
  return (
    <ul className={classNames(classes["tabs"], cssUtils["hideScrollbar"])} onClick={onClick} onAuxClick={onAuxClick}>
      {tabs?.map(({ title, id, tooltip }, idx) => (
        <li
          key={id}
          title={tooltip}
          className={classNames(classes["tab"], selectedTabIdx === idx && classes["selected"])}
          data-id={id}
        >
          {title}
        </li>
      ))}
    </ul>
  );
});

Tabs.displayName = "Tabs";
