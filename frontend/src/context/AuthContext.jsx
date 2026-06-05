import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, clearSession, getStoredUser, setSession } from "@/services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("clearpath_token")));

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem("clearpath_token")) return;
    authApi.me()
      .then(({ data }) => {
        if (active) {
          setUser(data.user);
          localStorage.setItem("clearpath_user", JSON.stringify(data.user));
        }
      })
      .catch(() => {
        clearSession();
        if (active) setUser(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async register(payload) {
      const { data } = await authApi.register(payload);
      setSession(data.token, data.user);
      setUser(data.user);
      return data.user;
    },
    async login(payload) {
      const { data } = await authApi.login(payload);
      setSession(data.token, data.user);
      setUser(data.user);
      return data.user;
    },
    logout() {
      clearSession();
      setUser(null);
    },
    async refreshUser() {
      const { data } = await authApi.me();
      localStorage.setItem("clearpath_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    },
    setUser,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}