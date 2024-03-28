import path from "@file-services/path";
import type { Compilation, InitializeOptions } from "./compilation-worker";
import { compilationBundleName, compilationWorkerName, defaultCompilationWorkerCount, wixUnpkgURL } from "./constants";
import { createBrowserFileSystem } from "./fs/browser-file-system";
import { fetchText } from "./helpers/dom";
import { createModuleGraphResolver, type ModuleGraph } from "./helpers/module-graph-resolver";
import {
  createAsyncSpecifierResolver,
  createCachedResolver,
  createResolutionFs,
  type IAsyncSpecifierResolverOptions,
} from "./helpers/specifier-resolver";
import { rpcResponder } from "./rpc/rpc-responder";
import type { RpcCall } from "./rpc/rpc-types";
import { createRPCWorker, type RPCWorker } from "./rpc/rpc-worker";

const resolverOptions: Partial<IAsyncSpecifierResolverOptions> = {
  extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"],
  fallback: {
    // to support @wixc3/react-board's react-dom/client import in reac@17 projects
    "react-dom/client": false,
  },
};

export interface Processing {
  /** Initialize compilation environment's typescript and sass */
  initialize: typeof initialize;
  calculateModuleGraph: typeof calculateModuleGraph;
  resolveSpecifier: typeof resolveSpecifier;
}

const { onCall } = rpcResponder<Processing>({
  api: { resolveSpecifier, calculateModuleGraph, initialize },
  dispatchResponse: (response) => globalThis.postMessage(response),
});

globalThis.addEventListener("message", (event) => onCall(event.data as RpcCall<Processing>));

export interface LibraryVersions {
  /** typescript version to use for compilation */
  typescript: string;
  /** sass version to load */
  sass: string;
  /** immutable version to load (used by sass) */
  immutable: string;
}

const compilationWorkers: RPCWorker<Compilation>[] = [];

async function initialize(rootDirectory: FileSystemDirectoryHandle, versions: LibraryVersions): Promise<void> {
  const typescriptURL = unpkgUrlFor("typescript", versions.typescript, "lib/typescript.js");
  const sassURL = unpkgUrlFor("sass", versions.sass, "sass.dart.js");
  const immutableURL = unpkgUrlFor("immutable", versions.immutable, "dist/immutable.js");
  const [sassLibText, immutableLibText, typescriptLibText] = await Promise.all([
    fetchText(sassURL),
    fetchText(immutableURL),
    fetchText(typescriptURL),
  ]);
  const compilationWorkerURL = new URL(compilationBundleName, import.meta.url);
  const initializeOptions: InitializeOptions = {
    rootDirectory,
    immutableLibText,
    immutableURL: immutableURL.href,
    sassLibText,
    sassURL: sassURL.href,
    typescriptLibText,
    typescriptURL: typescriptURL.href,
  };

  const numberOfWorkers = Math.min(navigator.hardwareConcurrency ?? defaultCompilationWorkerCount, 12);

  for (let i = 0; i < numberOfWorkers; i++) {
    const compilationWorker = createRPCWorker<Compilation>(compilationWorkerURL, {
      name: `${compilationWorkerName} ${i + 1}`,
      type: "module",
    });
    compilationWorkers.push(compilationWorker);
  }
  await Promise.all(compilationWorkers.map((worker) => worker.api.initialize(initializeOptions)));
}

async function resolveSpecifier(
  rootHandle: FileSystemDirectoryHandle,
  contextPath: string,
  specifier: string,
): Promise<string | undefined | false> {
  const fs = createBrowserFileSystem(rootHandle);

  const specifierResolver = createCachedResolver(
    createAsyncSpecifierResolver({ fs: createResolutionFs(fs), ...resolverOptions }),
  );
  const { resolvedFile } = await specifierResolver(contextPath, specifier);
  return resolvedFile;
}

async function calculateModuleGraph(
  rootHandle: FileSystemDirectoryHandle,
  entryFilePath: string | string[],
): Promise<ModuleGraph> {
  if (!compilationWorkers.length) {
    throw new Error("compilation workers are not initialized");
  }
  const fileHandleCache = new Map<string, FileSystemFileHandle>();
  const directoryHandleCache = new Map<string, FileSystemDirectoryHandle>();
  const fs = createBrowserFileSystem(rootHandle, fileHandleCache, directoryHandleCache);

  const resolutionFs = createResolutionFs(fs);
  const specifierResolver = createCachedResolver(
    createAsyncSpecifierResolver({ fs: resolutionFs, ...resolverOptions }),
  );
  const cjsSpecifierResolver = createCachedResolver(
    createAsyncSpecifierResolver({
      fs: resolutionFs,
      conditions: ["require"],
      alias: { "@babel/runtime/helpers/esm/*": "@babel/runtime/helpers/*" },
    }),
  );

  await Promise.all(compilationWorkers.map((worker) => worker.api.clearCache()));

  let compilationWorkerIndex = 0;

  const graphResolver = createModuleGraphResolver({
    analyzeModule(filePath, searchParams) {
      const worker = compilationWorkers[compilationWorkerIndex]!;
      compilationWorkerIndex++;
      compilationWorkerIndex %= compilationWorkers.length;
      return worker.api.analyzeModule(filePath, searchParams);
    },
    async resolveRequest(filePath, specifier) {
      const parentDirectory = path.dirname(filePath);
      const resolver = specifierNeedsCjs(specifier) ? cjsSpecifierResolver : specifierResolver;
      const { resolvedFile } = await resolver(parentDirectory, specifier);
      return resolvedFile;
    },
  });

  return graphResolver(entryFilePath);
}

function unpkgUrlFor(packageName: string, packageVersion: string, pathInPackage: string): URL {
  return new URL(`${packageName}@${packageVersion}/${pathInPackage}`, wixUnpkgURL);
}

function specifierNeedsCjs(specifier: string): boolean {
  return specifier === "tslib" || specifier === "@babel/runtime" || specifier.startsWith("@babel/runtime/");
}
