import { createClient } from '@supabase/supabase-js';

// New Mature Clinic Database (DB_Bertuol)
const DEFAULT_SUPABASE_URL = 'https://sswbkfrpxboxmjvunhzt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2JrZnJweGJveG1qdnVuaHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4Nzc5OTcsImV4cCI6MjA5MDQ1Mzk5N30.-z9guq5XL6274zDsgMGWvXQ2XKHH-ZvwsN70sLjnfNA';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

function initSupabaseClient() {
  try {
    const url = SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key = SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    return createClient(url, key);
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
}

export const supabase = initSupabaseClient();

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
  nickname?: string | null;
  email?: string | null;
  document_id?: string | null;
  birth_date?: string | null;
  age?: number | null;
  mobile_phone?: string | null;
  landline?: string | null;
  city?: string | null;
  state?: string | null;
  clinical_record_number?: string | null;
  insurance_plan_name?: string | null;
  is_active: boolean;
  is_deleted?: boolean | null;
  notes?: string | null;
  app_access_status?: 'active' | 'pending_activation' | 'blocked' | string | null;
  activation_token?: string | null;
  activation_token_expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

const LOCAL_PATIENT_ACCOUNTS_KEY = 'bertuol_patient_accounts_v1';

function getLocalPatientAccountOverrides(): Record<string, Partial<SupabasePatient>> {
  try {
    const raw = localStorage.getItem(LOCAL_PATIENT_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPatientAccountOverride(id: string, patch: Partial<SupabasePatient>) {
  try {
    const current = getLocalPatientAccountOverrides();
    current[id] = { ...(current[id] || {}), ...patch, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_PATIENT_ACCOUNTS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Falha ao salvar cache local de conta de paciente:', e);
  }
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
  const localOverrides = getLocalPatientAccountOverrides();
  try {
    const PAGE_SIZE = 1000;
    const allRows: SupabasePatient[] = [];
    let offset = 0;

    while (true) {
      let query = supabase
        .from('patients')
        .select('*')
        .order('name', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (clinicId) {
        query = query.eq('tenant_id', clinicId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Erro ao buscar lote de pacientes:', error);
        if (allRows.length > 0) break;
        return Object.values(localOverrides).filter((p): p is SupabasePatient => Boolean(p && p.id && p.name));
      }

      const batch = (data as SupabasePatient[]) || [];
      allRows.push(...batch);

      if (batch.length < PAGE_SIZE) {
        break;
      }
      offset += PAGE_SIZE;

      // Safety guard for up to 50,000 records
      if (offset >= 50000) break;
    }

    const dbList: SupabasePatient[] = allRows.map((p) => ({
      ...p,
      ...(localOverrides[p.id] || {}),
      app_access_status:
        localOverrides[p.id]?.app_access_status ||
        p.app_access_status ||
        (p.is_active === false ? 'blocked' : 'pending_activation'),
    }));

    // Include any locally created patients not yet in dbList
    const dbIds = new Set(dbList.map((p) => p.id));
    Object.values(localOverrides).forEach((localP) => {
      if (localP && localP.id && localP.name && !dbIds.has(localP.id)) {
        dbList.unshift(localP as SupabasePatient);
      }
    });

    return dbList;
  } catch (err) {
    console.warn('Falha na query de pacientes:', err);
    return Object.values(localOverrides).filter((p): p is SupabasePatient => Boolean(p && p.id && p.name));
  }
}

export async function searchPatientsByNameInSupabase(searchQuery: string): Promise<SupabasePatient[]> {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];
  const localOverrides = getLocalPatientAccountOverrides();
  try {
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    let query = supabase.from('patients').select('*').order('name', { ascending: true }).limit(250);

    for (const token of tokens) {
      query = query.ilike('name', `%${token}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as SupabasePatient[]).map((p) => ({
      ...p,
      ...(localOverrides[p.id] || {}),
      app_access_status:
        localOverrides[p.id]?.app_access_status ||
        p.app_access_status ||
        (p.is_active === false ? 'blocked' : 'pending_activation'),
    }));
  } catch {
    return [];
  }
}

export async function updatePatientInSupabase(
  patientId: string,
  updates: Partial<SupabasePatient>
): Promise<{ success: boolean; data?: SupabasePatient; error?: string }> {
  saveLocalPatientAccountOverride(patientId, updates);
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', patientId)
      .select('*')
      .single();

    if (error) {
      console.warn('Aviso ao atualizar paciente no Supabase (mantido localmente):', error.message);
      return { success: true };
    }
    return { success: true, data: data as SupabasePatient };
  } catch (err: any) {
    console.warn('Falha de rede ao atualizar paciente (salvo localmente):', err);
    return { success: true };
  }
}

export const TENANT_ID_PALMAS = 'd176a1c3-9955-4555-87d9-1da0bacb61a5';
export const TENANT_ID_PARAISO = '5d30567b-ecfc-49a7-903d-f994c6de50f1';

export function resolveClinicTenantUuid(clinicIdOrSlug?: number | string | null): string {
  if (!clinicIdOrSlug) return TENANT_ID_PALMAS;
  const s = String(clinicIdOrSlug).toLowerCase();
  if (s === TENANT_ID_PARAISO || s === '2' || s === '5053762760081409' || s.includes('paraiso')) {
    return TENANT_ID_PARAISO;
  }
  return TENANT_ID_PALMAS;
}

export async function createPatientInSupabase(
  newPatient: Omit<Partial<SupabasePatient>, 'id'> & { name: string }
): Promise<{ success: boolean; data?: SupabasePatient; error?: string }> {
  const tempId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `pat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const resolvedTenantId = resolveClinicTenantUuid(newPatient.tenant_id);

  const record: SupabasePatient = {
    id: tempId,
    tenant_id: resolvedTenantId,
    name: newPatient.name.trim(),
    email: newPatient.email || null,
    document_id: newPatient.document_id || null,
    mobile_phone: newPatient.mobile_phone || null,
    clinical_record_number: newPatient.clinical_record_number || null,
    insurance_plan_name: newPatient.insurance_plan_name || 'Particular',
    is_active: newPatient.is_active ?? true,
    notes: newPatient.notes || null,
    app_access_status: newPatient.app_access_status || 'pending_activation',
    activation_token: newPatient.activation_token || null,
    activation_token_expires_at: newPatient.activation_token_expires_at || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalPatientAccountOverride(record.id, record);

  try {
    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          tenant_id: record.tenant_id,
          name: record.name,
          email: record.email,
          document_id: record.document_id,
          mobile_phone: record.mobile_phone,
          clinical_record_number: record.clinical_record_number,
          insurance_plan_name: record.insurance_plan_name,
          is_active: record.is_active,
          notes: record.notes,
          app_access_status: record.app_access_status,
          activation_token: record.activation_token,
          activation_token_expires_at: record.activation_token_expires_at,
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.warn('Aviso ao inserir paciente no Supabase (mantido localmente):', error.message);
      return { success: true, data: record };
    }

    if (data && data.id) {
      saveLocalPatientAccountOverride(data.id, data as SupabasePatient);
    }
    return { success: true, data: (data as SupabasePatient) || record };
  } catch (err: any) {
    console.warn('Erro ao criar paciente no Supabase:', err);
    return { success: true, data: record };
  }
}

export function generatePatientActivationToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  return `BT-${randomPart}-${timePart}`;
}

export function formatPatientPortalUrl(
  patient: SupabasePatient,
  token?: string,
  customBaseUrl?: string
): string {
  const baseUrl =
    customBaseUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://bertuolflow.app-bertuol.tech');
  const params = new URLSearchParams();
  params.set('portal', 'paciente');
  if (patient.mobile_phone) {
    params.set('phone', patient.mobile_phone.replace(/\D/g, ''));
  }
  params.set('name', patient.name);
  if (token || patient.activation_token) {
    params.set('activation_token', token || patient.activation_token || '');
  }
  return `${baseUrl}/paciente.html?${params.toString()}`;
}

export function formatPatientInviteMessage(
  patient: SupabasePatient,
  options: {
    token: string;
    tempPassword?: string;
    isPasswordReset?: boolean;
    customBaseUrl?: string;
  }
): string {
  const portalUrl = formatPatientPortalUrl(patient, options.token, options.customBaseUrl);
  const firstName = patient.name.split(' ')[0] || patient.name;

  if (options.isPasswordReset) {
    return `🦷 *Olá, ${firstName}!*

Sua solicitação de *Renovação de Senha / Acesso* ao aplicativo *Clube Sorriso Bertuol* foi gerada pela nossa recepção.

📲 *Link Direto de Acesso e Redefinição:*
${portalUrl}

🔑 *Credenciais Temporárias:*
• *Telefone/Login:* ${patient.mobile_phone || 'Seu celular cadastrado'}
• *Código / Senha Provisória:* *${options.tempPassword || options.token}*

⏱️ *Validade do link:* 48 horas.
Qualquer dúvida, nossa equipe de atendimento está à disposição!`;
  }

  return `🦷 *Olá, ${firstName}! Bem-vindo(a) à Bertuol Odontologia!*

Seu acesso exclusivo ao aplicativo *Clube Sorriso Bertuol* (Consultas, Check-in Rápido e Clube de Vantagens) já está disponível!

📲 *Toque no link abaixo para ativar seu primeiro acesso:*
${portalUrl}

🔑 *Seus Dados de Ativação:*
• *Login:* ${patient.mobile_phone || patient.document_id || 'Seu celular'}
• *Senha Provisória:* *${options.tempPassword || 'Bertuol@2026'}*
• *Token de Segurança:* ${options.token}

🎁 *Dica:* Ao ativar seu acesso e confirmar suas consultas pelo app, você acumula pontos para trocar por brindes exclusivos na clínica!`;
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
