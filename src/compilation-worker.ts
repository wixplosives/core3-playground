import path from "@file-services/path";
import { createStore, get, set } from "idb-keyval";
import postcss from "postcss";
import postcssSCSS from "postcss-scss";
import { compilationCacheStoreName, playgroundDbName } from "./constants";
import { createBrowserFileSystem, type BrowserFileSystem } from "./fs/browser-file-system";
import { createCssModule, createCssSpecifierResolver, createStyleInjectModule, inlineCSSUrls } from "./helpers/css";
import { fetchText } from "./helpers/dom";
import { createModuleGraphResolver, type AnalyzedModule, type ModuleGraph } from "./helpers/module-graph-resolver";
import { compileUsingSass, createSassSpecifierResolver, evaluateSassLib } from "./helpers/sass";
import { inlineExternalCssSourceMap, inlineExternalJsSourceMap } from "./helpers/source-maps";
import {
  createAsyncSpecifierResolver,
  createCachedResolver,
  type IAsyncResolutionFileSystem,
  type IAsyncSpecifierResolverOptions,
} from "./helpers/specifier-resolver";
import { compileUsingTypescript, evaluateTypescriptLib, extractModuleRequests } from "./helpers/typescript";
import { createBase64DataURIModule, unpkgUrlFor } from "./helpers/url";
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

interface ModuleAnalyzer {
  test: (fileExtension: string, filePath: string) => boolean;
  analyze: (filePath: string, fs: BrowserFileSystem, fileExtension: string) => AnalyzedModule | Promise<AnalyzedModule>;
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
  const fileHandleCache = new Map<string, FileSystemFileHandle>();
  const directoryHandleCache = new Map<string, FileSystemDirectoryHandle>();
  const fs = createBrowserFileSystem(rootHandle, fileHandleCache, directoryHandleCache);
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

  const cssAssetResolver = createCachedResolver(
    createCssSpecifierResolver({
      fs: resolutionFs,
    }),
  );

  const sassModuleResolver = createCachedResolver(
    createSassSpecifierResolver({
      fs: resolutionFs,
    }),
  );

  const compilationCacheStore = createStore(playgroundDbName, compilationCacheStoreName);
  const packageVersions = new Map<string, string>();

  const typescriptAnalyzer: ModuleAnalyzer = {
    test: isTypeScriptFile,
    async analyze(filePath, fs) {
      const fileContents = await fs.readTextFile(filePath);
      const compiledContents = compileUsingTypescript(ts!, filePath, fileContents, compilerOptions);
      const start = performance.now();
      const sourceFile = ts!.createSourceFile(filePath, compiledContents, ts!.ScriptTarget.Latest);
      performance.measure(`Parse ${filePath} (compiled output)`, { start });
      return { compiledContents, requests: extractModuleRequests(ts!, sourceFile).specifiers };
    },
  };

  async function getPackageVersion(packagePath: string): Promise<string | undefined> {
    const cachedVersion = packageVersions.get(packagePath);
    if (cachedVersion) {
      return cachedVersion;
    }
    const packageJsonPath = path.join(packagePath, "package.json");
    if (await fs.fileExists(packageJsonPath)) {
      const { version: packageVersion } = (await fs.readJSONFile(packageJsonPath)) as { version: string };
      packageVersions.set(packagePath, packageVersion);
      return packageVersion;
    }
    return undefined;
  }

  async function getCacheKey(filePath: string): Promise<string | undefined> {
    const nodeModulesFragment = "/node_modules/";
    const nodeModulesIdx = filePath.lastIndexOf(nodeModulesFragment);
    if (nodeModulesIdx === -1) {
      return;
    }
    const packagePathIdx = nodeModulesIdx + nodeModulesFragment.length;
    const nodeModulesPath = filePath.slice(0, packagePathIdx);
    const packageFilePath = filePath.slice(packagePathIdx);
    const packageName = getNameFromPackagePath(packageFilePath);
    const packagePath = path.join(nodeModulesPath, packageName);
    const packageVersion = await getPackageVersion(packagePath);
    return packageVersion ? `${packageName}@${packageVersion}/${path.relative(packagePath, filePath)}` : undefined;
  }

