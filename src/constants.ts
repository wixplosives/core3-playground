import type { LibraryVersions } from "./compilation-worker";

export const openProjectsIDBKey = "playground-projects";
export const compilationWorkerName = "Compilation";
export const compilationBundleName = "compilation-worker.js";
export const defaultLibVersions: LibraryVersions = {
  typescript: "5.1.3",
  sass: "1.62.1",
  immutable: "4.3.0",
};

export const monacoJsBundle = "vendors/monaco.js";
export const monacoCssBundle = "vendors/monaco.css";
export const monacoCssWorkerBundle = "vendors/monaco-css-worker.js";
export const monacoGenericWorkerBundle = "vendors/monaco-generic-worker.js";
export const monacoHtmlWorkerBundle = "vendors/monaco-html-worker.js";
export const monacoJsonWorkerBundle = "vendors/monaco-json-worker.js";

export const schemaStoreCatalogURL = "https://www.schemastore.org/api/json/catalog.json";
export const wixUnpkgURL = "https://static.parastorage.com/unpkg/";
