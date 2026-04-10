import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const SuperAdminPanel: React.FC = () => {
  const { theme, updateTheme, resetTheme } = useTheme();

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>⚙️ Super Admin - Live Theme</h2>
      <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.8 }}>
        Modifica el branding de la app al vuelo. Ideal para presentar la app a un cliente.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Color Principal</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="color" 
              value={theme.primaryColor} 
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            />
            <span style={{ fontFamily: 'monospace' }}>{theme.primaryColor}</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Fondo (Background)</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="color" 
              value={theme.bgColor} 
              onChange={(e) => updateTheme({ bgColor: e.target.value })}
            />
            <span style={{ fontFamily: 'monospace' }}>{theme.bgColor}</span>
          </div>
        </div>

        <div>
           <label style={{ display: 'block', marginBottom: '0.5rem' }}>Redondeo de Bordes (px)</label>
           <input 
              type="range" 
              min="0" max="30" 
              value={parseInt(theme.borderRadius)}
              onChange={(e) => updateTheme({ borderRadius: `${e.target.value}px` })}
              style={{ width: '100%' }}
           />
           <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>{theme.borderRadius}</div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipografía</label>
          <select 
            value={theme.fontFamily} 
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="'Inter', sans-serif">Inter (Moderna)</option>
            <option value="'Roboto', sans-serif">Roboto (Clásica)</option>
            <option value="'Poppins', sans-serif">Poppins (Geométrica)</option>
            <option value="'Georgia', serif">Georgia (Elegante)</option>
          </select>
        </div>

        <hr style={{ margin: '1rem 0', opacity: 0.2 }} />

        <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => alert('¡Guardado en BD Local ficticia!')}>
              Guardar Cliente
            </button>
            <button 
                onClick={resetTheme}
                style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--border-radius)', cursor: 'pointer' }}>
              Reset
            </button>
        </div>
      </div>
    </div>
  );
};
