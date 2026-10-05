/**
 * Wraps an async call so only the latest one counts: an answer that comes back
 * after a later call was made is marked stale. Opening customer A, then B —
 * if A answers last, the panel still shows B.
 */
export function latestOnly<A extends unknown[], R>(
  call: (...args: A) => Promise<R>,
): (...args: A) => Promise<{ stale: boolean; value: R }> {
  let ticket = 0;
  return async (...args) => {
    const mine = ++ticket;
    const value = await call(...args);
    return { stale: mine !== ticket, value };
  };
}
