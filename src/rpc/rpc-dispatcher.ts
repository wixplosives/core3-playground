import type { RpcCall, AnyFn, RpcResponse, Promisified } from "./rpc-types";

export interface DispatcherOptions<API> {
  /** Dispatcher will call this fn when there a new call to pass to a responder */
  dispatchCall(call: RpcCall<API>): void;

  /** Dispatcher will call this fn when there's a new call to pass to a responder */
  signal?: AbortSignal;
}

export function rpcDispatcher<API extends object>({ dispatchCall, signal }: DispatcherOptions<API>) {
  const methods = new Map<string, AnyFn>();
  const callbacks = new Map<number, ReturnType<typeof deferred>>();
  let nextCallbackId = 0;

  function onResponse({ id, returnValue, error }: RpcResponse<API>): void {
    const callback = callbacks.get(id);
    if (!callback) {
      return;
    }
    callbacks.delete(id);
    if (error !== undefined) {
      callback.reject(error);
    } else {
      callback.resolve(returnValue);
    }
  }

  const api = new Proxy({} as Promisified<API>, {
    get(_self, methodName) {
      if (typeof methodName !== "string") {
        throw new Error(`cannot get a remote non-string field: ${String(methodName)}`);
      }
      const existingMethod = methods.get(methodName);
      if (existingMethod) {
        return existingMethod;
      }
      const method: AnyFn = (...args: unknown[]) => {
        if (signal?.aborted) {
          throw new Error(`${methodName} was called after dispatcher was aborted`);
        }
        const id = nextCallbackId++;
        const callback = deferred();
        callbacks.set(id, callback);
        dispatchCall({
          id,
          type: "call",
          methodName,
          args,
        } as RpcCall<API>);
        return callback.promise;
      };
      methods.set(methodName, method);
      return method;
    },
  });

  const clearCaches = () => {
    methods.clear();
    callbacks.clear();
  };
  signal?.addEventListener("abort", clearCaches, { once: true });

  return {
    api,
    onResponse,
  };
}

export function deferred<T = any>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
