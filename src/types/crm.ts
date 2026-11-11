export type CRMStage = 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';

export type CRMType = 'recall_6m' | 'treatment_pending' | 'whatsapp_lead' | 'indication' | 'other';

export type CRMPriority = 'high' | 'medium' | 'low';

export interface CRMLeadOpportunity {
  id: string;
  patientName: string;
  patientPhone: string;
  clinicId: number; // 1 = Palmas, 2 = Paraíso, etc.
  type: CRMType;
  stage: CRMStage;
  priority: CRMPriority;
  lastVisitDate?: string;
  dentistName?: string;
  treatmentDescription?: string;
  estimatedValue?: number;
  pointsBonus?: number; // Pontos do Clube Sorriso Bertuol oferecidos no agendamento
  notes?: string;
  assignedUser?: string;
  lastContactDate?: string;
  nextContactDate?: string;
  createdAt: string;
  updatedAt: string;
  source: string;
}

export interface CRMMessageTemplate {
  id: string;
  title: string;
  category: 'recall' | 'budget' | 'welcome' | 'points' | 'post_op';
  content: string;
  variables: string[]; // e.g., ['nome', 'doutor', 'clinica', 'pontos']
}

export interface CRMSummaryStats {
  totalActive: number;
  totalRecallDue: number;
  totalScheduled: number;
  totalConvertedMonth: number;
  convertedRevenueMonth: number;
}
