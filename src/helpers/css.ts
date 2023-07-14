import path from "@file-services/path";
import postcssModulesPlugin from "@wixc3/postcss-modules";
import postcss from "postcss";
import { type BrowserFileSystem } from "../fs/browser-file-system";
import { type AsyncSpecifierResolver } from "./specifier-resolver";

export function createStyleInjectModule(filePath: string, cssContents: string): string {
  return `"use strict";

const filePath = ${JSON.stringify(filePath)};
const fileContents = ${JSON.stringify(cssContents)};

const styleEl = document.getElementById('style_' + CSS.escape(filePath)) ?? document.createElement('style');
styleEl.id = 'style_' + filePath;
styleEl.textContent = fileContents;
if (!styleEl.parentElement) {
  document.head.appendChild(styleEl);
}
`;
}

export async function createCssModule(
  filePath: string,
  fileContents: string,
  fs: BrowserFileSystem,
  resolver: AsyncSpecifierResolver,
): Promise<string> {
  const lastCompiledNamespaces: Record<string, Record<string, string> | undefined> = {};

  const modulesPlugin = postcssModulesPlugin({
    fs: {
      writeFile: () => undefined,
      readFile: (path, _encoding, callback) => {
        fs.readTextFile(path).then((fileContents) => callback(null, fileContents), callback);
      },
    },
    resolve: async (specifier, fromFile) => (await resolver(path.dirname(fromFile), specifier)).resolvedFile as string,
    getJSON(filePath, namespaceInfo) {
      lastCompiledNamespaces[filePath] = namespaceInfo;
    },
    generateScopedName,
  });

  const start = performance.now();
  const { css } = await postcss(modulesPlugin).process(fileContents, { from: filePath });
  performance.measure(`Transpile ${filePath} (as CSS Module)`, { start });
  return `${createStyleInjectModule(filePath, css)}
module.exports = ${JSON.stringify(lastCompiledNamespaces[filePath] || {})};
`;
}

const sanitizeForClassName = (filePath: string) => filePath.replace(/[^a-zA-Z0-9_-]/g, "_");
const generateScopedName = (name: string, filePath: string) => `${sanitizeForClassName(filePath)}__${name}`;
