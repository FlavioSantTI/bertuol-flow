import { createClient } from '@supabase/supabase-js';

// New Mature Clinic Database (DB_Bertuol - sswbkfrpxboxmjvunhzt)
export const SUPABASE_URL = 'https://sswbkfrpxboxmjvunhzt.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2JrZnJweGJveG1qdnVuaHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4Nzc5OTcsImV4cCI6MjA5MDQ1Mzk5N30.-z9guq5XL6274zDsgMGWvXQ2XKHH-ZvwsN70sLjnfNA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Clinic {
  id: string;
  external_id: string; // Clinicorp ID (ex: "5053762760081408")
  name: string;
  unidade: string; // "Palmas - TO" ou "Paraíso do Tocantins - TO"
  owner_email: string;
  active: boolean;
  created_at?: string;
}

export interface SupabaseDentista {
  id: number;
  id_clinicorp: number;
  nome_completo: string;
  primeironome?: string;
  telefone?: string;
  status: boolean;
  unidade: string;
  clinic_id: string; // FK to clinics.id
  created_at?: string;
}

export interface SupabasePatient {
  id: string;
  tenant_id: string | null; // Clinic ID FK
  external_id?: string | null;
  name: string;
  document_id?: string | null;
  mobile_phone?: string | null;
  clinical_record_number?: string | null;
  insurance_plan_name?: string | null;
  is_active: boolean;
  notes?: string | null;
}

export interface SupabaseAppointment {
  id: number;
  id_clinicorp?: number | null;
  clinic_id: string;
  dentist_id: number;
  patient_id?: string | null;
  patient_name: string;
  patient_phone?: string | null;
  procedures: string;
  notes?: string | null;
  from_time: string;
  to_time: string;
  date: string;
  atomic_date?: number | null;
  category_id?: string | null;
  ai_summary?: string | null;
  ai_summary_created_at?: string | null;
  status?: string;
}

export async function fetchClinics(): Promise<Clinic[]> {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('active', true)
      .order('unidade');

    if (error) {
      console.warn('Erro ao carregar unidades (clinics):', error);
      return [];
    }

    return (data as Clinic[]) || [];
  } catch (err) {
    console.warn('Falha ao conectar clinics:', err);
    return [];
  }
}

export async function fetchDentistas(): Promise<SupabaseDentista[]> {
  try {
    const { data, error } = await supabase
      .from('dentistas')
      .select('*')
      .eq('status', true)
      .order('nome_completo');

    if (error) {
      console.warn('Erro ao carregar dentistas:', error);
      return [];
    }

    return (data as SupabaseDentista[]) || [];
  } catch (err) {
    console.warn('Falha ao buscar dentistas:', err);
    return [];
  }
}

export async function fetchPatients(clinicId?: string): Promise<SupabasePatient[]> {
  try {
    let query = supabase
      .from('patients')
      .select('id, tenant_id, external_id, name, document_id, mobile_phone, clinical_record_number, insurance_plan_name, is_active, notes')
      .eq('is_active', true)
      .limit(50);

    if (clinicId) {
      query = query.eq('tenant_id', clinicId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Erro ao buscar pacientes:', error);
      return [];
    }

    return (data as SupabasePatient[]) || [];
  } catch (err) {
    console.warn('Falha na query de pacientes:', err);
    return [];
  }
}

export async function fetchAppointmentsFromSupabase(
  dentistId: number,
  dateStr: string
): Promise<SupabaseAppointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('dentist_id', dentistId)
      .eq('date', dateStr)
      .order('from_time');

    if (error) {
      console.warn('Erro ao buscar appointments do Supabase:', error);
      return [];
    }

    return (data as SupabaseAppointment[]) || [];
  } catch (err) {
    console.warn('Falha na conexão de agendamentos:', err);
    return [];
  }
}

