import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { LoginPage } from './pages/LoginPage';
import { SystemIgnition } from './pages/SystemIgnition';
import { WelcomePage } from './pages/WelcomePage';

// Portals & Pages
import { CustomerLayout } from './components/layouts/CustomerLayout';
import { BookingPage } from './pages/BookingPage';
import { ProfilePage } from './pages/ProfilePage';

import { AdminLayout } from './components/layouts/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';

import { SuperAdminLayout } from './components/layouts/SuperAdminLayout';
import { AdminCoreDatos, AdminCoreDiseno, AdminCorePoliticas, AdminCoreCss, AdminCoreAccesos, AdminCoreWelcomeEmail } from './pages/AdminCorePages';
import { AdminPromotePage } from './pages/AdminPromotePage';
import { AdminSchedulePage } from './pages/AdminSchedulePage';
import { AdminOffersPage } from './pages/AdminOffersPage';
import { UpdateNotification } from './components/ui/UpdateNotification';

import './App.css';

function PortalGuard({ children, allowedRoles, portalType }: { children: React.ReactNode, allowedRoles: ('SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER')[], portalType: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER' }) {
  const { user } = useAuth();

  if (!user) {
    // Si no está logueado, escupe la pantalla de login directamente SIN cambiar la URL
    return <LoginPage type={portalType} />;
  }

  // Si está logueado pero intenta estar donde no le incumbe, lo repelemos
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/superadmin" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/booking" replace />;
  }

  return <>{children}</>;
}



