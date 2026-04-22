import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Lock, UserPlus, LogIn, ShieldAlert, Briefcase, CheckCircle, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { CompanyData, DesignConfig } from '../services/models';
import { LegalModal } from '../components/ui/LegalModal';
import { getDefaultPrivacyPolicy, getDefaultTermsOfUse } from '../services/policyDefaults';

interface LoginPageProps {
  type?: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
}

export const LoginPage: React.FC<LoginPageProps> = ({ type = 'CUSTOMER' }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const { login, register, resetPassword } = useAuth();
  const { mode, repo } = useData();
  const [company, setCompany] = useState<CompanyData | null>(() => {
    const cache = localStorage.getItem('company_data_cache');
    return cache ? JSON.parse(cache) : null;
  });
  const [design, setDesign] = useState<DesignConfig | null>(() => {
    const cache = localStorage.getItem('design_config_cache');
    return cache ? JSON.parse(cache) : null;
  });
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [c, d] = await Promise.all([
          repo.getCompanyData(),
          repo.getDesignConfig()
        ]);
        if (c) {
          setCompany(c);
          localStorage.setItem('company_data_cache', JSON.stringify(c));
        }
        if (d) {
          setDesign(d);
          localStorage.setItem('design_config_cache', JSON.stringify(d));
        }
      } catch (err) {
        console.error("Error loading LoginPage theme data:", err);
      }
    };
    loadData();
  }, [repo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const ok = await resetPassword(email);
        if (ok) {
          setResetSent(true);
        } else {
          setError('No se pudo enviar el email. Verifica que el correo sea correcto.');
        }
      } else if (isRegister) {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }
        const ok = await register({ name, email, phone }, password);
        if (!ok) {
          setError('Error al registrar. El email podría ya estar en uso.');
        }
      } else {
        const ok = await login(email, password);
        if (!ok) {
          setError('Credenciales incorrectas');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const isDark = type === 'SUPER_ADMIN';

  return (
    <div className="login-page" style={isDark ? { background: '#111' } : {}}>
      <div className="login-card animate-fade-in" style={isDark ? { background: '#262626', color: '#fff', border: '1px solid #333' } : {}}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={type === 'CUSTOMER' && design?.sourceLogoUrl ? {
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '180px',
            height: '100px'
          } : { 
            width: '60px', 
            height: '60px', 
            background: isDark ? '#eab308' : (type === 'ADMIN' ? '#10b981' : 'var(--primary-color)'), 
            borderRadius: '15px', 
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#111' : 'white',
            boxShadow: isDark ? '0 8px 16px rgba(234, 179, 8, 0.2)' : '0 8px 16px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {type === 'CUSTOMER' && design?.sourceLogoUrl ? (
              <img 
                src={design.sourceLogoUrl} 
                alt="Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              type === 'SUPER_ADMIN' ? <ShieldAlert size={30} /> : type === 'ADMIN' ? <Briefcase size={30} /> : (isForgotPassword ? <Mail size={30} /> : isRegister ? <UserPlus size={30} /> : <LogIn size={30} />)
            )}
          </div>
          <h1>{type === 'SUPER_ADMIN' ? 'ADMIN CORE' : type === 'ADMIN' ? 'Admin Portal' : (isForgotPassword ? 'Recuperar Contraseña' : isRegister ? 'Crear Cuenta' : 'Bienvenido')}</h1>
          <p className="subtitle" style={isDark ? { color: '#a3a3a3' } : {}}>
            {type === 'SUPER_ADMIN' ? 'Ingreso maestro al sistema' : type === 'ADMIN' ? 'Gestión del negocio virtual' : (isForgotPassword ? 'Te enviaremos un email para restablecerla' : isRegister ? 'Regístrate para empezar a reservar' : 'Inicia sesión para gestionar tus citas')}
          </p>
        </div>

        {error && (
          <div className="login-error" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {isRegister && (
            <>
              <div className="form-group">
                <label><User size={14} style={{ marginRight: '4px' }} /> Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
              <div className="form-group">
                <label><Phone size={14} style={{ marginRight: '4px' }} /> Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="600 000 000"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label><Mail size={14} style={{ marginRight: '4px' }} /> Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          {!isForgotPassword && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label><Lock size={14} style={{ marginRight: '4px' }} /> Contraseña</label>
                {!isRegister && type === 'CUSTOMER' && (
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {isRegister && (
            <div className="form-group">
              <label><Lock size={14} style={{ marginRight: '4px' }} /> Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {isForgotPassword && resetSent ? (
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle size={24} style={{ marginBottom: '0.5rem' }} />
              <p>Email enviado. Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                style={{ marginTop: '1rem', background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
              >
                Volver al Login
              </button>
            </div>
          ) : (
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', background: isDark ? '#eab308' : undefined, borderColor: isDark ? '#eab308' : undefined, color: isDark ? '#111' : undefined }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }} />
              ) : (
                isForgotPassword ? 'Enviar enlace de recuperación' : (isRegister ? 'Registrarse ahora' : 'Entrar')
              )}
            </button>
          )}

          {isForgotPassword && !resetSent && (
            <button 
              type="button" 
              className="btn-link" 
              onClick={() => { setIsForgotPassword(false); setError(''); }}
              style={{ marginTop: '0.5rem', color: isDark ? '#a3a3a3' : 'var(--text-secondary)', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Volver al inicio de sesión
            </button>
          )}
        </form>

        {type === 'CUSTOMER' && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              className="btn-text" 
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}
            >
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
            </button>
          </div>
        )}

        {!isRegister && mode === 'local' && import.meta.env.DEV && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <div className="login-demo" style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: isDark ? '#1a1a1a' : 'var(--bg-color)', 
            borderRadius: '10px',
            fontSize: '0.8rem',
            opacity: 0.8
          }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Accesos de desarrollo (se autodestruirán en prod):</p>
            {type === 'CUSTOMER' && <p>Cliente: <code>cliente@demo.com</code> / <code>cliente</code></p>}
            {type === 'ADMIN' && <p>Admin: <code>admin@demo.com</code> / <code>admin</code></p>}
            {type === 'SUPER_ADMIN' && <p>SuperAdmin: <code>superadmin@demo.com</code> / <code>superadmin</code></p>}
          </div>
        )}
        {company && (
          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: isDark ? '#6b7280' : 'var(--text-secondary)' }}>
            <span style={{ display: 'block', marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} {company.nombreEmpresa}</span>
            <button type="button" onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, margin: '0 0.5rem' }}>Condiciones de Uso</button>
            |
            <button type="button" onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, margin: '0 0.5rem' }}>Política de Privacidad</button>
            
            <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Condiciones de Uso" content={company.termsOfUse || getDefaultTermsOfUse(company)} />
            <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Política de Privacidad" content={company.privacyPolicy || getDefaultPrivacyPolicy(company)} />
          </div>
        )}
      </div>
    </div>
  );
};
