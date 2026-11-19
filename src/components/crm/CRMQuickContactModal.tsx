import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRMLeadOpportunity, CRMMessageTemplate, CRMPipeline } from '../../types/crm';
import { CRMService } from '../../services/crmService';
import { Clinic } from '../../types/database';
import { X, Send, MessageSquare, Copy, Check, ExternalLink, Calendar } from 'lucide-react';

interface CRMQuickContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CRMLeadOpportunity | null;
  templates: CRMMessageTemplate[];
  clinics: Clinic[];
  activePipeline?: CRMPipeline;
  onAfterSend?: (
    id: string,
    newStage: string,
    updates: Partial<CRMLeadOpportunity>
  ) => void;
}

const SUPABASE_PREFILLED_TEMPLATE_ID = '__supabase_mensagem_whatsapp__';

export const CRMQuickContactModal: React.FC<CRMQuickContactModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  templates,
  clinics,
  activePipeline,
  onAfterSend,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [nextFollowUpDays, setNextFollowUpDays] = useState<'none' | '1' | '2' | '5' | 'custom'>('2');
  const [customFollowUpDate, setCustomFollowUpDate] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!opportunity) return;

    setNextFollowUpDays('2');
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);
    setCustomFollowUpDate(twoDays.toISOString().split('T')[0]);

    if (opportunity.mensagemWhatsapp && opportunity.mensagemWhatsapp.trim().length > 0) {
      setSelectedTemplateId(SUPABASE_PREFILLED_TEMPLATE_ID);
      setCustomMessage(opportunity.mensagemWhatsapp.trim());
      return;
    }

    if (templates.length > 0) {
      let defaultTpl = templates.find((t) => {
        if (opportunity.type === 'recall_6m' && t.category === 'recall') return true;
        if (opportunity.type === 'treatment_pending' && t.category === 'budget') return true;
        if (opportunity.type === 'whatsapp_lead' && t.category === 'welcome') return true;
        return false;
      });

      if (!defaultTpl) defaultTpl = templates[0];

      if (defaultTpl) {
        setSelectedTemplateId(defaultTpl.id);
        fillMessageFromTemplate(defaultTpl, opportunity);
      }
    }
  }, [opportunity, templates, isOpen]);

  if (!isOpen || !opportunity) return null;

  const clinic = clinics.find((c) => c.id === opportunity.clinicId) || clinics[0];

  const fillMessageFromTemplate = (tpl: CRMMessageTemplate, opp: CRMLeadOpportunity) => {
    const displayName = opp.primeiroNome || opp.patientName;
    const text = CRMService.replaceTemplateVariables(tpl.content, {
      nome: displayName,
      doutor: opp.dentistName || 'Corpo Clínico Bertuol',
      clinica: clinic?.shortName ? `Clínica Bertuol (${clinic.shortName})` : 'Clínica Bertuol Odontologia',
      pontos: opp.pointsBonus || 50,
    });
    setCustomMessage(text);
  };

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (tplId === SUPABASE_PREFILLED_TEMPLATE_ID && opportunity.mensagemWhatsapp) {
      setCustomMessage(opportunity.mensagemWhatsapp.trim());
      return;
    }
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && opportunity) {
      fillMessageFromTemplate(tpl, opportunity);
    }
  };

  const resolveNextFollowUpDate = (): string | undefined => {
    if (nextFollowUpDays === 'none') return undefined;
    if (nextFollowUpDays === 'custom') return customFollowUpDate || undefined;
    const days = parseInt(nextFollowUpDays, 10);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSendWhatsApp = () => {
    const waUrl = CRMService.formatWhatsAppUrl(opportunity.patientPhone, customMessage);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    const semantic = CRMService.resolveStageSemantic(activePipeline, opportunity.stage);
    const nextStage =
      semantic === 'new'
        ? CRMService.getStageIdBySemantic(activePipeline, 'contacted')
        : opportunity.stage;

    const nextFollowUp = resolveNextFollowUpDate();
    const updates: Partial<CRMLeadOpportunity> = {
      contactAttempts: (opportunity.contactAttempts || 0) + 1,
      lastContactDate: new Date().toISOString(),
      nextContactDate: nextFollowUp,
    };

    CRMService.updateStage(opportunity.id, nextStage, updates);
    if (onAfterSend) {
      onAfterSend(opportunity.id, nextStage, updates);
    }

    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#147A80]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Disparar WhatsApp</h3>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                {opportunity.patientName} · {CRMService.formatPhoneDisplay(opportunity.patientPhone)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>
              Unidade: <strong className="text-slate-900">{clinic?.shortName || 'Palmas'}</strong>
            </span>
            {opportunity.lastVisitDate && (
              <span className="tabular-nums">
                Última visita: <strong className="text-slate-900">{opportunity.lastVisitDate}</strong>
                {opportunity.diasDesdeUltimo ? ` (${opportunity.diasDesdeUltimo}d)` : ''}
              </span>
            )}
            <span className="tabular-nums">
              Tentativa nº <strong className="text-slate-900">{(opportunity.contactAttempts || 0) + 1}</strong>
            </span>
          </div>

          {/* Select Template */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Modelo de mensagem
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white cursor-pointer"
            >
              {opportunity.mensagemWhatsapp && (
                <option value={SUPABASE_PREFILLED_TEMPLATE_ID}>
                  Mensagem Personalizada do Paciente {opportunity.tipoMensagem ? `(Tipo ${opportunity.tipoMensagem})` : ''} — Padrão
                </option>
              )}
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.title}
                </option>
              ))}
            </select>
          </div>

          {/* Message Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Texto da mensagem
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs text-[#147A80] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white leading-relaxed"
              placeholder="Digite sua mensagem para o WhatsApp..."
            />
          </div>

          {/* Follow-up Reminder Scheduler */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#147A80]" />
              <span>Agendar próximo follow-up caso não responda</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: '1', label: 'Amanhã' },
                  { id: '2', label: 'Em 2 dias' },
                  { id: '5', label: 'Em 5 dias' },
                  { id: 'custom', label: 'Escolher data' },
                  { id: 'none', label: 'Sem lembrete' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNextFollowUpDays(opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    nextFollowUpDays === opt.id
                      ? 'bg-[#147A80] text-white border-[#147A80]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {nextFollowUpDays === 'custom' && (
              <input
                type="date"
                value={customFollowUpDate}
                onChange={(e) => setCustomFollowUpDate(e.target.value)}
                className="h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-mono text-slate-900"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="h-9 px-5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Abrir no WhatsApp e Registrar Contato</span>
            <ExternalLink className="w-3.5 h-3.5 text-teal-100" />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
