import React, { useRef } from "react";
import styles from "./grid.module.css";

export namespace Grid {
  export interface Props {
    content?: React.ReactNode;
    panel?: React.ReactNode;
    sidebar?: React.ReactNode;
    status?: React.ReactNode;
  }
}

export const Grid: React.FC<Grid.Props> = ({ content, panel, sidebar, status }) => {
  const root = useRef<HTMLDivElement>(null);

  // useLayoutEffect(() => new GridResizeManager(root.current!).setSizes().bindEvents(), []);

  return (
    <div className={styles["grid"]} ref={root}>
      <main className={styles["content"]}>{content}</main>
      <aside className={styles["panel"]}>{panel}</aside>
      <aside className={styles["sidebar"]}>{sidebar}</aside>
      <footer className={styles["status"]}>{status}</footer>
      <div className={styles["divider"]} />
    </div>
  );
};
