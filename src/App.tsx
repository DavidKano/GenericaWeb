import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { BookingPage } from './pages/BookingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import './App.css';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: ('ADMIN' | 'CUSTOMER')[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir a su página de inicio si intenta entrar en ruta no permitida
    return <Navigate to={user.role === 'ADMIN' ? '/' : '/booking'} replace />;
  }

  return <>{children}</>;
}

function RoleBasedHome() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  return <Navigate to="/booking" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<AppLayout />}>
          {/* Ruta raíz inteligente */}
          <Route path="/" element={
            <ProtectedRoute>
              <RoleBasedHome />
            </ProtectedRoute>
          } />

          {/* Gestión de Administrador */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SuperAdminPanel />
            </ProtectedRoute>
          } />

          {/* Funciones de Cliente */}
          <Route path="/booking" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
              <BookingPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
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
