import type { User, BookingService, Appointment, BusinessConfig, DaySchedule, BlockedDay, CompanyData, DesignConfig } from './models';

export interface DataRepository {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  saveUser(user: User): Promise<void>;

  // Services
  getServices(): Promise<BookingService[]>;
  saveService(service: BookingService): Promise<void>;

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
}
