import type { DataRepository } from './repository';
import type { User, BookingService, Appointment, BusinessConfig, DaySchedule, BlockedDay, CompanyData, DesignConfig, PromoOffer, EmailLog, Transaction, CashClose } from './models';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

export class FirebaseRepository implements DataRepository {
  private db: any;
  private storage: any;

  constructor(config: FirebaseOptions) {
    const app = !getApps().length ? initializeApp(config) : getApp();
    this.db = getFirestore(app);
    this.storage = getStorage(app);
  }

  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(this.db, 'users'));
    return snapshot.docs.map(doc => doc.data() as User);
  }

  async getUserById(id: string): Promise<User | null> {
    const d = await getDoc(doc(this.db, 'users', id));
    return d.exists() ? (d.data() as User) : null;
  }

  async saveUser(user: User): Promise<void> {
    await setDoc(doc(this.db, 'users', user.id), user);
  }

  async deleteUser(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'users', id));
  }

  async getServices(): Promise<BookingService[]> {
    const snapshot = await getDocs(collection(this.db, 'services'));
    return snapshot.docs.map(doc => doc.data() as BookingService);
  }

  async saveService(service: BookingService): Promise<void> {
    await setDoc(doc(this.db, 'services', service.id), service);
  }

  async deleteService(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'services', id));
  }

  async getAppointments(): Promise<Appointment[]> {
    const snapshot = await getDocs(collection(this.db, 'appointments'));
    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  subscribeToAppointments(callback: (appts: Appointment[]) => void): () => void {
    const q = collection(this.db, 'appointments');
    return onSnapshot(q, (snapshot) => {
      const appts = snapshot.docs.map(doc => doc.data() as Appointment);
      callback(appts);
    });
  }

  async saveAppointment(appointment: Appointment): Promise<void> {
    await setDoc(doc(this.db, 'appointments', appointment.id), appointment);
  }

  async deleteAppointment(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'appointments', id));
  }

  async getConfig(): Promise<BusinessConfig | null> {
    const d = await getDoc(doc(this.db, 'config', 'global'));
    return d.exists() ? (d.data() as BusinessConfig) : null;
  }

  async saveConfig(config: BusinessConfig): Promise<void> {
    await setDoc(doc(this.db, 'config', 'global'), config);
  }

  async getSchedules(): Promise<DaySchedule[]> {
    const snapshot = await getDocs(collection(this.db, 'schedules'));
    return snapshot.docs.map(doc => doc.data() as DaySchedule);
  }

  async saveSchedules(schedules: DaySchedule[]): Promise<void> {
    await Promise.all(schedules.map(s => 
      setDoc(doc(this.db, 'schedules', s.dayOfWeek.toString()), s)
    ));
  }

  async getBlockedDays(): Promise<BlockedDay[]> {
    const snapshot = await getDocs(collection(this.db, 'blockedDays'));
    return snapshot.docs.map(doc => doc.data() as BlockedDay);
  }

  async saveBlockedDay(day: BlockedDay): Promise<void> {
    await setDoc(doc(this.db, 'blockedDays', day.id), day);
  }

  async deleteBlockedDay(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'blockedDays', id));
  }

  // --- SaaS License / Core Data ---
  async getCompanyData(): Promise<CompanyData | null> {
    const d = await getDoc(doc(this.db, 'system', 'company_data'));
    return d.exists() ? (d.data() as CompanyData) : null;
  }

  async saveCompanyData(data: CompanyData): Promise<void> {
    await setDoc(doc(this.db, 'system', 'company_data'), data);
  }

  async getDesignConfig(): Promise<DesignConfig | null> {
    const d = await getDoc(doc(this.db, 'system', 'design_config'));
    return d.exists() ? (d.data() as DesignConfig) : null;
  }

  async saveDesignConfig(data: DesignConfig): Promise<void> {
    await setDoc(doc(this.db, 'system', 'design_config'), data);
  }

  // --- Storage ---
  async uploadImage(path: string, base64: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    // Extraemos el formato y los datos puros del dataURL
    // Formato esperado: data:image/png;base64,.....
    await uploadString(storageRef, base64, 'data_url');
    return await getDownloadURL(storageRef);
  }

  // --- Promo Offers ---
  async getPromoOffers(): Promise<PromoOffer[]> {
    const snapshot = await getDocs(collection(this.db, 'promoOffers'));
    return snapshot.docs.map(doc => doc.data() as PromoOffer);
  }

  async savePromoOffer(offer: PromoOffer): Promise<void> {
    await setDoc(doc(this.db, 'promoOffers', offer.id), offer);
  }

  async deletePromoOffer(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'promoOffers', id));
  }

  // --- Email Logs ---
  async getEmailLogs(): Promise<EmailLog[]> {
    const snapshot = await getDocs(collection(this.db, 'emailLogs'));
    return snapshot.docs.map(doc => doc.data() as EmailLog);
  }

  async saveEmailLog(log: EmailLog): Promise<void> {
    await setDoc(doc(this.db, 'emailLogs', log.id), log);
  }

  // --- Transactions (TPV) ---
  async getTransactions(): Promise<Transaction[]> {
    const snapshot = await getDocs(collection(this.db, 'transactions'));
    return snapshot.docs.map(doc => doc.data() as Transaction);
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    await setDoc(doc(this.db, 'transactions', transaction.id), transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'transactions', id));
  }

  // --- Cash Closes ---
  async getCashCloses(): Promise<CashClose[]> {
    const snapshot = await getDocs(collection(this.db, 'cashCloses'));
    return snapshot.docs.map(doc => doc.data() as CashClose);
  }

  async saveCashClose(close: CashClose): Promise<void> {
    await setDoc(doc(this.db, 'cashCloses', close.id), close);
  }
}
