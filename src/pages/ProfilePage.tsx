import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Appointment, BookingService, BusinessConfig, User } from '../services/models';
import { 
  Calendar, 
  User as UserIcon, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Trash2, 
  Save, 
  History 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { repo } = useData();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'appointments' | 'profile'>('appointments');
  const [apptSubTab, setApptSubTab] = useState<'upcoming' | 'history'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  
  // Form de perfil
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  useEffect(() => {
    loadData();
  }, [repo, user]);

  const loadData = async () => {
    if (!user) return;
    const [appts, svcs, cfg] = await Promise.all([
      repo.getAppointments(),
      repo.getServices(),
      repo.getConfig()
    ]);
    // Filtrar citas solo de este usuario
    setAppointments(appts.filter(a => a.customerId === user.id));
    setServices(svcs);
    setConfig(cfg);
  };

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => b.dateTimeStart - a.dateTimeStart);
  }, [appointments]);

  const futureAppts = sortedAppointments.filter(a => a.dateTimeStart > Date.now() && a.status !== 'CANCELLED');
  const pastAppts = sortedAppointments.filter(a => a.dateTimeStart <= Date.now() || a.status === 'CANCELLED');

  const handleUpdateProfile = async () => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      name,
      phone,
      address
    };
    await repo.saveUser(updatedUser);
    alert('Perfil actualizado correctamente');
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    
    // Buscar la cita original
    const appts = await repo.getAppointments();
    const appt = appts.find(a => a.id === apptId);
    
    if (appt) {
      await repo.saveAppointment({ ...appt, status: 'CANCELLED' });
      loadData();
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <style>{`
        @media (max-width: 600px) {
          .profile-header-card {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem !important;
            gap: 1.25rem !important;
          }
          .profile-header-card .data-toggle {
            width: 100%;
            justify-content: center;
          }
          .profile-header-card .data-toggle button {
            flex: 1;
          }
        }
      `}</style>
      <div className="card glass-panel profile-header-card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '2rem', 
        padding: '2rem', 
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'var(--primary-color)', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0 
        }}>
          <UserIcon size={40} />
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{user.email}</p>
        </div>
        <div className="data-toggle" style={{ background: 'var(--bg-color)', padding: '4px', height: 'fit-content' }}>
          <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> Mis Citas</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><UserIcon size={14} /> Mi Perfil</button>
        </div>
      </div>

      {activeTab === 'appointments' && (
        <div className="animate-fade-in">
          {/* Sub-Tabs para Citas */}
          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            marginBottom: '2rem', 
            borderBottom: '1px solid var(--glass-border)',
            padding: '0 0.5rem'
          }}>
            <button 
              onClick={() => setApptSubTab('upcoming')}
              style={{
                padding: '0.75rem 0.25rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                color: apptSubTab === 'upcoming' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderBottom: apptSubTab === 'upcoming' ? '3px solid var(--primary-color)' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <Clock size={18} /> Próximas
            </button>
            <button 
              onClick={() => setApptSubTab('history')}
              style={{
                padding: '0.75rem 0.25rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                color: apptSubTab === 'history' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderBottom: apptSubTab === 'history' ? '3px solid var(--primary-color)' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <History size={18} /> Historial
            </button>
          </div>

          {apptSubTab === 'upcoming' ? (
            <div className="animate-fade-in">
              {futureAppts.length === 0 ? (
                <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1.1rem' }}>No tienes reservas futuras.</p>
                  <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => window.location.href = '/booking'}>Reservar ahora</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {futureAppts.map(appt => (
                    <div key={appt.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ 
                          width: '4px', 
                          height: '40px', 
                          background: services.find(s => s.id === appt.serviceId)?.color || 'var(--primary-color)',
                          borderRadius: '2px'
                        }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{services.find(s => s.id === appt.serviceId)?.name}</div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={14} /> {new Date(appt.dateTimeStart).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div>
                        {config?.allowClientCancellation && (
                          <button 
                            className="btn-icon" 
                            onClick={() => handleCancelAppointment(appt.id)}
                            style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
                            title="Cancelar reserva"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '1rem' }}>Servicio</th>
                      <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAppts.map(appt => (
                      <tr key={appt.id}>
                        <td style={{ fontWeight: 700, padding: '1rem' }}>{services.find(s => s.id === appt.serviceId)?.name}</td>
                        <td style={{ textAlign: 'right', paddingRight: '1rem', color: 'var(--text-secondary)' }}>
                          {new Date(appt.dateTimeStart).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {pastAppts.length === 0 && (
                      <tr><td colSpan={2} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No hay historial de citas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="animate-fade-in card glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Mis Datos Personales</h3>
          <div className="form-group">
            <label><UserIcon size={14} style={{ marginRight: '4px' }} /> Nombre Completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label><Phone size={14} style={{ marginRight: '4px' }} /> Teléfono de contacto</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label><Mail size={14} style={{ marginRight: '4px' }} /> Email (No editable)</label>
            <input value={user.email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label><MapPin size={14} style={{ marginRight: '4px' }} /> Dirección / Domicilio</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Calle Mayor 123, Madrid" />
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <button className="btn-primary" onClick={handleUpdateProfile} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
