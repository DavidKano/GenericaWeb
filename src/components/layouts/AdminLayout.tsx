import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User as UserIcon, LogOut, QrCode, Clock, Megaphone, Menu, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { DesignConfig } from '../../services/models';
import { ConnessiaFooter } from '../ui/ConnessiaFooter';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { repo } = useData();
  const navigate = useNavigate();
  const [design, setDesign] = React.useState<DesignConfig | null>(null);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showSupportModal, setShowSupportModal] = React.useState(false);

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    repo.getDesignConfig().then(setDesign);

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
               onClick={() => setShowSupportModal(true)}
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
                <button 
                  onClick={() => setShowSupportModal(true)}
                  style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Contactar Soporte Técnico
                </button>
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

      {showSupportModal && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '1rem' }} 
          onClick={() => setShowSupportModal(false)}
        >
          <div 
            style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }} 
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', color: design?.primaryColor || 'var(--primary-color)', fontSize: '1.25rem' }}>
              Soporte Técnico
            </h3>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6, color: 'var(--text-color)', fontSize: '0.95rem' }}>
              Si tienes algún problema con nuestra app contacta con nosotros a <strong>soporte@connessia.es</strong> o envía un WhatsApp a nuestro equipo pinchando en el icono de WhatsApp.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a 
                href="https://wa.me/34681001848" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  background: '#25D366', 
                  color: '#fff', 
                  textDecoration: 'none',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Soporte
              </a>
              <button 
                onClick={() => setShowSupportModal(false)}
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  color: 'var(--text-color)',
                  border: 'none',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
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
