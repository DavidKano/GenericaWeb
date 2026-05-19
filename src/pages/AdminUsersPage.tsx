import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { User, Appointment, BookingService } from '../services/models';
import { Search, User as UserIcon, Calendar, FileText, ChevronRight, Phone, Mail, MapPin, Edit, X, Info, Trash2, ArrowLeft } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { repo } = useData();
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCp, setEditCp] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [saving, setSaving] = useState(false);

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
    ).sort((a, b) => a.name.localeCompare(b.name));
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

  const handleDeleteUser = async () => {
    if (selectedUser) {
      if (window.confirm('¿Estás seguro de que quieres eliminar a este cliente? Esta acción no se puede deshacer.')) {
        if (window.confirm('¿Confirmas definitivamente la eliminación de este usuario y todos sus datos?')) {
          setSaving(true);
          try {
            await repo.deleteUser(selectedUser.id);
            setSelectedUserId(null);
            await loadData();
          } catch (err: any) {
            alert(`Error al eliminar: ${err.message}`);
          } finally {
            setSaving(false);
          }
        }
      }
    }
  };

  const openEditModal = () => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditPhone(selectedUser.phone);
      setEditDni(selectedUser.dni || '');
      setEditAddress(selectedUser.address || '');
      setEditCp(selectedUser.cp || '');
      setEditCity(selectedUser.city || '');
      setEditProvince(selectedUser.province || '');
      setShowEditModal(true);
    }
  };

  const handleSaveUserEdits = async () => {
    if (selectedUser) {
      if (!editName.trim()) {
        alert('El nombre no puede estar vacío');
        return;
      }
      setSaving(true);
      try {
        const updatedUser = { 
          ...selectedUser, 
          name: editName, 
          phone: editPhone,
          dni: editDni,
          address: editAddress,
          cp: editCp,
          city: editCity,
          province: editProvince
        };
        await repo.saveUser(updatedUser);
        await loadData();
        setShowEditModal(false);
      } catch (err: any) {
        alert(`Error al guardar: ${err.message}`);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="admin-users-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '350px 1fr', gap: '1.5rem', height: isMobile ? 'auto' : 'calc(100vh - 120px)', overflow: isMobile ? 'visible' : 'hidden' }}>
      {/* Sidebar de Usuarios */}
      {(!isMobile || !selectedUserId) && (
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
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: selectedUserId === u.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
      )}
      
      {/* Detalle del Usuario */}
      {(!isMobile || selectedUserId) && (
        <div className="user-detail-content" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {selectedUser ? (
          <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Header / Info Básica */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
              {isMobile && (
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="btn-secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', alignSelf: 'flex-start' }}
                >
                  <ArrowLeft size={16} /> Volver a la Lista
                </button>
              )}
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserIcon size={40} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>{selectedUser.name}</h2>
                    <button 
                      onClick={openEditModal}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                      title="Editar datos del cliente"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={handleDeleteUser}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                      title="Eliminar cliente"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {selectedUser.email}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> {selectedUser.phone}</span>
                      {selectedUser.dni && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={14} /> {selectedUser.dni}</span>}
                    </div>
                    {(selectedUser.address || selectedUser.city) && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <MapPin size={14} />
                        <span>
                          {selectedUser.address}
                          {(selectedUser.cp || selectedUser.city) && ` - ${selectedUser.cp || ''} ${selectedUser.city || ''}`}
                          {selectedUser.province && `, ${selectedUser.province}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <a 
                  href={`mailto:${selectedUser.email}`} 
                  className="btn-secondary" 
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexShrink: 0 }}
                >
                  <Mail size={16} /> Enviar Mensaje
                </a>
              </div>
            </div>

            {/* Notas Administrativas - Ancho completo */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FileText size={20} color="var(--primary-color)" />
                <h3 style={{ margin: 0 }}>Notas Administrativas</h3>
              </div>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Añade notas privadas sobre este paciente..."
                style={{ width: '100%', minHeight: '120px', marginBottom: '1rem', background: 'var(--bg-color)', fontSize: '0.9rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontFamily: 'inherit', resize: 'vertical' }}
              />
              <button className="btn-primary" onClick={handleSaveNotes} style={{ width: 'fit-content', alignSelf: 'flex-end', padding: '0.6rem 1.5rem' }}>Guardar Notas</button>
            </div>

            {/* Historial de Citas: Ancho completo */}
            <div className="card glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Calendar size={20} color="var(--primary-color)" />
                <h3 style={{ margin: 0 }}>Historial Completo de Citas</h3>
              </div>
              
              {userAppointments.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {userAppointments.map(appt => (
                    <div 
                      key={appt.id} 
                      className="appt-history-item" 
                      style={{ 
                        padding: '1.25rem', 
                        background: 'var(--bg-color)',
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ 
                          width: '45px', 
                          height: '45px', 
                          borderRadius: '10px', 
                          background: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                          color: 'var(--primary-color)'
                        }}>
                          <Calendar size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                            {services.find(s => s.id === appt.serviceId)?.name || 'Servicio'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                              {new Date(appt.dateTimeStart).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <span>•</span>
                            <span>{new Date(appt.dateTimeStart).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <span className={`status-badge status-${appt.status}`} style={{ padding: '0.4rem 0.8rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {appt.status === 'PENDING' ? 'PENDIENTE' : 
                           appt.status === 'CONFIRMED' ? 'CONFIRMADA' : 
                           appt.status === 'COMPLETED' ? 'COMPLETADA' : 'CANCELADA'}
                        </span>
                        {appt.adminNotes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={appt.adminNotes}>
                            📌 {appt.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-color)', borderRadius: '15px', border: '1px dashed var(--glass-border)' }}>
                  <Calendar size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Este cliente aún no ha realizado ninguna reserva.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <UserIcon size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
            <p>Selecciona un cliente de la lista para ver su detalle</p>
          </div>
        )}
      </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop-in" style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>📝 Editar Ficha de Cliente</h2>
                <button className="btn-icon" onClick={() => setShowEditModal(false)}><X /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  placeholder="Nombre y apellidos"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  value={editPhone} 
                  onChange={e => setEditPhone(e.target.value)} 
                  placeholder="Número de teléfono"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
                />
              </div>

              <div className="form-group">
                <label>DNI / NIE</label>
                <input 
                  value={editDni} 
                  onChange={e => setEditDni(e.target.value)} 
                  placeholder="Documento de identidad"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
                />
              </div>

              <div className="form-group">
                <label>Código Postal</label>
                <input 
                  value={editCp} 
                  onChange={e => setEditCp(e.target.value)} 
                  placeholder="CP"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Dirección</label>
              <input 
                value={editAddress} 
                onChange={e => setEditAddress(e.target.value)} 
                placeholder="Calle, número, piso..."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Población</label>
                <input 
                  value={editCity} 
                  onChange={e => setEditCity(e.target.value)} 
                  placeholder="Ciudad / Pueblo"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
                />
              </div>

              <div className="form-group">
                <label>Provincia</label>
                <input 
                  value={editProvince} 
                  onChange={e => setEditProvince(e.target.value)} 
                  placeholder="Provincia"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem', opacity: 0.7 }}>
              <label>Correo Electrónico (No editable)</label>
              <input 
                value={selectedUser.email} 
                readOnly
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', cursor: 'not-allowed' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                <Info size={14} />
                <span>El email no se puede cambiar ya que es el identificador de acceso del cliente.</span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveUserEdits} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
