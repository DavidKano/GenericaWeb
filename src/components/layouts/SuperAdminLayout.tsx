import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User as UserIcon, LogOut, Briefcase, Paintbrush, ShieldCheck, Code, Users, ExternalLink, Mail, Menu, X, FileSpreadsheet } from 'lucide-react';
import { ConnessiaFooter } from '../ui/ConnessiaFooter';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login');
  };

  return (
    <div className="app-layout" style={{ '--primary-color': '#111', '--primary-hover': '#333' } as any}>
      {/* Top Bar with deep dark look representing high access */}
      <header className="app-topbar" style={{ background: '#111827', color: '#fff', borderBottom: '1px solid #374151', padding: '0.75rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isMobile && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn-icon"
              style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <div className="app-topbar__brand" onClick={() => navigate('/superadmin')} style={{ cursor: 'pointer', color: '#eab308', letterSpacing: '1px', fontWeight: 'bold' }}>
            <ShieldAlert size={20} style={{ marginRight: '0.5rem' }}/> {isMobile ? 'CORE' : 'ADMIN CORE'}
          </div>
        </div>
        <div className="app-topbar__actions">
          {user && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                onClick={() => window.open('/admin', '_blank')}
                style={{ 
                  marginRight: '0.5rem', 
                  background: 'rgba(234, 179, 8, 0.1)', 
                  border: '1px solid #eab308', 
                  color: '#eab308',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)'}
              >
                <ExternalLink size={14} /> Abrir Panel Admin
              </button>
              <div className="app-topbar__user" style={{ textDecoration: 'none', cursor: 'default', color: '#9ca3af' }}>
                <UserIcon size={16} />
                {user.name} (Administrador CORE)
              </div>
              <button className="btn-logout" onClick={handleLogout} title="Cerrar sistema" style={{ color: '#eab308' }}>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="app-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#1f2937', position: 'relative' }}>
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && isMenuOpen && (
          <div 
            onClick={() => setIsMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />
        )}

        <nav 
          className="admin-sidebar glass-panel" 
          style={{ 
            display: (isMobile && !isMenuOpen) ? 'none' : 'flex',
            position: isMobile ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 101,
            width: '260px',
            boxShadow: isMobile ? '10px 0 30px rgba(0,0,0,0.3)' : 'none',
            background: '#111827', 
            borderRight: '1px solid #374151',
            flexDirection: 'column',
            gap: '0.25rem',
            paddingTop: '1rem',
            animation: isMobile ? 'slideRight 0.3s ease' : 'none'
          }}
        >
          <NavLink to="/superadmin/datos" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => isMobile && setIsMenuOpen(false)} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Briefcase size={18} /> Datos de la Empresa
          </NavLink>
          <NavLink to="/superadmin/diseno" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => isMobile && setIsMenuOpen(false)} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Paintbrush size={18} /> Ajustes Diseño
          </NavLink>
          <NavLink to="/superadmin/politicas" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => isMobile && setIsMenuOpen(false)} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <ShieldCheck size={18} /> Políticas
          </NavLink>
          <NavLink to="/superadmin/accesos" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => isMobile && setIsMenuOpen(false)} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Users size={18} /> Accesos Admin
          </NavLink>
          <NavLink to="/superadmin/css" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => isMobile && setIsMenuOpen(false)} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Code size={18} /> CSS Personalizado
          </NavLink>
          <NavLink to="/superadmin/email" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => isMobile && setIsMenuOpen(false)} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Mail size={18} /> Email Bienvenida
          </NavLink>
          <NavLink to="/superadmin/importar" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => isMobile && setIsMenuOpen(false)} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <FileSpreadsheet size={18} /> Importar servicios
          </NavLink>
        </nav>
        
        <main className="app-content" style={{ flex: 1, padding: isMobile ? '1rem' : '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto', flex: 1, width: '100%' }}>
            <Outlet />
          </div>
          <ConnessiaFooter />
        </main>
      </div>

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
