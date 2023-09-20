import { singlePackageModuleSystem } from "./package-evaluation";

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

  const globalForSass = Object.create(globalThis) as typeof globalThis & { _cliPkgExports?: [{ load: SassLoadFn }?] };
  const processForSass = {
    env: {},
    stdout: {
      isTTY: false,
    },
  };
  Object.defineProperty(globalForSass, "process", {
    get() {
      return processForSass;
    },
    set() {
      return undefined;
    },
  });
  sassModuleSystem.globals["global"] = globalForSass;
  sassModuleSystem.globals["globalThis"] = globalForSass;

  type SassDeps = {
    util: unknown;
    immutable: unknown;
  };
  type SassLoadFn = (deps: SassDeps, target: unknown) => void;

  const sassExports = sassModuleSystem.requireModule(sassURL) as {
    load: SassLoadFn;
  };
  const load = sassExports.load ?? globalForSass._cliPkgExports?.[0]?.load;
  const sassLib = {} as unknown as typeof import("sass");
  load({ util: { inspect: {} }, immutable }, sassLib);
  return "info" in sassLib ? sassLib : (sassExports as unknown as typeof import("sass"));
}
