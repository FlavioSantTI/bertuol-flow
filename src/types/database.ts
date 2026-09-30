export interface Clinic {
  id: number;
  name: string;
  shortName: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  whatsapp_instance_key?: string;
  clinicorp_business_id: number;
  clinicorp_user?: string;
  clinicorp_api_key?: string;
  clinicorp_key_masked?: string;
  webhook_secret?: string;
  colorTag: string;
  active: boolean;
}

export interface DentistClinicAffiliation {
  dentistId: number;
  clinicId: number;
  clinicorp_dentist_person_id: number;
  daysOfWeek?: number[];
  colorBadge?: string;
}

export type UserRole =
  | 'admin_root'          // Superadmin total do sistema (todas as clínicas e unidades)
  | 'admin_clinica'       // Administrador da clínica (somente sua clínica e unidades derivadas)
  | 'admin_tecnico'       // Técnico de TI por clínica(s) autorizadas
  | 'gerente_atendimento' // Gestor de clínica multiclinica (todas as agendas, sem configs de TI)
  | 'dentist'             // Corpo clínico (apenas sua própria agenda)
  | 'receptionist'        // Recepção da unidade local
  | 'admin';              // Alias de compatibilidade para admin_root

export interface UserPermissions {
  canViewAgenda: boolean;
  canCheckIn: boolean;
  canReceiveWhatsApp: boolean;
  canReceivePush: boolean;
  canViewPatientPhone: boolean;
  canGenerateAISummary: boolean;
  canAccessConfig: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
}

export interface AppUserContext {
  userId?: string;             // ID do usuário no sistema
  role: UserRole;
  userName: string;
  dentistId?: number;
  clinicId?: number;           // Clínica matriz vinculada (para admin_clinica, etc.)
  receptionClinicId?: number;  // Unidade específica da recepção
  allowedClinicIds?: number[]; // Unidades autorizadas
  email?: string;
  canAccessConfig?: boolean;
  permissions?: Partial<UserPermissions>;
  mustChangePassword?: boolean;// Se precisa cadastrar nova senha definitiva
  isAuthenticated?: boolean;   // Se o usuário possui sessão ativa autenticada
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  clinicId: number;            // Clínica matriz
  allowedClinicIds: number[];  // Unidades autorizadas (matriz + derivadas)
  dentist_id?: number;         // Vínculo com profissional Clinicorp (se for dentist)
  permissions: UserPermissions;
  active: boolean;
  password?: string;           // Senha atual cadastrada
  initialPassword?: string;    // Senha provisória para primeiro acesso
  mustChangePassword?: boolean;// Se precisa cadastrar nova senha no 1º acesso
  passwordChangedAt?: string;  // Data da última troca de senha
  inviteSentAt?: string;       // Data do último envio do convite
  createdAt?: string;
  lastLoginAt?: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  platform: 'ios' | 'android' | 'web';
  push_token: string;
  active: boolean;
  last_seen_at?: string;
}

export interface Dentist {
  id: number;
  Name: string;
  CRO: string;
  Email: string;
  MobilePhone: string;
  Active: string;
  Sex: string;
  Clinic_BusinessId: number;
  specialty?: string;
  avatarUrl?: string;
  affiliatedClinicIds?: number[];
}

export interface Category {
  id: string;
  description: string;
  color: string;
  Clinic_BusinessId: number;
}

export interface Patient {
  id: number;
  Name: string;
  MobilePhone: string;
  Age: number;
  insurancePlanName: string;
  Notes: string;
  Clinic_BusinessId: number;
  cpf?: string;
}

export interface Appointment {
  id: number;
  AtomicDate: number;
  Clinic_BusinessId: number;
  Dentist_PersonId: number;
  Patient_PersonId: number;
  PatientName: string;
  MobilePhone: string;
  Procedures: string;
  Notes: string;
  fromTime: string;
  toTime: string;
  date: string; // ISO date string or timestamptz (YYYY-MM-DD or full timestamp)
  CategoryId: string;
  ai_summary: string | null;
  // Enriched fields from join
  category?: Category;
  patient?: Patient;
  clinic?: Clinic;
  dentist?: Dentist;
  dentist_name?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
