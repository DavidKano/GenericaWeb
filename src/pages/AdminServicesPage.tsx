import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import type { BookingService, BusinessConfig } from '../services/models';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';
import { Trash2, Clock, Euro, Edit3, Briefcase, Folder, X } from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
  const { repo } = useData();


  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [services, setServices] = useState<BookingService[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState(0);
  const [newHours, setNewHours] = useState(0);
  const [newMinutes, setNewMinutes] = useState(0);
  const [newPrice, setNewPrice] = useState<number | string>('');
  const [newColor, setNewColor] = useState('#3174ad');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Folder management
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [svcs, cfg] = await Promise.all([
        repo.getServices(),
        repo.getConfig(),
      ]);
      setServices(svcs);
      setConfig(cfg || INITIAL_BUSINESS_CONFIG);
    } catch (err: any) {
      console.error('Error cargando servicios:', err);
      setErrorMessage(err.message || 'Error de conexión con Firestore');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repo]);

  const addOrUpdateService = async () => {
    if (!newName.trim()) return;
    
    try {
      const totalDuration = (newDays * 1440) + (newHours * 60) + newMinutes;
      const svc: BookingService = {
        id: editingServiceId || 'svc-' + Date.now(),
        name: newName,
        durationMin: totalDuration,
        color: newColor,
        isActive: newIsActive,
        ...(newFolderName ? { folderName: newFolderName } : {}),
      };
      
      if (newPrice !== '' && newPrice !== undefined && newPrice !== null) {
        svc.price = Number(newPrice);
      }

      await repo.saveService(svc);
      setShowModal(false);
      resetServiceForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert('Error al guardar el servicio: ' + (error.message || 'Error desconocido'));
    }
  };

  const deleteService = async () => {
    if (!editingServiceId) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) {
      try {
        await repo.deleteService(editingServiceId);
        setShowModal(false);
        resetServiceForm();
        loadData();
      } catch (error: any) {
        console.error('Error deleting service:', error);
        alert('Error al eliminar el servicio: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  const resetServiceForm = () => {
    setNewName('');
    setNewDays(0);
    setNewHours(0);
    setNewMinutes(0);
    setNewPrice('');
    setNewColor('#3174ad');
    setNewIsActive(true);
    setNewFolderName('');
    setEditingServiceId(null);
  };

  const openEditService = (svc: BookingService) => {
    setEditingServiceId(svc.id);
    setNewName(svc.name);
    
    const total = svc.durationMin || 0;
    const d = Math.floor(total / 1440);
    const h = Math.floor((total % 1440) / 60);
    const m = total % 60;
    
    setNewDays(d);
    setNewHours(h);
    setNewMinutes(m);
    
    setNewPrice(svc.price !== undefined ? svc.price : '');
    setNewColor(svc.color || '#3174ad');
    setNewIsActive(svc.isActive !== false);
    setNewFolderName(svc.folderName || '');
    setShowModal(true);
  };
  
  const openNewService = () => {
    resetServiceForm();
    setShowModal(true);
  };

  const addFolder = async () => {
    if (!newFolderInput.trim()) return;
    const folders = config?.serviceFolders || [];
    if (folders.includes(newFolderInput.trim())) {
      alert('Esta carpeta ya existe.');
      return;
    }
    const newConfig = { ...(config || INITIAL_BUSINESS_CONFIG), serviceFolders: [...folders, newFolderInput.trim()] } as BusinessConfig;
    setConfig(newConfig);
    try {
      await repo.saveConfig(newConfig);
      setNewFolderInput('');
      setShowFolderModal(false);
    } catch (e: any) {
      console.error(e);
      alert('Error guardando carpeta');
    }
  };

  const deleteFolder = async (folder: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la carpeta "${folder}"? Los servicios que contenga quedarán sin carpeta.`)) return;
    
    const folders = (config?.serviceFolders || []).filter(f => f !== folder);
    const newConfig = { ...(config || INITIAL_BUSINESS_CONFIG), serviceFolders: folders } as BusinessConfig;
    setConfig(newConfig);
    try {
      await repo.saveConfig(newConfig);
    } catch (e: any) {
      console.error(e);
      alert('Error al eliminar la carpeta');
    }
  };

  return (
    <div className="animate-fade-in">
      <style>{`
        /* Service Cards styling overrides for premium layout */
        .service-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .service-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025) !important;
          border-color: var(--primary-color, #3b82f6) !important;
        }
        .service-card .service-edit-btn {
          background: rgba(0, 0, 0, 0.03);
          color: var(--text-secondary, #718096);
          transition: all 0.2s ease;
        }
        .service-card:hover .service-edit-btn {
          background: var(--primary-color, #3b82f6) !important;
          color: white !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🛠️ Servicios Disponibles</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => setShowFolderModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            + Añadir Carpeta
          </button>
          <button className="btn-primary" onClick={openNewService} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            + Añadir Servicio
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Cargando servicios...</p>
        </div>
      )}

      {errorMessage && (
        <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#ef4444', marginBottom: '1.5rem' }}>Error</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{errorMessage}</p>
          <button className="btn-primary" onClick={loadData}>Reintentar</button>
        </div>
      )}

      {!isLoading && !errorMessage && (
        <>
          {(config?.serviceFolders || []).map(folder => {
            const folderServices = services.filter(s => s.folderName === folder);
            return (
              <div key={folder} style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-color)' }}>📁 {folder}</h4>
                  <button className="btn-icon" onClick={() => deleteFolder(folder)} title="Eliminar carpeta" style={{ color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {folderServices.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 }}>Carpeta vacía</p>
                ) : (
                  <div className="services-grid">
                    {folderServices.map(svc => (
                      <div 
                        key={svc.id} 
                        className="service-card hover-glow" 
                        onClick={() => openEditService(svc)} 
                        style={{ 
                          position: 'relative',
                          cursor: 'pointer', 
                          border: '1px solid #EDF2F7', 
                          borderTop: '1px solid #EDF2F7',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          background: 'var(--surface-color, #ffffff)',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '125px',
                          boxSizing: 'border-box'
                        }} 
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ 
                              margin: 0, 
                              fontSize: '1.05rem', 
                              fontWeight: '600', 
                              color: 'var(--text-primary, #1A202C)',
                              lineHeight: '1.4'
                            }}>
                              {svc.name}
                            </h3>
                            {svc.isActive === false && (
                              <span style={{ 
                                display: 'inline-block',
                                background: 'rgba(239, 68, 68, 0.08)', 
                                color: '#ef4444', 
                                fontSize: '11px', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontWeight: 'bold',
                                marginTop: '6px',
                                letterSpacing: '0.5px'
                              }}>
                                DESACTIVADO
                              </span>
                            )}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.03)',
                            color: 'var(--text-secondary, #718096)',
                            transition: 'background 0.2s',
                          }}
                          className="service-edit-btn"
                          >
                            <Edit3 size={13} />
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: '12px', 
                          marginTop: 'auto',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid rgba(0,0,0,0.03)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#718096' }}>
                            <Clock size={14} style={{ color: '#A0AEC0' }} />
                            <span>{svc.durationMin} min</span>
                          </div>
                          
                          {svc.price !== undefined && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#718096' }}>
                              <Euro size={14} style={{ color: '#A0AEC0' }} />
                              <span>{svc.price}€</span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#718096' }}>
                            <span style={{ 
                              width: '10px', 
                              height: '10px', 
                              backgroundColor: svc.color || '#3174ad', 
                              borderRadius: '50%', 
                              display: 'inline-block',
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                            }}></span>
                            <span>Color</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: (config?.serviceFolders?.length || 0) > 0 ? '2rem' : '0' }}>
            {(config?.serviceFolders?.length || 0) > 0 && <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Sin Carpeta</h4>}
            <div className="services-grid">
              {services.filter(s => !s.folderName || !(config?.serviceFolders || []).includes(s.folderName)).map(svc => (
                <div 
                  key={svc.id} 
                  className="service-card hover-glow" 
                  onClick={() => openEditService(svc)} 
                  style={{ 
                    position: 'relative',
                    cursor: 'pointer', 
                    border: '1px solid #EDF2F7', 
                    borderTop: '1px solid #EDF2F7',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    background: 'var(--surface-color, #ffffff)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '125px',
                    boxSizing: 'border-box'
                  }} 
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.05rem', 
                        fontWeight: '600', 
                        color: 'var(--text-primary, #1A202C)',
                        lineHeight: '1.4'
                      }}>
                        {svc.name}
                      </h3>
                      {svc.isActive === false && (
                        <span style={{ 
                          display: 'inline-block',
                          background: 'rgba(239, 68, 68, 0.08)', 
                          color: '#ef4444', 
                          fontSize: '11px', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontWeight: 'bold',
                          marginTop: '6px',
                          letterSpacing: '0.5px'
                        }}>
                          DESACTIVADO
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.03)',
                      color: 'var(--text-secondary, #718096)',
                      transition: 'background 0.2s',
                    }}
                    className="service-edit-btn"
                    >
                      <Edit3 size={13} />
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '12px', 
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#718096' }}>
                      <Clock size={14} style={{ color: '#A0AEC0' }} />
                      <span>{svc.durationMin} min</span>
                    </div>
                    
                    {svc.price !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#718096' }}>
                        <Euro size={14} style={{ color: '#A0AEC0' }} />
                        <span>{svc.price}€</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#718096' }}>
                      <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        backgroundColor: svc.color || '#3174ad', 
                        borderRadius: '50%', 
                        display: 'inline-block',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                      }}></span>
                      <span>Color</span>
                    </div>
                  </div>
                </div>
              ))}
              {services.filter(s => !s.folderName || !(config?.serviceFolders || []).includes(s.folderName)).length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay servicios sueltos.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Nuevo/Editar Servicio */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content animate-pop-in" style={{ maxWidth: '500px', width: '100%', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} strokeWidth={1.5} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', letterSpacing: '-0.02em', color: '#0F172A' }}>
                  {editingServiceId ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#F43F5E'}
                onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={e => e.preventDefault()}>
              {/* Campo: Nombre */}
              <div className="form-group" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '500', color: '#475569' }}>Nombre del servicio</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Briefcase size={14} strokeWidth={1.5} />
                  </span>
                  <input 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="Ej: Corte de pelo" 
                    style={{ 
                      width: '100%', 
                      padding: '0.45rem 0.8rem 0.45rem 2.2rem', 
                      borderRadius: '8px', 
                      background: '#FFFFFF', 
                      border: '1px solid #E2E8F0', 
                      color: '#1E293B',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Duración del Servicio */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '500', color: '#475569' }}>Duración del Servicio</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-start' }}>
                  {/* Días */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      min="0" 
                      value={newDays} 
                      onChange={e => setNewDays(Math.max(0, Number(e.target.value)))} 
                      style={{ 
                        width: '70px', 
                        padding: '0.45rem 0.6rem', 
                        borderRadius: '8px', 
                        background: '#FFFFFF', 
                        border: '1px solid #E2E8F0', 
                        color: '#1E293B',
                        fontSize: '0.85rem',
                        textAlign: 'right',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>días</span>
                  </div>
                  {/* Horas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      min="0" 
                      max="23" 
                      value={newHours} 
                      onChange={e => setNewHours(Math.max(0, Number(e.target.value)))} 
                      style={{ 
                        width: '70px', 
                        padding: '0.45rem 0.6rem', 
                        borderRadius: '8px', 
                        background: '#FFFFFF', 
                        border: '1px solid #E2E8F0', 
                        color: '#1E293B',
                        fontSize: '0.85rem',
                        textAlign: 'right',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>h</span>
                  </div>
                  {/* Minutos */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      min="0" 
                      max="59" 
                      value={newMinutes} 
                      onChange={e => setNewMinutes(Math.max(0, Number(e.target.value)))} 
                      style={{ 
                        width: '70px', 
                        padding: '0.45rem 0.6rem', 
                        borderRadius: '8px', 
                        background: '#FFFFFF', 
                        border: '1px solid #E2E8F0', 
                        color: '#1E293B',
                        fontSize: '0.85rem',
                        textAlign: 'right',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>min</span>
                  </div>
                </div>
              </div>

              {/* Campo: Precio */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '500', color: '#475569' }}>Precio (€, opcional)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '150px', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Euro size={14} strokeWidth={1.5} />
                  </span>
                  <input 
                    type="number" 
                    value={newPrice} 
                    onChange={e => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                    placeholder="Ej: 25"
                    style={{ 
                      width: '100%', 
                      padding: '0.45rem 0.8rem 0.45rem 2.2rem', 
                      borderRadius: '8px', 
                      background: '#FFFFFF', 
                      border: '1px solid #E2E8F0', 
                      color: '#1E293B',
                      fontSize: '0.85rem',
                      textAlign: 'right',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Campo: Color en el Calendario */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '500', color: '#475569' }}>Color en el Calendario</label>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <input 
                      type="color" 
                      value={newColor} 
                      onChange={e => setNewColor(e.target.value)} 
                      style={{ 
                        position: 'absolute',
                        width: '150%',
                        height: '150%',
                        padding: 0,
                        margin: 0,
                        border: 'none',
                        cursor: 'pointer',
                        background: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none'
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Identificador visual en la agenda</span>
                </div>
              </div>

              {/* Campo: Carpeta */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '500', color: '#475569' }}>Carpeta (Categoría)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '320px', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Folder size={14} strokeWidth={1.5} />
                  </span>
                  <select 
                    value={newFolderName} 
                    onChange={e => setNewFolderName(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.45rem 2rem 0.45rem 2.2rem', 
                      borderRadius: '8px', 
                      background: '#FFFFFF', 
                      border: '1px solid #E2E8F0', 
                      color: '#1E293B',
                      fontSize: '0.85rem',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '14px',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Sin carpeta</option>
                    {(config?.serviceFolders || []).map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox: Servicio Activo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem', padding: '0.6rem 0.8rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '1.2rem' }}>
                <input 
                  type="checkbox" 
                  id="svc-active" 
                  checked={newIsActive} 
                  onChange={e => setNewIsActive(e.target.checked)} 
                  style={{ 
                    width: '15px', 
                    height: '15px', 
                    cursor: 'pointer',
                    accentColor: 'var(--primary-color)',
                    margin: 0
                  }}
                />
                <label htmlFor="svc-active" style={{ margin: 0, cursor: 'pointer', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                  Servicio Activo <span style={{ color: '#94A3B8', fontWeight: 'normal', fontSize: '0.75rem' }}>(Los clientes pueden reservarlo online)</span>
                </label>
              </div>

              {/* Acciones */}
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingServiceId && (
                    <button 
                      type="button"
                      className="btn-secondary" 
                      onClick={deleteService} 
                      style={{ 
                        height: '38px',
                        padding: '0 1rem',
                        borderRadius: '8px',
                        color: '#ef4444', 
                        borderColor: '#ef4444', 
                        background: 'transparent',
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#fef2f2';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Trash2 size={15} /> Eliminar
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    style={{
                      height: '38px',
                      padding: '0 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#475569',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#94A3B8';
                      e.currentTarget.style.color = '#1E293B';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={addOrUpdateService}
                    style={{
                      height: '38px',
                      padding: '0 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--primary-color)',
                      color: '#FFFFFF',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.filter = 'brightness(1.05)';
                      e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(59, 130, 246, 0.3), 0 3px 6px -2px rgba(59, 130, 246, 0.15)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.filter = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)';
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Carpeta */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2>Añadir Carpeta</h2>
            <div className="form-group">
              <label>Nombre de la carpeta</label>
              <input 
                autoFocus
                value={newFolderInput} 
                onChange={e => setNewFolderInput(e.target.value)} 
                placeholder="Ej: Peluquería, Estética..." 
                onKeyDown={(e) => { if(e.key === 'Enter') addFolder(); }}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => setShowFolderModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addFolder}>Añadir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
