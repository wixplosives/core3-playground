import { rpcDispatcher } from "./rpc-dispatcher";
import type { Promisified, RpcResponse } from "./rpc-types";

export interface RPCIframe<T extends object> {
  api: Promisified<T>;
  close(): void;
}

export function createRPCIframe<T extends object>(iframe: HTMLIFrameElement): RPCIframe<T> {
  const listenerController = new AbortController();
  const messageChannel = new MessageChannel();
  iframe.contentWindow?.postMessage({ type: "connect" }, "*", [messageChannel.port2]);
  const { api, onResponse } = rpcDispatcher<T>({
    dispatchCall: (call) => messageChannel.port1.postMessage(call),
    signal: listenerController.signal,
  });

  messageChannel.port1.addEventListener("message", (ev) => onResponse(ev.data as RpcResponse<T>), {
    signal: listenerController.signal,
  });
  messageChannel.port1.start();

  return {
    api,
    close() {
      listenerController.abort();
    },
  };
}
