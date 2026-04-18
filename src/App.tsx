import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { AdminCoreDatos, AdminCoreDiseno, AdminCorePoliticas, AdminCoreCss } from './pages/AdminCorePages';

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

  useEffect(() => {
    // Escuchamos cambios de ruta para decidir si inyectar o limpiar
    const isSuperAdmin = window.location.pathname.startsWith('/superadmin');

    if (isSuperAdmin) {
      // Resetear a los valores CORE (Inter, Gris, etc)
      document.documentElement.style.setProperty('--primary-color', '#3b82f6');
      document.documentElement.style.setProperty('--font-family', "'Inter', sans-serif");
      document.documentElement.style.setProperty('--bg-color', '#f3f4f6');
      return;
    }

    Promise.all([repo.getCompanyData(), repo.getDesignConfig()]).then(([company, cfg]) => {
      // 1. Dynamic manifest generation
      const manifest = {
        name: company?.nombreEmpresa || "Reservas App",
        short_name: company?.nombreEmpresa || "Reservas",
        description: "Gestión de Reservas Web App",
        start_url: "/booking",
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

      // 2. CSS variables injection
      if (cfg?.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', cfg.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', cfg.secondaryColor || '#2563eb');
      }
      if (cfg?.primaryTextColor) {
        document.documentElement.style.setProperty('--primary-text-color', cfg.primaryTextColor);
      }
      if (cfg?.fontFamily) {
        document.documentElement.style.setProperty('--font-family', cfg.fontFamily);
      }
      if (cfg?.backgroundColor) {
        document.documentElement.style.setProperty('--bg-color', cfg.backgroundColor);
      }
    }).catch(err => {
      console.error('CRITICAL: Fallo en la inyección de temas core:', err);
      // Fallback a colores básicos para que la app no muera
      document.documentElement.style.setProperty('--primary-color', '#3b82f6');
      document.documentElement.style.setProperty('--font-family', "'Inter', sans-serif");
      document.documentElement.style.setProperty('--bg-color', '#f3f4f6');
    });
  }, [repo, window.location.pathname]);

  return <>{children}</>;
}

function App() {
  return (
    <GlobalThemeInjector>
      <BrowserRouter>
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
            <Route path="agenda" element={<AdminDashboard />} /> /* Dummy wrapper for now */
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
            <Route path="css" element={<AdminCoreCss />} />
          </Route>

          {/* ---------------- CUSTOMER PORTAL (ROOT) ---------------- */}
          <Route path="/" element={
            <PortalGuard allowedRoles={['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']} portalType="CUSTOMER">
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
      </BrowserRouter>
    </GlobalThemeInjector>
  );
}

export default App;
