import type { User, BookingService, Appointment, BusinessConfig, DaySchedule, BlockedDay } from './models';

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
}
