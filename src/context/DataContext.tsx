import React, { createContext, useContext, useState, useMemo } from 'react';
import type { DataRepository } from '../services/repository';
import { LocalRepository } from '../services/localRepository';
import { FirebaseRepository } from '../services/firebaseRepository';

export type DataMode = 'local' | 'firebase';

type DataContextType = {
  repo: DataRepository;
  mode: DataMode;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode] = useState<DataMode>(() => {
    return localStorage.getItem('firebaseConfig') ? 'firebase' : 'local';
  });

  const repo = useMemo<DataRepository>(() => {
    return mode === 'firebase' ? new FirebaseRepository() : new LocalRepository();
  }, [mode]);

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
