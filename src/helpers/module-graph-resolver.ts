/**
 * Extracts and resolves dependency requests of one or more assets, shallow or deep.
 * @param filePath file to resolve dependency requests for.
 */
export type ModuleGraphResolver = (entryFilePaths: string | string[]) => Promise<ModuleGraph>;

/**
 * Map containing file paths as keys, alongside their compiled contents and resolved dependecy requests.
 */
export type ModuleGraph = Map<string, ModuleGraphNode>;
export type ModuleGraphNode = { compiledContents: string; resolvedRequests: ResolvedRequests };

/**
 * Map containing requests as fields, and their resolutions as values.
 */
export type ResolvedRequests = Map<string, SpecifierResolution>;

/**
 * - `string` for a resolved file path
 * - `false` should map to an empty object in runtime
 * - `undefined` couldn't be resolved
 */
export type SpecifierResolution = string | false | undefined;

export interface AnalyzedModule {
  compiledContents: string;
  requests: string[];
}

export interface ModuleGraphResolverOptions {
  /**
   * Extracts a dependency requests list of an asset.
   *
   * @param filePath unique identifier for an asset to extract from.
   * @returns list of dependency requests by the asset.
   */
  analyzeModule(filePath: string): Promise<AnalyzedModule>;

  /**
   * Resolve a dependency request by an asset.
   *
   * @param filePath unique identifier of the requesting asset.
   * @returns unique key for the asset the request resolves to.
   */
  resolveRequest: (filePath: string, request: string) => SpecifierResolution | Promise<SpecifierResolution>;
}

/**
 * Create a dependency resolver by providing a callback to extract requests,
 * and another callbck to resolve such requests.
 */
export function createModuleGraphResolver({
  analyzeModule,
  resolveRequest,
}: ModuleGraphResolverOptions): ModuleGraphResolver {
  return async (entryFilePaths) => {
    const moduleGraph = new Map<string, ModuleGraphNode>();
    const workInProgress = new Map<string, Promise<[string, ModuleGraphNode]>>();

    entryFilePaths = Array.isArray(entryFilePaths) ? entryFilePaths : [entryFilePaths];
    for (const entryFilePath of entryFilePaths) {
      workInProgress.set(
        entryFilePath,
        analyzeAndResolve(entryFilePath, analyzeModule, resolveRequest, moduleGraph, workInProgress),
      );
    }
    while (workInProgress.size) {
      const [filePath, graphNode] = await Promise.race(workInProgress.values());
      workInProgress.delete(filePath);
      moduleGraph.set(filePath, graphNode);
    }

    return moduleGraph;
  };
}

async function analyzeAndResolve(
  filePath: string,
  analyzeModule: ModuleGraphResolverOptions["analyzeModule"],
  resolveRequest: ModuleGraphResolverOptions["resolveRequest"],
  moduleGraph: ModuleGraph,
  workInProgress: Map<string, Promise<[string, ModuleGraphNode]>>,
): Promise<[string, ModuleGraphNode]> {
  const { compiledContents, requests } = await analyzeModule(filePath);
  const resolvedRequests: ResolvedRequests = new Map();

  for (const request of requests) {
    if (resolvedRequests.has(request)) {
      continue;
    }
    const resolvedRequest = await resolveRequest(filePath, request);
    resolvedRequests.set(request, resolvedRequest);
    if (
      typeof resolvedRequest === "string" &&
      !moduleGraph.has(resolvedRequest) &&
      !workInProgress.has(resolvedRequest)
    ) {
      workInProgress.set(
        resolvedRequest,
        analyzeAndResolve(resolvedRequest, analyzeModule, resolveRequest, moduleGraph, workInProgress),
      );
    }
  }
  return [filePath, { compiledContents, resolvedRequests }];
}
