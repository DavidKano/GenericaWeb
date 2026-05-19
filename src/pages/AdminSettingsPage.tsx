import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import type { BusinessConfig } from '../services/models';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';

export const AdminSettingsPage: React.FC = () => {
  const { repo } = useData();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<BusinessConfig | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const cfg = await repo.getConfig();
      setConfig(cfg || INITIAL_BUSINESS_CONFIG);
    } catch (err: any) {
      console.error('Error cargando ajustes:', err);
      setErrorMessage(err.message || 'Error de conexión con Firestore');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repo]);

  const saveGlobalConfig = async () => {
    if (config) {
      try {
        await repo.saveConfig(config);
        alert('Ajustes guardados correctamente.');
      } catch (error: any) {
        console.error('Error saving config:', error);
        alert('Error al guardar ajustes: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem' }}>⚙️ Ajustes Generales</h2>
      
      {isLoading && (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Cargando ajustes...</p>
        </div>
      )}

      {errorMessage && (
        <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#ef4444', marginBottom: '1.5rem' }}>Error</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{errorMessage}</p>
          <button className="btn-primary" onClick={loadData}>Reintentar</button>
        </div>
      )}

      {!isLoading && !errorMessage && config && (
        <div className="card glass-panel" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Configuración global del comportamiento de tu plataforma.</p>
          
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ margin: 0, fontWeight: '600' }}>Servicios simultáneos (Capacidad)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Define cuántas citas se pueden realizar a la vez en la misma franja horaria (Ej: número de puestos o empleados).</p>
            </div>
            <input 
              type="number" 
              min="1"
              value={config.concurrentSlots || 1} 
              onChange={(e) => setConfig(prev => prev ? { ...prev, concurrentSlots: Math.max(1, parseInt(e.target.value) || 1) } : null)}
              style={{ width: '80px', textAlign: 'center', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-color)' }}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="allow-cancellation"
              checked={config.allowClientCancellation !== false} 
              onChange={(e) => setConfig(prev => {
                const base = prev || INITIAL_BUSINESS_CONFIG;
                return { ...base, allowClientCancellation: e.target.checked };
              })}
              style={{ width: 'auto', margin: '4px 0 0 0', cursor: 'pointer' }}
            />
            <label htmlFor="allow-cancellation" style={{ margin: 0, cursor: 'pointer' }}>
              <strong>Permitir cancelaciones por clientes</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Si se activa, los clientes podrán cancelar citas desde su perfil.</p>
            </label>
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="whatsapp-notif"
              checked={config.whatsappEnabled !== false} 
              onChange={(e) => setConfig(prev => {
                const base = prev || INITIAL_BUSINESS_CONFIG;
                return { ...base, whatsappEnabled: e.target.checked };
              })}
              style={{ width: 'auto', margin: '4px 0 0 0', cursor: 'pointer' }}
            />
            <label htmlFor="whatsapp-notif" style={{ margin: 0, cursor: 'pointer' }}>
              <strong>Notificaciones WhatsApp (Botones de aviso)</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Muestra u oculta los accesos directos para enviar recordatorios por WhatsApp.</p>
            </label>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <button className="btn-primary" onClick={saveGlobalConfig} style={{ width: '100%' }}>Guardar Ajustes</button>
          </div>
        </div>
      )}
    </div>
  );
};
