import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { BusinessConfig, BookingService, Appointment, DaySchedule, BlockedDay, PromoOffer, CompanyData } from '../services/models';
import { Calendar } from '../components/Calendar';
import { Calendar as CalendarIcon, Share2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { generateGoogleCalendarUrl, shareOrDownloadIcs } from '../utils/calendar';
import { generateTimeSlots } from '../utils/timeSlots';
import { format, startOfDay, addDays, endOfDay, parse } from 'date-fns';
import { INITIAL_SCHEDULES } from '../services/scheduleDefaults';
import { es } from 'date-fns/locale';

export const BookingPage: React.FC = () => {
  const { repo } = useData();
  const { user } = useAuth();
  
  const [services, setServices] = useState<BookingService[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [inlineOffers, setInlineOffers] = useState<PromoOffer[]>([]);
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const loadStatic = async () => {
      // Individual catches to prevent one failed collection (e.g. permissions) from breaking the whole page
      const [svcs, schs, bDays, cfg, offers, comp] = await Promise.all([
        repo.getServices().catch(e => { console.error('Error services:', e); return []; }),
        repo.getSchedules().catch(e => { console.error('Error schedules:', e); return []; }),
        repo.getBlockedDays().catch(e => { console.error('Error blocked:', e); return []; }),
        repo.getConfig().catch(e => { console.error('Error config:', e); return null; }),
        repo.getPromoOffers().catch(e => { console.error('Error offers:', e); return []; }),
        repo.getCompanyData().catch(e => { console.error('Error company:', e); return null; })
      ]);
      setServices(svcs);
      setSchedules(schs.length > 0 ? schs : INITIAL_SCHEDULES);
      setBlockedDays(bDays);
      setBusinessConfig(cfg);
      setCompany(comp);
      
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setInlineOffers((offers || []).filter(o => 
        o.isActive !== false && 
        o.displayMode === 'inline' &&
        todayStr >= o.startDate && 
        todayStr <= o.endDate
      ));
    };
    loadStatic();

    // Suscripción en tiempo real para citas
    const unsubscribe = repo.subscribeToAppointments((appts) => {
      setAppointments(appts);
    });

    return () => unsubscribe();
  }, [repo]);

  // Calcular slots disponibles para el día seleccionado
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule || !schedule.isOpen) return [];

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23,59,59,999);

    const existingApptRanges = appointments
      .filter(a => a.dateTimeStart >= dayStart.getTime() && a.dateTimeStart <= dayEnd.getTime())
      .map(a => {
        const svc = services.find(s => s.id === a.serviceId);
        const duration = svc?.durationMin || 30;
        return {
          start: a.dateTimeStart,
          end: a.dateTimeStart + (duration * 60000)
        };
      });

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
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
      businessConfig?.concurrentSlots || 1,
      ptBlockedRanges
    );
  }, [selectedDate, selectedService, schedules, appointments, services, businessConfig]);

  // Calcular qué días están COMPLETOS (sin huecos libres) para los próximos 2 meses
  const fullDates = useMemo(() => {
    if (!selectedService || !schedules.length) return [];
    
    const results: string[] = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 62; i++) {
        const date = addDays(today, i);
        const dayOfWeek = date.getDay();
        const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
        
        if (!schedule || !schedule.isOpen) continue;
        const dateKey = format(date, 'yyyy-MM-dd');
        if (blockedDays.some(b => b.date === dateKey && b.isFullDay !== false)) continue;

        const ptBlockedConfig = blockedDays.find(b => b.date === dateKey && b.isFullDay === false);
        const ptBlockedRanges = ptBlockedConfig?.blockedRanges
            ? ptBlockedConfig.blockedRanges.map(br => ({
                start: parse(br.start, 'HH:mm', date).getTime(),
                end: parse(br.end, 'HH:mm', date).getTime()
            }))
            : [];

        const dStart = startOfDay(date);
        const dEnd = endOfDay(date);
        const dayAppts = appointments
            .filter(a => a.dateTimeStart >= dStart.getTime() && a.dateTimeStart <= dEnd.getTime())
            .map(a => {
                const svc = services.find(s => s.id === a.serviceId);
                return {
                  start: a.dateTimeStart,
                  end: a.dateTimeStart + ((svc?.durationMin || 30) * 60000)
                };
            });

        const slots = generateTimeSlots(
            schedule.ranges,
            selectedService.durationMin,
            date,
            dayAppts,
            businessConfig?.concurrentSlots || 1,
            ptBlockedRanges
        );

        if (slots.length === 0) {
            results.push(dateKey);
        }
    }
    return results;
  }, [selectedService, schedules, appointments, services, businessConfig, blockedDays]);

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !user) return;
    
    // Validación final de seguridad (Double Check)
    // Comprobamos si a estas alturas el slot sigue estando disponible en tiempo real
    if (!availableSlots.includes(selectedTime)) {
      alert('Lo sentimos, esta franja horaria acaba de ser ocupada por otro cliente. Por favor, selecciona una nueva hora.');
      setStep(3); // Devolver al paso de selección de hora
      return;
    }

    const [h, m] = selectedTime.split(':').map(Number);
    const dateObj = new Date(selectedDate);
    dateObj.setHours(h, m, 0, 0);

    const appt: Appointment = {
      id: 'apt-' + Date.now(),
      customerId: user.id,
      serviceId: selectedService.id,
      dateTimeStart: dateObj.getTime(),
      status: 'PENDING',
    };
    
    await repo.saveAppointment(appt);
    setBooked(true);
  };

  const reset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime('');
    setBooked(false);
  };

  if (booked) {
    const [h, m] = selectedTime.split(':').map(Number);
    const startDateTime = new Date(selectedDate || new Date());
    startDateTime.setHours(h, m, 0, 0);

    const event = {
      title: `${selectedService?.name} - ${company?.nombreEmpresa || 'Cita'}`,
      description: `Cita para ${selectedService?.name} confirmada en ${company?.nombreEmpresa}.`,
      startDate: startDateTime,
      durationMin: selectedService?.durationMin || 30,
      location: company ? `${company.direccion}, ${company.localidad}` : ''
    };

    return (
      <div className="booking-page" style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <div style={{ transform: 'scale(1.2)', display: 'inline-block', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={64} color="#10b981" />
        </div>
        
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>¡Reserva Confirmada!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '400px', margin: '0.5rem auto 2.5rem' }}>
          Hemos reservado tu cita para <strong>{selectedService?.name}</strong> el día <strong>{selectedDate ? format(selectedDate, 'd MMMM', { locale: es }) : ''}</strong> a las <strong>{selectedTime.replace(/^0/, '')}</strong>.
        </p>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.2rem', fontWeight: 700 }}>
            <CalendarIcon size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Añadir a mi calendario
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <a 
              href={generateGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                background: '#fff', 
                border: '1px solid #e2e8f0', 
                padding: '1rem 0.5rem', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.25rem',
                textDecoration: 'none',
                color: '#1f2937',
                fontSize: '0.9rem',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
            >
              <img src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png" alt="Google" style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
              Google
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>(Android)</span>
            </a>

            <button 
              onClick={() => shareOrDownloadIcs(event)}
              style={{ 
                background: '#fff', 
                border: '1px solid #e2e8f0', 
                padding: '1rem 0.5rem', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.25rem',
                cursor: 'pointer',
                color: '#1f2937',
                fontSize: '0.9rem',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
            >
              <Share2 size={24} color="#3b82f6" style={{ marginBottom: '4px' }} />
              Otros (.ics)
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>(Apple / iOS)</span>
            </button>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={reset}
          style={{ width: 'auto', padding: '1rem 2rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
        >
          <ArrowLeft size={18} /> Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <h2 style={{ marginBottom: '1rem' }}>📅 Reservar Cita</h2>

      <div className="booking-steps">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`booking-step ${s <= step ? 'active' : ''}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem' }}>Elige un servicio</h3>
          <div className="services-grid">
            {services.filter(s => s.isActive !== false).map(svc => (
              <div
                key={svc.id}
                className={`service-card ${selectedService?.id === svc.id ? 'active' : ''}`}
                onClick={() => { setSelectedService(svc); setStep(2); }}
              >
                <h3>{svc.name}</h3>
                <div className="service-meta">
                  <span>⏱ {svc.durationMin} min</span>
                  {svc.price !== undefined && <span>💰 {svc.price}€</span>}
                </div>
              </div>
            ))}
          </div>

          {inlineOffers.length > 0 && (
            <div style={{ marginTop: '2.5rem', display: 'grid', gap: '1.5rem' }}>
              {inlineOffers.map(offer => (
                <div key={offer.id} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <img src={offer.imageUrl} alt="Promo Especial" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem' }}>Selecciona el día</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Servicio: <strong>{selectedService?.name}</strong>
          </p>
          
          <Calendar 
            selectedDate={selectedDate} 
            onDateSelect={(date) => {
              setSelectedDate(date);
              setStep(3);
            }}
            blockedDates={blockedDays.filter(b => b.isFullDay !== false).map(b => b.date)}
            fullDates={fullDates}
            closedDays={schedules.filter(s => !s.isOpen).map(s => s.dayOfWeek)}
          />

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>← Atrás</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Selecciona la hora</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {selectedService?.name} — {selectedDate ? format(selectedDate, 'PPPP', { locale: es }) : ''}
          </p>
          
          {availableSlots.length > 0 ? (
            <div className="time-slots">
              {availableSlots.map(h => (
                <div
                  key={h}
                  className={`time-slot ${selectedTime === h ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(h)}
                >
                  {h}
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              Lo sentimos, no hay huecos disponibles para este día.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>← Atrás</button>
            <button 
              className="btn-primary" 
              disabled={!selectedTime} 
              onClick={() => setStep(4)}
              style={{ flex: 1 }}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1.5rem' }}>Confirmar Reserva</h3>
          <div className="card glass-panel" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <p><strong>Servicio:</strong> {selectedService?.name}</p>
              <p><strong>Fecha:</strong> {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}</p>
              <p><strong>Hora:</strong> {selectedTime}</p>
              <p><strong>Duración:</strong> {selectedService?.durationMin} min</p>
              {selectedService?.price !== undefined && (
                <p><strong>Importe:</strong> <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{selectedService.price}€</span></p>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setStep(3)}>← Atrás</button>
            <button className="btn-primary" onClick={handleConfirm} style={{ flex: 1 }}>
              ✅ Confirmar y Reservar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
