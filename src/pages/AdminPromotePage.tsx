import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { QrCode, Download, Share2, Loader2, Smartphone } from 'lucide-react';
import type { DesignConfig } from '../services/models';

export const AdminPromotePage: React.FC = () => {
  const { repo } = useData();
  const [config, setConfig] = useState<DesignConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repo.getDesignConfig().then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });
  }, [repo]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const pwaUrl = `${window.location.origin}/welcome`;

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <QrCode size={24} color="var(--primary-color)" /> Promoción e Instalación (PWA)
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Muestra este código QR a tus clientes o comparte el enlace directo. Al escanearlo, accederán a la página de bienvenida donde podrán instalar tu App en sus teléfonos.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
        {/* Panel QR */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Escáner Rápido</h3>
          
          {config?.qrCardUrl ? (
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '1.5rem', width: '100%', maxWidth: '400px' }}>
              <img src={config.qrCardUrl} alt="QR Code PWA" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
            </div>
          ) : (
             <div style={{ padding: '3rem', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', color: 'var(--text-secondary)', marginBottom: '1.5rem', width: '100%', maxWidth: '400px' }}>
               <QrCode size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
               <p>El Super Admin aún no ha generado la tarjeta gráfica QR.</p>
             </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <a 
              href={config?.qrCardUrl || '#'} 
              download="Instalacion-App-QR.jpg"
              className="btn-primary" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', textDecoration: 'none' }}
              onClick={(e) => {
                if (!config?.qrCardUrl) {
                  e.preventDefault();
                  alert('Aún no hay un QR generado por el Super Admin.');
                }
              }}
            >
              <Download size={18} /> Descargar Cartel QR
            </a>
          </div>
        </div>

        {/* Panel Info / Enlace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={20} color="var(--primary-color)" /> Enlace de Instalación Directa
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Copia este enlace y envíalo por WhatsApp, correo o redes sociales a tus clientes.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                readOnly 
                value={pwaUrl} 
                style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              />
              <button 
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(pwaUrl);
                  alert('¡Enlace copiado al portapapeles!');
                }}
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="card glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', color: '#fff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Smartphone size={32} />
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>¿Qué ve el cliente?</h3>
            </div>
            <p style={{ opacity: 0.9, lineHeight: 1.6, fontSize: '0.95rem' }}>
              Al escanear el QR o el enlace, el cliente aterrizará en una pantalla especial optimizada ("Welcome Page") que le pedirá añadir la aplicación a su pantalla de inicio. Una vez lo haga, tendrá un icono nativo en su móvil y funcionará como una App real (Progressive Web App).
            </p>
            <a 
              href={pwaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '1.5rem', background: '#fff', color: 'var(--primary-color)', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Ver página de bienvenida &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
