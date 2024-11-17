import * as reactDevtoolsInlineBackend from "react-devtools-inline/backend";

globalThis.reactDevtoolsInlineBackend = reactDevtoolsInlineBackend;
reactDevtoolsInlineBackend.initialize(window);

declare namespace globalThis {
  let reactDevtoolsInlineBackend: typeof import("react-devtools-inline/backend");
}
