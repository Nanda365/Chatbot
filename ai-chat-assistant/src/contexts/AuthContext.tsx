import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and fetch user profile
    const token = localStorage.getItem('authToken');
    if (token) {
      api.getProfile().then(({ data, error }) => {
        if (data && !error) {
          setUser(data);
        } else {
          localStorage.removeItem('authToken');
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await api.login(email, password);
    if (error) {
      return { error };
    }
    
    if (data) {
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
    }
    
    return {};
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await api.register(name, email, password);
    if (error) {
      return { error };
    }
    
    if (data) {
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
    }
    
    return {};
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
