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

export interface IDependencyResolverOptions {
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
}: IDependencyResolverOptions): ModuleGraphResolver {
  const analyzeAndResolve = async (filePath: string): Promise<[string, ModuleGraphNode]> => {
    const { compiledContents, requests } = await analyzeModule(filePath);
    const resolvedRequests: ResolvedRequests = new Map();

    for (const request of requests) {
      if (resolvedRequests.has(request)) {
        continue; // already resolved this request
      }
      const resolvedRequest = await resolveRequest(filePath, request);
      resolvedRequests.set(request, resolvedRequest);
    }
    return [filePath, { compiledContents, resolvedRequests }];
  };

  return async (entryFilePaths) => {
    const moduleGraph = new Map<string, ModuleGraphNode>();

    entryFilePaths = Array.isArray(entryFilePaths) ? entryFilePaths : [entryFilePaths];
    const workInProgress = new Map<string, Promise<[string, ModuleGraphNode]>>(
      entryFilePaths.map((filePath) => [filePath, analyzeAndResolve(filePath)]),
    );

    while (workInProgress.size > 0) {
      const [filePath, graphNode] = await Promise.race(workInProgress.values());
      workInProgress.delete(filePath);
      moduleGraph.set(filePath, graphNode);
      for (const resolvedFilePath of graphNode.resolvedRequests.values()) {
        if (
          typeof resolvedFilePath === "string" &&
          !moduleGraph.has(resolvedFilePath) &&
          !workInProgress.has(resolvedFilePath)
        ) {
          workInProgress.set(resolvedFilePath, analyzeAndResolve(resolvedFilePath));
        }
      }
    }

    return moduleGraph;
  };
}
