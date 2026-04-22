import { format, addMinutes } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  durationMin: number;
  location?: string;
}

/**
 * Formatea una fecha al estándar compactode calendario (YYYYMMDDTHHMMSS)
 */
function formatCalendarDate(date: Date): string {
  // Usamos el formato local para evitar confusiones de zona horaria si no manejamos UTC estrictamente
  return format(date, "yyyyMMdd'T'HHmmss");
}

/**
 * Genera una URL para añadir el evento a Google Calendar
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const endDate = addMinutes(event.startDate, event.durationMin);
  const startStr = formatCalendarDate(event.startDate);
  const endStr = formatCalendarDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startStr}/${endStr}`,
    details: event.description,
    location: event.location || '',
    sf: 'true',
    output: 'xml'
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera el contenido de un archivo .ics
 */
export function generateIcsContent(event: CalendarEvent): string {
  const endDate = addMinutes(event.startDate, event.durationMin);
  const startStr = formatCalendarDate(event.startDate);
  const endStr = formatCalendarDate(endDate);
  const stampStr = formatCalendarDate(new Date());

  // El formato iCalendar requiere líneas terminadas en \r\n
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Antigravity//GenericaWeb//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTAMP:${stampStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de cita',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.filter(line => line !== '').join('\r\n');
}

/**
 * Intenta compartir el calendario usando Web Share API o descarga como fallback
 */
export async function shareOrDownloadIcs(event: CalendarEvent) {
  const content = generateIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const filename = 'cita-reserva.ics';

  // Intentar Web Share API si está disponible (mejor experiencia en móvil)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'text/calendar' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Mi Cita',
          text: event.title
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing calendar file:', err);
        } else {
          return; // El usuario canceló la acción de compartir
        }
      }
    }
  }

  // Fallback: Descarga tradicional
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
