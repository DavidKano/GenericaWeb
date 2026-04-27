export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  address?: string;
  dob?: string;
  adminNotes?: string;
  lastAdminAccess?: number; // timestamp ms - último acceso al panel admin
  isActive?: boolean;       // false = desactivado temporalmente (solo aplica a ADMIN)
}
export interface CompanyData {
  nombreEmpresa: string;
  personaContacto: string;
  cifNif: string;
  direccion: string;
  cp: string;
  localidad: string;
  provincia: string;
  fechaPuestaMarcha: string; // ISO date YYYY-MM-DD
  precioActual: number;
  fechaRenovacion: string; // ISO date YYYY-MM-DD
  privacyPolicy?: string;
  termsOfUse?: string;
  supportEmail?: string;
  contactEmail?: string;
  telefono?: string;
  renewalType?: 'Mensual' | 'Anual';
}

export interface DesignConfig {
  sourceLogoUrl?: string; 
  pwaIcon: string;        
  adminHeaderUrl: string; 
  faviconUrl: string;     
  qrCardUrl: string;      
  primaryColor?: string;
  secondaryColor?: string;
  primaryTextColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  customCssCustomer?: string;
  customCssAdmin?: string;
}

export interface BookingService {
  id: string;
  name: string;
  durationMin: number;
  price?: number;
  color?: string;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  customerId: string;
  serviceId: string;
  dateTimeStart: number; // timestamp
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  adminNotes?: string;
}

export interface BusinessConfig {
  id: string;
  name: string;
  contactEmail: string;
  bookingEnabled: boolean;
  allowClientCancellation: boolean;
  concurrentSlots: number;
}

export interface TimeRange {
  start: string; // "09:00"
  end: string;   // "14:00"
}

export interface DaySchedule {
  dayOfWeek: number; // 0-6 (domingo a sábado)
  ranges: TimeRange[];
  isOpen: boolean;
}

export interface BlockedDay {
  id: string;
  date: string; // ISO "YYYY-MM-DD"
  reason?: string;
  isFullDay?: boolean; // false = bloqueo parcial por horas
  blockedRanges?: TimeRange[]; // Franjas ["HH:mm", "HH:mm"] bloqueadas si isFullDay es false
}

export interface PromoOffer {
  id: string;
  imageUrl: string;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string; // ISO "YYYY-MM-DD"
  isActive: boolean;
  displayMode?: 'popup' | 'inline'; // popup (modal) o inline (debajo de servicios)
  type?: 'image' | 'text';
  textHeader?: string;
  textBody?: string;
  designSeed?: number;
  legalDisclaimer?: string;
}
