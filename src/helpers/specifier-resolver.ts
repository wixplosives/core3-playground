import path from "@file-services/path";
import type { PackageJson } from "type-fest";
import type { BrowserFileSystem } from "../fs/browser-file-system";

/**
 * Required fs APIs for specifier resolution.
 * Currently a subset of the async file system API.
 */
export interface IAsyncResolutionFileSystem {
  fileExists(path: string): Promise<boolean>;
  directoryExists(path: string): Promise<boolean>;
  readFile(path: string, encoding: "utf8"): Promise<string>;
  realpath(path: string): Promise<string>;
}

export interface IAsyncSpecifierResolverOptions {
  /**
   * File system to use when resolving specifiers.
   */
  fs: IAsyncResolutionFileSystem;

  /**
   * Folders to use when searching for packages.
   *
   * @default ['node_modules']
   */
  packageRoots?: string[] | undefined;

  /**
   * File extensions to try resolving the specifier with.
   *
   * @default ['.js', '.json']
   */
  extensions?: string[] | undefined;

  /**
   * Whether to prefer the 'browser' field or 'main' field
   * in `package.json`.
   */
  target?: "node" | "browser" | undefined;

  /**
   * Cache for resolved packages. Map keys are directoryPaths.
   * If not provided, resolver will create an internal Map (still caches).
   */
  resolvedPacakgesCache?: Map<string, Promise<IResolvedPackageJson | undefined>> | undefined;

  /**
   * Aliases for package specifiers.
   * Record key is the specifier to be mapped, value is the new target.
   * Alias is attempted before original specifier.
   */
  alias?: Record<string, string | false> | undefined;

  /**
   * Fallback for package specifiers.
   * Record key is the specifier to be mapped, value is the new target.
   * Original specifier is attempted before fallback.
   */
  fallback?: Record<string, string | false> | undefined;

  /**
   * Support the "module" field. Picked up over "main".
   *
   * @default true when "target" is set to "browser"
   */
  moduleField?: boolean | undefined;
}

export interface IResolvedPackageJson {
  filePath: string;
  directoryPath: string;
  mainPath?: string | undefined;
  browserMappings?:
    | {
        [from: string]: string | false;
      }
    | undefined;
}

/**
 * Resolves specifiers across modules, using the node resolution algorithm.
 *
 * @param contextPath directory in which the specifier is being made
 * @param specifier actual specifier, relative or absolute
 */
export type AsyncSpecifierResolver = (contextPath: string, specifier: string) => Promise<IResolutionOutput>;

export interface IResolutionOutput {
  /**
   * `string` - absolute path to resolved file.
   * `false` - specifier should receive an empty object during runtime (mapped by `"browser"` field in `package.json`).
   * `undefined` - couldn't resolve specifier.
   */
  resolvedFile?: string | false | undefined;

  /**
   * When an internal package specifier is re-mapped to `false`, this will point to the original
   * filePath this specifier pointed to.
   */
  originalFilePath?: string | undefined;

  /**
   * All paths resolver visited before getting to `resolvedFile`.
   */
  visitedPaths: Set<string>;
}

const defaultTarget = "browser";
const defaultPackageRoots = ["node_modules"];
const defaultExtensions = [".js", ".json"];
const isRelative = (specifier: string) =>
  specifier === "." || specifier === ".." || specifier.startsWith("./") || specifier.startsWith("../");
const PACKAGE_JSON = "package.json";

