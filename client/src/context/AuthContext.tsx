'use client'; // This is a client component

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  login: (newToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // Load token from localStorage on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  const login = (newToken: string) => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
    }
    router.push('/tasks');
  };

  const logout = () => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  // Optional: Basic check if token is expired (more robust check needed for production)
  // useEffect(() => {
  //   if (token) {
  //     try {
  //       const payload = JSON.parse(atob(token.split('.')[1]));
  //       if (payload.exp * 1000 < Date.now()) {
  //         console.log("Token expired, logging out.");
  //         logout();
  //       }
  //     } catch (e) {
  //       console.error("Error decoding token:", e);
  //       logout(); // Log out if token is invalid
  //     }
  //   }
  // }, [token]); // Re-run check if token changes

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};