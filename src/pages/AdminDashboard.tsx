import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { User, Appointment, BookingService, DaySchedule, BusinessConfig } from '../services/models';
import { INITIAL_SCHEDULES } from '../services/scheduleDefaults';
import { 
  BarChart3, 
  Settings, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  XCircle,
  User as UserIcon
} from 'lucide-react';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
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
  const { isInitialized } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState(0);
  const [newHours, setNewHours] = useState(0);
  const [newMinutes, setNewMinutes] = useState(0);
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
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventServiceId, setEventServiceId] = useState('');
  const [eventStatus, setEventStatus] = useState<any>('PENDING');

  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [repo, isInitialized]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Cargamos cada recurso individualmente para identificar cuál falla específicamente
      const apptsPromise = repo.getAppointments().catch(e => { throw new Error(`Citas: ${e.message}`); });
      const svcsPromise = repo.getServices().catch(e => { throw new Error(`Servicios: ${e.message}`); });
      const usersPromise = repo.getUsers().catch(e => { throw new Error(`Usuarios: ${e.message}`); });
      const schsPromise = repo.getSchedules().catch(e => { throw new Error(`Horarios: ${e.message}`); });
      const cfgPromise = repo.getConfig().catch(e => { throw new Error(`Configuración: ${e.message}`); });
 
      const [appts, svcs, usrs, schs, cfg] = await Promise.all([
        apptsPromise,
        svcsPromise,
        usersPromise,
        schsPromise,
        cfgPromise,
      ]);
 
      setAppointments(appts);
      setServices(svcs);
      setUsers(usrs);
      setSchedules(schs.length > 0 ? schs : INITIAL_SCHEDULES);
      setConfig(cfg);
    } catch (err: any) {
      console.error('Error cargando panel de administrador:', err);
      // El mensaje ahora dirá algo como "Servicios: Missing or insufficient permissions"
      setErrorMessage(err.message || 'Error de conexión con Firestore');
    } finally {
      setIsLoading(false);
    }
  };

  const addOrUpdateService = async () => {
    if (!newName.trim()) return;
    const totalDuration = (newDays * 1440) + (newHours * 60) + newMinutes;
    const svc: BookingService = {
      id: editingServiceId || 'svc-' + Date.now(),
      name: newName,
      durationMin: totalDuration,
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
    setNewDays(0);
    setNewHours(0);
    setNewMinutes(0);
    setNewPrice(0);
    setNewColor('#3174ad');
    setEditingServiceId(null);
  };

  const openEditService = (svc: BookingService) => {
    setEditingServiceId(svc.id);
    setNewName(svc.name);
    
    // Split durationMin into d/h/m
    const total = svc.durationMin || 0;
    const d = Math.floor(total / 1440);
    const h = Math.floor((total % 1440) / 60);
    const m = total % 60;
    
    setNewDays(d);
    setNewHours(h);
    setNewMinutes(m);
    
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
      const customer = users.find(u => u.id === app.customerId);
      const duration = service?.durationMin || 30;
      const start = new Date(app.dateTimeStart);
      const end = new Date(start.getTime() + duration * 60000);
      
      return {
        id: app.id,
        title: `${customer?.name || 'Cliente'} - ${service?.name || ''}`,
        start,
        end,
        resource: app,
        color: service?.color || '#3174ad'
      };
    });
  }, [appointments, services, users]);

  const calendarBounds = useMemo(() => {
    let minH = 24;
    let maxH = 0;
    let hasRanges = false;
    
    schedules.forEach(day => {
      if (day.isOpen) {
        day.ranges.forEach(r => {
          hasRanges = true;
          const startH = parseInt(r.start.split(':')[0], 10);
          const endH = parseInt(r.end.split(':')[0], 10);
          if (startH < minH) minH = startH;
          if (endH > maxH) maxH = endH;
        });
      }
    });

    if (!hasRanges) {
      minH = 8;
      maxH = 20;
    }

    minH = Math.max(0, minH - 1);
    maxH = Math.min(23, maxH + 1);

    return {
      min: new Date(1970, 0, 1, minH, 0, 0),
      max: new Date(1970, 0, 1, maxH, 59, 59),
    }
  }, [schedules]);

  const slotPropGetter = (date: Date) => {
    if (currentView === 'month') return {};

    const dayOfWeek = date.getDay();
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!daySchedule || !daySchedule.isOpen) {
      return { className: 'rbc-off-range-bg', style: { backgroundColor: 'var(--bg-color)', opacity: 0.5 } };
    }

    const minutes = date.getHours() * 60 + date.getMinutes();
    const isWithinAnyRange = daySchedule.ranges.some(r => {
      const [startH, startM] = r.start.split(':').map(Number);
      const [endH, endM] = r.end.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      return minutes >= startMin && minutes < endMin;
    });

    if (!isWithinAnyRange) {
       return { className: 'rbc-off-range-bg', style: { backgroundColor: 'var(--bg-color)', opacity: 0.5 } };
    }
    
    return {};
  };

  const dayPropGetter = (date: Date) => {
    const daySchedule = schedules.find(s => s.dayOfWeek === date.getDay());
    if (!daySchedule || !daySchedule.isOpen) {
       return { className: 'rbc-off-range-bg', style: { backgroundColor: 'var(--bg-color)' } };
    }
    return {};
  };

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
    setEventServiceId(event.resource.serviceId);
    setEventStatus(event.resource.status);
    
    // YYYY-MM-DD
    const d = new Date(event.start);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setEventDate(`${yyyy}-${mm}-${dd}`);
    // HH:mm
    const hh = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    setEventTime(`${hh}:${mins}`);
    
    setShowEventModal(true);
  };

  const handleSaveEventEdits = () => {
    if (!selectedEvent) return;
    const newDate = new Date(`${eventDate}T${eventTime}`);
    updateAppointment({
      serviceId: eventServiceId,
      dateTimeStart: newDate.getTime(),
      adminNotes: eventNotes,
      status: eventStatus
    });
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

      {isLoading && (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Cargando agenda de negocio...</p>
        </div>
      )}

      {errorMessage && (
        <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#ef4444', marginBottom: '1.5rem' }}>Error de Conexión</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{errorMessage}</p>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '2rem', textAlign: 'left' }}>
            <p><strong>Posible causa:</strong> Las reglas de Firestore no están publicadas o no tienes permisos suficientes para acceder a estos datos.</p>
          </div>
          <button className="btn-primary" onClick={loadData}>Reintentar Conexión</button>
        </div>
      )}

      {!isLoading && !errorMessage && activeTab === 'stats' && (
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
                formats={{
                  eventTimeRangeFormat: () => '',
                }}
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
                min={calendarBounds.min}
                max={calendarBounds.max}
                slotPropGetter={slotPropGetter}
                dayPropGetter={dayPropGetter}
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

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <div>
              <label style={{ margin: 0 }}>Servicios simultáneos (Capacidad)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Define cuántas citas se pueden realizar a la vez en la misma franja horaria (Ej: número de puestos o empleados).</p>
            </div>
            <input 
              type="number" 
              min="1"
              value={config?.concurrentSlots || 1} 
              onChange={(e) => setConfig(prev => prev ? { ...prev, concurrentSlots: Math.max(1, parseInt(e.target.value) || 1) } : null)}
              style={{ width: '80px', textAlign: 'center' }}
            />
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <button className="btn-primary" onClick={saveGlobalConfig} style={{ width: '100%' }}>Guardar Ajustes</button>
          </div>
        </div>
      )}

      {/* Modal Nuevo Servicio */}
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
              <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Color en el Calendario</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Identificador visual en la agenda</span>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '2rem' }}>
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
            
            <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <div style={{ background: 'var(--primary-color)', color: 'white', padding: '8px', borderRadius: '8px' }}>
                 <UserIcon size={24} />
               </div>
               <div>
                 <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                   {users.find(u => u.id === selectedEvent.resource.customerId)?.name || selectedEvent.resource.customerId}
                 </h3>
                 <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                   {users.find(u => u.id === selectedEvent.resource.customerId)?.phone || 'Sin teléfono'}
                 </p>
               </div>
            </div>
            
            <div className="form-group">
              <label>Cambiar Servicio</label>
              <select 
                value={eventServiceId} 
                onChange={e => setEventServiceId(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              >
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.durationMin} min)</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label>Fecha de la Cita</label>
                <input 
                  type="date" 
                  value={eventDate} 
                  onChange={e => setEventDate(e.target.value)} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                />
              </div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label>Hora de Inicio</label>
                <input 
                  type="time" 
                  value={eventTime} 
                  onChange={e => setEventTime(e.target.value)} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Actualizar Estado</label>
              <select 
                value={eventStatus} 
                onChange={(e) => setEventStatus(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              >
                <option value="PENDING">Pendiente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada (Anular)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label>Notas Privadas (Administración)</label>
              <textarea 
                value={eventNotes} 
                onChange={e => setEventNotes(e.target.value)} 
                rows={3}
                placeholder="Añade notas o recordatorios internos sobre esta cita..."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
            </div>
            
            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowEventModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveEventEdits}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