export function createAsyncSpecifierResolver(options: IAsyncSpecifierResolverOptions): AsyncSpecifierResolver {
  const {
    fs: { fileExists, directoryExists, readFile, realpath },
    packageRoots = defaultPackageRoots,
    extensions = defaultExtensions,
    target = defaultTarget,
    moduleField = target === "browser",
    resolvedPacakgesCache = new Map<string, Promise<IResolvedPackageJson | undefined>>(),
    alias = {},
    fallback = {},
  } = options;
  const { dirname, join, resolve, isAbsolute } = path;

  const loadPackageJsonFromCached = wrapWithCache(loadPackageJsonFrom, resolvedPacakgesCache);
  const remapUsingAlias = createSpecifierRemapper(alias);
  const remapUsingFallback = createSpecifierRemapper(fallback);

  return specifierResolver;

  async function specifierResolver(contextPath: string, originalSpecifier: string): Promise<IResolutionOutput> {
    const visitedPaths = new Set<string>();
    for await (const specifier of specifiersToTry(contextPath, originalSpecifier, visitedPaths)) {
      if (specifier === false) {
        return { resolvedFile: specifier, visitedPaths };
      }

      for await (const resolvedFilePath of nodeSpecifierPaths(contextPath, specifier, visitedPaths)) {
        visitedPaths.add(resolvedFilePath);
        if (!(await fileExists(resolvedFilePath))) {
          continue;
        }
        if (target === "browser") {
          const toPackageJson = await findUpPackageJson(dirname(resolvedFilePath));
          if (toPackageJson) {
            visitedPaths.add(toPackageJson.filePath);
            const remappedFilePath = toPackageJson.browserMappings?.[resolvedFilePath];
            if (remappedFilePath !== undefined) {
              if (remappedFilePath !== false) {
                visitedPaths.add(remappedFilePath);
              }
              return {
                resolvedFile: remappedFilePath,
                originalFilePath: resolvedFilePath,
                visitedPaths,
              };
            }
          }
        }
        const realResolvedFilePath = await realpathSafe(resolvedFilePath);
        visitedPaths.add(realResolvedFilePath);
        return { resolvedFile: realResolvedFilePath, visitedPaths };
      }
    }

    return { resolvedFile: undefined, visitedPaths };
  }

  async function* specifiersToTry(contextPath: string, specifier: string, visitedPaths: Set<string>) {
    const specifierAlias = remapUsingAlias(specifier);
    let emittedCandidate = false;
    if (specifierAlias !== undefined) {
      emittedCandidate = true;
      yield specifierAlias;
    }

    if (!emittedCandidate && target === "browser") {
      const fromPackageJson = await findUpPackageJson(contextPath);
      if (fromPackageJson) {
        visitedPaths.add(fromPackageJson.filePath);
        const remappedSpecifier = fromPackageJson.browserMappings?.[specifier];
        if (remappedSpecifier !== undefined) {
          emittedCandidate = true;
          yield remappedSpecifier;
        }
      }
    }

    if (!emittedCandidate) {
      yield specifier;
    }
    const specifierFallback = remapUsingFallback(specifier);
    if (specifierFallback !== undefined) {
      yield specifierFallback;
    }
  }

  async function* nodeSpecifierPaths(contextPath: string, specifier: string, visitedPaths: Set<string>) {
    if (isRelative(specifier) || isAbsolute(specifier)) {
      const specifierPath = resolve(contextPath, specifier);
      yield* fileSpecifierPaths(specifierPath);
      yield* directorySpecifierPaths(specifierPath, visitedPaths);
    } else {
      yield* packageSpecifierPaths(contextPath, specifier, visitedPaths);
    }
  }

  /**
   * /path/to/target
   * /path/to/target.js
   * /path/to/target.json
   */
  function* fileSpecifierPaths(filePath: string) {
    yield filePath;
    for (const ext of extensions) {
      yield filePath + ext;
    }
  }

  /**
   * /path/to/target (+ext)
   * /path/to/target/index (+ext)
   */
  function* fileOrDirIndexSpecifierPaths(targetPath: string) {
    yield* fileSpecifierPaths(targetPath);
    yield* fileSpecifierPaths(join(targetPath, "index"));
  }

  async function* directorySpecifierPaths(directoryPath: string, visitedPaths: Set<string>) {
    if (!(await directoryExists(directoryPath))) {
      return;
    }
    const resolvedPackageJson = await loadPackageJsonFromCached(directoryPath);
    if (resolvedPackageJson !== undefined) {
      visitedPaths.add(resolvedPackageJson.filePath);
    }
    const mainPath = resolvedPackageJson?.mainPath;

    if (mainPath !== undefined) {
      yield* fileOrDirIndexSpecifierPaths(join(directoryPath, mainPath));
    } else {
      yield* fileSpecifierPaths(join(directoryPath, "index"));
    }
  }

  async function* packageSpecifierPaths(initialPath: string, specifier: string, visitedPaths: Set<string>) {
    for (const packagesPath of packageRootsToPaths(initialPath)) {
      if (!(await directoryExists(packagesPath))) {
        continue;
      }
      const specifierInPackages = join(packagesPath, specifier);
      yield* fileSpecifierPaths(specifierInPackages);
      yield* directorySpecifierPaths(specifierInPackages, visitedPaths);
    }
  }

  function* packageRootsToPaths(initialPath: string) {
    for (const packageRoot of packageRoots) {
      for (const directoryPath of pathChainToRoot(initialPath)) {
        yield join(directoryPath, packageRoot);
      }
    }
  }

  async function findUpPackageJson(initialPath: string): Promise<IResolvedPackageJson | undefined> {
    for (const directoryPath of pathChainToRoot(initialPath)) {
      const resolvedPackageJson = await loadPackageJsonFromCached(directoryPath);
      if (resolvedPackageJson) {
        return resolvedPackageJson;
      }
    }
    return undefined;
  }

  async function loadPackageJsonFrom(directoryPath: string): Promise<IResolvedPackageJson | undefined> {
    const packageJsonPath = join(directoryPath, PACKAGE_JSON);
    const packageJson = (await readJsonFileSafe(packageJsonPath)) as PackageJson | null | undefined;
    if (typeof packageJson !== "object" || packageJson === null) {
      return undefined;
    }
    const mainPath = packageJsonTarget(packageJson);

    const { browser } = packageJson;
    let browserMappings: Record<string, string | false> | undefined = undefined;
    if (target === "browser" && typeof browser === "object" && browser !== null) {
      browserMappings = Object.create(null) as Record<string, string | false>;
      for (const [from, to] of Object.entries(browser)) {
        const resolvedFrom = isRelative(from) ? await resolveRelative(join(directoryPath, from)) : from;
        if (resolvedFrom && to !== undefined) {
          const resolvedTo = await resolveRemappedSpecifier(directoryPath, to);
          if (resolvedTo !== undefined) {
            browserMappings[resolvedFrom] = resolvedTo;
          }
        }
      }
    }

    return {
      filePath: packageJsonPath,
      directoryPath,
      mainPath,
      browserMappings,
    };
  }

  async function resolveRemappedSpecifier(
    directoryPath: string,
    to: string | false,
  ): Promise<string | false | undefined> {
    if (to === false) {
      return to;
    } else if (typeof to === "string") {
      if (isRelative(to)) {
        return resolveRelative(join(directoryPath, to));
      } else {
        return to;
      }
    }
    return undefined;
  }

  async function resolveRelative(specifier: string) {
    for (const filePath of fileOrDirIndexSpecifierPaths(specifier)) {
      if (await fileExists(filePath)) {
        return realpathSafe(filePath);
      }
    }
    return undefined;
  }

  async function realpathSafe(itemPath: string): Promise<string> {
    try {
      return await realpath(itemPath);
    } catch {
      return itemPath;
    }
  }

  function packageJsonTarget({ main, browser, module: moduleFieldValue }: PackageJson): string | undefined {
    if (target === "browser" && typeof browser === "string") {
      return browser;
    } else if (moduleField && typeof moduleFieldValue === "string") {
      return moduleFieldValue;
    }
    return typeof main === "string" ? main : undefined;
  }

  function* pathChainToRoot(currentPath: string) {
    let lastPath: string | undefined;
    while (lastPath !== currentPath) {
      yield currentPath;
      lastPath = currentPath;
      currentPath = dirname(currentPath);
    }
  }

  async function readJsonFileSafe(filePath: string): Promise<unknown> {
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as unknown;
    } catch {
      return undefined;
    }
  }
}

