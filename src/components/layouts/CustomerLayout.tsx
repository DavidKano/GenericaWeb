import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Calendar, Users, User as UserIcon, LogOut } from 'lucide-react';
import type { CompanyData, DesignConfig } from '../../services/models';
import { LegalModal } from '../ui/LegalModal';
import { PromoOfferModal } from '../ui/PromoOfferModal';
import { getDefaultPrivacyPolicy, getDefaultTermsOfUse } from '../../services/policyDefaults';

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { repo } = useData();
  const navigate = useNavigate();
  const [company, setCompany] = React.useState<CompanyData | null>(null);
  const [design, setDesign] = React.useState<DesignConfig | null>(null);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [showTerms, setShowTerms] = React.useState(false);

  React.useEffect(() => {
    repo.getCompanyData().then(setCompany);
    repo.getDesignConfig().then(setDesign);
  }, [repo]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <PromoOfferModal />
      {design?.customCssCustomer && <style dangerouslySetInnerHTML={{ __html: design.customCssCustomer }} />}
      {/* Top Bar */}
      <header className="app-topbar">
        <div className="app-topbar__brand" onClick={() => navigate('/booking')} style={{ cursor: 'pointer' }}>
          Reservar Citas
        </div>
        <div className="app-topbar__actions">
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
          <NavLink to="/booking" className={({ isActive }) => isActive ? 'active' : ''}>
            <Calendar size={18} /> Reservar Cita
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            <Users size={18} /> Mis Citas
          </NavLink>
        </nav>
        
        <main className="app-content" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', flex: 1, width: '100%' }}>
            <Outlet />
          </div>
          
          {company && (
            <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary, #6b7280)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ display: 'block', marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} {company.nombreEmpresa}</span>
              <button type="button" onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, margin: '0 0.5rem' }}>Condiciones de Uso</button>
              |
              <button type="button" onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, margin: '0 0.5rem' }}>Política de Privacidad</button>
              
              <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Condiciones de Uso" content={company.termsOfUse || getDefaultTermsOfUse(company)} />
              <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Política de Privacidad" content={company.privacyPolicy || getDefaultPrivacyPolicy(company)} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
