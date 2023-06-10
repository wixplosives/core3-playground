export async function collectIntoArray<T>(asyncIter: AsyncIterable<T>): Promise<T[]> {
  const collected: T[] = [];
  for await (const item of asyncIter) {
    collected.push(item);
  }
  return collected;
}

export async function ignoreRejections<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch {
    return undefined;
  }
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(min, value), max);
