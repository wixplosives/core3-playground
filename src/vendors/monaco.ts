import * as monaco from "monaco-editor-core";
import "monaco-languages/release/esm/monaco.contribution.js";

globalThis.monaco = monaco;

declare namespace globalThis {
  let monaco: typeof import("monaco-editor-core");
}
