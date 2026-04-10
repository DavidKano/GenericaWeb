import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { BookingService, Appointment, DaySchedule, BlockedDay } from '../services/models';
import { Calendar } from '../components/Calendar';
import { generateTimeSlots } from '../utils/timeSlots';
import { format } from 'date-fns';

export const BookingPage: React.FC = () => {
  const { repo } = useData();
  const { user } = useAuth();
  
  const [services, setServices] = useState<BookingService[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      const [svcs, schs, bDays, appts] = await Promise.all([
        repo.getServices(),
        repo.getSchedules(),
        repo.getBlockedDays(),
        repo.getAppointments()
      ]);
      setServices(svcs);
      setSchedules(schs);
      setBlockedDays(bDays);
      setAppointments(appts);
    };
    loadInitial();
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

    const existingApptTimes = appointments
      .filter(a => a.dateTimeStart >= dayStart.getTime() && a.dateTimeStart <= dayEnd.getTime())
      .map(a => a.dateTimeStart);

    return generateTimeSlots(
      schedule.ranges,
      selectedService.durationMin,
      selectedDate,
      existingApptTimes
    );
  }, [selectedDate, selectedService, schedules, appointments]);

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !user) return;
    
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
    return (
      <div className="booking-page" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2>¡Reserva Confirmada!</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
          <strong>{selectedService?.name}</strong> el <strong>{selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}</strong> a las <strong>{selectedTime}</strong>.
          <br />Te enviamos una confirmación por email.
        </p>
        <button className="btn-primary" onClick={reset}>Hacer otra reserva</button>
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
            {services.filter(s => s.isActive).map(svc => (
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
            blockedDates={blockedDays.map(d => d.date)}
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

// Import inline for simplicity in this file for now
import { es } from 'date-fns/locale';
