import type { DataRepository } from './repository';
import type { User, BookingService, Appointment, BusinessConfig, DaySchedule, BlockedDay, CompanyData, DesignConfig, PromoOffer, EmailLog, Transaction, CashClose, TeamMember } from './models';

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

  async deleteUser(id: string): Promise<void> {
    const users = getLocal<User>('users');
    setLocal('users', users.filter(u => u.id !== id));
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

  async deleteService(id: string): Promise<void> {
    const services = getLocal<BookingService>('services');
    setLocal('services', services.filter(s => s.id !== id));
  }

  async getAppointments(): Promise<Appointment[]> {
    return getLocal<Appointment>('appointments');
  }

  subscribeToAppointments(callback: (appts: Appointment[]) => void): () => void {
    // Implementación básica para local: llama una vez y devuelve un no-op
    callback(getLocal<Appointment>('appointments'));
    return () => {};
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

  async getPromoOffers(): Promise<PromoOffer[]> {
    return getLocal<PromoOffer>('app_promo_offers');
  }

  async savePromoOffer(offer: PromoOffer): Promise<void> {
    const offers = getLocal<PromoOffer>('app_promo_offers');
    const idx = offers.findIndex(o => o.id === offer.id);
    if (idx >= 0) offers[idx] = offer;
    else offers.push(offer);
    setLocal('app_promo_offers', offers);
  }

  async deletePromoOffer(id: string): Promise<void> {
    const offers = getLocal<PromoOffer>('app_promo_offers');
    setLocal('app_promo_offers', offers.filter(o => o.id !== id));
  }

  // --- EMAIL LOGS ---
  async getEmailLogs(): Promise<EmailLog[]> {
    return getLocal<EmailLog>('emailLogs');
  }

  async saveEmailLog(log: EmailLog): Promise<void> {
    const logs = getLocal<EmailLog>('emailLogs');
    const filtered = logs.filter(l => l.id !== log.id);
    filtered.push(log);
    setLocal('emailLogs', filtered);
  }

  // --- TRANSACTIONS (TPV) ---
  async getTransactions(): Promise<Transaction[]> {
    return getLocal<Transaction>('transactions');
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = getLocal<Transaction>('transactions');
    const filtered = transactions.filter(t => t.id !== transaction.id);
    filtered.push(transaction);
    setLocal('transactions', filtered);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transactions = getLocal<Transaction>('transactions');
    setLocal('transactions', transactions.filter(t => t.id !== id));
  }

  // --- CASH CLOSES ---
  async getCashCloses(): Promise<CashClose[]> {
    return getLocal<CashClose>('cashCloses');
  }

  async saveCashClose(close: CashClose): Promise<void> {
    const closes = getLocal<CashClose>('cashCloses');
    const filtered = closes.filter(c => c.id !== close.id);
    filtered.push(close);
    setLocal('cashCloses', filtered);
  }

  // --- TEAM MEMBERS ---
  async getTeamMembers(): Promise<TeamMember[]> {
    return getLocal<TeamMember>('team_members');
  }

  async saveTeamMember(member: TeamMember): Promise<void> {
    const members = getLocal<TeamMember>('team_members');
    const idx = members.findIndex(m => m.id === member.id);
    if (idx >= 0) members[idx] = member;
    else members.push(member);
    setLocal('team_members', members);
  }

  async deleteTeamMember(id: string): Promise<void> {
    const members = getLocal<TeamMember>('team_members');
    setLocal('team_members', members.filter(m => m.id !== id));
  }
}
