import { PatientPermissions, UserRole } from '../../types/database';

export type PatientTier = 'bronze' | 'prata' | 'ouro' | 'diamante';

export const DEFAULT_PATIENT_PERMISSIONS: PatientPermissions = {
  canViewOwnAppointments: true,
  canConfirmAppointment: true,
  canPerformCheckIn: true,
  canRedeemRewards: true,
  canScheduleBirthdayGift: true,
  canAccessInternalAgenda: false,
  canAccessOtherPatients: false,
  canAccessConfig: false,
};

export interface PatientProfile {
  phone: string;
  name: string;
  points: number;
  tier: PatientTier;
  tierProgress: number;
  nextTierPoints: number;
  role: 'paciente';
  permissions: PatientPermissions;
  activeVouchersCount?: number;
  isBirthdayToday?: boolean;
}

export interface PatientVoucher {
  id: string;
  rewardId: string;
  rewardTitle: string;
  patientPhone: string;
  patientName: string;
  pointsSpent: number;
  secretCode: string;
  status: 'pending' | 'claimed' | 'expired';
  expiresAt: string;
  createdAt: string;
  clinicId?: number;
}

export interface PointTransaction {
  id: string;
  patient_phone: string;
  patient_name?: string;
  appointment_id?: number;
  points: number;
  description: string;
  created_at: string;
}

export interface AppointmentDetails {
  appointmentId: number;
  time: string;
  dayText: string;
  dentistId: number;
  dentistName: string;
  dentistRole: string;
  clinicId: number;
  clinicName: string;
  clinicAddress?: string;
  procedures: string;
  isConfirmed: boolean;
  isCheckedIn: boolean;
  checkinTime?: string | null;
}

export interface BirthdayGiftInfo {
  code: string;
  title: string;
  description: string;
  validUntil: string;
}

export interface InAppNotificationItem {
  id: string;
  title: string;
  body: string;
  type?: string;
  timestamp: string;
  read: boolean;
  url?: string;
}

export interface TotemScanResult {
  rawCode: string;
  clinicId?: number;
  timestamp?: string;
  valid: boolean;
}

export interface TestPatientOption {
  phone: string;
  name: string;
  appointmentId: number;
  time: string;
  dayText: string;
  dentistId: number;
  dentistName: string;
  dentistRole: string;
  clinicId: number;
  clinicName: string;
  procedures: string;
  tagLabel?: string;
}
