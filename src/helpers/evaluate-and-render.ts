import { createBaseCjsModuleSystem } from "@file-services/commonjs";
import path from "@file-services/path";
import type { IReactBoard } from "@wixc3/react-board";
import { isPlainObject } from "./javascript";
import type { ModuleGraph } from "./module-graph-resolver";

export async function evaluateAndRender(moduleGraph: ModuleGraph, entryPaths: string | string[]) {
  entryPaths = Array.isArray(entryPaths) ? entryPaths : [entryPaths];
  const moduleSystem = createBaseCjsModuleSystem({
    dirname: path.dirname,
    readFileSync(filePath) {
      const module = moduleGraph.get(filePath);
      if (!module) {
        throw new Error(`Module ${filePath} not found`);
      }
      return module.compiledContents;
    },
    resolveFrom(contextPath, request, requestOrigin) {
      if (!requestOrigin) {
        throw new Error(`Cannot resolve ${request} from ${contextPath} without requestOrigin`);
      }
      const resolved = moduleGraph.get(requestOrigin);
      if (!resolved) {
        throw new Error(`Module ${requestOrigin} not found`);
      }
      const resolution = resolved.resolvedRequests.get(request);
      if (resolution === undefined) {
        throw new Error(`Cannot resolve ${request} from ${requestOrigin}`);
      }
      return resolution;
    },
    globals: {
      process: {
        env: {
          NODE_ENV: "development",
        },
        browser: true,
      },
    },
  });

  const renderingContainer = document.body.appendChild(document.createElement("div"));
  renderingContainer.id = "root";

  for (const entryPath of entryPaths) {
    const moduleExports = moduleSystem.requireModule(entryPath);
    if (isReactBoard(moduleExports)) {
      await moduleExports.default.render(renderingContainer);
    }
  }
}

function isReactBoard(moduleExports: unknown): moduleExports is { default: IReactBoard } {
  return (
    isPlainObject(moduleExports) &&
    "default" in moduleExports &&
    isPlainObject(moduleExports.default) &&
    typeof (moduleExports.default as IReactBoard).render === "function"
  );
}
