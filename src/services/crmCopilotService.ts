import { CRMLeadOpportunity, CRMPipeline } from '../types/crm';
import { Clinic } from '../types/database';
import { extractBirthdayVoucherInfo } from '../utils/crmBirthdayVoucher';
import { hasReturnedAfterEstimate } from '../utils/crmSystemFields';

export type CRMCopilotScenario =
  | 'auto'
  | 'first_contact'
  | 'budget_followup'
  | 'objection_price'
  | 'objection_think'
  | 'objection_fear'
  | 'reschedule'
  | 'birthday_voucher'
  | 'analyze_media';

export const CRM_COPILOT_SCENARIOS: Array<{ value: CRMCopilotScenario; label: string }> = [
  { value: 'auto', label: 'Automático (pelo contexto)' },
  { value: 'first_contact', label: 'Primeiro contato' },
  { value: 'budget_followup', label: 'Retomar orçamento' },
  { value: 'objection_price', label: 'Objeção de preço' },
  { value: 'objection_think', label: 'Disse "vou pensar"' },
  { value: 'objection_fear', label: 'Medo / insegurança' },
  { value: 'reschedule', label: 'Reagendamento / falta' },
  { value: 'birthday_voucher', label: 'Voucher aniversariante' },
  { value: 'analyze_media', label: 'Analisar resposta / mídia' },
];

export type CRMCopilotMediaClassification =
  | 'nenhuma'
  | 'exame_radiografia'
  | 'queixa_clinica'
  | 'documento_convenio'
  | 'comprovante'
  | 'audio_paciente'
  | 'outro';

export interface CRMCopilotMediaInput {
  mimeType: string;
  dataBase64: string;
  fileName: string;
  sizeBytes: number;
}

export interface CRMCopilotSuggestion {
  success: boolean;
  model?: string;
  returnedAfterEstimate: boolean;
  summary: string;
  transcript: string;
  mediaClassification: CRMCopilotMediaClassification;
  detectedObjection: string;
  urgencyAlert: string;
  suggestedLabel: string;
  suggestedFollowUpDays: number;
  suggestedMessage: string;
  internalTip: string;
  error?: string;
}

export const CRM_COPILOT_MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

export const MEDIA_CLASSIFICATION_LABELS: Record<CRMCopilotMediaClassification, string> = {
  nenhuma: '',
  exame_radiografia: 'Radiografia / Exame (encaminhar para equipe clínica)',
  queixa_clinica: 'Foto ou vídeo de queixa clínica (sem diagnóstico)',
  documento_convenio: 'Documento / Carteirinha de convênio',
  comprovante: 'Comprovante de pagamento',
  audio_paciente: 'Áudio do paciente',
  outro: 'Anexo do paciente',
};

export function fileToCopilotMedia(file: File): Promise<CRMCopilotMediaInput> {
  return new Promise((resolve, reject) => {
    const mimeType = (file.type || '').toLowerCase();
    const isAllowed =
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType === 'application/pdf';

    if (!isAllowed) {
      reject(new Error('Formato não suportado. Envie áudio, imagem, PDF ou vídeo curto.'));
      return;
    }

    if (file.size > CRM_COPILOT_MAX_FILE_BYTES) {
      reject(new Error('Arquivo acima do limite de 15 MB para análise rápida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',').pop() || '' : result;
      resolve({
        mimeType,
        dataBase64: base64,
        fileName: file.name || 'anexo',
        sizeBytes: file.size,
      });
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
}

export async function requestCRMCopilotSuggestion(params: {
  opportunity: CRMLeadOpportunity;
  clinic?: Clinic;
  pipeline?: CRMPipeline;
  scenario: CRMCopilotScenario;
  patientReplyText?: string;
  media?: CRMCopilotMediaInput | null;
}): Promise<CRMCopilotSuggestion> {
  const { opportunity, clinic, pipeline, scenario, patientReplyText, media } = params;
  const stageObj = pipeline?.stages.find((s) => s.id === opportunity.stage);
  const voucherInfo = extractBirthdayVoucherInfo(opportunity);
  const recentNotes = (opportunity.notesHistory || [])
    .slice(0, 4)
    .map((n) => `${n.author}: ${n.text}`);
  if (recentNotes.length === 0 && opportunity.notes) {
    recentNotes.push(opportunity.notes);
  }

  try {
    const res = await fetch('/api/crm/copilot/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        patientReplyText: patientReplyText?.trim() || '',
        media: media
          ? {
              mimeType: media.mimeType,
              dataBase64: media.dataBase64,
              fileName: media.fileName,
            }
          : null,
        lead: {
          patientName: opportunity.patientName,
          primeiroNome: opportunity.primeiroNome || opportunity.patientName.split(' ')[0],
          clinicName: clinic?.shortName ? `Clínica Bertuol (${clinic.shortName})` : 'Clínica Bertuol',
          pipelineId: opportunity.pipelineId,
          pipelineName: pipeline?.name || opportunity.pipelineId,
          stage: opportunity.stage,
          stageTitle: stageObj?.title || opportunity.stage,
          dentistName: opportunity.dentistName,
          treatmentDescription: opportunity.treatmentDescription,
          estimatedValue: opportunity.estimatedValue || 0,
          estimateDate: opportunity.estimateDate || null,
          lastVisitDate: opportunity.lastVisitDate || null,
          diasDesdeUltimo: opportunity.diasDesdeUltimo ?? null,
          lastVisitProcedure: opportunity.lastVisitProcedure || null,
          returnedAfterEstimate: hasReturnedAfterEstimate(opportunity),
          pointsBonus: opportunity.pointsBonus || 0,
          voucherCode: voucherInfo?.code || null,
          voucherExpiresAt: voucherInfo?.expiresAt || null,
          contactAttempts: opportunity.contactAttempts || 0,
          recentNotes,
        },
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return {
        success: false,
        returnedAfterEstimate: hasReturnedAfterEstimate(opportunity),
        summary: '',
        transcript: '',
        mediaClassification: 'nenhuma',
        detectedObjection: '',
        urgencyAlert: '',
        suggestedLabel: '',
        suggestedFollowUpDays: 2,
        suggestedMessage: '',
        internalTip: '',
        error: data?.error || `Falha ao consultar Copiloto (HTTP ${res.status}).`,
      };
    }

    return data as CRMCopilotSuggestion;
  } catch (err: any) {
    return {
      success: false,
      returnedAfterEstimate: hasReturnedAfterEstimate(opportunity),
      summary: '',
      transcript: '',
      mediaClassification: 'nenhuma',
      detectedObjection: '',
      urgencyAlert: '',
      suggestedLabel: '',
      suggestedFollowUpDays: 2,
      suggestedMessage: '',
      internalTip: '',
      error: err?.message || 'Erro de conexão com o servidor de IA.',
    };
  }
}
