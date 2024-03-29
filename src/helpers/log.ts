import { isPlainObject } from "./javascript";

// eslint-disable-next-line no-console
export const log = (message: unknown) => console.log(message);
// eslint-disable-next-line no-console
export const logError = (message: unknown) => console.error(message);

export function errorToString(error: unknown): string {
  if (isErrorLike(error)) {
    return error.stack ?? error.message;
  } else if (!!error && typeof error.toString === "function") {
    return (error as Error).toString();
  } else {
    return String(error);
  }
}

function isErrorLike(error: unknown): error is Error {
  return isPlainObject(error) && ("stack" in error || "message" in error);
}
