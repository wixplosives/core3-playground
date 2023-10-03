import { evaluateAndRender } from "./helpers/evaluate-and-render";
import { isPlainObject } from "./helpers/javascript";
import { rpcResponder } from "./rpc/rpc-responder";
import type { RpcCall } from "./rpc/rpc-types";

export interface Preview {
  evaluateAndRender: typeof evaluateAndRender;
}

globalThis.addEventListener("message", onMessage);

function onMessage(event: MessageEvent<unknown>): void {
  if (!isConnectMessage(event.data) || !event.ports[0]) {
    return;
  }
  globalThis.removeEventListener("message", onMessage);
  const [port] = event.ports;
  const { onCall } = rpcResponder<Preview>({
    api: { evaluateAndRender },
    dispatchResponse: (response) => port.postMessage(response),
  });
  port.addEventListener("message", (event) => onCall(event.data as RpcCall<Preview>));
  port.start();
}

function isConnectMessage(value: unknown): value is { type: "connect" } {
  return isPlainObject(value) && "type" in value && value.type === "connect";
}
