/* eslint-disable no-console */
import type { CompilationWorkerProtocol, Initialize } from "./compilation-protocol";
import { evaluateSassLib, evaluateTypescriptLib } from "./compilation-libs";

function protocolListener({ data: message }: MessageEvent<CompilationWorkerProtocol>): void {
  switch (message.type) {
    case "init":
      initializeEnvLibs(message)
        .then(() => {
          self.postMessage({ type: "initialized" } satisfies CompilationWorkerProtocol);
        })
        .catch((error: unknown) => {
          self.postMessage({ type: "error", error } satisfies CompilationWorkerProtocol);
        });
  }
}

globalThis.addEventListener("message", protocolListener);

async function initializeEnvLibs({ libVersions }: Initialize) {
  const typescriptURL = unpkgUrlFor("typescript", libVersions.typescript, "lib/typescript.js");
  const sassURL = unpkgUrlFor("sass", libVersions.sass, "sass.dart.js");
  const immutableURL = unpkgUrlFor("immutable", libVersions.immutable, "dist/immutable.js");
  const [sassLibText, immutableLibText, typescriptLibText] = await Promise.all([
    fetchText(sassURL),
    fetchText(immutableURL),
    fetchText(typescriptURL),
  ]);

  const sass = evaluateSassLib(sassURL.href, sassLibText, immutableLibText, immutableURL.href);
  const ts = evaluateTypescriptLib(typescriptURL.href, typescriptLibText);
  console.log(`Worker initialized.`);
  console.log(`typescript ${ts.version}`);
  console.log(sass.info);
}

function unpkgUrlFor(packageName: string, packageVersion: string, pathInPackage: string): URL {
  return new URL(pathInPackage, `https://static.parastorage.com/unpkg/${packageName}@${packageVersion}/`);
}

async function fetchText(targetURL: URL): Promise<string> {
  const response = await fetch(targetURL);
  if (!response.ok) {
    throw new Error(`"HTTP ${response.status}: ${response.statusText}" while fetching ${targetURL.href}`);
  }
  return response.text();
}
