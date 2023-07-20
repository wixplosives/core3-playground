import path from "@file-services/path";
import { createStore, get, set } from "idb-keyval";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzers/analyzer-types";
import { cssAnalyzer } from "./analyzers/css-analyzer";
import { isJavaScriptFile, javascriptAnalyzer } from "./analyzers/javascript-analyzer";
import { sassAnalyzer } from "./analyzers/sass-analyzer";
import { svgAnalyzer } from "./analyzers/svg-analyzer";
import { typescriptAnalyzer } from "./analyzers/typescript-analyzer";
import { compilationCacheStoreName, playgroundDbName } from "./constants";
import { createBrowserFileSystem, type BrowserFileSystem } from "./fs/browser-file-system";
import { createCssSpecifierResolver } from "./helpers/css";
import type { AnalyzedModule } from "./helpers/module-graph-resolver";
import { createSassSpecifierResolver, evaluateSassLib } from "./helpers/sass";
import {
  AsyncSpecifierResolverCache,
  createAsyncSpecifierResolver,
  createCachedResolver,
  createResolutionFs,
  type AsyncSpecifierResolver,
} from "./helpers/specifier-resolver";
import { evaluateTypescriptLib } from "./helpers/typescript";
import { createBase64DataURIModule } from "./helpers/url";
import { rpcResponder } from "./rpc/rpc-responder";
import type { RpcCall } from "./rpc/rpc-types";

const compilationCacheStore = createStore(playgroundDbName, compilationCacheStoreName);

export interface Compilation {
  initialize: typeof initialize;
  analyzeModule: typeof analyzeModule;
  clearCache: typeof clearCache;
}

const { onCall } = rpcResponder<Compilation>({
  api: { initialize, analyzeModule, clearCache },
  dispatchResponse: (response) => globalThis.postMessage(response),
});

globalThis.addEventListener("message", (event) => onCall(event.data as RpcCall<Compilation>));

let ts: typeof import("typescript") | undefined = undefined;
let sass: typeof import("sass") | undefined = undefined;
let fs: BrowserFileSystem | undefined = undefined;
let specifierResolver: AsyncSpecifierResolver | undefined = undefined;
let cssAssetResolver: AsyncSpecifierResolver | undefined = undefined;
let sassModuleResolver: AsyncSpecifierResolver | undefined = undefined;

const specifierResolverCache = new AsyncSpecifierResolverCache();
const cssAssetResolverCache = new AsyncSpecifierResolverCache();
const sassModuleResolverCache = new AsyncSpecifierResolverCache();
const packageVersionCache = new Map<string, string>();
const fileHandleCache = new Map<string, FileSystemFileHandle>();
const directoryHandleCache = new Map<string, FileSystemDirectoryHandle>();

function clearCache() {
  packageVersionCache.clear();
  fileHandleCache.clear();
  directoryHandleCache.clear();
  specifierResolverCache.clear();
  cssAssetResolverCache.clear();
  sassModuleResolverCache.clear();
}

const moduleAnalyzers: ModuleAnalyzer[] = [
  typescriptAnalyzer,
  javascriptAnalyzer,
  cssAnalyzer,
  sassAnalyzer,
  svgAnalyzer,
];

export interface InitializeOptions {
  rootDirectory: FileSystemDirectoryHandle;
  typescriptURL: string;
  typescriptLibText: string;
  sassURL: string;
  sassLibText: string;
  immutableURL: string;
  immutableLibText: string;
}

function initialize({
  rootDirectory,
  typescriptURL,
  typescriptLibText,
  sassURL,
  sassLibText,
  immutableURL,
  immutableLibText,
}: InitializeOptions): void {
  fs = createBrowserFileSystem(rootDirectory, fileHandleCache, directoryHandleCache);
  ts = evaluateTypescriptLib(typescriptURL, typescriptLibText);
  sass = evaluateSassLib(sassURL, sassLibText, immutableLibText, immutableURL);

  const resolutionFs = createResolutionFs(fs);

  specifierResolver = createCachedResolver(
    createAsyncSpecifierResolver({
      fs: resolutionFs,
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"],
      alias: {
        "@babel/runtime/helpers/esm/*": "@babel/runtime/helpers/*",
      },
      fallback: {
        // to support @wixc3/react-board's react-dom/client import in reac@17 projects
        "react-dom/client": false,
      },
    }),
    specifierResolverCache,
  );

  cssAssetResolver = createCachedResolver(
    createCssSpecifierResolver({
      fs: resolutionFs,
    }),
    cssAssetResolverCache,
  );

  sassModuleResolver = createCachedResolver(
    createSassSpecifierResolver({
      fs: resolutionFs,
    }),
    sassModuleResolverCache,
  );
}

async function analyzeModule(filePath: string): Promise<AnalyzedModule> {
  if (!fs) {
    throw new Error("fs was not initialized");
  } else if (!ts) {
    throw new Error("typescript was not initialized");
  } else if (!sass) {
    throw new Error("sass was not initialized");
  } else if (!specifierResolver || !cssAssetResolver || !sassModuleResolver) {
    throw new Error("resolvers were not initialized");
  }

  const analyzerContext: ModuleAnalyzerContext = {
    filePath,
    fileExtension: path.extname(filePath),
    fs,
    ts,
    sass,
    specifierResolver,
    cssAssetResolver,
    sassModuleResolver,
  };

  const cacheKey = await getCacheKey(analyzerContext, packageVersionCache);
  if (cacheKey) {
    const cachedModule = await get<AnalyzedModule>(cacheKey, compilationCacheStore);
    if (cachedModule) {
      return cachedModule;
    }
  }

  for (const { test, analyze } of moduleAnalyzers) {
    if (test(analyzerContext)) {
      const analyzedModule = await analyze(analyzerContext);
      if (cacheKey) {
        await set(cacheKey, analyzedModule, compilationCacheStore);
      }
      return analyzedModule;
    }
  }

  return {
    compiledContents: createBase64DataURIModule(filePath, await fs.readFile(filePath)),
    requests: [],
  };
}

async function getCacheKey(
  analyzerContext: ModuleAnalyzerContext,
  packageVersionCache?: Map<string, string>,
): Promise<string | undefined> {
  if (!isJavaScriptFile(analyzerContext)) {
    return;
  }
  const { filePath, fs } = analyzerContext;
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
  const packageVersion = await getPackageVersion(packagePath, fs, packageVersionCache);
  return packageVersion ? `${packageName}@${packageVersion}/${path.relative(packagePath, filePath)}` : undefined;
}

function getNameFromPackagePath(packageFilePath: string): string {
  const [maybeScope = "", maybeName = ""] = packageFilePath.split("/");
  return maybeScope.startsWith("@") ? `${maybeScope}/${maybeName}` : maybeScope;
}

async function getPackageVersion(
  packagePath: string,
  fs: BrowserFileSystem,
  packageVersionCache?: Map<string, string>,
): Promise<string | undefined> {
  const cachedVersion = packageVersionCache?.get(packagePath);
  if (cachedVersion) {
    return cachedVersion;
  }
  const packageJsonPath = path.join(packagePath, "package.json");
  if (await fs.fileExists(packageJsonPath)) {
    const { version: packageVersion } = (await fs.readJSONFile(packageJsonPath)) as { version: string };
    packageVersionCache?.set(packagePath, packageVersion);
    return packageVersion;
  }
  return undefined;
}
