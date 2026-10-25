const API_URL = (import.meta.env.VITE_API_URL || "https://pokelist-api.onrender.com").replace(/\/$/, "");

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (response.status === 401 && retry && accessToken && !endpoint.startsWith("/auth/")) {
    const refreshed = await refreshSession().catch(() => null);
    if (refreshed) return apiRequest<T>(endpoint, options, false);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(response.status, error.error || "REQUEST_FAILED");
  }
  return response.json() as Promise<T>;
}
export type Account = { id: string; email: string; displayName: string; emailVerified: boolean };
export type LoginResponse = { accessToken: string; user: Account };
export async function refreshSession(): Promise<LoginResponse> {
  const session = await apiRequest<LoginResponse>("/auth/refresh", {
    method: "POST",
    headers: { Origin: window.location.origin },
  }, false);
  setAccessToken(session.accessToken);
  return session;
}
