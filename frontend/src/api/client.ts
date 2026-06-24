// Thin HTTP client for the Doggy Breeding App backend.
// Always prefixes /api and reads base URL from EXPO_PUBLIC_BACKEND_URL.

const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "") + "/api";

async function request<T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | undefined>): Promise<T> {
  let url = BASE + path;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | number | undefined>) => request<T>("GET", path, undefined, query),
  post: <T>(path: string, body?: unknown, query?: Record<string, string | number | undefined>) => request<T>("POST", path, body, query),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

export const BASE_URL = BASE;
