import type { DataRepository } from './repository';
import type { User, BookingService, Appointment, BusinessConfig, DaySchedule, BlockedDay, CompanyData, DesignConfig } from './models';

// Utilidad simple para leer/escribir JSON en localStorage
const getLocal = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

const DEFAULT_SCHEDULES: DaySchedule[] = [1, 2, 3, 4, 5].map(day => ({
  dayOfWeek: day,
  isOpen: true,
  ranges: [{ start: '09:00', end: '14:00' }, { start: '16:00', end: '20:00' }]
}));

export class LocalRepository implements DataRepository {
  
  async getUsers(): Promise<User[]> {
    return getLocal<User>('users');
  }

  async getUserById(id: string): Promise<User | null> {
    const users = getLocal<User>('users');
    return users.find(u => u.id === id) || null;
  }

  async saveUser(user: User): Promise<void> {
    const users = getLocal<User>('users');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    setLocal('users', users);
  }

  async getServices(): Promise<BookingService[]> {
    return getLocal<BookingService>('services');
  }

  async saveService(service: BookingService): Promise<void> {
    const services = getLocal<BookingService>('services');
    const idx = services.findIndex(s => s.id === service.id);
    if (idx >= 0) services[idx] = service;
    else services.push(service);
    setLocal('services', services);
  }

  async getAppointments(): Promise<Appointment[]> {
    return getLocal<Appointment>('appointments');
  }

  async saveAppointment(appointment: Appointment): Promise<void> {
    const appts = getLocal<Appointment>('appointments');
    const idx = appts.findIndex(a => a.id === appointment.id);
    if (idx >= 0) appts[idx] = appointment;
    else appts.push(appointment);
    setLocal('appointments', appts);
  }

  async deleteAppointment(id: string): Promise<void> {
    const appts = getLocal<Appointment>('appointments');
    setLocal('appointments', appts.filter(a => a.id !== id));
  }

  async getConfig(): Promise<BusinessConfig | null> {
    const config = localStorage.getItem('businessConfigGlobal');
    return config ? JSON.parse(config) : null;
  }

  async saveConfig(config: BusinessConfig): Promise<void> {
    setLocal('businessConfigGlobal', config);
  }

  async getSchedules(): Promise<DaySchedule[]> {
    const saved = localStorage.getItem('schedules');
    return saved ? JSON.parse(saved) : DEFAULT_SCHEDULES;
  }

  async saveSchedules(schedules: DaySchedule[]): Promise<void> {
    setLocal('schedules', schedules);
  }

  async getBlockedDays(): Promise<BlockedDay[]> {
    return getLocal<BlockedDay>('blockedDays');
  }

  async saveBlockedDay(day: BlockedDay): Promise<void> {
    const days = getLocal<BlockedDay>('blockedDays');
    const idx = days.findIndex(d => d.id === day.id);
    if (idx >= 0) days[idx] = day;
    else days.push(day);
    setLocal('blockedDays', days);
  }

  async deleteBlockedDay(id: string): Promise<void> {
    const days = getLocal<BlockedDay>('blockedDays');
    setLocal('blockedDays', days.filter(d => d.id !== id));
  }

  // --- SaaS License / Core Data ---
  async getCompanyData(): Promise<CompanyData | null> {
    const data = localStorage.getItem('companyDataGlobal');
    return data ? JSON.parse(data) : null;
  }

  async saveCompanyData(data: CompanyData): Promise<void> {
    setLocal('companyDataGlobal', data);
  }

  async getDesignConfig(): Promise<DesignConfig | null> {
    const data = localStorage.getItem('designConfigGlobal');
    return data ? JSON.parse(data) : null;
  }

  async saveDesignConfig(data: DesignConfig): Promise<void> {
    setLocal('designConfigGlobal', data);
  }

  async uploadImage(_path: string, base64: string): Promise<string> {
    // En el repositorio local, no hay nube. Devolvemos el mismo base64 que servirá como fuente de imagen.
    return Promise.resolve(base64);
  }
}
