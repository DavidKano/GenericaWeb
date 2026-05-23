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
        <div className="card glass-panel" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>Configuración global del comportamiento de tu plataforma.</p>
          
          {/* Row 1: Capacidad */}
          <div className="form-group settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ flex: 1 }}>
              <label style={{ margin: 0, fontWeight: '600', color: 'var(--text-primary)' }}>Servicios simultáneos (Capacidad)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Define cuántas citas se pueden realizar a la vez en la misma franja horaria (Ej: número de puestos o empleados).</p>
            </div>
            <input 
              type="number" 
              min="1"
              value={config.concurrentSlots || 1} 
              onChange={(e) => setConfig(prev => prev ? { ...prev, concurrentSlots: Math.max(1, parseInt(e.target.value) || 1) } : null)}
              style={{ width: '60px', textAlign: 'center', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: 'var(--text-color)' }}
            />
          </div>

          {/* Row 2: Cancelaciones */}
          <div className="form-group settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Permitir cancelaciones por clientes</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Si se activa, los clientes podrán cancelar citas desde su perfil.</p>
            </div>
            <label className="toggle-switch-container">
              <input 
                type="checkbox" 
                className="toggle-switch-input"
                id="allow-cancellation"
                checked={config.allowClientCancellation !== false} 
                onChange={(e) => setConfig(prev => {
                  const base = prev || INITIAL_BUSINESS_CONFIG;
                  return { ...base, allowClientCancellation: e.target.checked };
                })}
              />
              <span className="toggle-switch-slider"></span>
            </label>
          </div>

          {/* Row 3: WhatsApp */}
          <div className="form-group settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', padding: '16px 0' }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Notificaciones WhatsApp (Botones de aviso)</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Muestra u oculta los accesos directos para enviar recordatorios por WhatsApp.</p>
            </div>
            <label className="toggle-switch-container">
              <input 
                type="checkbox" 
                className="toggle-switch-input"
                id="whatsapp-notif"
                checked={config.whatsappEnabled !== false} 
                onChange={(e) => setConfig(prev => {
                  const base = prev || INITIAL_BUSINESS_CONFIG;
                  return { ...base, whatsappEnabled: e.target.checked };
                })}
              />
              <span className="toggle-switch-slider"></span>
            </label>
          </div>

          {/* Botón de Guardado */}
          <div className="settings-btn-container">
            <button className="btn-primary settings-btn-save" onClick={saveGlobalConfig}>Guardar Ajustes</button>
          </div>

          <style>{`
            .settings-row {
              transition: background-color 0.2s ease;
            }
            
            /* Toggle Switch */
            .toggle-switch-container {
              position: relative;
              display: inline-block;
              width: 48px;
              height: 24px;
              flex-shrink: 0;
            }

            .toggle-switch-input {
              opacity: 0;
              width: 0;
              height: 0;
            }

            .toggle-switch-slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: #CBD5E1;
              transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
              border-radius: 24px;
            }

            .toggle-switch-slider:before {
              position: absolute;
              content: "";
              height: 18px;
              width: 18px;
              left: 3px;
              bottom: 3px;
              background-color: white;
              transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
              border-radius: 50%;
              box-shadow: 0 1px 3px rgba(0,0,0,0.15);
            }

            .toggle-switch-input:checked + .toggle-switch-slider {
              background-color: var(--primary-color, #008080);
            }

            .toggle-switch-input:checked + .toggle-switch-slider:before {
              transform: translateX(24px);
            }

            .toggle-switch-input:focus-visible + .toggle-switch-slider {
              box-shadow: 0 0 0 2px rgba(0, 128, 128, 0.25);
            }

            /* Button Styling */
            .settings-btn-container {
              margin-top: 1.5rem;
              padding-top: 1.5rem;
              border-top: 1px solid var(--glass-border, rgba(0,0,0,0.05));
              display: flex;
              justify-content: flex-end;
            }

            .settings-btn-save {
              display: inline-block !important;
              padding: 12px 32px !important;
              max-width: 250px;
              width: 100%;
              border-radius: 8px !important;
              font-weight: 600;
              text-align: center;
              transition: all 0.2s ease-in-out;
            }

            @media (max-width: 768px) {
              .settings-btn-container {
                justify-content: center;
              }
              .settings-btn-save {
                max-width: none;
                width: 100%;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