function GlobalThemeInjector({ children }: { children: React.ReactNode }) {
  const { repo } = useData();
  const location = useLocation();

  useEffect(() => {
    const isSuperAdmin = location.pathname.startsWith('/superadmin');
    const isWelcome = location.pathname.startsWith('/welcome');

    Promise.all([repo.getCompanyData(), repo.getDesignConfig()]).then(([company, cfg]) => {
      // Sincronización con caché local para eliminar FOUC en próximas cargas
      if (cfg) {
        localStorage.setItem('design_config_cache', JSON.stringify(cfg));
      }

      // 0. Update Page Title and Favicon
      const companyName = company?.nombreEmpresa || "Reservas App";
      
      if (isSuperAdmin) {
        document.title = `CORE | ${companyName}`;
      } else {
        document.title = companyName;
      }

      const faviconTag = document.getElementById('dynamic-favicon') as HTMLLinkElement;
      if (faviconTag && cfg?.faviconUrl) {
        faviconTag.href = cfg.faviconUrl;
        faviconTag.type = 'image/png'; // El favicon generado es PNG
      }

      let appleIconTag = document.getElementById('apple-touch-icon') as HTMLLinkElement;
      if (!appleIconTag) {
        appleIconTag = document.createElement('link');
        appleIconTag.rel = 'apple-touch-icon';
        appleIconTag.id = 'apple-touch-icon';
        document.head.appendChild(appleIconTag);
      }
      if (cfg?.pwaIcon || cfg?.faviconUrl) {
        appleIconTag.href = cfg.pwaIcon || cfg.faviconUrl!;
      }

      if (isSuperAdmin) {
        // Resetear a los valores CORE (Inter, Gris, etc) en el portal de control maestro
        document.documentElement.style.setProperty('--primary-color', '#3b82f6');
        document.documentElement.style.setProperty('--secondary-color', '#2563eb');
        document.documentElement.style.setProperty('--primary-text-color', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#111827');
        document.documentElement.style.setProperty('--font-family', "'Inter', sans-serif");
        document.documentElement.style.setProperty('--bg-color', '#f3f4f6');
        
        // Limpiar CSS inyectado si existe
        const styleTag = document.getElementById('dynamic-custom-css');
        if (styleTag) styleTag.remove();
        
        return;
      }

      // 1. Dynamic manifest generation
      const manifest = {
        name: companyName,
        short_name: company?.nombreEmpresa || "Reservas",
        description: "Gestión de Reservas Web App",
        start_url: isWelcome ? "/welcome" : "/booking",
        display: "standalone",
        background_color: cfg?.backgroundColor || "#f3f4f6",
        theme_color: cfg?.primaryColor || "#3b82f6",
        icons: [
          {
            src: cfg?.pwaIcon || "/icons.svg",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      };

      const stringManifest = JSON.stringify(manifest);
      const blob = new Blob([stringManifest], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(blob);
      const linkTag = document.getElementById('dynamic-manifest') as HTMLLinkElement;
      if (linkTag) linkTag.href = manifestURL;

      const themeColorMeta = document.getElementById('meta-theme-color') as HTMLMetaElement;
      if (themeColorMeta && cfg?.primaryColor) themeColorMeta.content = cfg.primaryColor;

      // 2. CSS variables injection (Priority is already handled by index.html for fast load,
      // here we ensure the absolute latest from DB is applied)
      if (cfg?.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', cfg.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', cfg.secondaryColor || '#2563eb');
      }
      if (cfg?.primaryTextColor) {
        document.documentElement.style.setProperty('--primary-text-color', cfg.primaryTextColor);
      }
      if (cfg?.generalTextColor) {
        document.documentElement.style.setProperty('--text-primary', cfg.generalTextColor);
      }
      if (cfg?.fontFamily) {
        document.documentElement.style.setProperty('--font-family', cfg.fontFamily);
        const fontMap: Record<string, string> = {
          "'Inter', sans-serif": "Inter:wght@400;500;600;700",
          "'Playfair Display', serif": "Playfair+Display:ital,wght@0,400;0,600;1,400",
          "'Outfit', sans-serif": "Outfit:wght@400;500;600;700",
          "'Gochi Hand', cursive": "Gochi+Hand",
          "'Cinzel', serif": "Cinzel:wght@400;600;700",
          "'Montserrat', sans-serif": "Montserrat:wght@400;500;600;700",
          "'Lora', serif": "Lora:ital,wght@0,400;0,600;1,400",
          "'Roboto Slab', serif": "Roboto+Slab:wght@400;600;700",
          "'Bebas Neue', sans-serif": "Bebas+Neue",
          "'Quicksand', sans-serif": "Quicksand:wght@400;500;600;700"
        };
        const googleFont = fontMap[cfg.fontFamily] || "Inter:wght@400;500;600;700";
        let fontLink = document.getElementById('dynamic-font') as HTMLLinkElement;
        if (!fontLink) {
          fontLink = document.createElement('link');
          fontLink.rel = 'stylesheet';
          fontLink.id = 'dynamic-font';
          document.head.appendChild(fontLink);
        }
        fontLink.href = 'https://fonts.googleapis.com/css2?family=' + googleFont + '&display=swap';
      }
      if (cfg?.backgroundColor) {
        document.documentElement.style.setProperty('--bg-color', cfg.backgroundColor);
      }

      // 3. Custom CSS injection
      const path = window.location.pathname;
      const isCustomerPortal = !path.startsWith('/admin') && !path.startsWith('/superadmin');
      const isAdminPortal = path.startsWith('/admin') && !path.startsWith('/superadmin');

      // Eliminar el estilo previo de inyección temprana si existe para evitar duplicados
      const earlyStyle = document.getElementById('ultra-early-style');
      if (earlyStyle) earlyStyle.remove();

      const styleId = 'dynamic-custom-css';
      let styleTag = document.getElementById(styleId);
      
      let cssToInject = '';
      if (isCustomerPortal && cfg?.customCssCustomer) {
        cssToInject = cfg.customCssCustomer;
      } else if (isAdminPortal && cfg?.customCssAdmin) {
        cssToInject = cfg.customCssAdmin;
      }

      if (cssToInject) {
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = cssToInject;
      } else if (styleTag) {
        styleTag.innerHTML = '';
      }
    }).catch(err => {
      console.error('CRITICAL: Fallo en la inyección de temas core:', err);
      // Fallback a colores básicos para que la app no muera
      document.documentElement.style.setProperty('--primary-color', '#3b82f6');
      document.documentElement.style.setProperty('--font-family', "'Inter', sans-serif");
      document.documentElement.style.setProperty('--bg-color', '#f3f4f6');
    });
  }, [repo, location.pathname]);

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <GlobalThemeInjector>
        <UpdateNotification />
        <Routes>
          {/* Core Initialization Route */}
          <Route path="/initconfig" element={<SystemIgnition />} />

          {/* PWA Landing Page */}
          <Route path="/welcome" element={<WelcomePage />} />

          {/* ---------------- ADMIN PORTAL ---------------- */}
          <Route path="/admin" element={
            <PortalGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']} portalType="ADMIN">
              <AdminLayout />
            </PortalGuard>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="promote" element={<AdminPromotePage />} />
            <Route path="schedule" element={<AdminSchedulePage />} />
            <Route path="offers" element={<AdminOffersPage />} />
          </Route>

          {/* ---------------- SUPER ADMIN PORTAL ---------------- */}
          <Route path="/superadmin" element={
            <PortalGuard allowedRoles={['SUPER_ADMIN']} portalType="SUPER_ADMIN">
              <SuperAdminLayout />
            </PortalGuard>
          }>
            <Route index element={<Navigate to="datos" replace />} />
            <Route path="datos" element={<AdminCoreDatos />} />
            <Route path="diseno" element={<AdminCoreDiseno />} />
            <Route path="politicas" element={<AdminCorePoliticas />} />
            <Route path="accesos" element={<AdminCoreAccesos />} />
            <Route path="css" element={<AdminCoreCss />} />
            <Route path="email" element={<AdminCoreWelcomeEmail />} />
          </Route>

          {/* ---------------- CUSTOMER PORTAL (ROOT) ---------------- */}
          <Route path="/" element={
            <PortalGuard allowedRoles={['CUSTOMER']} portalType="CUSTOMER">
              <CustomerLayout />
            </PortalGuard>
          }>
            <Route index element={<Navigate to="/booking" replace />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Alias explícito por si acaso escriben /login */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GlobalThemeInjector>
    </BrowserRouter>
  );
}

export default App;
