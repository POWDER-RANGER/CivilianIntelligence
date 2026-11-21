export function reconnectDelay(attempt, random = Math.random) {
  const n = Math.max(0, Math.min(8, Math.floor(Number(attempt) || 0)));
  return Math.min(60000, 1000 * 2 ** n) + Math.floor(random() * 500);
}
export function createConnectivityProbe({fetcher = fetch, endpoint, timeoutMs = 6500} = {}) {
  if (!endpoint || new URL(endpoint).protocol !== "https:") throw Error("HTTPS endpoint required");
  return async function probe(signal) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener("abort", cancel, {once:true});
    const timer = setTimeout(cancel, timeoutMs);
    try {
      if (signal?.aborted) throw Error("Cancelled");
      const response = await fetcher(endpoint, {method:"GET", credentials:"omit", cache:"no-store", signal:controller.signal});
      if (!response.ok) throw Error("Service unavailable");
      return true;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      controller.abort();
    }
  };
}
