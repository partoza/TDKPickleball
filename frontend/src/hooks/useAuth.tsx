import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponse } from '@/types';
import { authService } from '@/services/auth';

interface AuthContextType {
  user: Omit<AuthResponse, 'accessToken'> | null;
  login: (credentials: Record<string, string>) => Promise<AuthResponse>;
  completeGoogleLogin: (code: string) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getMe()
        .then(res => setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword }))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: Record<string, string>) => {
    const res = await authService.login(credentials);
    localStorage.setItem('token', res.accessToken);
    setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword });
    return res;
  };

  const refreshUser = async () => {
    const res = await authService.getMe();
    setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword });
  };

  const completeGoogleLogin = async (code: string) => {
    const res = await authService.exchangeGoogleCode(code);
    localStorage.setItem('token', res.accessToken);
    setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, completeGoogleLogin, logout, refreshUser, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
