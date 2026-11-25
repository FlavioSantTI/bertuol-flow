import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  BackfillEstimateRecord,
  BackfillExportMetadata,
  YMD_REGEX,
  buildBackfillDateWindows,
  buildEstimateProcedureSummary,
  buildEstimatesBackfillCSV,
  buildEstimatesBackfillJSON,
  diffDaysInclusiveYMD,
  extractEstimateIdFromSource,
  formatDateInSaoPauloYMD,
  formatYMDBR,
  getDefaultBackfillRange,
  normalizeNameKey,
} from '../src/utils/crmEstimatesBackfill';
import { CRMEstimateProcedure } from '../src/types/crm';

dotenv.config({ override: true });

interface ClinicConfig {
  id: number;
  shortName: string;
  clinicorpBusinessId: number;
  user: string;
  key: string;
}

interface ParsedArgs {
  days: number;
  from?: string;
  to?: string;
  chunkDays: number;
  clinic: 'all' | number;
  dryRun: boolean;
  outDir: string;
  delayMs: number;
}

function parseCLIArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    days: 365,
    chunkDays: 15,
    clinic: 'all',
    dryRun: false,
    outDir: 'exports',
    delayMs: 350,
  };

  for (const token of argv) {
    if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token.startsWith('--days=')) {
      const n = Number(token.split('=')[1]);
      if (Number.isFinite(n) && n >= 1) args.days = Math.min(366, Math.floor(n));
    } else if (token.startsWith('--from=')) {
      const val = token.split('=')[1]?.trim();
      if (val && YMD_REGEX.test(val)) args.from = val;
    } else if (token.startsWith('--to=')) {
      const val = token.split('=')[1]?.trim();
      if (val && YMD_REGEX.test(val)) args.to = val;
    } else if (token.startsWith('--chunk-days=')) {
      const n = Number(token.split('=')[1]);
      if (Number.isFinite(n) && n >= 1) args.chunkDays = Math.max(1, Math.min(31, Math.floor(n)));
    } else if (token.startsWith('--clinic=')) {
      const val = token.split('=')[1]?.trim().toLowerCase();
      if (val && val !== 'all') {
        const n = Number(val);
        if (Number.isFinite(n) && n > 0) args.clinic = Math.floor(n);
      }
    } else if (token.startsWith('--out-dir=')) {
      const val = token.split('=')[1]?.trim();
      if (val) args.outDir = val;
    } else if (token.startsWith('--delay-ms=')) {
      const n = Number(token.split('=')[1]);
      if (Number.isFinite(n) && n >= 0) args.delayMs = Math.min(5000, Math.floor(n));
    } else if (token === '--help' || token === '-h') {
      console.log(`
Uso: npm run crm:backfill-estimates -- [opções]

Opções:
  --days=365          Quantidade de dias anteriores (padrão: 365, máx: 366)
  --from=YYYY-MM-DD   Data inicial explícita (substitui --days)
  --to=YYYY-MM-DD     Data final explícita (padrão: hoje em America/Sao_Paulo)
  --chunk-days=15     Tamanho de cada janela de consulta na API (1..31, padrão: 15)
  --clinic=all|1|2    Filtrar unidade (all, 1 = Palmas, 2 = Paraíso)
  --dry-run           Simula a carga sem gravar no Supabase (gera CSV e JSON)
  --out-dir=exports   Pasta de saída dentro do projeto (padrão: exports)
  --delay-ms=350      Pausa entre janelas em ms (padrão: 350)
`);
      process.exit(0);
    }
  }

  return args;
}

function getClinicorpBaseUrl(): string {
  let url = process.env.CLINICORP_API_URL || 'https://api.clinicorp.com/rest/v1';
  if (url.includes('http')) {
    url = url.substring(url.indexOf('http'));
  }
  return url.trim() || 'https://api.clinicorp.com/rest/v1';
}

