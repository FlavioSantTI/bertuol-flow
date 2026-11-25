import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CRMLabel, CRMLeadOpportunity } from '../../types/crm';
import { X, Tag, Plus, Pencil, Trash2, Check } from 'lucide-react';

interface CRMLabelsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: CRMLabel[];
  opportunities: CRMLeadOpportunity[];
  onCreateLabel: (name: string, color: CRMLabel['color']) => void;
  onUpdateLabel: (id: string, name: string, color: CRMLabel['color']) => void;
  onDeleteLabel: (labelId: string) => void;
}

const COLOR_OPTIONS: Array<{
  value: CRMLabel['color'];
  label: string;
  dot: string;
  badge: string;
}> = [
  { value: 'teal', label: 'Turquesa', dot: 'bg-[#147A80]', badge: 'bg-teal-50 text-teal-800 border-teal-200' },
  { value: 'amber', label: 'Âmbar', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-900 border-amber-200' },
  { value: 'indigo', label: 'Índigo', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { value: 'emerald', label: 'Verde', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { value: 'rose', label: 'Vermelho', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
  { value: 'slate', label: 'Cinza', dot: 'bg-slate-500', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
];

const getColorMeta = (color: CRMLabel['color']) =>
  COLOR_OPTIONS.find((c) => c.value === color) || COLOR_OPTIONS[0];

export const CRMLabelsManagerModal: React.FC<CRMLabelsManagerModalProps> = ({
  isOpen,
  onClose,
  labels,
  opportunities,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<CRMLabel['color']>('teal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<CRMLabel['color']>('teal');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    onCreateLabel(clean, newColor);
    setNewName('');
  };

  const startEdit = (lbl: CRMLabel) => {
    setEditingId(lbl.id);
    setEditName(lbl.name);
    setEditColor(lbl.color);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdateLabel(editingId, editName.trim(), editColor);
    setEditingId(null);
  };

  const countUsage = (labelId: string) =>
    opportunities.filter((o) => Array.isArray(o.labels) && o.labels.includes(labelId)).length;

  const modalContent = (
    <div className="fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#147A80] border border-teal-200 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Gerenciar Rótulos do CRM</h3>
              <p className="text-xs text-slate-500">
                Crie, edite e organize rótulos para classificar e filtrar leads nos funis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar gerenciador de rótulos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Label Form */}
        <form onSubmit={handleCreate} className="p-5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <label className="block text-xs font-bold text-slate-700">
            Incluir novo rótulo
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Urgência, Implante, Convênio, VIP..."
              className="flex-1 h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="h-9 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Criar</span>
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-500">Cor:</span>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewColor(c.value)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                  newColor === c.value
                    ? `${c.badge} ring-2 ring-[#147A80]/30`
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Existing Labels List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 bg-white">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-1">
            <span>Rótulos cadastrados ({labels.length})</span>
            <span>Uso nos leads</span>
          </div>

          {labels.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Nenhum rótulo cadastrado ainda. Crie o primeiro acima.
            </div>
          ) : (
            labels.map((lbl) => {
              const meta = getColorMeta(lbl.color);
              const usage = countUsage(lbl.id);
              const isEditing = editingId === lbl.id;

              return (
                <div
                  key={lbl.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEdit();
                            }
                          }}
                          className="flex-1 h-8 bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                        />
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="h-8 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setEditColor(c.value)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border cursor-pointer ${
                              editColor === c.value
                                ? `${c.badge} ring-2 ring-[#147A80]/30`
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.badge}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        <span>{lbl.name}</span>
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {usage} {usage === 1 ? 'lead' : 'leads'}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEdit(lbl)}
                          title="Editar rótulo"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#147A80] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteLabel(lbl.id)}
                          title="Excluir rótulo"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Você também pode aplicar rótulos direto em cada card ou ficha do paciente.</span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
