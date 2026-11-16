import { CRMLeadOpportunity, CRMMessageTemplate, CRMSummaryStats } from '../types/crm';
import { Patient, Appointment, Clinic } from '../types/database';
import { supabase } from './supabaseService';

const LEGACY_CRM_STORAGE_KEY_V1 = 'bertuol_crm_opportunities_v1';
const LEGACY_CRM_STORAGE_KEY_V2 = 'bertuol_crm_opportunities_v2';
const CRM_OPPORTUNITIES_STORAGE_KEY = 'bertuol_crm_opportunities_v3';
const CRM_TEMPLATES_STORAGE_KEY = 'bertuol_crm_templates_v1';

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

// Lote inicial real vindo do processo de 180+ dias (para exibição imediata e seed na tabela crm_leads_recall)
export const INITIAL_REAL_RECALL_LEADS: CRMLeadOpportunity[] = [
  {
    id: 'opp-supa-6499407105753088',
    patientId: 6499407105753088,
    patientName: 'THAUANE CECHINEL',
    primeiroNome: 'Thauane',
    patientPhone: '5563992238981',
    clinicId: 1,
    type: 'recall_6m',
    stage: 'new',
    priority: 'high',
    lastVisitDate: '2026-05-15',
    dentistName: 'Corpo Clínico Bertuol',
    treatmentDescription: 'Ajustes no dente da frente',
    diasDesdeUltimo: 180,
    tipoMensagem: 'A',
    mensagemWhatsapp:
      'Olá, Thauane! Tudo bem? 😊 Já faz algum tempo desde a sua última consulta em 15/05/2026. Que tal agendarmos uma avaliação preventiva para manter seu sorriso saudável? 🦷✨',
    estimatedValue: 280,
    pointsBonus: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Supabase crm_leads_recall',
  },
  {
    id: 'opp-supa-6366750714167296',
    patientId: 6366750714167296,
    patientName: 'Ana Lúcia Abreu Belloni Dos Santos',
    primeiroNome: 'Ana',
    patientPhone: '5563992374849',
    clinicId: 1,
    type: 'recall_6m',
    stage: 'new',
    priority: 'high',
    lastVisitDate: '2026-05-15',
    dentistName: 'Corpo Clínico Bertuol',
    treatmentDescription: 'Cimentação de CPP 1 elemento',
    diasDesdeUltimo: 180,
    tipoMensagem: 'B',
    mensagemWhatsapp:
      'Oi, Ana! Como você está? 👋 Notamos que sua última visita foi em 15/05/2026. Passando para lembrar da importância do seu check-up odontológico! Vamos marcar um horário? 📅🦷',
    estimatedValue: 280,
    pointsBonus: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Supabase crm_leads_recall',
  },
  {
    id: 'opp-supa-4594343324680192',
    patientId: 4594343324680192,
    patientName: 'MEIRE LUCIA MENDES PACHECO',
    primeiroNome: 'Meire',
    patientPhone: '5594991060293',
    clinicId: 1,
    type: 'recall_6m',
    stage: 'new',
    priority: 'high',
    lastVisitDate: '2026-05-15',
    dentistName: 'Corpo Clínico Bertuol',
    treatmentDescription: 'limpeza de protocolo',
    diasDesdeUltimo: 180,
    tipoMensagem: 'B',
    mensagemWhatsapp:
      'Oi, Meire! Como você está? 👋 Notamos que sua última visita foi em 15/05/2026. Passando para lembrar da importância do seu check-up odontológico! Vamos marcar um horário? 📅🦷',
    estimatedValue: 280,
    pointsBonus: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Supabase crm_leads_recall',
  },
  {
    id: 'opp-supa-5965302859366400',
    patientId: 5965302859366400,
    patientName: 'Juliana Ramos Dos santos Pires',
    primeiroNome: 'Juliana',
    patientPhone: '5563984196462',
    clinicId: 1,
    type: 'recall_6m',
    stage: 'new',
    priority: 'high',
    lastVisitDate: '2026-05-15',
    dentistName: 'Corpo Clínico Bertuol',
    treatmentDescription: 'extração de siso dente 18 ou 28',
    diasDesdeUltimo: 180,
    tipoMensagem: 'C',
    mensagemWhatsapp:
      'Olá, Juliana! Passando para saber como você está! 🌟 Já se passaram alguns meses da sua consulta em 15/05/2026. Que tal agendarmos sua revisão preventiva e deixar sua saúde bucal em dia? 🩺✨',
    estimatedValue: 280,
    pointsBonus: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Supabase crm_leads_recall',
  },
  {
    id: 'opp-supa-6194517117501440',
    patientId: 6194517117501440,
    patientName: 'Gilberto Martins Noleto*',
    primeiroNome: 'Gilberto',
    patientPhone: '5563992146767',
    clinicId: 1,
    type: 'recall_6m',
    stage: 'new',
    priority: 'high',
    lastVisitDate: '2026-05-15',
    dentistName: 'Corpo Clínico Bertuol',
    treatmentDescription: 'colar pino',
    diasDesdeUltimo: 180,
    tipoMensagem: 'A',
    mensagemWhatsapp:
      'Olá, Gilberto! Tudo bem? 😊 Já faz algum tempo desde a sua última consulta em 15/05/2026. Que tal agendarmos uma avaliação preventiva para manter seu sorriso saudável? 🦷✨',
    estimatedValue: 280,
    pointsBonus: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Supabase crm_leads_recall',
  },
];

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
    return list.filter((o) => o && o.patientName && !this.isFictionalLead(o));
  }

  /**
   * Converte uma linha da tabela public.crm_leads_recall do Supabase para CRMLeadOpportunity
   */
  static mapRowToOpportunity(row: any): CRMLeadOpportunity {
    const patientId = Number(row.patient_id || row.id || Date.now());
    const lastVisitDate = row.data_ultimo_agendamento ? String(row.data_ultimo_agendamento).split('T')[0] : undefined;
    const cycleKey = row.id ? `opp-row-${row.id}` : `opp-supa-${patientId}-${lastVisitDate || 'ciclo'}`;

    const validStages = new Set(['new', 'contacted', 'scheduled', 'converted', 'lost']);
    const rawStage = String(row.stage || 'new').toLowerCase();
    const stage = (validStages.has(rawStage) ? rawStage : 'new') as CRMLeadOpportunity['stage'];

    const rawPriority = String(row.priority || 'high').toLowerCase();
    const priority: CRMLeadOpportunity['priority'] =
      rawPriority === 'low' ? 'low' : rawPriority === 'medium' ? 'medium' : 'high';

    return {
      id: cycleKey,
      patientId,
      patientName: String(row.patient_name || row.primeiro_nome || 'Paciente').trim(),
      primeiroNome: row.primeiro_nome ? String(row.primeiro_nome).trim() : undefined,
      patientPhone: String(row.mobile_phone || '').trim(),
      clinicId: Number(row.clinic_id || 1),
      type: 'recall_6m',
      stage,
      priority,
      lastVisitDate,
      dentistName: row.dentist_name || 'Corpo Clínico Bertuol',
      treatmentDescription: row.ultimo_procedimento || 'Avaliação Preventiva Semestral',
      diasDesdeUltimo: row.dias_desde_ultimo != null ? Number(row.dias_desde_ultimo) : 180,
      tipoMensagem: row.tipo_mensagem ? String(row.tipo_mensagem).trim() : undefined,
      mensagemWhatsapp: row.mensagem_whatsapp ? String(row.mensagem_whatsapp).trim() : undefined,
      estimatedValue: row.estimated_value != null ? Number(row.estimated_value) : 280,
      pointsBonus: row.points_bonus != null ? Number(row.points_bonus) : 50,
      notes: row.notes || undefined,
      lastContactDate: row.last_contact_date || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      source: 'Supabase crm_leads_recall',
    };
  }

  /**
   * Converte um CRMLeadOpportunity para o formato da tabela public.crm_leads_recall no Supabase
   */
  static mapOpportunityToRow(opp: CRMLeadOpportunity) {
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
      dias_desde_ultimo: opp.diasDesdeUltimo ?? 180,
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
      if (cleaned.length === 0) {
        this.saveOpportunities(INITIAL_REAL_RECALL_LEADS);
        return INITIAL_REAL_RECALL_LEADS;
      }
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

  /**
   * Lê diretamente da tabela public.crm_leads_recall no Supabase
   */
  static async fetchFromSupabase(): Promise<CRMLeadOpportunity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads_recall')
        .select('*')
        .order('dias_desde_ultimo', { ascending: false });

      if (error) {
        return this.getOpportunities();
      }

      if (Array.isArray(data) && data.length > 0) {
        const mapped = this.sanitizeOpportunities(data.map((r) => this.mapRowToOpportunity(r)));
        this.saveOpportunities(mapped);
        return mapped;
      }

      // Se a tabela existe no Supabase mas está vazia, popula com os 5 leads reais iniciais
      const initialRows = INITIAL_REAL_RECALL_LEADS.map((o) => this.mapOpportunityToRow(o));
      await supabase.from('crm_leads_recall').insert(initialRows);
      this.saveOpportunities(INITIAL_REAL_RECALL_LEADS);
      return INITIAL_REAL_RECALL_LEADS;
    } catch {
      return this.getOpportunities();
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

  static addOpportunity(opp: Omit<CRMLeadOpportunity, 'id' | 'createdAt' | 'updatedAt'>): CRMLeadOpportunity {
    const opportunities = this.getOpportunities();
    const numericId = opp.patientId || Math.floor(Date.now() + Math.random() * 1000);
    const cycleDate = opp.lastVisitDate || new Date().toISOString().split('T')[0];
    const newOpp: CRMLeadOpportunity = {
      ...opp,
      id: `opp-supa-${numericId}-${cycleDate}`,
      patientId: numericId,
      lastVisitDate: cycleDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    opportunities.unshift(newOpp);
    this.saveOpportunities(opportunities);

    // Persiste direto no Supabase (a trigger fn_crm_leads_recall_smart_cycle gerencia ciclos automaticamente)
    supabase
      .from('crm_leads_recall')
      .insert(this.mapOpportunityToRow(newOpp))
      .then(() => {});

    return newOpp;
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

    const supaUpdates: Record<string, any> = {
      updated_at: updated.updatedAt,
    };
    if (updates.stage !== undefined) supaUpdates.stage = updates.stage;
    if (updates.priority !== undefined) supaUpdates.priority = updates.priority;
    if (updates.notes !== undefined) supaUpdates.notes = updates.notes;
    if (updates.lastContactDate !== undefined) supaUpdates.last_contact_date = updates.lastContactDate;
    if (updates.mensagemWhatsapp !== undefined) supaUpdates.mensagem_whatsapp = updates.mensagemWhatsapp;

    if (id.startsWith('opp-row-')) {
      const rowId = Number(id.replace('opp-row-', ''));
      supabase
        .from('crm_leads_recall')
        .update(supaUpdates)
        .eq('id', rowId)
        .then(() => {});
    } else if (updated.patientId) {
      let query = supabase.from('crm_leads_recall').update(supaUpdates).eq('patient_id', updated.patientId);
      if (updated.lastVisitDate) {
        query = query.eq('data_ultimo_agendamento', updated.lastVisitDate);
      }
      query.then(() => {});
    }

    return updated;
  }

  static updateStage(id: string, stage: CRMLeadOpportunity['stage']): CRMLeadOpportunity | null {
    return this.updateOpportunity(id, {
      stage,
      lastContactDate: new Date().toISOString(),
    });
  }

  static deleteOpportunity(id: string): void {
    const existing = this.getOpportunities().find((o) => o.id === id);
    const opportunities = this.getOpportunities().filter((o) => o.id !== id);
    this.saveOpportunities(opportunities);

    if (id.startsWith('opp-row-')) {
      const rowId = Number(id.replace('opp-row-', ''));
      supabase
        .from('crm_leads_recall')
        .delete()
        .eq('id', rowId)
        .then(() => {});
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
   * Sincroniza pacientes reais inativos caso existam na agenda local
   */
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
            patientId: Number(p.id),
            patientName: p.Name,
            primeiroNome: p.Name.split(' ')[0],
            patientPhone: p.MobilePhone || '63999000000',
            clinicId: clinicMatch?.id || 1,
            type: 'recall_6m',
            stage: 'new',
            priority: 'high',
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

  /**
   * Calcula estatísticas resumidas
   */
  static getStats(opportunities: CRMLeadOpportunity[], clinicIdFilter?: number | 'all'): CRMSummaryStats {
    const filtered =
      !clinicIdFilter || clinicIdFilter === 'all'
        ? opportunities
        : opportunities.filter((o) => o.clinicId === clinicIdFilter);

    const active = filtered.filter((o) => o.stage !== 'converted' && o.stage !== 'lost');
    const recallDue = filtered.filter((o) => o.type === 'recall_6m' && o.stage !== 'converted');
    const scheduled = filtered.filter((o) => o.stage === 'scheduled');
    const converted = filtered.filter((o) => o.stage === 'converted');

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
