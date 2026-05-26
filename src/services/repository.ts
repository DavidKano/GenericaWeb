import type { User, BookingService, Appointment, BusinessConfig, DaySchedule, BlockedDay, CompanyData, DesignConfig, PromoOffer, EmailLog, Transaction } from './models';

export interface DataRepository {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Services
  getServices(): Promise<BookingService[]>;
  saveService(service: BookingService): Promise<void>;
  deleteService(id: string): Promise<void>;

  // Appointments
  getAppointments(): Promise<Appointment[]>;
  subscribeToAppointments(callback: (appts: Appointment[]) => void): () => void;
  saveAppointment(appointment: Appointment): Promise<void>;
  deleteAppointment(id: string): Promise<void>;

  // Config & Schedule
  getConfig(): Promise<BusinessConfig | null>;
  saveConfig(config: BusinessConfig): Promise<void>;
  
  getSchedules(): Promise<DaySchedule[]>;
  saveSchedules(schedules: DaySchedule[]): Promise<void>;
  
  getBlockedDays(): Promise<BlockedDay[]>;
  saveBlockedDay(day: BlockedDay): Promise<void>;
  deleteBlockedDay(id: string): Promise<void>;

  // SaaS License / Core Data
  getCompanyData(): Promise<CompanyData | null>;
  saveCompanyData(data: CompanyData): Promise<void>;

  getDesignConfig(): Promise<DesignConfig | null>;
  saveDesignConfig(data: DesignConfig): Promise<void>;

  // Storage
  uploadImage(path: string, base64: string): Promise<string>;

  // Promo Offers
  getPromoOffers(): Promise<PromoOffer[]>;
  savePromoOffer(offer: PromoOffer): Promise<void>;
  deletePromoOffer(id: string): Promise<void>;

  // Email Logs
  getEmailLogs(): Promise<EmailLog[]>;
  saveEmailLog(log: EmailLog): Promise<void>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  saveTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
}
