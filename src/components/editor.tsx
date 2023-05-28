import React, { useCallback, useRef, useState } from "react";
import { StatusBar } from "./status-bar";
import { FileExplorer } from "./file-explorer";
import { Grid } from "./grid";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";
import type { FileTree } from "./file-tree";
import { collectIntoArray, readDirectoryDeep } from "../w3c-file-system";

export const Editor: React.FC = () => {
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle>();
  const [items, setItems] = useState<FileTree.Item[]>();
  const openDirectories = useRef(new Set<string>());

  const onDirectoryOpened = useCallback((directoryHandle: FileSystemDirectoryHandle) => {
    setRootHandle(directoryHandle);
    openDirectories.current.clear();
    void collectIntoArray(readDirectoryDeep(directoryHandle, "/", openDirectories.current)).then((newItems) => {
      setItems(newItems);
    });
  }, []);

  const onItemClick = useCallback(
    (itemId: string): void => {
      if (openDirectories.current.has(itemId)) {
        openDirectories.current.delete(itemId);
      } else {
        openDirectories.current.add(itemId);
      }
      if (rootHandle) {
        void collectIntoArray(readDirectoryDeep(rootHandle, "/", openDirectories.current)).then((newItems) => {
          setItems(newItems);
        });
      }
    },
    [rootHandle]
  );

  return (
    <Grid
      header={<Header />}
      left={<Tabs />}
      main={<FileExplorer items={items} onDirectoryOpened={onDirectoryOpened} onItemClick={onItemClick} />}
      right={<Sidebar />}
      footer={<StatusBar />}
    />
  );
};
