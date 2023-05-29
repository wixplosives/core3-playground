import { createBaseCjsModuleSystem } from "@file-services/commonjs";

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
    load: (deps: { util: unknown; immutable: unknown }, target: unknown) => void;
  };

  const sassLib = {} as unknown as typeof import("sass");
  sassExports.load({ util: { inspect: {} }, immutable }, sassLib);
  return "info" in sassLib ? sassLib : (sassExports as unknown as typeof import("sass"));
}

export function evaluateTypescriptLib(typescriptURL: string, typescriptText: string) {
  typescriptText = typescriptText
    // remove broken typescript sourcemap
    .replace(`\n//# sourceMappingURL=typescript.js.map`, ``)
    // disable code causing caught exception
    .replace(`const etwModulePath =`, `// const etwModulePath =`)
    .replace(`var etwModulePath =`, `// var etwModulePath =`)
    .replace(`require(etwModulePath);`, `void 0`);

  const typescriptModuleSystem = singlePackageModuleSystem("typescript", typescriptURL, typescriptText);
  const typescriptLib = typescriptModuleSystem.requireModule(typescriptURL) as typeof import("typescript");
  return typescriptLib;
}

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