  const javascriptAnalyzer: ModuleAnalyzer = {
    test: isJavaScriptFile,
    async analyze(filePath, fs) {
      const cacheKey = await getCacheKey(filePath);
      if (cacheKey) {
        const cachedModule = await get<AnalyzedModule>(cacheKey, compilationCacheStore);
        if (cachedModule) {
          return cachedModule;
        }
      }
      const fileContents = await fs.readTextFile(filePath);
      const start = performance.now();
      const sourceFile = ts!.createSourceFile(filePath, fileContents, ts!.ScriptTarget.Latest);
      performance.measure(`Parse ${filePath}`, { start });
      const { hasESM, specifiers } = extractModuleRequests(ts!, sourceFile);
      const withInlinedSourcemaps = await inlineExternalJsSourceMap(filePath, fileContents, fs, specifierResolver);
      const compiledContents = hasESM
        ? compileUsingTypescript(ts!, filePath, withInlinedSourcemaps, { ...compilerOptions, sourceMap: false })
        : withInlinedSourcemaps;
      const analyzedModule: AnalyzedModule = { compiledContents, requests: specifiers };

      if (cacheKey) {
        await set(cacheKey, analyzedModule, compilationCacheStore);
      }
      return analyzedModule;
    },
  };

  async function readCssAndInlineAssets(filePath: string, syntax?: postcss.Syntax): Promise<string> {
    const contextPath = path.dirname(filePath);
    const fileContents = await fs.readTextFile(filePath);

    const start = performance.now();
    const { root } = postcss().process(fileContents, { from: filePath, syntax: syntax! });
    performance.measure(`Parse ${filePath}`, { start });

    await inlineCSSUrls(contextPath, root, cssAssetResolver, fs);
    return root.toString(syntax?.stringify);
  }

  const cssAnalyzer: ModuleAnalyzer = {
    test: isCssFile,
    async analyze(filePath, fs, fileExtension) {
      const baseWithoutExt = path.basename(filePath, fileExtension);
      const isCssModule = path.extname(baseWithoutExt) === ".module";

      const withInlinedSourcemaps = await inlineExternalCssSourceMap(
        filePath,
        await readCssAndInlineAssets(filePath),
        fs,
        specifierResolver,
      );

      const compiledContents = isCssModule
        ? await createCssModule(filePath, withInlinedSourcemaps, readCssAndInlineAssets, specifierResolver)
        : createStyleInjectModule(filePath, withInlinedSourcemaps);

      return { compiledContents, requests: [] };
    },
  };

  const readSassFileContents = (filePath: string) => readCssAndInlineAssets(filePath, postcssSCSS);

  const sassAnalyzer: ModuleAnalyzer = {
    test: isSassFile,
    async analyze(filePath, _fs, fileExtension) {
      const css = await compileUsingSass(sass!, filePath, readSassFileContents, sassModuleResolver);

      const baseWithoutExt = path.basename(filePath, fileExtension);
      const isSassModule = path.extname(baseWithoutExt) === ".module";

      const compiledContents = isSassModule
        ? await createCssModule(filePath, css, readCssAndInlineAssets, cssAssetResolver)
        : createStyleInjectModule(filePath, css);

      return {
        compiledContents,
        requests: [],
      };
    },
  };

  const svgAnalyzer: ModuleAnalyzer = {
    test: isSvgFile,
    analyze() {
      // TODO: actually implement this
      return { compiledContents: "exports.ReactComponent = () => null;", requests: [] };
    },
  };

  const moduleAnalyzers: ModuleAnalyzer[] = [
    typescriptAnalyzer,
    javascriptAnalyzer,
    cssAnalyzer,
    sassAnalyzer,
    svgAnalyzer,
  ];

  const graphResolver = createModuleGraphResolver({
    async analyzeModule(filePath) {
      const fileExtension = path.extname(filePath);
      for (const { test, analyze } of moduleAnalyzers) {
        if (test(fileExtension, filePath)) {
          return analyze(filePath, fs, fileExtension);
        }
      }
      return {
        compiledContents: createBase64DataURIModule(filePath, await fs.readFile(filePath)),
        requests: [],
      };
    },
    async resolveRequest(filePath, specifier) {
      const parentDirectory = path.dirname(filePath);
      const { resolvedFile } = await specifierResolver(parentDirectory, specifier);
      return resolvedFile;
    },
  });

  return graphResolver(entryFilePath);
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
function getNameFromPackagePath(packageFilePath: string): string {
  const [maybeScope = "", maybeName = ""] = packageFilePath.split("/");
  return maybeScope.startsWith("@") ? `${maybeScope}/${maybeName}` : maybeScope;
}
