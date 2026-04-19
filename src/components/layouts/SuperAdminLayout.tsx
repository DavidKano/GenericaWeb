import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User as UserIcon, LogOut, Briefcase, Paintbrush, ShieldCheck, Code, Users } from 'lucide-react';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login');
  };

  return (
    <div className="app-layout" style={{ '--primary-color': '#111', '--primary-hover': '#333' } as any}>
      {/* Top Bar with deep dark look representing high access */}
      <header className="app-topbar" style={{ background: '#111827', color: '#fff', borderBottom: '1px solid #374151' }}>
        <div className="app-topbar__brand" onClick={() => navigate('/superadmin')} style={{ cursor: 'pointer', color: '#eab308', letterSpacing: '1px', fontWeight: 'bold' }}>
          <ShieldAlert size={20} style={{ marginRight: '0.5rem' }}/> ADMIN CORE
        </div>
        <div className="app-topbar__actions">
          {user && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
      <div className="app-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#1f2937' }}>
        <nav className="admin-sidebar glass-panel" style={{ background: '#111827', borderRight: '1px solid #374151' }}>
          <NavLink to="/superadmin/datos" className={({ isActive }) => isActive ? 'active' : ''} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Briefcase size={18} /> Datos de la Empresa
          </NavLink>
          <NavLink to="/superadmin/diseno" className={({ isActive }) => isActive ? 'active' : ''} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Paintbrush size={18} /> Ajustes Diseño
          </NavLink>
          <NavLink to="/superadmin/politicas" className={({ isActive }) => isActive ? 'active' : ''} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <ShieldCheck size={18} /> Políticas
          </NavLink>
          <NavLink to="/superadmin/accesos" className={({ isActive }) => isActive ? 'active' : ''} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Users size={18} /> Accesos Admin
          </NavLink>
          <NavLink to="/superadmin/css" className={({ isActive }) => isActive ? 'active' : ''} style={({isActive}) => ({ color: isActive ? '#eab308' : '#9ca3af', borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent', background: isActive ? 'rgba(234, 179, 8, 0.1)' : 'transparent'})}>
             <Code size={18} /> CSS Personalizado
          </NavLink>
        </nav>
        
        <main className="app-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
