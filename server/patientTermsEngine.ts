import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Express, Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CLUBE_SORRISO_TERMS_LABEL,
  CLUBE_SORRISO_TERMS_VERSION,
  getCanonicalTermsText,
  type PatientTermsAcceptanceRecord,
} from '../src/data/clubeSorrisoTerms';

const LOCAL_TERMS_STORE_FILE = path.resolve(process.cwd(), 'patient_terms_acceptances_store.json');

interface LocalTermsStore {
  records: Record<string, PatientTermsAcceptanceRecord>;
}

let cachedTermsHash: string | null = null;

export function computeCanonicalTermsHash(): string {
  if (!cachedTermsHash) {
    cachedTermsHash = crypto
      .createHash('sha256')
      .update(getCanonicalTermsText(), 'utf8')
      .digest('hex');
  }
  return cachedTermsHash;
}

export function sanitizeDigits(raw?: string | number | null): string {
  return String(raw ?? '').replace(/\D/g, '');
}

/**
 * Generates a stable canonical key for a patient across formatted/unformatted Brazilian phone numbers.
 * Uses the last 8 digits of the phone (handles 9th digit variations between CRM/WhatsApp/input),
 * falling back to patientId when phone is unavailable.
 */
export function normalizePatientTermsKey(
  phone?: string | null,
  patientId?: string | number | null
): string {
  const digits = sanitizeDigits(phone);
  if (digits.length >= 8) {
    return `phone_${digits.slice(-8)}`;
  }
  const cleanId = String(patientId ?? '').trim();
  if (cleanId) {
    return `id_${cleanId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)}`;
  }
  return '';
}

function readLocalTermsStore(): LocalTermsStore {
  try {
    if (!fs.existsSync(LOCAL_TERMS_STORE_FILE)) {
      return { records: {} };
    }
    const raw = fs.readFileSync(LOCAL_TERMS_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.records && typeof parsed.records === 'object') {
      return { records: parsed.records };
    }
    return { records: {} };
  } catch {
    return { records: {} };
  }
}

function writeLocalTermsStore(store: LocalTermsStore): void {
  try {
    fs.writeFileSync(LOCAL_TERMS_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[PatientTerms] Falha ao gravar arquivo local de fallback de termos:', err);
  }
}

function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const message = String(error.message || '');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('Could not find the table') ||
    message.includes('does not exist')
  );
}

function mapSupabaseRowToRecord(row: any): PatientTermsAcceptanceRecord {
  return {
    id: String(row.id || ''),
    patientKey: String(row.patient_key || ''),
    patientId: row.patient_id ? String(row.patient_id) : null,
    patientName: String(row.patient_name || 'Paciente Bertuol'),
    patientPhone: String(row.patient_phone || ''),
    patientDocumentId: row.patient_document_id ? String(row.patient_document_id) : null,
    clinicId: typeof row.clinic_id === 'number' ? row.clinic_id : Number(row.clinic_id || 1),
    termsVersion: String(row.terms_version || CLUBE_SORRISO_TERMS_VERSION),
    termsHash: String(row.terms_hash || ''),
    acceptedTerms: Boolean(row.accepted_terms),
    acceptedPrivacy: Boolean(row.accepted_privacy),
    marketingOptIn: Boolean(row.marketing_opt_in),
    acceptedAt: String(row.accepted_at || row.created_at || new Date().toISOString()),
    ipAddress: row.ip_address ? String(row.ip_address) : null,
    userAgent: row.user_agent ? String(row.user_agent) : null,
    acceptanceChannel: String(row.acceptance_channel || 'patient_portal_first_access'),
  };
}

function extractClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : typeof xff === 'string' ? xff.split(',')[0] : req.ip || '';
  return String(raw || '').trim().slice(0, 64);
}

function extractUserAgent(req: Request): string {
  return String(req.headers['user-agent'] || '').trim().slice(0, 300);
}

export interface TermsLookupResult {
  accepted: boolean;
  requiredVersion: string;
  termsLabel: string;
  acceptance: PatientTermsAcceptanceRecord | null;
  storage: 'supabase' | 'local_fallback' | 'none';
  supabaseTableReady: boolean;
}

