/** Error shape defined in docs/spec/openapi.yaml (`Error` schema). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: { path?: string; message: string }[] = [],
  ) {
    super(message);
  }

  /** Field errors keyed by path, e.g. { "store.phone": "Phone must have 7 to 15 digits" }. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.filter((d) => d.path).map((d) => [d.path!, d.message]));
  }
}

const BASE = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'cn.accessToken';

// sessionStorage: the session ends when the tab closes (trade-off documented in add-identity-access/design.md).
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;
/** Called when an authenticated request gets 401 (expired or revoked token). */
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

/** Thin fetch wrapper: JSON in/out, bearer token from the session, contract errors as ApiError. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const e = body?.error;
    throw new ApiError(res.status, e?.code ?? 'INTERNAL_ERROR', e?.message ?? res.statusText, e?.details);
  }
  return body as T;
}

export const post = <T>(path: string, data: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(data) });
export const patch = <T>(path: string, data: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(data) });

/** Downloads a file from the API with the session token (a plain link can't send the Authorization header). */
export async function download(path: string, fallbackName: string) {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    const e = (await res.json().catch(() => null))?.error;
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, e?.code ?? 'INTERNAL_ERROR', e?.message ?? res.statusText, e?.details);
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}
