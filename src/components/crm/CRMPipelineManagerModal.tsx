import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CRMPipeline,
  CRMPipelineColor,
  CRMPipelineStage,
  CRMStageSemantic,
} from '../../types/crm';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Check,
  Lock,
  Edit3,
  AlertCircle,
} from 'lucide-react';

interface CRMPipelineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelines: CRMPipeline[];
  onSavePipeline: (pipeline: CRMPipeline) => void;
  onDeletePipeline: (pipelineId: string) => { error?: string };
}

const STAGE_COLOR_OPTIONS: { id: CRMPipelineColor; label: string; dotClass: string }[] = [
  { id: 'blue', label: 'Azul', dotClass: 'bg-blue-500' },
  { id: 'amber', label: 'Âmbar', dotClass: 'bg-amber-500' },
  { id: 'indigo', label: 'Índigo', dotClass: 'bg-indigo-500' },
  { id: 'teal', label: 'Turquesa', dotClass: 'bg-[#147A80]' },
  { id: 'emerald', label: 'Esmeralda', dotClass: 'bg-emerald-500' },
  { id: 'rose', label: 'Vermelho', dotClass: 'bg-rose-500' },
  { id: 'slate', label: 'Neutro', dotClass: 'bg-slate-400' },
];

const SEMANTIC_OPTIONS: { value: CRMStageSemantic; label: string }[] = [
  { value: 'new', label: 'Inicial (Entrada)' },
  { value: 'contacted', label: 'Em Contato / Negociação' },
  { value: 'scheduled', label: 'Agendado na Grade' },
  { value: 'converted', label: 'Convertido / Ganho' },
  { value: 'lost', label: 'Perdido / Encerrado' },
];

