import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SystemIgnition: React.FC = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Firebase config
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  // Master Admin Auth
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Autodestrucción si ya existe configuración persistente
    const existingConfig = localStorage.getItem('firebaseConfig');
    if (existingConfig) {
      navigate('/login', { replace: true });
    }
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
    if (!apiKey || !projectId || !adminEmail || !adminPassword) {
      alert('Faltan campos maestros requeridos.');
      return;
    }

    setIsLoading(true);

    const fbConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };

    try {
      // Dynamically import Firebase to avoid cluttering main bundle
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');

      const app = initializeApp(fbConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);

      // Crear Admin Maestro
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

      // Guardar Configuración Maestramente
      localStorage.setItem('firebaseConfig', JSON.stringify(fbConfig));

      alert('Configuración guardada exitosamente. El sistema se reiniciará en modo producción.');
      window.location.href = '/login'; // Full reload to catch DataContext evaluation

    } catch (err: any) {
      alert('Fallo catastrófico al enlazar Firebase: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#e5e7eb', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#ef4444', marginBottom: '1.5rem', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem' }}>🔥 CORE IGNITION SETUP</h1>
        <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '2rem' }}>
          Aviso: Esta acción enlazará el sistema a una instancia de Firebase Production. Al completarse exitosamente, esta ruta se bloqueará para prevenir un reajuste malintencionado.
        </p>
        <form onSubmit={handleIgnite} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <h3 style={{ marginBottom: '1rem' }}>1. Firebase SDK Config</h3>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="apiKey" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input value={projectId} onChange={e=>setProjectId(e.target.value)} placeholder="projectId" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input value={authDomain} onChange={e=>setAuthDomain(e.target.value)} placeholder="authDomain" style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input value={storageBucket} onChange={e=>setStorageBucket(e.target.value)} placeholder="storageBucket" style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input value={messagingSenderId} onChange={e=>setMessagingSenderId(e.target.value)} placeholder="messagingSenderId" style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input value={appId} onChange={e=>setAppId(e.target.value)} placeholder="appId" style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>2. Master Admin Account</h3>
            <p style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '1rem' }}>Se creará el administrador irrevocable en la nube utilizando Auth.</p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="Email del Administrador" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Contraseña Maestra" required style={{ width: '100%', padding: '0.8rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
            </div>
          </div>

          <button disabled={isLoading} type="submit" style={{ background: isLoading ? '#9ca3af' : '#ef4444', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem' }}>
            {isLoading ? 'ENLAZANDO...' : 'INICIALIZAR PRODUCCIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
};
