import path from "@file-services/path";
import mime from "mime";
import { createBrowserFileSystem } from "./fs/browser-file-system";
import { createCssModule, createStyleInjectModule } from "./helpers/css";
import { fetchText } from "./helpers/dom";
import { createModuleGraphResolver, type ModuleGraph } from "./helpers/module-graph-resolver";
import { createSassModule, createSassSpecifierResolver, evaluateSassLib } from "./helpers/sass";
import { inlineExternalCssSourceMap, inlineExternalJsSourceMap } from "./helpers/source-maps";
import {
  createAsyncSpecifierResolver,
  createCachedResolver,
  type IAsyncResolutionFileSystem,
  type IAsyncSpecifierResolverOptions,
} from "./helpers/specifier-resolver";
import { compileUsingTypescript, evaluateTypescriptLib, extractModuleRequests } from "./helpers/typescript";
import { createBase64DataURI, unpkgUrlFor } from "./helpers/url";
import { rpcResponder } from "./rpc/rpc-responder";
import type { RpcCall } from "./rpc/rpc-types";

const resolverOptions: Partial<IAsyncSpecifierResolverOptions> = {
  extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"],
  alias: {
    "@babel/runtime/helpers/esm/*": "@babel/runtime/helpers/*",
  },
  fallback: {
    // to support @wixc3/react-board's react-dom/client import in reac@17 projects
    "react-dom/client": false,
  },
};

export interface Compilation {
  /** Initialize compilation environment's typescript and sass */
  initialize: typeof initialize;
  calculateModuleGraph: typeof calculateModuleGraph;
  resolveSpecifier: typeof resolveSpecifier;
}

const { onCall } = rpcResponder<Compilation>({
  api: { resolveSpecifier, calculateModuleGraph, initialize },
  dispatchResponse: (response) => globalThis.postMessage(response),
});

globalThis.addEventListener("message", (event) => onCall(event.data as RpcCall<Compilation>));

export interface LibraryVersions {
  /** typescript version to use for compilation */
  typescript: string;
  /** sass version to load */
  sass: string;
  /** immutable version to load (used by sass) */
  immutable: string;
}

let ts: typeof import("typescript") | undefined = undefined;
let sass: typeof import("sass") | undefined = undefined;

async function initialize(versions: LibraryVersions): Promise<void> {
  const typescriptURL = unpkgUrlFor("typescript", versions.typescript, "lib/typescript.js");
  const sassURL = unpkgUrlFor("sass", versions.sass, "sass.dart.js");
  const immutableURL = unpkgUrlFor("immutable", versions.immutable, "dist/immutable.js");
  const [sassLibText, immutableLibText, typescriptLibText] = await Promise.all([
    fetchText(sassURL),
    fetchText(immutableURL),
    fetchText(typescriptURL),
  ]);

  ts = evaluateTypescriptLib(typescriptURL.href, typescriptLibText);
  sass = evaluateSassLib(sassURL.href, sassLibText, immutableLibText, immutableURL.href);
}

async function resolveSpecifier(
  rootHandle: FileSystemDirectoryHandle,
  contextPath: string,
  specifier: string,
): Promise<string | undefined | false> {
  const fs = createBrowserFileSystem(rootHandle);
  const resolutionFs: IAsyncResolutionFileSystem = {
    ...fs,
    realpath(path) {
      return Promise.resolve(path);
    },
    readFile(path) {
      return fs.readTextFile(path);
    },
    ...path,
  };

  const specifierResolver = createCachedResolver(
    createAsyncSpecifierResolver({ fs: resolutionFs, ...resolverOptions }),
  );
  const { resolvedFile } = await specifierResolver(contextPath, specifier);
  return resolvedFile;
}

