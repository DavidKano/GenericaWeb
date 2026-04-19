import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User as UserIcon, LogOut, QrCode, Clock, Megaphone } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { DesignConfig, CompanyData } from '../../services/models';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { repo } = useData();
  const navigate = useNavigate();
  const [design, setDesign] = React.useState<DesignConfig | null>(null);
  const [company, setCompany] = React.useState<CompanyData | null>(null);

  React.useEffect(() => {
    repo.getDesignConfig().then(setDesign);
    repo.getCompanyData().then(setCompany);
  }, [repo]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="app-layout">
      {design?.customCssAdmin && <style dangerouslySetInnerHTML={{ __html: design.customCssAdmin }} />}
      {/* Top Bar */}
      <header className="app-topbar admin-portal-topbar">
        <div className="app-topbar__brand" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
          Workspace Admin
        </div>
        <div className="app-topbar__actions">
          <a 
            href={`mailto:${company?.supportEmail || ''}?subject=Consulta Técnica de ${user?.name || 'Admin'}`}
            className="btn-text"
            style={{ fontSize: '0.85rem', color: design?.primaryColor || 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontWeight: 600, marginRight: '0.5rem' }}
          >
            Contactar Soporte Técnico
          </a>
          {user && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="app-topbar__user" style={{ textDecoration: 'none', cursor: 'default' }}>
                <UserIcon size={16} />
                {user.name} (Dueño)
              </div>
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
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} end>
            <LayoutDashboard size={18} /> Panel Control
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
            <Users size={18} /> Gestión Clientes
          </NavLink>
          <NavLink to="/admin/schedule" className={({ isActive }) => isActive ? 'active' : ''}>
            <Clock size={18} /> Horarios y Bloqueos
          </NavLink>
          <NavLink to="/admin/offers" className={({ isActive }) => isActive ? 'active' : ''}>
            <Megaphone size={18} /> Ofertas y Promos
          </NavLink>
          <NavLink to="/admin/promote" className={({ isActive }) => isActive ? 'active' : ''}>
            <QrCode size={18} /> Promocionar App
          </NavLink>
        </nav>
        
        <main className="app-content" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
