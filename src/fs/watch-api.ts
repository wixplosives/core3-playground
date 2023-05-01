import type { IFileSystemStats } from "./fs-api";

/**
 * File watching service.
 * Emits naive watch events containing path and latest stats.
 */
export interface IWatchService {
  /**
   * Add a global watch event listener.
   * It will receive watch events for all watched paths.
   */
  addGlobalListener(listener: WatchEventListener): void;

  /**
   * Remove a global watch event listener.
   */
  removeGlobalListener(listener: WatchEventListener): void;

  /**
   * Clears all registered global watch event listeners.
   */
  clearGlobalListeners(): void;
}

/**
 * Watch event. Emitted when a file system change
 * happens on a path.
 */
export interface IWatchEvent {
  path: string;
  stats: IFileSystemStats | null;
}

/**
 * Watch events listener function
 */
export type WatchEventListener = (watchEvent: IWatchEvent) => void;
