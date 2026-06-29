export type Task<T> = () => Promise<T>;

export const runParallel = async <T>(tasks: readonly Task<T>[]): Promise<T[]> =>
  Promise.all(tasks.map((task) => task()));

export const runBoundedParallel = async <T>(
  tasks: readonly Task<T>[],
  limit: number,
): Promise<T[]> => {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("limit must be a positive integer");
  }

  const results: T[] = [];
  let next = 0;

  const worker = async () => {
    while (next < tasks.length) {
      const current = next;
      next += 1;
      const task = tasks[current];
      if (!task) {
        continue;
      }
      results[current] = await task();
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker()),
  );
  return results;
};
