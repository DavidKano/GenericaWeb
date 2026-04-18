import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { DataRepository } from '../services/repository';
import { LocalRepository } from '../services/localRepository';
import { FirebaseRepository } from '../services/firebaseRepository';

export type DataMode = 'local' | 'firebase' | 'loading' | 'error';

type DataContextType = {
  repo: DataRepository;
  mode: DataMode;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Determina si estamos en un entorno de desarrollo local.
 * SOLO en localhost se permite el modo local (demo).
 */
function isLocalDevelopment(): boolean {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<DataMode>(() => {
    // En localhost, arrancamos directamente en modo local (la demo)
    // En producción, arrancamos en "loading" mientras buscamos la config del servidor
    return isLocalDevelopment() ? 'local' : 'loading';
  });

  const [firebaseConfig, setFirebaseConfig] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // En producción: obtener la configuración desde el servidor de Firebase Hosting
  useEffect(() => {
    if (isLocalDevelopment()) return; // En localhost no hacemos fetch

    const fetchConfig = async () => {
      try {
        const response = await fetch('/__/firebase/init.json');
        if (!response.ok) {
          throw new Error(`El servidor no proporcionó la configuración de Firebase (HTTP ${response.status})`);
        }
        const config = await response.json();
        if (!config || !config.projectId) {
          throw new Error('La configuración del servidor es inválida o incompleta');
        }
        setFirebaseConfig(config);
        setMode('firebase');
      } catch (err: any) {
        console.error('Error obteniendo configuración de Firebase:', err);
        setErrorMsg(err.message || 'No se pudo conectar con el servidor');
        setMode('error');
      }
    };

    fetchConfig();
  }, []);

  const repo = useMemo<DataRepository>(() => {
    if (mode === 'firebase' && firebaseConfig) {
      return new FirebaseRepository(firebaseConfig);
    }
    return new LocalRepository();
  }, [mode, firebaseConfig]);

  // Pantalla de carga mientras se obtiene la config del servidor
  if (mode === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid #3b82f6',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Conectando con el servidor...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Pantalla de error si la conexión falla
  if (mode === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111827',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center',
          background: '#1f2937',
          padding: '3rem',
          borderRadius: '16px',
          border: '1px solid #374151'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.5rem' }}>
            Error de Conexión
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            No se ha podido obtener la configuración del servidor.
          </p>
          <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            {errorMsg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ repo, mode }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de un DataProvider');
  return ctx;
};
