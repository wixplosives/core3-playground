import path from "@file-services/path";
import {
  createAsyncSpecifierResolver,
  type AsyncSpecifierResolver,
  type IAsyncSpecifierResolverOptions,
} from "./specifier-resolver";

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
