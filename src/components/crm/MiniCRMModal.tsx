import React, { useState, useEffect } from 'react';
import { CRMLeadOpportunity, CRMMessageTemplate, CRMStage, CRMSummaryStats } from '../../types/crm';
import { CRMService } from '../../services/crmService';
import { Clinic, Dentist, Patient, Appointment, AppUserContext } from '../../types/database';
import { CRMLeadCard } from './CRMLeadCard';
import { CRMQuickContactModal } from './CRMQuickContactModal';
import { CRMNewOpportunityModal } from './CRMNewOpportunityModal';
import {
  X,
  Users,
  RefreshCw,
  Plus,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Building2,
  Clock,
  DollarSign,
  CheckCircle2,
  Trash2,
  Edit2,
  FileText,
  AlertCircle,
  BarChart3,
  Award,
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
}

export const MiniCRMModal: React.FC<MiniCRMModalProps> = ({
  isOpen,
  onClose,
  clinics,
  dentists,
  patients,
  appointments,
  userContext,
  selectedClinicIdFilter = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'recall' | 'kanban' | 'templates' | 'dashboard'>('recall');
  const [opportunities, setOpportunities] = useState<CRMLeadOpportunity[]>([]);
  const [templates, setTemplates] = useState<CRMMessageTemplate[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | 'all'>(selectedClinicIdFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modals
  const [quickContactOpp, setQuickContactOpp] = useState<CRMLeadOpportunity | null>(null);
  const [isNewOppModalOpen, setIsNewOppModalOpen] = useState(false);

  // Template editing
  const [editingTemplate, setEditingTemplate] = useState<CRMMessageTemplate | null>(null);
  const [tplTitle, setTplTitle] = useState('');
  const [tplContent, setTplContent] = useState('');
  const [tplCategory, setTplCategory] = useState<CRMMessageTemplate['category']>('recall');

  // Sync state
  const [syncCount, setSyncCount] = useState<number | null>(null);

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

  const loadCRMData = () => {
    const opps = CRMService.getOpportunities();
    const tpls = CRMService.getTemplates();
    setOpportunities(opps);
    setTemplates(tpls);
  };

  if (!isOpen) return null;

  const handleSyncRecalls = () => {
    const added = CRMService.syncAutomaticRecalls(patients, appointments, clinics);
    setSyncCount(added);
    loadCRMData();
    setTimeout(() => setSyncCount(null), 4000);
  };

  const handleCreateOpportunity = (data: Omit<CRMLeadOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => {
    CRMService.addOpportunity(data);
    loadCRMData();
  };

  const handleUpdateStage = (id: string, stage: CRMStage) => {
    CRMService.updateStage(id, stage);
    loadCRMData();
  };

  const handleDeleteOpportunity = (id: string) => {
    if (confirm('Deseja realmente excluir esta oportunidade?')) {
      CRMService.deleteOpportunity(id);
      loadCRMData();
    }
  };

  // Filtered Opportunities
  const filteredOpps = opportunities.filter((o) => {
    const matchesClinic = selectedClinicId === 'all' || o.clinicId === selectedClinicId;
    const matchesQuery =
      searchQuery.trim() === '' ||
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientPhone.includes(searchQuery) ||
      (o.treatmentDescription && o.treatmentDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.dentistName && o.dentistName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesClinic && matchesQuery;
  });

  const stats: CRMSummaryStats = CRMService.getStats(opportunities, selectedClinicId);

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
    loadCRMData();
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Excluir este modelo de mensagem?')) {
      CRMService.deleteTemplate(id);
      loadCRMData();
    }
  };

  const startEditTemplate = (tpl: CRMMessageTemplate) => {
    setEditingTemplate(tpl);
    setTplTitle(tpl.title);
    setTplContent(tpl.content);
    setTplCategory(tpl.category);
  };

  const stages: { id: CRMStage; title: string; color: string; badgeBg: string }[] = [
    { id: 'new', title: 'Novos Leads', color: 'border-blue-400', badgeBg: 'bg-blue-100 text-blue-900' },
    { id: 'contacted', title: 'Em Contato', color: 'border-amber-400', badgeBg: 'bg-amber-100 text-amber-900' },
    { id: 'scheduled', title: 'Agendado', color: 'border-indigo-400', badgeBg: 'bg-indigo-100 text-indigo-900' },
    { id: 'converted', title: 'Convertido', color: 'border-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-900' },
    { id: 'lost', title: 'Perdido', color: 'border-slate-300', badgeBg: 'bg-slate-100 text-slate-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-50 rounded-3xl w-full max-w-7xl h-[94vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Branding Banner */}
        <div className="bg-linear-to-r from-[#0d4f52] via-[#147A80] to-[#199A9F] px-4 sm:px-6 py-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-extrabold shadow-inner">
              <Users className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">
                  Mini-CRM Bertuol
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                  Recall & WhatsApp
                </span>
              </div>
              <p className="text-xs text-teal-100">
                Gestão de Pacientes Inativos, Agendamentos e Oportunidades Integrado ao Clube Sorriso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Sync Recall Button */}
            <button
              onClick={handleSyncRecalls}
              title="Executar varredura automática de pacientes sem consulta há mais de 6 meses"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer hover:scale-102"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-950 animate-spin-hover" />
              <span className="hidden md:inline">Varredura Recall 6+ Meses</span>
              <span className="md:hidden">Varredura</span>
            </button>

            {/* New Lead Button */}
            <button
              onClick={() => setIsNewOppModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync notification toast */}
        {syncCount !== null && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-xs font-extrabold text-amber-950 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                Varredura Inteligente Concluída: {syncCount > 0 ? `${syncCount} novos pacientes inativos (6+ meses) adicionados à fila de recall!` : 'Nenhum novo paciente inativo encontrado. Todos já estão no CRM!'}
              </span>
            </div>
            <button onClick={() => setSyncCount(null)} className="text-amber-800 font-bold hover:underline">
              Fechar
            </button>
          </div>
        )}

        {/* Quick Summary Metrics Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#147A80] text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 block">Leads Ativos</span>
              <span className="text-base font-extrabold text-slate-900">{stats.totalActive}</span>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-800 block">Recall 6+ Meses</span>
              <span className="text-base font-extrabold text-amber-950">{stats.totalRecallDue}</span>
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-800 block">Agendados</span>
              <span className="text-base font-extrabold text-indigo-950">{stats.totalScheduled}</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 block">Convertidos (Mês)</span>
              <span className="text-base font-extrabold text-emerald-950">
                {stats.totalConvertedMonth} (R$ {stats.convertedRevenueMonth.toLocaleString('pt-BR')})
              </span>
            </div>
          </div>
        </div>

        {/* Tab Toolbar & Controls */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('recall')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'recall'
                  ? 'bg-[#147A80] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recall Preventivo (6+m)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                {stats.totalRecallDue}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'kanban'
                  ? 'bg-[#147A80] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline & Oportunidades</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'bg-[#147A80] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Modelos de Mensagens</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#147A80] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Métricas de Conversão</span>
            </button>
          </div>

          {/* Search, Clinic Filter & Kanban/List View toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-48">
              <input
                type="text"
                placeholder="Buscar paciente/tel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Clinic Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedClinicId}
                onChange={(e) =>
                  setSelectedClinicId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl pl-2.5 pr-6 py-2 focus:ring-2 focus:ring-[#147A80] cursor-pointer"
              >
                <option value="all">🏢 Todas Clínicas</option>
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      📍 {c.shortName}
                    </option>
                  ))}
              </select>
            </div>

            {/* View Mode Toggle (only for Kanban tab) */}
            {activeTab === 'kanban' && (
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('kanban')}
                  title="Modo Kanban"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'kanban' ? 'bg-white shadow-xs text-[#147A80]' : 'text-slate-500'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Modo Lista"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-white shadow-xs text-[#147A80]' : 'text-slate-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
          {/* TAB 1: RECALL PREVENTIVO 6+ MESES */}
          {activeTab === 'recall' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-amber-950 text-sm">
                      Pilar 1: Recuperação de Pacientes Inativos (Recall Preventivo)
                    </h3>
                    <p className="text-xs text-amber-800">
                      Pacientes sem consulta há mais de 180 dias recebem convite de retorno com +50 pontos bônus no Clube Sorriso Bertuol.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncRecalls}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs cursor-pointer transition-all hover:scale-102 shrink-0"
                >
                  Executar Nova Varredura
                </button>
              </div>

              {/* Recall List */}
              <div className="space-y-3">
                {filteredOpps.filter((o) => o.type === 'recall_6m').length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-sm">Nenhum recall pendente nesta busca!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Clique em &quot;Executar Nova Varredura&quot; para atualizar com a base de dados mais recente.
                    </p>
                  </div>
                ) : (
                  filteredOpps
                    .filter((o) => o.type === 'recall_6m')
                    .map((opp) => (
                      <CRMLeadCard
                        key={opp.id}
                        opportunity={opp}
                        clinics={clinics}
                        onOpenQuickContact={(o) => setQuickContactOpp(o)}
                        onUpdateStage={handleUpdateStage}
                        onDelete={handleDeleteOpportunity}
                        viewMode="list"
                      />
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PIPELINE & KANBAN */}
          {activeTab === 'kanban' && (
            <div>
              {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start pb-4 overflow-x-auto min-w-[900px]">
                  {stages.map((stg) => {
                    const stageOpps = filteredOpps.filter((o) => o.stage === stg.id);
                    return (
                      <div
                        key={stg.id}
                        className={`bg-slate-200/60 rounded-2xl p-3 border-t-4 ${stg.color} flex flex-col max-h-[75vh]`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                            {stg.title}
                          </h3>
                          <span
                            className={`text-[11px] font-black px-2 py-0.5 rounded-full ${stg.badgeBg}`}
                          >
                            {stageOpps.length}
                          </span>
                        </div>

                        {/* Card List */}
                        <div className="overflow-y-auto space-y-3 pr-1">
                          {stageOpps.length === 0 ? (
                            <div className="bg-white/50 border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
                              Sem leads
                            </div>
                          ) : (
                            stageOpps.map((opp) => (
                              <CRMLeadCard
                                key={opp.id}
                                opportunity={opp}
                                clinics={clinics}
                                onOpenQuickContact={(o) => setQuickContactOpp(o)}
                                onUpdateStage={handleUpdateStage}
                                onDelete={handleDeleteOpportunity}
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
                <div className="space-y-3">
                  {filteredOpps.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-xs">
                      Nenhuma oportunidade encontrada.
                    </div>
                  ) : (
                    filteredOpps.map((opp) => (
                      <CRMLeadCard
                        key={opp.id}
                        opportunity={opp}
                        clinics={clinics}
                        onOpenQuickContact={(o) => setQuickContactOpp(o)}
                        onUpdateStage={handleUpdateStage}
                        onDelete={handleDeleteOpportunity}
                        viewMode="list"
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MODELOS DE MENSAGENS */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Template Form Editor */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#147A80]" />
                  <span>{editingTemplate ? 'Editar Modelo' : 'Cadastrar Novo Modelo'}</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      Título do Modelo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Recall Profilaxia Primavera"
                      value={tplTitle}
                      onChange={(e) => setTplTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={tplCategory}
                      onChange={(e) => setTplCategory(e.target.value as CRMMessageTemplate['category'])}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#147A80]"
                    >
                      <option value="recall">🔄 Recall Preventivo</option>
                      <option value="budget">📑 Orçamento e Cobrança</option>
                      <option value="welcome">👋 Boas-Vindas Lead WhatsApp</option>
                      <option value="points">⭐ Clube Sorriso Pontos</option>
                      <option value="post_op">🩺 Pós-Operatório</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      Conteúdo da Mensagem *
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Utilize {nome}, {doutor}, {clinica}, {pontos} para substituição automática."
                      value={tplContent}
                      onChange={(e) => setTplContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl p-3 focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  {/* Variable Pills help */}
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Variáveis Dinâmicas Disponíveis:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {['{nome}', '{doutor}', '{clinica}', '{pontos}'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setTplContent((prev) => `${prev} ${v}`)}
                          className="px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-[#147A80] font-mono text-[11px] font-bold border border-teal-200 cursor-pointer"
                        >
                          + {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    {editingTemplate && (
                      <button
                        onClick={() => {
                          setEditingTemplate(null);
                          setTplTitle('');
                          setTplContent('');
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      onClick={handleSaveTemplate}
                      className="flex-1 py-2.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      {editingTemplate ? 'Atualizar Modelo' : 'Salvar Modelo'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Existing Templates List */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm mb-2">
                  Modelos Prontos Cadastrados ({templates.length})
                </h3>

                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-teal-300 transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{tpl.title}</h4>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-[#147A80] border border-teal-200">
                          {tpl.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-sans">
                        {tpl.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                        <span>Variáveis: {tpl.variables.join(', ')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditTemplate(tpl)}
                          className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#147A80] hover:bg-teal-50 font-bold flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MÉTRICAS DE CONVERSÃO & PAINEL */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xl shrink-0">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Receita Convertida no Mês</span>
                    <h3 className="text-2xl font-black text-emerald-700 font-mono">
                      R$ {stats.convertedRevenueMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xl shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-[#147A80]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Taxa de Agendamento</span>
                    <h3 className="text-2xl font-black text-slate-900">
                      {opportunities.length > 0
                        ? `${Math.round(((stats.totalScheduled + stats.totalConvertedMonth) / opportunities.length) * 100)}%`
                        : '0%'}
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-extrabold text-xl shrink-0">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Bônus Clube Sorriso</span>
                    <h3 className="text-2xl font-black text-amber-800 font-mono">
                      +{opportunities.reduce((acc, curr) => acc + (curr.pointsBonus || 0), 0)} Pts
                    </h3>
                  </div>
                </div>
              </div>

              {/* Conversion Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <h3 className="font-extrabold text-slate-900 text-base mb-3">
                  Detalhamento de Desempenho por Unidade
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-black">
                        <th className="py-3 px-4">Unidade</th>
                        <th className="py-3 px-4">Leads Ativos</th>
                        <th className="py-3 px-4">Recalls Pendentes</th>
                        <th className="py-3 px-4">Agendados</th>
                        <th className="py-3 px-4">Convertidos</th>
                        <th className="py-3 px-4">Faturamento (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {clinics
                        .filter((c) => c.active)
                        .map((clinic) => {
                          const clinicOpps = opportunities.filter((o) => o.clinicId === clinic.id);
                          const clinicStats = CRMService.getStats(opportunities, clinic.id);
                          return (
                            <tr key={clinic.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-slate-900">📍 {clinic.name}</td>
                              <td className="py-3 px-4">{clinicStats.totalActive}</td>
                              <td className="py-3 px-4 text-amber-800 font-extrabold">
                                {clinicStats.totalRecallDue}
                              </td>
                              <td className="py-3 px-4 text-indigo-800 font-extrabold">
                                {clinicStats.totalScheduled}
                              </td>
                              <td className="py-3 px-4 text-emerald-800 font-extrabold">
                                {clinicStats.totalConvertedMonth}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                                R$ {clinicStats.convertedRevenueMonth.toLocaleString('pt-BR')}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
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
        onAfterSend={(id, stage) => {
          handleUpdateStage(id, stage);
        }}
      />

      <CRMNewOpportunityModal
        isOpen={isNewOppModalOpen}
        onClose={() => setIsNewOppModalOpen(false)}
        clinics={clinics}
        dentists={dentists}
        onCreate={handleCreateOpportunity}
        defaultClinicId={selectedClinicId}
      />
    </div>
  );
};
