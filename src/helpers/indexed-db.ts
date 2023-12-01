import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { playgroundDbName, playgroundDbVersion } from "../constants";
import type { AnalyzedModule } from "./module-graph-resolver";

export interface PlaygroundDatabaseSchema extends DBSchema {
  "compilation-cache": {
    key: string;
    value: AnalyzedModule;
  };
  "open-projects": {
    key: string;
    value: FileSystemDirectoryHandle;
  };
}

export type PlaygroundDatabase = IDBPDatabase<PlaygroundDatabaseSchema>;

export const openPlaygroundDb = (): Promise<PlaygroundDatabase> =>
  openDB(playgroundDbName, playgroundDbVersion, {
    upgrade(db) {
      for (const objectStoreName of db.objectStoreNames) {
        db.deleteObjectStore(objectStoreName);
      }

      db.createObjectStore("compilation-cache");
      db.createObjectStore("open-projects");
    },
  });
