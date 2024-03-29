import React from "react";
import classes from "./sidebar.module.css";

export const Sidebar: React.FC = React.memo(() => {
  return (
    <>
      <svg className={classes["logo"]} height="32" viewBox="0 0 117 125" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M93.776 35.746a35.08 35.08 0 0 1-6.944 21.004c16.671 2.238 29.525 16.476 29.525 33.708 0 18.785-15.277 34.014-34.122 34.014h-47.77c-18.846 0-34.123-15.229-34.123-34.014 0-17.234 12.857-31.474 29.532-33.71a35.08 35.08 0 0 1-6.944-21.002C22.93 16.244 38.79.435 58.353.435c19.564 0 35.423 15.81 35.423 35.311ZM75.852 53.887 62.458 46.19a8.324 8.324 0 0 0-8.308.01l-13.307 7.685c-1.66.958-1.655 3.348.008 4.3L54.22 65.84a8.324 8.324 0 0 0 8.268 0l13.36-7.648c1.665-.954 1.667-3.348.003-4.304Z"
          fill="currentColor"
        />
      </svg>
    </>
  );
});

Sidebar.displayName = "Sidebar";
