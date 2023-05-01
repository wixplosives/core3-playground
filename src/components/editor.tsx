import type React from "react";
import { CodeEditor } from "./code-editor";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Header } from "./header";
import { PropsPanel } from "./props-panel";
import { Tabs } from "./tabs";

export const Editor: React.FC = () => (
  <Grid
    header={<Header />}
    left={<FileExplorer />}
    main={<Tabs tabs={[{ title: "AutoComplete" }, { title: "Dropdown" }]} />}
    right={<PropsPanel props={[]} />}
    footer={<CodeEditor />}
  />
);
