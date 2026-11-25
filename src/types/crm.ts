export type CRMStageSemantic = 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';

export type CRMStage = CRMStageSemantic | string;

export type CRMType =
  | 'recall_6m'
  | 'treatment_pending'
  | 'whatsapp_lead'
  | 'indication'
  | 'birthday'
  | 'other';

export type CRMPriority = 'high' | 'medium' | 'low';

export type CRMPipelineColor = 'slate' | 'blue' | 'amber' | 'indigo' | 'emerald' | 'rose' | 'teal';

export interface CRMPipelineStage {
  id: string;
  title: string;
  semanticType: CRMStageSemantic;
  color: CRMPipelineColor;
}

export interface CRMPipeline {
  id: string;
  name: string;
  description?: string; // Nota operacional / script comercial do funil
  defaultPointsBonus?: number;
  stages: CRMPipelineStage[];
  sortOrder: number;
  isSystem?: boolean; // Funil recall_6m protegido contra exclusão acidental (etapas editáveis)
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CRMLabel {
  id: string;
  name: string;
  color: 'teal' | 'amber' | 'rose' | 'indigo' | 'emerald' | 'slate';
}

export interface CRMNoteEntry {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface CRMCustomField {
  id: string;
  label: string;
  value: string;
}

export interface CRMEstimateProcedure {
  id: string;
  description: string;
  tooth?: string;
  dentistName?: string;
  amount: number;
  statusDescription?: string;
}

export interface CRMLeadOpportunity {
  id: string;
  pipelineId: string; // Ex: 'recall_6m', 'campaigns', 'budgets', ou slug customizado
  patientId?: number | string | null; // patient_id do Clinicorp / Supabase patients UUID
  patientCpf?: string;
  patientName: string; // patient_name
  primeiroNome?: string; // primeiro_nome
  patientPhone: string; // mobile_phone ou @instagram / contato livre
  clinicId: number; // 1 = Palmas, 2 = Paraíso
  type: CRMType;
  stage: CRMStage;
  priority: CRMPriority;
  labels: string[]; // IDs ou nomes de rótulos aplicados ao card
  lastVisitDate?: string; // data_ultimo_agendamento (Última vinda real à clínica, YYYY-MM-DD)
  lastVisitProcedure?: string; // Procedimento realizado na última vinda (Clinicorp)
  lastVisitSyncedAt?: string; // Timestamp ISO da última verificação no Clinicorp
  dentistName?: string;
  treatmentDescription?: string; // ultimo_procedimento ou tratamento de interesse
  diasDesdeUltimo?: number; // dias_desde_ultimo
  tipoMensagem?: string; // tipo_mensagem ('A', 'B', 'C')
  mensagemWhatsapp?: string; // mensagem_whatsapp gerada pelo n8n
  estimatedValue?: number;
  estimateId?: number; // ID do orçamento no Clinicorp (/estimates/list)
  estimateDate?: string; // Data do orçamento no Clinicorp (YYYY-MM-DD)
  estimateProcedures?: CRMEstimateProcedure[]; // Procedimentos ativos do orçamento (sem Deleted/NotApproved)
  pointsBonus?: number; // Pontos do Clube Sorriso Bertuol oferecidos no agendamento
  notes?: string; // Resumo rápido visível no card
  notesHistory?: CRMNoteEntry[]; // Timeline cronológica de notas da recepção
  customFields?: CRMCustomField[]; // Campos livres criados dinamicamente pelas atendentes
  assignedUser?: string;
  contactAttempts: number; // Contador de tentativas (0, 1, 2, 3+)
  lastContactDate?: string;
  nextContactDate?: string; // Data agendada de Follow-up (YYYY-MM-DD)
  lostReason?: string; // Motivo estruturado de perda
  scheduledAppointmentId?: number;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  createdAt: string;
  updatedAt: string;
  source: string;
}

export interface CRMMessageTemplate {
  id: string;
  title: string;
  category: 'recall' | 'budget' | 'welcome' | 'points' | 'post_op' | 'birthday';
  content: string;
  variables: string[]; // e.g., ['nome', 'doutor', 'clinica', 'pontos']
}

export interface CRMSummaryStats {
  totalActive: number;
  totalRecallDue: number;
  totalScheduled: number;
  totalConvertedMonth: number;
  convertedRevenueMonth: number;
  totalFollowUpsDue: number;
  totalSLAAlert: number;
  totalPipelineValue: number;
}
