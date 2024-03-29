import path from "@file-services/path";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzers/analyzer-types";
import { cssAnalyzer } from "./analyzers/css-analyzer";
import { isJavaScriptFile, javascriptAnalyzer } from "./analyzers/javascript-analyzer";
import { jsonAnalyzer } from "./analyzers/json-analyzer";
import { sassAnalyzer } from "./analyzers/sass-analyzer";
import { svgAnalyzer } from "./analyzers/svg-analyzer";
import { typescriptAnalyzer } from "./analyzers/typescript-analyzer";
import { createBrowserFileSystem, type BrowserFileSystem } from "./fs/browser-file-system";
import { createCssSpecifierResolver } from "./helpers/css";
import { openPlaygroundDb, type PlaygroundDatabase } from "./helpers/indexed-db";
import type { AnalyzedModule } from "./helpers/module-graph-resolver";
import { evaluateSassLib } from "./helpers/sass-lib-evaluate";
import { createSassSpecifierResolver } from "./helpers/sass-resolver";
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

let db: PlaygroundDatabase | undefined = undefined;
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
  jsonAnalyzer,
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

async function initialize({
  rootDirectory,
  typescriptURL,
  typescriptLibText,
  sassURL,
  sassLibText,
  immutableURL,
  immutableLibText,
}: InitializeOptions): Promise<void> {
  fs = createBrowserFileSystem(rootDirectory, fileHandleCache, directoryHandleCache);
  ts = evaluateTypescriptLib(typescriptURL, typescriptLibText);
  sass = evaluateSassLib(sassURL, sassLibText, immutableLibText, immutableURL);

  const resolutionFs = createResolutionFs(fs);

  specifierResolver = createCachedResolver(
    createAsyncSpecifierResolver({
      fs: resolutionFs,
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"],
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

  db = await openPlaygroundDb();
}

async function analyzeModule(filePath: string, searchParams?: string): Promise<AnalyzedModule> {
  if (!fs) {
    throw new Error("fs was not initialized");
  } else if (!db) {
    throw new Error("db was not initialized");
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
    searchParams: searchParams ? new URLSearchParams(searchParams) : undefined,
  };

  const cacheKey = await getCacheKey(analyzerContext, packageVersionCache);
  if (cacheKey) {
    const cachedModule = await db.get("compilation-cache", cacheKey);
    if (cachedModule) {
      return cachedModule;
    }
  }

  for (const { test, analyze } of moduleAnalyzers) {
    if (test(analyzerContext)) {
      const analyzedModule = await analyze(analyzerContext);
      if (cacheKey) {
        await db.put("compilation-cache", analyzedModule, cacheKey);
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
  const { filePath, fs, searchParams } = analyzerContext;
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
  const cachePostfix = searchParams ? "?" + searchParams.toString() : "";
  return packageVersion
    ? `${packageName}@${packageVersion}/${path.relative(packagePath, filePath)}${cachePostfix}`
    : undefined;
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
