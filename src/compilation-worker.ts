import { fetchText } from "./helpers/dom";
import { compileUsingTypescript } from "./helpers/typescript";
import { evaluateSassLib, evaluateTypescriptLib, fixTypescriptBundle, unpkgUrlFor } from "./helpers/vendor-libs";
import { rpcResponder } from "./rpc/rpc-responder";
import type { RpcCall } from "./rpc/rpc-types";

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
  evaluateSassLib(sassURL.href, sassLibText, immutableLibText, immutableURL.href);
  // log(ts.version);
  // log(sass.info);
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
