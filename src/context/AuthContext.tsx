import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../services/models';
import { useData } from './DataContext';

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'role'>, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isInitialized: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clave para guardar contraseñas en esta demo local
const PASSWORDS_KEY = 'auth_passwords';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { repo, mode } = useData();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar admin por defecto SOLO en desarrollo local (localhost)
  // JAMÁS se ejecuta en producción, incluso si mode es 'local' por algún bug.
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (mode !== 'local' || !isLocalhost) return;
    
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

        if (!users.find(u => u.role === 'SUPER_ADMIN')) {
          const superAdminUser: User = {
            id: 'superadmin-001',
            name: 'Super Administrador',
            email: 'superadmin@demo.com',
            phone: '600000001',
            role: 'SUPER_ADMIN',
          };
          await repo.saveUser(superAdminUser);
          const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
          passwords['superadmin@demo.com'] = 'superadmin';
          localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
        }

        if (!users.find(u => u.email === 'cliente@demo.com')) {
          const customerUser: User = {
            id: 'customer-001',
            name: 'Cliente Demo',
            email: 'cliente@demo.com',
            phone: '600000002',
            role: 'CUSTOMER',
          };
          await repo.saveUser(customerUser);
          const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
          passwords['cliente@demo.com'] = 'cliente';
          localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
        }
    };
    initAdmin();
  }, [repo, mode]);

  // Sincronizar el estado de Auth con Firebase para asegurar que los permisos estén listos
  useEffect(() => {
    if (mode !== 'firebase') {
      setIsInitialized(true);
      return;
    }

    const initAuth = async () => {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const auth = getAuth();
      
      // El observador onAuthStateChanged se dispara cuando la sesión ya está recuperada
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const userData = await repo.getUserById(fbUser.uid);
            if (userData) {
              setUser(userData);
              localStorage.setItem('currentUser', JSON.stringify(userData));
            }
          } catch (err) {
            console.error('Error sincronizando usuario tras login:', err);
          }
        } else {
          // Si no hay sesión en Firebase, pero teníamos una en localStorage, la limpiamos para evitar inconsistencias
          if (user && !isLocalhost()) {
             setUser(null);
             localStorage.removeItem('currentUser');
          }
        }
        setIsInitialized(true);
      });

      return unsubscribe;
    };

    let unsub: (() => void) | undefined;
    initAuth().then(u => unsub = u);
    return () => { if (unsub) unsub(); };
  }, [mode, repo]);

  const isLocalhost = () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (mode === 'firebase') {
      try {
        const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
        const auth = getAuth();
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = await repo.getUserById(cred.user.uid);
        
        if (fbUser) {
          // Bloqueo si el usuario está desactivado por un SuperAdmin
          if (fbUser.isActive === false) {
            await auth.signOut();
            return false;
          }

          // Registrar acceso si es admin
          if (fbUser.role === 'ADMIN') {
             await repo.saveUser({ ...fbUser, lastAdminAccess: Date.now() });
          }

          setUser(fbUser);
          localStorage.setItem('currentUser', JSON.stringify(fbUser));
          return true;
        }
        return false;
      } catch (err) {
        console.error(err);
        return false;
      }
    }

    const users = await repo.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      if (foundUser.isActive === false) return false;

      const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
      if (passwords[email.toLowerCase()] === password) {
        setUser(foundUser);
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        return true;
      }
    }
    return false;
  }, [repo, mode]);

  const register = useCallback(async (userData: Omit<User, 'id' | 'role'>, password: string): Promise<boolean> => {
    if (mode === 'firebase') {
      try {
        const cleanEmail = userData.email.trim().toLowerCase();
        const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
        const auth = getAuth();
        
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        
        // Comprobar si el email está pre-autorizado para ser ADMIN (solo puede hacerse una vez autenticado)
        const preAuthId = 'pre-' + cleanEmail.replace(/[^a-z0-9]/g, '_');
        let isInvitedAdmin = false;
        try {
          const preAuthUser = await repo.getUserById(preAuthId);
          isInvitedAdmin = !!preAuthUser;
        } catch (e) {
          // Si da error de permisos, es normal (el rol es CUSTOMER)
        }
        
        const newUser: User = { 
          ...userData, 
          email: cleanEmail,
          id: cred.user.uid, 
          role: isInvitedAdmin ? 'ADMIN' : 'CUSTOMER',
          isActive: true
        };

        await repo.saveUser(newUser);

        // Si era una invitación, borramos el registro temporal
        if (isInvitedAdmin) {
          try {
            await repo.deleteUser(preAuthId);
          } catch(e) {
            console.error('No se pudo limpiar la invitación', e);
          }
        }

        setUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        return true;
      } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/weak-password') {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        } else if (err.code === 'auth/email-already-in-use') {
          throw new Error('El email ya está registrado.');
        } else if (err.code === 'auth/invalid-email') {
          throw new Error('El formato del email no es válido.');
        }
        throw new Error('Error al registrar usuario.');
      }
    }

    const users = await repo.getUsers();
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('El email ya está registrado.');
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
  }, [repo, mode]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    if (mode === 'firebase') {
      try {
        const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email.trim().toLowerCase());
        return true;
      } catch (err) {
        console.error('Error enviando reset email:', err);
        return false;
      }
    }
    // Para modo local, simplemente simulamos éxito
    console.log('Simulando envío de reset email a:', email);
    return true;
  }, [mode]);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    if (mode === 'firebase') {
      try {
        const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        
        const cred = await signInWithPopup(auth, provider);
        let dbUser = await repo.getUserById(cred.user.uid);
        
        if (!dbUser) {
          dbUser = {
            id: cred.user.uid,
            name: cred.user.displayName || 'Usuario Google',
            email: cred.user.email || '',
            phone: cred.user.phoneNumber || '',
            role: 'CUSTOMER',
            isActive: true
          };
          await repo.saveUser(dbUser);
        }
        
        if (dbUser.isActive === false) {
          await auth.signOut();
          return false;
        }

        if (dbUser.role === 'ADMIN') {
           await repo.saveUser({ ...dbUser, lastAdminAccess: Date.now() });
        }
        
        setUser(dbUser);
        localStorage.setItem('currentUser', JSON.stringify(dbUser));
        return true;
      } catch (err) {
        console.error('Error en Google Login:', err);
        return false;
      }
    }
    
    // Modo local / demo
    const mockGoogleUser: User = {
      id: 'google-demo-123',
      name: 'Usuario Google Demo',
      email: 'google@demo.com',
      phone: '655555555',
      role: 'CUSTOMER',
      isActive: true
    };
    await repo.saveUser(mockGoogleUser);
    setUser(mockGoogleUser);
    localStorage.setItem('currentUser', JSON.stringify(mockGoogleUser));
    return true;
  }, [repo, mode]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      loginWithGoogle,
      logout, 
      resetPassword,
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
      isInitialized
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
