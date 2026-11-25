import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRMLeadOpportunity } from '../../types/crm';
import { CRM_LOST_REASONS } from '../../services/crmService';
import { X, AlertTriangle, Check } from 'lucide-react';

interface CRMLostReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CRMLeadOpportunity | null;
  targetStageId: string;
  onConfirmLost: (oppId: string, stageId: string, reason: string, extraNote?: string) => void;
}

export const CRMLostReasonModal: React.FC<CRMLostReasonModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  targetStageId,
  onConfirmLost,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(CRM_LOST_REASONS[0]);
  const [extraNote, setExtraNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(CRM_LOST_REASONS[0]);
      setExtraNote('');
    }
  }, [isOpen]);

  if (!isOpen || !opportunity) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmLost(opportunity.id, targetStageId, selectedReason, extraNote.trim() || undefined);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Registrar Motivo de Perda</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Informe o motivo pelo qual <strong className="text-slate-900">{opportunity.patientName}</strong> não avançou neste funil. Esse dado alimenta o painel comercial.
          </p>

          <div className="space-y-1.5">
            {CRM_LOST_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  selectedReason === reason
                    ? 'bg-teal-50 text-[#0f5c61] border-[#147A80]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="lost_reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-[#147A80]"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Observação adicional (opcional)
            </label>
            <input
              type="text"
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              placeholder="Ex: Pediu para tentar novamente em janeiro"
              className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar Perda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
