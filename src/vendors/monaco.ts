import * as monaco from "monaco-editor-core";
import "monaco-languages/release/esm/monaco.contribution.js";
import * as json from "monaco-json/release/esm/monaco.contribution";

globalThis.monaco = monaco;

void (async () => {
  try {
    const catalogResponse = await fetch("https://www.schemastore.org/api/json/catalog.json");
    if (catalogResponse.ok) {
      const { schemas } = JSON.parse(await catalogResponse.text()) as {
        schemas: Array<{ url: string; fileMatch?: string[] }>;
      };

      json.jsonDefaults.setDiagnosticsOptions({
        enableSchemaRequest: true,
        schemas: schemas.map(({ url, fileMatch }) => ({ uri: url, fileMatch: fileMatch! })),
      });
    }
  } catch {
    // quietly fail for now. only affects auto-completions.
    // may want to retry in the future.
  }
})();

declare namespace globalThis {
  let monaco: typeof import("monaco-editor-core");
}
