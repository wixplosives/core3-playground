import { version as tsVersion } from "typescript/package.json";
// import { version as sassVersion } from "sass/package.json";
import { version as immutableVersion } from "immutable/package.json";
import type { LibraryVersions } from "./compilation-worker";

export const openProjectsIDBKey = "playground-projects";
export const compilationWorkerName = "Compilation";
export const compilationBundleName = "compilation-worker.js";
export const defaultLibVersions: LibraryVersions = {
  typescript: tsVersion,
  sass: "1.63.6", // sassVersion
  immutable: immutableVersion,
};
export const previewIframeHTMLIndex = "preview.html";

export const monacoJsBundle = "vendors/monaco.js";
export const monacoCssBundle = "vendors/monaco.css";
export const monacoCssWorkerBundle = "vendors/monaco-css-worker.js";
export const monacoGenericWorkerBundle = "vendors/monaco-generic-worker.js";
export const monacoHtmlWorkerBundle = "vendors/monaco-html-worker.js";
export const monacoJsonWorkerBundle = "vendors/monaco-json-worker.js";

export const schemaStoreCatalogURL = "https://www.schemastore.org/api/json/catalog.json";
export const ignoredFileTreeDirectories: ReadonlySet<string> = new Set([".git"]);

export const wixUnpkgURL = "https://static.parastorage.com/unpkg/";
