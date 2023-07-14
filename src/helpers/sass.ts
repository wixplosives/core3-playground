import path from "@file-services/path";
import type { BrowserFileSystem } from "../fs/browser-file-system";
import { createCssModule, createStyleInjectModule } from "./css";
import {
  createAsyncSpecifierResolver,
  type AsyncSpecifierResolver,
  type IAsyncSpecifierResolverOptions,
} from "./specifier-resolver";
import { singlePackageModuleSystem } from "./package-evaluation";

export async function createSassModule(
  sass: typeof import("sass"),
  filePath: string,
  fileContents: string,
  fs: BrowserFileSystem,
  cssResolver: AsyncSpecifierResolver,
  sassResolver: AsyncSpecifierResolver,
): Promise<string> {
  const parentDirectoryPath = path.dirname(filePath);
  const fileUrl = new URL(`file://` + encodeURI(filePath));
  const start = performance.now();
  const { css } = await sass.compileStringAsync(fileContents, {
    importers: [
      {
        async load(canonicalUrl) {
          const filePath = decodeURI(canonicalUrl.pathname);
          const contents = await fs.readTextFile(filePath);
          const fileExtension = path.extname(filePath);

          return {
            contents,
            syntax: sassSyntaxFromExt(fileExtension),
          };
        },
        async canonicalize(specifier) {
          if (specifier.startsWith("file://")) {
            specifier = new URL(specifier).pathname;
          }
          const { resolvedFile } = await sassResolver(parentDirectoryPath, specifier);
          return resolvedFile ? new URL(`file://` + encodeURI(resolvedFile)) : new URL(specifier, fileUrl);
        },
      },
    ],
  });
  performance.measure(`Transpile ${filePath} (to CSS)`, { start });

  const baseWithoutExt = path.basename(filePath, path.extname(filePath));
  return path.extname(baseWithoutExt) === ".module"
    ? await createCssModule(filePath, css, fs, cssResolver)
    : createStyleInjectModule(filePath, css);
}

export interface ISassResolutionOptions extends IAsyncSpecifierResolverOptions {
  includePaths?: string[];
}

export const createSassSpecifierResolver = (options: ISassResolutionOptions): AsyncSpecifierResolver => {
  const resolver = createAsyncSpecifierResolver({
    ...options,
    // .css is also picked up by sass (when using @import)
    extensions: [".scss", ".sass", ".css"],
  });
  const { fs, includePaths = [] } = options;

  return async (filePath, request) => {
    // we try several request aliases, so make sure we have a total list of visited paths for cache invalidation
    const allVisitedPaths = new Set<string>();

    const directoryPath = fs.dirname(filePath);
    const possibleContexts = [directoryPath, ...includePaths];
    for (const possibleRequest of getPossibleRequests(request)) {
      for (const contextPath of possibleContexts) {
        const { resolvedFile, visitedPaths } = await resolver(contextPath, possibleRequest);
        for (const visited of visitedPaths) {
          allVisitedPaths.add(visited);
        }
        if (resolvedFile) {
          return {
            resolvedFile: resolvedFile,
            visitedPaths: allVisitedPaths,
          };
        }
      }
    }

    return {
      resolvedRequest: undefined,
      visitedPaths: allVisitedPaths,
    };
  };
};

function sassSyntaxFromExt(fileExtension: string): import("sass").Syntax {
  switch (fileExtension) {
    case ".scss":
      return "scss";
    case ".sass":
      return "indented";
    case ".css":
      return "css";
    default:
      return "scss";
  }
}

function* getPossibleRequests(request: string): Generator<string, void, unknown> {
  if (
    !request ||
    request.startsWith("data:") ||
    request.startsWith("http://") ||
    request.startsWith("https://") ||
    request.startsWith("sass:")
  ) {
    return;
  }

  // special style used by s/css-loader to reference packages in node_modules
  if (request.startsWith("~")) {
    yield* getPossibleRequests(request.slice(1));
    return;
  }

  const isRelativeRequest =
    request.startsWith("./") || request.startsWith("../") || request === "." || request === "..";

  if (!isRelativeRequest) {
    yield* getPossibleRequests(`./${request}`);
  }

  yield request;

  const requestBase = path.basename(request);
  if (!requestBase) {
    // request ending with /, so base is empty
    return;
  }

  if (!requestBase.startsWith("_")) {
    const prebase = request.slice(0, -requestBase.length);
    yield `${prebase}_${requestBase}`;
  }

  yield `${request}/index`;
  yield `${request}/_index`;
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
