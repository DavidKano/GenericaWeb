import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Lock, UserPlus, LogIn, ShieldAlert, Briefcase, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { CompanyData, DesignConfig } from '../services/models';
import { LegalModal } from '../components/ui/LegalModal';
import { getDefaultPrivacyPolicy, getDefaultTermsOfUse } from '../services/policyDefaults';
import { ConnessiaFooter } from '../components/ui/ConnessiaFooter';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const { login, register, resetPassword, loginWithGoogle } = useAuth();
  const { mode, repo } = useData();
  const [company, setCompany] = useState<CompanyData | null>(() => {
    try {
      const cache = localStorage.getItem('company_data_cache');
      return cache ? JSON.parse(cache) : null;
    } catch (e) {
      return null;
    }
  });
  const [design, setDesign] = useState<DesignConfig | null>(() => {
    try {
      const cache = localStorage.getItem('design_config_cache');
      return cache ? JSON.parse(cache) : null;
    } catch (e) {
      return null;
    }
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
        try {
          const ok = await register({ name, email, phone }, password);
          if (!ok) {
            setError('Error al registrar usuario.');
          }
        } catch (err: any) {
          setError(err.message);
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
  
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await loginWithGoogle();
      if (!ok) {
        setError('No se pudo iniciar sesión con Google.');
      }
    } catch (err: any) {
      setError(err.message || 'Error en Google Login');
    } finally {
      setLoading(false);
    }
  };

  const isDark = type === 'SUPER_ADMIN';

  return (
    <div className="login-page" style={isDark ? { background: '#111' } : {}}>
      <div className="login-card animate-fade-in" style={isDark ? { background: '#262626', color: '#fff', border: '1px solid #333' } : {}}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={(type === 'CUSTOMER' || type === 'ADMIN') && design?.sourceLogoUrl ? {
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
            {(type === 'CUSTOMER' || type === 'ADMIN') && design?.sourceLogoUrl ? (
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
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {isRegister && (
            <div className="form-group">
              <label><Lock size={14} style={{ marginRight: '4px' }} /> Confirmar Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
              style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', background: isDark ? '#eab308' : undefined, borderColor: isDark ? '#eab308' : undefined, color: isDark ? '#111' : undefined, fontFamily: 'inherit' }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }} />
              ) : (
                isForgotPassword ? 'Enviar enlace de recuperación' : (isRegister ? 'Registrarse ahora' : 'Entrar')
              )}
            </button>
          )}

          {!isForgotPassword && type === 'CUSTOMER' && (
            <>
              <div className="login-divider" style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.06)' }}></div>
                <span style={{ padding: '0 10px', opacity: 0.8 }}>o continúa con</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.06)' }}></div>
              </div>

              <button 
                className="btn-google"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#3C4043',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (loading) return;
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)';
                }}
                onMouseLeave={(e) => {
                  if (loading) return;
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </>
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
          <div className="register-prompt" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {isRegister ? (
              <span style={{ color: '#64748B' }}>
                ¿Ya tienes cuenta?{' '}
                <button 
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  Inicia sesión
                </button>
              </span>
            ) : (
              <span style={{ color: '#64748B' }}>
                ¿No tienes cuenta?{' '}
                <button 
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  Regístrate gratis
                </button>
              </span>
            )}
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
          <div className="login-footer" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: isDark ? '#6b7280' : 'var(--text-secondary)' }}>
            <span style={{ display: 'block', marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} {company.nombreEmpresa}</span>
            <div className="login-legal-links" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: 0.8, marginBottom: '0.5rem' }}>
              <button type="button" onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Condiciones de Uso</button>
              <span>|</span>
              <button type="button" onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Política de Privacidad</button>
            </div>
            
            <ConnessiaFooter isDark={isDark} compact />

            <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Condiciones de Uso" content={company.termsOfUse || getDefaultTermsOfUse(company)} />
            <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Política de Privacidad" content={company.privacyPolicy || getDefaultPrivacyPolicy(company)} />
          </div>
        )}
      </div>
    </div>
  );
};
