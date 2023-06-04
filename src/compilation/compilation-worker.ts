import { evaluateSassLib, evaluateTypescriptLib, fixTypescriptBundle } from "./compilation-libs";
import { log } from "../log";
import { rpcResponder } from "../rpc/rpc-responder";
import type { RpcCall } from "../rpc/rpc-types";
import { compileUsingTypescript } from "../compilers/typescript-compiler";

const wixUnpkgURL = new URL("https://static.parastorage.com/unpkg/");

export interface Compilation {
  /** Initialize compilation environment's typescript and sass */
  initialize: typeof initialize;
  compile: typeof compile;
}

const { onCall } = rpcResponder<Compilation>({
  api: { compile, initialize },
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

async function initialize(versions: LibraryVersions): Promise<void> {
  const typescriptURL = unpkgUrlFor("typescript", versions.typescript, "lib/typescript.js");
  const sassURL = unpkgUrlFor("sass", versions.sass, "sass.dart.js");
  const immutableURL = unpkgUrlFor("immutable", versions.immutable, "dist/immutable.js");
  const [sassLibText, immutableLibText, typescriptLibText] = await Promise.all([
    fetchText(sassURL),
    fetchText(immutableURL),
    fetchText(typescriptURL),
  ]);

  ts = evaluateTypescriptLib(typescriptURL.href, fixTypescriptBundle(typescriptLibText));
  const sass = evaluateSassLib(sassURL.href, sassLibText, immutableLibText, immutableURL.href);
  log(ts.version);
  log(sass.info);
}

function compile(filePath: string, fileContents: string): string {
  if (ts === undefined) {
    throw new Error(`typescript was not yet initialized`);
  }
  const compilerOptions: import("typescript").CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSXDev,
    sourceMap: true,
    inlineSources: true,
  };

  return compileUsingTypescript(ts, filePath, fileContents, compilerOptions);
}

function unpkgUrlFor(packageName: string, packageVersion: string, pathInPackage: string): URL {
  return new URL(`${packageName}@${packageVersion}/${pathInPackage}`, wixUnpkgURL);
}

async function fetchText(targetURL: URL): Promise<string> {
  const response = await fetch(targetURL);
  if (!response.ok) {
    throw new Error(`"HTTP ${response.status}: ${response.statusText}" while fetching ${targetURL.href}`);
  }
  return response.text();
}
