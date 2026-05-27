import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import type { User, Appointment, BookingService, DaySchedule, BusinessConfig, CompanyData, BlockedDay } from '../services/models';
import { INITIAL_SCHEDULES } from '../services/scheduleDefaults';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';
import { generateTimeSlots } from '../utils/timeSlots';
import { Plus, XCircle, User as UserIcon, ChevronLeft, ChevronRight, Columns, Minus, MessageCircle, Bell, Clock, Briefcase, Calendar as LucideCalendar, Phone, Mail, Tag, LayoutDashboard, CreditCard } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
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
  const navigate = useNavigate();
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
      
      const unsubscribe = repo.subscribeToAppointments((appts) => {
        setAppointments(appts);
      });
      return () => unsubscribe();
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

        /* Interactive KPI Badges */
        .kpi-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #FFFFFF;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          box-sizing: border-box;
          border: 1px solid transparent;
        }

        .kpi-badge--pending {
          border-color: #FDE047;
        }
        .kpi-badge--pending:hover {
          transform: translateY(-1px);
          border-color: #F59E0B;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }

        .kpi-badge--today {
          border-color: var(--primary-color, #008080);
        }
        .kpi-badge--today:hover {
          transform: translateY(-1px);
          border-color: var(--primary-hover, #006666);
          box-shadow: 0 4px 12px rgba(0, 128, 128, 0.15);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot--pending {
          background-color: #F59E0B;
          animation: badge-pulse 2s infinite;
        }

        .status-dot--today {
          background-color: var(--primary-color, #008080);
        }

        @keyframes badge-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(245, 158, 11, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
          }
        }
      `}</style>
      <PageHeader 
        icon={<LayoutDashboard size={24} />} 
        title="Panel de Control" 
        actions={
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div 
              className="kpi-badge kpi-badge--pending"
              onClick={() => setShowPendingModal(true)}
              title="Ver citas pendientes"
            >
              <span className="status-dot status-dot--pending"></span>
              <span style={{ color: '#475569' }}>Citas Pendientes:</span>
              <strong style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.9rem' }}>{pendingAppts.length}</strong>
            </div>

            <div 
              className="kpi-badge kpi-badge--today"
              title="Citas para el día de hoy"
            >
              <span className="status-dot status-dot--today"></span>
              <span style={{ color: '#475569' }}>Citas Hoy:</span>
              <strong style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.9rem' }}>{todayAppts.length}</strong>
            </div>
          </div>
        }
      />
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
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: isMobile ? '8px 4px' : '16px', margin: isMobile ? '0 -10px' : '0' }}>
            <div 
              style={{ flex: 'none', height: 'auto' }} 
              className={`admin-calendar-container view-${currentView} ${currentView === 'day' && resources && resources.length > 2 ? 'resources-scrollable' : ''}`}
            >
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'auto', background: 'white', color: 'black', borderRadius: '8px', padding: isMobile ? '8px 4px' : '1rem', fontFamily: 'inherit' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Bell size={22} strokeWidth={1.5} style={{ color: 'var(--primary-color)' }} />
                  <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.3rem', fontWeight: 600 }}>Citas Pendientes</h2>
                </div>
                <button className="btn-icon" onClick={() => setShowPendingModal(false)}><XCircle /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {pendingAppts.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay citas pendientes de confirmación.</p>
              ) : (
                pendingAppts.map(appt => {
                  const customer = users.find(u => u.id === appt.customerId);
                  const service = services.find(s => s.id === appt.serviceId);
                  const apptDate = new Date(appt.dateTimeStart);
                  const formattedDate = `${apptDate.getDate()}/${apptDate.getMonth() + 1}/${apptDate.getFullYear().toString().slice(-2)} - ${apptDate.getHours()}:${apptDate.getMinutes().toString().padStart(2, '0')} h`;
                  
                  return (
                    <div key={appt.id} style={{ 
                      padding: '14px 16px', 
                      background: '#F8FAFC', 
                      borderRadius: '10px', 
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1.25rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                        {/* Línea 1: Cliente */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>
                          <UserIcon size={15} strokeWidth={2} style={{ color: 'var(--primary-color)', marginRight: '8px', opacity: 0.8 }} />
                          <span>{customer?.name || 'Cliente Desconocido'}</span>
                        </div>
                        {/* Línea 2: Servicio */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 400, color: '#475569' }}>
                          <Briefcase size={15} strokeWidth={1.5} style={{ color: '#64748B', marginRight: '8px' }} />
                          <span>{service?.name || 'Servicio'}</span>
                        </div>
                        {/* Línea 3: Fecha y Hora */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 400, color: '#64748B' }}>
                          <Clock size={15} strokeWidth={1.5} style={{ color: '#64748B', marginRight: '8px' }} />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
                        <button 
                          className="btn-primary" 
                          style={{ 
                            padding: '8px 16px', 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--primary-color)',
                            color: '#FFFFFF'
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
            
            <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  const customerId = selectedEvent.resource.customerId;
                  const serviceId = eventServiceId;
                  navigate(`/admin/tpv?customerId=${customerId}&serviceId=${serviceId}`);
                }}
                style={{
                  marginRight: 'auto',
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={16} /> TPV
              </button>
              <button className="btn-secondary" onClick={() => setShowEventModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveEventEdits}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Cita Manual */}
      {showNewApptModal && (
        <div className="modal-overlay" onClick={() => setShowNewApptModal(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '0.9rem 1.25rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LucideCalendar size={18} strokeWidth={1.5} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', letterSpacing: '-0.02em', color: '#0F172A', textTransform: 'uppercase' }}>NUEVA CITA MANUAL</h2>
              </div>
              <button 
                onClick={() => setShowNewApptModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#F43F5E'}
                onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
              >
                <XCircle size={18} strokeWidth={1.5} />
              </button>
            </div>
            
            <p style={{ color: '#64748B', fontSize: '0.78rem', marginBottom: '0.8rem', lineHeight: '1.3' }}>
              Agrega una cita recibida por teléfono, WhatsApp o presencialmente.
            </p>

            <form onSubmit={e => e.preventDefault()}>
              {/* Sección 1: DATOS DEL CLIENTE */}
              <div style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                borderRadius: '8px', 
                padding: '0.6rem 0.8rem', 
                marginBottom: '0.6rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem', marginBottom: '0.1rem' }}>
                  <UserIcon size={13} strokeWidth={2} style={{ color: 'var(--primary-color)' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em', color: '#475569' }}>DATOS DEL CLIENTE</span>
                </div>

                {/* Campo: Nombre */}
                <div className="form-group" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%', zIndex: 10 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#475569' }}>Nombre del Cliente</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                      <UserIcon size={14} strokeWidth={1.5} />
                    </span>
                    <input 
                      value={mName} 
                      onChange={e => setMName(e.target.value)} 
                      placeholder="Introducir nombre"
                      autoComplete="off"
                      style={{ 
                        width: '100%', 
                        padding: '0.45rem 0.8rem 0.45rem 2.2rem', 
                        borderRadius: '6px', 
                        background: '#FFFFFF', 
                        border: '1px solid #CBD5E1', 
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
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  {mName && mName.length >= 1 && (
                    <ul style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      zIndex: 100,
                      margin: '2px 0 0 0',
                      padding: 0,
                      listStyle: 'none',
                      boxShadow: '0 8px 12px -3px rgba(0, 0, 0, 0.05), 0 3px 4px -2px rgba(0, 0, 0, 0.03)'
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
                            padding: '0.5rem 0.8rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            flexDirection: 'column',
                            color: '#1E293B'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: '500', fontSize: '0.8rem' }}>{user.name}</span>
                          {user.phone && <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{user.phone}</span>}
                        </li>
                      ))}
                      {!users.some(u => u.name.toLowerCase() === mName.toLowerCase() && u.role === 'CUSTOMER') && (
                         <li style={{ padding: '0.5rem 0.8rem', color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderBottom: 'none' }}>
                           <Plus size={12} /> Nuevo cliente (se creará ficha)
                         </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Teléfono & Email en 2 columnas en PC, 1 columna en móvil */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', width: '100%' }}>
                  {/* Campo: Teléfono */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#475569' }}>Teléfono</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                        <Phone size={14} strokeWidth={1.5} />
                      </span>
                      <input 
                        value={mPhone} 
                        onChange={e => setMPhone(e.target.value)} 
                        placeholder="Número de teléfono"
                        style={{ 
                          width: '100%', 
                          padding: '0.45rem 0.8rem 0.45rem 2.2rem', 
                          borderRadius: '6px', 
                          background: '#FFFFFF', 
                          border: '1px solid #CBD5E1', 
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
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Campo: Email */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#475569' }}>Email <span style={{ color: '#94A3B8', fontWeight: 'normal', fontSize: '0.7rem' }}>(opcional)</span></label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                        <Mail size={14} strokeWidth={1.5} />
                      </span>
                      <input 
                        type="email"
                        value={mEmail} 
                        onChange={e => setMEmail(e.target.value)} 
                        placeholder="ejemplo@correo.com"
                        style={{ 
                          width: '100%', 
                          padding: '0.45rem 0.8rem 0.45rem 2.2rem', 
                          borderRadius: '6px', 
                          background: '#FFFFFF', 
                          border: '1px solid #CBD5E1', 
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
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 2: DETALLES DE LA CITA */}
              <div style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                borderRadius: '8px', 
                padding: '0.6rem 0.8rem', 
                marginBottom: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem', marginBottom: '0.1rem' }}>
                  <LucideCalendar size={13} strokeWidth={2} style={{ color: 'var(--primary-color)' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em', color: '#475569' }}>DETALLES DE LA CITA</span>
                </div>

                {/* Campo: Servicio */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#475569' }}>Servicio Solicitado</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                      <Tag size={14} strokeWidth={1.5} />
                    </span>
                    <select 
                      value={mServiceId} 
                      onChange={e => setMServiceId(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.45rem 2rem 0.45rem 2.2rem', 
                        borderRadius: '6px', 
                        background: '#FFFFFF', 
                        border: '1px solid #CBD5E1', 
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
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Seleccionar un servicio</option>
                      {services.filter(s => s.isActive !== false).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.durationMin} min)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fecha & Hora en 2 columnas en PC, 1 columna en móvil */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', width: '100%' }}>
                  {/* Campo: Fecha */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#475569' }}>Fecha</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                        <LucideCalendar size={14} strokeWidth={1.5} />
                      </span>
                      <input 
                        type="date" 
                        value={mDate} 
                        onChange={e => setMDate(e.target.value)} 
                        style={{ 
                          width: '100%', 
                          padding: '0.45rem 0.8rem 0.45rem 2.2rem', 
                          borderRadius: '6px', 
                          background: '#FFFFFF', 
                          border: '1px solid #CBD5E1', 
                          color: '#1E293B',
                          fontSize: '0.85rem',
                          outline: 'none',
                          fontFamily: 'inherit',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = 'var(--primary-color)';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Campo: Hora */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#475569' }}>Hora</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                        <Clock size={14} strokeWidth={1.5} />
                      </span>
                      <select 
                        value={mTime} 
                        onChange={e => setMTime(e.target.value)} 
                        disabled={!mServiceId || manualAvailableSlots.length === 0}
                        style={{ 
                          width: '100%', 
                          padding: '0.45rem 2rem 0.45rem 2.2rem', 
                          borderRadius: '6px', 
                          background: '#FFFFFF', 
                          border: '1px solid #CBD5E1', 
                          color: '#1E293B',
                          fontSize: '0.85rem',
                          outline: 'none',
                          fontFamily: 'inherit',
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
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="" disabled>
                          {!mServiceId ? 'Selecciona servicio' : (manualAvailableSlots.length === 0 ? 'Sin huecos libres' : 'Selecciona hora')}
                        </option>
                        {manualAvailableSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Campo: Notas Privadas */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: '#475569' }}>Notas Privadas</label>
                  <textarea 
                    value={mNotes} 
                    onChange={e => setMNotes(e.target.value)} 
                    rows={1}
                    placeholder="Observaciones o notas adicionales"
                    style={{ 
                      width: '100%', 
                      padding: '0.45rem 0.8rem', 
                      borderRadius: '6px', 
                      background: '#FFFFFF', 
                      border: '1px solid #CBD5E1', 
                      color: '#1E293B',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'none',
                      height: '34px',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Botones de acción SaaS */}
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowNewApptModal(false)}
                  style={{
                    height: '35px',
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
                  onClick={handleSaveManualAppt}
                  style={{
                    height: '35px',
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
                  Agendar Cita
                </button>
              </div>
            </form>
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
