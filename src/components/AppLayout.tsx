import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Settings, 
  User as UserIcon, 
  LogOut,
  Database,
  Cloud
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { mode, switchMode } = useData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Top Bar */}
      <header className="app-topbar">
        <div className="app-topbar__brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Gestor de Reservas
          <span>v2.0</span>
        </div>
        <div className="app-topbar__actions">
          {/* Toggle DB Mode */}
          <div className="data-toggle">
            <button
              className={mode === 'local' ? 'active' : ''}
              onClick={() => switchMode('local')}
            >
              <Database size={14} /> Local
            </button>
            <button
              className={mode === 'firebase' ? 'active' : ''}
              onClick={() => switchMode('firebase')}
            >
              <Cloud size={14} /> Nube
            </button>
          </div>

          {user && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <NavLink to="/profile" className="app-topbar__user" style={{ textDecoration: 'none' }}>
                <UserIcon size={16} />
                {user.name}
              </NavLink>
              <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="app-container" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <nav className="admin-sidebar glass-panel">
          {isAdmin ? (
            <>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                <LayoutDashboard size={18} /> Panel Control
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
                <Users size={18} /> Gestión Clientes
              </NavLink>
              <NavLink to="/booking" className={({ isActive }) => isActive ? 'active' : ''}>
                <Calendar size={18} /> Agenda/Citas
              </NavLink>
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                <NavLink to="/super-admin" className={({ isActive }) => isActive ? 'active' : ''}>
                  <Settings size={18} /> Super Admin
                </NavLink>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/booking" className={({ isActive }) => isActive ? 'active' : ''}>
                <Calendar size={18} /> Reservar Cita
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                <Users size={18} /> Mis Citas
              </NavLink>
            </>
          )}
        </nav>
        
        <main className="app-content" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: isAdmin ? '100%' : '1000px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
