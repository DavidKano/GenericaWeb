import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User as UserIcon, LogOut, QrCode, Clock, Megaphone, Menu, X, Sliders, Settings, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { DesignConfig, CompanyData } from '../../services/models';
import { ConnessiaFooter } from '../ui/ConnessiaFooter';
import { format } from 'date-fns';

const getDaysRemaining = (renovacionStr: string) => {
  try {
    const renDate = new Date(renovacionStr);
    const today = new Date();
    const diffTime = renDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch (e) {
    return 0;
  }
};

const getSubscriptionProgress = (startStr?: string, endStr?: string) => {
  try {
    if (!endStr) return 0;
    const end = new Date(endStr).getTime();
    const today = new Date().getTime();
    if (today >= end) return 0;
    
    const start = startStr ? new Date(startStr).getTime() : (end - 365 * 24 * 60 * 60 * 1000);
    const total = end - start;
    if (total <= 0) return 100;
    const elapsed = today - start;
    const percentage = Math.max(0, Math.min(100, 100 - (elapsed / total) * 100));
    return Math.round(percentage);
  } catch (e) {
    return 50;
  }
};

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { repo } = useData();
  const navigate = useNavigate();
  const [design, setDesign] = React.useState<DesignConfig | null>(null);
  const [companyData, setCompanyData] = React.useState<CompanyData | null>(null);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showSupportModal, setShowSupportModal] = React.useState(false);

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    repo.getDesignConfig().then(setDesign);
    repo.getCompanyData().then(setCompanyData);

    return () => window.removeEventListener('resize', handleResize);
  }, [repo]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: "/admin", icon: <LayoutDashboard size={20} strokeWidth={2} />, label: "Panel Control", end: true },
    { to: "/admin/services", icon: <Sliders size={20} strokeWidth={2} />, label: "Gestión Servicios" },
    { to: "/admin/users", icon: <Users size={20} strokeWidth={2} />, label: "Gestión Clientes" },
    { to: "/admin/team", icon: <Users size={20} strokeWidth={2} />, label: "Equipo" },
    { to: "/admin/schedule", icon: <Clock size={20} strokeWidth={2} />, label: "Horarios y Bloqueos" },
    { to: "/admin/offers", icon: <Megaphone size={20} strokeWidth={2} />, label: "Ofertas y Promos" },
    { to: "/admin/tpv", icon: <CreditCard size={20} strokeWidth={2} />, label: "TPV" },
    { to: "/admin/promote", icon: <QrCode size={20} strokeWidth={2} />, label: "Promocionar App" },
    { to: "/admin/settings", icon: <Settings size={20} strokeWidth={2} />, label: "Ajustes" },
  ];


  const bottomNavItems = [
    { to: "/admin", icon: <LayoutDashboard size={20} strokeWidth={2} />, label: "Panel", end: true },
    { to: "/admin/services", icon: <Sliders size={20} strokeWidth={2} />, label: "Servicios" },
    { to: "/admin/users", icon: <Users size={20} strokeWidth={2} />, label: "Clientes" },
    { to: "/admin/schedule", icon: <Clock size={20} strokeWidth={2} />, label: "Horarios" },
    { to: "/admin/offers", icon: <Megaphone size={20} strokeWidth={2} />, label: "Ofertas" },
  ];

  return (
    <div className="app-layout">
      
      {/* Top Bar */}
      <header className="app-topbar admin-portal-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
      </header>      {/* Body: Sidebar + Content */}
      <div className={`app-container ${!isMobile && isCollapsed ? 'sidebar-collapsed' : ''}`} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && isMenuOpen && (
          <div 
            onClick={() => setIsMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />
        )}

        {/* Sidebar (Desktop or Mobile Drawer) */}
        <aside 
          className={`admin-sidebar sidebar ${isMobile ? 'mobile-drawer' : ''}`}
          style={{ 
            display: (isMobile && !isMenuOpen) ? 'none' : 'flex',
            position: isMobile ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 101,
            width: isMobile ? '260px' : (isCollapsed ? '72px' : '260px'),
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, border-color 0.3s ease',
            boxShadow: isMobile ? '10px 0 30px rgba(0,0,0,0.08)' : 'none',
            background: 'var(--surface-color)',
            border: 'none',
            borderRight: '1px solid #E2E8F0', // subtle right border
            borderRadius: isMobile ? '0 16px 16px 0' : '0px',
            flexDirection: 'column',
            gap: '0.25rem',
            paddingTop: '0px',
            animation: isMobile ? 'slideRight 0.3s ease' : 'none'
          }}
        >
          {/* Logo / Brand Header */}
          <div className="brand-header-container" style={{
            padding: '24px 28px 24px 28px', // Generous padding perfectly aligned with menu items
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '0.5rem',
            background: 'transparent' // Clean background with no border
          }}>
            {design?.sourceLogoUrl ? (
              <img 
                src={design.sourceLogoUrl} 
                alt="Logo" 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '6px', 
                  objectFit: 'cover',
                  flexShrink: 0
                }} 
              />
            ) : (
              <div style={{
                background: `color-mix(in srgb, ${design?.primaryColor || 'var(--primary-color)'} 8%, transparent)`,
                color: design?.primaryColor || 'var(--primary-color)',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                flexShrink: 0
              }}>
                <LayoutDashboard size={15} strokeWidth={2.2} />
              </div>
            )}
            <div className="brand-text-container" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-color)', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {companyData?.nombreEmpresa || 'Workspace Admin'}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Administración
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {navItems.map(item => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
                data-tooltip={item.label}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed && !isMobile ? '0px' : '12px',                      // fixed 12px padding between icon and text
                  padding: isCollapsed && !isMobile ? '12px 0' : '12px 16px',             // vertical padding of minimum 12px
                  margin: isCollapsed && !isMobile ? '2px 8px' : '2px 12px',               // floats inside the sidebar as a pill
                  justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                  borderRadius: '8px',              // pill container with rounded corners
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500, // active is semi-bold
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: isActive 
                    ? (design?.primaryColor || 'var(--primary-color)') 
                    : 'var(--text-secondary)',
                  background: isActive 
                    ? `color-mix(in srgb, ${design?.primaryColor || 'var(--primary-color)'} 10%, transparent)` 
                    : 'transparent',
                  border: 'none',
                  borderLeft: 'none'
                })}
                onClick={() => isMobile && setIsMenuOpen(false)}
                end={item.end}
              >
                <span className="sidebar-link-icon" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  color: 'inherit',
                  flexShrink: 0
                }}>
                  {item.icon}
                </span>
                <span className="sidebar-link-text">{item.label}</span>
              </NavLink>
            ))}
          </div>
          
          {/* Subscription Card (Encapsulated at the bottom of the sidebar) */}
          {companyData?.fechaRenovacion && (
             <div className="sub-card-container" style={{
               marginTop: 'auto',
               margin: '16px 12px',
               padding: '12px 14px',
               background: `color-mix(in srgb, ${design?.primaryColor || 'var(--primary-color)'} 4%, transparent)`,
               border: `1px solid color-mix(in srgb, ${design?.primaryColor || 'var(--primary-color)'} 10%, transparent)`,
               borderRadius: '8px',
               display: 'flex',
               flexDirection: 'column',
               gap: '8px',
               boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
             }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                 <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Suscripción</span>
                 <span style={{ color: design?.primaryColor || 'var(--primary-color)', fontWeight: 700 }}>
                   {getDaysRemaining(companyData.fechaRenovacion)} días
                 </span>
               </div>
               
               <div style={{ fontSize: '0.7rem', color: 'var(--text-color)', opacity: 0.85, display: 'flex', justifyContent: 'space-between' }}>
                 <span>Expira el:</span>
                 <strong>{format(new Date(companyData.fechaRenovacion), 'dd/MM/yyyy')}</strong>
               </div>
               
               {/* Progress bar */}
               <div style={{ height: '4px', width: '100%', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '100px', overflow: 'hidden', marginTop: '2px' }}>
                 <div style={{
                   height: '100%',
                   width: `${getSubscriptionProgress(companyData.fechaPuestaMarcha, companyData.fechaRenovacion)}%`,
                   background: getSubscriptionProgress(companyData.fechaPuestaMarcha, companyData.fechaRenovacion) <= 15 
                     ? '#ef4444' 
                     : (design?.primaryColor || 'var(--primary-color)'),
                   borderRadius: '100px',
                   transition: 'width 0.8s ease-out'
                 }} />
               </div>
             </div>
          )}

          {/* Bottom Collapse Button for Desktop */}
          {!isMobile && (
            <div className="sidebar-footer" style={{ marginTop: companyData?.fechaRenovacion ? '0px' : 'auto', padding: '16px 12px', display: 'flex', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={toggleCollapse}
                className="sidebar-collapse-btn"
                title={isCollapsed ? "Expandir menú" : "Contraer menú"}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          )}

          {isMobile && (
             <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', marginTop: companyData?.fechaRenovacion ? '0px' : 'auto' }}>
                <button 
                   onClick={() => setShowSupportModal(true)}
                   style={{ color: design?.primaryColor || 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                   Contactar Soporte Técnico
                </button>
             </div>
          )}
        </aside>
        
        <main className="app-content main-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '100%', margin: '0 auto', flex: 1, width: '100%' }}>
            <Outlet />
          </div>
          <ConnessiaFooter />
        </main>
      </div>

      {isMobile && (
        <nav className="admin-bottom-nav">
          {bottomNavItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''} end={item.end}>
              {item.icon}
              <span>{item.label}</span>
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

        /* Premium sidebar active and hover styles override */
        .admin-sidebar {
          background: var(--surface-color) !important;
          border-right: 1px solid #E2E8F0 !important;
        }

        .admin-sidebar-link {
          border-left: none !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .admin-sidebar-link:hover {
          color: ${design?.primaryColor || 'var(--primary-color)'} !important;
          background: color-mix(in srgb, ${design?.primaryColor || 'var(--primary-color)'} 4%, transparent) !important;
          transform: translateX(4px);
        }

        .admin-sidebar-link.active {
          font-weight: 600 !important;
          color: ${design?.primaryColor || 'var(--primary-color)'} !important;
          background: color-mix(in srgb, ${design?.primaryColor || 'var(--primary-color)'} 10%, transparent) !important;
          border-left: none !important;
        }
      `}</style>
    </div>
  );
};