export async function getPatientTermsAcceptance(
  supabase: SupabaseClient,
  opts: { phone?: string | null; patientId?: string | number | null }
): Promise<TermsLookupResult> {
  const patientKey = normalizePatientTermsKey(opts.phone, opts.patientId);
  const digits = sanitizeDigits(opts.phone);

  if (!patientKey) {
    return {
      accepted: false,
      requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
      termsLabel: CLUBE_SORRISO_TERMS_LABEL,
      acceptance: null,
      storage: 'none',
      supabaseTableReady: true,
    };
  }

  let supabaseTableReady = true;

  // 1. Primary lookup in Supabase public.patient_terms_acceptances
  try {
    const { data, error } = await supabase
      .from('patient_terms_acceptances')
      .select('*')
      .eq('patient_key', patientKey)
      .eq('terms_version', CLUBE_SORRISO_TERMS_VERSION)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        supabaseTableReady = false;
      } else {
        console.warn('[PatientTerms] Erro ao consultar Supabase patient_terms_acceptances:', error.message);
      }
    } else if (data && data.accepted_terms === true && data.accepted_privacy === true) {
      return {
        accepted: true,
        requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
        termsLabel: CLUBE_SORRISO_TERMS_LABEL,
        acceptance: mapSupabaseRowToRecord(data),
        storage: 'supabase',
        supabaseTableReady: true,
      };
    }

    // Secondary lookup by phone suffix in case patient accepted earlier under a different key format
    if (supabaseTableReady && digits.length >= 8) {
      const last8 = digits.slice(-8);
      const { data: byPhone, error: phoneErr } = await supabase
        .from('patient_terms_acceptances')
        .select('*')
        .ilike('patient_phone', `%${last8}`)
        .eq('terms_version', CLUBE_SORRISO_TERMS_VERSION)
        .order('accepted_at', { ascending: false })
        .limit(1);

      if (!phoneErr && Array.isArray(byPhone) && byPhone.length > 0) {
        const row = byPhone[0];
        if (row.accepted_terms === true && row.accepted_privacy === true) {
          return {
            accepted: true,
            requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
            termsLabel: CLUBE_SORRISO_TERMS_LABEL,
            acceptance: mapSupabaseRowToRecord(row),
            storage: 'supabase',
            supabaseTableReady: true,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[PatientTerms] Exceção ao consultar Supabase:', err);
  }

  // 2. Fallback lookup in local persisted JSON store (auto-migrates to Supabase once table exists)
  const localStore = readLocalTermsStore();
  const storeKey = `${patientKey}::${CLUBE_SORRISO_TERMS_VERSION}`;
  const localRecord =
    localStore.records[storeKey] ||
    (digits.length >= 8
      ? Object.values(localStore.records).find(
          (r) =>
            r.termsVersion === CLUBE_SORRISO_TERMS_VERSION &&
            r.acceptedTerms === true &&
            r.acceptedPrivacy === true &&
            sanitizeDigits(r.patientPhone).endsWith(digits.slice(-8))
        )
      : undefined);

  if (localRecord && localRecord.acceptedTerms && localRecord.acceptedPrivacy) {
    // If Supabase table is now available, sync this acceptance into Supabase automatically
    if (supabaseTableReady) {
      try {
        const { error: syncErr } = await supabase
          .from('patient_terms_acceptances')
          .upsert(
            {
              patient_key: localRecord.patientKey || patientKey,
              patient_id: localRecord.patientId || null,
              patient_name: localRecord.patientName,
              patient_phone: localRecord.patientPhone,
              patient_document_id: localRecord.patientDocumentId || null,
              clinic_id: localRecord.clinicId || 1,
              terms_version: localRecord.termsVersion,
              terms_hash: localRecord.termsHash || computeCanonicalTermsHash(),
              accepted_terms: true,
              accepted_privacy: true,
              marketing_opt_in: Boolean(localRecord.marketingOptIn),
              accepted_at: localRecord.acceptedAt,
              ip_address: localRecord.ipAddress || null,
              user_agent: localRecord.userAgent || null,
              acceptance_channel: localRecord.acceptanceChannel || 'patient_portal_first_access',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'patient_key,terms_version' }
          );
        if (!syncErr) {
          return {
            accepted: true,
            requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
            termsLabel: CLUBE_SORRISO_TERMS_LABEL,
            acceptance: localRecord,
            storage: 'supabase',
            supabaseTableReady: true,
          };
        }
      } catch {
        // Ignore transient sync error; local record still guarantees continuity
      }
    }

    return {
      accepted: true,
      requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
      termsLabel: CLUBE_SORRISO_TERMS_LABEL,
      acceptance: localRecord,
      storage: 'local_fallback',
      supabaseTableReady,
    };
  }

  return {
    accepted: false,
    requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
    termsLabel: CLUBE_SORRISO_TERMS_LABEL,
    acceptance: null,
    storage: 'none',
    supabaseTableReady,
  };
}

export async function ensurePatientTermsAccepted(
  supabase: SupabaseClient,
  opts: { phone?: string | null; patientId?: string | number | null },
  res: Response
): Promise<boolean> {
  const status = await getPatientTermsAcceptance(supabase, opts);
  if (status.accepted) {
    return true;
  }

  res.status(403).json({
    success: false,
    code: 'TERMS_ACCEPTANCE_REQUIRED',
    requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
    error:
      'Para utilizar o aplicativo Clube Sorriso Bertuol, é obrigatório aceitar o Regulamento Oficial e a Política de Privacidade.',
  });
  return false;
}

export function registerPatientTermsRoutes(
  app: Express,
  supabase: SupabaseClient,
  opts?: { isAdminRequest?: (req: Request) => boolean }
): void {
  // 1. Consultar status do aceite de termos do paciente autenticado
  app.get('/api/patient/terms/status', async (req: Request, res: Response) => {
    try {
      const phone = String(req.query.phone || '').trim();
      const patientId = String(req.query.patientId || '').trim();

      if (sanitizeDigits(phone).length < 8 && !patientId) {
        return res.status(400).json({
          success: false,
          error: 'Informe o telefone ou identificador do paciente para verificar o aceite dos termos.',
        });
      }

      const result = await getPatientTermsAcceptance(supabase, { phone, patientId });
      return res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('[PatientTerms] Erro ao consultar status:', error);
      return res.status(500).json({
        success: false,
        error: 'Não foi possível verificar o status de aceite dos termos.',
      });
    }
  });

  // 2. Registrar aceite obrigatório dos Termos e Política de Privacidade (LGPD)
  app.post('/api/patient/terms/accept', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const cleanPhone = sanitizeDigits(body.phone);
      const rawPatientId = body.patientId ? String(body.patientId).trim() : '';
      const rawPatientName = String(body.patientName || '').trim().slice(0, 160);
      const acceptedTerms = body.acceptedTerms === true;
      const acceptedPrivacy = body.acceptedPrivacy === true;
      const marketingOptIn = body.marketingOptIn === true;
      const requestedVersion = String(body.termsVersion || CLUBE_SORRISO_TERMS_VERSION).trim();
      const acceptanceChannel = String(body.channel || 'patient_portal_first_access')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 64) || 'patient_portal_first_access';

      if (cleanPhone.length < 8 && !rawPatientId) {
        return res.status(400).json({
          success: false,
          error: 'Identificação do paciente inválida. Faça login novamente.',
        });
      }

      if (!acceptedTerms || !acceptedPrivacy) {
        return res.status(400).json({
          success: false,
          code: 'MANDATORY_CONSENT_REQUIRED',
          error:
            'É obrigatório aceitar integralmente o Regulamento do Clube Sorriso Bertuol e a Política de Privacidade para continuar.',
        });
      }

      if (requestedVersion !== CLUBE_SORRISO_TERMS_VERSION) {
        return res.status(409).json({
          success: false,
          code: 'TERMS_VERSION_MISMATCH',
          requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
          error: 'Uma nova versão do regulamento está vigente. Atualize a página para ler e aceitar.',
        });
      }

      // Enriquecer com dados oficiais da tabela patients no Supabase (sem misturar no prontuário clínico)
      let matchedPatient: any = null;
      try {
        if (cleanPhone.length >= 8) {
          const last8 = cleanPhone.slice(-8);
          const { data } = await supabase
            .from('patients')
            .select('id, name, mobile_phone, document_id, tenant_id, app_access_status')
            .ilike('mobile_phone', `%${last8}%`)
            .limit(1);
          if (Array.isArray(data) && data.length > 0) {
            matchedPatient = data[0];
          }
        }
        if (!matchedPatient && rawPatientId) {
          const { data } = await supabase
            .from('patients')
            .select('id, name, mobile_phone, document_id, tenant_id, app_access_status')
            .eq('id', rawPatientId)
            .maybeSingle();
          if (data) matchedPatient = data;
        }
      } catch {
        // Continua normalmente se a busca auxiliar falhar
      }

      const resolvedPhone = sanitizeDigits(matchedPatient?.mobile_phone || cleanPhone);
      const resolvedName = String(matchedPatient?.name || rawPatientName || 'Paciente Bertuol').trim();
      const resolvedPatientId = matchedPatient?.id ? String(matchedPatient.id) : rawPatientId || null;
      const resolvedDocumentId = matchedPatient?.document_id
        ? sanitizeDigits(matchedPatient.document_id)
        : null;
      const resolvedClinicId = matchedPatient?.tenant_id
        ? String(matchedPatient.tenant_id).includes('5d30567b')
          ? 2
          : 1
        : Number(body.clinicId || 1);

      const patientKey = normalizePatientTermsKey(resolvedPhone || cleanPhone, resolvedPatientId);
      const acceptedAt = new Date().toISOString();
      const termsHash = computeCanonicalTermsHash();
      const ipAddress = extractClientIp(req);
      const userAgent = extractUserAgent(req);

      let persistedRecord: PatientTermsAcceptanceRecord = {
        id: `terms_${crypto.randomUUID()}`,
        patientKey,
        patientId: resolvedPatientId,
        patientName: resolvedName,
        patientPhone: resolvedPhone || cleanPhone,
        patientDocumentId: resolvedDocumentId,
        clinicId: resolvedClinicId,
        termsVersion: CLUBE_SORRISO_TERMS_VERSION,
        termsHash,
        acceptedTerms: true,
        acceptedPrivacy: true,
        marketingOptIn,
        acceptedAt,
        ipAddress,
        userAgent,
        acceptanceChannel,
      };

      let storage: 'supabase' | 'local_fallback' = 'local_fallback';
      let supabaseTableReady = true;

      // Tenta persistência primária na tabela dedicada do Supabase
      try {
        const { data: savedRow, error: saveError } = await supabase
          .from('patient_terms_acceptances')
          .upsert(
            {
              patient_key: patientKey,
              patient_id: resolvedPatientId,
              patient_name: resolvedName,
              patient_phone: resolvedPhone || cleanPhone,
              patient_document_id: resolvedDocumentId,
              clinic_id: resolvedClinicId,
              terms_version: CLUBE_SORRISO_TERMS_VERSION,
              terms_hash: termsHash,
              accepted_terms: true,
              accepted_privacy: true,
              marketing_opt_in: marketingOptIn,
              accepted_at: acceptedAt,
              ip_address: ipAddress,
              user_agent: userAgent,
              acceptance_channel: acceptanceChannel,
              updated_at: acceptedAt,
            },
            { onConflict: 'patient_key,terms_version' }
          )
          .select('*')
          .single();

        if (saveError) {
          if (isMissingTableError(saveError)) {
            supabaseTableReady = false;
            console.warn(
              '[PatientTerms] Tabela public.patient_terms_acceptances ainda não criada no Supabase. Gravando no store local de contingência até a execução de CLUBE_SORRISO_TERMOS_SETUP.sql.'
            );
          } else {
            console.error('[PatientTerms] Erro ao gravar aceite no Supabase:', saveError.message);
          }
        } else if (savedRow) {
          persistedRecord = mapSupabaseRowToRecord(savedRow);
          storage = 'supabase';
        }
      } catch (err) {
        console.warn('[PatientTerms] Falha transitória no Supabase ao gravar aceite:', err);
      }

      // Sempre grava cópia de segurança local sincronizada (evita perda caso tabela ainda não exista)
      const localStore = readLocalTermsStore();
      localStore.records[`${patientKey}::${CLUBE_SORRISO_TERMS_VERSION}`] = persistedRecord;
      writeLocalTermsStore(localStore);

      // Atualiza status de acesso do paciente no Supabase de pendente -> ativo
      if (matchedPatient?.id && (!matchedPatient.app_access_status || matchedPatient.app_access_status === 'pending_activation')) {
        try {
          await supabase
            .from('patients')
            .update({ app_access_status: 'active', updated_at: acceptedAt })
            .eq('id', matchedPatient.id);
        } catch {
          // Não bloqueia o aceite se a atualização auxiliar falhar
        }
      }

      return res.json({
        success: true,
        accepted: true,
        requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
        termsLabel: CLUBE_SORRISO_TERMS_LABEL,
        storage,
        supabaseTableReady,
        acceptance: persistedRecord,
      });
    } catch (error: any) {
      console.error('[PatientTerms] Erro interno ao registrar aceite:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao registrar o aceite dos termos. Tente novamente.',
      });
    }
  });

  // 3. Consulta administrativa dos aceites registrados (para auditoria da equipe)
  app.get('/api/admin/patient-terms', async (req: Request, res: Response) => {
    if (opts?.isAdminRequest && !opts.isAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito à administração da clínica.',
      });
    }
    try {
      let supabaseTableReady = true;
      const byKey = new Map<string, PatientTermsAcceptanceRecord>();

      try {
        const { data, error } = await supabase
          .from('patient_terms_acceptances')
          .select('*')
          .order('accepted_at', { ascending: false })
          .limit(500);

        if (error) {
          if (isMissingTableError(error)) {
            supabaseTableReady = false;
          }
        } else if (Array.isArray(data)) {
          for (const row of data) {
            const rec = mapSupabaseRowToRecord(row);
            byKey.set(`${rec.patientKey}::${rec.termsVersion}`, rec);
          }
        }
      } catch {
        // fallback below
      }

      const localStore = readLocalTermsStore();
      for (const [k, rec] of Object.entries(localStore.records)) {
        if (!byKey.has(k)) {
          byKey.set(k, rec);
        }
      }

      const items = Array.from(byKey.values()).sort(
        (a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime()
      );

      return res.json({
        success: true,
        requiredVersion: CLUBE_SORRISO_TERMS_VERSION,
        supabaseTableReady,
        total: items.length,
        items,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar aceites de termos.',
      });
    }
  });
}
