import type { CallProtocol, ResponseProtocol } from "./rpc-types";

export interface ResponderOptions<API> {
  api: API;
  dispatchResponse(response: ResponseProtocol<API>): void;
}

export function rpcResponder<API>({ api, dispatchResponse }: ResponderOptions<API>) {
  async function onCall({ id, methodName, args, type }: CallProtocol<API>): Promise<void> {
    if (type !== "call" || typeof methodName !== "string") {
      return;
    }

    const method = api[methodName];

    if (typeof method !== "function") {
      dispatchResponse({
        type: "response",
        id,
        methodName,
        error: `${methodName} is not a function. typeof returned ${typeof method}`,
      } as ResponseProtocol<API>);
    } else {
      try {
        const returnValue: unknown = await method.apply(api, args);
        dispatchResponse({
          type: "response",
          id,
          methodName,
          returnValue,
        } as ResponseProtocol<API>);
      } catch (error) {
        dispatchResponse({
          type: "response",
          id,
          methodName,
          error,
        } as ResponseProtocol<API>);
      }
    }
  }

  return {
    onCall: onCall as (call: CallProtocol<API>) => void,
  };
}
