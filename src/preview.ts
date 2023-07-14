import path from "@file-services/path";
import type { IReactBoard } from "@wixc3/react-board";
import { createBaseCjsModuleSystem } from "./helpers/cjs-module-system";
import { isPlainObject } from "./helpers/javascript";
import type { ModuleGraph } from "./helpers/module-graph-resolver";
import { rpcResponder } from "./rpc/rpc-responder";
import type { RpcCall } from "./rpc/rpc-types";

export interface Preview {
  evaluateAndRender: typeof evaluateAndRender;
}

const onMessage = (event: MessageEvent<unknown>): void => {
  if (isConnectMessage(event.data) && event.ports[0]) {
    const [port] = event.ports;
    const { onCall } = rpcResponder<Preview>({
      api: { evaluateAndRender },
      dispatchResponse: (response) => port.postMessage(response),
    });
    port.addEventListener("message", (event) => onCall(event.data as RpcCall<Preview>));
    port.start();
  } else {
    globalThis.addEventListener("message", onMessage, { once: true });
  }
};

globalThis.addEventListener("message", onMessage, { once: true });

async function evaluateAndRender(moduleGraph: ModuleGraph, entryPath: string, globalSetupPath?: string) {
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

  if (globalSetupPath) {
    moduleSystem.requireModule(globalSetupPath);
  }
  const moduleExports = moduleSystem.requireModule(entryPath);
  if (isReactBoard(moduleExports)) {
    const containerId = "PREVIEW_ROOT";
    const renderingContainer =
      document.getElementById(containerId) ?? document.body.appendChild(document.createElement("div"));
    renderingContainer.id = containerId;
    await moduleExports.default.render(renderingContainer);
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

function isConnectMessage(value: unknown): value is { type: "connect" } {
  return isPlainObject(value) && "type" in value && value.type === "connect";
}