function resolveClinicContexts(targetClinic: 'all' | number): ClinicConfig[] {
  const defaultUser = (process.env.CLINICORP_USER || 'qsparaisoto').trim();
  const defaultKey = (process.env.CLINICORP_KEY || '').trim();

  const palmasKeyRaw = (process.env.CLINICORP_KEY_PALMAS || '').trim();
  const palmasHasOwnKey = Boolean(palmasKeyRaw) && !palmasKeyRaw.startsWith('f77112ec-');

  const allClinics: ClinicConfig[] = [
    {
      id: 1,
      shortName: 'Palmas (Matriz)',
      clinicorpBusinessId: 5053762760081408,
      user: palmasHasOwnKey ? (process.env.CLINICORP_USER_PALMAS || 'qspalmasto').trim() : defaultUser,
      key: palmasHasOwnKey ? palmasKeyRaw : defaultKey,
    },
    {
      id: 2,
      shortName: 'Paraíso do Tocantins',
      clinicorpBusinessId: 5053762760081409,
      user: defaultUser,
      key: defaultKey,
    },
  ];

  return allClinics.filter((c) => {
    if (targetClinic !== 'all' && c.id !== targetClinic) return false;
    return Boolean(c.user && c.key);
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchClinicorpWindowWithRetry(
  baseUrl: string,
  user: string,
  key: string,
  fromDate: string,
  toDate: string
): Promise<{ ok: boolean; list: any[]; status: number; errorText?: string }> {
  const authHeader = 'Basic ' + Buffer.from(`${user}:${key}`).toString('base64');

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const qs = new URLSearchParams({ from: fromDate, to: toDate });
      let res = await fetch(`${baseUrl}/estimates/list?${qs.toString()}`, {
        method: 'GET',
        headers: { Authorization: authHeader, Accept: 'application/json' },
      });

      if (res.status === 400) {
        const retryQs = new URLSearchParams({
          subscriber_id: user,
          from: fromDate,
          to: toDate,
        });
        res = await fetch(`${baseUrl}/estimates/list?${retryQs.toString()}`, {
          method: 'GET',
          headers: { Authorization: authHeader, Accept: 'application/json' },
        });
      }

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];
        return { ok: true, list, status: res.status };
      }

      const errTxt = (await res.text().catch(() => '')).slice(0, 140);
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(attempt * 900);
        continue;
      }
      return { ok: false, list: [], status: res.status, errorText: errTxt };
    } catch (err: any) {
      if (attempt < 3) {
        await sleep(attempt * 900);
        continue;
      }
      return { ok: false, list: [], status: 0, errorText: err?.message || 'Erro de conexão' };
    }
  }

  return { ok: false, list: [], status: 0, errorText: 'Tentativas esgotadas' };
}

