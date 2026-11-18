import React, { useState, useEffect, useMemo } from 'react';
import {
  CRMLabel,
  CRMLeadOpportunity,
  CRMMessageTemplate,
  CRMPipeline,
  CRMPipelineColor,
  CRMSummaryStats,
  CRMType,
} from '../../types/crm';
import { CRMService } from '../../services/crmService';
import { dataService } from '../../services/dataService';
import { Clinic, Dentist, Patient, Appointment, AppUserContext } from '../../types/database';
import { CRMLeadCard } from './CRMLeadCard';
import { CRMQuickContactModal } from './CRMQuickContactModal';
import { CRMNewOpportunityModal } from './CRMNewOpportunityModal';
import { CRMPipelineManagerModal } from './CRMPipelineManagerModal';
import { CRMLeadDrawer } from './CRMLeadDrawer';
import { CRMQuickScheduleModal } from './CRMQuickScheduleModal';
import { CRMLostReasonModal } from './CRMLostReasonModal';
import {
  X,
  RefreshCw,
  Plus,
  MessageSquare,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Edit2,
  FileText,
  BarChart3,
  Lock,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface MiniCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  dentists: Dentist[];
  patients: Patient[];
  appointments: Appointment[];
  userContext: AppUserContext;
  selectedClinicIdFilter?: number | 'all';
  onAppointmentCreatedFromCRM?: (appointment: Appointment) => void;
}

const STAGE_DOT_COLOR: Record<CRMPipelineColor, string> = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-[#147A80]',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
};

