import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../services/models';
import { useData } from './DataContext';

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'role'>, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clave para guardar contraseñas en esta demo local
const PASSWORDS_KEY = 'auth_passwords';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { repo } = useData();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Inicializar admin por defecto si no existe
  useEffect(() => {
    const initAdmin = async () => {
      const users = await repo.getUsers();
      if (!users.find(u => u.role === 'ADMIN')) {
        const adminUser: User = {
          id: 'admin-001',
          name: 'Administrador',
          email: 'admin@demo.com',
          phone: '600000000',
          role: 'ADMIN',
        };
        await repo.saveUser(adminUser);
        const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
        passwords['admin@demo.com'] = 'admin';
        localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
      }
    };
    initAdmin();
  }, [repo]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const users = await repo.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
      if (passwords[email.toLowerCase()] === password) {
        setUser(foundUser);
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        return true;
      }
    }
    return false;
  }, [repo]);

  const register = useCallback(async (userData: Omit<User, 'id' | 'role'>, password: string): Promise<boolean> => {
    const users = await repo.getUsers();
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      console.error('El usuario ya existe');
      return false;
    }

    const newUser: User = {
      ...userData,
      id: 'customer-' + Date.now(),
      role: 'CUSTOMER',
    };

    await repo.saveUser(newUser);
    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    passwords[userData.email.toLowerCase()] = password;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    
    // Auto-login tras registro
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
  }, [repo]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAdmin: user?.role === 'ADMIN' 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
};
