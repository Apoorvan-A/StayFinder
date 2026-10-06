const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEMO_USER_KEY = "stayfinder.demoUserId";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_USER_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUserId(id: number): void {
  try {
    window.localStorage.setItem(DEMO_USER_KEY, String(id));
  } catch {
    /* storage may be unavailable (private mode); ignore */
  }
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const userId = getStoredUserId();
  if (userId) headers["X-Demo-User-Id"] = String(userId);
  return { ...headers, ...(extra as Record<string, string>) };
}

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
  const res = await fetch(`${API_URL}${path}`, { headers: buildHeaders(), cache: "no-store" });
  return handle<T>(res);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle<T>(res);
}

// SWR fetcher
export const fetcher = <T>(path: string): Promise<T> => apiGet<T>(path);

export { API_URL };
