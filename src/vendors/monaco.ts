import * as monaco from "monaco-editor/esm/vs/editor/edcore.main";
import "monaco-editor/esm/vs/basic-languages/monaco.contribution";
import "monaco-editor/esm/vs/language/css/monaco.contribution";
import "monaco-editor/esm/vs/language/html/monaco.contribution";
import "monaco-editor/esm/vs/language/json/monaco.contribution";
import {
  monacoCssWorkerBundle,
  monacoGenericWorkerBundle,
  monacoHtmlWorkerBundle,
  monacoJsonWorkerBundle,
  schemaStoreCatalogURL,
} from "../constants";

globalThis.monaco = monaco;

globalThis.MonacoEnvironment = {
  getWorker: (_workerId, language) => {
    const workerBundle = languageToWorker[language]?.workerBundle ?? monacoGenericWorkerBundle;
    const workerName = languageToWorker[language]?.workerName ?? "Monaco Generic Worker";
    return new Worker(workerBundle, { name: workerName });
  },
};

const languageToWorker: Record<string, { workerBundle: string; workerName: string }> = {
  json: { workerBundle: monacoJsonWorkerBundle, workerName: "Monaco JSON Worker" },

  html: { workerBundle: monacoHtmlWorkerBundle, workerName: "Monaco HTML Worker" },
  handlebars: { workerBundle: monacoHtmlWorkerBundle, workerName: "Monaco HTML Worker" },
  razor: { workerBundle: monacoHtmlWorkerBundle, workerName: "Monaco HTML Worker" },

  css: { workerBundle: monacoCssWorkerBundle, workerName: "Monaco CSS/Sass/Less Worker" },
  less: { workerBundle: monacoCssWorkerBundle, workerName: "Monaco CSS/Sass/Less Worker" },
  scss: { workerBundle: monacoCssWorkerBundle, workerName: "Monaco CSS/Sass/Less Worker" },
};

void (async () => {
  try {
    const catalogResponse = await fetch(schemaStoreCatalogURL);
    if (catalogResponse.ok) {
      const { schemas } = JSON.parse(await catalogResponse.text()) as SchemaStoreCatalog;
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
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
  let monaco: typeof import("monaco-editor");
  let MonacoEnvironment: monaco.Environment | undefined;
}

interface SchemaStoreCatalog {
  schemas: Array<{ url: string; fileMatch?: string[] }>;
}
