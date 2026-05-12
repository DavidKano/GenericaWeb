import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User as UserIcon, LogOut, QrCode, Clock, Megaphone, Menu, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { DesignConfig, CompanyData } from '../../services/models';
import { ConnessiaFooter } from '../ui/ConnessiaFooter';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { repo } = useData();
  const navigate = useNavigate();
  const [design, setDesign] = React.useState<DesignConfig | null>(null);
  const [company, setCompany] = React.useState<CompanyData | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    repo.getDesignConfig().then(setDesign);
    repo.getCompanyData().then(setCompany);
    return () => window.removeEventListener('resize', handleResize);
  }, [repo]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: "/admin", icon: <LayoutDashboard size={18} />, label: "Panel Control", end: true },
    { to: "/admin/users", icon: <Users size={18} />, label: "Gestión Clientes" },
    { to: "/admin/schedule", icon: <Clock size={18} />, label: "Horarios y Bloqueos" },
    { to: "/admin/offers", icon: <Megaphone size={18} />, label: "Ofertas y Promos" },
    { to: "/admin/promote", icon: <QrCode size={18} />, label: "Promocionar App" },
  ];

  return (
    <div className="app-layout">
      {design?.customCssAdmin && <style dangerouslySetInnerHTML={{ __html: design.customCssAdmin }} />}
      
      {/* Top Bar */}
      <header className="app-topbar admin-portal-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isMobile && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn-icon"
              style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.05)' }}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <div className="app-topbar__brand" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
            {isMobile ? 'Admin' : 'Workspace Admin'}
          </div>
        </div>

        <div className="app-topbar__actions">
          {!isMobile && (
             <button 
               onClick={() => alert('Sección de soporte en construcción')}
               className="btn-text"
               style={{ border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: design?.primaryColor || 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontWeight: 600, marginRight: '0.5rem' }}
             >
               Soporte
             </button>
          )}
          {user && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="app-topbar__user" style={{ textDecoration: 'none', cursor: 'default', padding: isMobile ? '0.25rem 0.6rem' : '0.35rem 0.8rem' }}>
                <UserIcon size={14} />
                {!isMobile && `${user.name} (Dueño)`}
              </div>
              <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión" style={{ padding: '0.4rem' }}>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="app-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && isMenuOpen && (
          <div 
            onClick={() => setIsMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />
        )}

        {/* Sidebar (Desktop or Mobile Drawer) */}
        <nav 
          className={`admin-sidebar glass-panel ${isMobile ? 'mobile-drawer' : ''}`}
          style={{ 
            display: (isMobile && !isMenuOpen) ? 'none' : 'flex',
            position: isMobile ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 101,
            width: '260px',
            boxShadow: isMobile ? '10px 0 30px rgba(0,0,0,0.1)' : 'none',
            background: 'var(--surface-color)',
            animation: isMobile ? 'slideRight 0.3s ease' : 'none'
          }}
        >
          {navItems.map(item => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => isActive ? 'active' : ''} 
              onClick={() => isMobile && setIsMenuOpen(false)}
              end={item.end}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
          
          {isMobile && (
             <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <a 
                  href={`mailto:${company?.supportEmail || ''}`}
                  style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}
                >
                  Contactar Soporte Técnico
                </a>
             </div>
          )}
        </nav>
        
        <main className="app-content" style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto', flex: 1, width: '100%' }}>
            <Outlet />
          </div>
          <ConnessiaFooter />
        </main>
      </div>

      {isMobile && (
        <nav className="admin-bottom-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''} end={item.end}>
              {item.icon}
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
