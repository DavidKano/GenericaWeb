import type { BusinessConfig } from './models';

export const INITIAL_BUSINESS_CONFIG: BusinessConfig = {
  id: 'global',
  name: 'Mi Negocio',
  contactEmail: '',
  bookingEnabled: true,
  allowClientCancellation: true,
  concurrentSlots: 1,
  whatsappEnabled: true
};
