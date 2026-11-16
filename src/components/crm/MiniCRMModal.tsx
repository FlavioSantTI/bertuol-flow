import React, { useState, useEffect } from 'react';
import { CRMLeadOpportunity, CRMMessageTemplate, CRMStage, CRMSummaryStats } from '../../types/crm';
import { CRMService, N8nSyncMetadata } from '../../services/crmService';
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
  LayoutGrid,
  List,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  FileText,
  BarChart3,
  Award,
  Lock,
  Webhook,
  Copy,
  Check,
  Upload,
  Download,
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
  const [activeTab, setActiveTab] = useState<'recall' | 'kanban' | 'n8n' | 'templates' | 'dashboard'>('recall');
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

  // Sync & n8n state
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [n8nMeta, setN8nMeta] = useState<N8nSyncMetadata>({
    lastN8nSyncAt: null,
    lastN8nSyncCount: 0,
    n8nWebhookPullUrl: '',
  });
  const [n8nPullUrlInput, setN8nPullUrlInput] = useState('');
  const [n8nManualJson, setN8nManualJson] = useState('');
  const [replaceExistingNew, setReplaceExistingNew] = useState(false);
  const [isSyncingN8n, setIsSyncingN8n] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

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
    const localOpps = CRMService.getOpportunities();
    const tpls = CRMService.getTemplates();
    setOpportunities(localOpps);
    setTemplates(tpls);

    // Sincroniza com o servidor (que recebe os leads de 180+ dias do n8n às 06:00h)
    const { opportunities: syncedOpps, meta } = await CRMService.fetchFromServer();
    setOpportunities(syncedOpps);
    setN8nMeta(meta);
    if (meta.n8nWebhookPullUrl && !n8nPullUrlInput) {
      setN8nPullUrlInput(meta.n8nWebhookPullUrl);
    }
  };

  if (!isOpen) return null;

  const hasCRMAccess =
    userContext.role === 'admin_root' ||
    userContext.role === 'admin' ||
    userContext.role === 'admin_clinica' ||
    userContext.role === 'gerente_atendimento' ||
    userContext.permissions?.canAccessCRM === true;

  if (!hasCRMAccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Acesso Restrito ao CRM</h3>
          <p className="text-xs text-gray-600">
            Seu perfil (`{userContext.role}`) não possui autorização para acessar o módulo CRM de Oportunidades & Recalls.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setSyncMessage(msg);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleSyncRecalls = async () => {
    setIsSyncingN8n(true);
    const { opportunities: serverOpps, meta } = await CRMService.fetchFromServer();
    const addedFromLocal = CRMService.syncAutomaticRecalls(patients, appointments, clinics);
    const finalOpps = CRMService.getOpportunities();
    setOpportunities(finalOpps);
    setN8nMeta(meta);
    setIsSyncingN8n(false);

    showToast(
      `Sincronizado com servidor n8n (${serverOpps.length} leads no servidor${addedFromLocal > 0 ? ` + ${addedFromLocal} da agenda local` : ''}).`
    );
  };

  const handlePullFromN8n = async () => {
    if (!n8nPullUrlInput.trim()) {
      showToast('Informe a URL do Webhook do n8n para buscar os leads de 180+ dias.');
      return;
    }
    setIsSyncingN8n(true);
    const result = await CRMService.pullLeadsFromN8nWebhook(n8nPullUrlInput.trim(), 'GET');
    await loadCRMData();
    setIsSyncingN8n(false);

    if (result.success) {
      showToast(
        `n8n Sincronizado! ${result.importedCount} novos leads (180+ dias) importados e ${result.updatedCount} atualizados.`
      );
      setActiveTab('recall');
    } else {
      showToast(`Erro ao buscar do n8n: ${result.error}`);
    }
  };

  const handleManualImportN8n = async () => {
    const rawText = n8nManualJson.trim();
    if (!rawText) {
      showToast('Cole o JSON ou CSV exportado pelo seu processo do n8n.');
      return;
    }

    setIsSyncingN8n(true);
    let parsedPayload: any = null;

    try {
      parsedPayload = JSON.parse(rawText);
    } catch {
      // Se não for JSON, tenta interpretar como CSV (nome;telefone;ultima_visita;dentista;unidade;procedimento;valor)
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        const sep = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const hasHeader =
          headers.some((h) => h.includes('nome') || h.includes('name') || h.includes('tel') || h.includes('phone'));

        const startIdx = hasHeader ? 1 : 0;
        const items: any[] = [];
        for (let i = startIdx; i < lines.length; i++) {
          const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
          if (hasHeader) {
            const obj: any = {};
            headers.forEach((h, cIdx) => {
              obj[h] = cols[cIdx] || '';
            });
            items.push(obj);
          } else if (cols.length >= 2) {
            items.push({
              nome: cols[0],
              telefone: cols[1],
              ultima_visita: cols[2] || '',
              dentista: cols[3] || 'Corpo Clínico Bertuol',
              unidade: cols[4] || 'Palmas',
              procedimento: cols[5] || 'Check-in Preventivo Semestral + Profilaxia',
              valor: cols[6] || 280,
            });
          }
        }
        parsedPayload = { leads: items };
      }
    }

    if (!parsedPayload) {
      setIsSyncingN8n(false);
      showToast('Formato inválido. Cole um JSON válido ou CSV separado por vírgula/ponto-e-vírgula.');
      return;
    }

    const result = await CRMService.importLeadsFromN8n(parsedPayload, replaceExistingNew);
    await loadCRMData();
    setIsSyncingN8n(false);

    if (result.success) {
      setN8nManualJson('');
      showToast(result.message);
      setActiveTab('recall');
    } else {
      showToast(result.error || 'Erro ao importar dados.');
    }
  };

  const handleClearAllCRM = async () => {
    await CRMService.clearOpportunities(false);
    await loadCRMData();
    setConfirmClearAll(false);
    showToast('Base do CRM limpa com sucesso! Pronta para receber os dados reais do n8n.');
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
    CRMService.deleteOpportunity(id);
    loadCRMData();
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
    CRMService.deleteTemplate(id);
    loadCRMData();
  };

  const startEditTemplate = (tpl: CRMMessageTemplate) => {
    setEditingTemplate(tpl);
    setTplTitle(tpl.title);
    setTplContent(tpl.content);
    setTplCategory(tpl.category);
  };

  const webhookDestinationUrl = `${window.location.origin}/api/webhooks/n8n/crm-recalls`;
  const prodWebhookUrl = 'https://bertuolflow.app-bertuol.tech/api/webhooks/n8n/crm-recalls';

  const sampleN8nJson = JSON.stringify(
    {
      leads: [
        {
          nome: 'Nome Real do Paciente Clinicorp',
          telefone: '63992001122',
          unidade: 'Palmas',
          dentista: 'Dr. Flávio Santiago',
          ultima_visita: '2025-08-10',
          dias_inativo: 215,
          procedimento: 'Check-in Preventivo Semestral + Profilaxia',
          valor: 280,
          pontos: 50,
          prioridade: 'high',
        },
      ],
    },
    null,
    2
  );

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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg text-white">CRM Bertuol</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                  Recall 180+ Dias • n8n 06:00h
                </span>
                {n8nMeta.lastN8nSyncAt && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-300/40 text-emerald-100">
                    Último Sync n8n: {new Date(n8nMeta.lastN8nSyncAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-100">
                Base Limpa de Produção • Importação Automática de Inativos (180+ dias) via n8n
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* Botão Integração n8n 06h */}
            <button
              onClick={() => setActiveTab('n8n')}
              title="Configurar ou importar leads do processo das 06:00h do n8n"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer"
            >
              <Webhook className="w-3.5 h-3.5 text-slate-950" />
              <span>Importar n8n (06:00h)</span>
            </button>

            {/* Sync Server Button */}
            <button
              onClick={handleSyncRecalls}
              disabled={isSyncingN8n}
              title="Atualizar lista de leads recebidos pelo servidor"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingN8n ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Atualizar</span>
            </button>

            {/* New Lead Button */}
            <button
              onClick={() => setIsNewOppModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync notification toast */}
        {syncMessage && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-xs font-extrabold text-amber-950 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button onClick={() => setSyncMessage(null)} className="text-amber-800 font-bold hover:underline cursor-pointer">
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
              <span className="text-[10px] font-black uppercase text-amber-800 block">Recall 180+ Dias</span>
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
              <span>Recall 180+ Dias</span>
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
              <span>Pipeline & Kanban</span>
            </button>

            <button
              onClick={() => setActiveTab('n8n')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'n8n'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Webhook className="w-3.5 h-3.5" />
              <span>⚡ Conector n8n (06:00h)</span>
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
              <span>Métricas</span>
            </button>
          </div>

          {/* Search, Clinic Filter & Kanban/List View toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
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

            {activeTab === 'kanban' && (
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('kanban')}
                  title="Modo Kanban"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'kanban' ? 'bg-white shadow-xs text-[#147A80]' : 'text-slate-500'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Modo Lista"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
          {/* TAB 1: RECALL PREVENTIVO 180+ DIAS */}
          {activeTab === 'recall' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Webhook className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-amber-950 text-sm">
                      Fila Oficial de Recall Preventivo (Pacientes 180+ Dias sem Consulta)
                    </h3>
                    <p className="text-xs text-amber-800">
                      Leads fictícios foram removidos. Esta fila recebe os pacientes reais enviados diariamente às 06:00h pelo seu processo do n8n.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => setActiveTab('n8n')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs cursor-pointer transition-all"
                  >
                    ⚡ Configurar / Importar do n8n
                  </button>
                  {opportunities.length > 0 && !confirmClearAll && (
                    <button
                      onClick={() => setConfirmClearAll(true)}
                      className="px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs cursor-pointer"
                    >
                      Limpar Base
                    </button>
                  )}
                  {confirmClearAll && (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl">
                      <span className="text-[11px] font-bold text-red-800">Zerar todos?</span>
                      <button
                        onClick={handleClearAllCRM}
                        className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-extrabold cursor-pointer"
                      >
                        Sim, Limpar
                      </button>
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className="px-2 py-1 rounded-lg bg-white text-slate-600 text-[11px] font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recall List */}
              <div className="space-y-3">
                {filteredOpps.filter((o) => o.type === 'recall_6m').length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        Base Limpa — Nenhum lead fictício presente!
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                        Os dados de teste (Esther Oliveira Duarte, Nelson Freiberger, etc.) foram eliminados. Conecte o seu workflow das 06:00h do n8n ou importe os pacientes de 180+ dias abaixo.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('n8n')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-extrabold text-xs shadow-sm cursor-pointer"
                    >
                      <Webhook className="w-4 h-4 text-amber-300" />
                      <span>Abrir Conector n8n (Processo das 06:00h)</span>
                    </button>
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

          {/* TAB: CONECTOR N8N (06:00H • LEADS 180+ DIAS) */}
          {activeTab === 'n8n' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Webhook Automático das 06:00h + Pull Ativo */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                        <Webhook className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          1. Recebimento Automático às 06:00h (Push do n8n)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Adicione um nó <strong>HTTP Request (POST)</strong> no final do seu workflow das 06:00h no n8n apontando para:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* URL de Produção */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 block">
                      Endpoint Oficial de Produção (POST):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={prodWebhookUrl}
                        className="flex-1 bg-slate-900 text-emerald-300 font-mono text-xs px-3 py-2.5 rounded-xl border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(prodWebhookUrl);
                          setCopiedWebhook(true);
                          setTimeout(() => setCopiedWebhook(false), 2500);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedWebhook ? 'Copiado!' : 'Copiar URL'}</span>
                      </button>
                    </div>
                    {window.location.origin !== 'https://bertuolflow.app-bertuol.tech' && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        URL deste ambiente: <span className="text-slate-700 font-bold">{webhookDestinationUrl}</span>
                      </p>
                    )}
                  </div>

                  {/* Exemplo de Payload JSON aceito */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-500">
                        Formato JSON aceito pelo Webhook (Array direto ou objeto):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sampleN8nJson);
                          setCopiedSample(true);
                          setTimeout(() => setCopiedSample(false), 2500);
                        }}
                        className="text-[11px] font-bold text-[#147A80] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSample ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSample ? 'Exemplo Copiado' : 'Copiar Exemplo JSON'}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                      {sampleN8nJson}
                    </pre>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      💡 <strong>Mapeamento Inteligente:</strong> O endpoint reconhece automaticamente os nomes de colunas do Clinicorp/n8n (<code>Name</code>, <code>PatientName</code>, <code>nome</code>, <code>MobilePhone</code>, <code>telefone</code>, <code>ultima_visita</code>, <code>lastVisitDate</code>, <code>dias_inativo</code>, <code>dentista</code>, <code>Clinic_BusinessId</code> ou <code>unidade</code>) e evita duplicatas pelo celular.
                    </p>
                  </div>
                </div>

                {/* Pull Ativo a partir de uma URL de Webhook do n8n */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#147A80]" />
                    <span>2. Buscar de um Webhook do n8n Agora (Pull Sob Demanda)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Se o seu workflow no n8n também tiver um gatilho Webhook que retorna a lista de inativos (180+ dias), informe a URL abaixo para puxar os dados imediatamente:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="https://seu-n8n.dominio.com/webhook/leads-180-dias"
                      value={n8nPullUrlInput}
                      onChange={(e) => setN8nPullUrlInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80]"
                    />
                    <button
                      type="button"
                      onClick={handlePullFromN8n}
                      disabled={isSyncingN8n}
                      className="px-4 py-2.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingN8n ? 'animate-spin' : ''}`} />
                      <span>Buscar do n8n Agora</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Importação Manual de Lote JSON ou CSV do n8n */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <span>3. Importar Lote JSON ou CSV do n8n (Imediato)</span>
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-50 text-[#147A80] border border-teal-200">
                      JSON ou CSV
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Cole abaixo a saída JSON do nó do n8n (ou linhas em CSV: <code>nome;telefone;ultima_visita;dentista;unidade;procedimento;valor</code>) para carregar a fila de 180+ dias agora mesmo:
                  </p>

                  <textarea
                    rows={11}
                    placeholder={`Cole aqui o JSON do n8n ou linhas CSV, exemplo:\nMaria Aparecida Silva;63992112233;2025-07-14;Dr. Flávio Santiago;Palmas;Recall Preventivo 180+ Dias;280`}
                    value={n8nManualJson}
                    onChange={(e) => setN8nManualJson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                  />

                  <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceExistingNew}
                      onChange={(e) => setReplaceExistingNew(e.target.checked)}
                      className="rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
                    />
                    <span>Substituir leads com status &quot;Novo&quot; anteriores (mantém os que já estão Em Contato/Agendados)</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleClearAllCRM}
                    className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Zerar Base Atual ({opportunities.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleManualImportN8n}
                    disabled={isSyncingN8n}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importar Leads de 180+ Dias para o CRM</span>
                  </button>
                </div>
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
                          className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#147A80] hover:bg-teal-50 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
