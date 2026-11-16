import {
  CRMLabel,
  CRMLeadOpportunity,
  CRMMessageTemplate,
  CRMNoteEntry,
  CRMPipeline,
  CRMPipelineStage,
  CRMStageSemantic,
  CRMSummaryStats,
} from '../types/crm';
import { Appointment, Clinic, Patient } from '../types/database';
import { supabase } from './supabaseService';

const LEGACY_CRM_STORAGE_KEY_V1 = 'bertuol_crm_opportunities_v1';
const LEGACY_CRM_STORAGE_KEY_V2 = 'bertuol_crm_opportunities_v2';
const CRM_OPPORTUNITIES_STORAGE_KEY = 'bertuol_crm_opportunities_v3';
const CRM_TEMPLATES_STORAGE_KEY = 'bertuol_crm_templates_v1';
const CRM_PIPELINES_STORAGE_KEY = 'bertuol_crm_pipelines_v1';
const CRM_LABELS_STORAGE_KEY = 'bertuol_crm_labels_v1';

const FICTIONAL_CRM_NAMES = new Set([
  'esther oliveira duarte',
  'nelson freiberger',
  'claudiana lima leite',
  'juscelino kubitschek oliveira',
  'zuzu scarlat test',
  'ana paula silveira',
  'carlos eduardo mendes',
  'mariana costa rocha',
  'roberto alves de oliveira',
  'fernanda lima nogueira',
]);

const FICTIONAL_CRM_IDS = new Set([
  'opp-101',
  'opp-102',
  'opp-103',
  'opp-104',
  'opp-105',
]);

export const CRM_LOST_REASONS = [
  'Sem resposta após 3 tentativas',
  'Achou o valor alto / Condição financeira',
  'Já realizou tratamento em outra clínica',
  'Mudou de cidade / Indisponibilidade de horário',
  'Desistiu / Adiou tratamento por motivo pessoal',
  'Outro motivo',
] as const;

export const DEFAULT_CRM_PIPELINES: CRMPipeline[] = [
  {
    id: 'recall_6m',
    name: 'Recall Preventivo (6+m)',
    description:
      'Pacientes há 180+ dias sem consulta importados automaticamente às 06h00. Priorizar retorno preventivo e bônus de +50 pts no Clube Sorriso.',
    defaultPointsBonus: 50,
    sortOrder: 0,
    isSystem: true,
    isActive: true,
    stages: [
      { id: 'new', title: 'Fila 180+ Dias', semanticType: 'new', color: 'blue' },
      { id: 'contacted', title: 'WhatsApp Enviado', semanticType: 'contacted', color: 'amber' },
      { id: 'scheduled', title: 'Retorno Agendado', semanticType: 'scheduled', color: 'indigo' },
      { id: 'converted', title: 'Compareceu', semanticType: 'converted', color: 'emerald' },
      { id: 'lost', title: 'Sem Retorno', semanticType: 'lost', color: 'slate' },
    ],
  },
  {
    id: 'campaigns',
    name: 'Campanhas & Captação',
    description:
      'Novos leads vindos de Instagram, Tráfego Pago, WhatsApp Receptor e Indicações do Clube Sorriso. Meta: resposta em até 15 minutos.',
    defaultPointsBonus: 50,
    sortOrder: 1,
    isSystem: false,
    isActive: true,
    stages: [
      { id: 'new', title: 'Novo Lead', semanticType: 'new', color: 'blue' },
      { id: 'contacted', title: 'Em Qualificação', semanticType: 'contacted', color: 'amber' },
      { id: 'scheduled', title: 'Avaliação Agendada', semanticType: 'scheduled', color: 'indigo' },
      { id: 'converted', title: 'Paciente Convertido', semanticType: 'converted', color: 'emerald' },
      { id: 'lost', title: 'Perdido', semanticType: 'lost', color: 'slate' },
    ],
  },
  {
    id: 'budgets',
    name: 'Orçamentos em Aberto',
    description:
      'Planos de tratamento apresentados em avaliação (Implantes, Prótese, Alinhadores, Reabilitação) pendentes de aprovação financeira.',
    defaultPointsBonus: 100,
    sortOrder: 2,
    isSystem: false,
    isActive: true,
    stages: [
      { id: 'new', title: 'Orçamento Apresentado', semanticType: 'new', color: 'blue' },
      { id: 'contacted', title: 'Em Negociação', semanticType: 'contacted', color: 'amber' },
      { id: 'scheduled', title: 'Aprovado / Agendado', semanticType: 'scheduled', color: 'indigo' },
      { id: 'converted', title: 'Tratamento Iniciado', semanticType: 'converted', color: 'emerald' },
      { id: 'lost', title: 'Recusado', semanticType: 'lost', color: 'slate' },
    ],
  },
];

export const DEFAULT_CRM_LABELS: CRMLabel[] = [
  { id: 'lbl_vip', name: 'VIP Clube Sorriso', color: 'amber' },
  { id: 'lbl_implante', name: 'Implante / Prótese', color: 'teal' },
  { id: 'lbl_orto', name: 'Ortodontia / Alinhador', color: 'indigo' },
  { id: 'lbl_exame', name: 'Aguardando Exame', color: 'rose' },
  { id: 'lbl_manha', name: 'Prefere Manhã', color: 'emerald' },
  { id: 'lbl_tarde', name: 'Prefere Tarde', color: 'slate' },
  { id: 'lbl_parcelamento', name: 'Negociando Entrada', color: 'amber' },
];

