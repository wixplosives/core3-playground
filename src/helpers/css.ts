import path from "@file-services/path";
import postcssModulesPlugin from "@wixc3/postcss-modules";
import mime from "mime";
import postcss from "postcss";
import { type BrowserFileSystem } from "../fs/browser-file-system";
import { remapCSSURLs } from "./remap-css-urls";
import {
  createAsyncSpecifierResolver,
  type AsyncSpecifierResolver,
  type IAsyncSpecifierResolverOptions,
} from "./specifier-resolver";
import { createBase64DataURI } from "./url";

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
  getFileContents: (filePath: string) => Promise<string>,
  resolver: AsyncSpecifierResolver,
): Promise<string> {
  const lastCompiledNamespaces: Record<string, Record<string, string> | undefined> = {};

  const modulesPlugin = postcssModulesPlugin({
    fs: {
      writeFile: () => undefined,
      readFile: (path, _encoding, callback) => {
        getFileContents(path).then((fileContents) => callback(null, fileContents), callback);
      },
    },
    resolve: async (specifier, fromFile) => {
      const { resolvedFile } = await resolver(path.dirname(fromFile), specifier);
      return resolvedFile ? resolvedFile : null;
    },
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

export const inlineCSSUrls = async (
  contextPath: string,
  root: postcss.Root | postcss.Document,
  resolver: AsyncSpecifierResolver,
  fs: BrowserFileSystem,
) => {
  const remapRequest = async (specifier: string) => {
    if (!isPossibleModuleRequest(specifier)) {
      return specifier;
    }
    const { resolvedFile } = await resolver(contextPath, parseURLSpecifier(specifier).specifier);
    if (resolvedFile) {
      return createBase64DataURI(
        await fs.readFile(resolvedFile),
        mime.getType(resolvedFile) ?? "application/octet-stream",
      );
    }
    return specifier;
  };
  await remapCSSURLs(root, remapRequest);
};

function parseURLSpecifier(specifier: string) {
  const queryParamsIdx = specifier.indexOf("?");
  if (queryParamsIdx !== -1) {
    return { specifier: specifier.slice(0, queryParamsIdx), postfix: specifier.slice(queryParamsIdx) };
  }
  const hashIdx = specifier.indexOf("#");
  if (hashIdx !== -1) {
    return { specifier: specifier.slice(0, hashIdx), postfix: specifier.slice(hashIdx) };
  }
  return { specifier, postfix: "" };
}

export function isPossibleModuleRequest(request: string) {
  return !!request && !request.startsWith("data:") && !request.startsWith("http://") && !request.startsWith("https://");
}

export const createCssSpecifierResolver = (options: IAsyncSpecifierResolverOptions): AsyncSpecifierResolver => {
  const resolver = createAsyncSpecifierResolver(options);

  return async (contextPath, request) => {
    const allVisitedPaths = new Set<string>();

    for (const possibleRequest of getPossibleRequests(request)) {
      const { resolvedFile, visitedPaths } = await resolver(contextPath, possibleRequest);
      for (const visited of visitedPaths) {
        allVisitedPaths.add(visited);
      }
      if (resolvedFile) {
        return {
          resolvedFile: resolvedFile,
          visitedPaths: allVisitedPaths,
        };
      }
    }

    return {
      resolvedRequest: undefined,
      visitedPaths: allVisitedPaths,
    };
  };
};

function* getPossibleRequests(request: string): Generator<string> {
  if (!isPossibleModuleRequest(request)) {
    return;
  }

  // special style used by css-loader to reference packages in node_modules
  if (request.startsWith("~")) {
    yield* getPossibleRequests(request.slice(1));
    return;
  }

  const isRelativeRequest =
    request.startsWith("./") || request.startsWith("../") || request === "." || request === "..";

  if (!isRelativeRequest) {
    yield* getPossibleRequests(`./${request}`);
  }

  yield request;
}
