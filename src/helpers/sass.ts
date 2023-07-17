import path from "@file-services/path";
import { singlePackageModuleSystem } from "./package-evaluation";
import { filePathSourceMapPrefix } from "./source-maps";
import {
  createAsyncSpecifierResolver,
  type AsyncSpecifierResolver,
  type IAsyncSpecifierResolverOptions,
} from "./specifier-resolver";

export async function compileUsingSass(
  sass: typeof import("sass"),
  filePath: string,
  getFileContents: (filePath: string) => Promise<string>,
  sassResolver: AsyncSpecifierResolver,
): Promise<string> {
  const parentDirectoryPath = path.dirname(filePath);
  const fileUrl = new URL(`file://` + encodeURI(filePath));
  const start = performance.now();
  const { css } = await sass.compileStringAsync(await getFileContents(filePath), {
    importers: [
      {
        async load(canonicalUrl) {
          const filePath = decodeURI(canonicalUrl.pathname);
          const fileExtension = path.extname(filePath);

          return {
            contents: await getFileContents(filePath),
            syntax: sassSyntaxFromExt(fileExtension),
            sourceMapUrl: new URL(filePathSourceMapPrefix + encodeURI(filePath)),
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

  return css;
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
  const { includePaths = [] } = options;

  return async (contextPath, request) => {
    // we try several request aliases, so make sure we have a total list of visited paths for cache invalidation
    const allVisitedPaths = new Set<string>();

    const possibleContexts = [contextPath, ...includePaths];
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

function* getPossibleRequests(request: string): Generator<string> {
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

  const sassExports = sassModuleSystem.requireModule(sassURL) as {
    load: SassLoadFn;
  };
  const load = sassExports.load ?? globalForSass._cliPkgExports?.[0]?.load;
  const sassLib = {} as unknown as typeof import("sass");
  load({ util: { inspect: {} }, immutable }, sassLib);
  return "info" in sassLib ? sassLib : (sassExports as unknown as typeof import("sass"));
}
