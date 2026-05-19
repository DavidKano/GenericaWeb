import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import type { BookingService, BusinessConfig } from '../services/models';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';
import { Trash2 } from 'lucide-react';

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
                      <div key={svc.id} className="service-card hover-glow" onClick={() => openEditService(svc)} style={{ cursor: 'pointer', transition: 'border 0.2s', border: '1px solid var(--glass-border)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0 }}>{svc.name}</h3>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>Editar</span>
                        </div>
                        <div className="service-meta" style={{ marginTop: '0.5rem' }}>
                          <span>⏱ {svc.durationMin} min</span>
                          {svc.price !== undefined && <span>💰 {svc.price}€</span>}
                        </div>
                        <div className="service-meta" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '16px', height: '16px', backgroundColor: svc.color || '#3174ad', borderRadius: '50%', display: 'inline-block' }}></span>
                          <span style={{ fontSize: '0.8rem' }}>Color</span>
                          {svc.isActive === false && (
                            <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>DESACTIVADO</span>
                          )}
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
                <div key={svc.id} className="service-card hover-glow" onClick={() => openEditService(svc)} style={{ cursor: 'pointer', transition: 'border 0.2s', border: '1px solid var(--glass-border)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{svc.name}</h3>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>Editar</span>
                  </div>
                  <div className="service-meta" style={{ marginTop: '0.5rem' }}>
                    <span>⏱ {svc.durationMin} min</span>
                    {svc.price !== undefined && <span>💰 {svc.price}€</span>}
                  </div>
                  <div className="service-meta" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '16px', height: '16px', backgroundColor: svc.color || '#3174ad', borderRadius: '50%', display: 'inline-block' }}></span>
                    <span style={{ fontSize: '0.8rem' }}>Color</span>
                    {svc.isActive === false && (
                      <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>DESACTIVADO</span>
                    )}
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingServiceId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
            <div className="form-group">
              <label>Nombre del servicio</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Corte de pelo" />
            </div>
            <div className="form-group">
              <label>Duración del Servicio</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Días</span>
                  <input type="number" min="0" value={newDays} onChange={e => setNewDays(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Horas</span>
                  <input type="number" min="0" max="23" value={newHours} onChange={e => setNewHours(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Minutos</span>
                  <input type="number" min="0" max="59" value={newMinutes} onChange={e => setNewMinutes(Math.max(0, Number(e.target.value)))} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Precio (€, opcional)</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Color en el Calendario</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Identificador visual en la agenda</span>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Carpeta (Categoría)</label>
              <select 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}
              >
                <option value="">Sin carpeta</option>
                {(config?.serviceFolders || []).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                id="svc-active" 
                checked={newIsActive} 
                onChange={e => setNewIsActive(e.target.checked)} 
                style={{ width: 'auto', margin: 0 }}
              />
              <label htmlFor="svc-active" style={{ margin: 0, cursor: 'pointer' }}>
                <strong>Servicio Activo</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Si se desactiva, los clientes no podrán verlo ni reservarlo.</p>
              </label>
            </div>
            <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {editingServiceId && (
                  <button className="btn-secondary" onClick={deleteService} style={{ color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={addOrUpdateService}>Guardar</button>
              </div>
            </div>
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
