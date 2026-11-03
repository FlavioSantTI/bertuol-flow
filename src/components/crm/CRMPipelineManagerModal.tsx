import React, { useState, useEffect } from 'react';
import { CRMPipeline, CRMPipelineStage, CRMStageKind } from '../../types/crm';
import { CRMService, CRM_STAGE_COLOR_PRESETS } from '../../services/crmService';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  ArrowUp,
  ArrowDown,
  Layers,
  Columns3,
  Star,
  Sparkles,
} from 'lucide-react';

interface CRMPipelineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelines: CRMPipeline[];
  activePipelineId: string;
  onSelectPipeline: (pipelineId: string) => void;
  onChanged: () => void;
}

const STAGE_ICONS = ['🆕', '💬', '📅', '📑', '🤝', '🩺', '✨', '🔥', '⏳', '✅', '❌', '📌'];

const KIND_LABELS: Record<CRMStageKind, { label: string; desc: string; badge: string }> = {
  active: {
    label: 'Em Aberto / Acompanhamento',
    desc: 'Conta como lead ativo em negociação',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  scheduled: {
    label: 'Agendado',
    desc: 'Conta nas métricas de consultas agendadas',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  won: {
    label: 'Convertido / Ganho',
    desc: 'Soma o valor estimado na receita convertida do mês',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  lost: {
    label: 'Perdido / Arquivado',
    desc: 'Encerra a oportunidade sem contabilizar ganho',
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
  },
};

export const CRMPipelineManagerModal: React.FC<CRMPipelineManagerModalProps> = ({
  isOpen,
  onClose,
  pipelines,
  activePipelineId,
  onSelectPipeline,
  onChanged,
}) => {
  const [selectedPipeId, setSelectedPipeId] = useState<string>(activePipelineId);

  // New Pipeline form state
  const [isCreatingPipe, setIsCreatingPipe] = useState(false);
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipeDesc, setNewPipeDesc] = useState('');

  // Edit Pipeline form state
  const [isEditingPipeInfo, setIsEditingPipeInfo] = useState(false);
  const [editPipeName, setEditPipeName] = useState('');
  const [editPipeDesc, setEditPipeDesc] = useState('');

  // Stage form state (create or edit)
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageTitle, setStageTitle] = useState('');
  const [stageIcon, setStageIcon] = useState('📌');
  const [stageColorId, setStageColorId] = useState('teal');
  const [stageKind, setStageKind] = useState<CRMStageKind>('active');

  useEffect(() => {
    if (isOpen) {
      setSelectedPipeId(activePipelineId || pipelines[0]?.id || 'pipe-default');
      setIsCreatingPipe(false);
      setIsEditingPipeInfo(false);
      resetStageForm();
    }
  }, [isOpen, activePipelineId]);

  if (!isOpen) return null;

  const currentPipeline =
    pipelines.find((p) => p.id === selectedPipeId) || pipelines[0];

  const resetStageForm = () => {
    setEditingStageId(null);
    setStageTitle('');
    setStageIcon('📌');
    setStageColorId('teal');
    setStageKind('active');
  };

  const handleCreatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipeName.trim()) return;
    const created = CRMService.addPipeline({
      name: newPipeName.trim(),
      description: newPipeDesc.trim(),
      copyStagesFromId: currentPipeline?.id,
    });
    setNewPipeName('');
    setNewPipeDesc('');
    setIsCreatingPipe(false);
    setSelectedPipeId(created.id);
    onSelectPipeline(created.id);
    onChanged();
  };

  const startEditPipelineInfo = () => {
    if (!currentPipeline) return;
    setEditPipeName(currentPipeline.name);
    setEditPipeDesc(currentPipeline.description || '');
    setIsEditingPipeInfo(true);
  };

  const handleSavePipelineInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPipeline || !editPipeName.trim()) return;
    CRMService.updatePipeline(currentPipeline.id, {
      name: editPipeName.trim(),
      description: editPipeDesc.trim(),
    });
    setIsEditingPipeInfo(false);
    onChanged();
  };

  const handleSetDefaultPipeline = (pipeId: string) => {
    CRMService.updatePipeline(pipeId, { isDefault: true });
    onChanged();
  };

  const handleDeletePipeline = (pipeId: string) => {
    if (pipelines.length <= 1) {
      alert('É necessário manter pelo menos 1 funil ativo no CRM.');
      return;
    }
    const target = pipelines.find((p) => p.id === pipeId);
    if (
      confirm(
        `Deseja excluir o funil "${target?.name}"? As oportunidades vinculadas a ele serão movidas para o funil principal.`
      )
    ) {
      CRMService.deletePipeline(pipeId);
      const remaining = CRMService.getPipelines();
      const nextId = remaining[0]?.id || 'pipe-default';
      setSelectedPipeId(nextId);
      onSelectPipeline(nextId);
      onChanged();
    }
  };

  const startEditStage = (stg: CRMPipelineStage) => {
    setEditingStageId(stg.id);
    setStageTitle(stg.title);
    setStageIcon(stg.icon || '📌');
    const matchedPreset = CRM_STAGE_COLOR_PRESETS.find((c) => c.color === stg.color);
    setStageColorId(matchedPreset?.id || 'teal');
    setStageKind(stg.kind || 'active');
  };

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPipeline || !stageTitle.trim()) return;

    const preset =
      CRM_STAGE_COLOR_PRESETS.find((c) => c.id === stageColorId) ||
      CRM_STAGE_COLOR_PRESETS[0];

    if (editingStageId) {
      CRMService.updateStageInPipeline(currentPipeline.id, editingStageId, {
        title: stageTitle.trim(),
        icon: stageIcon,
        color: preset.color,
        badgeBg: preset.badgeBg,
        kind: stageKind,
      });
    } else {
      CRMService.addStageToPipeline(currentPipeline.id, {
        title: stageTitle.trim(),
        icon: stageIcon,
        color: preset.color,
        badgeBg: preset.badgeBg,
        kind: stageKind,
      });
    }

    resetStageForm();
    onChanged();
  };

  const handleMoveStage = (stageId: string, direction: 'left' | 'right') => {
    if (!currentPipeline) return;
    CRMService.moveStageInPipeline(currentPipeline.id, stageId, direction);
    onChanged();
  };

  const handleDeleteStage = (stg: CRMPipelineStage) => {
    if (!currentPipeline) return;
    if (currentPipeline.stages.length <= 1) {
      alert('Um funil precisa ter pelo menos 1 etapa.');
      return;
    }
    if (
      confirm(
        `Deseja excluir a etapa "${stg.title}"? Os leads que estiverem nesta coluna serão movidos para a primeira etapa do funil.`
      )
    ) {
      CRMService.deleteStageFromPipeline(currentPipeline.id, stg.id);
      if (editingStageId === stg.id) resetStageForm();
      onChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-[#0d4f52] to-[#147A80] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Gerenciador de Funis (Pipelines) & Etapas do Kanban
              </h3>
              <p className="text-xs text-teal-100">
                Crie funis personalizados e configure as colunas de acompanhamento da clínica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Sidebar: Pipelines List */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Funis Cadastrados ({pipelines.length})
                </span>
                <button
                  onClick={() => {
                    setIsCreatingPipe(!isCreatingPipe);
                    setIsEditingPipeInfo(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Funil</span>
                </button>
              </div>

              {/* Create Pipeline Inline Box */}
              {isCreatingPipe && (
                <form
                  onSubmit={handleCreatePipeline}
                  className="bg-white border-2 border-teal-500 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                >
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Criar Novo Funil
                  </h4>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Nome do Funil *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Funil de Alinhadores Invisíveis"
                      value={newPipeName}
                      onChange={(e) => setNewPipeName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Descrição (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pacientes interessados em ortodontia estética"
                      value={newPipeDesc}
                      onChange={(e) => setNewPipeDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPipe(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                    >
                      Criar Funil
                    </button>
                  </div>
                </form>
              )}

              {/* Pipelines Cards */}
              <div className="space-y-2">
                {pipelines.map((pipe) => {
                  const isSelected = pipe.id === currentPipeline?.id;
                  return (
                    <div
                      key={pipe.id}
                      onClick={() => {
                        setSelectedPipeId(pipe.id);
                        onSelectPipeline(pipe.id);
                        setIsEditingPipeInfo(false);
                        resetStageForm();
                      }}
                      className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#147A80] ring-2 ring-[#147A80]/20 shadow-sm'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">
                              {pipe.name}
                            </h4>
                            {pipe.isDefault && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                Padrão
                              </span>
                            )}
                          </div>
                          {pipe.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {pipe.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-bold text-teal-800">
                          {pipe.stages.length} etapas
                        </span>

                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!pipe.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultPipeline(pipe.id)}
                              title="Definir como Funil Padrão"
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {pipelines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeletePipeline(pipe.id)}
                              title="Excluir Funil"
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-3 text-[11px] text-teal-900">
              <strong className="font-extrabold block mb-0.5">💡 Dica de Organização:</strong>
              Você pode criar funis separados para <em>Recall Preventivo</em>,{' '}
              <em>Orçamentos de Implantes</em> ou <em>Alinhadores</em>, cada um com suas próprias colunas!
            </div>
          </div>

          {/* Right Panel: Selected Pipeline Stages CRUD */}
          <div className="md:col-span-8 p-5 overflow-y-auto space-y-5 bg-white">
            {currentPipeline && (
              <>
                {/* Pipeline Header & Rename */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  {!isEditingPipeInfo ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">
                            {currentPipeline.name}
                          </h3>
                          {currentPipeline.isDefault && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              Funil Principal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {currentPipeline.description || 'Sem descrição cadastrada.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={startEditPipelineInfo}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shrink-0 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#147A80]" />
                        <span>Renomear Funil</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSavePipelineInfo} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                            Nome do Funil *
                          </label>
                          <input
                            type="text"
                            required
                            value={editPipeName}
                            onChange={(e) => setEditPipeName(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                            Descrição
                          </label>
                          <input
                            type="text"
                            value={editPipeDesc}
                            onChange={(e) => setEditPipeDesc(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingPipeInfo(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-[#147A80] text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar Alterações</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Add / Edit Stage Form */}
                <form
                  onSubmit={handleSaveStage}
                  className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <Columns3 className="w-4 h-4 text-[#147A80]" />
                      <span>
                        {editingStageId
                          ? 'Editar Etapa Selecionada'
                          : 'Adicionar Nova Etapa (Coluna Kanban)'}
                      </span>
                    </h4>
                    {editingStageId && (
                      <button
                        type="button"
                        onClick={resetStageForm}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Stage Name */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Nome da Coluna / Etapa *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Aguardando Exames, Em Negociação..."
                        value={stageTitle}
                        onChange={(e) => setStageTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>

                    {/* Stage Behavior / Kind */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Comportamento no Funil
                      </label>
                      <select
                        value={stageKind}
                        onChange={(e) => setStageKind(e.target.value as CRMStageKind)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#147A80]"
                      >
                        <option value="active">🔵 Em Aberto / Negociação</option>
                        <option value="scheduled">📅 Agendado na Agenda</option>
                        <option value="won">✅ Ganho / Convertido (R$)</option>
                        <option value="lost">❌ Perdido / Arquivado</option>
                      </select>
                    </div>

                    {/* Stage Color Theme */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Cor da Coluna
                      </label>
                      <select
                        value={stageColorId}
                        onChange={(e) => setStageColorId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#147A80]"
                      >
                        {CRM_STAGE_COLOR_PRESETS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Emoji Icon Picker + Submit */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase text-slate-400 mr-1">
                        Ícone:
                      </span>
                      {STAGE_ICONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setStageIcon(ic)}
                          className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                            stageIcon === ic
                              ? 'bg-[#147A80] text-white scale-110 shadow-2xs'
                              : 'bg-white border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {editingStageId ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Atualizar Etapa</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Etapa</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Stages Ordered List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                      Colunas do Kanban na Ordem de Exibição ({currentPipeline.stages.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Use as setas para reordenar as colunas
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentPipeline.stages.map((stg, index) => {
                      const kindMeta = KIND_LABELS[stg.kind || 'active'];
                      return (
                        <div
                          key={stg.id}
                          className={`bg-white rounded-2xl p-3 border border-slate-200 border-l-4 ${stg.color} flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-all`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-black text-[11px] flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-base">{stg.icon || '📌'}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {stg.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${kindMeta.badge}`}
                                >
                                  {kindMeta.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">{kindMeta.desc}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveStage(stg.id, 'left')}
                              title="Mover para antes (esquerda)"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={index === currentPipeline.stages.length - 1}
                              onClick={() => handleMoveStage(stg.id, 'right')}
                              title="Mover para depois (direita)"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditStage(stg)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-[#147A80] hover:border-teal-300 hover:bg-teal-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStage(stg)}
                              disabled={currentPipeline.stages.length <= 1}
                              title="Excluir Etapa"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Todas as alterações são salvas automaticamente no navegador.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer"
          >
            Concluir e Voltar ao Kanban
          </button>
        </div>
      </div>
    </div>
  );
};
