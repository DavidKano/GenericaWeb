import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useData } from '../context/DataContext';
import { 
  QrCode as LucideQrCode, 
  Download, 
  Share2, 
  Loader2, 
  Smartphone
} from 'lucide-react';
import type { DesignConfig } from '../services/models';

export const AdminPromotePage: React.FC = () => {
  const { repo } = useData();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [design, setDesign] = useState<DesignConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>('client');
  const [adminQr, setAdminQr] = useState<string>('');

  useEffect(() => {
    repo.getDesignConfig().then(cfg => {
      setDesign(cfg);
      setLoading(false);
    });

    // Generate Admin QR pointing to the admin panel
    const adminUrl = `${window.location.origin}/admin`;
    QRCode.toDataURL(adminUrl, {
        width: 400,
        margin: 2,
        color: {
            dark: '#1e293b',
            light: '#ffffff'
        }
    }).then(setAdminQr).catch(err => console.error(err));
  }, [repo]);

  const handlePrintCard = () => {
    if (!design?.qrCardUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Tarjeta de Instalación</title>
            <style>
              body { 
                margin: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                background: #f1f5f9;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .container {
                background: white;
                padding: 2.5rem;
                border-radius: 24px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 90%;
              }
              img { 
                max-width: 100%; 
                height: auto; 
                display: block;
                border-radius: 16px;
                margin: 0 auto;
              }
              .actions {
                margin-bottom: 2rem;
                display: flex;
                justify-content: center;
                gap: 1rem;
                flex-wrap: wrap;
              }
              button, .btn {
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
              }
              button:hover, .btn:hover {
                transform: translateY(-2px);
                filter: brightness(1.1);
              }
              .btn-print { background: #059669; color: white; }
              .btn-download { background: #2563eb; color: white; }
              
              @media print {
                body { background: white; }
                .container { box-shadow: none; padding: 0; max-width: none; }
                .actions { display: none; }
                img { width: 100%; border-radius: 0; }
              }
            </style>
            <script>
              async function downloadImage(url, filename) {
                try {
                  const response = await fetch(url);
                  const blob = await response.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(blobUrl);
                  document.body.removeChild(a);
                } catch (e) {
                  // Fallback if fetch fails (CORS)
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.target = '_blank';
                  a.click();
                }
              }
            </script>
          </head>
          <body>
            <div class="container">
              <div class="actions">
                <button class="btn btn-print" onclick="window.print()">
                   Imprimir tarjeta
                </button>
                <button class="btn btn-download" onclick="downloadImage('${design.qrCardUrl}', 'Tarjeta-QR.jpg')">
                   Descargar Imagen
                </button>
              </div>
              <img src="${design.qrCardUrl}" />
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const pwaUrl = `${window.location.origin}/welcome`;
  const adminUrl = `${window.location.origin}/admin`;

  return (
    <div className="animate-fade-in" style={{ padding: isMobile ? '0' : '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem'}}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LucideQrCode size={24} color="var(--primary-color)" /> Promoción e Instalación
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
                Configura los accesos rápidos y la instalación para clientes o para ti mismo.
            </p>
          </div>
          
          <div className="data-toggle" style={{ background: 'var(--surface-color)', padding: '4px' }}>
              <button 
                className={activeTab === 'client' ? 'active' : ''} 
                onClick={() => setActiveTab('client')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem'}}
              >
                  👤 App Clientes
              </button>
              <button 
                className={activeTab === 'admin' ? 'active' : ''} 
                onClick={() => setActiveTab('admin')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem'}}
              >
                  💼 App Admin
              </button>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: isMobile ? '1rem' : '2rem' }}>
        {/* Panel QR */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '1.5rem 1rem' : '2rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {activeTab === 'client' ? 'Código para Clientes' : 'Tu Acceso Admin'}
          </h3>
          
          {activeTab === 'client' ? (
              <>
                {design?.qrCardUrl ? (
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '1.5rem', width: '100%', maxWidth: '350px' }}>
                        <img src={design.qrCardUrl} alt="QR Code PWA" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
                    </div>
                ) : (
                    <div style={{ padding: '3rem', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', color: 'var(--text-secondary)', marginBottom: '1.5rem', width: '100%', maxWidth: '350px', border: '2px dashed var(--glass-border)' }}>
                        <LucideQrCode size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>El Super Admin aún no ha generado la tarjeta gráfica QR.</p>
                    </div>
                )}
                <button 
                    onClick={handlePrintCard}
                    className="btn-primary" 
                    style={{ width: '100%', maxWidth: '350px', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                >
                    Imprimir/descargar tarjeta
                </button>
              </>
          ) : (
              <>
                <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '1.5rem', width: '100%', maxWidth: '350px', position: 'relative' }}>
                    <img src={adminQr} alt="QR Admin" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <Smartphone size={32} color="var(--primary-color)" />
                    </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '300px' }}>
                    Escanea este código con tu móvil para abrir el panel de administración directamente e instalarlo como App.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '350px' }}>
                    <a href={adminQr} download="Admin-Panel-Access.png" className="btn-secondary" style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                        <Download size={16} /> Guardar Imagen
                    </a>
                </div>
              </>
          )}
        </div>

        {/* Panel Info / Enlace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass-panel" style={{ padding: isMobile ? '1.5rem 1rem' : '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={20} color="var(--primary-color)" /> {activeTab === 'client' ? 'Enlace Directo Clientes' : 'Tu Enlace de Acceso'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {activeTab === 'client' 
                ? 'Copia este enlace para enviarlo por WhatsApp o ponerlo en tu perfil de Instagram.'
                : 'Usa este enlace en el navegador de tu móvil para instalar el panel de gestión.'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                readOnly 
                value={activeTab === 'client' ? pwaUrl : adminUrl} 
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              />
              <button 
                className="btn-primary"
                style={{ borderRadius: '10px' }}
                onClick={() => {
                  navigator.clipboard.writeText(activeTab === 'client' ? pwaUrl : adminUrl);
                  alert('¡Enlace copiado!');
                }}
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="card glass-panel" style={{ padding: isMobile ? '1.5rem 1rem' : '2rem', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', color: '#fff', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                <Smartphone size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                {activeTab === 'client' ? 'Ventajas de la App PWA' : 'Tu Panel en el Bolsillo'}
              </h3>
            </div>
            <p style={{ opacity: 0.9, lineHeight: 1.6, fontSize: '0.95rem' }}>
              {activeTab === 'client' 
                ? 'Una vez instalada, los clientes verán tu logo en su menú de aplicaciones. Podrán reservar en segundos sin buscar la web, aumentando la recurrencia de tus servicios.'
                : 'Instala el panel de administración para recibir notificaciones, gestionar citas en tiempo real mientras te mueves y tener un acceso directo siempre a mano.'}
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                {activeTab === 'client' ? (
                    <a 
                        href={pwaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: '#fff', color: 'var(--primary-color)', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                        Ver página de bienvenida &rarr;
                    </a>
                ) : (
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '8px' }}>
                        💡 Consejo: Dale a "Añadir a pantalla de inicio" en tu navegador móvil.
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
