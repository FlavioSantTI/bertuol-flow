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
  | 'paciente'            // PWA do Paciente (Clube Sorriso Bertuol)
  | 'admin'               // Alias de compatibilidade para admin_root
  | string;               // Perfis e cargos customizados criados via CRUD RBAC

export interface CustomRoleDefinition {
  id: string;             // ex: 'financeiro', 'consultor'
  name: string;           // ex: 'Financeiro & Faturamento'
  description: string;    // Descrição das responsabilidades do perfil
  defaultPermissions: UserPermissions;
  badgeBg: string;        // ex: 'bg-purple-100 text-purple-800 border-purple-200'
}

export interface PatientPermissions {
  canViewOwnAppointments: boolean;  // Visualizar apenas suas próprias consultas agendadas
  canConfirmAppointment: boolean;   // Confirmar presença com 1 clique (+10 pts)
  canPerformCheckIn: boolean;        // Escanear QR Code no Totem da recepção (+20 pts)
  canRedeemRewards: boolean;         // Resgatar brindes do Clube Sorriso Bertuol
  canScheduleBirthdayGift: boolean;  // Agendar cortesia de aniversário no app
  canAccessInternalAgenda: boolean;  // Bloqueado: Sem acesso a agendas corporativas (false)
  canAccessOtherPatients: boolean;   // Bloqueado: Sem acesso a dados de outros pacientes (false)
  canAccessConfig: boolean;          // Bloqueado: Sem acesso a configurações (false)
}

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
  canViewClubeSorriso: boolean;
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

// ==========================================
// PORTAL DO PACIENTE & GAMIFICAÇÃO (PRD v1.2)
// ==========================================

export interface PatientMagicSession {
  id: string;
  patient_phone: string;
  session_token: string;
  appointment_id?: number | null;
  expires_at: string;
  used_at?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface ReceptionCheckin {
  id: string;
  clinic_id: number;
  appointment_id?: number | null;
  patient_phone: string;
  patient_name: string;
  dentist_id: number;
  method: 'qr_code_totem' | 'manual_receptionist';
  dentist_notified: boolean;
  dentist_notified_at?: string | null;
  created_at: string;
}

export interface GamificationRule {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  trigger_event: 'appointment_confirmed' | 'checkin_on_time' | 'preventive_streak' | 'survey_answered' | string;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface PatientPoint {
  id: string;
  patient_phone: string;
  patient_name?: string;
  rule_id?: string | null;
  appointment_id?: number | null;
  points: number;
  description: string;
  created_at: string;
}

export interface RewardCatalogItem {
  id: string;
  clinic_id?: number | null;
  title: string;
  description: string;
  points_required: number;
  stock_available: number;
  voucher_validity_days: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  reward_id?: string;
  rewardId?: string;
  rewardTitle?: string;
  patient_phone?: string;
  patientPhone?: string;
  patient_name?: string;
  patientName?: string;
  points_spent?: number;
  pointsSpent?: number;
  secret_code?: string; // Ex: BT-8492
  secretCode?: string;
  status: 'pending' | 'claimed' | 'expired';
  claimed_at?: string | null;
  claimedAt?: string | null;
  claimed_by_user_id?: string | null;
  claimedBy?: string | null;
  claimed_clinic_id?: number | null;
  clinicId?: number | null;
  expires_at?: string;
  expiresAt?: string;
  created_at?: string;
  reward?: RewardCatalogItem;
}

export interface GamificationTier {
  id: string;
  name: string;
  badge: string;
  min_points: number;
  color_theme: string;
  multiplier: number;
  benefits_description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PatientPortalProfile {
  phone: string;
  name: string;
  totalPoints: number;
  tier: string;
  tierProgress: number; // 0 to 100
  nextTierPoints: number;
  activeAppointment?: Appointment | null;
  pointsHistory: PatientPoint[];
  activeVouchers: RewardRedemption[];
}