export const CRMPipelineManagerModal: React.FC<CRMPipelineManagerModalProps> = ({
  isOpen,
  onClose,
  pipelines,
  onSavePipeline,
  onDeletePipeline,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPointsBonus, setDefaultPointsBonus] = useState('50');
  const [stages, setStages] = useState<CRMPipelineStage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const startCreate = () => {
    setErrorMsg(null);
    setEditingId('__new__');
    setName('');
    setDescription('');
    setDefaultPointsBonus('50');
    setStages([
      { id: 'new', title: 'Novo Lead', semanticType: 'new', color: 'blue' },
      { id: 'contacted', title: 'Em Contato', semanticType: 'contacted', color: 'amber' },
      { id: 'scheduled', title: 'Avaliação Agendada', semanticType: 'scheduled', color: 'indigo' },
      { id: 'converted', title: 'Fechado / Convertido', semanticType: 'converted', color: 'emerald' },
      { id: 'lost', title: 'Perdido', semanticType: 'lost', color: 'slate' },
    ]);
  };

  const startEdit = (pipeline: CRMPipeline) => {
    setErrorMsg(null);
    setEditingId(pipeline.id);
    setName(pipeline.name);
    setDescription(pipeline.description || '');
    setDefaultPointsBonus(String(pipeline.defaultPointsBonus ?? 50));
    setStages(pipeline.stages.map((s) => ({ ...s })));
  };

  const handleAddStage = () => {
    const idx = stages.length + 1;
    setStages((prev) => [
      ...prev,
      {
        id: `etapa_${Date.now()}_${idx}`,
        title: `Nova Etapa ${idx}`,
        semanticType: 'contacted',
        color: 'teal',
      },
    ]);
  };

  const handleMoveStage = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= stages.length) return;
    const copy = [...stages];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    setStages(copy);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 2) {
      setErrorMsg('O funil precisa ter pelo menos 2 etapas.');
      return;
    }
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do funil.');
      return;
    }
    if (stages.some((s) => !s.title.trim())) {
      setErrorMsg('Todas as etapas precisam ter um nome.');
      return;
    }

    const existing = editingId && editingId !== '__new__' ? pipelines.find((p) => p.id === editingId) : undefined;
    const generatedSlug =
      existing?.id ||
      `${name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')}_${Date.now().toString().slice(-4)}`;

    onSavePipeline({
      id: generatedSlug,
      name: name.trim(),
      description: description.trim() || undefined,
      defaultPointsBonus: parseInt(defaultPointsBonus, 10) || 50,
      stages: stages.map((s) => ({
        ...s,
        title: s.title.trim(),
      })),
      sortOrder: existing ? existing.sortOrder : pipelines.length,
      isSystem: existing?.isSystem || false,
      isActive: true,
    });

    setEditingId(null);
    setErrorMsg(null);
  };

  const handleDelete = (pipelineId: string) => {
    const res = onDeletePipeline(pipelineId);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (editingId === pipelineId) {
      setEditingId(null);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#147A80]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Gerenciador de Funis e Etapas</h3>
              <p className="text-xs text-slate-500">
                Crie novos funis comerciais, customize colunas e configure diretrizes operacionais
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

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
          {/* Left column: Existing Pipelines List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700">
                Funis ativos ({pipelines.length})
              </h4>
              <button
                type="button"
                onClick={startCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Funil</span>
              </button>
            </div>

            <div className="space-y-2">
              {pipelines.map((p) => {
                const isSelected = editingId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-xl p-3.5 transition-all ${
                      isSelected ? 'border-[#147A80] ring-2 ring-[#147A80]/15' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-slate-900 text-sm truncate">{p.name}</h5>
                          {p.isSystem && (
                            <span title="Funil integrado ao n8n" className="text-slate-400">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          {p.stages.length} etapas · +{p.defaultPointsBonus ?? 50} pts Clube
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          title="Editar funil e etapas"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#147A80] hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!p.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            title="Arquivar / excluir funil"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 border-t border-slate-100 pt-2">
                        {p.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Editor Form */}
          <div className="lg:col-span-7">
            {errorMsg && (
              <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!editingId ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
                <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Selecione um funil para editar ou crie um novo
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Você pode criar funis específicos como <strong>Campanha Implantes</strong>,{' '}
                  <strong>Alinhadores Ortodônticos</strong>, <strong>Harmonização Orofacial</strong> ou{' '}
                  <strong>Pós-Operatório</strong> com etapas sob medida.
                </p>
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Funil Agora</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {editingId === '__new__' ? 'Criar Novo Funil Comercial' : `Editando: ${name}`}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Nome do Funil *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Campanha Implantes & Prótese"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Bônus Padrão (Pts)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={defaultPointsBonus}
                      onChange={(e) => setDefaultPointsBonus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Nota Operacional / Diretrizes do Funil
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Script de oferta, regras de parcelamento ou orientações para a recepção ao atender este funil..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                  />
                </div>

                {/* Stages Builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-slate-500">
                      Etapas (Colunas do Kanban)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddStage}
                      className="flex items-center gap-1 text-xs font-bold text-[#147A80] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Etapa</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {stages.map((stg, idx) => (
                      <div
                        key={stg.id}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2"
                      >
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveStage(idx, -1)}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === stages.length - 1}
                            onClick={() => handleMoveStage(idx, 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={stg.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStages((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, title: val } : s))
                            );
                          }}
                          placeholder="Nome da etapa"
                          className="flex-1 min-w-[140px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                        />

                        <select
                          value={stg.semanticType}
                          onChange={(e) => {
                            const val = e.target.value as CRMStageSemantic;
                            setStages((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, semanticType: val } : s))
                            );
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-700"
                          title="Comportamento nos relatórios"
                        >
                          {SEMANTIC_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={stg.color}
                          onChange={(e) => {
                            const val = e.target.value as CRMPipelineColor;
                            setStages((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, color: val } : s))
                            );
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-700"
                        >
                          {STAGE_COLOR_OPTIONS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx)}
                          title="Remover etapa"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar Funil</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
