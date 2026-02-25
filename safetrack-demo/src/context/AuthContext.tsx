import { createContext, useState, useContext, type ReactNode } from 'react';

type UserRole = 'DRIVER' | 'PARENT' | 'ADMIN' | null;

interface AuthContextType {
  user: { name: string; role: UserRole } | null;
  login: (userData: { name: string; role: UserRole }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ name: string; role: UserRole } | null>(null);

  const login = (userData: { name: string; role: UserRole }) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
