import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { User, Appointment, BookingService, DaySchedule, BusinessConfig, CompanyData } from '../services/models';
import { INITIAL_SCHEDULES } from '../services/scheduleDefaults';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';
import { 
  BarChart3, 
  Settings, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  XCircle,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Columns,
  Minus,
  MessageCircle
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

// Variable global para mantener la referencia a la ventana de WhatsApp fuera del ciclo de vida de React
let waWindow: Window | null = null;

const getWhatsAppLink = (phone: string, name: string, date: string, time: string, businessName: string, serviceName: string, useWebVersion?: boolean) => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Aseguramos prefijo 34 si tiene 9 dígitos (formato España)
  const finalPhone = (cleanPhone.length === 9) ? `34${cleanPhone}` : cleanPhone;
  const message = `Hola ${name}, te recuerdo tu cita en ${businessName} el ${date} a las ${time} para ${serviceName}. ¡Te esperamos!`;
  
  if (useWebVersion) {
    return `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};

export const AdminDashboard: React.FC = () => {
  const { repo } = useData();
  const { isInitialized } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState(0);
  const [newHours, setNewHours] = useState(0);
  const [newMinutes, setNewMinutes] = useState(0);
  const [newPrice, setNewPrice] = useState<number | string>('');
  const [newColor, setNewColor] = useState('#3174ad');
  const [newIsActive, setNewIsActive] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Controles de Vista de Calendario
  const [currentView, setCurrentView] = useState<any>(window.innerWidth <= 768 ? 'day' : 'week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Variables del Modal de Citas en el Calendario
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventNotes, setEventNotes] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventServiceId, setEventServiceId] = useState('');
  const [eventStatus, setEventStatus] = useState<any>('PENDING');

  // New manual appointment states
  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mServiceId, setMServiceId] = useState('');
  const [mDate, setMDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mTime, setMTime] = useState('10:00');

  const openWhatsApp = (url: string) => {
    const name = 'whatsappWindow';
    if (!waWindow || waWindow.closed) {
      waWindow = window.open(url, name);
    } else {
      try {
        // Intentamos actualizar la URL directamente (esto puede fallar por cross-origin)
        waWindow.location.href = url;
        waWindow.focus();
      } catch (e) {
        // Si falla por seguridad (cross-origin), usamos window.open con el mismo nombre
        // que es la forma estándar de actualizar una ventana existente
        waWindow = window.open(url, name);
        if (waWindow) waWindow.focus();
      }
    }
  };
  const [mNotes, setMNotes] = useState('');

  useEffect(() => {
    if (isInitialized) {
      loadData();
      
      const unsubscribe = repo.subscribeToAppointments((appts) => {
        setAppointments(appts);
      });
      return () => unsubscribe();
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
      const companyPromise = repo.getCompanyData().catch(e => { throw new Error(`Datos Empresa: ${e.message}`); });
 
      const [appts, svcs, usrs, schs, cfg, comp] = await Promise.all([
        apptsPromise,
        svcsPromise,
        usersPromise,
        schsPromise,
        cfgPromise,
        companyPromise,
      ]);
 
      setAppointments(appts);
      setServices(svcs);
      setUsers(usrs);
      setSchedules(schs.length > 0 ? schs : INITIAL_SCHEDULES);
      setConfig(cfg || INITIAL_BUSINESS_CONFIG);
      setCompanyData(comp);
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
    
    try {
      const totalDuration = (newDays * 1440) + (newHours * 60) + newMinutes;
      const svc: BookingService = {
        id: editingServiceId || 'svc-' + Date.now(),
        name: newName,
        durationMin: totalDuration,
        color: newColor,
        isActive: newIsActive,
      };
      
      // Solo incluimos el precio si tiene un valor válido para evitar errores en Firebase (unsupported field value: undefined)
      if (newPrice !== '' && newPrice !== undefined && newPrice !== null) {
        svc.price = Number(newPrice);
      }

      await repo.saveService(svc);
      setShowModal(false);
      resetServiceForm();
      loadData();
      // No alert here to avoid friction, but the modal closing is feedback enough. 
      // If we wanted success feedback: alert('Servicio guardado correctamente');
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
    
    setNewPrice(svc.price !== undefined ? svc.price : '');
    setNewColor(svc.color || '#3174ad');
    setNewIsActive(svc.isActive !== false);
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
    try {
      await repo.saveSchedules(schedules);
      alert('Horarios guardados correctamente');
    } catch (error: any) {
      console.error('Error saving schedules:', error);
      alert('Error al guardar horarios: ' + (error.message || 'Error desconocido'));
    }
  };

  const saveGlobalConfig = async () => {
    if (config) {
      try {
        await repo.saveConfig(config);
        alert('Configuración guardada');
      } catch (error: any) {
        console.error('Error saving config:', error);
        alert('Error al guardar configuración: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  const getDayName = (num: number) => {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return names[num];
  };

  // Preparar eventos para react-big-calendar
  const events = useMemo(() => {
    return appointments
      .filter(a => a.status !== 'CANCELLED')
      .map(app => {
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
        customer, // Incluimos el objeto cliente para acceso rápido
        service,  // Incluimos el objeto servicio para acceso rápido
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
    try {
      const updatedAppt = { ...selectedEvent.resource, ...updatedFields };
      await repo.saveAppointment(updatedAppt);
      setShowEventModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      alert('Error al actualizar la cita: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleSaveManualAppt = async () => {
    if (!mName || !mPhone || !mServiceId || !mDate || !mTime) {
      alert('Por favor, completa nombre, teléfono, servicio, fecha y hora.');
      return;
    }

    try {
      // 1. Verify or create user
      let userId;
      const existingUser = users.find(u => u.phone === mPhone);
      
      if (existingUser) {
        userId = existingUser.id;
        if (mEmail && !existingUser.email) {
          await repo.saveUser({ ...existingUser, email: mEmail });
        }
      } else {
        userId = 'usr-' + Date.now();
        const newUser: User = {
          id: userId,
          name: mName,
          phone: mPhone,
          email: mEmail,
          role: 'CUSTOMER'
        };
        await repo.saveUser(newUser);
      }

      // 2. Create appointment
      const startDateTime = new Date(`${mDate}T${mTime}`).getTime();
      const newAppt: Appointment = {
        id: 'appt-' + Date.now(),
        customerId: userId,
        serviceId: mServiceId,
        dateTimeStart: startDateTime,
        status: 'CONFIRMED', // Manual is auto-confirmed
        adminNotes: mNotes
      };

      await repo.saveAppointment(newAppt);
      setShowNewApptModal(false);
      
      // Reset
      setMName('');
      setMPhone('');
      setMEmail('');
      setMServiceId('');
      setMNotes('');
      setMTime('10:00');
      
      loadData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar la cita');
    }
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToToday = () => toolbar.onNavigate('TODAY');

    const viewNamesGroup = [
      { view: 'month', label: isMobile ? <CalendarIcon size={18} /> : 'Mensual' },
      { view: 'week', label: isMobile ? <Columns size={18} /> : 'Semanal' },
      { view: 'day', label: isMobile ? <Minus size={18} style={{ transform: 'rotate(90deg)' }} /> : 'Diario' }
    ];

    return (
      <div className="rbc-toolbar" style={{ marginBottom: '1.5rem', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
        <span className="rbc-btn-group">
          <button type="button" onClick={goToBack}><ChevronLeft size={18} /></button>
          <button type="button" onClick={goToToday} style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Hoy</button>
          <button type="button" onClick={goToNext}><ChevronRight size={18} /></button>
        </span>

        <span className="rbc-toolbar-label" style={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
          {toolbar.label}
        </span>

        <span className="rbc-btn-group">
          {viewNamesGroup.map(item => (
            <button
              key={item.view}
              type="button"
              className={toolbar.view === item.view ? 'rbc-active' : ''}
              onClick={() => toolbar.onView(item.view)}
              title={typeof item.label === 'string' ? item.label : ''}
            >
              {item.label}
            </button>
          ))}
        </span>
      </div>
    );
  };
  const EventComponent = ({ event }: any) => {
    const phone = event.customer?.phone;
    
    const handleWhatsAppClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!phone) return;
      const date = format(event.start, 'dd/MM/yyyy');
      const time = format(event.start, 'HH:mm');
      const businessName = companyData?.nombreEmpresa || config?.name || 'nuestro centro';
      const serviceName = event.service?.name || 'tu cita';
      // Forzamos la URL de WhatsApp Web en desktop para mejor comportamiento
      const url = getWhatsAppLink(phone, event.customer.name, date, time, businessName, serviceName, !isMobile);
      openWhatsApp(url);
    };

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '100%', minWidth: 0 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {event.title}
        </div>
        {phone && config?.whatsappEnabled !== false && (
          <button 
            onClick={handleWhatsAppClick}
            title="Enviar WhatsApp"
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: '4px', 
              color: 'white', 
              padding: '2px', 
              display: 'flex', 
              cursor: 'pointer',
              marginLeft: '4px',
              flexShrink: 0
            }}
          >
            <MessageCircle size={12} />
          </button>
        )}
      </div>
    );
  };

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.dateTimeStart);
    const today = new Date();
    return d.toDateString() === today.toDateString() && a.status !== 'CANCELLED';
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>📊 Gestión</h2>
          <button 
            className="btn-primary hover-glow" 
            onClick={() => setShowNewApptModal(true)}
            style={{ 
              padding: '0.5rem 1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <Plus size={16} /> Nueva Cita
          </button>
        </div>
        {!isMobile && (
          <div className="data-toggle" style={{ background: 'var(--surface-color)', padding: '4px' }}>
            <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}><BarChart3 size={16} /> Resumen</button>
            <button className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}><Plus size={16} /> Servicios</button>
            <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}><Clock size={16} /> Horarios</button>
            <button className={activeTab === 'config' ? 'active' : ''} onClick={() => setActiveTab('config')}><Settings size={16} /> Ajustes</button>
          </div>
        )}
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
          <div className="dashboard-stats" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>{todayAppts.length}</div>
              <div className="stat-label">Citas Hoy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>{appointments.filter(a => a.status === 'PENDING').length}</div>
              <div className="stat-label">Pendientes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>{services.length}</div>
              <div className="stat-label">Servicios</div>
            </div>
          </div>

          <div className="card glass-panel" style={{ height: isMobile ? '750px' : '800px', display: 'flex', flexDirection: 'column', padding: isMobile ? '1rem 0.5rem' : '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', paddingLeft: isMobile ? '0.5rem' : 0 }}>Calendario de Reservas</h3>
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
                components={{
                  toolbar: CustomToolbar,
                  event: EventComponent
                }}
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
                  {svc.isActive === false && (
                    <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>DESACTIVADO</span>
                  )}
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
              checked={config?.allowClientCancellation !== false} 
              onChange={(e) => setConfig(prev => {
                const base = prev || INITIAL_BUSINESS_CONFIG;
                return { ...base, allowClientCancellation: e.target.checked };
              })}
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

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <div>
              <label style={{ margin: 0 }}>Notificaciones WhatsApp (Botones de aviso)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Muestra u oculta los accesos directos para enviar recordatorios por WhatsApp.</p>
            </div>
            <input 
              type="checkbox" 
              checked={config?.whatsappEnabled !== false} 
              onChange={(e) => setConfig(prev => {
                const base = prev || INITIAL_BUSINESS_CONFIG;
                return { ...base, whatsappEnabled: e.target.checked };
              })}
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
                {users.find(u => u.id === selectedEvent.resource.customerId)?.phone && config?.whatsappEnabled !== false && (
                  <button 
                    onClick={() => {
                      const customer = users.find(u => u.id === selectedEvent.resource.customerId);
                      const service = services.find(s => s.id === selectedEvent.resource.serviceId);
                      const date = format(new Date(selectedEvent.start), 'dd/MM/yyyy');
                      const time = format(new Date(selectedEvent.start), 'HH:mm');
                      const businessName = companyData?.nombreEmpresa || config?.name || 'nuestro centro';
                      const serviceName = service?.name || 'tu cita';
                      
                      if (customer) {
                        const url = getWhatsAppLink(customer.phone, customer.name, date, time, businessName, serviceName, !isMobile);
                        openWhatsApp(url);
                      }
                    }}
                    className="btn-secondary"
                    style={{ 
                      marginLeft: 'auto', 
                      padding: '0.4rem 0.8rem', 
                      fontSize: '0.8rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      textDecoration: 'none',
                      borderColor: '#25D366',
                      color: '#25D366'
                    }}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                )}
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

      {/* Modal Nueva Cita Manual */}
      {showNewApptModal && (
        <div className="modal-overlay" onClick={() => setShowNewApptModal(false)}>
          <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>➕ Nueva Cita Manual</h2>
                <button className="btn-icon" onClick={() => setShowNewApptModal(false)}><XCircle /></button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Agrega una cita recibida por teléfono, WhatsApp o presencialmente.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ position: 'relative', gridColumn: '1 / -1' }}>
                <label>Nombre del Cliente</label>
                <input 
                  value={mName} 
                  onChange={e => setMName(e.target.value)} 
                  placeholder="Ej: Juan Pérez"
                  autoComplete="off"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
                {mName && mName.length >= 2 && (
                  <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--surface-color)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 50,
                    margin: '4px 0 0 0',
                    padding: 0,
                    listStyle: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}>
                    {users.filter(u => u.name.toLowerCase().includes(mName.toLowerCase()) && u.role === 'CUSTOMER' && !(u.name === mName && u.phone === mPhone)).map(user => (
                      <li 
                        key={user.id}
                        onClick={() => {
                          setMName(user.name);
                          setMPhone(user.phone || '');
                          setMEmail(user.email || '');
                        }}
                        style={{
                          padding: '0.8rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--glass-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontWeight: '600' }}>{user.name}</span>
                        {user.phone && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{user.phone}</span>}
                      </li>
                    ))}
                    {!users.some(u => u.name.toLowerCase() === mName.toLowerCase() && u.role === 'CUSTOMER') && (
                       <li style={{ padding: '0.8rem', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                         <Plus size={14} /> Cliente no registrado (se creará ficha nueva)
                       </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  value={mPhone} 
                  onChange={e => setMPhone(e.target.value)} 
                  placeholder="Ej: 600123456"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group">
                <label>Email <small>(opcional)</small></label>
                <input 
                  type="email"
                  value={mEmail} 
                  onChange={e => setMEmail(e.target.value)} 
                  placeholder="Ej: correo@ejemplo.com"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Servicio Solicidado</label>
              <select 
                value={mServiceId} 
                onChange={e => setMServiceId(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              >
                <option value="">Selecciona un servicio...</option>
                {services.filter(s => s.isActive !== false).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.durationMin} min)</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Fecha</label>
                <input 
                  type="date" 
                  value={mDate} 
                  onChange={e => setMDate(e.target.value)} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Hora</label>
                <input 
                  type="time" 
                  value={mTime} 
                  onChange={e => setMTime(e.target.value)} 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Notas Privadas</label>
              <textarea 
                value={mNotes} 
                onChange={e => setMNotes(e.target.value)} 
                rows={2}
                placeholder="Ej: Viene por recomendación de Paco..."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
            </div>
            
            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowNewApptModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveManualAppt}>Agendar Cita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