async function calculateModuleGraph(
  rootHandle: FileSystemDirectoryHandle,
  entryFilePath: string | string[],
): Promise<ModuleGraph> {
  if (ts === undefined) {
    throw new Error(`typescript was not yet initialized`);
  }
  const compilerOptions: import("typescript").CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    sourceMap: true,
    inlineSources: true,
  };
  const fs = createBrowserFileSystem(rootHandle);
  const resolutionFs: IAsyncResolutionFileSystem = {
    ...fs,
    realpath(path) {
      return Promise.resolve(path);
    },
    readFile(path) {
      return fs.readTextFile(path);
    },
    ...path,
  };

  const specifierResolver = createCachedResolver(
    createAsyncSpecifierResolver({ fs: resolutionFs, ...resolverOptions }),
  );

  const sassResolver = createCachedResolver(
    createSassSpecifierResolver({
      fs: resolutionFs,
    }),
  );

  const graphResolver = createModuleGraphResolver({
    async extractRequests(filePath) {
      const fileContents = await fs.readTextFile(filePath);
      const fileExtension = path.extname(filePath);
      if (isTypeScriptFile(fileExtension)) {
        const compiledContents = compileUsingTypescript(ts!, filePath, fileContents, compilerOptions);
        const start = performance.now();
        const sourceFile = ts!.createSourceFile(filePath, compiledContents, ts!.ScriptTarget.Latest);
        performance.measure(`Parse ${filePath} (compiled output)`, { start });
        return { compiledContents, requests: extractModuleRequests(ts!, sourceFile).specifiers };
      } else if (isJavaScriptFile(fileExtension)) {
        const start = performance.now();
        const sourceFile = ts!.createSourceFile(filePath, fileContents, ts!.ScriptTarget.Latest);
        performance.measure(`Parse ${filePath}`, { start });
        const { hasESM, specifiers } = extractModuleRequests(ts!, sourceFile);
        const withInlinedSourcemaps = await inlineExternalJsSourceMap(filePath, fileContents, fs, specifierResolver);
        const compiledContents = hasESM
          ? compileUsingTypescript(ts!, filePath, withInlinedSourcemaps, { ...compilerOptions, sourceMap: false })
          : withInlinedSourcemaps;
        return { compiledContents, requests: specifiers };
      } else if (isCssFile(fileExtension)) {
        const baseWithoutExt = path.basename(filePath, fileExtension);
        const isCssModule = path.extname(baseWithoutExt) === ".module";
        const withInlinedSourcemaps = await inlineExternalCssSourceMap(filePath, fileContents, fs, specifierResolver);
        const compiledContents = isCssModule
          ? await createCssModule(filePath, withInlinedSourcemaps, fs, specifierResolver)
          : createStyleInjectModule(filePath, withInlinedSourcemaps);
        return isCssModule ? { compiledContents, requests: [] } : { compiledContents, requests: [] };
      } else if (isSassFile(fileExtension)) {
        return {
          compiledContents: await createSassModule(sass!, filePath, fileContents, fs, specifierResolver, sassResolver),
          requests: [],
        };
      } else if (isSvgFile(fileExtension)) {
        return { compiledContents: "exports.ReactComponent = () => null;", requests: [] };
      }

      const mimeType = mime.getType(filePath) ?? "application/octet-stream";
      const assetDataURI = createBase64DataURI(await fs.readFile(filePath), mimeType);
      return {
        compiledContents: `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports.default = ${JSON.stringify(assetDataURI)};\n`,
        requests: [],
      };
    },
    async resolveRequest(filePath, specifier) {
      const parentDirectory = path.dirname(filePath);
      const { resolvedFile } = await specifierResolver(parentDirectory, specifier);
      return resolvedFile;
    },
  });
  const entryFilePaths = Array.isArray(entryFilePath) ? entryFilePath : [entryFilePath];
  const entryResolutions = await Promise.all(entryFilePaths.map((entryPath) => specifierResolver("/", entryPath)));
  const resolvedEntries = entryResolutions
    .filter(({ resolvedFile }) => !!resolvedFile)
    .map(({ resolvedFile }) => resolvedFile as string);
  return graphResolver(resolvedEntries);
}

function isTypeScriptFile(fileExtension: string) {
  return fileExtension === ".ts" || fileExtension === ".tsx" || fileExtension === ".mts" || fileExtension === ".cts";
}

function isJavaScriptFile(fileExtension: string) {
  return fileExtension === ".js" || fileExtension === ".cjs" || fileExtension === ".mjs";
}

function isSvgFile(fileExtension: string) {
  return fileExtension === ".svg";
}

function isCssFile(fileExtension: string) {
  return fileExtension === ".css";
}

function isSassFile(fileExtension: string) {
  return fileExtension === ".scss" || fileExtension === ".sass";
}
