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
  concurrentSlots: number = 1,
  blockedTimeRanges: AppointmentRange[] = []
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

      // 3. Validar bloqueos parciales del administrador
      const isBlocked = blockedTimeRanges.some(b => {
        return (b.start < slotEnd) && (b.end > slotStart);
      });

      if (!isPast && !isFull && !isBlocked) {
        slots.push(slotTime);
      }

      current = addMinutes(current, durationMin);
    }
  });

  return slots;
};

export const getIntersectedRanges = (
  businessRanges: TimeRange[],
  custom?: { isOpen: boolean; start?: string; end?: string }
): TimeRange[] => {
  if (!custom) return businessRanges;
  if (!custom.isOpen) return [];

  const { start: customStart, end: customEnd } = custom;
  if (!customStart && !customEnd) return businessRanges;

  const intersected: TimeRange[] = [];
  businessRanges.forEach(r => {
    const s = customStart && customStart > r.start ? customStart : r.start;
    const e = customEnd && customEnd < r.end ? customEnd : r.end;

    if (s < e) {
      intersected.push({ start: s, end: e });
    }
  });

  return intersected;
};

