/**
 * Resilient HTTP helper shared by every data adapter.
 * - AbortController timeout (default 12s)
 * - Bounded retry with backoff for transient failures
 * - Never throws to callers: returns a discriminated result so adapters can
 *   map failures to `state: "error"` / `"unknown"` instead of crashing a page.
 */

export interface FetchOk<T> {
  ok: true;
  data: T;
}
export interface FetchErr {
  ok: false;
  error: string;
  status?: number;
}
export type FetchResult<T> = FetchOk<T> | FetchErr;

interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  /** Next.js fetch caching. Defaults to a short revalidate for freshness. */
  revalidate?: number | false;
  /** HTTP method. Defaults to GET; set "POST" for GraphQL endpoints. */
  method?: string;
  /** Request body (e.g. a JSON-stringified GraphQL query). */
  body?: string;
}

export async function fetchJson<T>(
  url: string,
  opts: FetchOptions = {}
): Promise<FetchResult<T>> {
  const {
    timeoutMs = 12_000,
    retries = 2,
    headers = {},
    revalidate = 30,
    method = "GET",
    body,
  } = opts;

  let lastError = "Unknown error";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        body,
        headers: { Accept: "application/json", ...headers },
        signal: controller.signal,
        next: revalidate === false ? undefined : { revalidate },
        cache: revalidate === false ? "no-store" : undefined,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        lastError = "Rate limited by upstream source";
        await backoff(attempt);
        continue;
      }
      if (!res.ok) {
        // 4xx (except 429) are not retryable.
        if (res.status >= 400 && res.status < 500) {
          return { ok: false, error: `Upstream ${res.status}`, status: res.status };
        }
        lastError = `Upstream ${res.status}`;
        await backoff(attempt);
        continue;
      }

      const data = (await res.json()) as T;
      return { ok: true, data };
    } catch (err) {
      clearTimeout(timer);
      lastError =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out"
            : err.message
          : "Network error";
      await backoff(attempt);
    }
  }

  return { ok: false, error: lastError };
}

function backoff(attempt: number): Promise<void> {
  const ms = Math.min(150 * 2 ** attempt, 1200);
  return new Promise((r) => setTimeout(r, ms));
}
