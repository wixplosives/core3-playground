import { rpcDispatcher } from "./rpc-dispatcher";
import type { Promisified, RpcResponse } from "./rpc-types";

export interface RPCWorker<T extends object> {
  api: Promisified<T>;
  close(): void;
}

export function createRPCWorker<T extends object>(workerURL: URL, workerName: string): RPCWorker<T> {
  const listenerController = new AbortController();
  const worker = new Worker(workerURL, { name: workerName, type: "module" });

  const { api, onResponse } = rpcDispatcher<T>({
    dispatchCall: (call) => worker.postMessage(call),
    signal: listenerController.signal,
  });

  worker.addEventListener("message", (ev) => onResponse(ev.data as RpcResponse<T>), {
    signal: listenerController.signal,
  });

  return {
    api,
    close() {
      listenerController.abort();
      worker.terminate();
    },
  };
}