export const DEFAULT_CRM_TEMPLATES: CRMMessageTemplate[] = [
  {
    id: 'tpl-recall-6m',
    title: 'Recall Preventivo - Profilaxia (6+ meses)',
    category: 'recall',
    content:
      'Olá {nome}, tudo bem? Aqui é da Clínica Bertuol Odontologia ({clinica}). Notamos que já faz mais de 6 meses desde sua última limpeza e check-in preventivo com {doutor}. Agende esta semana e ganhe +{pontos} pontos bônus no Clube Sorriso Bertuol! Qual o melhor horário para você?',
    variables: ['nome', 'clinica', 'doutor', 'pontos'],
  },
  {
    id: 'tpl-budget-pending',
    title: 'Acompanhamento de Orçamento Aberto',
    category: 'budget',
    content:
      'Olá {nome}! Tudo bem? Passando para saber se ficou com alguma dúvida sobre o plano de tratamento proposto por {doutor} na Clínica Bertuol. Temos condições facilitadas de parcelamento e agendamento priorizado para este mês. Podemos conversar sobre as opções por aqui?',
    variables: ['nome', 'doutor', 'clinica'],
  },
  {
    id: 'tpl-whatsapp-welcome',
    title: 'Boas-Vindas Novo Lead WhatsApp',
    category: 'welcome',
    content:
      'Olá {nome}! Seja muito bem-vindo(a) à Clínica Bertuol Odontologia! É um prazer te atender. Como podemos te ajudar hoje? (Consultas, clareamento, implantes, ortodontia ou estética do sorriso).',
    variables: ['nome'],
  },
  {
    id: 'tpl-clube-points',
    title: 'Resgate de Pontos do Clube Sorriso',
    category: 'points',
    content:
      'Olá {nome}! Você sabia que possui pontos acumulados no seu Clube Sorriso Bertuol? Ao confirmar sua consulta preventiva com {doutor}, você ganha +{pontos} pontos para trocar por prêmios na clínica! Responda SIM para confirmar.',
    variables: ['nome', 'doutor', 'pontos'],
  },
  {
    id: 'tpl-post-op',
    title: 'Pós-Operatório / Cuidado Preventivo',
    category: 'post_op',
    content:
      'Olá {nome}, como você está se sentindo após seu atendimento na Clínica Bertuol com {doutor}? Caso tenha qualquer dúvida ou necessite de suporte, estamos 100% à disposição por este canal!',
    variables: ['nome', 'doutor'],
  },
];

export const INITIAL_REAL_RECALL_LEADS: CRMLeadOpportunity[] = [];

export class CRMService {
  static isFictionalLead(opp: Partial<CRMLeadOpportunity>): boolean {
    const nameLower = String(opp.patientName || '').trim().toLowerCase();
    const idStr = String(opp.id || '');
    if (FICTIONAL_CRM_NAMES.has(nameLower)) return true;
    if (FICTIONAL_CRM_IDS.has(idStr)) return true;
    if (/^opp-auto-10[1-5]-/.test(idStr)) return true;
    return false;
  }

  static sanitizeOpportunities(list: CRMLeadOpportunity[]): CRMLeadOpportunity[] {
    if (!Array.isArray(list)) return [];
    return list
      .filter((o) => o && o.patientName && !this.isFictionalLead(o))
      .map((o) => ({
        ...o,
        pipelineId: o.pipelineId || this.inferPipelineId(o.type),
        labels: Array.isArray(o.labels) ? o.labels : [],
        notesHistory: Array.isArray(o.notesHistory) ? o.notesHistory : [],
        contactAttempts: typeof o.contactAttempts === 'number' ? o.contactAttempts : 0,
      }));
  }

  static inferPipelineId(type?: CRMLeadOpportunity['type']): string {
    if (type === 'treatment_pending') return 'budgets';
    if (type === 'whatsapp_lead' || type === 'indication' || type === 'other') return 'campaigns';
    return 'recall_6m';
  }

  static resolveStageSemantic(pipeline: CRMPipeline | undefined, stageId: string): CRMStageSemantic {
    const found = pipeline?.stages.find((s) => s.id === stageId);
    if (found) return found.semanticType;
    if (stageId === 'new' || stageId === 'contacted' || stageId === 'scheduled' || stageId === 'converted' || stageId === 'lost') {
      return stageId;
    }
    return 'new';
  }

  static getStageIdBySemantic(pipeline: CRMPipeline | undefined, semantic: CRMStageSemantic): string {
    const found = pipeline?.stages.find((s) => s.semanticType === semantic);
    return found ? found.id : semantic;
  }

  static isFollowUpDue(opp: CRMLeadOpportunity, pipeline?: CRMPipeline): boolean {
    if (!opp.nextContactDate) return false;
    const semantic = this.resolveStageSemantic(pipeline, opp.stage);
    if (semantic === 'converted' || semantic === 'lost') return false;
    const todayIso = new Date().toISOString().split('T')[0];
    return opp.nextContactDate <= todayIso;
  }

