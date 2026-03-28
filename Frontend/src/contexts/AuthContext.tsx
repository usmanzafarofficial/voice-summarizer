import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { signup as apiSignup, login as apiLogin, type AuthResponse } from "@/lib/api";

const STORAGE_KEY = "voice_user";
const TOKEN_KEY = "voice_token";

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAuth(): { user: User | null; token: string | null } {
  try {
    const userRaw = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!userRaw || !token) return { user: null, token: null };
    const user = JSON.parse(userRaw) as User;
    if (user && typeof user === "object" && "email" in user) {
      return { user, token };
    }
  } catch {
    // ignore
  }
  return { user: null, token: null };
}

function saveAuth(user: User, token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const { user: loadedUser, token: loadedToken } = loadAuth();
    setUser(loadedUser);
    setToken(loadedToken);
    setIsReady(true);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response: AuthResponse = await apiSignup({ name, email, password });
    const u: User = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      profilePicture: (response.user as any).profilePicture,
      createdAt: response.user.createdAt,
    };
    setUser(u);
    setToken(response.token);
    saveAuth(u, response.token);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response: AuthResponse = await apiLogin({ email, password });
    const u: User = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      profilePicture: (response.user as any).profilePicture,
      createdAt: response.user.createdAt,
    };
    setUser(u);
    setToken(response.token);
    saveAuth(u, response.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
