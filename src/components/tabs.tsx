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

  const onCloseClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (typeof event.currentTarget.parentElement?.dataset["id"] === "string") {
      event.stopPropagation();
      onTabClose?.(event.currentTarget.parentElement.dataset["id"]);
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
          <span className={classes["tabTitle"]}>{title}</span>
          <span className={classes["closeButton"]} title="Close Tab" onClick={onCloseClick}>
            {closeIcon}
          </span>
        </li>
      ))}
    </ul>
  );
});

Tabs.displayName = "Tabs";

const closeIcon = (
  <svg
    className={classes["closeIcon"]}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
      fill="currentColor"
    />
  </svg>
);
