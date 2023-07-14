export interface ICommonJsModuleSystem {
  /**
   * Map of file path to a loaded module.
   */
  requireCache: Map<string, IModule>;

  /**
   * Exposed to modules as globals.
   */
  globals: Record<string, unknown>;

  /**
   * Require a module using an absolute file path.
   */
  requireModule: (moduleId: string | false) => unknown;

  /**
   * Require a module from some context (directory path).
   */
  requireFrom: (contextPath: string, request: string) => unknown;

  /**
   * Resolve a module request from some context (directory path).
   *
   * @returns
   * `string` - absolute path to resolved file.
   * `false` - request should receive an empty object during runtime (mapped by `"browser"` field in `package.json`).
   * `undefined` - couldn't resolve request.
   */
  resolveFrom: (contextPath: string, request: string, requestOrigin?: string) => string | false | undefined;
}

export interface IModule {
  /**
   * Absolute path to module's source file.
   */
  id: string;

  /**
   * Absolute path to module's source file.
   */
  filename: string;

  /**
   * Exported values of module.
   */
  exports: unknown;

  /**
   * Modules requested by this module via `require`
   */
  children: IModule[];
}

export type LoadModule = (modulePath: string) => IModule;

export interface IBaseModuleSystemOptions {
  /**
   * Exposed to modules as globals.
   */
  globals?: Record<string, unknown> | undefined;

  /**
   * @returns textual contents of `filePath`.
   * @throws if file doesn't exist or other error.
   */
  readFileSync(filePath: string): string;

  /**
   * @returns parent directory of provided `path`.
   */
  dirname(path: string): string;

  /**
   * Resolve a module request from some context (directory path).
   *
   * @returns
   * `string` - absolute path to resolved file.
   * `false` - request should receive an empty object during runtime (mapped by `"browser"` field in `package.json`).
   * `undefined` - couldn't resolve request.
   */
  resolveFrom(contextPath: string, request: string, requestOrigin?: string): string | false | undefined;
  /**
   * Hook into file module evaluation.
   */
  loadModuleHook?: ((loadModule: LoadModule) => LoadModule) | undefined;
}

const falseModule = {
  get exports() {
    return {};
  },
  filename: "",
  id: "",
  children: [],
};

const markedErrorSymbol = Symbol("markedError");

export function createBaseCjsModuleSystem(options: IBaseModuleSystemOptions): ICommonJsModuleSystem {
  const { resolveFrom, dirname, readFileSync, globals = {}, loadModuleHook } = options;
  const requireCache = new Map<string, IModule>();

  const load = loadModuleHook ? loadModuleHook(loadModule) : loadModule;

  return {
    requireModule(filePath) {
      if (filePath === false) {
        return {};
      }
      const fileModule = requireCache.get(filePath) ?? load(filePath);
      return fileModule.exports;
    },
    requireFrom(contextPath, request) {
      return loadFrom(contextPath, request).exports;
    },
    resolveFrom,
    requireCache,
    globals,
  };

  function resolveThrow(contextPath: string, request: string, requestOrigin?: string): string | false {
    const resolvedRequest = resolveFrom(contextPath, request, requestOrigin);
    if (resolvedRequest === undefined) {
      throw new Error(`Cannot resolve "${request}" in ${requestOrigin || contextPath}`);
    }
    return resolvedRequest;
  }

  function loadFrom(contextPath: string, request: string, requestOrigin?: string): IModule {
    const existingRequestModule = requireCache.get(request);
    if (existingRequestModule) {
      return existingRequestModule;
    }
    const resolvedPath = resolveThrow(contextPath, request, requestOrigin);
    if (resolvedPath === false) {
      return falseModule;
    }
    return requireCache.get(resolvedPath) ?? load(resolvedPath);
  }

  function loadModule(filePath: string): IModule {
    const newModule: IModule = { exports: {}, filename: filePath, id: filePath, children: [] };

    const contextPath = dirname(filePath);
    const fileContents = readFileSync(filePath);

    if (filePath.endsWith(".json")) {
      newModule.exports = JSON.parse(fileContents);
      requireCache.set(filePath, newModule);
      return newModule;
    }
    const localRequire = (request: string) => {
      const childModule = loadFrom(contextPath, request, filePath);
      if (childModule !== falseModule && !newModule.children.includes(childModule)) {
        newModule.children.push(childModule);
      }
      return childModule.exports;
    };
    localRequire.resolve = (request: string) => resolveThrow(contextPath, request, filePath);

    const moduleBuiltins = {
      module: newModule,
      exports: newModule.exports,
      __filename: filePath,
      __dirname: contextPath,
      require: localRequire,
    };

    const injectedGlobals = {
      global: globalThis,
      ...globals,
    };

    const fnArgs = Object.keys(moduleBuiltins).join(", ");
    const globalsArgs = Object.keys(injectedGlobals).join(", ");

    const globalFn = (0, eval)(`(function (${globalsArgs}){ return (function (${fnArgs}){${fileContents}\n}); })`) as (
      ...args: unknown[]
    ) => (...args: unknown[]) => void;

    requireCache.set(filePath, newModule);

    try {
      const moduleFn = globalFn(...Object.values(injectedGlobals));
      moduleFn(...Object.values(moduleBuiltins));
    } catch (e) {
      requireCache.delete(filePath);
      if (e instanceof Error && !(markedErrorSymbol in e)) {
        e.message = `Failed evaluating ${filePath}: ${e.message}`;
        (e as Error & { [markedErrorSymbol]: boolean })[markedErrorSymbol] = true;
      }
      throw e;
    }

    return newModule;
  }
}