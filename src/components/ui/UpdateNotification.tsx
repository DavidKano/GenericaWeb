import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const UpdateNotification: React.FC = () => {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;

    // Cuando el nuevo service worker toma el control, recargamos la página.
    // Esto asegura que la página solo se recargue una vez.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // 'installed' significa que el nuevo SW ha terminado de descargar
        // e instalar en segundo plano.
        if (newWorker.state === 'installed') {
          // Si hay un controlador activo, significa que es una actualización.
          // También comprobamos registration.active por si el usuario hizo un Control+F5
          // previo (lo que anula el controller temporalmente pero mantiene el SW activo).
          if (navigator.serviceWorker.controller || registration.active) {
            setWaitingWorker(newWorker);
            setShow(true);
          }
        }
      });
    };

    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
      
      // Si ya hay una actualización esperando (ej. se detectó antes pero el usuario no recargó)
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShow(true);
      }

      // Si se detecta una actualización mientras la app está abierta
      registration.addEventListener('updatefound', () => {
        onUpdateFound(registration);
      });
      
      // AUTO-POLLING: Comprobar actualizaciones automáticamente
      // 1. Cada vez que el usuario vuelve a la pestaña (útil en móviles o si dejó la pestaña abierta)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // 2. Por si acaso el usuario se queda mirando la misma pantalla horas, comprobar cada 10 minutos
      const intervalId = setInterval(() => {
        registration.update().catch(() => {});
      }, 10 * 60 * 1000);

      // Cleanup al desmontar
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(intervalId);
      };

    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    let worker = waitingWorker;
    
    // Si por algún motivo perdemos la referencia, intentamos recuperarla de la registración activa
    if (!worker && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      worker = registration?.waiting || null;
    }

    if (worker) {
      // Escuchamos el cambio de estado para recargar justo cuando termine de activarse
      worker.addEventListener('statechange', () => {
        if (worker?.state === 'activated') {
          window.location.reload();
        }
      });

      // Failsafe absoluto: Si por algún motivo el navegador móvil (en especial Chrome de Android o Safari iOS
      // en modo PWA/Acceso directo) no dispara el evento 'statechange' o 'controllerchange',
      // forzamos la recarga de la ventana a los 1.2 segundos. Para ese momento, el postMessage ya habrá
      // activado el nuevo Service Worker en segundo plano, y al recargar se iniciará con la versión fresca.
      setTimeout(() => {
        window.location.reload();
      }, 1200);

      // Envía el mensaje para que el SW pase de 'waiting' a 'active'
      worker.postMessage('SKIP_WAITING');
    } else {
      // Si por alguna razón no hay worker, forzamos recarga inmediata
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      backgroundColor: '#1e293b', // Gris oscuro elegante para que contraste
      color: '#f8fafc',
      padding: '1rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      zIndex: 999999, // Por encima de modales
      maxWidth: '320px',
      animation: 'slideInUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', fontWeight: '500' }}>
          Hay una nueva versión de la aplicación disponible.
        </p>
        <button 
          onClick={handleDismiss} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#94a3b8', 
            cursor: 'pointer', 
            padding: 0, 
            display: 'flex' 
          }}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
      <button 
        onClick={handleUpdate}
        disabled={isUpdating}
        style={{
          backgroundColor: isUpdating ? '#475569' : 'var(--primary-color, #3b82f6)',
          color: '#ffffff',
          border: 'none',
          padding: '0.6rem 1rem',
          borderRadius: '6px',
          fontWeight: '600',
          cursor: isUpdating ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          transition: 'background-color 0.2s',
          opacity: isUpdating ? 0.8 : 1
        }}
      >
        <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
        {isUpdating ? 'Actualizando...' : 'Actualizar ahora'}
      </button>

      <style>{`
        @keyframes slideInUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