async function loadExistingEstimateKeys(supabase: SupabaseClient<any>) {
  const existingEstimateIds = new Set<number>();
  const existingCompositeKeys = new Set<string>();

  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('crm_leads_recall')
      .select('id, patient_id, data_ultimo_agendamento, pipeline_id, source')
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Falha ao consultar crm_leads_recall no Supabase: ${error.message}`);
    }
    const rows = data || [];
    for (const row of rows as any[]) {
      const estId = extractEstimateIdFromSource(row.source);
      if (estId) existingEstimateIds.add(estId);
      const pid = Number(row.patient_id || 0);
      const dt = String(row.data_ultimo_agendamento || '').split('T')[0];
      if ((row.pipeline_id === 'budgets' || !row.pipeline_id) && pid > 0 && dt) {
        existingCompositeKeys.add(`${pid}::${dt}`);
      }
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return { existingEstimateIds, existingCompositeKeys };
}

async function loadPatientPhoneLookup(supabase: SupabaseClient<any>) {
  const byExternalId = new Map<string, string>();
  const byName = new Map<string, string>();

  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('patients')
      .select('external_id, name, mobile_phone, landline')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.warn(`Aviso: não foi possível carregar telefones de patients (${error.message}).`);
      break;
    }

    const rows = data || [];
    for (const p of rows as any[]) {
      const phone = String(p.mobile_phone || p.landline || '').trim();
      if (!phone) continue;
      if (p.external_id) {
        byExternalId.set(String(p.external_id).trim(), phone);
      }
      const normName = normalizeNameKey(p.name);
      if (normName && !byName.has(normName)) {
        byName.set(normName, phone);
      }
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return { byExternalId, byName };
}

function buildSupabaseFullRow(rec: BackfillEstimateRecord, nowIso: string) {
  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(`${rec.estimateDate}T12:00:00`).getTime()) / 86400000)
  );
  const firstName = rec.patientName.split(' ')[0] || rec.patientName;
  const noteText = `Orçamento #${rec.estimateId} importado via carga histórica (${rec.procedures.length} procedimento(s) ativos, total R$ ${rec.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`;

  const baseRow = {
    patient_id: rec.patientId || rec.estimateId,
    patient_name: rec.patientName,
    primeiro_nome: firstName,
    mobile_phone: rec.patientPhone || '',
    data_ultimo_agendamento: rec.estimateDate,
    ultimo_procedimento: rec.procedureSummary,
    dias_desde_ultimo: daysSince,
    tipo_mensagem: 'B',
    mensagem_whatsapp: null,
    stage: 'new',
    priority: rec.amount >= 2000 ? 'high' : 'medium',
    clinic_id: rec.clinicId || 1,
    dentist_name: rec.dentistName || 'Corpo Clínico Bertuol',
    estimated_value: rec.amount,
    points_bonus: 100,
    notes: `${rec.procedures.length} procedimento(s) em aberto no Clinicorp.`,
    last_contact_date: null,
    updated_at: nowIso,
  };

  return {
    baseRow,
    fullRow: {
      ...baseRow,
      pipeline_id: 'budgets',
      type: 'treatment_pending',
      labels: [],
      notes_history: [
        {
          id: `note-est-${rec.estimateId}`,
          text: noteText,
          author: 'Clinicorp Carga Histórica',
          createdAt: nowIso,
        },
      ],
      custom_fields: [],
      assigned_user: null,
      contact_attempts: 0,
      next_contact_date: null,
      lost_reason: null,
      scheduled_appointment_id: null,
      scheduled_date: null,
      scheduled_time: null,
      source: `Clinicorp Orçamento #${rec.estimateId}`,
    },
  };
}

