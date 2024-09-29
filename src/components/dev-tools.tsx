import React from "react";
import type { Wall } from "react-devtools-inline";
import { createBridge, createStore, initialize } from "react-devtools-inline/frontend";

// for react-devtools-inline/frontend
(React as unknown as { unstable_useCacheRefresh(): void }).unstable_useCacheRefresh ??= () => undefined;
(React as unknown as { unstable_getCacheForType<T>(r: () => T): T }).unstable_getCacheForType ??= (resourceType) => {
  return resourceType();
};

const NoopWall: Wall = {
  listen() {
    return () => {};
  },
  send() {},
};
const noopBridge = createBridge(undefined!, NoopWall);
noopBridge.shutdown = () => {};
const noopStore = createStore(noopBridge);

export const DevTools = initialize(undefined!, { bridge: noopBridge, store: noopStore });
