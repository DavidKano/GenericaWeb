import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { BookingPage } from './pages/BookingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SystemIgnition } from './pages/SystemIgnition';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import './App.css';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER')[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir a su página de inicio si intenta entrar en ruta no permitida
    return <Navigate to={user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '/' : '/booking'} replace />;
  }

  return <>{children}</>;
}

function RoleBasedHome() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return <AdminDashboard />;
  return <Navigate to="/booking" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/initconfig" element={<SystemIgnition />} />
        
        <Route element={<AppLayout />}>
          {/* Ruta raíz inteligente */}
          <Route path="/" element={
            <ProtectedRoute>
              <RoleBasedHome />
            </ProtectedRoute>
          } />

          {/* Gestión de Administrador */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />

          <Route path="/superadmin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminPanel />
            </ProtectedRoute>
          } />

          {/* Funciones de Cliente */}
          <Route path="/booking" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']}>
              <BookingPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
