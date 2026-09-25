import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponse } from '@/types';
import { authService } from '@/services/auth';

interface AuthContextType {
  user: Omit<AuthResponse, 'accessToken'> | null;
  login: (credentials: Record<string, string>) => Promise<AuthResponse>;
  verifyGoogleCredential: (credential: string) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CUSTOMER_VERIFICATION_TOKEN = 'booking-verification-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleExpiredSession = () => {
      localStorage.removeItem('token');
      sessionStorage.removeItem(CUSTOMER_VERIFICATION_TOKEN);
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener('tdk-auth-expired', handleExpiredSession);
    return () => window.removeEventListener('tdk-auth-expired', handleExpiredSession);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem(CUSTOMER_VERIFICATION_TOKEN);
    if (token) {
      authService.getMe()
        .then(res => setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword, profileImageUrl: res.profileImageUrl }))
        .catch(() => {
          localStorage.removeItem('token');
          sessionStorage.removeItem(CUSTOMER_VERIFICATION_TOKEN);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: Record<string, string>) => {
    const res = await authService.login(credentials);
    sessionStorage.removeItem(CUSTOMER_VERIFICATION_TOKEN);
    localStorage.setItem('token', res.accessToken);
    setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword, profileImageUrl: res.profileImageUrl });
    return res;
  };

  const refreshUser = async () => {
    const res = await authService.getMe();
    setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword, profileImageUrl: res.profileImageUrl });
  };

  const verifyGoogleCredential = async (credential: string) => {
    const res = await authService.verifyGoogleCredential(credential);
    localStorage.removeItem('token');
    sessionStorage.setItem(CUSTOMER_VERIFICATION_TOKEN, res.accessToken);
    setUser({ email: res.email, firstName: res.firstName, lastName: res.lastName, role: res.role, mustChangePassword: res.mustChangePassword, profileImageUrl: res.profileImageUrl });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem(CUSTOMER_VERIFICATION_TOKEN);
    (window as any).google?.accounts?.id?.disableAutoSelect?.();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyGoogleCredential, logout, refreshUser, isAuthenticated: !!user, isLoading }}>
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
