import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { User, Appointment, BookingService } from '../services/models';
import { Search, User as UserIcon, Calendar, FileText, Phone, Mail, MapPin, Edit, X, Info, Trash2, ArrowLeft, Tag } from 'lucide-react';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateShort = (timestamp: number) => {
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear().toString().slice(-2);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

export const AdminUsersPage: React.FC = () => {
  const { repo } = useData();
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'PENDING':
        return { bg: '#FEF3C7', color: '#92400E' }; // Amber
      case 'CONFIRMED':
        return { bg: '#D1FAE5', color: '#065F46' }; // Green
      case 'COMPLETED':
        return { bg: '#DBEAFE', color: '#1E40AF' }; // Blue
      default:
        return { bg: '#F3F4F6', color: '#374151' }; // Gray
    }
  };

  return (
    <div className="admin-users-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'clamp(280px, 30%, 350px) 1fr', gap: '1.5rem', height: isMobile ? 'auto' : 'calc(100vh - 120px)', overflow: isMobile ? 'visible' : 'hidden' }}>
      <style>{`
        .premium-input-search {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          color: var(--text-color, #1e293b);
          font-family: inherit;
        }
        .premium-input-search:focus {
          border-color: var(--primary-color, #3b82f6) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        .user-list-item {
          border-left: 4px solid transparent !important;
          border-radius: 0 8px 8px 0 !important;
          transition: all 0.2s ease !important;
        }
        .user-list-item:hover {
          background: #F8FAFC !important;
        }
        .user-list-item.active {
          background: #F8FAFC !important;
          border-left: 4px solid var(--primary-color, #3b82f6) !important;
          color: var(--text-color, #1e293b) !important;
        }
        .user-list-item.active .user-avatar-circle {
          background: color-mix(in srgb, var(--primary-color, #3b82f6) 10%, transparent) !important;
          color: var(--primary-color, #3b82f6) !important;
        }
        
        .btn-send-message:hover {
          background: var(--secondary-color, #2563eb) !important;
          opacity: 0.92 !important;
          color: #FFFFFF !important;
          transform: translateY(-1px);
        }
        
        .clean-textarea {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .clean-textarea:focus {
          border-color: var(--primary-color, #3b82f6) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        .appt-history-item {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .appt-history-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px -2px rgba(0,0,0,0.03), 0 3px 6px -3px rgba(0,0,0,0.02) !important;
        }
        
        .hover-text-primary {
          color: #94A3B8 !important;
          transition: color 0.2s ease;
        }
        .hover-text-primary:hover {
          color: var(--primary-color, #3b82f6) !important;
        }
        .hover-text-danger {
          color: #94A3B8 !important;
          transition: color 0.2s ease;
        }
        .hover-text-danger:hover {
          color: #EF4444 !important;
        }
      `}</style>

      {/* Sidebar de Usuarios */}
      {(!isMobile || !selectedUserId) && (
        <div className="card glass-panel" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          padding: '1rem',
          width: '100%',
          boxSizing: 'border-box',
          height: isMobile ? 'auto' : '100%'
        }}>
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
                  padding: '0.75rem 1rem 0.75rem 0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s',
                  fontWeight: selectedUserId === u.id ? 600 : 500
                }}
              >
                <div 
                  className="user-avatar-circle"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-color)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0 
                  }}
                >
                  <UserIcon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--text-secondary)' }}>{u.phone}</div>
                </div>
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
        <div className="user-detail-content" style={{ 
          overflowY: 'auto', 
          overflowX: 'hidden', 
          padding: isMobile ? '1rem' : '0', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          width: '100%', 
          boxSizing: 'border-box' 
        }}>
          {selectedUser ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
              {/* Header / Info Básica */}
              <div className="card glass-panel" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.25rem', 
                padding: isMobile ? '1.25rem 1rem' : '1.5rem',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {isMobile && (
                  <button 
                    onClick={() => setSelectedUserId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '8px 0',
                      color: 'var(--primary-color, #3b82f6)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      marginBottom: '1rem',
                      alignSelf: 'flex-start'
                    }}
                  >
                    <ArrowLeft size={18} strokeWidth={2.5} /> Volver a la Lista
                  </button>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                  {/* Avatar circular con iniciales */}
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: '#FAF5F0', 
                    color: 'var(--primary-color, #3b82f6)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {getInitials(selectedUser.name)}
                  </div>
                  
                  {/* Info: Name and Edit/Delete */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-color, #1e293b)' }}>
                        {selectedUser.name}
                      </h2>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          onClick={openEditModal}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                          className="hover-text-primary"
                          title="Editar datos del cliente"
                        >
                          <Edit size={16} strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={handleDeleteUser}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                          className="hover-text-danger"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Contacto Encapsulada */}
                <div style={{ 
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'stretch' : 'center',
                  gap: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  marginTop: '0.5rem',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem', fontSize: '0.9rem', color: '#475569' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <Mail size={15} strokeWidth={1.5} style={{ color: 'var(--primary-color, #3b82f6)', flexShrink: 0 }} /> 
                        {selectedUser.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, flexShrink: 0 }}>
                        <Phone size={15} strokeWidth={1.5} style={{ color: 'var(--primary-color, #3b82f6)', flexShrink: 0 }} /> 
                        {selectedUser.phone}
                      </span>
                      {selectedUser.dni && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, flexShrink: 0 }}>
                          <FileText size={15} strokeWidth={1.5} style={{ color: 'var(--primary-color, #3b82f6)', flexShrink: 0 }} /> 
                          {selectedUser.dni}
                        </span>
                      )}
                    </div>
                    {(selectedUser.address || selectedUser.city) && (
                      <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <MapPin size={15} strokeWidth={1.5} style={{ color: 'var(--primary-color, #3b82f6)', flexShrink: 0 }} />
                        <span style={{ lineHeight: '1.4' }}>
                          {selectedUser.address}
                          {(selectedUser.cp || selectedUser.city) && ` - ${selectedUser.cp || ''} ${selectedUser.city || ''}`}
                          {selectedUser.province && `, ${selectedUser.province}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <a 
                    href={`mailto:${selectedUser.email}`} 
                    className="btn-send-message" 
                    style={{ 
                      textDecoration: 'none', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem', 
                      flexShrink: 0,
                      background: 'var(--secondary-color, #2563eb)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)',
                      width: isMobile ? '100%' : 'auto',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Mail size={16} strokeWidth={1.5} /> Enviar Mensaje
                  </a>
                </div>
              </div>

              {/* Notas Administrativas - Ancho completo */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'transparent', border: 'none', boxShadow: 'none', padding: '0', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <FileText size={20} color="var(--primary-color)" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-color, #1e293b)' }}>Notas Administrativas</h3>
                </div>
                <textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Añade notas privadas sobre este cliente..."
                  className="clean-textarea"
                  style={{ 
                    width: '100%', 
                    minHeight: '120px', 
                    marginBottom: '1rem', 
                    background: '#FFFFFF', 
                    fontSize: '0.95rem', 
                    padding: '0.8rem 1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #E2E8F0', 
                    fontFamily: 'inherit', 
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button 
                  className="btn-primary" 
                  onClick={handleSaveNotes} 
                  style={{ 
                    width: isMobile ? '100%' : 'fit-content', 
                    alignSelf: 'flex-end', 
                    padding: '10px 20px', 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Guardar Notas
                </button>
              </div>

              {/* Historial de Citas: Ancho completo */}
              <div className="card glass-panel" style={{ 
                width: '100%', 
                boxSizing: 'border-box', 
                padding: isMobile ? '1.25rem 1rem' : '1.5rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Calendar size={20} color="var(--primary-color)" />
                  <h3 style={{ margin: 0 }}>Historial Completo de Citas</h3>
                </div>
                
                {userAppointments.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem', width: '100%' }}>
                    {userAppointments.map(appt => {
                      const service = services.find(s => s.id === appt.serviceId);
                      const serviceColor = service?.color || 'var(--primary-color, #3b82f6)';
                      const statusStyle = getStatusStyle(appt.status);
                      
                      return (
                        <div 
                          key={appt.id} 
                          className="appt-history-item" 
                          style={{ 
                            padding: '1.25rem', 
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0', 
                            borderLeft: `4px solid ${serviceColor}`,
                            borderRadius: '8px', 
                            display: 'flex', 
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between', 
                            alignItems: isMobile ? 'flex-start' : 'center',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            width: '100%',
                            boxSizing: 'border-box',
                            gap: '1rem'
                          }}
                        >
                          {/* Info Column (Left) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                            {/* Fila 1: 👤 Elena + edit sutil */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '1rem', color: '#1E293B' }}>
                                <UserIcon size={14} strokeWidth={1.5} style={{ color: 'var(--primary-color, #3b82f6)' }} />
                                {selectedUser.name}
                              </span>
                              <button 
                                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#94A3B8', transition: 'color 0.2s' }}
                                className="hover-text-primary"
                                title="Editar cita"
                                onClick={() => {
                                  alert('Edición de citas disponible desde el panel principal de calendario.');
                                }}
                              >
                                <Edit size={14} strokeWidth={1.5} />
                              </button>
                            </div>
                            
                            {/* Fila 2: 🏷️ Medicina General / Familiar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', color: '#64748B' }}>
                              <Tag size={14} strokeWidth={1.5} style={{ color: '#94A3B8' }} />
                              <span style={{ fontWeight: 500 }}>
                                {service?.name || 'Servicio'}
                              </span>
                            </div>
                            
                            {/* Fila 3: 📅 18/5/26 - 9:30 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#475569' }}>
                              <Calendar size={14} strokeWidth={1.5} style={{ color: '#94A3B8' }} />
                              <span>{formatDateShort(appt.dateTimeStart)}</span>
                            </div>

                            {/* Notas de la Cita */}
                            {appt.adminNotes && (
                              <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }} title={appt.adminNotes}>
                                <span>📌</span> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>{appt.adminNotes}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Status and Action Column (Right) */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '0.5rem', width: isMobile ? '100%' : 'auto', flexShrink: 0 }}>
                            <span 
                              style={{ 
                                padding: '0.35rem 0.75rem', 
                                borderRadius: '100px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                textAlign: 'center',
                                alignSelf: isMobile ? 'flex-start' : 'flex-end'
                              }}
                            >
                              {appt.status === 'PENDING' ? 'PENDIENTE' : 
                               appt.status === 'CONFIRMED' ? 'CONFIRMADA' : 
                               appt.status === 'COMPLETED' ? 'COMPLETADA' : 'CANCELADA'}
                            </span>
                            
                            {appt.status === 'PENDING' && (
                              <button 
                                className="btn-primary" 
                                style={{ 
                                  padding: '8px 14px', 
                                  fontSize: '0.8rem', 
                                  fontWeight: 600, 
                                  borderRadius: '8px',
                                  background: 'var(--primary-color, #3b82f6)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
                                  marginTop: '4px',
                                  textAlign: 'center',
                                  width: isMobile ? '100%' : 'auto'
                                }}
                                onClick={async () => {
                                  try {
                                    await repo.saveAppointment({ ...appt, status: 'CONFIRMED' });
                                    loadData();
                                  } catch (e) {
                                    console.error(e);
                                    alert('Error al confirmar la cita');
                                  }
                                }}
                              >
                                Aceptar Cita
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
