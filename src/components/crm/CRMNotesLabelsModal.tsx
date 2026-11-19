import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRMLabel, CRMLeadOpportunity, CRMPipeline } from '../../types/crm';
import { X, Tag, FileText, Plus, Calendar, ArrowRightLeft, Send, Trash2 } from 'lucide-react';

interface CRMNotesLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CRMLeadOpportunity | null;
  labels: CRMLabel[];
  pipelines: CRMPipeline[];
  currentUserName: string;
  onAddNote: (oppId: string, noteText: string, author: string) => void;
  onToggleLabel: (oppId: string, labelId: string) => void;
  onCreateLabel: (name: string, color: CRMLabel['color']) => void;
  onDeleteLabel: (labelId: string) => void;
  onUpdateFollowUp: (oppId: string, nextContactDate: string | undefined) => void;
  onMovePipeline: (oppId: string, targetPipelineId: string) => void;
}

const LABEL_COLOR_CLASSES: Record<CRMLabel['color'], string> = {
  teal: 'bg-teal-50 text-teal-800 border-teal-200',
  amber: 'bg-amber-50 text-amber-900 border-amber-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const CRMNotesLabelsModal: React.FC<CRMNotesLabelsModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  labels,
  pipelines,
  currentUserName,
  onAddNote,
  onToggleLabel,
  onCreateLabel,
  onDeleteLabel,
  onUpdateFollowUp,
  onMovePipeline,
}) => {
  const [noteText, setNoteText] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<CRMLabel['color']>('teal');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    if (opportunity) {
      setFollowUpDate(opportunity.nextContactDate || '');
      setNoteText('');
    }
  }, [opportunity, isOpen]);

  if (!isOpen || !opportunity) return null;

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(opportunity.id, noteText.trim(), currentUserName);
    setNoteText('');
  };

  const handleAddNewLabel = () => {
    if (!newLabelName.trim()) return;
    onCreateLabel(newLabelName.trim(), newLabelColor);
    setNewLabelName('');
  };

  const quickOffsetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    setFollowUpDate(iso);
    onUpdateFollowUp(opportunity.id, iso);
  };

  const history = opportunity.notesHistory || [];

  const modalContent = (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-sm text-white">{opportunity.patientName}</h3>
            <p className="text-xs text-slate-300 font-mono tabular-nums mt-0.5">
              {opportunity.patientPhone} · Notas, Rótulos e Follow-up
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* 1. Follow-up & Pipeline Transfer Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-[#147A80]" />
                <span>Próximo Follow-up</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => {
                    setFollowUpDate(e.target.value);
                    onUpdateFollowUp(opportunity.id, e.target.value || undefined);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900"
                />
                {followUpDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpDate('');
                      onUpdateFollowUp(opportunity.id, undefined);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => quickOffsetDate(1)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                >
                  Amanhã
                </button>
                <button
                  type="button"
                  onClick={() => quickOffsetDate(3)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                >
                  Em 3 dias
                </button>
                <button
                  type="button"
                  onClick={() => quickOffsetDate(7)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                >
                  Em 7 dias
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#147A80]" />
                <span>Transferir para Outro Funil</span>
              </div>
              <select
                value={opportunity.pipelineId}
                onChange={(e) => onMovePipeline(opportunity.id, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 cursor-pointer"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Move o paciente mantendo todo o histórico de notas e rótulos.
              </p>
            </div>
          </div>

          {/* 2. Labels / Tags Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <Tag className="w-3.5 h-3.5 text-[#147A80]" />
                <span>Rótulos do Paciente</span>
              </div>
              <span className="text-[11px] text-slate-400">Clique para aplicar ou remover</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {labels.map((lbl) => {
                const active = (opportunity.labels || []).includes(lbl.id);
                return (
                  <div key={lbl.id} className="inline-flex items-center group">
                    <button
                      type="button"
                      onClick={() => onToggleLabel(opportunity.id, lbl.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? `${LABEL_COLOR_CLASSES[lbl.color]} ring-2 ring-slate-900/15`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {active ? `✓ ${lbl.name}` : lbl.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLabel(lbl.id)}
                      title="Excluir rótulo do catálogo"
                      className="ml-0.5 p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Novo rótulo (ex: Urgência, Retorno Prótese)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
              />
              <select
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value as CRMLabel['color'])}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="teal">Turquesa</option>
                <option value="amber">Âmbar</option>
                <option value="indigo">Índigo</option>
                <option value="emerald">Verde</option>
                <option value="rose">Vermelho</option>
                <option value="slate">Cinza</option>
              </select>
              <button
                type="button"
                onClick={handleAddNewLabel}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Rótulo</span>
              </button>
            </div>
          </div>

          {/* 3. Chronological Notes Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
              <FileText className="w-3.5 h-3.5 text-[#147A80]" />
              <span>Notas & Histórico de Atendimento</span>
            </div>

            <form onSubmit={handleSaveNote} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Registrar nova observação (ex: Pediu para retornar após dia 20)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Salvar Nota</span>
              </button>
            </form>

            <div className="space-y-2 max-h-52 overflow-y-auto pt-1">
              {history.length === 0 && !opportunity.notes ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Nenhuma nota registrada ainda para este paciente.
                </p>
              ) : (
                <>
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-bold text-slate-700">{entry.author}</span>
                        <span className="font-mono tabular-nums">
                          {new Date(entry.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{entry.text}</p>
                    </div>
                  ))}
                  {history.length === 0 && opportunity.notes && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800">
                      {opportunity.notes}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
