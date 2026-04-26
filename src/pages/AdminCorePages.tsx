import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Briefcase, ShieldCheck, ShieldAlert, Code, Save, Loader2, UploadCloud, CheckCircle, Palette, Type, QrCode, Users, Search, Trash2, UserRoundCheck, UserRoundX } from 'lucide-react';
import type { CompanyData, DesignConfig, User } from '../services/models';
import QRCode from 'qrcode';
import { getDefaultPrivacyPolicy, getDefaultTermsOfUse } from '../services/policyDefaults';

export const AdminCoreDatos: React.FC = () => {
  const { repo } = useData();
  const [companyData, setCompanyData] = useState<CompanyData>({
    nombreEmpresa: '', personaContacto: '', cifNif: '', direccion: '', cp: '', localidad: '', provincia: '', fechaPuestaMarcha: '', precioActual: 0, fechaRenovacion: '', supportEmail: '', contactEmail: '', telefono: '', renewalType: 'Anual'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await repo.getCompanyData();
        if (data) setCompanyData(data);
      } catch (err: any) {
        console.error('Error cargando datos de empresa:', err);
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [repo]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await repo.saveCompanyData(companyData);
    setSaving(false);
    setToast('Ajustes maestros guardados correctamente');
    setTimeout(() => setToast(''), 3000);
  };

  const handleCompanyChange = (field: keyof CompanyData, value: any) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Cargando metadatos CORE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
        <ShieldAlert size={48} style={{ margin: '0 auto 1rem' }} />
        <h3>Acceso Restringido</h3>
        <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>{error}</p>
        <button className="btn-primary" style={{ marginTop: '1.5rem', background: '#eab308', color: '#111' }} onClick={() => window.location.reload()}>Reintentar Carga</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ background: '#1f2937', padding: '2rem', borderRadius: '12px', border: '1px solid #374151' }}>
      <form onSubmit={handleSaveCompany}>
        <h2 style={{ color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase color="#eab308" /> Ficha de la Licencia Mercantil
        </h2>
        <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Variables maestras que alimentan la lógica legal y de facturación.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '70% 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Nombre de Empresa</label>
            <input type="text" value={companyData.nombreEmpresa} onChange={e => handleCompanyChange('nombreEmpresa', e.target.value)} required style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>CIF/NIF</label>
            <input 
              type="text" 
              maxLength={10} 
              value={companyData.cifNif} 
              onChange={e => handleCompanyChange('cifNif', e.target.value)} 
              required 
              style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} 
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label style={{ color: '#d1d5db' }}>Persona de Contacto</label>
          <input type="text" value={companyData.personaContacto} onChange={e => handleCompanyChange('personaContacto', e.target.value)} required style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Dirección Completa</label>
            <input type="text" value={companyData.direccion} onChange={e => handleCompanyChange('direccion', e.target.value)} style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>C. Postal</label>
            <input type="text" value={companyData.cp} onChange={e => handleCompanyChange('cp', e.target.value)} style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Localidad</label>
            <input type="text" value={companyData.localidad} onChange={e => handleCompanyChange('localidad', e.target.value)} style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Provincia</label>
            <input type="text" value={companyData.provincia} onChange={e => handleCompanyChange('provincia', e.target.value)} style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Email de Soporte Técnico (Peticiones de ayuda)</label>
            <input type="email" value={companyData.supportEmail || ''} onChange={e => handleCompanyChange('supportEmail', e.target.value)} placeholder="soporte@tuempresa.com" style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Email de Contacto (Para clientes)</label>
            <input type="email" value={companyData.contactEmail || ''} onChange={e => handleCompanyChange('contactEmail', e.target.value)} placeholder="contacto@tuempresa.com" style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label style={{ color: '#d1d5db' }}>Teléfono de Contacto (Para clientes)</label>
          <input type="text" value={companyData.telefono || ''} onChange={e => handleCompanyChange('telefono', e.target.value)} placeholder="+34 600 000 000" style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
        </div>

        <hr style={{ borderColor: '#374151', margin: '2rem 0' }} />

        <h3 style={{ color: '#eab308', marginBottom: '1.5rem', fontSize: '1rem' }}>Suscripción y Ciclo de Vida</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Activación</label>
            <input type="date" value={companyData.fechaPuestaMarcha} onChange={e => handleCompanyChange('fechaPuestaMarcha', e.target.value)} style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563', colorScheme: 'dark' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Precio Cuota (€)</label>
            <input type="number" step="0.01" value={companyData.precioActual || ''} onChange={e => handleCompanyChange('precioActual', parseFloat(e.target.value) || 0)} style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Fecha Renovación</label>
            <input type="date" value={companyData.fechaRenovacion} onChange={e => handleCompanyChange('fechaRenovacion', e.target.value)} style={{ background: '#111827', color: '#fff', border: '1px solid #4b5563', colorScheme: 'dark' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#d1d5db' }}>Tipo de renovación</label>
            <select 
              value={companyData.renewalType || 'Anual'} 
              onChange={e => handleCompanyChange('renewalType', e.target.value)}
              style={{ width: '100%', padding: '0.6rem', background: '#111827', color: '#fff', border: '1px solid #4b5563', borderRadius: '4px' }}
            >
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem', background: '#eab308', color: '#111', borderColor: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            {saving ? 'Transfiriendo...' : 'Forzar Guardado CORE'}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#10b981', color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 9999, fontWeight: 'bold' }}>
          <CheckCircle size={20} /> {toast}
        </div>
      )}
    </div>
  );
};

