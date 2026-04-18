import { addMinutes, format, parse, isBefore } from 'date-fns';
import type { TimeRange } from '../services/models';

/**
 * Genera una lista de slots (HH:mm) para un conjunto de rangos horarios
 * y una duración específica, evitando solapamientos y citas pasadas.
 */
/**
 * Genera una lista de slots (HH:mm) para un conjunto de rangos horarios
 * y una duración específica, respetando la capacidad de simultaneidad del negocio.
 */
export interface AppointmentRange {
  start: number;
  end: number;
}

export const generateTimeSlots = (
  ranges: TimeRange[],
  durationMin: number,
  selectedDate: Date,
  existingAppointments: AppointmentRange[],
  concurrentSlots: number = 1
): string[] => {
  const slots: string[] = [];
  const now = new Date();
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

  ranges.forEach(range => {
    let current = parse(range.start, 'HH:mm', selectedDate);
    const endBound = parse(range.end, 'HH:mm', selectedDate);

    while (addMinutes(current, durationMin) <= endBound) {
      const slotTime = format(current, 'HH:mm');
      const slotStart = current.getTime();
      const slotEnd = addMinutes(current, durationMin).getTime();

      // 1. Validar si el slot ya pasó (si es hoy)
      const isPast = isToday && isBefore(current, addMinutes(now, 5)); // 5 min de margen

      // 2. Contar solapamientos con citas existentes
      // Una cita solapa si: (apptStart < slotEnd) && (apptEnd > slotStart)
      const overlapCount = existingAppointments.filter(appt => {
        return (appt.start < slotEnd) && (appt.end > slotStart);
      }).length;

      const isFull = overlapCount >= concurrentSlots;

      if (!isPast && !isFull) {
        slots.push(slotTime);
      }

      current = addMinutes(current, durationMin);
    }
  });

  return slots;
};
