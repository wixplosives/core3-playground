export type CompilationWorkerProtocol = Initialize | Close | Initialized | Error;

export interface Initialize {
  type: "init";

  libVersions: {
    /** typescript version to use for compilation */
    typescript: string;
    /** sass version to load */
    sass: string;
    /** immutable version to load (used by sass) */
    immutable: string;
  };
}

export interface Initialized {
  type: "initialized";
}

export interface Error {
  type: "error";
  error: unknown;
}

export interface Close {
  type: "close";
}
