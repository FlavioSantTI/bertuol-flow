import { CRMLeadOpportunity, CRMMessageTemplate, CRMSummaryStats } from '../types/crm';
import { Patient, Appointment, Clinic } from '../types/database';

const LEGACY_CRM_STORAGE_KEY = 'bertuol_crm_opportunities_v1';
const CRM_OPPORTUNITIES_STORAGE_KEY = 'bertuol_crm_opportunities_v2';
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

// Base inicial limpa (sem leads fictícios; alimentada pelo processo das 06:00h do n8n)
const INITIAL_SEED_OPPORTUNITIES: CRMLeadOpportunity[] = [];

export interface N8nSyncMetadata {
  lastN8nSyncAt: string | null;
  lastN8nSyncCount: number;
  n8nWebhookPullUrl: string;
}

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

  static getOpportunities(): CRMLeadOpportunity[] {
    try {
      // Remove chave legada v1 que continha Esther Oliveira Duarte / Nelson Freiberger
      if (localStorage.getItem(LEGACY_CRM_STORAGE_KEY)) {
        localStorage.removeItem(LEGACY_CRM_STORAGE_KEY);
      }

      const raw = localStorage.getItem(CRM_OPPORTUNITIES_STORAGE_KEY);
      if (!raw) {
        this.saveOpportunities(INITIAL_SEED_OPPORTUNITIES);
        return INITIAL_SEED_OPPORTUNITIES;
      }
      const parsed = JSON.parse(raw);
      const cleaned = this.sanitizeOpportunities(parsed);
      if (cleaned.length !== parsed.length) {
        this.saveOpportunities(cleaned);
      }
      return cleaned;
    } catch {
      return INITIAL_SEED_OPPORTUNITIES;
    }
  }

  static saveOpportunities(list: CRMLeadOpportunity[]): void {
    const cleaned = this.sanitizeOpportunities(list);
    localStorage.setItem(CRM_OPPORTUNITIES_STORAGE_KEY, JSON.stringify(cleaned));
  }

  /**
   * Sincroniza as oportunidades com o servidor (que recebe o webhook do n8n às 06:00h)
   */
  static async fetchFromServer(): Promise<{
    opportunities: CRMLeadOpportunity[];
    meta: N8nSyncMetadata;
  }> {
    try {
      const res = await fetch('/api/crm/opportunities');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const serverOpps: CRMLeadOpportunity[] = this.sanitizeOpportunities(data.opportunities || []);
      const localOpps = this.getOpportunities();

      // Mescla leads do servidor (n8n) com leads locais reais sem duplicar
      const merged = [...serverOpps];
      localOpps.forEach((loc) => {
        const exists = merged.some(
          (s) =>
            s.id === loc.id ||
            (s.patientPhone && loc.patientPhone && s.patientPhone.replace(/\D/g, '') === loc.patientPhone.replace(/\D/g, '')) ||
            (s.patientName.toLowerCase() === loc.patientName.toLowerCase() && s.clinicId === loc.clinicId)
        );
        if (!exists) {
          merged.push(loc);
        }
      });

      this.saveOpportunities(merged);
      return {
        opportunities: merged,
        meta: {
          lastN8nSyncAt: data.lastN8nSyncAt || null,
          lastN8nSyncCount: Number(data.lastN8nSyncCount || 0),
          n8nWebhookPullUrl: data.n8nWebhookPullUrl || '',
        },
      };
    } catch {
      return {
        opportunities: this.getOpportunities(),
        meta: {
          lastN8nSyncAt: null,
          lastN8nSyncCount: 0,
          n8nWebhookPullUrl: '',
        },
      };
    }
  }

  /**
   * Importa pacote de leads (180+ dias) vindos do n8n (JSON ou CSV convertido)
   */
  static async importLeadsFromN8n(
    leadsPayload: any,
    replaceNewLeads: boolean = false
  ): Promise<{
    success: boolean;
    importedCount: number;
    updatedCount: number;
    message: string;
    error?: string;
  }> {
    try {
      const bodyPayload = Array.isArray(leadsPayload)
        ? { leads: leadsPayload, mode: replaceNewLeads ? 'replace' : 'upsert' }
        : { ...leadsPayload, mode: replaceNewLeads ? 'replace' : 'upsert' };

      const res = await fetch('/api/webhooks/n8n/crm-recalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          importedCount: 0,
          updatedCount: 0,
          message: '',
          error: data.error || 'Falha ao importar leads do n8n',
        };
      }
      await this.fetchFromServer();
      return {
        success: true,
        importedCount: data.importedCount || 0,
        updatedCount: data.updatedCount || 0,
        message: data.message || 'Leads importados com sucesso!',
      };
    } catch (err: any) {
      return {
        success: false,
        importedCount: 0,
        updatedCount: 0,
        message: '',
        error: err?.message || 'Erro de conexão com o servidor',
      };
    }
  }

  /**
   * Busca ativamente os leads de 180+ dias de uma URL de Webhook do n8n
   */
  static async pullLeadsFromN8nWebhook(
    webhookUrl: string,
    method: 'GET' | 'POST' = 'GET'
  ): Promise<{
    success: boolean;
    importedCount: number;
    updatedCount: number;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/crm/n8n-pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, method }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          importedCount: 0,
          updatedCount: 0,
          error: data.error || 'Erro ao buscar dados no n8n',
        };
      }
      if (Array.isArray(data.opportunities)) {
        this.saveOpportunities(data.opportunities);
      }
      return {
        success: true,
        importedCount: data.importedCount || 0,
        updatedCount: data.updatedCount || 0,
      };
    } catch (err: any) {
      return {
        success: false,
        importedCount: 0,
        updatedCount: 0,
        error: err?.message || 'Falha ao conectar ao endpoint n8n',
      };
    }
  }

  /**
   * Limpa todos os leads ou apenas garante a remoção de leads fictícios no cliente e no servidor
   */
  static async clearOpportunities(onlyFictional: boolean = false): Promise<CRMLeadOpportunity[]> {
    try {
      localStorage.removeItem(LEGACY_CRM_STORAGE_KEY);
      if (onlyFictional) {
        const cleaned = this.sanitizeOpportunities(this.getOpportunities());
        this.saveOpportunities(cleaned);
      } else {
        localStorage.setItem(CRM_OPPORTUNITIES_STORAGE_KEY, JSON.stringify([]));
      }
      await fetch(`/api/crm/opportunities?only_fictional=${onlyFictional ? 'true' : 'false'}`, {
        method: 'DELETE',
      });
    } catch {
      // fallback local
    }
    return this.getOpportunities();
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
      id: `opp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    opportunities.unshift(newOpp);
    this.saveOpportunities(opportunities);

    fetch('/api/crm/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOpp),
    }).catch(() => {});

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

    fetch(`/api/crm/opportunities/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});

    return opportunities[index];
  }

  static updateStage(id: string, stage: CRMLeadOpportunity['stage']): CRMLeadOpportunity | null {
    return this.updateOpportunity(id, {
      stage,
      lastContactDate: new Date().toISOString(),
    });
  }

  static deleteOpportunity(id: string): void {
    const opportunities = this.getOpportunities().filter((o) => o.id !== id);
    this.saveOpportunities(opportunities);

    fetch(`/api/crm/opportunities/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
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
   * Realiza varredura de pacientes REAIS que possuem consulta registrada há 180+ dias
   * (Ignora pacientes fictícios ou pacientes sem histórico real de consulta)
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

      // Só gera recall automático se houver consulta real registrada há 180+ dias
      if (lastAppTime !== null && lastAppIso && now - lastAppTime >= SIX_MONTHS_MS) {
        const existing = opportunities.find(
          (o) =>
            (p.MobilePhone && o.patientPhone === p.MobilePhone) ||
            o.patientName.toLowerCase() === p.Name.toLowerCase()
        );

        if (!existing) {
          const clinicMatch = clinics.find((c) => c.clinicorp_business_id === p.Clinic_BusinessId) || clinics[0];
          const daysAgo = Math.floor((now - lastAppTime) / (1000 * 60 * 60 * 24));
          const newOpp: CRMLeadOpportunity = {
            id: `opp-auto-${p.id}-${Date.now()}`,
            patientName: p.Name,
            patientPhone: p.MobilePhone || '63999000000',
            clinicId: clinicMatch?.id || 1,
            type: 'recall_6m',
            stage: 'new',
            priority: 'high',
            lastVisitDate: lastAppIso,
            dentistName: lastDentist,
            treatmentDescription: 'Check-in Preventivo Semestral + Profilaxia',
            estimatedValue: 280,
            pointsBonus: 50,
            notes: `Recall Preventivo: Último atendimento registrado há ${daysAgo} dias.`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'Varredura Agenda Real (180+ dias)',
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
