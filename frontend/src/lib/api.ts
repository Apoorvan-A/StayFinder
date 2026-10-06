const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const JSON_HEADERS: HeadersInit = { "Content-Type": "application/json" };

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
  let code = "ERROR";
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
    }
  } catch {
    /* non-JSON error */
  }
  throw new ApiError(message, code, res.status);
}

export async function apiGet<T>(path: string): Promise<T> {
  // credentials: "include" sends the HttpOnly session cookie cross-origin.
  const res = await fetch(`${API_URL}${path}`, { credentials: "include", cache: "no-store" });
  return handle<T>(res);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: JSON_HEADERS,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle<T>(res);
}

// SWR fetcher
export const fetcher = <T>(path: string): Promise<T> => apiGet<T>(path);

/** Fetcher for the current session that resolves to null when unauthenticated. */
export async function fetchMeOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export { API_URL };
