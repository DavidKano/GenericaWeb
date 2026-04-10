import type { DataRepository } from './repository';
import type { User, BookingService, Appointment, BusinessConfig, DaySchedule, BlockedDay } from './models';

// NOTA: Esta es una implementación Dummy preparada para inyectar Firebase SDK orgánico o librerías NoSQL.
export class FirebaseRepository implements DataRepository {

  async getUsers(): Promise<User[]> {
     console.log('Fetching users from Firebase...');
     return [];
  }

  async getUserById(_id: string): Promise<User | null> {
    return null;
  }

  async saveUser(user: User): Promise<void> {
    console.log('Saving user to Firebase:', user);
  }

  async getServices(): Promise<BookingService[]> {
    return [];
  }

  async saveService(service: BookingService): Promise<void> {
    console.log('Saving service to Firebase:', service);
  }

  async getAppointments(): Promise<Appointment[]> {
    return [];
  }

  async saveAppointment(appointment: Appointment): Promise<void> {
     console.log('Saving appointment to Firebase:', appointment);
  }

  async deleteAppointment(id: string): Promise<void> {
    console.log('Deleting appointment in Firebase:', id);
  }

  async getConfig(): Promise<BusinessConfig | null> {
    return null;
  }

  async saveConfig(config: BusinessConfig): Promise<void> {
    console.log('Saving config to Firebase:', config);
  }

  async getSchedules(): Promise<DaySchedule[]> {
    console.log('Fetching schedules from Firebase...');
    return [];
  }

  async saveSchedules(schedules: DaySchedule[]): Promise<void> {
    console.log('Saving schedules to Firebase:', schedules);
  }

  async getBlockedDays(): Promise<BlockedDay[]> {
    console.log('Fetching blocked days from Firebase...');
    return [];
  }

  async saveBlockedDay(day: BlockedDay): Promise<void> {
    console.log('Saving blocked day to Firebase:', day);
  }

  async deleteBlockedDay(id: string): Promise<void> {
    console.log('Deleting blocked day in Firebase:', id);
  }
}
