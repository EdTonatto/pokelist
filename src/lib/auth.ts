import { useCallback, useEffect, useState } from "react";
import { apiRequest, refreshSession, setAccessToken, type Account } from "./api";
type Credentials = { email: string; password: string };
type Registration = Credentials & { displayName: string };
export function usePokeListAuth() {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    refreshSession().then((session) => {
      if (active) setUser(session.user);
    }).catch(() => setAccessToken(null)).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const login = useCallback(async (credentials: Credentials) => {
    const session = await apiRequest<{ accessToken: string; user: Account }>("/auth/login", {
      method: "POST", body: JSON.stringify(credentials),
    });
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);
  const register = useCallback(async (values: Registration) => {
    await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(values) });
  }, []);
  const logout = useCallback(async () => {
    try { await apiRequest("/auth/logout", { method: "POST" }); }
    finally { setAccessToken(null); setUser(null); }
  }, []);
  return { user, loading, login, register, logout };
}
export type AuthController = ReturnType<typeof usePokeListAuth>;
