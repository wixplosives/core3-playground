export type AnyFn = (...args: any) => any;

export type Promisified<T> = {
  [K in keyof T as T[K] extends AnyFn ? K : never]: T[K] extends AnyFn ? PromisifyFn<T[K]> : never;
};

export type RpcCall<T> = {
  [K in keyof T]: T[K] extends AnyFn ? MethodCall<K, Parameters<T[K]>> : never;
}[keyof T];

export type RpcResponse<T> = {
  [K in keyof T]: T[K] extends AnyFn ? MethodResponse<K, ReturnType<T[K]>> : never;
}[keyof T];

export type PromisifyFn<T extends AnyFn> = T extends (...args: infer P) => infer R
  ? (...args: P) => Promise<Awaited<R>>
  : never;

export interface MethodCall<N extends keyof any = string, A extends any[] = any> {
  type: "call";
  id: number;
  methodName: N;
  args: A;
}

export interface MethodResponse<N extends keyof any = string, R = any> {
  type: "response";
  id: number;
  methodName: N;
  error?: unknown;
  returnValue?: R;
}