  static isFollowUpOverdue(opp: CRMLeadOpportunity, pipeline?: CRMPipeline): boolean {
    if (!opp.nextContactDate) return false;
    const semantic = this.resolveStageSemantic(pipeline, opp.stage);
    if (semantic === 'converted' || semantic === 'lost') return false;
    const todayIso = new Date().toISOString().split('T')[0];
    return opp.nextContactDate < todayIso;
  }

  static getSLADaysStale(opp: CRMLeadOpportunity, pipeline?: CRMPipeline): number {
    const semantic = this.resolveStageSemantic(pipeline, opp.stage);
    if (semantic !== 'contacted') return 0;
    const refDateStr = opp.lastContactDate || opp.updatedAt || opp.createdAt;
    if (!refDateStr) return 0;
    const refTime = new Date(refDateStr).getTime();
    if (isNaN(refTime)) return 0;
    const diffDays = Math.floor((Date.now() - refTime) / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  static isSLAAlert(opp: CRMLeadOpportunity, pipeline?: CRMPipeline): boolean {
    return this.getSLADaysStale(opp, pipeline) >= 2;
  }

  // ==========================================
  // PIPELINES CRUD (Supabase + Local Fallback)
  // ==========================================

  static getPipelines(): CRMPipeline[] {
    try {
      const raw = localStorage.getItem(CRM_PIPELINES_STORAGE_KEY);
      if (!raw) {
        this.savePipelinesLocal(DEFAULT_CRM_PIPELINES);
        return DEFAULT_CRM_PIPELINES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      }
      return DEFAULT_CRM_PIPELINES;
    } catch {
      return DEFAULT_CRM_PIPELINES;
    }
  }

  static savePipelinesLocal(pipelines: CRMPipeline[]): void {
    const sorted = [...pipelines].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    localStorage.setItem(CRM_PIPELINES_STORAGE_KEY, JSON.stringify(sorted));
  }

  static async fetchPipelinesFromSupabase(): Promise<CRMPipeline[]> {
    try {
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        return this.getPipelines();
      }

      if (Array.isArray(data) && data.length > 0) {
        const mapped: CRMPipeline[] = data.map((row: any, idx: number) => ({
          id: String(row.id),
          name: String(row.name || 'Funil Comercial'),
          description: row.description || undefined,
          defaultPointsBonus: row.default_points_bonus != null ? Number(row.default_points_bonus) : 50,
          stages: Array.isArray(row.stages) && row.stages.length > 0 ? row.stages : DEFAULT_CRM_PIPELINES[0].stages,
          sortOrder: row.sort_order != null ? Number(row.sort_order) : idx,
          isSystem: Boolean(row.is_system) || row.id === 'recall_6m',
          isActive: row.is_active !== false,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        this.savePipelinesLocal(mapped);
        return mapped;
      }

      // Seed defaults if table exists but is empty
      const seedRows = DEFAULT_CRM_PIPELINES.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || null,
        default_points_bonus: p.defaultPointsBonus ?? 50,
        stages: p.stages,
        sort_order: p.sortOrder,
        is_system: Boolean(p.isSystem),
        is_active: true,
      }));
      await supabase.from('crm_pipelines').upsert(seedRows, { onConflict: 'id' });
      this.savePipelinesLocal(DEFAULT_CRM_PIPELINES);
      return DEFAULT_CRM_PIPELINES;
    } catch {
      return this.getPipelines();
    }
  }

  static savePipeline(pipeline: CRMPipeline): CRMPipeline[] {
    const current = this.getPipelines();
    const slug =
      pipeline.id ||
      pipeline.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') ||
      `funil_${Date.now()}`;

    const normalized: CRMPipeline = {
      ...pipeline,
      id: slug,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    const idx = current.findIndex((p) => p.id === slug);
    const updatedList = [...current];
    if (idx >= 0) {
      updatedList[idx] = normalized;
    } else {
      normalized.sortOrder = updatedList.length;
      normalized.createdAt = new Date().toISOString();
      updatedList.push(normalized);
    }

    this.savePipelinesLocal(updatedList);

    supabase
      .from('crm_pipelines')
      .upsert(
        {
          id: normalized.id,
          name: normalized.name,
          description: normalized.description || null,
          default_points_bonus: normalized.defaultPointsBonus ?? 50,
          stages: normalized.stages,
          sort_order: normalized.sortOrder,
          is_system: Boolean(normalized.isSystem),
          is_active: true,
          updated_at: normalized.updatedAt,
        },
        { onConflict: 'id' }
      )
      .then(() => {});

    return updatedList;
  }

  static deletePipeline(pipelineId: string): { pipelines: CRMPipeline[]; error?: string } {
    const current = this.getPipelines();
    const target = current.find((p) => p.id === pipelineId);
    if (!target) return { pipelines: current };
    if (target.isSystem || target.id === 'recall_6m') {
      return {
        pipelines: current,
        error: 'O funil Recall Preventivo (6+m) é vinculado ao n8n e não pode ser excluído (mas você pode editar suas etapas).',
      };
    }

    const filtered = current
      .filter((p) => p.id !== pipelineId)
      .map((p, idx) => ({ ...p, sortOrder: idx }));
    this.savePipelinesLocal(filtered);

    supabase.from('crm_pipelines').update({ is_active: false }).eq('id', pipelineId).then(() => {});

    return { pipelines: filtered };
  }

  // ==========================================
  // LABELS / TAGS CRUD
  // ==========================================

  static getLabels(): CRMLabel[] {
    try {
      const raw = localStorage.getItem(CRM_LABELS_STORAGE_KEY);
      if (!raw) {
        this.saveLabelsLocal(DEFAULT_CRM_LABELS);
        return DEFAULT_CRM_LABELS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CRM_LABELS;
    } catch {
      return DEFAULT_CRM_LABELS;
    }
  }

  static saveLabelsLocal(labels: CRMLabel[]): void {
    localStorage.setItem(CRM_LABELS_STORAGE_KEY, JSON.stringify(labels));
  }

  static async fetchLabelsFromSupabase(): Promise<CRMLabel[]> {
    try {
      const { data, error } = await supabase.from('crm_labels').select('*').order('name', { ascending: true });
      if (error || !Array.isArray(data) || data.length === 0) {
        return this.getLabels();
      }
      const mapped: CRMLabel[] = data.map((r: any) => ({
        id: String(r.id),
        name: String(r.name),
        color: (r.color || 'teal') as CRMLabel['color'],
      }));
      this.saveLabelsLocal(mapped);
      return mapped;
    } catch {
      return this.getLabels();
    }
  }

  static addLabel(name: string, color: CRMLabel['color'] = 'teal'): CRMLabel[] {
    const clean = name.trim();
    if (!clean) return this.getLabels();
    const current = this.getLabels();
    const id = `lbl_${Date.now()}`;
    const newLabel: CRMLabel = { id, name: clean, color };
    const updated = [...current, newLabel];
    this.saveLabelsLocal(updated);

    supabase.from('crm_labels').upsert({ id, name: clean, color }, { onConflict: 'id' }).then(() => {});
    return updated;
  }

  static deleteLabel(id: string): CRMLabel[] {
    const updated = this.getLabels().filter((l) => l.id !== id);
    this.saveLabelsLocal(updated);
    supabase.from('crm_labels').delete().eq('id', id).then(() => {});
    return updated;
  }

  // ==========================================
  // OPPORTUNITIES (Supabase + Resilient Fallback)
  // ==========================================

  static mapRowToOpportunity(row: any, cachedById?: Map<string, CRMLeadOpportunity>): CRMLeadOpportunity {
    const patientId = row.patient_id != null ? Number(row.patient_id) : undefined;
    const lastVisitDate = row.data_ultimo_agendamento
      ? String(row.data_ultimo_agendamento).split('T')[0]
      : undefined;
    const cycleKey = row.id ? `opp-row-${row.id}` : `opp-supa-${patientId || Date.now()}-${lastVisitDate || 'ciclo'}`;
    const localCached = cachedById?.get(cycleKey);

    const rawStage = String(row.stage || localCached?.stage || 'new').trim();
    const validTypes = new Set(['recall_6m', 'treatment_pending', 'whatsapp_lead', 'indication', 'other']);
    const rawType = String(row.opportunity_type || row.type || localCached?.type || 'recall_6m').toLowerCase();
    const type = (validTypes.has(rawType) ? rawType : 'recall_6m') as CRMLeadOpportunity['type'];

    const pipelineId =
      (row.pipeline_id ? String(row.pipeline_id) : undefined) ||
      localCached?.pipelineId ||
      this.inferPipelineId(type);

    const rawPriority = String(row.priority || localCached?.priority || 'high').toLowerCase();
    const priority: CRMLeadOpportunity['priority'] =
      rawPriority === 'low' ? 'low' : rawPriority === 'medium' ? 'medium' : 'high';

    const labels: string[] = Array.isArray(row.labels)
      ? row.labels
      : Array.isArray(localCached?.labels)
      ? localCached!.labels
      : [];

    const notesHistory: CRMNoteEntry[] = Array.isArray(row.notes_history)
      ? row.notes_history
      : Array.isArray(localCached?.notesHistory)
      ? localCached!.notesHistory
      : [];

    return {
      id: cycleKey,
      pipelineId,
      patientId: patientId ?? localCached?.patientId,
      patientName: String(row.patient_name || row.primeiro_nome || 'Paciente').trim(),
      primeiroNome: row.primeiro_nome ? String(row.primeiro_nome).trim() : undefined,
      patientPhone: String(row.mobile_phone || '').trim(),
      clinicId: Number(row.clinic_id || 1),
      type,
      stage: rawStage,
      priority,
      labels,
      lastVisitDate,
      dentistName: row.dentist_name || 'Corpo Clínico Bertuol',
      treatmentDescription: row.ultimo_procedimento || 'Avaliação Preventiva Semestral',
      diasDesdeUltimo: row.dias_desde_ultimo != null ? Number(row.dias_desde_ultimo) : 180,
      tipoMensagem: row.tipo_mensagem ? String(row.tipo_mensagem).trim() : undefined,
      mensagemWhatsapp: row.mensagem_whatsapp ? String(row.mensagem_whatsapp).trim() : undefined,
      estimatedValue: row.estimated_value != null ? Number(row.estimated_value) : 280,
      pointsBonus: row.points_bonus != null ? Number(row.points_bonus) : 50,
      notes: row.notes || localCached?.notes || undefined,
      notesHistory,
      assignedUser: row.assigned_user || localCached?.assignedUser || undefined,
      contactAttempts:
        row.contact_attempts != null
          ? Number(row.contact_attempts)
          : localCached?.contactAttempts ?? 0,
      lastContactDate: row.last_contact_date || localCached?.lastContactDate || undefined,
      nextContactDate: row.next_contact_date
        ? String(row.next_contact_date).split('T')[0]
        : localCached?.nextContactDate || undefined,
      lostReason: row.lost_reason || localCached?.lostReason || undefined,
      scheduledAppointmentId:
        row.scheduled_appointment_id != null
          ? Number(row.scheduled_appointment_id)
          : localCached?.scheduledAppointmentId,
      scheduledDate: row.scheduled_date
        ? String(row.scheduled_date).split('T')[0]
        : localCached?.scheduledDate,
      scheduledTime: row.scheduled_time || localCached?.scheduledTime,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      source: row.source || localCached?.source || 'Supabase crm_leads_recall',
    };
  }

  static mapOpportunityToBaseRow(opp: CRMLeadOpportunity) {
    const numericId =
      opp.patientId ||
      Number(String(opp.id).replace(/\D/g, '').slice(0, 15)) ||
      Math.floor(Date.now() + Math.random() * 1000);

    return {
      patient_id: numericId,
      patient_name: opp.patientName,
      primeiro_nome: opp.primeiroNome || opp.patientName.split(' ')[0],
      mobile_phone: opp.patientPhone,
      data_ultimo_agendamento: opp.lastVisitDate || new Date().toISOString().split('T')[0],
      ultimo_procedimento: opp.treatmentDescription || null,
      dias_desde_ultimo: opp.diasDesdeUltimo ?? (opp.type === 'recall_6m' ? 180 : 0),
      tipo_mensagem: opp.tipoMensagem || 'A',
      mensagem_whatsapp: opp.mensagemWhatsapp || null,
      stage: opp.stage || 'new',
      priority: opp.priority || 'high',
      clinic_id: opp.clinicId || 1,
      dentist_name: opp.dentistName || 'Corpo Clínico Bertuol',
      estimated_value: opp.estimatedValue ?? 280,
      points_bonus: opp.pointsBonus ?? 50,
      notes: opp.notes || null,
      last_contact_date: opp.lastContactDate || null,
      updated_at: new Date().toISOString(),
    };
  }

  static mapOpportunityToFullRow(opp: CRMLeadOpportunity) {
    return {
      ...this.mapOpportunityToBaseRow(opp),
      pipeline_id: opp.pipelineId || this.inferPipelineId(opp.type),
      type: opp.type || 'recall_6m',
      labels: opp.labels || [],
      notes_history: opp.notesHistory || [],
      assigned_user: opp.assignedUser || null,
      contact_attempts: opp.contactAttempts || 0,
      next_contact_date: opp.nextContactDate || null,
      lost_reason: opp.lostReason || null,
      scheduled_appointment_id: opp.scheduledAppointmentId || null,
      scheduled_date: opp.scheduledDate || null,
      scheduled_time: opp.scheduledTime || null,
      source: opp.source || 'CRM Bertuol',
    };
  }

  static getOpportunities(): CRMLeadOpportunity[] {
    try {
      if (localStorage.getItem(LEGACY_CRM_STORAGE_KEY_V1)) {
        localStorage.removeItem(LEGACY_CRM_STORAGE_KEY_V1);
      }
      if (localStorage.getItem(LEGACY_CRM_STORAGE_KEY_V2)) {
        localStorage.removeItem(LEGACY_CRM_STORAGE_KEY_V2);
      }

      const raw = localStorage.getItem(CRM_OPPORTUNITIES_STORAGE_KEY);
      if (!raw) {
        this.saveOpportunities(INITIAL_REAL_RECALL_LEADS);
        return INITIAL_REAL_RECALL_LEADS;
      }
      const parsed = JSON.parse(raw);
      const cleaned = this.sanitizeOpportunities(parsed);
      if (cleaned.length !== parsed.length) {
        this.saveOpportunities(cleaned);
      }
      return cleaned;
    } catch {
      return INITIAL_REAL_RECALL_LEADS;
    }
  }

  static saveOpportunities(list: CRMLeadOpportunity[]): void {
    const cleaned = this.sanitizeOpportunities(list);
    localStorage.setItem(CRM_OPPORTUNITIES_STORAGE_KEY, JSON.stringify(cleaned));
  }

  static async fetchFromSupabase(): Promise<CRMLeadOpportunity[]> {
    const localBefore = this.getOpportunities();
    const cachedById = new Map(localBefore.map((o) => [o.id, o]));
    try {
      const { data, error } = await supabase
        .from('crm_leads_recall')
        .select('*')
        .order('dias_desde_ultimo', { ascending: false });

      if (error) {
        return localBefore;
      }

      if (Array.isArray(data) && data.length > 0) {
        const mapped = this.sanitizeOpportunities(data.map((r) => this.mapRowToOpportunity(r, cachedById)));
        // Preserve any purely local unsynced leads (e.g. offline created)
        const remoteIds = new Set(mapped.map((m) => m.id));
        const localOnly = localBefore.filter((l) => !l.id.startsWith('opp-row-') && !remoteIds.has(l.id));
        const merged = [...localOnly, ...mapped];
        this.saveOpportunities(merged);
        return merged;
      }

      return localBefore;
    } catch {
      return localBefore;
    }
  }

  static getTemplates(): CRMMessageTemplate[] {
    try {
      const raw = localStorage.getItem(CRM_TEMPLATES_STORAGE_KEY);
      if (!raw) {
        this.saveTemplates(DEFAULT_CRM_TEMPLATES);
        return DEFAULT_CRM_TEMPLATES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CRM_TEMPLATES;
    }
  }

  static saveTemplates(list: CRMMessageTemplate[]): void {
    localStorage.setItem(CRM_TEMPLATES_STORAGE_KEY, JSON.stringify(list));
  }

  static addOpportunity(
    opp: Omit<CRMLeadOpportunity, 'id' | 'createdAt' | 'updatedAt' | 'labels' | 'contactAttempts'> & {
      labels?: string[];
      contactAttempts?: number;
    }
  ): CRMLeadOpportunity {
    const opportunities = this.getOpportunities();
    const numericId = opp.patientId || Math.floor(Date.now() + Math.random() * 1000);
    const cycleDate = opp.lastVisitDate || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const initialHistory: CRMNoteEntry[] = opp.notes?.trim()
      ? [
          {
            id: `note-${Date.now()}`,
            text: opp.notes.trim(),
            author: opp.assignedUser || 'Recepção Bertuol',
            createdAt: nowIso,
          },
        ]
      : [];

    const newOpp: CRMLeadOpportunity = {
      ...opp,
      id: `opp-supa-${numericId}-${cycleDate}`,
      pipelineId: opp.pipelineId || this.inferPipelineId(opp.type),
      patientId: numericId,
      lastVisitDate: cycleDate,
      labels: opp.labels || [],
      notesHistory: opp.notesHistory || initialHistory,
      contactAttempts: opp.contactAttempts ?? 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    opportunities.unshift(newOpp);
    this.saveOpportunities(opportunities);

    // Resilient Supabase insert: tries full payload first, falls back to base columns if schema not migrated yet
    const fullRow = this.mapOpportunityToFullRow(newOpp);
    supabase
      .from('crm_leads_recall')
      .insert(fullRow)
      .select('id')
      .single()
      .then(({ data, error }) => {
        if (error) {
          supabase
            .from('crm_leads_recall')
            .insert(this.mapOpportunityToBaseRow(newOpp))
            .select('id')
            .single()
            .then(({ data: baseData }) => {
              if (baseData?.id) {
                this.replaceLocalId(newOpp.id, `opp-row-${baseData.id}`);
              }
            });
        } else if (data?.id) {
          this.replaceLocalId(newOpp.id, `opp-row-${data.id}`);
        }
      });

    return newOpp;
  }

  private static replaceLocalId(oldId: string, newId: string) {
    const list = this.getOpportunities();
    const idx = list.findIndex((o) => o.id === oldId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], id: newId };
      this.saveOpportunities(list);
    }
  }

  static updateOpportunity(id: string, updates: Partial<CRMLeadOpportunity>): CRMLeadOpportunity | null {
    const opportunities = this.getOpportunities();
    const index = opportunities.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const updated: CRMLeadOpportunity = {
      ...opportunities[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    opportunities[index] = updated;
    this.saveOpportunities(opportunities);

    const baseUpdates: Record<string, any> = { updated_at: updated.updatedAt };
    if (updates.stage !== undefined) baseUpdates.stage = updates.stage;
    if (updates.priority !== undefined) baseUpdates.priority = updates.priority;
    if (updates.notes !== undefined) baseUpdates.notes = updates.notes;
    if (updates.lastContactDate !== undefined) baseUpdates.last_contact_date = updates.lastContactDate;
    if (updates.mensagemWhatsapp !== undefined) baseUpdates.mensagem_whatsapp = updates.mensagemWhatsapp;
    if (updates.dentistName !== undefined) baseUpdates.dentist_name = updates.dentistName;
    if (updates.estimatedValue !== undefined) baseUpdates.estimated_value = updates.estimatedValue;

    const fullUpdates: Record<string, any> = { ...baseUpdates };
    if (updates.pipelineId !== undefined) fullUpdates.pipeline_id = updates.pipelineId;
    if (updates.type !== undefined) fullUpdates.type = updates.type;
    if (updates.labels !== undefined) fullUpdates.labels = updates.labels;
    if (updates.notesHistory !== undefined) fullUpdates.notes_history = updates.notesHistory;
    if (updates.contactAttempts !== undefined) fullUpdates.contact_attempts = updates.contactAttempts;
    if (updates.nextContactDate !== undefined) fullUpdates.next_contact_date = updates.nextContactDate || null;
    if (updates.lostReason !== undefined) fullUpdates.lost_reason = updates.lostReason || null;
    if (updates.assignedUser !== undefined) fullUpdates.assigned_user = updates.assignedUser || null;
    if (updates.scheduledAppointmentId !== undefined)
      fullUpdates.scheduled_appointment_id = updates.scheduledAppointmentId;
    if (updates.scheduledDate !== undefined) fullUpdates.scheduled_date = updates.scheduledDate;
    if (updates.scheduledTime !== undefined) fullUpdates.scheduled_time = updates.scheduledTime;

    const applyUpdate = (payload: Record<string, any>) => {
      if (id.startsWith('opp-row-')) {
        const rowId = Number(id.replace('opp-row-', ''));
        return supabase.from('crm_leads_recall').update(payload).eq('id', rowId);
      }
      if (updated.patientId) {
        let query = supabase.from('crm_leads_recall').update(payload).eq('patient_id', updated.patientId);
        if (updated.lastVisitDate) {
          query = query.eq('data_ultimo_agendamento', updated.lastVisitDate);
        }
        return query;
      }
      return null;
    };

    const req = applyUpdate(fullUpdates);
    if (req) {
      req.then(({ error }) => {
        if (error && Object.keys(baseUpdates).length > 1) {
          const fallbackReq = applyUpdate(baseUpdates);
          if (fallbackReq) fallbackReq.then(() => {});
        }
      });
    }

    return updated;
  }

  static updateStage(
    id: string,
    stage: CRMLeadOpportunity['stage'],
    extraUpdates?: Partial<CRMLeadOpportunity>
  ): CRMLeadOpportunity | null {
    return this.updateOpportunity(id, {
      stage,
      lastContactDate: new Date().toISOString(),
      ...extraUpdates,
    });
  }

  static addNoteToOpportunity(id: string, noteText: string, author: string): CRMLeadOpportunity | null {
    const clean = noteText.trim();
    if (!clean) return null;
    const existing = this.getOpportunities().find((o) => o.id === id);
    if (!existing) return null;

    const newEntry: CRMNoteEntry = {
      id: `note-${Date.now()}`,
      text: clean,
      author: author || 'Recepção Bertuol',
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [newEntry, ...(existing.notesHistory || [])];
    return this.updateOpportunity(id, {
      notes: clean,
      notesHistory: updatedHistory,
    });
  }

  static toggleOpportunityLabel(id: string, labelId: string): CRMLeadOpportunity | null {
    const existing = this.getOpportunities().find((o) => o.id === id);
    if (!existing) return null;
    const currentLabels = existing.labels || [];
    const nextLabels = currentLabels.includes(labelId)
      ? currentLabels.filter((l) => l !== labelId)
      : [...currentLabels, labelId];
    return this.updateOpportunity(id, { labels: nextLabels });
  }

  static moveOpportunityToPipeline(
    id: string,
    targetPipelineId: string,
    targetStageId?: string
  ): CRMLeadOpportunity | null {
    const pipelines = this.getPipelines();
    const targetPipeline = pipelines.find((p) => p.id === targetPipelineId);
    const firstStage = targetStageId || targetPipeline?.stages[0]?.id || 'new';
    return this.updateOpportunity(id, {
      pipelineId: targetPipelineId,
      stage: firstStage,
    });
  }

  static deleteOpportunity(id: string): void {
    const existing = this.getOpportunities().find((o) => o.id === id);
    const opportunities = this.getOpportunities().filter((o) => o.id !== id);
    this.saveOpportunities(opportunities);

    if (id.startsWith('opp-row-')) {
      const rowId = Number(id.replace('opp-row-', ''));
      supabase.from('crm_leads_recall').delete().eq('id', rowId).then(() => {});
    } else if (existing?.patientId) {
      let query = supabase.from('crm_leads_recall').delete().eq('patient_id', existing.patientId);
      if (existing.lastVisitDate) {
        query = query.eq('data_ultimo_agendamento', existing.lastVisitDate);
      }
      query.then(() => {});
    }
  }

  static addTemplate(template: Omit<CRMMessageTemplate, 'id'>): CRMMessageTemplate {
    const templates = this.getTemplates();
    const newTpl: CRMMessageTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
    };
    templates.push(newTpl);
    this.saveTemplates(templates);
    return newTpl;
  }

  static updateTemplate(id: string, updates: Partial<CRMMessageTemplate>): CRMMessageTemplate | null {
    const templates = this.getTemplates();
    const idx = templates.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    templates[idx] = { ...templates[idx], ...updates };
    this.saveTemplates(templates);
    return templates[idx];
  }

  static deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter((t) => t.id !== id);
    this.saveTemplates(templates);
  }

  static formatWhatsAppUrl(phone: string, text?: string): string {
    const cleaned = phone.replace(/\D/g, '');
    let fullPhone = cleaned;
    if (cleaned.length === 10 || cleaned.length === 11) {
      fullPhone = `55${cleaned}`;
    }
    const encodedText = text ? encodeURIComponent(text) : '';
    return `https://wa.me/${fullPhone}${encodedText ? `?text=${encodedText}` : ''}`;
  }

  static formatPhoneDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
    if (local.length === 11) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    if (local.length === 10) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
    }
    return phone;
  }

  static replaceTemplateVariables(
    content: string,
    vars: { nome: string; doutor?: string; clinica?: string; pontos?: number }
  ): string {
    return content
      .replace(/\{nome\}/gi, vars.nome || 'Paciente')
      .replace(/\{doutor\}/gi, vars.doutor || 'Corpo Clínico Bertuol')
      .replace(/\{clinica\}/gi, vars.clinica || 'Clínica Bertuol Odontologia')
      .replace(/\{pontos\}/gi, String(vars.pontos || 50));
  }

  static syncAutomaticRecalls(patients: Patient[], appointments: Appointment[], clinics: Clinic[]): number {
    const opportunities = this.getOpportunities();
    const now = new Date().getTime();
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
    let addedCount = 0;

    patients.forEach((p) => {
      if (!p.Name || FICTIONAL_CRM_NAMES.has(p.Name.trim().toLowerCase())) return;
      if ([101, 102, 103, 104, 105].includes(Number(p.id))) return;

      const patientApps = appointments.filter(
        (a) => a.Patient_PersonId === p.id || (p.MobilePhone && a.MobilePhone === p.MobilePhone)
      );

      let lastAppTime: number | null = null;
      let lastAppIso: string | null = null;
      let lastDentist = 'Corpo Clínico Bertuol';

      patientApps.forEach((a) => {
        const d = new Date(a.date);
        const time = d.getTime();
        if (!isNaN(time)) {
          if (lastAppTime === null || time > lastAppTime) {
            lastAppTime = time;
            lastAppIso = d.toISOString().split('T')[0];
            if (a.dentist_name) lastDentist = a.dentist_name;
          }
        }
      });

      if (lastAppTime !== null && lastAppIso && now - lastAppTime >= SIX_MONTHS_MS) {
        const existing = opportunities.find(
          (o) =>
            (p.MobilePhone && o.patientPhone.replace(/\D/g, '') === p.MobilePhone.replace(/\D/g, '')) ||
            o.patientName.toLowerCase() === p.Name.toLowerCase()
        );

        if (!existing) {
          const clinicMatch = clinics.find((c) => c.clinicorp_business_id === p.Clinic_BusinessId) || clinics[0];
          const daysAgo = Math.floor((now - lastAppTime) / (1000 * 60 * 60 * 24));
          const newOpp: CRMLeadOpportunity = {
            id: `opp-supa-${p.id}`,
            pipelineId: 'recall_6m',
            patientId: Number(p.id),
            patientName: p.Name,
            primeiroNome: p.Name.split(' ')[0],
            patientPhone: p.MobilePhone || '63999000000',
            clinicId: clinicMatch?.id || 1,
            type: 'recall_6m',
            stage: 'new',
            priority: 'high',
            labels: [],
            contactAttempts: 0,
            lastVisitDate: lastAppIso,
            dentistName: lastDentist,
            treatmentDescription: 'Check-in Preventivo Semestral + Profilaxia',
            diasDesdeUltimo: daysAgo,
            tipoMensagem: 'A',
            estimatedValue: 280,
            pointsBonus: 50,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'Supabase crm_leads_recall',
          };
          opportunities.unshift(newOpp);
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      this.saveOpportunities(opportunities);
    }
    return addedCount;
  }

  static getStats(
    opportunities: CRMLeadOpportunity[],
    clinicIdFilter?: number | 'all',
    pipelineIdFilter?: string,
    pipelines?: CRMPipeline[]
  ): CRMSummaryStats {
    const pipelineList = pipelines || this.getPipelines();
    const pipelineMap = new Map(pipelineList.map((p) => [p.id, p]));

    const filtered = opportunities.filter((o) => {
      const matchClinic = !clinicIdFilter || clinicIdFilter === 'all' || o.clinicId === clinicIdFilter;
      const matchPipeline = !pipelineIdFilter || o.pipelineId === pipelineIdFilter;
      return matchClinic && matchPipeline;
    });

    const active = filtered.filter((o) => {
      const sem = this.resolveStageSemantic(pipelineMap.get(o.pipelineId), o.stage);
      return sem !== 'converted' && sem !== 'lost';
    });

    const recallDue = filtered.filter((o) => {
      const sem = this.resolveStageSemantic(pipelineMap.get(o.pipelineId), o.stage);
      return o.type === 'recall_6m' && sem !== 'converted' && sem !== 'lost';
    });

    const scheduled = filtered.filter(
      (o) => this.resolveStageSemantic(pipelineMap.get(o.pipelineId), o.stage) === 'scheduled'
    );
    const converted = filtered.filter(
      (o) => this.resolveStageSemantic(pipelineMap.get(o.pipelineId), o.stage) === 'converted'
    );

    const followUpsDue = filtered.filter((o) => this.isFollowUpDue(o, pipelineMap.get(o.pipelineId))).length;
    const slaAlerts = filtered.filter((o) => this.isSLAAlert(o, pipelineMap.get(o.pipelineId))).length;

    const convertedRevenue = converted.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
    const pipelineValue = active.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

    return {
      totalActive: active.length,
      totalRecallDue: recallDue.length,
      totalScheduled: scheduled.length,
      totalConvertedMonth: converted.length,
      convertedRevenueMonth: convertedRevenue,
      totalFollowUpsDue: followUpsDue,
      totalSLAAlert: slaAlerts,
      totalPipelineValue: pipelineValue,
    };
  }
}
