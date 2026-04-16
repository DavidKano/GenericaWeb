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
      <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserIcon size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '0.25rem' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Cliente desde hace tiempo</p>
        </div>
        <div className="data-toggle" style={{ background: 'var(--bg-color)', padding: '4px' }}>
          <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}><Calendar size={16} /> Mis Citas</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><UserIcon size={16} /> Mi Perfil</button>
        </div>
      </div>

      {activeTab === 'appointments' && (
        <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
          {/* Futuras */}
          <section>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary-color)" /> Próximas Reservas
            </h3>
            {futureAppts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No tienes reservas futuras. <br />
                <button className="btn-text" style={{ color: 'var(--primary-color)', marginTop: '0.5rem' }}>Hacer una reserva ahora</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {futureAppts.map(appt => (
                  <div key={appt.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{services.find(s => s.id === appt.serviceId)?.name}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {new Date(appt.dateTimeStart).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div>
                      {config?.allowClientCancellation && (
                        <button 
                          className="btn-icon" 
                          onClick={() => handleCancelAppointment(appt.id)}
                          style={{ color: '#ef4444' }}
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
          </section>

          {/* Pasadas */}
          <section>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
              <History size={20} /> Historial y Canceladas
            </h3>
            <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="appointments-table">
                <tbody>
                  {pastAppts.map(appt => (
                    <tr key={appt.id}>
                      <td style={{ fontWeight: 600 }}>{services.find(s => s.id === appt.serviceId)?.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(appt.dateTimeStart).toLocaleDateString('es-ES')}</td>
                      <td><span className={`status-badge status-${appt.status}`}>{appt.status}</span></td>
                    </tr>
                  ))}
                  {pastAppts.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay historial de citas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
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
