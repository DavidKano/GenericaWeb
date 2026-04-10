import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import type { Appointment, BookingService, DaySchedule, BusinessConfig } from '../services/models';
import { 
  BarChart3, 
  Settings, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react';

type AdminTab = 'stats' | 'services' | 'schedule' | 'config';

export const AdminDashboard: React.FC = () => {
  const { repo } = useData();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newPrice, setNewPrice] = useState(0);

  useEffect(() => {
    loadData();
  }, [repo]);

  const loadData = async () => {
    const [appts, svcs, schs, cfg] = await Promise.all([
      repo.getAppointments(),
      repo.getServices(),
      repo.getSchedules(),
      repo.getConfig(),
    ]);
    setAppointments(appts);
    setServices(svcs);
    setSchedules(schs);
    setConfig(cfg);
  };

  const addService = async () => {
    if (!newName.trim()) return;
    const svc: BookingService = {
      id: 'svc-' + Date.now(),
      name: newName,
      durationMin: newDuration,
      price: newPrice || undefined,
      isActive: true,
    };
    await repo.saveService(svc);
    setShowModal(false);
    resetServiceForm();
    loadData();
  };

  const resetServiceForm = () => {
    setNewName('');
    setNewDuration(30);
    setNewPrice(0);
  };

  const handleScheduleToggle = (dayOfWeek: number) => {
    const newSchedules = schedules.map(s => 
      s.dayOfWeek === dayOfWeek ? { ...s, isOpen: !s.isOpen } : s
    );
    setSchedules(newSchedules);
  };

  const handleAddRange = (dayOfWeek: number) => {
    const newSchedules = schedules.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { ...s, ranges: [...s.ranges, { start: '09:00', end: '14:00' }] } 
        : s
    );
    setSchedules(newSchedules);
  };

  const handleRemoveRange = (dayOfWeek: number, index: number) => {
    const newSchedules = schedules.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { ...s, ranges: s.ranges.filter((_, i) => i !== index) } 
        : s
    );
    setSchedules(newSchedules);
  };

  const handleRangeChange = (dayOfWeek: number, index: number, field: 'start' | 'end', value: string) => {
    const newSchedules = schedules.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { 
            ...s, 
            ranges: s.ranges.map((r, i) => i === index ? { ...r, [field]: value } : r) 
          } 
        : s
    );
    setSchedules(newSchedules);
  };

  const saveAllSchedules = async () => {
    await repo.saveSchedules(schedules);
    alert('Horarios guardados correctamente');
  };

  const saveGlobalConfig = async () => {
    if (config) {
      await repo.saveConfig(config);
      alert('Configuración guardada');
    }
  };

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.dateTimeStart);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const getDayName = (num: number) => {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return names[num];
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>📊 Gestión de Negocio</h2>
        <div className="data-toggle" style={{ background: 'var(--surface-color)', padding: '4px' }}>
          <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}><BarChart3 size={16} /> Resumen</button>
          <button className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}><Plus size={16} /> Servicios</button>
          <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}><Clock size={16} /> Horarios</button>
          <button className={activeTab === 'config' ? 'active' : ''} onClick={() => setActiveTab('config')}><Settings size={16} /> Ajustes</button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-value">{todayAppts.length}</div>
              <div className="stat-label">Citas Hoy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{appointments.filter(a => a.status === 'PENDING').length}</div>
              <div className="stat-label">Pendientes de Confirmar</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{services.length}</div>
              <div className="stat-label">Servicios Activos</div>
            </div>
          </div>

          <div className="card glass-panel">
            <h3 style={{ marginBottom: '1rem' }}>Citas Recientes</h3>
            {appointments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay citas registradas todavía.</p>
            ) : (
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Servicio</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 10).map(a => (
                    <tr key={a.id}>
                      <td>{new Date(a.dateTimeStart).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td><span className={`status-badge status-${a.status}`}>{a.status}</span></td>
                      <td>{services.find(s => s.id === a.serviceId)?.name || 'Servicio eliminado'}</td>
                      <td>{a.customerId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'services' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3>Servicios Disponibles</h3>
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Añadir Nuevo</button>
          </div>
          <div className="services-grid">
            {services.map(svc => (
              <div key={svc.id} className="service-card">
                <h3>{svc.name}</h3>
                <div className="service-meta">
                  <span>⏱ {svc.durationMin} min</span>
                  {svc.price !== undefined && <span>💰 {svc.price}€</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3>Configuración de Horario Semanal</h3>
            <button className="btn-primary" onClick={saveAllSchedules}><Save size={18} /> Guardar Cambios</button>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {schedules.sort((a,b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek)).map(day => (
              <div key={day.dayOfWeek} className="card glass-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', padding: '1.25rem' }}>
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input type="checkbox" checked={day.isOpen} onChange={() => handleScheduleToggle(day.dayOfWeek)} />
                    {getDayName(day.dayOfWeek)}
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {day.isOpen ? 'Abierto' : 'Cerrado'}
                  </p>
                </div>
                
                <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
                  {day.isOpen ? (
                    <>
                      {day.ranges.map((range, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="time" value={range.start} onChange={(e) => handleRangeChange(day.dayOfWeek, idx, 'start', e.target.value)} />
                          <span>-</span>
                          <input type="time" value={range.end} onChange={(e) => handleRangeChange(day.dayOfWeek, idx, 'end', e.target.value)} />
                          <button className="btn-icon" onClick={() => handleRemoveRange(day.dayOfWeek, idx)}><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button className="btn-text" onClick={() => handleAddRange(day.dayOfWeek)} style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>+ Añadir franja</button>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No se pueden realizar reservas este día.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="animate-fade-in card glass-panel" style={{ maxWidth: '600px' }}>
          <h3>Ajustes Generales</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Configuración global del comportamiento de tu plataforma.</p>
          
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label style={{ margin: 0 }}>Permitir cancelaciones por clientes</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Si se activa, los clientes podrán cancelar citas desde su perfil.</p>
            </div>
            <input 
              type="checkbox" 
              checked={config?.allowClientCancellation || false} 
              onChange={(e) => setConfig(prev => prev ? { ...prev, allowClientCancellation: e.target.checked } : null)}
              style={{ width: 'auto' }}
            />
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <button className="btn-primary" onClick={saveGlobalConfig} style={{ width: '100%' }}>Guardar Ajustes</button>
          </div>
        </div>
      )}

      {/* Modal Nuevo Servicio */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Nuevo Servicio</h2>
            <div className="form-group">
              <label>Nombre del servicio</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Corte de pelo" />
            </div>
            <div className="form-group">
              <label>Duración (minutos)</label>
              <input type="number" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Precio (€, opcional)</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addService}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
