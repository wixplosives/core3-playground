export interface ICommonJsModuleSystem {
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

  /**
   * Map of file path to a loaded module.
   */
  moduleCache: Map<string, IModule>;

  /**
   * Exposed to modules as globals.
   */
  globals: Record<string, unknown>;
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
}

export function createBaseCjsModuleSystem(options: IBaseModuleSystemOptions): ICommonJsModuleSystem {
  const { resolveFrom, dirname, readFileSync, globals = {} } = options;
  const moduleCache = new Map<string, IModule>();
  const seenErrors = new WeakSet<Error>();
  const evaluationErrorPrefix = "Failed evaluating: ";
  const falseModule = {
    get exports() {
      return {};
    },
    filename: "",
    id: "",
    children: [],
  };

  return {
    requireModule(filePath) {
      if (filePath === false) {
        return {};
      }
      const fileModule = moduleCache.get(filePath) ?? loadModuleSync(filePath);
      return fileModule.exports;
    },
    requireFrom(contextPath, request) {
      return loadFromSync(contextPath, request).exports;
    },
    resolveFrom,
    moduleCache,
    globals,
  };

  function markErrorWithFilePath(e: unknown, filePath: string) {
    if (e instanceof Error) {
      const originalMessage = seenErrors.has(e) ? e.message.slice(evaluationErrorPrefix.length) : e.message;
      e.message = `${evaluationErrorPrefix}${filePath} -> ${originalMessage}`;
      seenErrors.add(e);
    }
  }

  function resolveThrow(contextPath: string, request: string, requestOrigin?: string): string | false {
    const resolvedRequest = resolveFrom(contextPath, request, requestOrigin);
    if (resolvedRequest === undefined) {
      throw new Error(`Cannot resolve "${request}" in ${requestOrigin || contextPath}`);
    }
    return resolvedRequest;
  }

  function loadFromSync(contextPath: string, request: string, requestOrigin?: string): IModule {
    const existingRequestModule = moduleCache.get(request);
    if (existingRequestModule) {
      return existingRequestModule;
    }
    const resolvedPath = resolveThrow(contextPath, request, requestOrigin);
    if (resolvedPath === false) {
      return falseModule;
    }
    return moduleCache.get(resolvedPath) ?? loadModuleSync(resolvedPath);
  }

  function loadModuleSync(filePath: string): IModule {
    const newModule: IModule = { exports: {}, filename: filePath, id: filePath, children: [] };

    const contextPath = dirname(filePath);
    const fileContents = readFileSync(filePath);

    const localRequire = (request: string) => {
      const childModule = loadFromSync(contextPath, request, filePath);
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

    try {
      moduleCache.set(filePath, newModule);

      if (filePath.endsWith(".json")) {
        newModule.exports = JSON.parse(fileContents);
        return newModule;
      }

      const fnArgs = Object.keys(moduleBuiltins).join(", ");
      const globalsArgs = Object.keys(injectedGlobals).join(", ");
      const globalFn = (0, eval)(
        `(function (${globalsArgs}){ return (function (${fnArgs}){${fileContents}\n}); })`,
      ) as (...args: unknown[]) => (...args: unknown[]) => void;

      const moduleFn = globalFn(...Object.values(injectedGlobals));
      moduleFn(...Object.values(moduleBuiltins));
    } catch (e) {
      moduleCache.delete(filePath);
      markErrorWithFilePath(e, filePath);
      throw e;
    }

    return newModule;
  }
}