export const MiniCRMModal: React.FC<MiniCRMModalProps> = ({
  isOpen,
  onClose,
  clinics,
  dentists,
  patients,
  appointments,
  userContext,
  selectedClinicIdFilter = 'all',
  onAppointmentCreatedFromCRM,
}) => {
  const [pipelines, setPipelines] = useState<CRMPipeline[]>(() => CRMService.getPipelines());
  const [labels, setLabels] = useState<CRMLabel[]>(() => CRMService.getLabels());
  const [activeView, setActiveView] = useState<'pipeline' | 'templates' | 'dashboard'>('pipeline');
  const [activePipelineId, setActivePipelineId] = useState<string>('recall_6m');

  const [opportunities, setOpportunities] = useState<CRMLeadOpportunity[]>([]);
  const [templates, setTemplates] = useState<CRMMessageTemplate[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | 'all'>(selectedClinicIdFilter);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<CRMType | 'all'>('all');
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>('all');
  const [onlyFollowUpsFilter, setOnlyFollowUpsFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Sub-modals & Drawer
  const [quickContactOpp, setQuickContactOpp] = useState<CRMLeadOpportunity | null>(null);
  const [quickScheduleOpp, setQuickScheduleOpp] = useState<CRMLeadOpportunity | null>(null);
  const [drawerOppId, setDrawerOppId] = useState<string | null>(null);
  const [pendingLostTransition, setPendingLostTransition] = useState<{
    opp: CRMLeadOpportunity;
    targetStageId: string;
  } | null>(null);
  const [isNewOppModalOpen, setIsNewOppModalOpen] = useState(false);
  const [isPipelineManagerOpen, setIsPipelineManagerOpen] = useState(false);

  // Quick 1-line free capture bar
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [qcName, setQcName] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcNote, setQcNote] = useState('');
  const [qcClinicId, setQcClinicId] = useState<number>(
    typeof selectedClinicIdFilter === 'number' ? selectedClinicIdFilter : clinics[0]?.id || 1
  );

  // Drag & Drop state
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Template editing
  const [editingTemplate, setEditingTemplate] = useState<CRMMessageTemplate | null>(null);
  const [tplTitle, setTplTitle] = useState('');
  const [tplContent, setTplContent] = useState('');
  const [tplCategory, setTplCategory] = useState<CRMMessageTemplate['category']>('recall');

  // Sync / feedback state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 4000);
  };

  useEffect(() => {
    if (isOpen) {
      loadCRMData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClinicIdFilter !== undefined) {
      setSelectedClinicId(selectedClinicIdFilter);
    }
  }, [selectedClinicIdFilter]);

  const loadCRMData = async () => {
    setOpportunities(CRMService.getOpportunities());
    setTemplates(CRMService.getTemplates());
    setPipelines(CRMService.getPipelines());
    setLabels(CRMService.getLabels());

    const [supaPipelines, supaLabels, supaOpps] = await Promise.all([
      CRMService.fetchPipelinesFromSupabase(),
      CRMService.fetchLabelsFromSupabase(),
      CRMService.fetchFromSupabase(),
    ]);
    setPipelines(supaPipelines);
    setLabels(supaLabels);
    setOpportunities(supaOpps);

    if (!supaPipelines.some((p) => p.id === activePipelineId) && supaPipelines[0]) {
      setActivePipelineId(supaPipelines[0].id);
    }
  };

  const activePipeline = useMemo(
    () => pipelines.find((p) => p.id === activePipelineId) || pipelines[0],
    [pipelines, activePipelineId]
  );

  const drawerOpp = useMemo(
    () => opportunities.find((o) => o.id === drawerOppId) || null,
    [opportunities, drawerOppId]
  );

  if (!isOpen) return null;

  const hasCRMAccess =
    userContext.role === 'admin_root' ||
    userContext.role === 'admin' ||
    userContext.role === 'admin_clinica' ||
    userContext.role === 'gerente_atendimento' ||
    userContext.permissions?.canAccessCRM === true;

  if (!hasCRMAccess) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
          <div className="w-11 h-11 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Acesso Restrito ao CRM</h3>
          <p className="text-xs text-slate-600">
            Seu perfil ({userContext.role}) não possui autorização para acessar o módulo CRM.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const currentUserName = userContext.userName || 'Recepção Bertuol';

  const handleRefreshFromSupabase = async () => {
    setIsSyncing(true);
    const [supaPipelines, supaOpps] = await Promise.all([
      CRMService.fetchPipelinesFromSupabase(),
      CRMService.fetchFromSupabase(),
    ]);
    CRMService.syncAutomaticRecalls(patients, appointments, clinics);
    const merged = CRMService.getOpportunities();
    setPipelines(supaPipelines);
    setOpportunities(merged.length > supaOpps.length ? merged : supaOpps);
    setIsSyncing(false);
    showToast(`Dados sincronizados com sucesso (${supaOpps.length} registros ativos no CRM).`);
  };

  const handleCreateOpportunity = (
    data: Omit<CRMLeadOpportunity, 'id' | 'createdAt' | 'updatedAt' | 'labels' | 'contactAttempts'> & {
      labels?: string[];
    }
  ) => {
    const created = CRMService.addOpportunity(data);
    setOpportunities(CRMService.getOpportunities());
    setActivePipelineId(created.pipelineId);
    setActiveView('pipeline');
    showToast(`Lead "${created.patientName}" criado e sincronizado no Supabase.`);
  };

  const handleStageChangeRequest = (opp: CRMLeadOpportunity, targetStageId: string) => {
    const semantic = CRMService.resolveStageSemantic(activePipeline, targetStageId);
    if (semantic === 'lost') {
      setPendingLostTransition({ opp, targetStageId });
      return;
    }
    CRMService.updateStage(opp.id, targetStageId);
    setOpportunities(CRMService.getOpportunities());
  };

  const handleConfirmLost = (oppId: string, stageId: string, reason: string, extraNote?: string) => {
    CRMService.updateStage(oppId, stageId, { lostReason: reason });
    if (extraNote) {
      CRMService.addNoteToOpportunity(oppId, `Perda (${reason}): ${extraNote}`, currentUserName);
    }
    setOpportunities(CRMService.getOpportunities());
    showToast('Motivo de perda registrado no CRM.');
  };

  const handleConfirmQuickSchedule = (payload: {
    opportunity: CRMLeadOpportunity;
    clinicId: number;
    dentistId: number;
    dateKey: string;
    fromTime: string;
    toTime: string;
    procedures: string;
    notes: string;
  }) => {
    const newAppt = dataService.addAppointmentFromCRM({
      patientName: payload.opportunity.patientName,
      patientPhone: payload.opportunity.patientPhone,
      clinicId: payload.clinicId,
      dentistId: payload.dentistId,
      dateKey: payload.dateKey,
      fromTime: payload.fromTime,
      toTime: payload.toTime,
      procedures: payload.procedures,
      notes: payload.notes,
    });

    const oppPipeline = pipelines.find((p) => p.id === payload.opportunity.pipelineId) || activePipeline;
    const scheduledStageId = CRMService.getStageIdBySemantic(oppPipeline, 'scheduled');

    CRMService.updateStage(payload.opportunity.id, scheduledStageId, {
      scheduledAppointmentId: newAppt.id,
      scheduledDate: payload.dateKey,
      scheduledTime: payload.fromTime,
    });
    CRMService.addNoteToOpportunity(
      payload.opportunity.id,
      `Consulta agendada para ${payload.dateKey} às ${payload.fromTime} (${newAppt.dentist_name}).`,
      currentUserName
    );

    setOpportunities(CRMService.getOpportunities());
    if (onAppointmentCreatedFromCRM) {
      onAppointmentCreatedFromCRM(newAppt);
    }
    showToast(`Consulta de ${payload.opportunity.patientName} agendada para ${payload.dateKey} às ${payload.fromTime}.`);
  };

  const handleDeleteOpportunity = (id: string) => {
    CRMService.deleteOpportunity(id);
    setOpportunities(CRMService.getOpportunities());
  };

  // Pipeline CRUD Handlers
  const handleSavePipeline = (pipeline: CRMPipeline) => {
    const updated = CRMService.savePipeline(pipeline);
    setPipelines(updated);
    setActivePipelineId(pipeline.id);
    showToast(`Funil "${pipeline.name}" salvo e sincronizado.`);
  };

  const handleDeletePipeline = (pipelineId: string): { error?: string } => {
    const res = CRMService.deletePipeline(pipelineId);
    if (!res.error) {
      setPipelines(res.pipelines);
      if (activePipelineId === pipelineId && res.pipelines[0]) {
        setActivePipelineId(res.pipelines[0].id);
      }
      showToast('Funil arquivado.');
    }
    return { error: res.error };
  };

  // Notes & Labels Handlers
  const handleAddNote = (oppId: string, text: string, author: string) => {
    CRMService.addNoteToOpportunity(oppId, text, author);
    setOpportunities(CRMService.getOpportunities());
  };

  const handleToggleLabel = (oppId: string, labelId: string) => {
    CRMService.toggleOpportunityLabel(oppId, labelId);
    setOpportunities(CRMService.getOpportunities());
  };

  const handleCreateLabel = (name: string, color: CRMLabel['color']) => {
    const updated = CRMService.addLabel(name, color);
    setLabels(updated);
  };

  const handleDeleteLabel = (labelId: string) => {
    const updated = CRMService.deleteLabel(labelId);
    setLabels(updated);
    if (selectedLabelFilter === labelId) setSelectedLabelFilter('all');
  };

  const handleSaveOpportunityDrawer = (oppId: string, updates: Partial<CRMLeadOpportunity>) => {
    CRMService.updateOpportunity(oppId, updates);
    setOpportunities(CRMService.getOpportunities());
    showToast('Ficha atualizada e sincronizada.');
  };

  const handleQuickCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcName.trim() || !activePipeline) return;
    const firstStageId = activePipeline.stages[0]?.id || 'new';
    const inferredType =
      activePipeline.id === 'budgets'
        ? 'treatment_pending'
        : activePipeline.id === 'recall_6m'
        ? 'recall_6m'
        : 'whatsapp_lead';

    const created = CRMService.addOpportunity({
      pipelineId: activePipeline.id,
      patientName: qcName.trim(),
      primeiroNome: qcName.trim().split(' ')[0],
      patientPhone: qcPhone.trim() || 'Sem telefone',
      clinicId: Number(qcClinicId),
      type: inferredType,
      stage: firstStageId,
      priority: 'medium',
      dentistName: 'Sem preferência',
      treatmentDescription: qcNote.trim() || 'Atendimento rápido (ficha livre)',
      estimatedValue: 0,
      pointsBonus: activePipeline.defaultPointsBonus ?? 50,
      assignedUser: currentUserName,
      notes: qcNote.trim(),
      source: 'Captura Rápida',
    });
    setOpportunities(CRMService.getOpportunities());
    setQcName('');
    setQcPhone('');
    setQcNote('');
    setIsQuickCaptureOpen(false);
    showToast(`"${created.patientName}" adicionado em ${activePipeline.name}.`);
  };

  const handleDragStartCard = (e: React.DragEvent, oppId: string) => {
    setDraggedOppId(oppId);
    e.dataTransfer.setData('text/plain', oppId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnStage = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain') || draggedOppId;
    setDraggedOppId(null);
    setDragOverStageId(null);
    if (!oppId) return;
    const opp = opportunities.find((o) => o.id === oppId);
    if (opp && opp.stage !== targetStageId) {
      handleStageChangeRequest(opp, targetStageId);
    }
  };

  const handleMovePipeline = (oppId: string, targetPipelineId: string) => {
    CRMService.moveOpportunityToPipeline(oppId, targetPipelineId);
    setOpportunities(CRMService.getOpportunities());
    const targetName = pipelines.find((p) => p.id === targetPipelineId)?.name || 'outro funil';
    showToast(`Paciente transferido para "${targetName}".`);
  };

  // Pipeline-scoped opportunities & filters
  const pipelineOpps = opportunities.filter((o) => o.pipelineId === activePipeline?.id);

  const filteredOpps = pipelineOpps.filter((o) => {
    const matchesClinic = selectedClinicId === 'all' || o.clinicId === selectedClinicId;
    const matchesType = selectedTypeFilter === 'all' || o.type === selectedTypeFilter;
    const matchesLabel =
      selectedLabelFilter === 'all' || (o.labels && o.labels.includes(selectedLabelFilter));

    const isUrgent =
      CRMService.isFollowUpDue(o, activePipeline) || CRMService.isSLAAlert(o, activePipeline);
    const matchesFollowUp = !onlyFollowUpsFilter || isUrgent;

    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      o.patientName.toLowerCase().includes(q) ||
      o.patientPhone.includes(searchQuery) ||
      (o.treatmentDescription && o.treatmentDescription.toLowerCase().includes(q)) ||
      (o.dentistName && o.dentistName.toLowerCase().includes(q)) ||
      (o.notes && o.notes.toLowerCase().includes(q));

    return matchesClinic && matchesType && matchesLabel && matchesFollowUp && matchesQuery;
  });

  const stats: CRMSummaryStats = CRMService.getStats(
    opportunities,
    selectedClinicId,
    activePipeline?.id,
    pipelines
  );

  const globalStats: CRMSummaryStats = CRMService.getStats(
    opportunities,
    selectedClinicId,
    undefined,
    pipelines
  );

  const urgentCount = pipelineOpps.filter(
    (o) =>
      (selectedClinicId === 'all' || o.clinicId === selectedClinicId) &&
      (CRMService.isFollowUpDue(o, activePipeline) || CRMService.isSLAAlert(o, activePipeline))
  ).length;

  // Loss reasons breakdown for dashboard
  const lostLeads = opportunities.filter((o) => {
    const p = pipelines.find((pl) => pl.id === o.pipelineId);
    const matchesClinic = selectedClinicId === 'all' || o.clinicId === selectedClinicId;
    return matchesClinic && CRMService.resolveStageSemantic(p, o.stage) === 'lost';
  });

  const lossBreakdown = Object.entries(
    lostLeads.reduce<Record<string, number>>((acc, curr) => {
      const reason = curr.lostReason || 'Motivo não informado';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  // Template Actions
  const handleSaveTemplate = () => {
    if (!tplTitle.trim() || !tplContent.trim()) return;
    if (editingTemplate) {
      CRMService.updateTemplate(editingTemplate.id, {
        title: tplTitle.trim(),
        content: tplContent.trim(),
        category: tplCategory,
      });
    } else {
      CRMService.addTemplate({
        title: tplTitle.trim(),
        content: tplContent.trim(),
        category: tplCategory,
        variables: ['nome', 'doutor', 'clinica', 'pontos'],
      });
    }
    setEditingTemplate(null);
    setTplTitle('');
    setTplContent('');
    setTemplates(CRMService.getTemplates());
  };

  const handleDeleteTemplate = (id: string) => {
    CRMService.deleteTemplate(id);
    setTemplates(CRMService.getTemplates());
  };

  const startEditTemplate = (tpl: CRMMessageTemplate) => {
    setEditingTemplate(tpl);
    setTplTitle(tpl.title);
    setTplContent(tpl.content);
    setTplCategory(tpl.category);
  };

  const pipelineStages = activePipeline?.stages || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 rounded-2xl w-full max-w-[1440px] h-[95vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* 1. Clean Clinical Single-Row Header */}
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-5 min-w-0">
            <h2 className="font-bold text-base tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              CRM Bertuol
            </h2>

            {/* View Switchers (Pipelines + Templates + Reports) */}
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar">
              {pipelines.map((pl) => {
                const isActive = activeView === 'pipeline' && activePipeline?.id === pl.id;
                const count = opportunities.filter((o) => {
                  const matchesClinic = selectedClinicId === 'all' || o.clinicId === selectedClinicId;
                  const sem = CRMService.resolveStageSemantic(pl, o.stage);
                  return matchesClinic && o.pipelineId === pl.id && sem !== 'converted' && sem !== 'lost';
                }).length;

                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => {
                      setActivePipelineId(pl.id);
                      setActiveView('pipeline');
                    }}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#147A80] text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{pl.name}</span>
                    <span
                      className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              <span className="h-4 w-px bg-slate-200 mx-1 shrink-0" aria-hidden="true" />

              <button
                type="button"
                onClick={() => setActiveView('templates')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'templates'
                    ? 'bg-[#147A80] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Modelos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'dashboard'
                    ? 'bg-[#147A80] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Relatórios</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPipelineManagerOpen(true)}
              title="Criar, editar ou reorganizar funis comerciais"
              className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Gerenciar Funis</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshFromSupabase}
              disabled={isSyncing}
              title="Sincronizar com Supabase"
              className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewOppModalOpen(true)}
              className="h-8 flex items-center gap-1.5 px-3.5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fechar CRM"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile/Tablet Navigation Strip */}
        <div className="lg:hidden bg-slate-50 px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 shrink-0">
          {pipelines.map((pl) => {
            const isActive = activeView === 'pipeline' && activePipeline?.id === pl.id;
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => {
                  setActivePipelineId(pl.id);
                  setActiveView('pipeline');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-[#147A80] text-white border-[#147A80]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {pl.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveView('templates')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer border ${
              activeView === 'templates'
                ? 'bg-[#147A80] text-white border-[#147A80]'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            Modelos
          </button>
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer border ${
              activeView === 'dashboard'
                ? 'bg-[#147A80] text-white border-[#147A80]'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            Relatórios
          </button>
        </div>

        {/* Toast Notification */}
        {syncToast && (
          <div className="bg-teal-50 border-b border-teal-200 px-5 py-2 text-xs font-semibold text-[#0f5c61] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#147A80]" />
              <span>{syncToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncToast(null)}
              className="text-[#147A80] hover:underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* 2. Clean Clinical KPI Strip */}
        <div className="bg-white border-b border-slate-200 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 shrink-0">
          <div className="px-5 py-2.5 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                {activeView === 'pipeline' ? 'Fila do funil' : 'Fila global ativa'}
              </span>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {activeView === 'pipeline' ? stats.totalActive : globalStats.totalActive} leads
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums">
              R${' '}
              {(activeView === 'pipeline'
                ? stats.totalPipelineValue
                : globalStats.totalPipelineValue
              ).toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="px-5 py-2.5 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Follow-ups e SLA
              </span>
              <span className="text-base font-bold text-amber-700 tabular-nums">
                {activeView === 'pipeline' ? stats.totalFollowUpsDue : globalStats.totalFollowUpsDue}{' '}
                pendentes
              </span>
            </div>
            <span
              className={`text-xs font-semibold tabular-nums ${
                (activeView === 'pipeline' ? stats.totalSLAAlert : globalStats.totalSLAAlert) > 0
                  ? 'text-rose-700'
                  : 'text-slate-400'
              }`}
            >
              {activeView === 'pipeline' ? stats.totalSLAAlert : globalStats.totalSLAAlert} SLA &gt;48h
            </span>
          </div>

          <div className="px-5 py-2.5 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Agendados na grade
              </span>
              <span className="text-base font-bold text-[#147A80] tabular-nums">
                {activeView === 'pipeline' ? stats.totalScheduled : globalStats.totalScheduled}{' '}
                consultas
              </span>
            </div>
            <span className="text-xs text-slate-500">1-clique agenda</span>
          </div>

          <div className="px-5 py-2.5 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Receita convertida
              </span>
              <span className="text-base font-bold text-emerald-700 font-mono tabular-nums">
                R${' '}
                {(activeView === 'pipeline'
                  ? stats.convertedRevenueMonth
                  : globalStats.convertedRevenueMonth
                ).toLocaleString('pt-BR')}
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 tabular-nums">
              {activeView === 'pipeline' ? stats.totalConvertedMonth : globalStats.totalConvertedMonth}{' '}
              ganhos
            </span>
          </div>
        </div>

        {/* 3. Filter Toolbar (When viewing Pipeline) */}
        {activeView === 'pipeline' && (
          <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <input
                  type="text"
                  placeholder="Buscar paciente, telefone ou nota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg pl-8 pr-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="button"
                onClick={() => setOnlyFollowUpsFilter((v) => !v)}
                className={`h-9 flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  onlyFollowUpsFilter
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Follow-ups / SLA</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                    onlyFollowUpsFilter ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {urgentCount}
                </span>
              </button>

              <select
                value={selectedClinicId}
                onChange={(e) =>
                  setSelectedClinicId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="h-9 bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              >
                <option value="all">Todas Clínicas</option>
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
              </select>

              <select
                value={selectedLabelFilter}
                onChange={(e) => setSelectedLabelFilter(e.target.value)}
                className="h-9 bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                title="Filtrar por Rótulo"
              >
                <option value="all">Todos os Rótulos</option>
                {labels.map((lbl) => (
                  <option key={lbl.id} value={lbl.id}>
                    {lbl.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as CRMType | 'all')}
                className="h-9 bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                title="Filtrar por Tipo de Origem"
              >
                <option value="all">Todos os Tipos</option>
                <option value="recall_6m">Recall 6+ Meses</option>
                <option value="whatsapp_lead">Lead WhatsApp</option>
                <option value="treatment_pending">Orçamento Aberto</option>
                <option value="indication">Indicação</option>
                <option value="other">Outra Oportunidade</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen((v) => !v)}
                className={`h-9 flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  isQuickCaptureOpen
                    ? 'bg-[#147A80] text-white border-[#147A80]'
                    : 'bg-teal-50 text-[#147A80] border-teal-200 hover:bg-teal-100'
                }`}
                title="Adicionar lead rapidamente em 1 linha livre"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastro Rápido</span>
              </button>

              <div className="h-9 flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  title="Modo Kanban"
                  className={`h-full px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'kanban' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Modo Lista"
                  className={`h-full px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Lista</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50">
          {activeView === 'pipeline' && activePipeline && (
            <div className="space-y-3 h-full flex flex-col">
              {/* Pipeline Operational Note Banner */}
              {activePipeline.description && (
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-600 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Info className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
                    <p className="truncate">
                      <strong className="text-slate-800">Nota do Funil:</strong> {activePipeline.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPipelineManagerOpen(true)}
                    className="text-[11px] font-semibold text-[#147A80] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Editar funil
                  </button>
                </div>
              )}

              {/* 1-Line Quick Free-Form Capture Bar */}
              {isQuickCaptureOpen && (
                <form
                  onSubmit={handleQuickCaptureSubmit}
                  className="bg-white border border-[#147A80]/40 rounded-xl p-3 shadow-xs flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    required
                    autoFocus
                    value={qcName}
                    onChange={(e) => setQcName(e.target.value)}
                    placeholder="Nome ou @ do contato *"
                    className="flex-1 min-w-[160px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                  />
                  <input
                    type="text"
                    value={qcPhone}
                    onChange={(e) => setQcPhone(e.target.value)}
                    placeholder="WhatsApp / Contato"
                    className="w-full sm:w-40 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                  />
                  <input
                    type="text"
                    value={qcNote}
                    onChange={(e) => setQcNote(e.target.value)}
                    placeholder="Interesse / Anotação livre (ex: Implantes, prefere tarde)..."
                    className="flex-[2] min-w-[220px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                  />
                  <select
                    value={qcClinicId}
                    onChange={(e) => setQcClinicId(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    {clinics
                      .filter((c) => c.active)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.shortName}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    Salvar em {activePipeline.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQuickCaptureOpen(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Fechar
                  </button>
                </form>
              )}

              {viewMode === 'kanban' ? (
                <div
                  className="grid gap-3.5 items-start pb-2 overflow-x-auto flex-1"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(pipelineStages.length, 1)}, minmax(250px, 1fr))`,
                  }}
                >
                  {pipelineStages.map((stg) => {
                    const stageOpps = filteredOpps.filter((o) => o.stage === stg.id);
                    const stageSum = stageOpps.reduce((acc, cur) => acc + (cur.estimatedValue || 0), 0);
                    const isDropTarget = dragOverStageId === stg.id;

                    return (
                      <div
                        key={stg.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverStageId !== stg.id) setDragOverStageId(stg.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverStageId === stg.id) setDragOverStageId(null);
                        }}
                        onDrop={(e) => handleDropOnStage(e, stg.id)}
                        className={`rounded-xl p-2.5 flex flex-col max-h-[68vh] transition-all border ${
                          isDropTarget
                            ? 'bg-teal-50/70 border-[#147A80] ring-2 ring-[#147A80]/30'
                            : 'bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                STAGE_DOT_COLOR[stg.color] || 'bg-slate-400'
                              }`}
                            />
                            <h3 className="font-bold text-slate-800 text-xs truncate" title={stg.title}>
                              {stg.title}
                            </h3>
                            <span className="text-[11px] font-mono font-bold text-slate-500 tabular-nums">
                              {stageOpps.length}
                            </span>
                          </div>

                          {stageSum > 0 && (
                            <span className="text-[11px] font-mono font-semibold text-slate-600 tabular-nums shrink-0">
                              R$ {stageSum.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>

                        <div className="overflow-y-auto space-y-2.5 pr-0.5 min-h-[80px]">
                          {stageOpps.length === 0 ? (
                            <div className="bg-white/60 border border-dashed border-slate-200 rounded-lg p-4 text-center text-xs text-slate-400">
                              {draggedOppId ? 'Solte o card aqui' : 'Sem leads nesta etapa'}
                            </div>
                          ) : (
                            stageOpps.map((opp) => (
                              <CRMLeadCard
                                key={opp.id}
                                opportunity={opp}
                                clinics={clinics}
                                pipelineStages={pipelineStages}
                                allLabels={labels}
                                isFollowUpDue={CRMService.isFollowUpDue(opp, activePipeline)}
                                isFollowUpOverdue={CRMService.isFollowUpOverdue(opp, activePipeline)}
                                slaDaysStale={CRMService.getSLADaysStale(opp, activePipeline)}
                                onOpenQuickContact={(o) => setQuickContactOpp(o)}
                                onOpenQuickSchedule={(o) => setQuickScheduleOpp(o)}
                                onOpenDrawer={(o) => setDrawerOppId(o.id)}
                                onUpdateStage={handleStageChangeRequest}
                                onDelete={handleDeleteOpportunity}
                                onDragStartCard={handleDragStartCard}
                                viewMode="kanban"
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredOpps.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-xs">
                      Nenhuma oportunidade encontrada neste filtro.
                    </div>
                  ) : (
                    filteredOpps.map((opp) => (
                      <CRMLeadCard
                        key={opp.id}
                        opportunity={opp}
                        clinics={clinics}
                        pipelineStages={pipelineStages}
                        allLabels={labels}
                        isFollowUpDue={CRMService.isFollowUpDue(opp, activePipeline)}
                        isFollowUpOverdue={CRMService.isFollowUpOverdue(opp, activePipeline)}
                        slaDaysStale={CRMService.getSLADaysStale(opp, activePipeline)}
                        onOpenQuickContact={(o) => setQuickContactOpp(o)}
                        onOpenQuickSchedule={(o) => setQuickScheduleOpp(o)}
                        onOpenDrawer={(o) => setDrawerOppId(o.id)}
                        onUpdateStage={handleStageChangeRequest}
                        onDelete={handleDeleteOpportunity}
                        viewMode="list"
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: MODELOS DE MENSAGENS */}
          {activeView === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs h-fit">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#147A80]" />
                  <span>{editingTemplate ? 'Editar Modelo' : 'Novo Modelo de Mensagem'}</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Recall Profilaxia Semestral"
                      value={tplTitle}
                      onChange={(e) => setTplTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Categoria
                    </label>
                    <select
                      value={tplCategory}
                      onChange={(e) => setTplCategory(e.target.value as CRMMessageTemplate['category'])}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2"
                    >
                      <option value="recall">Recall Preventivo</option>
                      <option value="budget">Orçamento e Fechamento</option>
                      <option value="welcome">Boas-Vindas Lead WhatsApp</option>
                      <option value="points">Clube Sorriso Pontos</option>
                      <option value="post_op">Pós-Operatório</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Conteúdo *
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Use {nome}, {doutor}, {clinica}, {pontos}."
                      value={tplContent}
                      onChange={(e) => setTplContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {['{nome}', '{doutor}', '{clinica}', '{pontos}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setTplContent((prev) => `${prev} ${v}`)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold cursor-pointer"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    {editingTemplate && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(null);
                          setTplTitle('');
                          setTplContent('');
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="flex-1 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs cursor-pointer"
                    >
                      {editingTemplate ? 'Atualizar Modelo' : 'Salvar Modelo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  Modelos Cadastrados ({templates.length})
                </h3>

                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{tpl.title}</h4>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {tpl.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {tpl.content}
                    </p>

                    <div className="flex items-center justify-end gap-2 text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => startEditTemplate(tpl)}
                        className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#147A80] hover:bg-teal-50 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RELATÓRIOS & CONVERSÃO */}
          {activeView === 'dashboard' && (
            <div className="space-y-5">
              {/* Performance by Pipeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm mb-3">
                  Desempenho por Funil Comercial
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 px-3">Funil</th>
                        <th className="py-2.5 px-3 text-right">Leads ativos</th>
                        <th className="py-2.5 px-3 text-right">Follow-ups / SLA</th>
                        <th className="py-2.5 px-3 text-right">Agendados</th>
                        <th className="py-2.5 px-3 text-right">Convertidos</th>
                        <th className="py-2.5 px-3 text-right">Em negociação (R$)</th>
                        <th className="py-2.5 px-3 text-right">Convertido (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {pipelines.map((pl) => {
                        const plStats = CRMService.getStats(opportunities, selectedClinicId, pl.id, pipelines);
                        return (
                          <tr key={pl.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{pl.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                              {plStats.totalActive}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700 font-semibold">
                              {plStats.totalFollowUpsDue + plStats.totalSLAAlert}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-indigo-700 font-semibold">
                              {plStats.totalScheduled}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                              {plStats.totalConvertedMonth}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                              R$ {plStats.totalPipelineValue.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                              R$ {plStats.convertedRevenueMonth.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Performance by Unit */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-3">
                    Desempenho por Unidade
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-2.5 px-3">Unidade</th>
                          <th className="py-2.5 px-3 text-right">Ativos</th>
                          <th className="py-2.5 px-3 text-right">Agendados</th>
                          <th className="py-2.5 px-3 text-right">Convertidos</th>
                          <th className="py-2.5 px-3 text-right">Faturamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {clinics
                          .filter((c) => c.active)
                          .map((clinic) => {
                            const cStats = CRMService.getStats(opportunities, clinic.id, undefined, pipelines);
                            return (
                              <tr key={clinic.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold text-slate-900">{clinic.shortName}</td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                  {cStats.totalActive}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-indigo-700 font-semibold">
                                  {cStats.totalScheduled}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                                  {cStats.totalConvertedMonth}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                                  R$ {cStats.convertedRevenueMonth.toLocaleString('pt-BR')}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Loss Reasons Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Ranking de Motivos de Perda
                    </h3>
                    <span className="text-xs text-slate-500 tabular-nums">
                      Total perdido: {lostLeads.length}
                    </span>
                  </div>

                  {lossBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      Nenhum lead marcado como perdido até o momento.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {lossBreakdown.map(([reason, count]) => {
                        const pct = Math.round((count / Math.max(lostLeads.length, 1)) * 100);
                        return (
                          <div key={reason} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800">{reason}</span>
                              <span className="font-mono tabular-nums text-slate-600 font-semibold">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      <CRMQuickContactModal
        isOpen={Boolean(quickContactOpp)}
        onClose={() => setQuickContactOpp(null)}
        opportunity={quickContactOpp}
        templates={templates}
        clinics={clinics}
        activePipeline={activePipeline}
        onAfterSend={() => {
          setOpportunities(CRMService.getOpportunities());
        }}
      />

      <CRMQuickScheduleModal
        isOpen={Boolean(quickScheduleOpp)}
        onClose={() => setQuickScheduleOpp(null)}
        opportunity={quickScheduleOpp}
        clinics={clinics}
        dentists={dentists}
        onConfirmSchedule={handleConfirmQuickSchedule}
      />

      <CRMLeadDrawer
        isOpen={Boolean(drawerOpp)}
        onClose={() => setDrawerOppId(null)}
        opportunity={drawerOpp}
        clinics={clinics}
        dentists={dentists}
        pipelines={pipelines}
        labels={labels}
        currentUserName={currentUserName}
        onSaveOpportunity={handleSaveOpportunityDrawer}
        onStageChangeRequest={handleStageChangeRequest}
        onMovePipeline={handleMovePipeline}
        onAddNote={handleAddNote}
        onToggleLabel={handleToggleLabel}
        onCreateLabel={handleCreateLabel}
        onDeleteLabel={handleDeleteLabel}
        onOpenQuickContact={(o) => setQuickContactOpp(o)}
        onOpenQuickSchedule={(o) => setQuickScheduleOpp(o)}
      />

      <CRMLostReasonModal
        isOpen={Boolean(pendingLostTransition)}
        onClose={() => setPendingLostTransition(null)}
        opportunity={pendingLostTransition?.opp || null}
        targetStageId={pendingLostTransition?.targetStageId || 'lost'}
        onConfirmLost={handleConfirmLost}
      />

      <CRMPipelineManagerModal
        isOpen={isPipelineManagerOpen}
        onClose={() => setIsPipelineManagerOpen(false)}
        pipelines={pipelines}
        onSavePipeline={handleSavePipeline}
        onDeletePipeline={handleDeletePipeline}
      />

      <CRMNewOpportunityModal
        isOpen={isNewOppModalOpen}
        onClose={() => setIsNewOppModalOpen(false)}
        clinics={clinics}
        dentists={dentists}
        pipelines={pipelines}
        labels={labels}
        activePipelineId={activePipeline?.id || 'campaigns'}
        currentUserName={currentUserName}
        onCreate={handleCreateOpportunity}
        defaultClinicId={selectedClinicId}
      />
    </div>
  );
};
