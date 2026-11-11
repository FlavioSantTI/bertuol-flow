import { CRMLeadOpportunity, CRMMessageTemplate, CRMSummaryStats } from '../types/crm';
import { Patient, Appointment, Clinic } from '../types/database';

const CRM_OPPORTUNITIES_STORAGE_KEY = 'bertuol_crm_opportunities_v1';
const CRM_TEMPLATES_STORAGE_KEY = 'bertuol_crm_templates_v1';

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
    patientName: 'Carlos Eduardo Mendes',
    patientPhone: '63984021234',
    clinicId: 1, // Palmas
    type: 'treatment_pending',
    stage: 'contacted',
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

  static updateStage(id: string, stage: CRMLeadOpportunity['stage']): CRMLeadOpportunity | null {
    return this.updateOpportunity(id, {
      stage,
      lastContactDate: new Date().toISOString(),
    });
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
            patientName: p.Name,
            patientPhone: p.MobilePhone || '63999000000',
            clinicId: clinicMatch?.id || 1,
            type: 'recall_6m',
            stage: 'new',
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
