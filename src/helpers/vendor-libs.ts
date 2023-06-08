import { createBaseCjsModuleSystem } from "@file-services/commonjs";
import { wixUnpkgURL } from "../constants";

export function unpkgUrlFor(packageName: string, packageVersion: string, pathInPackage: string): URL {
  return new URL(`${packageName}@${packageVersion}/${pathInPackage}`, wixUnpkgURL);
}

type SassDeps = {
  util: unknown;
  immutable: unknown;
};
type SassLoadFn = (deps: SassDeps, target: unknown) => void;

export function evaluateSassLib(sassURL: string, sassLibText: string, immutableLibText: string, immutableURL: string) {
  const immutableJsModuleSystem = singlePackageModuleSystem("immutable", immutableURL, immutableLibText);
  const immutable = immutableJsModuleSystem.requireModule(immutableURL) as typeof import("immutable");

  const sassModuleSystem = singlePackageModuleSystem("sass", sassURL, sassLibText);

  sassModuleSystem.requireCache.set("util", {
    id: "util",
    filename: "util",
    exports: { inspect: {} },
    children: [],
  });
  sassModuleSystem.requireCache.set("fs", {
    id: "fs",
    filename: "fs",
    exports: {},
    children: [],
  });
  sassModuleSystem.requireCache.set("immutable", {
    id: "immutable",
    filename: "immutable",
    exports: immutable,
    children: [],
  });

  const sassExports = sassModuleSystem.requireModule(sassURL) as {
    load: SassLoadFn;
  };
  const load =
    sassExports.load ?? (globalThis as unknown as { _cliPkgExports: [{ load: SassLoadFn }] })?._cliPkgExports[0]?.load;
  const sassLib = {} as unknown as typeof import("sass");
  load({ util: { inspect: {} }, immutable }, sassLib);
  return "info" in sassLib ? sassLib : (sassExports as unknown as typeof import("sass"));
}

export function evaluateTypescriptLib(typescriptURL: string, typescriptText: string) {
  const typescriptModuleSystem = singlePackageModuleSystem("typescript", typescriptURL, typescriptText);
  const typescriptLib = typescriptModuleSystem.requireModule(typescriptURL) as typeof import("typescript");
  return typescriptLib;
}

export const fixTypescriptBundle = (typescriptBundleText: string) =>
  typescriptBundleText
    // remove broken typescript sourcemap
    .replace(`\n//# sourceMappingURL=typescript.js.map`, ``)
    // disable code causing caught exception
    .replace(`const etwModulePath =`, `// const etwModulePath =`)
    .replace(`var etwModulePath =`, `// var etwModulePath =`)
    .replace(`require(etwModulePath);`, `void 0`);

function singlePackageModuleSystem(packageName: string, packageURL: string, packageLibText: string) {
  return createBaseCjsModuleSystem({
    dirname(path) {
      if (path === packageURL) {
        return "/";
      } else {
        throw new Error(`Unexpected path "${path}" passed to dirname during ${packageName} evaluation`);
      }
    },
    readFileSync(path) {
      if (path === packageURL) {
        return packageLibText;
      } else {
        throw new Error(`Unexpected file path "${path}" during ${packageName} evaluation`);
      }
    },
    resolveFrom(_contextPath, specifier) {
      throw new Error(`Unexpected request "${specifier}" during ${packageName} evaluation`);
    },
  });
}
