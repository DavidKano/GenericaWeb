import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SystemIgnition: React.FC = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Master Admin Auth
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Autodestrucción: comprobar si ya existe un SUPER_ADMIN en Firestore.
    // Si ya existe, esta ruta no tiene razón de existir. Redirigir inmediatamente.
    const checkExistingAdmin = async () => {
      try {
        // Obtener la config de Firebase directamente del servidor
        const response = await fetch('/__/firebase/init.json');
        if (!response.ok) {
          // Si no estamos en Firebase Hosting (ej: localhost), permitir acceso
          setIsChecking(false);
          return;
        }
        const config = await response.json();

        const { initializeApp, getApps, getApp } = await import('firebase/app');
        const { getFirestore, collection, getDocs } = await import('firebase/firestore');

        const app = !getApps().length ? initializeApp(config) : getApp();
        const db = getFirestore(app);

        // Buscar si ya existe algún usuario con rol SUPER_ADMIN
        const snapshot = await getDocs(collection(db, 'users'));
        const hasSuperAdmin = snapshot.docs.some(d => d.data().role === 'SUPER_ADMIN');

        if (hasSuperAdmin) {
          // Ya está inicializado. Autodestrucción.
          navigate('/', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Error verificando estado del sistema:', err);
        // Si falla la comprobación, dejamos entrar por seguridad (puede ser localhost)
      }
      setIsChecking(false);
    };

    checkExistingAdmin();
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'utP5H&xGXwwyj7$u6R@xG!p!K') {
      setIsLogged(true);
    } else {
      alert('Credenciales incorrectas');
    }
  };

  const handleIgnite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      alert('Introduce el email y la contraseña del administrador maestro.');
      return;
    }

    setIsLoading(true);

    try {
      // Obtener la configuración de Firebase del propio servidor
      let fbConfig: any;
      const response = await fetch('/__/firebase/init.json');
      if (response.ok) {
        fbConfig = await response.json();
      } else {
        throw new Error('No se pudo obtener la configuración del servidor. Asegúrate de que la app está desplegada en Firebase Hosting.');
      }

      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');

      const app = !getApps().length ? initializeApp(fbConfig) : getApp();
      const auth = getAuth(app);
      const db = getFirestore(app);

      // Crear Admin Maestro en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      // Registrar en Firestore como SUPER_ADMIN
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        name: 'Administrador Maestro',
        phone: '---',
        role: 'SUPER_ADMIN',
        createdAt: Date.now()
      });

      alert('✅ Sistema inicializado correctamente. El Administrador Maestro ha sido creado. La app se reiniciará.');
      window.location.href = '/'; // Full reload para que DataContext reconecte

    } catch (err: any) {
      alert('Fallo catastrófico al enlazar Firebase: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pantalla de verificación inicial
  if (isChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0', fontFamily: 'monospace' }}>
        <p>Verificando estado del sistema...</p>
      </div>
    );
  }

  // Pantalla de acceso seguro
  if (!isLogged) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0' }}>
        <form onSubmit={handleLogin} style={{ border: '1px solid #0f0', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
          <h2 style={{ margin: 0, textAlign: 'center', fontFamily: 'monospace' }}>SECURE LOGIN</h2>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="User" style={{ background: '#000', color: '#0f0', border: '1px solid #0f0', padding: '0.8rem', fontFamily: 'monospace', outline: 'none' }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ background: '#000', color: '#0f0', border: '1px solid #0f0', padding: '0.8rem', fontFamily: 'monospace', outline: 'none' }} />
          <button type="submit" style={{ background: '#0f0', color: '#000', border: 'none', padding: '0.8rem', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>ACCESS INITIALIZATION</button>
        </form>
      </div>
    );
  }

  // Formulario de inicialización (solo email + contraseña del admin)
  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#e5e7eb', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#ef4444', marginBottom: '1.5rem', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem' }}>🔥 CORE IGNITION SETUP</h1>
        <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem' }}>
          Aviso: Esta acción creará el Administrador Maestro del sistema. 
          La conexión con Firebase se establece automáticamente desde el servidor.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: '2rem', padding: '0.75rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
          ✅ La configuración de Firebase se obtiene automáticamente del servidor. No necesitas introducir claves SDK.
        </p>
        <form onSubmit={handleIgnite} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Administrador Maestro</h3>
            <p style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '1rem' }}>Se creará la cuenta irrevocable de SUPER_ADMIN en Firebase Authentication.</p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="Email del Administrador" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Contraseña Maestra" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
            </div>
          </div>

          <button disabled={isLoading} type="submit" style={{ background: isLoading ? '#9ca3af' : '#ef4444', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem' }}>
            {isLoading ? 'CREANDO ADMINISTRADOR...' : 'INICIALIZAR SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
};
