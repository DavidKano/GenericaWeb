import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { DownloadIcon, ArrowRight, Smartphone, Star, Loader2, Apple } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const { repo } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appName, setAppName] = useState('Mi App de Reservas');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [logoUrl, setLogoUrl] = useState('');
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed / running as standalone
    const _isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (_isStandalone) {
      navigate('/booking', { replace: true });
    }

    // 2. Detect iOS
    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOSDevice = isIPad || isIPhone;
    const isSafari = isIOSDevice && webkit && !ua.match(/CriOS/i) && !ua.match(/FxiOS/i);
    
    setIsIOS(isIOSDevice);
    setIsSafariBrowser(isSafari);

    // 3. Listen for Android installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // 4. Load info
    const loadInfo = async () => {
      try {
        const [company, design] = await Promise.all([
          repo.getCompanyData(),
          repo.getDesignConfig()
        ]);
        
        if (company && company.nombreEmpresa) setAppName(company.nombreEmpresa);
        if (design && design.primaryColor) setPrimaryColor(design.primaryColor);
        if (design && design.pwaIcon) setLogoUrl(design.pwaIcon);
      } catch (err) {
        console.error('Error precargando datos en WelcomePage:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInfo();
  }, [navigate, repo]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
    }
  };

  const handleSkip = () => {
    navigate('/booking');
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <Loader2 className="animate-spin" size={40} color={primaryColor} />
      </div>
    );
  }

  // Si no se puede instalar nativamente (o es escritorio general), igual mostramos la UI pero el botón de instalar puede que no funcione si deferredPrompt es null.
  // Pero lo manejamos para Android.

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', fontFamily: 'var(--font-family, serif)' }}>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Logo */}
        <div style={{ width: '120px', height: '120px', borderRadius: '30px', background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', overflow: 'hidden' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="App Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Smartphone size={60} color={primaryColor} />
          )}
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem', lineHeight: '1.2' }}>
          Instala la App de <br />
          <span style={{ color: primaryColor }}>{appName}</span>
        </h1>

        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: '1.6' }}>
          Reserva tus citas más rápido, recibe recordatorios y accede a tus servicios favoritos en un toque.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', justifyContent: 'center', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '0.5rem' }}>
              <Star size={24} color="#f59e0b" fill="#f59e0b" />
            </div>
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Gratis</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '0.5rem' }}>
              <Smartphone size={24} color={primaryColor} />
            </div>
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Sin descargas</span>
          </div>
        </div>

        {/* Botón Principal Instalación */}
        {isIOS ? (
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', width: '100%', textAlign: 'left', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
               <Apple size={20} /> Para instalar en iPhone:
            </h3>

            {!isSafariBrowser && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef3c7', color: '#d97706', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                ⚠️ Abre este enlace usando el navegador Safari para instalar la App.
              </div>
            )}

            <ol style={{ paddingLeft: '1.5rem', color: '#475569', margin: 0, lineHeight: '1.8' }}>
              <li>En Safari, toca el botón <b>Compartir</b> <span style={{display:'inline-block', width:'24px', height:'24px', verticalAlign:'middle', background:'url(https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/arrow-up-from-bracket.svg) center/contain no-repeat', opacity: 0.6}}></span> en la barra inferior.</li>
              <li>Selecciona <b>"Añadir a pantalla de inicio"</b> <span style={{display:'inline-block', width:'20px', height:'20px', verticalAlign:'middle', background:'url(https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/plus-square.svg) center/contain no-repeat', opacity: 0.6}}></span>.</li>
            </ol>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            style={{ 
              background: deferredPrompt ? primaryColor : '#cbd5e1', 
              color: '#fff', 
              border: 'none', 
              padding: '1rem 2rem', 
              borderRadius: '50px', 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.8rem',
              cursor: deferredPrompt ? 'pointer' : 'not-allowed',
              boxShadow: deferredPrompt ? `0 8px 20px ${primaryColor}66` : 'none',
              transition: 'all 0.3s'
            }}
          >
            <DownloadIcon size={24} /> 
            {deferredPrompt ? 'Instalar Aplicación' : 'La App ya está lista'}
          </button>
        )}

        {/* Skip button a la versión web */}
        <button 
          onClick={handleSkip}
          style={{ 
            marginTop: '1.5rem', 
            background: 'transparent', 
            border: 'none', 
            color: '#64748b', 
            fontSize: '1rem', 
            fontWeight: '600', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem'
          }}
        >
          Continuar desde el navegador <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
};
