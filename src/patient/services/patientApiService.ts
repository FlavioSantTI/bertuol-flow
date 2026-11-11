import type {
  PatientProfile,
  PatientVoucher,
  PointTransaction,
  InAppNotificationItem,
} from '../types/patientTypes';
import type { RewardCatalogItem } from '../../types/database';

export const patientApiService = {
  /**
   * Consulta perfil completo, pontos e nível do paciente
   */
  async getProfile(phone: string): Promise<{
    profile: PatientProfile;
    vouchers: PatientVoucher[];
    history: PointTransaction[];
  }> {
    const res = await fetch(`/api/patient/profile?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) {
      throw new Error(`Falha ao obter perfil do paciente: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Confirma presença antecipada na próxima consulta (+10 pts)
   */
  async confirmAppointment(data: {
    appointmentId: number;
    phone: string;
    patientName: string;
    clinicId?: number;
    dentistId?: number;
    dentistName?: string;
  }): Promise<{
    success: boolean;
    pointsAwarded: number;
    totalPoints: number;
    message: string;
  }> {
    const res = await fetch('/api/patient/confirm-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao confirmar consulta');
    }
    return res.json();
  },

  /**
   * Realiza check-in no totem da recepção via QR Code (+20 pts)
   */
  async checkinTotem(data: {
    clinicId: number;
    phone: string;
    patientName: string;
    appointmentId?: number;
    dentistId?: number;
    dentistName?: string;
    method?: string;
  }): Promise<{
    success: boolean;
    checkin: any;
    pointsAwarded: number;
    isSandbox: boolean;
    totalPoints: number;
    message: string;
  }> {
    const res = await fetch('/api/patient/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao realizar check-in no totem');
    }
    return res.json();
  },

  /**
   * Lista catálogo de prêmios disponíveis para resgate
   */
  async getRewards(clinicId?: number): Promise<RewardCatalogItem[]> {
    const url = clinicId ? `/api/patient/rewards?clinic_id=${clinicId}` : '/api/patient/rewards';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Erro ao carregar catálogo de prêmios');
    }
    return res.json();
  },

  /**
   * Resgata um brinde com saldo de pontos gerando voucher
   */
  async redeemReward(data: {
    phone: string;
    patientName: string;
    rewardId: string;
  }): Promise<{
    success: boolean;
    voucher: PatientVoucher;
    remainingPoints: number;
    message: string;
  }> {
    const res = await fetch('/api/patient/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao resgatar prêmio');
    }
    return res.json();
  },

  /**
   * Agenda cortesia do presente de aniversário no app
   */
  async scheduleBirthdayGift(data: {
    patientName: string;
    phone: string;
    preferredDate: string;
    preferredPeriod: string;
    unit: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    request: any;
    message: string;
  }> {
    const res = await fetch('/api/patient/schedule-birthday-gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao agendar cortesia de aniversário');
    }
    return res.json();
  },

  /**
   * Consulta histórico de notificações in-app
   */
  async getNotifications(phone: string): Promise<InAppNotificationItem[]> {
    const res = await fetch(`/api/patient/notifications?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) {
      throw new Error('Erro ao carregar notificações');
    }
    return res.json();
  },

  /**
   * Marca notificação como lida
   */
  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/patient/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return res.json();
  },
};
