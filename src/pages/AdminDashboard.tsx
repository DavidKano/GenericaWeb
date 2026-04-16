import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { Appointment, BookingService, DaySchedule, BusinessConfig } from '../services/models';
import { 
  BarChart3, 
  Settings, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  XCircle
} from 'lucide-react';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes es el inicio
  getDay,
  locales,
});

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
  const [newColor, setNewColor] = useState('#3174ad');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Controles de Vista de Calendario
  const [currentView, setCurrentView] = useState<any>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Variables del Modal de Citas en el Calendario
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventNotes, setEventNotes] = useState('');

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

  const addOrUpdateService = async () => {
    if (!newName.trim()) return;
    const svc: BookingService = {
      id: editingServiceId || 'svc-' + Date.now(),
      name: newName,
      durationMin: newDuration,
      price: newPrice || undefined,
      color: newColor,
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
    setNewColor('#3174ad');
    setEditingServiceId(null);
  };

  const openEditService = (svc: BookingService) => {
    setEditingServiceId(svc.id);
    setNewName(svc.name);
    setNewDuration(svc.durationMin);
    setNewPrice(svc.price || 0);
    setNewColor(svc.color || '#3174ad');
    setShowModal(true);
  };
  
  const openNewService = () => {
    resetServiceForm();
    setShowModal(true);
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

  const getDayName = (num: number) => {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return names[num];
  };

  // Preparar eventos para react-big-calendar
  const events = useMemo(() => {
    return appointments.map(app => {
      const service = services.find(s => s.id === app.serviceId);
      const duration = service?.durationMin || 30;
      const start = new Date(app.dateTimeStart);
      const end = new Date(start.getTime() + duration * 60000);
      
      return {
        id: app.id,
        title: app.customerId, // Mostrar identificador o nombre del cliente
        start,
        end,
        resource: app,
        color: service?.color || '#3174ad'
      };
    });
  }, [appointments, services]);

  const eventPropGetter = (event: any) => {
    return { 
      style: { 
        backgroundColor: event.color,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        display: 'block',
        fontSize: '0.85rem'
      } 
    };
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setEventNotes(event.resource.adminNotes || '');
    setShowEventModal(true);
  };

  const updateAppointment = async (updatedFields: Partial<Appointment>) => {
    if (!selectedEvent) return;
    const updatedAppt = { ...selectedEvent.resource, ...updatedFields };
    await repo.saveAppointment(updatedAppt);
    // Refresh modal local state if status changes dynamically, but typically we close or reload
    setShowEventModal(false);
    loadData();
  };

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.dateTimeStart);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

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

          <div className="card glass-panel" style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem' }}>Calendario de Reservas</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', background: 'white', color: 'black', borderRadius: '8px', padding: '1rem', fontFamily: 'inherit' }}
                eventPropGetter={eventPropGetter}
                onSelectEvent={handleSelectEvent}
                culture="es"
                views={['month', 'week', 'day']}
                view={currentView as any}
                onView={(v) => setCurrentView(v)}
                date={currentDate}
                onNavigate={(d) => setCurrentDate(d)}
                messages={{
                  week: 'Semana',
                  work_week: 'Semana de trabajo',
                  day: 'Día',
                  month: 'Mes',
                  previous: 'Atrás',
                  next: 'Siguiente',
                  today: 'Hoy',
                  agenda: 'Agenda',
                  noEventsInRange: 'No hay citas en este rango',
                  showMore: total => `+${total} más`
                }}
                min={new Date(1970, 0, 1, 8, 0, 0)} // Start at 8 AM
                max={new Date(1970, 0, 1, 21, 0, 0)} // End at 9 PM
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'services' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3>Servicios Disponibles</h3>
            <button className="btn-primary" onClick={openNewService}>+ Añadir Nuevo</button>
          </div>
          <div className="services-grid">
            {services.map(svc => (
              <div key={svc.id} className="service-card hover-glow" onClick={() => openEditService(svc)} style={{ cursor: 'pointer', transition: 'border 0.2s', border: '1px solid var(--glass-border)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{svc.name}</h3>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>Editar</span>
                </div>
                <div className="service-meta">
                  <span>⏱ {svc.durationMin} min</span>
                  {svc.price !== undefined && <span>💰 {svc.price}€</span>}
                </div>
                <div className="service-meta" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '16px', height: '16px', backgroundColor: svc.color || '#3174ad', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '0.8rem' }}>Color en calendario</span>
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
            <h2>{editingServiceId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
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
            <div className="form-group">
              <label>Color en el Calendario</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Identificador visual en la agenda</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={addOrUpdateService}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles Cita (Calendario) */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Detalles de Cita</h2>
                <button className="btn-icon" onClick={() => setShowEventModal(false)}><XCircle /></button>
            </div>
            
            <div className="form-group" style={{ 
              background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${selectedEvent.color}` 
            }}>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Cliente:</strong> {selectedEvent.resource.customerId}</p>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Servicio:</strong> {services.find(s => s.id === selectedEvent.resource.serviceId)?.name}</p>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Fecha:</strong> {new Date(selectedEvent.start).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>Estado actual:</strong> 
                  <span className={`status-badge status-${selectedEvent.resource.status}`}>{selectedEvent.resource.status}</span>
              </p>
            </div>
            
            <div className="form-group">
              <label>Actualizar Estado</label>
              <select 
                value={selectedEvent.resource.status} 
                onChange={(e) => updateAppointment({ status: e.target.value as any })}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="PENDING">Pendiente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notas Privadas (Administración)</label>
              <textarea 
                value={eventNotes} 
                onChange={e => setEventNotes(e.target.value)} 
                rows={4}
                placeholder="Añade notas o recordatorios internos sobre esta cita..."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
            </div>
            
            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowEventModal(false)}>Cerrar sin guardar notas</button>
              <button className="btn-primary" onClick={() => updateAppointment({ adminNotes: eventNotes })}>Guardar Notas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