function wrapWithCache<K, T>(fn: (key: K) => T, cache = new Map<K, T>()): (key: K) => T {
  return (key: K) => {
    if (cache.has(key)) {
      return cache.get(key) as T;
    } else {
      const result = fn(key);
      cache.set(key, result);
      return result;
    }
  };
}

type ParsedTemplate = { prefix: string };

/**
 * Create a function that accepts a string and returns T | undefined.
 * The remapper supports paths ending with "/*", both in key and value.
 */
export function createSpecifierRemapper<T extends string | false>(
  mapping: Record<string, T>,
): (specifier: string) => T | undefined {
  const parsedTemplateMap = new Map<string | ParsedTemplate, T | ParsedTemplate>();
  let hasTemplate = false;
  for (const [key, value] of Object.entries(mapping)) {
    let parsedKey: string | ParsedTemplate = key;
    let parsedValue: T | ParsedTemplate = value;
    if (key.endsWith("/*")) {
      hasTemplate = true;
      parsedKey = { prefix: key.slice(0, -1) };
      if (typeof value === "string" && value.endsWith("/*")) {
        parsedValue = { prefix: value.slice(0, -1) };
      }
    }
    parsedTemplateMap.set(parsedKey, parsedValue);
  }

  return hasTemplate
    ? (specifier) => getFromParsedTemplateMap(parsedTemplateMap, specifier)
    : (specifier) => parsedTemplateMap.get(specifier) as T | undefined;
}

function getFromParsedTemplateMap<T extends string | false>(
  map: Map<string | ParsedTemplate, T | ParsedTemplate>,
  specifier: string,
): T | undefined {
  for (const [key, value] of map) {
    const keyType = typeof key;
    if (keyType === "string") {
      if (specifier === key) {
        return value as T;
      }
    } else if (keyType === "object") {
      const { prefix: keyPrefix } = key as ParsedTemplate;
      if (specifier.startsWith(keyPrefix) && specifier.length > keyPrefix.length) {
        return typeof value === "object" ? ((value.prefix + specifier.slice(keyPrefix.length)) as T) : value;
      }
    }
  }
  return undefined;
}

export const AsyncSpecifierResolverCache = Map<string, Promise<IResolutionOutput>>;

export function createCachedResolver(
  resolver: AsyncSpecifierResolver,
  cache = new AsyncSpecifierResolverCache(),
): AsyncSpecifierResolver {
  return (contextPath, specifier) => {
    const key = `${contextPath}${path.sep}${specifier}`;
    const cachedResolution = cache.get(key);
    if (cachedResolution) {
      return cachedResolution;
    } else {
      const result = resolver(contextPath, specifier);
      cache.set(key, result);
      return result;
    }
  };
}

export function createResolutionFs(fs: BrowserFileSystem): IAsyncResolutionFileSystem {
  return {
    fileExists: fs.fileExists,
    directoryExists: fs.directoryExists,
    realpath(filePath) {
      return Promise.resolve(filePath);
    },
    readFile(filePath) {
      return fs.readTextFile(filePath);
    },
  };
}
