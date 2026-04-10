import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DataRepository } from '../services/repository';
import { LocalRepository } from '../services/localRepository';
import { FirebaseRepository } from '../services/firebaseRepository';

export type DataMode = 'local' | 'firebase';

type DataContextType = {
  repo: DataRepository;
  mode: DataMode;
  switchMode: (newMode: DataMode) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<DataMode>(() => {
    return (localStorage.getItem('dataMode') as DataMode) || 'local';
  });

  const [repo, setRepo] = useState<DataRepository>(() =>
    mode === 'local' ? new LocalRepository() : new FirebaseRepository()
  );

  const switchMode = useCallback((newMode: DataMode) => {
    setMode(newMode);
    localStorage.setItem('dataMode', newMode);
    setRepo(newMode === 'local' ? new LocalRepository() : new FirebaseRepository());
  }, []);

  return (
    <DataContext.Provider value={{ repo, mode, switchMode }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de un DataProvider');
  return ctx;
};
