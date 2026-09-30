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
