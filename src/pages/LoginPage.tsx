import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      const ok = await register({ name, email, phone }, password);
      if (ok) {
        navigate('/booking'); // Clientes van a reservas
      } else {
        setError('Error al registrar. El email podría ya estar en uso.');
      }
    } else {
      const ok = await login(email, password);
      if (ok) {
        // La redirección inteligente se hará en App.tsx o aquí
        // Por ahora redirigimos según rol manualmente si queremos ser rápidos
        if (email.toLowerCase().includes('admin')) {
          navigate('/');
        } else {
          navigate('/booking');
        }
      } else {
        setError('Credenciales incorrectas');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in">
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{ 
            width: '60px', 
            height: '60px', 
            background: 'var(--primary-color)', 
            borderRadius: '15px', 
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
          }}>
            {isRegister ? <UserPlus size={30} /> : <LogIn size={30} />}
          </div>
          <h1>{isRegister ? 'Crear Cuenta' : 'Bienvenido'}</h1>
          <p className="subtitle">{isRegister ? 'Regístrate para empezar a reservar' : 'Inicia sesión para gestionar tus citas'}</p>
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

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
            {isRegister ? 'Registrarse ahora' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            className="btn-text" 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>

        {!isRegister && (
          <div className="login-demo" style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'var(--bg-color)', 
            borderRadius: '10px',
            fontSize: '0.8rem',
            opacity: 0.8
          }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Acceso rápido (Demo):</p>
            <p>Admin: <code>admin@demo.com</code> / <code>admin</code></p>
          </div>
        )}
      </div>
    </div>
  );
};
