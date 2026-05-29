import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Appointment, BookingService, BusinessConfig, User } from '../services/models';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';
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

  // Modal personalizado Premium para alertas y confirmaciones sin URL
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    isAlert?: boolean;
  } | null>(null);

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
    setConfig(cfg || INITIAL_BUSINESS_CONFIG);
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
    setCustomModal({
      isOpen: true,
      title: config?.name || 'Mi Negocio',
      message: 'Perfil actualizado correctamente.',
      isAlert: true,
      confirmText: 'Aceptar'
    });
  };

  const handleCancelAppointment = async (apptId: string) => {
    // Buscar la cita original
    const appts = await repo.getAppointments();
    const appt = appts.find(a => a.id === apptId);
    
    if (!appt) return;

    const marginHours = config?.cancellationMarginHours !== undefined ? config.cancellationMarginHours : 24;
    const limitMs = marginHours * 60 * 60 * 1000;
    const isWithinMargin = (appt.dateTimeStart - Date.now()) < limitMs;
    const businessName = config?.name || 'Mi Negocio';

    if (isWithinMargin) {
      setCustomModal({
        isOpen: true,
        title: businessName,
        message: `No se puede cancelar la cita desde la app porque quedan menos de ${marginHours} horas para tu cita y no está permitido. Por favor, ponte en contacto con nosotros directamente si necesitas realizar cambios.`,
        isAlert: true,
        confirmText: 'Aceptar'
      });
      return;
    }

    setCustomModal({
      isOpen: true,
      title: businessName,
      message: '¿Estás seguro de que deseas cancelar esta reserva?',
      confirmText: 'Sí, cancelar',
      cancelText: 'Volver',
      onConfirm: async () => {
        await repo.saveAppointment({ ...appt, status: 'CANCELLED' });
        loadData();
        setCustomModal(null);
      }
    });
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
                  {futureAppts.map(appt => {
                    const apptDate = new Date(appt.dateTimeStart);
                    const dateStr = apptDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
                    const timeStr = apptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
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
                            <div style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <Clock size={14} style={{ color: 'var(--primary-color)', opacity: 0.8 }} />
                              <span style={{ fontWeight: 500 }}>{formattedDate}</span>
                              <span style={{ color: '#CBD5E1' }}>•</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', background: 'rgba(59, 130, 246, 0.06)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>{timeStr} h</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {(config?.allowClientCancellation !== false) && (() => {
                            const marginHours = config?.cancellationMarginHours !== undefined ? config.cancellationMarginHours : 24;
                            const limitMs = marginHours * 60 * 60 * 1000;
                            const apptIsWithinMargin = (appt.dateTimeStart - Date.now()) < limitMs;

                            return (
                              <button 
                                className="btn-icon" 
                                onClick={() => handleCancelAppointment(appt.id)}
                                style={{ 
                                  color: apptIsWithinMargin ? '#E2E8F0' : '#94A3B8', 
                                  background: 'transparent', 
                                  border: 'none',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  if (apptIsWithinMargin) {
                                    e.currentTarget.style.color = '#EAB308';
                                    e.currentTarget.style.background = 'rgba(234, 179, 8, 0.06)';
                                  } else {
                                    e.currentTarget.style.color = '#EF4444';
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = apptIsWithinMargin ? '#E2E8F0' : '#94A3B8';
                                  e.currentTarget.style.background = 'transparent';
                                }}
                                title={apptIsWithinMargin ? `Plazo de cancelación de ${marginHours}h expirado (Requiere llamada)` : "Cancelar reserva"}
                              >
                                <Trash2 size={18} />
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="card glass-panel" style={{ padding: '0.5rem 1.5rem' }}>
                {pastAppts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem' }}>No hay historial de citas.</p>
                  </div>
                ) : (
                  pastAppts.map((appt, index) => {
                    const isCancelled = appt.status === 'CANCELLED';
                    const serviceName = services.find(s => s.id === appt.serviceId)?.name || 'Servicio';
                    const apptDate = new Date(appt.dateTimeStart);
                    const formattedDate = apptDate.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
                    const formattedTime = apptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div 
                        key={appt.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '1.25rem 0',
                          borderBottom: index === pastAppts.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: '1rem', 
                            color: isCancelled ? 'var(--text-secondary)' : 'var(--text-primary)',
                            textDecoration: isCancelled ? 'line-through' : 'none'
                          }}>
                            {serviceName}
                          </div>
                          <div style={{ 
                            color: '#64748B', 
                            fontSize: '0.85rem', 
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}>
                            <Clock size={12} style={{ opacity: 0.6 }} />
                            <span>{capitalizedDate} • {formattedTime} h</span>
                          </div>
                        </div>
                        
                        <div>
                          {isCancelled ? (
                            <span style={{ 
                              background: '#FEF2F2', 
                              color: '#EF4444', 
                              padding: '4px 10px', 
                              borderRadius: '100px', 
                              fontSize: '0.75rem', 
                              fontWeight: 600 
                            }}>
                              Cancelada
                            </span>
                          ) : (
                            <span style={{ 
                              background: '#F0FDF4', 
                              color: '#16A34A', 
                              padding: '4px 10px', 
                              borderRadius: '100px', 
                              fontSize: '0.75rem', 
                              fontWeight: 600 
                            }}>
                              Completada
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                position: 'absolute', 
                left: '12px', 
                color: '#94A3B8', 
                display: 'flex', 
                alignItems: 'center', 
                pointerEvents: 'none' 
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input 
                value={user.email} 
                disabled 
                style={{ 
                  paddingLeft: '38px', 
                  cursor: 'not-allowed'
                }} 
              />
            </div>
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

      {/* Modal Personalizado Premium */}
      {customModal && customModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
          boxSizing: 'border-box',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card glass-panel" style={{
            maxWidth: '450px',
            width: '100%',
            padding: '2rem',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 128, 128, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--primary-color, #008080)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              ✨ {customModal.title}
            </h3>
            
            <p style={{
              margin: 0,
              fontSize: '0.95rem',
              color: 'var(--text-secondary, #475569)',
              lineHeight: '1.5',
              fontWeight: 500
            }}>
              {customModal.message}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '0.5rem',
              justifyContent: 'center',
              width: '100%'
            }}>
              {!customModal.isAlert && (
                <button
                  type="button"
                  onClick={() => setCustomModal(null)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
                >
                  {customModal.cancelText || 'Cancelar'}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  if (customModal.onConfirm) {
                    customModal.onConfirm();
                  } else {
                    setCustomModal(null);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'var(--primary-color, #008080)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 128, 128, 0.15)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--primary-color, #008080) 90%, #000)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary-color, #008080)'}
              >
                {customModal.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
