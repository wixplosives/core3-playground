import { activate, createBridge, type Wall } from "react-devtools-inline/backend";
import { evaluateAndRender } from "./helpers/evaluate-and-render";
import { isPlainObject } from "./helpers/javascript";
import { rpcResponder } from "./rpc/rpc-responder";
import type { RpcCall } from "./rpc/rpc-types";

export interface Preview {
  evaluateAndRender: typeof evaluateAndRender;
}

globalThis.addEventListener("message", onMessage);

function onMessage(event: MessageEvent<unknown>): void {
  if (isMessage(event.data, "connect") && event.ports[0]) {
    const [port] = event.ports;
    const { onCall } = rpcResponder<Preview>({
      api: { evaluateAndRender },
      dispatchResponse: (response) => port.postMessage(response),
    });
    port.addEventListener("message", (event) => onCall(event.data as RpcCall<Preview>));
    port.start();
  } else if (isMessage(event.data, "connect-devtools") && event.ports[0]) {
    const [port] = event.ports;
    port.start();
    const bridge = createBridge({} as Window, createWallFromPort(port));
    activate(window, { bridge });
  }
}

function isMessage(value: unknown, type: string): value is { type: string } {
  return isPlainObject(value) && "type" in value && value.type === type;
}

function createWallFromPort(port: MessagePort): Wall {
  return {
    listen(listener) {
      const proxyListener = ({ data }: MessageEvent) => {
        listener(data);
      };
      port.addEventListener("message", proxyListener);
      return () => {
        port.removeEventListener("message", proxyListener);
      };
    },
    send(event, payload: unknown, transferable) {
      port.postMessage({ event, payload }, transferable as Transferable[]);
    },
  };
}