async function main() {
  const args = parseCLIArgs(process.argv.slice(2));

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://sswbkfrpxboxmjvunhzt.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseKey) {
    console.error('Erro: SUPABASE_SECRET_KEY / VITE_SUPABASE_ANON_KEY não encontrada no .env.');
    process.exit(1);
  }

  const clinicConfigs = resolveClinicContexts(args.clinic);
  if (clinicConfigs.length === 0) {
    console.error('Erro: Credenciais do Clinicorp (CLINICORP_KEY) não configuradas no .env.');
    process.exit(1);
  }

  const defaultRange = getDefaultBackfillRange(args.days);
  const fromDate = args.from || defaultRange.fromDate;
  const toDate = args.to || defaultRange.toDate;

  const spanDays = diffDaysInclusiveYMD(fromDate, toDate);
  if (spanDays <= 0 || spanDays > 366) {
    console.error(`Erro: intervalo inválido (${fromDate} até ${toDate}, ${spanDays} dias). Máximo permitido: 366 dias.`);
    process.exit(1);
  }

  // Confine output directory strictly inside project root
  const projectRoot = path.resolve(process.cwd());
  const resolvedOutDir = path.resolve(projectRoot, args.outDir);
  if (
    resolvedOutDir !== projectRoot &&
    !resolvedOutDir.startsWith(projectRoot + path.sep)
  ) {
    console.error('Erro: --out-dir deve apontar para uma subpasta dentro do projeto.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const baseUrl = getClinicorpBaseUrl();
  const windows = buildBackfillDateWindows(fromDate, toDate, args.chunkDays);

  // Deduplicate Clinicorp auth contexts so we don't query the same subscriber twice
  const uniqueQueryContexts: ClinicConfig[] = [];
  const seenAuth = new Set<string>();
  for (const cfg of clinicConfigs) {
    const sig = `${baseUrl}::${cfg.user}::${cfg.key}`;
    if (seenAuth.has(sig)) continue;
    seenAuth.add(sig);
    uniqueQueryContexts.push(cfg);
  }

  console.log('====================================================================');
  console.log('  BERTUOL FLOW — CARGA HISTÓRICA DE ORÇAMENTOS OPEN (CLINICORP)');
  console.log('====================================================================');
  console.log(`Período: ${formatYMDBR(fromDate)} até ${formatYMDBR(toDate)} (${spanDays} dias)`);
  console.log(`Janelas: ${windows.length} bloco(s) de até ${args.chunkDays} dias`);
  console.log(`Modo:    ${args.dryRun ? 'SIMULAÇÃO (--dry-run, sem gravação no Supabase)' : 'GRAVAÇÃO NO SUPABASE (ignora existentes)'}`);
  console.log('--------------------------------------------------------------------');

  console.log('Carregando registros existentes no CRM e telefones de pacientes no Supabase...');
  const { existingEstimateIds, existingCompositeKeys } = await loadExistingEstimateKeys(supabase);
  const { byExternalId, byName } = await loadPatientPhoneLookup(supabase);
  console.log(
    `Base atual: ${existingEstimateIds.size} estimateId(s) mapeados · ${byExternalId.size} telefone(s) por ID Clinicorp.\n`
  );

  const clinicBusinessToInfo = new Map<number, { id: number; shortName: string }>([
    [5053762760081408, { id: 1, shortName: 'Palmas (Matriz)' }],
    [5053762760081409, { id: 2, shortName: 'Paraíso do Tocantins' }],
    [5053762760081410, { id: 3, shortName: 'Araguaína' }],
  ]);

  const seenEstimateIdsInRun = new Set<number>();
  const allRecords: BackfillEstimateRecord[] = [];
  const warnings: string[] = [];

  let totalFetched = 0;
  let openFound = 0;
  let added = 0;
  let skippedExisting = 0;
  let simulated = 0;
  let failedInsert = 0;
  let newValueTotal = 0;

  for (const win of windows) {
    const windowRawById = new Map<number, any>();

    for (const qCtx of uniqueQueryContexts) {
      const result = await fetchClinicorpWindowWithRetry(
        baseUrl,
        qCtx.user,
        qCtx.key,
        win.from,
        win.to
      );

      if (!result.ok) {
        const msg = `Janela ${win.index}/${win.total} (${win.from}..${win.to}) Unidade ${qCtx.shortName}: HTTP ${result.status} ${result.errorText || ''}`.trim();
        warnings.push(msg);
        continue;
      }

      for (const item of result.list) {
        const estId = Number(item?.id || 0);
        if (!estId || windowRawById.has(estId)) continue;
        windowRawById.set(estId, { ...item, _fallbackClinicId: qCtx.id, _fallbackClinicName: qCtx.shortName });
      }
    }

    totalFetched += windowRawById.size;

    const toInsert: BackfillEstimateRecord[] = [];
    let winOpen = 0;
    let winSkipped = 0;
    let winNew = 0;

    for (const item of windowRawById.values()) {
      const estId = Number(item.id);
      if (seenEstimateIdsInRun.has(estId)) continue;

      const status = String(item.Status || '').trim().toUpperCase();
      if (status !== 'OPEN') continue;

      const businessId = Number(item.BusinessId || 0);
      const clinicInfo = clinicBusinessToInfo.get(businessId) || {
        id: Number(item._fallbackClinicId || 1),
        shortName: String(item._fallbackClinicName || 'Palmas (Matriz)'),
      };

      if (args.clinic !== 'all' && clinicInfo.id !== args.clinic) continue;

      seenEstimateIdsInRun.add(estId);
      winOpen += 1;
      openFound += 1;

      const rawPatientName = String(item.PatientName || '').trim();
      const patientName =
        rawPatientName.replace(/\s*\(\d+\)\s*$/, '').trim() || rawPatientName || 'Paciente';
      const professionalName = String(item.ProfessionalName || 'Corpo Clínico Bertuol')
        .replace(/\s+/g, ' ')
        .trim();

      const rawProcedures = Array.isArray(item.ProcedureList) ? item.ProcedureList : [];
      const activeProcedures: CRMEstimateProcedure[] = rawProcedures
        .filter((p: any) => p && p.Deleted !== 'X' && p.NotApproved !== 'X')
        .map((p: any, idx: number) => ({
          id: String(p.id || p.PriceId || `${estId}_${idx}`),
          description: String(p.OperationDescription || 'Procedimento Odontológico')
            .replace(/\s+/g, ' ')
            .trim(),
          tooth: String(p.Tooth || '').trim() || undefined,
          dentistName:
            String(p.DentistName || professionalName || '').replace(/\s+/g, ' ').trim() || undefined,
          amount: Number(p.FinalAmount ?? p.Amount ?? 0),
          statusDescription: String(p.StatusDescription || '').trim() || undefined,
        }));

      const proceduresSum = activeProcedures.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const amount = Number(item.Amount) > 0 ? Number(item.Amount) : proceduresSum;

      const isoRaw = String(item.Date || item.CreateDate || '').trim();
      const estimateDate = isoRaw ? isoRaw.split('T')[0] : win.to;
      const createDate = String(item.CreateDate || isoRaw || '').split('T')[0] || estimateDate;
      const patientId = Number(item.PatientId || 0);

      let patientPhone = String(item.PatientMobilePhone || '').trim();
      let phoneEnriched = false;
      if (!patientPhone) {
        const fromId = patientId > 0 ? byExternalId.get(String(patientId)) : undefined;
        const fromName = byName.get(normalizeNameKey(patientName));
        if (fromId || fromName) {
          patientPhone = fromId || fromName || '';
          phoneEnriched = true;
        }
      }

      const compositeKey = patientId > 0 ? `${patientId}::${estimateDate}` : '';
      const alreadyExists =
        existingEstimateIds.has(estId) ||
        (compositeKey !== '' && existingCompositeKeys.has(compositeKey));

      const rec: BackfillEstimateRecord = {
        estimateId: estId,
        estimateDate,
        createDate,
        status: 'OPEN',
        businessId,
        clinicId: clinicInfo.id,
        clinicName: clinicInfo.shortName,
        patientId,
        patientName,
        patientPhone,
        phoneEnrichedFromSupabase: phoneEnriched,
        dentistName: professionalName,
        amount,
        procedures: activeProcedures,
        procedureSummary: buildEstimateProcedureSummary(activeProcedures),
        action: alreadyExists ? 'IGNORADO_EXISTENTE' : args.dryRun ? 'SIMULADO' : 'GRAVADO',
      };

      if (alreadyExists) {
        winSkipped += 1;
        skippedExisting += 1;
        allRecords.push(rec);
      } else {
        winNew += 1;
        newValueTotal += amount;
        existingEstimateIds.add(estId);
        if (compositeKey) existingCompositeKeys.add(compositeKey);
        if (args.dryRun) {
          simulated += 1;
          allRecords.push(rec);
        } else {
          toInsert.push(rec);
        }
      }
    }

    // Persist new records in controlled batches of 25
    if (!args.dryRun && toInsert.length > 0) {
      const nowIso = new Date().toISOString();
      const batchSize = 25;

      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const mapped = batch.map((r) => buildSupabaseFullRow(r, nowIso));

        const { error: fullErr } = await supabase
          .from('crm_leads_recall')
          .insert(mapped.map((m) => m.fullRow));

        if (!fullErr) {
          added += batch.length;
          allRecords.push(...batch);
        } else {
          // Fallback row-by-row to base schema if an extended column fails
          for (let j = 0; j < batch.length; j++) {
            const rec = batch[j];
            const { error: rowFullErr } = await supabase
              .from('crm_leads_recall')
              .insert(mapped[j].fullRow);
            if (!rowFullErr) {
              added += 1;
              allRecords.push(rec);
              continue;
            }
            const { error: baseErr } = await supabase
              .from('crm_leads_recall')
              .insert(mapped[j].baseRow);
            if (!baseErr) {
              added += 1;
              allRecords.push(rec);
            } else {
              failedInsert += 1;
              rec.action = 'ERRO_GRAVACAO';
              rec.errorMessage = baseErr.message;
              allRecords.push(rec);
            }
          }
        }
      }
    }

    const idxStr = String(win.index).padStart(2, '0');
    const totStr = String(win.total).padStart(2, '0');
    console.log(
      `[${idxStr}/${totStr}] ${win.from}..${win.to} -> ${winOpen} OPEN | ${winNew} ${
        args.dryRun ? 'simulado(s)' : 'novo(s)'
      } | ${winSkipped} ignorado(s)`
    );

    if (win.index < win.total && args.delayMs > 0) {
      await sleep(args.delayMs);
    }
  }

  // Sort final records newest first, then highest amount
  allRecords.sort((a, b) => {
    if (b.estimateDate !== a.estimateDate) return b.estimateDate.localeCompare(a.estimateDate);
    return b.amount - a.amount;
  });

  const clinicScopeLabel =
    args.clinic === 'all'
      ? 'Todas as Unidades (Palmas + Paraíso)'
      : args.clinic === 1
      ? 'Palmas (Matriz)'
      : args.clinic === 2
      ? 'Paraíso do Tocantins'
      : `Unidade ${args.clinic}`;

  const metadata: BackfillExportMetadata = {
    generatedAt: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    fromDate,
    toDate,
    clinicScopeLabel,
    dryRun: args.dryRun,
    chunkDays: args.chunkDays,
    totalWindows: windows.length,
    completedWindows: windows.length,
    totals: {
      totalFetched,
      openFound,
      added,
      skippedExisting,
      simulated,
      failedInsert,
      newValueTotal,
    },
    warnings,
  };

  fs.mkdirSync(resolvedOutDir, { recursive: true });
  const stamp = formatDateInSaoPauloYMD(new Date());
  const suffix = args.dryRun ? 'simulacao' : 'importado';
  const baseFilename = `orcamentos-open-1ano-${suffix}-${stamp}`;

  const csvPath = path.join(resolvedOutDir, `${baseFilename}.csv`);
  const jsonPath = path.join(resolvedOutDir, `${baseFilename}.json`);

  fs.writeFileSync(csvPath, buildEstimatesBackfillCSV(allRecords, metadata), 'utf8');
  fs.writeFileSync(jsonPath, buildEstimatesBackfillJSON(allRecords, metadata), 'utf8');

  console.log('\n====================================================================');
  console.log('  RESUMO FINAL DA CARGA HISTÓRICA');
  console.log('====================================================================');
  console.log(`Total retornado pelo Clinicorp: ${totalFetched}`);
  console.log(`Orçamentos OPEN encontrados:    ${openFound}`);
  console.log(`Novos gravados no Supabase:     ${added}`);
  console.log(`Simulados (dry-run):            ${simulated}`);
  console.log(`Ignorados (já existentes):      ${skippedExisting}`);
  console.log(`Falhas de gravação:             ${failedInsert}`);
  console.log(
    `Valor total novo (OPEN):        R$ ${newValueTotal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    })}`
  );
  if (warnings.length > 0) {
    console.log(`Avisos (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
  console.log(`\nCSV gerado:  ${csvPath}`);
  console.log(`JSON gerado: ${jsonPath}`);
  console.log('====================================================================\n');
}

main().catch((err) => {
  console.error('Erro fatal na carga histórica de orçamentos:', err?.message || err);
  process.exit(1);
});
