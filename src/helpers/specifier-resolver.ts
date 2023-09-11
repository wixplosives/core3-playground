import path from "@file-services/path";
import type { PackageJson } from "type-fest";
import { pathChainToRoot } from "../fs/async-fs-operations";
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
   * Package export conditions to try resolving the specifier with.
   *
   * @default ['browser', 'import', 'require']
   * @see https://nodejs.org/api/packages.html#conditional-exports
   */
  conditions?: string[];

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
}

export interface IResolvedPackageJson {
  filePath: string;
  directoryPath: string;
  name?: string | undefined;
  main?: string | undefined;
  module?: string | undefined;
  browser?: string | undefined;
  mainPath?: string | undefined;
  browserMappings?:
    | {
        [from: string]: string | false;
      }
    | undefined;
  exports?: PackageJson.ExportConditions | undefined;
  hasPatternExports?: boolean | undefined;
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

const defaultPackageRoots = ["node_modules"];
const defaultExtensions = [".js", ".json"];
const defaultConditions = ["browser", "import", "require"];
const isRelative = (specifier: string) =>
  specifier === "." || specifier === ".." || specifier.startsWith("./") || specifier.startsWith("../");
const PACKAGE_JSON = "package.json";

export function createAsyncSpecifierResolver(options: IAsyncSpecifierResolverOptions): AsyncSpecifierResolver {
  const {
    fs: { fileExists, directoryExists, readFile, realpath },
    packageRoots = defaultPackageRoots,
    extensions = defaultExtensions,
    conditions = defaultConditions,
    resolvedPacakgesCache = new Map<string, Promise<IResolvedPackageJson | undefined>>(),
    alias = {},
    fallback = {},
  } = options;
  const { dirname, join, resolve, isAbsolute } = path;

  const exportConditions = new Set(conditions);
  const targetsBrowser = exportConditions.has("browser");
  const targetsEsm = exportConditions.has("import");

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
        if (targetsBrowser) {
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

    if (!emittedCandidate && targetsBrowser && !isRelative(specifier)) {
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

      if (targetsBrowser && resolvedPackageJson.browser !== undefined) {
        yield* fileOrDirIndexSpecifierPaths(join(directoryPath, resolvedPackageJson.browser));
      }
      if (targetsEsm && resolvedPackageJson.module !== undefined) {
        yield* fileOrDirIndexSpecifierPaths(join(directoryPath, resolvedPackageJson.module));
      }
      if (resolvedPackageJson.main !== undefined) {
        yield* fileOrDirIndexSpecifierPaths(join(directoryPath, resolvedPackageJson.main));
      }
    }

    yield* fileSpecifierPaths(join(directoryPath, "index"));
  }

  async function* packageSpecifierPaths(initialPath: string, specifier: string, visitedPaths: Set<string>) {
    const [packageName, innerPath] = parsePackageSpecifier(specifier);
    if (!packageName.length || (packageName.startsWith("@") && !packageName.includes("/"))) {
      return;
    }

    const ownPackageJson = await findUpPackageJson(initialPath);
    if (ownPackageJson !== undefined) {
      visitedPaths.add(ownPackageJson.filePath);
      if (ownPackageJson.name === packageName) {
        if (ownPackageJson.exports !== undefined) {
          yield* matchExportsField(
            ownPackageJson.directoryPath,
            ownPackageJson.exports,
            innerPath,
            ownPackageJson.hasPatternExports,
          );
          return;
        }
      }
    }

    for (const packagesPath of packageRootsToPaths(initialPath)) {
      if (!(await directoryExists(packagesPath))) {
        continue;
      }
      const packageDirectoryPath = join(packagesPath, packageName);
      const resolvedPackageJson = await loadPackageJsonFromCached(packageDirectoryPath);
      if (resolvedPackageJson !== undefined) {
        visitedPaths.add(resolvedPackageJson.filePath);
      }
      if (resolvedPackageJson?.exports !== undefined) {
        yield* matchExportsField(
          packageDirectoryPath,
          resolvedPackageJson.exports,
          innerPath,
          resolvedPackageJson.hasPatternExports,
        );
        return;
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
    const { main: mainField, module: moduleField, browser: browserField } = packageJson;

    let browserMappings: Record<string, string | false> | undefined = undefined;
    if (targetsBrowser && typeof browserField === "object" && browserField !== null) {
      browserMappings = Object.create(null) as Record<string, string | false>;
      for (const [from, to] of Object.entries(browserField)) {
        const resolvedFrom = isRelative(from) ? await resolveRelative(join(directoryPath, from)) : from;
        if (resolvedFrom && to !== undefined) {
          const resolvedTo = await resolveRemappedSpecifier(directoryPath, to);
          if (resolvedTo !== undefined) {
            browserMappings[resolvedFrom] = resolvedTo;
          }
        }
      }
    }

    const [desugerifiedExports, hasPatternExports] = desugarifyExportsField(packageJson.exports);

    return {
      name: packageJson.name,
      filePath: packageJsonPath,
      directoryPath,
      main: typeof mainField === "string" ? mainField : undefined,
      module: typeof moduleField === "string" ? moduleField : undefined,
      browser: typeof browserField === "string" ? browserField : undefined,
      browserMappings,
      exports: desugerifiedExports,
      hasPatternExports,
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

  async function readJsonFileSafe(filePath: string): Promise<unknown> {
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as unknown;
    } catch {
      return undefined;
    }
  }

  function* matchExportsField(
    contextPath: string,
    packageJsonExports: PackageJson.ExportConditions,
    innerPath: string,
    hasPatternExports?: boolean,
  ) {
    const exactMatchExports = packageJsonExports[innerPath];
    if (exactMatchExports !== undefined) {
      for (const exactMatchValue of matchExportConditions(exactMatchExports, exportConditions)) {
        if (exactMatchValue === null) {
          break;
        }
        yield join(contextPath, exactMatchValue);
      }
    } else if (hasPatternExports) {
      for (const matchedPattern of matchSubpathPatterns(packageJsonExports, innerPath, exportConditions)) {
        yield join(contextPath, matchedPattern);
      }
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
    const key = `${contextPath}${path.delimiter}${specifier}`;
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

/**
 * Parse a package specifier into a tuple of package name and path in package.
 * Handles both scoped and non-scoped package specifiers and returns a default path of '.' if no path is specified.
 *
 * @param specifier - The package specifier to parse.
 * @example parsePackageSpecifier('react-dom') === ['react-dom', "."]
 * @example parsePackageSpecifier('react-dom/client') === ['react-dom', './client']
 * @example parsePackageSpecifier('@stylable/core') === ['@stylable/core', "./core"]
 * @example parsePackageSpecifier('@stylable/core/dist/some-file') === ['@stylable/core', './dist/some-file']
 */
function parsePackageSpecifier(specifier: string): readonly [packageName: string, pathInPackage: string] {
  const firstSlashIdx = specifier.indexOf("/");
  if (firstSlashIdx === -1) {
    return [specifier, "."];
  }
  const isScopedPackage = specifier.startsWith("@");
  if (isScopedPackage) {
    const secondSlashIdx = specifier.indexOf("/", firstSlashIdx + 1);
    return secondSlashIdx === -1
      ? [specifier, "."]
      : [specifier.slice(0, secondSlashIdx), "." + specifier.slice(secondSlashIdx)];
  } else {
    return [specifier.slice(0, firstSlashIdx), "." + specifier.slice(firstSlashIdx)];
  }
}

/**
 * Desugarify the `exports` field of a package.json file.
 *
 * If `exports` is a string or an array, it is converted to an object with a single key of `'.'`.
 * If `exports` is already an object and has a key of `'.'` or starts with `'./'`, it is returned as is.
 * Otherwise, `exports` is wrapped in an object with a single key of `'.'`.
 *
 * @param packageExports - The `exports` field of a package.json file.
 * @returns tuple containing the desugarified `exports` field, with a flag saying whether it includes pattern exports.
 */
function desugarifyExportsField(
  packageExports: PackageJson.Exports | undefined,
): [PackageJson.ExportConditions | undefined, boolean] {
  let hasPatternExports = false;
  if (packageExports === undefined || packageExports === null) {
    packageExports = undefined;
  } else if (typeof packageExports === "string" || Array.isArray(packageExports)) {
    packageExports = { ".": packageExports };
  } else {
    for (const key of Object.keys(packageExports)) {
      if (key.includes("*")) {
        hasPatternExports = true;
      }
      if (key !== "." && !key.startsWith("./")) {
        packageExports = { ".": packageExports };
        hasPatternExports = false;
        break;
      }
    }
  }
  return [packageExports, hasPatternExports];
}

function* matchExportConditions(
  conditionValue: PackageJson.Exports,
  exportConditions: Set<string>,
): Generator<string | null> {
  if (conditionValue === null || typeof conditionValue === "string") {
    yield conditionValue;
  } else if (typeof conditionValue === "object") {
    if (Array.isArray(conditionValue)) {
      for (const arrayItem of conditionValue) {
        yield* matchExportConditions(arrayItem, exportConditions);
      }
    } else {
      for (const [key, value] of Object.entries(conditionValue)) {
        if (key === "default" || exportConditions.has(key)) {
          yield* matchExportConditions(value, exportConditions);
        }
      }
    }
  }
}

function* matchSubpathPatterns(
  exportedSubpaths: PackageJson.ExportConditions,
  innerPath: string,
  exportConditions: Set<string>,
): Generator<string, void, undefined> {
  const matchedValues: string[] = [];
  for (const [patternKey, patternValue] of Object.entries(exportedSubpaths)) {
    const keyStarIdx = patternKey.indexOf("*");
    if (keyStarIdx === -1 || patternKey.indexOf("*", keyStarIdx + 1) !== -1) {
      continue;
    }
    const keyPrefix = patternKey.slice(0, keyStarIdx);
    if (!innerPath.startsWith(keyPrefix)) {
      continue;
    }
    const keySuffix = patternKey.slice(keyStarIdx + 1);
    if (keySuffix && !innerPath.endsWith(keySuffix)) {
      continue;
    }

    for (const valueToMatch of matchExportConditions(patternValue, exportConditions)) {
      if (valueToMatch === null) {
        return;
      }
      const innerPathStarValue = innerPath.slice(keyPrefix.length, innerPath.length - keySuffix.length);
      const valueStarIdx = valueToMatch.indexOf("*");
      if (valueStarIdx === -1 || valueToMatch.indexOf("*", valueStarIdx + 1) !== -1) {
        continue;
      }
      const valuePrefix = valueToMatch.slice(0, valueStarIdx);
      const valueSuffix = valueToMatch.slice(valueStarIdx + 1);
      matchedValues.push(valuePrefix + innerPathStarValue + valueSuffix);
    }
  }
  yield* matchedValues;
}
