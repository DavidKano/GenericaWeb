import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { User, Appointment, BookingService } from '../services/models';
import { Search, User as UserIcon, Calendar, FileText, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { repo } = useData();
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [repo]);

  const loadData = async () => {
    const [u, a, s] = await Promise.all([
      repo.getUsers(),
      repo.getAppointments(),
      repo.getServices()
    ]);
    setUsers(u.filter(user => user.role === 'CUSTOMER'));
    setAppointments(a);
    setServices(s);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
    );
  }, [users, searchTerm]);

  const selectedUser = useMemo(() => 
    users.find(u => u.id === selectedUserId), [users, selectedUserId]
  );

  const userAppointments = useMemo(() => 
    appointments
      .filter(a => a.customerId === selectedUserId)
      .sort((a, b) => b.dateTimeStart - a.dateTimeStart), 
    [appointments, selectedUserId]
  );

  useEffect(() => {
    if (selectedUser) {
      setAdminNotes(selectedUser.adminNotes || '');
    }
  }, [selectedUser]);

  const handleSaveNotes = async () => {
    if (selectedUser) {
      try {
        const updatedUser = { ...selectedUser, adminNotes };
        await repo.saveUser(updatedUser);
        loadData();
        alert('Notas guardadas correctamente');
      } catch (err: any) {
        console.error('Error al guardar notas:', err);
        alert(`Error al guardar: ${err.message}`);
      }
    }
  };

  return (
    <div className="admin-users-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      {/* Sidebar de Usuarios */}
      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <div className="search-box" style={{ 
          position: 'relative', 
          marginBottom: '1.5rem',
          marginTop: '0.5rem'
        }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-secondary)',
            opacity: 0.6,
            zIndex: 1
          }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o teléfono..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-input-search"
            style={{ 
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem', 
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid var(--glass-border)',
              borderRadius: '100px',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
          {filteredUsers.map(u => (
            <div 
              key={u.id}
              className={`user-list-item ${selectedUserId === u.id ? 'active' : ''}`}
              onClick={() => setSelectedUserId(u.id)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s',
                background: selectedUserId === u.id ? 'var(--primary-color)' : 'transparent',
                color: selectedUserId === u.id ? 'white' : 'inherit'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: selectedUserId === u.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{u.phone}</div>
              </div>
              <ChevronRight size={16} opacity={0.5} />
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem', fontSize: '0.9rem' }}>
              No se encontraron usuarios.
            </div>
          )}
        </div>
      </div>

      {/* Detalle del Usuario */}
      <div className="user-detail-content" style={{ overflowY: 'auto' }}>
        {selectedUser ? (
          <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Header / Info Básica */}
            <div className="card glass-panel" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={40} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '0.5rem' }}>{selectedUser.name}</h2>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {selectedUser.email}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> {selectedUser.phone}</span>
                </div>
              </div>
              <a 
                href={`mailto:${selectedUser.email}`} 
                className="btn-secondary" 
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Enviar Mensaje
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
              {/* Columna Izquierda: Citas */}
              <div className="card glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Calendar size={20} color="var(--primary-color)" />
                  <h3>Historial de Citas</h3>
                </div>
                
                {userAppointments.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {userAppointments.map(appt => (
                      <div key={appt.id} className="appt-history-item" style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{services.find(s => s.id === appt.serviceId)?.name || 'Servicio'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(appt.dateTimeStart).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className={`status-badge status-${appt.status}`}>{appt.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Este cliente no tiene citas registradas.</p>
                )}
              </div>

              {/* Columna Derecha: Notas y Otros */}
              <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
                <div className="card glass-panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <FileText size={20} color="var(--primary-color)" />
                    <h3>Notas Administrativas</h3>
                  </div>
                  <textarea 
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Añade notas privadas sobre este paciente..."
                    style={{ width: '100%', height: '150px', marginBottom: '1rem', background: 'var(--bg-color)', fontSize: '0.9rem' }}
                  />
                  <button className="btn-primary" onClick={handleSaveNotes} style={{ width: '100%' }}>Guardar Notas</button>
                </div>

                <div className="card glass-panel">
                  <h3 style={{ marginBottom: '1rem' }}>Datos del Perfil</h3>
                  <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <MapPin size={16} color="var(--text-secondary)" />
                      <span>{selectedUser.address || <span style={{ opacity: 0.5 }}>Sin dirección</span>}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <UserIcon size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
            <p>Selecciona un cliente de la lista para ver su detalle</p>
          </div>
        )}
      </div>
    </div>
  );
};
