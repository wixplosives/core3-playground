// eslint-disable-next-line no-console
export const log = (message: string) => console.log(message);
// eslint-disable-next-line no-console
export const logError = (message: string) => console.error(message);

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
  return typeof error === "object" && error !== null && ("stack" in error || "message" in error);
}