export const AdminCoreDiseno: React.FC = () => {
  const { repo } = useData();
  const [config, setConfig] = useState<DesignConfig | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState(`${window.location.origin}/welcome`);
  const [rgbInput, setRgbInput] = useState({ r: 59, g: 130, b: 246 });
  const [textRgbInput, setTextRgbInput] = useState({ r: 255, g: 255, b: 255 });
  const [bgRgbInput, setBgRgbInput] = useState({ r: 243, g: 244, b: 246 }); // #f3f4f6

  const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const calculateSecondaryColor = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const darken = 0.8;
    return rgbToHex(Math.round(r * darken), Math.round(g * darken), Math.round(b * darken));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [cfg, comp] = await Promise.all([
          repo.getDesignConfig(),
          repo.getCompanyData()
        ]);
        
        if (cfg) {
          setConfig(cfg);
          if (cfg.primaryColor) {
             setRgbInput(hexToRgb(cfg.primaryColor));
          }
          if (cfg.primaryTextColor) {
             setTextRgbInput(hexToRgb(cfg.primaryTextColor));
          }
          if (cfg.backgroundColor) {
             setBgRgbInput(hexToRgb(cfg.backgroundColor));
          }
        }
        if (comp) {
          setCompany(comp);
        }
      } catch (err: any) {
        console.error('Error cargando diseño:', err);
        setError(err.message || 'Error de permisos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [repo]);

  const resizeImage = (src: HTMLCanvasElement, width: number, height: number, type = 'image/png', quality = 1): string => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d')!;
    const scale = Math.min(width / src.width, height / src.height);
    const x = (width / 2) - (src.width / 2) * scale;
    const y = (height / 2) - (src.height / 2) * scale;
    ctx.drawImage(src, x, y, src.width * scale, src.height * scale);
    return c.toDataURL(type, quality);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const srcCtx = srcCanvas.getContext('2d')!;
        srcCtx.drawImage(img, 0, 0);

        const logoBase64 = resizeImage(srcCanvas, Math.min(img.width, 800), Math.min(img.height, 800), 'image/png');
        const pwaIconBase64 = resizeImage(srcCanvas, 512, 512, 'image/png');
        const faviconBase64 = resizeImage(srcCanvas, 32, 32, 'image/png');
        const adminHeaderBase64 = resizeImage(srcCanvas, 200, 50, 'image/png');

        const qrCardBase64 = await generateQrCard(img);

        try {
          // Subir a Firebase Storage y obtener URLs reales
          const sourceLogoUrl = await repo.uploadImage('branding/logo.png', logoBase64);
          const pwaIcon = await repo.uploadImage('branding/pwa-icon.png', pwaIconBase64);
          const faviconUrl = await repo.uploadImage('branding/favicon.png', faviconBase64);
          const adminHeaderUrl = await repo.uploadImage('branding/admin-header.png', adminHeaderBase64);
          const qrCardUrl = await repo.uploadImage('branding/qr-card.png', qrCardBase64);

          const newConfig: DesignConfig = {
            sourceLogoUrl,
            pwaIcon,
            adminHeaderUrl,
            faviconUrl,
            qrCardUrl,
            primaryColor: config?.primaryColor || '#3b82f6',
            secondaryColor: config?.secondaryColor || '#2563eb'
          };

          setConfig(newConfig);
          await repo.saveDesignConfig(newConfig);
          // Sincronizar caché local
          localStorage.setItem('design_config_cache', JSON.stringify(newConfig));
          setToast('Assets gráficos subidos a la nube y persistidos');
        } catch (err: any) {
          console.error('Error al subir/guardar configuración de diseño:', err);
          alert('Error: No se pudo subir la imagen a Firebase Storage. Asegúrate de haber activado "Storage" en tu consola de Firebase.');
        } finally {
          setProcessing(false);
          setTimeout(() => setToast(''), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const generateQrCard = async (img: HTMLImageElement): Promise<string> => {
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, qrUrl, { width: 400, margin: 2 });
    
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 800;
    cardCanvas.height = 400;
    const cardCtx = cardCanvas.getContext('2d')!;
    cardCtx.fillStyle = '#ffffff';
    cardCtx.fillRect(0, 0, 800, 400);

    // Selección de tipografía
    const fontMain = config?.fontFamily || "'Inter', sans-serif";

    // Logo: lo subimos y alineamos a la izquierda
    const logoScale = Math.min(240 / img.width, 240 / img.height);
    const lx = 50; // Alineado a la izquierda con margen de 50px
    const ly = 130 - (img.height * logoScale / 2);
    cardCtx.drawImage(img, lx, ly, img.width * logoScale, img.height * logoScale);

    // Textos debajo del logo, alineados a la izquierda
    cardCtx.textAlign = 'left';
    cardCtx.fillStyle = '#1e293b';

    // 1. Nombre del Negocio (Negrita, tamaño mediano)
    cardCtx.font = `bold 24px ${fontMain}`;
    cardCtx.fillText(company?.nombreEmpresa || 'Tu Negocio', 50, 260);

    // 2. Solo la dirección (Pequeño, normal)
    cardCtx.font = `14px ${fontMain}`;
    cardCtx.fillStyle = '#64748b';
    cardCtx.fillText(company?.direccion || '', 50, 290);

    // 3. Código Postal y Población (Mismo estilo que anterior)
    const locationInfo = [company?.cp, company?.localidad].filter(Boolean).join(' - ');
    cardCtx.fillText(locationInfo, 50, 315);

    // 4. Teléfono y Email de cliente
    const phone = company?.telefono || '';
    const email = company?.contactEmail || '';
    const contactInfo = [phone, email].filter(Boolean).join(' - ');
    cardCtx.fillText(contactInfo, 50, 340);

    // Dibujar el QR a la derecha
    cardCtx.drawImage(qrCanvas, 400, 0, 400, 400);

    return cardCanvas.toDataURL('image/png');
  };

  const handleManualQrGenerate = async () => {
    if (!config?.sourceLogoUrl) {
      alert('Primero debes subir un logotipo para poder generar la tarjeta QR con marca corporativa.');
      return;
    }
    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = config.sourceLogoUrl!;
      });

      const qrCardBase64 = await generateQrCard(img);
      const qrCardUrl = await repo.uploadImage('branding/qr-card.png', qrCardBase64);
      
      const newConfig = { ...config, qrCardUrl };
      setConfig(newConfig);
      await repo.saveDesignConfig(newConfig);
      // Sincronizar caché local
      localStorage.setItem('design_config_cache', JSON.stringify(newConfig));
      setToast('Tarjeta QR regenerada y subida a la nube');
    } catch (err) {
      console.error('Error al generar QR manual:', err);
      alert('No se pudo generar la tarjeta QR. Verifica que el logotipo sea válido.');
    } finally {
      setProcessing(false);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const secondary = calculateSecondaryColor(newHex);
    setConfig(prev => ({ 
      sourceLogoUrl: '', pwaIcon: '', adminHeaderUrl: '', faviconUrl: '', qrCardUrl: '',
      ...prev, 
      primaryColor: newHex, secondaryColor: secondary 
    } as DesignConfig));
    setRgbInput(hexToRgb(newHex));
  };

  const handleRgbChange = (field: 'r' | 'g' | 'b', value: number) => {
    // Math clamp
    const safeValue = Math.max(0, Math.min(255, value || 0));
    const newRgb = { ...rgbInput, [field]: safeValue };
    setRgbInput(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    const secondary = calculateSecondaryColor(newHex);
    setConfig(prev => ({ 
      sourceLogoUrl: '', pwaIcon: '', adminHeaderUrl: '', faviconUrl: '', qrCardUrl: '',
      ...prev, 
      primaryColor: newHex, secondaryColor: secondary 
    } as DesignConfig));
  };

  const handleTextHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setConfig(prev => ({ 
      sourceLogoUrl: '', pwaIcon: '', adminHeaderUrl: '', faviconUrl: '', qrCardUrl: '',
      ...prev, 
      primaryTextColor: newHex 
    } as DesignConfig));
    setTextRgbInput(hexToRgb(newHex));
  };

  const handleTextRgbChange = (field: 'r' | 'g' | 'b', value: number) => {
    const safeValue = Math.max(0, Math.min(255, value || 0));
    const newRgb = { ...textRgbInput, [field]: safeValue };
    setTextRgbInput(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setConfig(prev => ({ 
      sourceLogoUrl: '', pwaIcon: '', adminHeaderUrl: '', faviconUrl: '', qrCardUrl: '',
      ...prev, 
      primaryTextColor: newHex 
    } as DesignConfig));
  };

  const handleBgHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setConfig(prev => ({ 
      sourceLogoUrl: '', pwaIcon: '', adminHeaderUrl: '', faviconUrl: '', qrCardUrl: '',
      ...prev, 
      backgroundColor: newHex 
    } as DesignConfig));
    setBgRgbInput(hexToRgb(newHex));
  };

  const handleBgRgbChange = (field: 'r' | 'g' | 'b', value: number) => {
    const safeValue = Math.max(0, Math.min(255, value || 0));
    const newRgb = { ...bgRgbInput, [field]: safeValue };
    setBgRgbInput(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setConfig(prev => ({ 
      sourceLogoUrl: '', pwaIcon: '', adminHeaderUrl: '', faviconUrl: '', qrCardUrl: '',
      ...prev, 
      backgroundColor: newHex 
    } as DesignConfig));
  };

  const saveColors = async () => {
    if (!config) return;
    setSavingColors(true);
    try {
      await repo.saveDesignConfig(config);
      // Sincronizar caché local inmediatamente
      localStorage.setItem('design_config_cache', JSON.stringify(config));
      setToast('Identidad visual desplegada en el ecosistema');
    } catch (err) {
      console.error('Error al guardar colores:', err);
      alert('Error: No se pudo actualizar el diseño en la nube.');
    } finally {
      setSavingColors(false);
      setTimeout(() => setToast(''), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Cargando laboratorio gráfico y paletas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
        <ShieldAlert size={48} style={{ margin: '0 auto 1rem' }} />
        <h3>Acceso Restringido</h3>
        <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>{error}</p>
        <button className="btn-primary" style={{ marginTop: '1.5rem', background: '#eab308', color: '#111' }} onClick={() => window.location.reload()}>Reintentar Carga</button>
      </div>
    );
  }

  const actPrimary = config?.primaryColor || '#3b82f6';
  const actSecondary = config?.secondaryColor || '#2563eb';
  const actText = config?.primaryTextColor || '#ffffff';
  const actBg = config?.backgroundColor || '#f3f4f6';
  const actFont = config?.fontFamily || "'Inter', sans-serif";

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', color: '#fff' }}>
      
      {/* SECCIÓN COLORES Y TIPOGRAFÍA */}
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>
        <Palette size={24} /> Identidad Corporativa (Live Theme)
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Configura los colores base y la familia tipográfica. El motor CSS orquestará la inyección dinámica modificando al instante portales y menús de acceso.
      </p>

      <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151', marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.9rem' }}>Color Principal de Botón (Pantone Hexadecimal)</label>
          <input 
            type="color" 
            value={actPrimary} 
            onChange={handleHexChange}
            style={{ width: '100%', height: '50px', cursor: 'pointer', background: 'transparent', border: 'none', padding: '0', borderRadius: '8px' }}
          />

          <label style={{ display: 'block', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.9rem' }}>Input RGB Manual (Rojo ; Verde ; Azul)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <input type="number" min="0" max="255" value={rgbInput.r} onChange={e => handleRgbChange('r', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
            <input type="number" min="0" max="255" value={rgbInput.g} onChange={e => handleRgbChange('g', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
            <input type="number" min="0" max="255" value={rgbInput.b} onChange={e => handleRgbChange('b', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
          </div>

          <label style={{ display: 'block', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.9rem' }}>Color Texto del Botón (Hex)</label>
          <input 
            type="color" 
            value={actText} 
            onChange={handleTextHexChange}
            style={{ width: '100%', height: '50px', cursor: 'pointer', background: 'transparent', border: 'none', padding: '0', borderRadius: '8px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input type="number" min="0" max="255" value={textRgbInput.r} onChange={e => handleTextRgbChange('r', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
            <input type="number" min="0" max="255" value={textRgbInput.g} onChange={e => handleTextRgbChange('g', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
            <input type="number" min="0" max="255" value={textRgbInput.b} onChange={e => handleTextRgbChange('b', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
          </div>

          <label style={{ display: 'block', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.9rem' }}>Color de Fondo Tapiz Web (Hex)</label>
          <input 
            type="color" 
            value={actBg} 
            onChange={handleBgHexChange}
            style={{ width: '100%', height: '50px', cursor: 'pointer', background: 'transparent', border: 'none', padding: '0', borderRadius: '8px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input type="number" min="0" max="255" value={bgRgbInput.r} onChange={e => handleBgRgbChange('r', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
            <input type="number" min="0" max="255" value={bgRgbInput.g} onChange={e => handleBgRgbChange('g', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
            <input type="number" min="0" max="255" value={bgRgbInput.b} onChange={e => handleBgRgbChange('b', parseInt(e.target.value))} style={{ padding: '0.5rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
          </div>

          <label style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Type size={14} /> Tipografía Principal</label>
          <select 
            value={actFont} 
            onChange={e => {
              const newFont = e.target.value;
              setConfig(prev => ({ 
                sourceLogoUrl: '', pwaIcon: '', adminHeaderUrl: '', faviconUrl: '', qrCardUrl: '',
                ...prev, 
                fontFamily: newFont 
              } as DesignConfig));
            }}
            style={{ width: '100%', padding: '0.75rem', background: '#1f2937', border: '1px solid #4b5563', color: '#fff', borderRadius: '8px', outline: 'none' }}
          >
            <option value="'Inter', sans-serif">1. Inter (Moderna y Limpia) - Por efecto</option>
            <option value="'Playfair Display', serif">2. Playfair Display (Elegante y Clásica)</option>
            <option value="'Outfit', sans-serif">3. Outfit (Geométrica y Tecnológica)</option>
            <option value="'Gochi Hand', cursive">4. Gochi Hand (Estilo Cómic / Divertido)</option>
            <option value="'Cinzel', serif">5. Cinzel (Estilo Cinematográfico)</option>
          </select>

          <button onClick={saveColors} disabled={savingColors} style={{ marginTop: '2.5rem', padding: '0.75rem 2rem', background: '#eab308', color: '#111', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
             {savingColors ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
             Confirmar Diseño Corporativo
          </button>
        </div>

        <div style={{ padding: '2rem', background: actBg, borderRadius: '8px', border: '1px dashed #4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#111827', fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', opacity: 0.8 }}>Simulador de Tapiz y Botón</p>

          <div style={{ fontFamily: actFont, fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <span style={{ color: '#111827' }}>Tu Estilo Define tu Marca</span>
          </div>
          
          <button style={{
            background: actPrimary,
            color: actText,
            fontFamily: actFont,
            padding: '1rem 2.5rem',
            borderRadius: '12px',
            border: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: `0 4px 14px 0 ${actPrimary}40`,
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = actSecondary; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseOut={(e) => { e.currentTarget.style.background = actPrimary; e.currentTarget.style.transform = 'translateY(0px)' }}
          >
            Reservar Cita
          </button>

          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '1.5rem', textAlign: 'center' }}>
             Primario: {actPrimary.toUpperCase()}<br/>
             Sombra Mágica CSS: {actSecondary.toUpperCase()}
          </p>
        </div>
      </div>


      {/* SECCIÓN IMÁGENES */}
      <hr style={{ borderColor: '#374151', margin: '3rem 0' }} />

      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>
        <UploadCloud size={24} /> Laboratorio de Vectores
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Sube única y exclusivamente el logotipo maestro en formato cuadrado (idealmente 512x512 PNG transparente). El motor de procesamiento local recortará, optimizará y generará las 4 variantes necesarias de manera automática sin saturar la Base de Datos.
      </p>

      <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '1px dashed #4b5563', marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.9rem' }}>URL de Destino para Código QR Impreso</label>
          <input 
            type="text" 
            value={qrUrl} 
            onChange={e => setQrUrl(e.target.value)} 
            placeholder="https://miturno.app"
            style={{ width: '100%', padding: '0.75rem', background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '6px' }}
          />
        </div>
        
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: '2px dashed #eab308', borderRadius: '8px', cursor: processing ? 'wait' : 'pointer', background: 'rgba(234, 179, 8, 0.05)', transition: 'all 0.2s' }}>
          {processing ? (
            <>
              <Loader2 className="animate-spin" size={32} color="#eab308" style={{ marginBottom: '1rem' }} />
              <span style={{ color: '#eab308' }}>Procesando Vectores y Generando Assets...</span>
            </>
          ) : (
            <>
              <UploadCloud size={32} color="#eab308" style={{ marginBottom: '1rem' }} />
              <span style={{ color: '#eab308', fontWeight: 'bold' }}>Instalar Logotipo (PNG)</span>
              <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleFileUpload} disabled={processing} />
            </>
          )}
        </label>
      </div>

      {config?.pwaIcon && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
              <h4 style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle size={16} color="#10b981" /> Icono PWA (512x512)
              </h4>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
                <img src={config.pwaIcon} alt="PWA Icon" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>Auto-optimizado para Instalación Móvil</p>
            </div>

            <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
              <h4 style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle size={16} color="#10b981" /> Favicon (32x32)
              </h4>
              <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                <img src={config.faviconUrl} alt="Favicon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>Icono de Pestaña del Navegador</p>
            </div>

            <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
              <h4 style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle size={16} color="#10b981" /> Cabecera ADMIN (200x50)
              </h4>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
                <img src={config.adminHeaderUrl} alt="Admin Header" style={{ width: '200px', height: '50px', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>Redimensionado para TopBar Corporativo</p>
            </div>
          </div>
        </>
      )}

      {/* SECCIÓN PREVIA DE QR (Visible siempre) */}
      <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151', marginTop: '2rem' }}>
        <h4 style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <QrCode size={16} color="#eab308" /> Cartel de Instalación QR (Molde de Marketing)
        </h4>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', flex: 1, minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {config?.qrCardUrl ? (
              <img src={config.qrCardUrl} alt="QR Card Preview" style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <QrCode size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Sin tarjeta QR generada.<br/><small>Sube un logo primero.</small></p>
              </div>
            )}
          </div>
          <div style={{ width: '300px' }}>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.5', marginBottom: '1rem' }}>
              Esta tarjeta combina tu logotipo con el código QR de acceso. Es el activo principal para que los clientes instalen la App.
            </p>
            <button 
              onClick={handleManualQrGenerate} 
              disabled={processing}
              className="btn-primary" 
              style={{ width: '100%', padding: '0.75rem', background: '#3b82f6', borderColor: '#3b82f6', color: '#fff', fontSize: '0.9rem', cursor: 'pointer', opacity: config?.sourceLogoUrl ? 1 : 0.5 }}
            >
              {processing ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={16} />}
              {config?.qrCardUrl ? 'Regenerar Tarjeta QR' : 'Generar Tarjeta QR'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#10b981', color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 9999, fontWeight: 'bold' }}>
          <CheckCircle size={20} /> {toast}
        </div>
      )}
    </div>
  );
};

export const AdminCorePoliticas: React.FC = () => {
  const { repo } = useData();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [privacy, setPrivacy] = useState('');
  const [terms, setTerms] = useState('');

  useEffect(() => {
    repo.getCompanyData().then(data => {
      if (data) {
        setCompany(data);
        setPrivacy(data.privacyPolicy || getDefaultPrivacyPolicy(data));
        setTerms(data.termsOfUse || getDefaultTermsOfUse(data));
      }
      setLoading(false);
    });
  }, [repo]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    const updated = { ...company, privacyPolicy: privacy, termsOfUse: terms };
    await repo.saveCompanyData(updated);
    setCompany(updated);
    setSaving(false);
    setToast('Textos legales actualizados globalmente');
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', color: '#fff' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>
        <ShieldCheck size={24} /> Políticas Legales de Plataforma
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Los textos han sido pre-generados de forma estándar usando las variables proporcionadas en la pestaña "Datos Empresa". Puedes alterarlos íntegramente. Estos textos se plasmarán automáticamente en los "Footer" (pies de página) de los clientes.
      </p>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.5rem', color: '#d1d5db', fontWeight: 'bold' }}>Política de Privacidad Integral</label>
          <textarea 
            value={privacy}
            onChange={e => setPrivacy(e.target.value)}
            style={{ width: '100%', height: '400px', background: '#111827', color: '#fff', border: '1px solid #4b5563', borderRadius: '8px', padding: '1rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.5rem', color: '#d1d5db', fontWeight: 'bold' }}>Términos y Condiciones de Uso</label>
          <textarea 
            value={terms}
            onChange={e => setTerms(e.target.value)}
            style={{ width: '100%', height: '400px', background: '#111827', color: '#fff', border: '1px solid #4b5563', borderRadius: '8px', padding: '1rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem', background: '#eab308', color: '#111', borderColor: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? 'Aplicando...' : 'Fijar Contratos Legales'}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#10b981', color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 9999, fontWeight: 'bold' }}>
          <CheckCircle size={20} /> {toast}
        </div>
      )}
    </div>
  );
};

export const AdminCoreCss: React.FC = () => {
  const { repo } = useData();
  const [config, setConfig] = useState<DesignConfig | null>(null);
  const [customerCss, setCustomerCss] = useState('');
  const [adminCss, setAdminCss] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    repo.getDesignConfig().then(cfg => {
      if (cfg) {
        setConfig(cfg);
        setCustomerCss(cfg.customCssCustomer || '');
        setAdminCss(cfg.customCssAdmin || '');
      }
      setLoading(false);
    });
  }, [repo]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const updated = { 
      ...config, 
      customCssCustomer: customerCss, 
      customCssAdmin: adminCss 
    };
    await repo.saveDesignConfig(updated);
    // Sincronizar caché local inmediatamente
    localStorage.setItem('design_config_cache', JSON.stringify(updated));
    setConfig(updated);
    setSaving(false);
    setToast('Inyecciones CSS memorizadas');
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', color: '#fff' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>
        <Code size={24} /> Inyección CSS Restringida
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Este panel permite sobrescribir los estilos de la plataforma inyectando reglas CSS puras. Estos fragmentos se montarán y desmontarán de forma segura y encapsulada dependiendo del portal (`Customer` o `Admin`) que estemos visitando. (Usa variables como `var(--primary-color)` para mayor consistencia).
      </p>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>CSS para el Cliente Final (Público / Reservas)</label>
          <textarea 
            spellCheck="false"
            value={customerCss}
            onChange={e => setCustomerCss(e.target.value)}
            placeholder="/* Ejemplo: ocultar el borde de un botón */&#10;.btn-primary { border-radius: 0; }"
            style={{ width: '100%', height: '400px', background: '#111827', color: '#e5e7eb', border: '1px solid #10b981', borderRadius: '8px', padding: '1rem', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.5', fontSize: '0.9rem' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '0.5rem', color: '#3b82f6', fontWeight: 'bold' }}>CSS para el Franquiciado (Portal Admin)</label>
          <textarea 
            spellCheck="false"
            value={adminCss}
            onChange={e => setAdminCss(e.target.value)}
            placeholder="/* Ejemplo: sombrear la barra lateral */&#10;.admin-sidebar { background: #000 !important; }"
            style={{ width: '100%', height: '400px', background: '#111827', color: '#e5e7eb', border: '1px solid #3b82f6', borderRadius: '8px', padding: '1rem', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.5', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem', background: '#eab308', color: '#111', borderColor: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? 'Inyectando...' : 'Fijar CSS Directo'}
        </button>
      </div>

      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#10b981', color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 9999, fontWeight: 'bold' }}>
          <CheckCircle size={20} /> {toast}
        </div>
      )}
    </div>
  );
};

export const AdminCoreAccesos: React.FC = () => {
  const { repo } = useData();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastError, setToastError] = useState('');

  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);

  const showToastOk = (msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(''), 4000); 
  };
  
  const showError = (msg: string) => { 
    setToastError(msg); 
    setTimeout(() => setToastError(''), 4000); 
  };

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const users = await repo.getUsers();
      // Filtramos por ADMIN y por pre-registros (que también marcamos con rol ADMIN)
      setAdmins(users.filter(u => u.role === 'ADMIN'));
    } catch (err) {
      console.error('Error cargando administradores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [repo]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    setSearching(true);
    setFoundUser(null);
    try {
      const users = await repo.getUsers();
      const user = users.find(u => u.email.toLowerCase() === searchEmail.trim().toLowerCase());
      if (user) {
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          showError('Este usuario ya tiene privilegios administrativos.');
        } else {
          setFoundUser(user);
        }
      } else {
        showError('No se encontró ningún usuario registrado con ese email.');
      }
    } catch (err) {
      showError('Error al buscar usuario.');
    } finally {
      setSearching(false);
    }
  };

  const handlePromote = async () => {
    if (!foundUser) return;
    setSaving(true);
    try {
      const updated: User = { ...foundUser, role: 'ADMIN' };
      await repo.saveUser(updated);
      setFoundUser(null);
      setSearchEmail('');
      await loadAdmins();
      showToastOk(`"${updated.name}" ahora es Administrador.`);
    } catch (err: any) {
      showError('Error al promover: ' + (err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adminUser: User) => {
    if (!window.confirm(`¿Seguro que deseas eliminar definitivamente el acceso de "${adminUser.name}"?`)) return;
    
    setDeletingId(adminUser.id);
    try {
      await repo.deleteUser(adminUser.id);
      await loadAdmins();
      showToastOk(`El acceso de ${adminUser.name} ha sido eliminado.`);
    } catch (err: any) {
      showError('Error al eliminar: ' + (err?.message || ''));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (adminUser: User) => {
    const willActivate = adminUser.isActive === false;
    setTogglingId(adminUser.id);
    try {
      const updated: User = { ...adminUser, isActive: willActivate };
      await repo.saveUser(updated);
      // Update local state instead of full reload for better UX
      setAdmins(prev => prev.map(a => a.id === adminUser.id ? updated : a));
      showToastOk(`Administrador ${willActivate ? 'activado' : 'desactivado'} con éxito.`);
    } catch (err: any) {
      showError('Error al cambiar estado: ' + (err?.message || ''));
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (ts?: number) => {
    if (!ts) return <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Nunca</span>;
    return new Date(ts).toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', background: '#1f2937', borderRadius: '12px', border: '1px solid #374151', color: '#fff' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#eab308' }}>
        <Users size={24} /> Gestión de Accesos Admin
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
        Busca usuarios registrados por su correo electrónico para otorgarles privilegios de administración. También puedes gestionar los accesos existentes.
      </p>

      {/* Formulario de invitación */}
      <div style={{ background: '#111827', borderRadius: '10px', border: '1px solid #374151', padding: '1.75rem', marginBottom: '2.5rem' }}>
        <h3 style={{ color: '#d1d5db', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          <Search size={18} color="#eab308" /> Activar nuevo Administrador
        </h3>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Email del usuario ya registrado</label>
              <input 
                type="email" 
                placeholder="usuario@ejemplo.com"
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                style={{ width: '100%', background: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '0.6rem', borderRadius: '6px' }}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={searching}
              style={{ 
                background: searching ? '#374151' : '#eab308', 
                color: '#111', 
                padding: '0.6rem 1.5rem', 
                borderRadius: '6px', 
                fontWeight: 'bold', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '38px'
              }}
            >
              {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              {searching ? 'Buscando...' : 'Buscar Usuario'}
            </button>
          </div>
        </form>

        {foundUser && (
          <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#fff' }}>{foundUser.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{foundUser.email} • {foundUser.phone}</div>
            </div>
            <button 
              onClick={handlePromote}
              disabled={saving}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <UserRoundCheck size={18} />}
              Convertir en Admin
            </button>
          </div>
        )}
      </div>

      {/* Lista de administradores */}
      <div style={{ background: '#111827', borderRadius: '10px', border: '1px solid #374151', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={28} color="#eab308" />
            <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Cargando equipo de administración...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2d3748' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#d1d5db', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrador</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#d1d5db', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#d1d5db', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Último Acceso</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: '#d1d5db', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => {
                const isDisabled = admin.isActive === false;
                
                return (
                  <tr key={admin.id} style={{ borderTop: '1px solid #374151', background: isDisabled ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500, color: isDisabled ? '#9ca3af' : '#fff' }}>{admin.name}</div>
                      <div style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                        {isDisabled ? 
                          <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Cuenta Suspendida</span> : 
                          <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Activo</span>
                        }
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#9ca3af' }}>{admin.email}</td>
                    <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                      {formatDate(admin.lastAdminAccess)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleToggleActive(admin)}
                            disabled={togglingId === admin.id}
                            title={isDisabled ? "Activar acceso" : "Suspender acceso"}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDisabled ? '#10b981' : '#f59e0b', padding: '0.2rem', transition: 'transform 0.1s' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {togglingId === admin.id ? <Loader2 className="animate-spin" size={18} /> : (isDisabled ? <UserRoundCheck size={18} /> : <UserRoundX size={18} />)}
                          </button>
                        <button 
                          onClick={() => handleDelete(admin)}
                          disabled={deletingId === admin.id}
                          title="Eliminar acceso permanentemente"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem', transition: 'transform 0.1s' }}
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {deletingId === admin.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Informática de ayuda */}
      <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <ShieldCheck size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
        <div>
          <h4 style={{ color: '#93c5fd', margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}>Protocolo de Seguridad CORE</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: '1.5' }}>
            Para añadir un nuevo administrador, el usuario debe estar primero registrado en la plataforma como cliente. Búscalo por su email para elevar sus privilegios. Puedes revocar el acceso en cualquier momento desde el listado.
          </p>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#10b981', color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 9999, fontWeight: 'bold' }}>
          <CheckCircle size={20} /> {toast}
        </div>
      )}
      {toastError && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#ef4444', color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 9999, fontWeight: 'bold' }}>
          <ShieldAlert size={20} /> {toastError}
        </div>
      )}
    </div>
  );
};
