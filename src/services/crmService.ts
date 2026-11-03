import {
  CRMLeadOpportunity,
  CRMMessageTemplate,
  CRMPipeline,
  CRMPipelineStage,
  CRMSummaryStats,
} from '../types/crm';
import { Patient, Appointment, Clinic } from '../types/database';

const CRM_OPPORTUNITIES_STORAGE_KEY = 'bertuol_crm_opportunities_v1';
const CRM_TEMPLATES_STORAGE_KEY = 'bertuol_crm_templates_v1';
const CRM_PIPELINES_STORAGE_KEY = 'bertuol_crm_pipelines_v1';

export const CRM_STAGE_COLOR_PRESETS = [
  { id: 'blue', label: 'Azul', color: 'border-blue-400', badgeBg: 'bg-blue-100 text-blue-900', dot: 'bg-blue-500' },
  { id: 'amber', label: 'Âmbar', color: 'border-amber-400', badgeBg: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  { id: 'indigo', label: 'Índigo', color: 'border-indigo-400', badgeBg: 'bg-indigo-100 text-indigo-900', dot: 'bg-indigo-500' },
  { id: 'teal', label: 'Teal Bertuol', color: 'border-[#147A80]', badgeBg: 'bg-teal-100 text-teal-900', dot: 'bg-[#147A80]' },
  { id: 'purple', label: 'Roxo', color: 'border-purple-400', badgeBg: 'bg-purple-100 text-purple-900', dot: 'bg-purple-500' },
  { id: 'emerald', label: 'Verde (Ganho)', color: 'border-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-900', dot: 'bg-emerald-500' },
  { id: 'rose', label: 'Rosa / Coral', color: 'border-rose-400', badgeBg: 'bg-rose-100 text-rose-900', dot: 'bg-rose-500' },
  { id: 'slate', label: 'Cinza (Perdido)', color: 'border-slate-300', badgeBg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
];

export const DEFAULT_CRM_PIPELINES: CRMPipeline[] = [
  {
    id: 'pipe-default',
    name: 'Funil Principal (Recall & WhatsApp)',
    description: 'Fluxo padrão de captação, reativação semestral e agendamentos gerais.',
    isDefault: true,
    stages: [
      { id: 'new', title: 'Novos Leads', color: 'border-blue-400', badgeBg: 'bg-blue-100 text-blue-900', icon: '🆕', kind: 'active' },
      { id: 'contacted', title: 'Em Contato', color: 'border-amber-400', badgeBg: 'bg-amber-100 text-amber-900', icon: '💬', kind: 'active' },
      { id: 'scheduled', title: 'Agendado', color: 'border-indigo-400', badgeBg: 'bg-indigo-100 text-indigo-900', icon: '📅', kind: 'scheduled' },
      { id: 'converted', title: 'Convertido', color: 'border-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-900', icon: '✅', kind: 'won' },
      { id: 'lost', title: 'Perdido', color: 'border-slate-300', badgeBg: 'bg-slate-100 text-slate-700', icon: '❌', kind: 'lost' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pipe-budgets',
    name: 'Funil de Orçamentos & Implantes',
    description: 'Acompanhamento de planos de tratamento de alto valor, negociação e fechamento.',
    isDefault: false,
    stages: [
      { id: 'new', title: 'Avaliação Realizada', color: 'border-blue-400', badgeBg: 'bg-blue-100 text-blue-900', icon: '🩺', kind: 'active' },
      { id: 'proposal_sent', title: 'Orçamento Apresentado', color: 'border-purple-400', badgeBg: 'bg-purple-100 text-purple-900', icon: '📑', kind: 'active' },
      { id: 'negotiation', title: 'Em Negociação', color: 'border-amber-400', badgeBg: 'bg-amber-100 text-amber-900', icon: '🤝', kind: 'active' },
      { id: 'scheduled', title: 'Início Agendado', color: 'border-indigo-400', badgeBg: 'bg-indigo-100 text-indigo-900', icon: '📅', kind: 'scheduled' },
      { id: 'converted', title: 'Contrato Fechado', color: 'border-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-900', icon: '✅', kind: 'won' },
      { id: 'lost', title: 'Declinado', color: 'border-slate-300', badgeBg: 'bg-slate-100 text-slate-700', icon: '❌', kind: 'lost' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
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
      'Olá {nome}! Tudo bem? Passando para saber se ficou com alguma dúvida sobre o plano de tratamento proposto por {doutor} na Clínica Bertuol. Temos condições facilitadas de parcelamento e agendamento priorizado para este mês. Podemos te ligar ou mandar as opções por aqui?',
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

const INITIAL_SEED_OPPORTUNITIES: CRMLeadOpportunity[] = [
  {
    id: 'opp-101',
    pipelineId: 'pipe-default',
    patientName: 'Ana Paula Silveira',
    patientPhone: '63992348811',
    clinicId: 1, // Palmas
    type: 'recall_6m',
    stage: 'new',
    priority: 'high',
    lastVisitDate: '2024-03-10',
    dentistName: 'Dr. Flávio Santiago',
    treatmentDescription: 'Check-up Semestral e Profilaxia Ultrassônica',
    estimatedValue: 280,
    pointsBonus: 50,
    notes: 'Paciente antiga da unidade Palmas. Apresentava leve acúmulo de tártaro.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Recall Automático 6 Meses',
  },
  {
    id: 'opp-102',
    pipelineId: 'pipe-budgets',
    patientName: 'Carlos Eduardo Mendes',
    patientPhone: '63984021234',
    clinicId: 1, // Palmas
    type: 'treatment_pending',
    stage: 'negotiation',
    priority: 'high',
    lastVisitDate: '2024-08-15',
    dentistName: 'Dra. Vanessa Bertuol',
    treatmentDescription: 'Clareamento Dental Caseiro + Restauração Resina',
    estimatedValue: 1200,
    pointsBonus: 100,
    notes: 'Interessado em clareamento para evento familiar. Solicitou opções em 4x.',
    lastContactDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Orçamento Pendente',
  },
  {
    id: 'opp-103',
    pipelineId: 'pipe-default',
    patientName: 'Mariana Costa Rocha',
    patientPhone: '63991223344',
    clinicId: 2, // Paraíso
    type: 'whatsapp_lead',
    stage: 'new',
    priority: 'medium',
    dentistName: 'Dra. Marcella Bertuol',
    treatmentDescription: 'Avaliação Inicial Ortodontia Invisível (Alinhadores)',
    estimatedValue: 3500,
    pointsBonus: 50,
    notes: 'Entrou em contato pelo Instagram/WhatsApp querendo saber preço de alinhadores.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'WhatsApp Receptor',
  },
  {
    id: 'opp-104',
    pipelineId: 'pipe-default',
    patientName: 'Roberto Alves de Oliveira',
    patientPhone: '63981119900',
    clinicId: 1, // Palmas
    type: 'recall_6m',
    stage: 'scheduled',
    priority: 'medium',
    lastVisitDate: '2024-02-20',
    dentistName: 'Dr. Flávio Santiago',
    treatmentDescription: 'Manutenção Implante e Limpeza Profunda',
    estimatedValue: 350,
    pointsBonus: 50,
    notes: 'Agendou retorno para próxima terça-feira às 14:00.',
    lastContactDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    nextContactDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Recall Automático 6 Meses',
  },
  {
    id: 'opp-105',
    pipelineId: 'pipe-default',
    patientName: 'Fernanda Lima Nogueira',
    patientPhone: '63992015566',
    clinicId: 2, // Paraíso
    type: 'indication',
    stage: 'converted',
    priority: 'low',
    dentistName: 'Dr. Lucas Bertuol',
    treatmentDescription: 'Facetas de Porcelana (6 elementos)',
    estimatedValue: 8400,
    pointsBonus: 200,
    notes: 'Indicada pelo paciente Dr. Marcelo. Tratamento iniciado e sinal efetuado!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Indicação de Paciente',
  },
];

export class CRMService {
  // ==========================================
  // PIPELINES & STAGES CRUD
  // ==========================================
  static getPipelines(): CRMPipeline[] {
    try {
      const raw = localStorage.getItem(CRM_PIPELINES_STORAGE_KEY);
      if (!raw) {
        this.savePipelines(DEFAULT_CRM_PIPELINES);
        return DEFAULT_CRM_PIPELINES;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CRM_PIPELINES;
    } catch {
      return DEFAULT_CRM_PIPELINES;
    }
  }

  static savePipelines(pipelines: CRMPipeline[]): void {
    localStorage.setItem(CRM_PIPELINES_STORAGE_KEY, JSON.stringify(pipelines));
  }

  static addPipeline(data: { name: string; description?: string; copyStagesFromId?: string }): CRMPipeline {
    const pipelines = this.getPipelines();
    const sourcePipeline = data.copyStagesFromId
      ? pipelines.find((p) => p.id === data.copyStagesFromId)
      : pipelines[0];

    const defaultStages: CRMPipelineStage[] = sourcePipeline
      ? sourcePipeline.stages.map((s) => ({ ...s }))
      : DEFAULT_CRM_PIPELINES[0].stages.map((s) => ({ ...s }));

    const newPipeline: CRMPipeline = {
      id: `pipe-${Date.now()}`,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      isDefault: pipelines.length === 0,
      stages: defaultStages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    pipelines.push(newPipeline);
    this.savePipelines(pipelines);
    return newPipeline;
  }

  static updatePipeline(
    pipelineId: string,
    updates: Partial<Pick<CRMPipeline, 'name' | 'description' | 'isDefault' | 'stages'>>
  ): CRMPipeline | null {
    const pipelines = this.getPipelines();
    const idx = pipelines.findIndex((p) => p.id === pipelineId);
    if (idx === -1) return null;

    if (updates.isDefault) {
      pipelines.forEach((p) => {
        p.isDefault = false;
      });
    }

    pipelines[idx] = {
      ...pipelines[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.savePipelines(pipelines);
    return pipelines[idx];
  }

  static deletePipeline(pipelineId: string): boolean {
    const pipelines = this.getPipelines();
    if (pipelines.length <= 1) return false; // Always keep at least 1 pipeline

    const remaining = pipelines.filter((p) => p.id !== pipelineId);
    if (remaining.length === pipelines.length) return false;

    if (!remaining.some((p) => p.isDefault)) {
      remaining[0].isDefault = true;
    }

    this.savePipelines(remaining);

    // Reassign opportunities from deleted pipeline to the first remaining pipeline
    const fallbackPipeline = remaining[0];
    const fallbackStage = fallbackPipeline.stages[0]?.id || 'new';
    const opps = this.getOpportunities();
    let changed = false;

    opps.forEach((o) => {
      if (o.pipelineId === pipelineId) {
        o.pipelineId = fallbackPipeline.id;
        if (!fallbackPipeline.stages.some((s) => s.id === o.stage)) {
          o.stage = fallbackStage;
        }
        changed = true;
      }
    });

    if (changed) {
      this.saveOpportunities(opps);
    }

    return true;
  }

  static addStageToPipeline(
    pipelineId: string,
    stageData: Omit<CRMPipelineStage, 'id'> & { id?: string }
  ): CRMPipeline | null {
    const pipelines = this.getPipelines();
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return null;

    const stageId =
      stageData.id?.trim() ||
      `stg_${ stageData.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 18)}_${Date.now().toString().slice(-4)}`;

    const newStage: CRMPipelineStage = {
      id: stageId,
      title: stageData.title.trim(),
      color: stageData.color,
      badgeBg: stageData.badgeBg,
      icon: stageData.icon || '📌',
      kind: stageData.kind || 'active',
    };

    pipeline.stages.push(newStage);
    pipeline.updatedAt = new Date().toISOString();
    this.savePipelines(pipelines);
    return pipeline;
  }

  static updateStageInPipeline(
    pipelineId: string,
    stageId: string,
    updates: Partial<Omit<CRMPipelineStage, 'id'>>
  ): CRMPipeline | null {
    const pipelines = this.getPipelines();
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return null;

    const stgIdx = pipeline.stages.findIndex((s) => s.id === stageId);
    if (stgIdx === -1) return null;

    pipeline.stages[stgIdx] = {
      ...pipeline.stages[stgIdx],
      ...updates,
    };
    pipeline.updatedAt = new Date().toISOString();
    this.savePipelines(pipelines);
    return pipeline;
  }

  static moveStageInPipeline(
    pipelineId: string,
    stageId: string,
    direction: 'left' | 'right'
  ): CRMPipeline | null {
    const pipelines = this.getPipelines();
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return null;

    const idx = pipeline.stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return null;

    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= pipeline.stages.length) return pipeline;

    const temp = pipeline.stages[idx];
    pipeline.stages[idx] = pipeline.stages[targetIdx];
    pipeline.stages[targetIdx] = temp;
    pipeline.updatedAt = new Date().toISOString();

    this.savePipelines(pipelines);
    return pipeline;
  }

  static deleteStageFromPipeline(pipelineId: string, stageId: string): CRMPipeline | null {
    const pipelines = this.getPipelines();
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline || pipeline.stages.length <= 1) return null; // Keep at least 1 stage

    pipeline.stages = pipeline.stages.filter((s) => s.id !== stageId);
    pipeline.updatedAt = new Date().toISOString();
    this.savePipelines(pipelines);

    // Move opportunities that were in this stage to the first stage of the pipeline
    const fallbackStageId = pipeline.stages[0].id;
    const opps = this.getOpportunities();
    let changed = false;
    opps.forEach((o) => {
      const oppPipeId = o.pipelineId || 'pipe-default';
      if (oppPipeId === pipelineId && o.stage === stageId) {
        o.stage = fallbackStageId;
        changed = true;
      }
    });
    if (changed) {
      this.saveOpportunities(opps);
    }

    return pipeline;
  }

  // ==========================================
  // OPPORTUNITIES & TEMPLATES CRUD
  // ==========================================
  static getOpportunities(): CRMLeadOpportunity[] {
    try {
      const raw = localStorage.getItem(CRM_OPPORTUNITIES_STORAGE_KEY);
      if (!raw) {
        this.saveOpportunities(INITIAL_SEED_OPPORTUNITIES);
        return INITIAL_SEED_OPPORTUNITIES;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SEED_OPPORTUNITIES;
    }
  }

  static saveOpportunities(list: CRMLeadOpportunity[]): void {
    localStorage.setItem(CRM_OPPORTUNITIES_STORAGE_KEY, JSON.stringify(list));
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

  static addOpportunity(opp: Omit<CRMLeadOpportunity, 'id' | 'createdAt' | 'updatedAt'>): CRMLeadOpportunity {
    const opportunities = this.getOpportunities();
    const newOpp: CRMLeadOpportunity = {
      ...opp,
      pipelineId: opp.pipelineId || 'pipe-default',
      id: `opp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    opportunities.unshift(newOpp);
    this.saveOpportunities(opportunities);
    return newOpp;
  }

  static updateOpportunity(id: string, updates: Partial<CRMLeadOpportunity>): CRMLeadOpportunity | null {
    const opportunities = this.getOpportunities();
    const index = opportunities.findIndex((o) => o.id === id);
    if (index === -1) return null;

    opportunities[index] = {
      ...opportunities[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveOpportunities(opportunities);
    return opportunities[index];
  }

  static updateStage(id: string, stage: CRMLeadOpportunity['stage'], pipelineId?: string): CRMLeadOpportunity | null {
    const payload: Partial<CRMLeadOpportunity> = {
      stage,
      lastContactDate: new Date().toISOString(),
    };
    if (pipelineId) {
      payload.pipelineId = pipelineId;
    }
    return this.updateOpportunity(id, payload);
  }

  static deleteOpportunity(id: string): void {
    const opportunities = this.getOpportunities().filter((o) => o.id !== id);
    this.saveOpportunities(opportunities);
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

  /**
   * Sanitiza telefone para formato WhatsApp e gera URL wa.me
   */
  static formatWhatsAppUrl(phone: string, text?: string): string {
    const cleaned = phone.replace(/\D/g, '');
    let fullPhone = cleaned;
    if (cleaned.length === 10 || cleaned.length === 11) {
      fullPhone = `55${cleaned}`;
    }
    const encodedText = text ? encodeURIComponent(text) : '';
    return `https://wa.me/${fullPhone}${encodedText ? `?text=${encodedText}` : ''}`;
  }

  /**
   * Substitui variáveis dinâmicas do template
   */
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

  /**
   * Realiza varredura de pacientes inativos há mais de 180 dias e adiciona à fila de recall
   */
  static syncAutomaticRecalls(patients: Patient[], appointments: Appointment[], clinics: Clinic[]): number {
    const opportunities = this.getOpportunities();
    const pipelines = this.getPipelines();
    const defaultPipeline = pipelines.find((p) => p.isDefault) || pipelines[0];
    const initialStageId = defaultPipeline?.stages[0]?.id || 'new';

    const now = new Date().getTime();
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
    let addedCount = 0;

    patients.forEach((p) => {
      // Find patient's latest appointment
      const patientApps = appointments.filter(
        (a) => a.Patient_PersonId === p.id || a.MobilePhone === p.MobilePhone
      );

      let lastAppTime: number | null = null;
      let lastAppIso: string | null = null;
      let lastDentist = 'Dr. Flávio Santiago';

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

      // If last visit was over 6 months ago, check if opportunity already exists
      const timeSinceLastVisit = lastAppTime !== null ? now - lastAppTime : SIX_MONTHS_MS + 1000;

      if (timeSinceLastVisit >= SIX_MONTHS_MS) {
        const existing = opportunities.find(
          (o) => o.patientPhone === p.MobilePhone || o.patientName.toLowerCase() === p.Name.toLowerCase()
        );

        if (!existing) {
          const clinicMatch = clinics.find((c) => c.clinicorp_business_id === p.Clinic_BusinessId) || clinics[0];
          const newOpp: CRMLeadOpportunity = {
            id: `opp-auto-${p.id}-${Date.now()}`,
            pipelineId: defaultPipeline?.id || 'pipe-default',
            patientName: p.Name,
            patientPhone: p.MobilePhone || '63999000000',
            clinicId: clinicMatch?.id || 1,
            type: 'recall_6m',
            stage: initialStageId,
            priority: 'high',
            lastVisitDate: lastAppIso || '2024-01-15',
            dentistName: lastDentist,
            treatmentDescription: 'Check-in Preventivo Semestral + Profilaxia',
            estimatedValue: 280,
            pointsBonus: 50,
            notes: 'Recall gerado automaticamente (mais de 6 meses sem consulta).',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'Vetor de Recall Inteligente',
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

  /**
   * Identifica a categoria da etapa mesmo para etapas personalizadas
   */
  static getOpportunityStageKind(opp: CRMLeadOpportunity, pipelines?: CRMPipeline[]): 'active' | 'scheduled' | 'won' | 'lost' {
    const allPipelines = pipelines || this.getPipelines();
    const pipe = allPipelines.find((p) => p.id === (opp.pipelineId || 'pipe-default')) || allPipelines[0];
    const stageObj = pipe?.stages.find((s) => s.id === opp.stage);
    if (stageObj?.kind) return stageObj.kind;

    if (opp.stage === 'converted') return 'won';
    if (opp.stage === 'scheduled') return 'scheduled';
    if (opp.stage === 'lost') return 'lost';
    return 'active';
  }

  /**
   * Calcula estatísticas resumidas
   */
  static getStats(opportunities: CRMLeadOpportunity[], clinicIdFilter?: number | 'all'): CRMSummaryStats {
    const pipelines = this.getPipelines();
    const filtered =
      !clinicIdFilter || clinicIdFilter === 'all'
        ? opportunities
        : opportunities.filter((o) => o.clinicId === clinicIdFilter);

    const active = filtered.filter((o) => {
      const kind = this.getOpportunityStageKind(o, pipelines);
      return kind !== 'won' && kind !== 'lost';
    });
    const recallDue = filtered.filter((o) => {
      const kind = this.getOpportunityStageKind(o, pipelines);
      return o.type === 'recall_6m' && kind !== 'won';
    });
    const scheduled = filtered.filter((o) => this.getOpportunityStageKind(o, pipelines) === 'scheduled');
    const converted = filtered.filter((o) => this.getOpportunityStageKind(o, pipelines) === 'won');

    const convertedRevenue = converted.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

    return {
      totalActive: active.length,
      totalRecallDue: recallDue.length,
      totalScheduled: scheduled.length,
      totalConvertedMonth: converted.length,
      convertedRevenueMonth: convertedRevenue,
    };
  }
}
