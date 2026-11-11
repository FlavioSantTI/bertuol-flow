import React, { useState, useEffect } from 'react';
import { CRMLeadOpportunity, CRMMessageTemplate, CRMStage } from '../../types/crm';
import { CRMService } from '../../services/crmService';
import { Clinic } from '../../types/database';
import { X, Send, Sparkles, MessageSquare, Copy, Check, ExternalLink } from 'lucide-react';

interface CRMQuickContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CRMLeadOpportunity | null;
  templates: CRMMessageTemplate[];
  clinics: Clinic[];
  onAfterSend?: (id: string, newStage: CRMStage) => void;
}

export const CRMQuickContactModal: React.FC<CRMQuickContactModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  templates,
  clinics,
  onAfterSend,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (opportunity && templates.length > 0) {
      // Pick template matching type or fallback to first
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
    const text = CRMService.replaceTemplateVariables(tpl.content, {
      nome: opp.patientName,
      doutor: opp.dentistName || 'Dr. Flávio Santiago',
      clinica: clinic?.shortName ? `Clínica Bertuol (${clinic.shortName})` : 'Clínica Bertuol Odontologia',
      pontos: opp.pointsBonus || 50,
    });
    setCustomMessage(text);
  };

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && opportunity) {
      fillMessageFromTemplate(tpl, opportunity);
    }
  };

  const handleSendWhatsApp = () => {
    const waUrl = CRMService.formatWhatsAppUrl(opportunity.patientPhone, customMessage);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Automatically update stage to 'contacted' if it was 'new'
    if (opportunity.stage === 'new') {
      CRMService.updateStage(opportunity.id, 'contacted');
      if (onAfterSend) {
        onAfterSend(opportunity.id, 'contacted');
      }
    }

    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-[#147A80] to-[#199A9F] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Contato Rápido WhatsApp</h3>
              <p className="text-xs text-teal-100">
                {opportunity.patientName} • {opportunity.patientPhone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Patient Details Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 flex flex-wrap justify-between gap-2">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Paciente</span>
              <span className="font-extrabold text-slate-900">{opportunity.patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Unidade</span>
              <span className="font-bold text-slate-800">{clinic?.shortName || 'Palmas'}</span>
            </div>
            {opportunity.pointsBonus ? (
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Bônus Clube</span>
                <span className="font-black text-amber-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />+{opportunity.pointsBonus} pts
                </span>
              </div>
            ) : null}
          </div>

          {/* Select Template */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              Escolher Modelo de Mensagem Pronta:
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-3 focus:ring-2 focus:ring-[#147A80] focus:bg-white transition-all"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.title}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Message Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black uppercase text-slate-500">
                Texto Personalizado (Editável):
              </label>
              <button
                onClick={handleCopyMessage}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-2xl p-3.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white transition-all leading-relaxed"
              placeholder="Digite sua mensagem para o WhatsApp..."
            />
          </div>

          {/* Variables help */}
          <p className="text-[11px] text-slate-400 italic">
            * O sistema substitui automaticamente nome, doutor, unidade e pontos bônus.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-102"
          >
            <Send className="w-4 h-4" />
            <span>Abrir e Disparar no WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
          </button>
        </div>
      </div>
    </div>
  );
};
