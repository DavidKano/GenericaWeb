import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { User, Appointment, BookingService, DaySchedule, BusinessConfig, CompanyData, BlockedDay } from '../services/models';
import { INITIAL_SCHEDULES } from '../services/scheduleDefaults';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';
import { generateTimeSlots } from '../utils/timeSlots';
import { 
  Plus, 
  XCircle,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
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

// Variable global para mantener la referencia a la ventana de WhatsApp fuera del ciclo de vida de React
let waWindow: Window | null = null;

const getWhatsAppLink = (phone: string, name: string, date: string, time: string, businessName: string, serviceName: string, useWebVersion?: boolean) => {
  const cleanPhone = phone.replace(/\D/g, '');
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

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  
  // Controles de Vista de Calendario
  const [currentView, setCurrentView] = useState<any>(window.innerWidth <= 768 ? 'day' : 'week');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (isMobile && currentView === 'month') {
      setCurrentView('day');
    }
  }, [isMobile, currentView]);

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
  const [mNotes, setMNotes] = useState('');

  // Subscription notification logic
  const [showSubPopup, setShowSubPopup] = useState<'15_days' | '5_days' | null>(null);

  const [showPendingModal, setShowPendingModal] = useState(false);

  const openWhatsApp = (url: string) => {
    const name = 'whatsappWindow';
    if (!waWindow || waWindow.closed) {
      waWindow = window.open(url, name);
    } else {
      try {
        waWindow.location.href = url;
        waWindow.focus();
      } catch (e) {
        waWindow = window.open(url, name);
        if (waWindow) waWindow.focus();
      }
    }
  };

  useEffect(() => {
    if (companyData?.fechaRenovacion) {
      const renewalDate = new Date(companyData.fechaRenovacion);
      const today = new Date();
      
      const diffTime = renewalDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const hasSeen15 = sessionStorage.getItem('seen_sub_15');
      const hasSeen5 = sessionStorage.getItem('seen_sub_5');

      if (diffDays <= 5 && diffDays > 0 && !hasSeen5) {
        setShowSubPopup('5_days');
        sessionStorage.setItem('seen_sub_5', 'true');
      } else if (diffDays <= 15 && diffDays > 5 && !hasSeen15) {
        setShowSubPopup('15_days');
        sessionStorage.setItem('seen_sub_15', 'true');
      }
    }
  }, [companyData]);

  const manualAvailableSlots = useMemo(() => {
    if (!mDate || !mServiceId) return [];
    
    const [y, m, d] = mDate.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);
    
    const selectedService = services.find(s => s.id === mServiceId);
    if (!selectedService) return [];

    const dayOfWeek = selectedDate.getDay();
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule || !schedule.isOpen) return [];
    
    const dateKey = mDate;
    if (blockedDays.some(b => b.date === dateKey && b.isFullDay !== false)) return [];

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23,59,59,999);

    const existingApptRanges = appointments
      .filter(a => a.dateTimeStart >= dayStart.getTime() && a.dateTimeStart <= dayEnd.getTime() && a.status !== 'CANCELLED')
      .map(a => {
        const svc = services.find(s => s.id === a.serviceId);
        const duration = svc?.durationMin || 30;
        return {
          start: a.dateTimeStart,
          end: a.dateTimeStart + (duration * 60000)
        };
      });

    const ptBlockedConfig = blockedDays.find(b => b.date === dateKey && b.isFullDay === false);
    const ptBlockedRanges = ptBlockedConfig?.blockedRanges
      ? ptBlockedConfig.blockedRanges.map(br => ({
          start: parse(br.start, 'HH:mm', selectedDate).getTime(),
          end: parse(br.end, 'HH:mm', selectedDate).getTime()
        }))
      : [];

    return generateTimeSlots(
      schedule.ranges,
      selectedService.durationMin,
      selectedDate,
      existingApptRanges,
      config?.concurrentSlots || 1,
      ptBlockedRanges
    );
  }, [mDate, mServiceId, services, schedules, blockedDays, appointments, config?.concurrentSlots]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appts, svcs, usrs, schs, bDays, cfg, comp] = await Promise.all([
        repo.getAppointments(),
        repo.getServices(),
        repo.getUsers(),
        repo.getSchedules(),
        repo.getBlockedDays(),
        repo.getConfig(),
        repo.getCompanyData(),
      ]);
 
      setAppointments(appts);
      setServices(svcs);
      setUsers(usrs);
      setSchedules(schs.length > 0 ? schs : INITIAL_SCHEDULES);
      setBlockedDays(bDays);
      setConfig(cfg || INITIAL_BUSINESS_CONFIG);
      setCompanyData(comp);
    } catch (err: any) {
      console.error('Error cargando panel de administrador:', err);
      setErrorMessage(err.message || 'Error de conexión con Firestore');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [repo, isInitialized]);

  // Preparar eventos para react-big-calendar y asignar Puestos (Resources)
  const resources = useMemo(() => {
    const count = config?.concurrentSlots || 1;
    if (count <= 1) return undefined;
    return Array.from({ length: count }, (_, i) => ({
      id: `slot-${i + 1}`,
      title: `Puesto ${i + 1}`,
    }));
  }, [config?.concurrentSlots]);

  const events = useMemo(() => {
    const numSlots = config?.concurrentSlots || 1;
    
    const sortedAppointments = [...appointments]
      .filter(a => a.status !== 'CANCELLED')
      .sort((a, b) => a.dateTimeStart - b.dateTimeStart);

    const assignedEvents: any[] = [];

    sortedAppointments.forEach(app => {
      const service = services.find(s => s.id === app.serviceId);
      const customer = users.find(u => u.id === app.customerId);
      const duration = service?.durationMin || 30;
      const start = new Date(app.dateTimeStart);
      const end = new Date(start.getTime() + duration * 60000);
      
      let assignedSlot = 'slot-1';
      
      if (numSlots > 1) {
        // Find the first available slot that doesn't overlap
        for (let i = 1; i <= numSlots; i++) {
          const slotId = `slot-${i}`;
          const hasOverlap = assignedEvents.some(e => 
            e.resourceId === slotId && (start < e.end && end > e.start)
          );
          if (!hasOverlap) {
            assignedSlot = slotId;
            break;
          }
        }
      }
      
      assignedEvents.push({
        id: app.id,
        title: `${customer?.name || 'Cliente'} - ${service?.name || ''}`,
        start,
        end,
        resource: app,
        customer, 
        service,  
        color: service?.color || '#3174ad',
        resourceId: numSlots > 1 ? assignedSlot : undefined,
      });
    });

    return assignedEvents;
  }, [appointments, services, users, config?.concurrentSlots]);

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

  const eventPropGetter = () => {
    return { 
      style: { 
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        overflow: 'visible'
      } 
    };
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setEventNotes(event.resource.adminNotes || '');
    setEventServiceId(event.resource.serviceId);
    setEventStatus(event.resource.status);
    
    const d = new Date(event.start);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setEventDate(`${yyyy}-${mm}-${dd}`);
    
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

      const startDateTime = new Date(`${mDate}T${mTime}`).getTime();
      const newAppt: Appointment = {
        id: 'appt-' + Date.now(),
        customerId: userId,
        serviceId: mServiceId,
        dateTimeStart: startDateTime,
        status: 'CONFIRMED',
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

    const viewNamesGroup = isMobile
      ? [
          { view: 'week', label: <Columns size={18} /> },
          { view: 'day', label: <Minus size={18} style={{ transform: 'rotate(90deg)' }} /> }
        ]
      : [
          { view: 'month', label: 'Mensual' },
          { view: 'week', label: 'Semanal' },
          { view: 'day', label: 'Diario' }
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
    const serviceColor = event.color || '#3b82f6';
    
    const handleWhatsAppClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!phone) return;
      const date = format(event.start, 'dd/MM/yyyy');
      const time = format(event.start, 'HH:mm');
      const businessName = companyData?.nombreEmpresa || config?.name || 'nuestro centro';
      const serviceName = event.service?.name || 'tu cita';
      const url = getWhatsAppLink(phone, event.customer.name, date, time, businessName, serviceName, !isMobile);
      openWhatsApp(url);
    };

    return (
      <div style={{
        backgroundColor: `color-mix(in srgb, ${serviceColor} 15%, transparent)`,
        borderLeft: `4px solid ${serviceColor}`,
        borderRadius: '6px',
        padding: '6px 8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
      className="admin-calendar-event-card"
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.15rem', 
          flex: 1, 
          minWidth: 0, 
          overflow: 'hidden' 
        }}>
          {/* Nombre del cliente */}
          <div style={{ 
            fontWeight: '600', 
            fontSize: '0.85rem', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            color: '#0f172a' // Very dark slate, almost black
          }}>
            {event.customer?.name || 'Cliente'}
          </div>
          
          {/* Nombre del servicio */}
          <div style={{ 
            fontSize: '12px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            color: '#475569', // Slate-600 text (sufficient contrast neutral grey)
            fontWeight: '400'
          }}>
            {event.service?.name || 'Servicio'}
          </div>
        </div>
        {phone && config?.whatsappEnabled !== false && (
          <button 
            onClick={handleWhatsAppClick}
            title="Enviar WhatsApp"
            style={{ 
              background: 'rgba(0, 0, 0, 0.04)', 
              border: 'none', 
              borderRadius: '6px', 
              color: '#475569', // Slate-600 WhatsApp button
              padding: '4px', 
              display: 'flex', 
              cursor: 'pointer',
              marginLeft: '6px',
              flexShrink: 0,
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'}
          >
            <MessageCircle size={13} />
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

  const pendingAppts = appointments.filter(a => a.status === 'PENDING');

  return (
    <div className="animate-fade-in">
      <style>{`
        /* Overrides for React Big Calendar event containers to support premium floating cards */
        .rbc-event {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 2px 3px !important; /* Spacing for month view */
          overflow: visible !important;
          box-sizing: border-box !important;
        }
        .rbc-time-view .rbc-day-slot {
          padding-left: 2px !important;
          padding-right: 2px !important;
        }
        .rbc-time-view .rbc-event {
          padding: 3px 1px !important; /* 3px vertical, 1px horizontal for week/day views */
        }
        .rbc-event.rbc-selected {
          background-color: transparent !important;
        }
        .rbc-event-content {
          padding: 0 !important;
          height: 100% !important;
          width: 100% !important;
        }
        .admin-calendar-event-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
          filter: brightness(0.98);
        }
      `}</style>
      {/* Subscription Expiration Popup */}
      {showSubPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1f2937', padding: '2.5rem', borderRadius: '12px', border: '1px solid #eab308', textAlign: 'center', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#eab308', marginBottom: '1rem', fontSize: '1.5rem' }}>¡Aviso de Suscripción!</h3>
            <p style={{ color: '#d1d5db', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Te quedan <strong>{showSubPopup === '5_days' ? '5' : '15'}</strong> días para que caduque tu suscripción.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setShowSubPopup(null)}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #4b5563', background: 'transparent', color: '#d1d5db', cursor: 'pointer' }}
              >
                Cerrar Aviso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agenda/Dashboard Content */}

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

      {!isLoading && !errorMessage && (
        <>
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: isMobile ? '1rem 0.5rem' : '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.25rem', 
              paddingLeft: isMobile ? '0.5rem' : 0,
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Calendario de Reservas</h3>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Pending Appts Indicator */}
                <div 
                  onClick={() => setShowPendingModal(true)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.6rem',
                    background: 'rgba(234, 179, 8, 0.1)', 
                    border: '1px solid rgba(234, 179, 8, 0.25)', 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '999px',
                    color: '#eab308',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(234, 179, 8, 0.08)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ 
                    display: 'inline-flex', 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    backgroundColor: '#eab308'
                  }}></span>
                  <span>Citas Pendientes:</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{pendingAppts.length}</strong>
                </div>

                {/* Premium Live Stat Indicator */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem',
                  background: 'rgba(59, 130, 246, 0.1)', 
                  border: '1px solid rgba(59, 130, 246, 0.25)', 
                  padding: '0.35rem 0.85rem', 
                  borderRadius: '999px',
                  color: '#3b82f6',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)'
                }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    backgroundColor: '#3b82f6'
                  }}></span>
                  <span>Citas Hoy:</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{todayAppts.length}</strong>
                </div>
              </div>
            </div>
            <div style={{ flex: 'none', height: 'auto' }} className={`admin-calendar-container view-${currentView}`}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'auto', background: 'white', color: 'black', borderRadius: '8px', padding: '1rem', fontFamily: 'inherit' }}
                eventPropGetter={eventPropGetter}
                onSelectEvent={handleSelectEvent}
                culture="es"
                views={isMobile ? ['week', 'day'] : ['month', 'week', 'day']}
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
                resources={currentView === 'day' ? resources : undefined}
                resourceIdAccessor="id"
                resourceTitleAccessor="title"
                components={{
                  toolbar: CustomToolbar,
                  event: EventComponent
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal Citas Pendientes */}
      {showPendingModal && (
        <div className="modal-overlay" onClick={() => setShowPendingModal(false)}>
          <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#eab308' }}>⏳ Citas Pendientes</h2>
                <button className="btn-icon" onClick={() => setShowPendingModal(false)}><XCircle /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {pendingAppts.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay citas pendientes de confirmación.</p>
              ) : (
                pendingAppts.map(appt => {
                  const customer = users.find(u => u.id === appt.customerId);
                  const service = services.find(s => s.id === appt.serviceId);
                  return (
                    <div key={appt.id} style={{ 
                      padding: '1rem', 
                      background: 'var(--bg-color)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customer?.name || 'Cliente Desconocido'}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {service?.name || 'Servicio'} - {new Date(appt.dateTimeStart).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
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
                          Aceptar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowPendingModal(false)}>Cerrar</button>
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
                    {users.filter(u => u.name.toLowerCase().includes(mName.toLowerCase()) && u.role === 'CUSTOMER' && !(u.name === mName && u.phone === mPhone)).sort((a,b) => a.name.localeCompare(b.name)).map(user => (
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
              <label>Servicio Solicitado</label>
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
                <select 
                  value={mTime} 
                  onChange={e => setMTime(e.target.value)} 
                  disabled={!mServiceId || manualAvailableSlots.length === 0}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                >
                  <option value="" disabled>
                    {!mServiceId ? 'Selecciona un servicio...' : (manualAvailableSlots.length === 0 ? 'Sin huecos libres' : 'Selecciona hora...')}
                  </option>
                  {manualAvailableSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
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

      {/* Floating Action Button (FAB) for "+ Nueva Cita" */}
      <button 
        className="btn-primary hover-glow fab-button animate-fade-in" 
        onClick={() => setShowNewApptModal(true)}
        style={{ 
          position: 'fixed',
          bottom: isMobile ? '6.5rem' : '2.5rem',
          right: isMobile ? '1.5rem' : '2.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.45)',
          zIndex: 999,
          cursor: 'pointer',
          border: 'none',
          padding: 0
        }}
        title="Nueva Cita"
      >
        <Plus size={26} />
      </button>
    </div>
  );
};
