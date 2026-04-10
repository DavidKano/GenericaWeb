import { addMinutes, format, parse, isBefore, startOfMinute } from 'date-fns';
import type { TimeRange } from '../services/models';

/**
 * Genera una lista de slots (HH:mm) para un conjunto de rangos horarios
 * y una duración específica, evitando solapamientos y citas pasadas.
 */
export const generateTimeSlots = (
  ranges: TimeRange[],
  durationMin: number,
  selectedDate: Date,
  existingAppointments: number[] // timestamps de inicio
): string[] => {
  const slots: string[] = [];
  const now = new Date();
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

  ranges.forEach(range => {
    let current = parse(range.start, 'HH:mm', selectedDate);
    const end = parse(range.end, 'HH:mm', selectedDate);

    while (addMinutes(current, durationMin) <= end) {
      const slotTime = format(current, 'HH:mm');
      const slotTimestamp = current.getTime();

      // Validar si el slot ya pasó (si es hoy)
      const isPast = isToday && isBefore(current, addMinutes(now, 15)); // 15 min de margen

      // Validar si hay colisión con citas existentes
      // Nota: Aquí se asume que una cita ocupa exactamente su duración o bloquea el slot de inicio.
      // Para un sistema más robusto, se debería comprobar el rango completo [start, start+duration].
      const isBooked = existingAppointments.some(apptTime => {
        // Colisión simple: si el inicio coincide o está dentro del rango
        // Para este MVP, comprobamos coincidencia exacta o solapamiento básico.
        return Math.abs(apptTime - slotTimestamp) < durationMin * 60000;
      });

      if (!isPast && !isBooked) {
        slots.push(slotTime);
      }

      current = addMinutes(current, durationMin);
    }
  });

  return slots;
};
