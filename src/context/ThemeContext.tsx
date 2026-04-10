import React, { createContext, useContext, useEffect, useState } from 'react';

// Tipo de configuración de tema
export type ThemeConfig = {
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  surfaceColor: string;
  borderRadius: string;
  fontFamily: string;
};

// Valores por defecto
const defaultTheme: ThemeConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#2563eb',
  bgColor: '#f3f4f6',
  surfaceColor: '#ffffff',
  borderRadius: '8px',
  fontFamily: "'Inter', sans-serif"
};

type ThemeContextType = {
  theme: ThemeConfig;
  updateTheme: (newTheme: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    // Intentar leer de caché (útil para cuando el cliente carga la app)
    const saved = localStorage.getItem('businessTheme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  // Efecto que altera el CSS en tiempo real
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--bg-color', theme.bgColor);
    root.style.setProperty('--surface-color', theme.surfaceColor);
    root.style.setProperty('--border-radius', theme.borderRadius);
    root.style.setProperty('--font-family', theme.fontFamily);
    
    // Guardamos en caché local como DB Local temporal
    localStorage.setItem('businessTheme', JSON.stringify(theme));
  }, [theme]);

  const updateTheme = (newConfig: Partial<ThemeConfig>) => {
    setTheme(prev => ({ ...prev, ...newConfig }));
  };

  const resetTheme = () => setTheme(defaultTheme);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};
