declare module "*.module.css" {
  const classNames: Record<string, string>;
  export default classNames;
}

declare module "*.svg" {
  const urlToFile: string;
  export default urlToFile;
}

declare module "monaco-editor/esm/vs/editor/edcore.main" {
  export * from "monaco-editor";
}

declare module "~sass/package.json" {
  export const version: string;
}
