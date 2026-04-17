import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Lock, UserPlus, LogIn, ShieldAlert, Briefcase } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { CompanyData } from '../services/models';
import { LegalModal } from '../components/ui/LegalModal';

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
  const { login, register } = useAuth();
  const { mode, repo } = useData();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  React.useEffect(() => {
    repo.getCompanyData().then(setCompany);
  }, [repo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
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
  };

  const isDark = type === 'SUPER_ADMIN';

  return (
    <div className="login-page" style={isDark ? { background: '#111' } : {}}>
      <div className="login-card animate-fade-in" style={isDark ? { background: '#262626', color: '#fff', border: '1px solid #333' } : {}}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{ 
            width: '60px', 
            height: '60px', 
            background: isDark ? '#eab308' : (type === 'ADMIN' ? '#10b981' : 'var(--primary-color)'), 
            borderRadius: '15px', 
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#111' : 'white',
            boxShadow: isDark ? '0 8px 16px rgba(234, 179, 8, 0.2)' : '0 8px 16px rgba(0, 0, 0, 0.1)'
          }}>
            {type === 'SUPER_ADMIN' ? <ShieldAlert size={30} /> : type === 'ADMIN' ? <Briefcase size={30} /> : (isRegister ? <UserPlus size={30} /> : <LogIn size={30} />)}
          </div>
          <h1>{type === 'SUPER_ADMIN' ? 'ADMIN CORE' : type === 'ADMIN' ? 'Admin Portal' : (isRegister ? 'Crear Cuenta' : 'Bienvenido')}</h1>
          <p className="subtitle" style={isDark ? { color: '#a3a3a3' } : {}}>
            {type === 'SUPER_ADMIN' ? 'Ingreso maestro al sistema' : type === 'ADMIN' ? 'Gestión del negocio virtual' : (isRegister ? 'Regístrate para empezar a reservar' : 'Inicia sesión para gestionar tus citas')}
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

          <div className="form-group">
            <label><Lock size={14} style={{ marginRight: '4px' }} /> Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

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

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', background: isDark ? '#eab308' : undefined, borderColor: isDark ? '#eab308' : undefined, color: isDark ? '#111' : undefined }}>
            {isRegister ? 'Registrarse ahora' : 'Entrar'}
          </button>
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

        {!isRegister && mode !== 'firebase' && (
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
            
            <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Condiciones de Uso" content={company.termsOfUse || ''} />
            <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Política de Privacidad" content={company.privacyPolicy || ''} />
          </div>
        )}
      </div>
    </div>
  );
};