export async function updateAppointmentAiSummaryInSupabase(
  appointmentId: number,
  aiSummary: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({
        ai_summary: aiSummary,
        ai_summary_created_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (error) {
      console.warn('Erro ao salvar resumo IA no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha na atualização de resumo no Supabase:', err);
    return false;
  }
}

// ==========================================
// GAMIFICAÇÃO & PORTAL DO PACIENTE (PRD v1.2)
// ==========================================

import type {
  GamificationRule,
  RewardCatalogItem,
  PatientPoint,
  RewardRedemption,
  ReceptionCheckin,
} from '../types/database';

export async function fetchGamificationRulesFromSupabase(): Promise<GamificationRule[]> {
  try {
    const { data, error } = await supabase
      .from('gamification_rules')
      .select('*')
      .eq('is_active', true)
      .order('points_reward', { ascending: false });

    if (error) throw error;
    return (data as GamificationRule[]) || [];
  } catch (err) {
    console.warn('Supabase: usando regras padrão de gamificação', err);
    return [
      {
        id: 'rule_confirmation',
        title: 'Confirmação Antecipada',
        description: 'Confirmou a presença na véspera pelo link do WhatsApp',
        points_reward: 10,
        trigger_event: 'appointment_confirmed',
        is_active: true,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'rule_punctual',
        title: 'Pontualidade no Check-in',
        description: 'Realizou check-in pelo QR Code do balcão no horário',
        points_reward: 20,
        trigger_event: 'checkin_on_time',
        is_active: true,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'rule_preventive_streak',
        title: 'Fidelidade Preventiva',
        description: 'Compareceu a consultas de prevenção sem faltas',
        points_reward: 50,
        trigger_event: 'preventive_streak',
        is_active: true,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchRewardsCatalogFromSupabase(clinicId?: number): Promise<RewardCatalogItem[]> {
  try {
    let query = supabase.from('rewards_catalog').select('*').eq('is_active', true);
    if (clinicId) {
      query = query.or(`clinic_id.is.null,clinic_id.eq.${clinicId}`);
    }
    const { data, error } = await query.order('points_required', { ascending: true });
    if (error) throw error;
    return (data as RewardCatalogItem[]) || [];
  } catch (err) {
    console.warn('Supabase: usando catálogo padrão de prêmios', err);
    return [
      {
        id: 'rew_kit_higiene',
        title: 'Kit Higiene Bucal Premium Bertuol',
        description: 'Estojo com escova ultra-macia, fio dental e gel dental personalizado Bertuol.',
        points_required: 50,
        stock_available: 100,
        voucher_validity_days: 30,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rew_profilaxia',
        title: 'Profilaxia & Polimento com Flúor',
        description: 'Sessão cortesia de profilaxia preventiva para manter seu sorriso saudável.',
        points_required: 120,
        stock_available: 30,
        voucher_validity_days: 45,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rew_escova_eletrica',
        title: 'Escova Dental Elétrica Sônica',
        description: 'Escova elétrica de alta performance recomendada pela equipe clínica.',
        points_required: 250,
        stock_available: 15,
        voucher_validity_days: 60,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchPatientPointsFromSupabase(phone: string): Promise<PatientPoint[]> {
  const cleanPhone = phone.replace(/\D/g, '');
  try {
    const { data, error } = await supabase
      .from('patient_points')
      .select('*')
      .ilike('patient_phone', `%${cleanPhone.slice(-8)}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as PatientPoint[]) || [];
  } catch (err) {
    console.warn('Erro ao buscar pontos do paciente no Supabase:', err);
    return [];
  }
}

export async function addPatientPointsToSupabase(
  point: Omit<PatientPoint, 'id' | 'created_at'>
): Promise<PatientPoint | null> {
  try {
    const { data, error } = await supabase
      .from('patient_points')
      .insert([
        {
          ...point,
          patient_phone: point.patient_phone.replace(/\D/g, ''),
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data as PatientPoint;
  } catch (err) {
    console.warn('Erro ao inserir pontos no Supabase:', err);
    return null;
  }
}

export async function createReceptionCheckinInSupabase(
  checkin: Omit<ReceptionCheckin, 'id' | 'created_at'>
): Promise<ReceptionCheckin | null> {
  try {
    const { data, error } = await supabase
      .from('reception_checkins')
      .insert([
        {
          ...checkin,
          patient_phone: checkin.patient_phone.replace(/\D/g, ''),
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data as ReceptionCheckin;
  } catch (err) {
    console.warn('Erro ao registrar check-in no Supabase:', err);
    return null;
  }
}

export async function fetchRecentReceptionCheckinsFromSupabase(
  clinicId?: number,
  dentistId?: number
): Promise<ReceptionCheckin[]> {
  try {
    let query = supabase.from('reception_checkins').select('*').order('created_at', { ascending: false }).limit(20);
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
    if (dentistId) {
      query = query.eq('dentist_id', dentistId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as ReceptionCheckin[]) || [];
  } catch (err) {
    console.warn('Erro ao buscar check-ins recentes:', err);
    return [];
  }
}

export async function fetchPatientVouchersFromSupabase(phone: string): Promise<RewardRedemption[]> {
  const cleanPhone = phone.replace(/\D/g, '');
  try {
    const { data, error } = await supabase
      .from('reward_redemptions')
      .select('*, reward:rewards_catalog(*)')
      .ilike('patient_phone', `%${cleanPhone.slice(-8)}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as RewardRedemption[]) || [];
  } catch (err) {
    console.warn('Erro ao buscar vouchers do paciente:', err);
    return [];
  }
}

export async function claimVoucherInSupabase(
  secretCode: string,
  claimedByUserId?: string,
  clinicId?: number
): Promise<{ success: boolean; message: string; voucher?: RewardRedemption }> {
  try {
    const codeClean = secretCode.trim().toUpperCase();
    const { data: voucher, error: findError } = await supabase
      .from('reward_redemptions')
      .select('*, reward:rewards_catalog(*)')
      .eq('secret_code', codeClean)
      .single();

    if (findError || !voucher) {
      return { success: false, message: 'Código de voucher não encontrado ou inválido.' };
    }

    if (voucher.status === 'claimed') {
      return {
        success: false,
        message: `Este voucher já foi retirado anteriormente em ${new Date(voucher.claimed_at).toLocaleString('pt-BR')}.`,
        voucher,
      };
    }

    if (new Date(voucher.expires_at).getTime() < Date.now()) {
      return {
        success: false,
        message: 'Este voucher expirou.',
        voucher,
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: claimedByUserId || null,
        claimed_clinic_id: clinicId || null,
      })
      .eq('id', voucher.id)
      .select('*, reward:rewards_catalog(*)')
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      message: `Brinde "${updated.reward?.title || 'Prêmio'}" entregue com sucesso para ${updated.patient_name}!`,
      voucher: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Erro ao processar baixa do voucher no banco.',
    };
  }
}
