import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { api, TOKEN_KEY } from '../api/client';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string }>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    setToken(data.accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated: token !== null, login, logout }),
    [token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}