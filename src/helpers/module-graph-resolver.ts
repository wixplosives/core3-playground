/**
 * Extracts and resolves dependency requests of one or more assets, shallow or deep.
 *
 * @param assetKey unique key(s) of asset(s) to resolve dependency requests for.
 * @param deep should process follow resolved requests, and resolve these assets as well (defaults to `false`).
 * @returns record containing asset keys as fields, and their resolved dependecy requests as values.
 */
export type DependencyResolver = (assetKey: string | string[]) => Promise<ModuleGraph>;

export type ModuleGraph = Map<string, ModuleGraphNode>;
export type ModuleGraphNode = { compiledContents: string; resolvedRequests: ResolvedRequests };

/**
 * Map containing requests as fields, and their resolutions as values.
 * `undefined` is used when a request couldn't be resolved.
 */
export type ResolvedRequests = Map<string, SpecifierResolution>;

export type SpecifierResolution = string | false | undefined;

export interface AnalyzedModule {
  compiledContents: string;
  requests: string[];
}

export interface IDependencyResolverOptions {
  /**
   * Extracts a dependency requests list of an asset.
   *
   * @param assetKey unique identifier for an asset to extract from.
   * @returns list of dependency requests by the asset.
   */
  analyzeModule(filePath: string): Promise<AnalyzedModule>;

  /**
   * Resolve a dependency request by an asset.
   *
   * @param assetKey unique identifier of the requesting asset.
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
}: IDependencyResolverOptions): DependencyResolver {
  return async (assetKey) => {
    const resolvedAssets = new Map<string, ModuleGraphNode>();
    const assetsToResolve: string[] = Array.isArray(assetKey) ? [...assetKey] : [assetKey];

    while (assetsToResolve.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const currentAsset = assetsToResolve.shift()!;

      if (resolvedAssets.has(currentAsset)) {
        continue;
      }

      const { compiledContents, requests } = await analyzeModule(currentAsset);
      const resolvedRequests: ResolvedRequests = new Map();
      resolvedAssets.set(currentAsset, { compiledContents, resolvedRequests });

      for (const request of requests) {
        if (resolvedRequests.has(request)) {
          continue; // already resolved this request
        }

        const resolvedRequest = await resolveRequest(currentAsset, request);
        resolvedRequests.set(request, resolvedRequest);
        if (resolvedRequest !== undefined && resolvedRequest !== false) {
          assetsToResolve.push(resolvedRequest);
        }
      }
    }

    return resolvedAssets;
  };
}
