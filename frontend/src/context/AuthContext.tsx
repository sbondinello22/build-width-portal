import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../api/auth";
import { loginRequest, logoutRequest, meRequest, registerRequest, updateMeRequest } from "../api/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meRequest()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await loginRequest({ email, password });
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const registeredUser = await registerRequest({ name, email, password });
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (input: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
      const updatedUser = await updateMeRequest(input);
      setUser(updatedUser);
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
