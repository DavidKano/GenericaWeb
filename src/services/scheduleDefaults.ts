import type { DaySchedule } from './models';

/**
 * Horario base vacío (0-6). 
 * Se muestran los días para que la interfaz no esté en blanco, 
 * pero obligamos al usuario a configurar sus horas reales.
 */
export const INITIAL_SCHEDULES: DaySchedule[] = [0, 1, 2, 3, 4, 5, 6].map(day => ({
  dayOfWeek: day,
  isOpen: false,
  ranges: []
}));
