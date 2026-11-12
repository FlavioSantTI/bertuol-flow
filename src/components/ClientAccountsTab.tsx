import React, { useState, useMemo } from 'react';
import {
  Search,
  Smartphone,
  Send,
  KeyRound,
  CheckCircle2,
  UserX,
  UserCheck,
  RefreshCw,
  Copy,
  Check,
  Edit2,
  UserPlus,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Clock,
  Phone,
  FileText,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  SupabasePatient,
  updatePatientInSupabase,
  createPatientInSupabase,
  generatePatientActivationToken,
  formatPatientPortalUrl,
  formatPatientInviteMessage,
  TENANT_ID_PALMAS,
  TENANT_ID_PARAISO,
  resolveClinicTenantUuid,
  searchPatientsByNameInSupabase,
} from '../services/supabaseService';
import {
  dataService,
  generateSecureTemporaryPassword,
  formatPhoneDisplay,
  sanitizePhoneForStorage,
} from '../services/dataService';
import { AppUserContext } from '../types/database';

function normalizeSearchText(value: string | null | undefined): string {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const ALPHABET_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface ClientAccountsTabProps {
  patients: SupabasePatient[];
  refreshPatients: () => Promise<void> | void;
  currentUserContext: AppUserContext;
}

export const ClientAccountsTab: React.FC<ClientAccountsTabProps> = ({
  patients,
  refreshPatients,
  currentUserContext,
}) => {
  const canAccessAllUnits =
    currentUserContext.role === 'admin_root' ||
    currentUserContext.role === 'admin' ||
    currentUserContext.role === 'admin_tecnico' ||
    currentUserContext.role === 'gerente_atendimento' ||
    (currentUserContext.role === 'admin_clinica' &&
      Array.isArray(currentUserContext.allowedClinicIds) &&
      currentUserContext.allowedClinicIds.length > 1);

  const lockedTenantUuid = resolveClinicTenantUuid(currentUserContext.clinicId);

  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [secondarySearchTerm, setSecondarySearchTerm] = useState('');
  const [selectedInitialLetter, setSelectedInitialLetter] = useState<string>('ALL');
  const [remoteMatchedPatients, setRemoteMatchedPatients] = useState<SupabasePatient[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_activation' | 'blocked'>('all');
  const [tenantFilter, setTenantFilter] = useState<string>(() =>
    canAccessAllUnits ? 'all' : lockedTenantUuid
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  const effectiveTenantFilter = canAccessAllUnits ? tenantFilter : lockedTenantUuid;

  // Busca em tempo real direto no Supabase quando o usuário digita um nome
  React.useEffect(() => {
    const q = nameSearchTerm.trim();
    if (q.length < 2) {
      setRemoteMatchedPatients([]);
      setIsSearchingRemote(false);
      return;
    }

    let cancelled = false;
    setIsSearchingRemote(true);
    const timer = setTimeout(async () => {
      const results = await searchPatientsByNameInSupabase(q);
      if (!cancelled) {
        setRemoteMatchedPatients(results);
        setIsSearchingRemote(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nameSearchTerm]);

  // Modal 1: Envio de Link de Primeiro Acesso / Ativação
  const [selectedForActivation, setSelectedForActivation] = useState<SupabasePatient | null>(null);
  const [activationToken, setActivationToken] = useState('');
  const [activationTempPassword, setActivationTempPassword] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [sendingEvolution, setSendingEvolution] = useState(false);

  // Modal 2: Renovação / Redefinição de Senha
  const [selectedForReset, setSelectedForReset] = useState<SupabasePatient | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetTokenValue, setResetTokenValue] = useState('');
  const [copiedResetCode, setCopiedResetCode] = useState(false);

  // Modal 3: Criar / Editar Dados Cadastrais e Permissões do Cliente
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<SupabasePatient | null>(null);
  const [editForm, setEditForm] = useState({
    tenant_id: TENANT_ID_PALMAS,
    name: '',
    document_id: '',
    mobile_phone: '',
    email: '',
    insurance_plan_name: 'Particular',
    clinical_record_number: '',
    app_access_status: 'pending_activation' as 'active' | 'pending_activation' | 'blocked',
    is_active: true,
    notes: '',
  });
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Merge Supabase patients with remote search matches and local fallback patients
  const mergedPatients = useMemo((): SupabasePatient[] => {
    const map = new Map<string, SupabasePatient>();
    patients.forEach((p) => {
      if (p && p.id) map.set(p.id, p);
    });
    remoteMatchedPatients.forEach((p) => {
      if (p && p.id && !map.has(p.id)) map.set(p.id, p);
    });

    if (map.size > 0) {
      return Array.from(map.values());
    }

    const localPatients = dataService.getPatients();
    return localPatients.map((lp): SupabasePatient => ({
      id: `local_pat_${lp.id}`,
      tenant_id: resolveClinicTenantUuid(lp.Clinic_BusinessId),
      external_id: String(lp.id),
      name: lp.Name,
      document_id: lp.cpf || null,
      mobile_phone: lp.MobilePhone || null,
      insurance_plan_name: lp.insurancePlanName || 'Particular',
      is_active: true,
      notes: lp.Notes || null,
      app_access_status: 'pending_activation',
    }));
  }, [patients, remoteMatchedPatients]);

  const scopedPatients = useMemo(() => {
    if (effectiveTenantFilter === 'all') return mergedPatients;
    return mergedPatients.filter((p) => resolveClinicTenantUuid(p.tenant_id) === effectiveTenantFilter);
  }, [mergedPatients, effectiveTenantFilter]);

  const stats = useMemo(() => {
    const total = scopedPatients.length;
    let active = 0;
    let pending = 0;
    let blocked = 0;
    scopedPatients.forEach((p) => {
      const s = p.app_access_status || (p.is_active === false ? 'blocked' : 'pending_activation');
      if (s === 'active') active++;
      else if (s === 'blocked') blocked++;
      else pending++;
    });
    return { total, active, pending, blocked };
  }, [scopedPatients]);

  const filteredPatients = useMemo(() => {
    const normalizedNameQuery = normalizeSearchText(nameSearchTerm);
    const nameTokens = normalizedNameQuery.split(/\s+/).filter(Boolean);
    const normalizedSecondary = normalizeSearchText(secondarySearchTerm);
    const secondaryDigits = secondarySearchTerm.replace(/\D/g, '');

    const matches = scopedPatients.filter((p) => {
      const status = p.app_access_status || (p.is_active === false ? 'blocked' : 'pending_activation');
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      if (!matchesStatus) return false;

      const normalizedPatientName = normalizeSearchText(p.name);

      // Filtro por letra inicial (A-Z)
      if (selectedInitialLetter !== 'ALL') {
        if (!normalizedPatientName.startsWith(selectedInitialLetter.toLowerCase())) {
          return false;
        }
      }

      // Busca dedicada por Nome do Cliente (ignora acentos e permite múltiplos nomes ex: "Maria Silva")
      if (nameTokens.length > 0) {
        const matchesAllTokens = nameTokens.every((token) => normalizedPatientName.includes(token));
        // Se digitou números no campo de nome, permite achar também por telefone/CPF/prontuário
        const isNumericQuery = /^\d+$/.test(normalizedNameQuery);
        if (!matchesAllTokens) {
          if (isNumericQuery) {
            const phoneDigits = (p.mobile_phone || '').replace(/\D/g, '');
            const docDigits = (p.document_id || '').replace(/\D/g, '');
            const recNumber = normalizeSearchText(p.clinical_record_number || p.external_id);
            if (
              !phoneDigits.includes(normalizedNameQuery) &&
              !docDigits.includes(normalizedNameQuery) &&
              !recNumber.includes(normalizedNameQuery)
            ) {
              return false;
            }
          } else {
            return false;
          }
        }
      }

      // Filtro complementar (CPF, Telefone/WhatsApp, Prontuário ou E-mail)
      if (normalizedSecondary) {
        const phoneDigits = (p.mobile_phone || '').replace(/\D/g, '');
        const docDigits = (p.document_id || '').replace(/\D/g, '');
        const emailNorm = normalizeSearchText(p.email);
        const recNorm = normalizeSearchText(p.clinical_record_number || p.external_id);

        const matchesDigits =
          secondaryDigits.length > 0 &&
          (phoneDigits.includes(secondaryDigits) || docDigits.includes(secondaryDigits));
        const matchesText =
          emailNorm.includes(normalizedSecondary) ||
          recNorm.includes(normalizedSecondary) ||
          normalizedPatientName.includes(normalizedSecondary);

        if (!matchesDigits && !matchesText) {
          return false;
        }
      }

      return true;
    });

    // Se houver busca por nome ativa, prioriza nomes que começam exatamente com o termo buscado
    if (normalizedNameQuery) {
      return [...matches].sort((a, b) => {
        const aName = normalizeSearchText(a.name);
        const bName = normalizeSearchText(b.name);
        const aStarts = aName.startsWith(normalizedNameQuery) ? 0 : 1;
        const bStarts = bName.startsWith(normalizedNameQuery) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return aName.localeCompare(bName, 'pt-BR');
      });
    }

    return matches;
  }, [scopedPatients, nameSearchTerm, secondarySearchTerm, selectedInitialLetter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPatients = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, safeCurrentPage, pageSize]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPatients();
      showToast('info', 'Lista de clientes sincronizada com o banco de dados.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Abrir Modal de Link de Ativação
  const handleOpenActivationModal = async (patient: SupabasePatient) => {
    const newToken = patient.activation_token || generatePatientActivationToken();
    const tempPass = generateSecureTemporaryPassword();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    setSelectedForActivation(patient);
    setActivationToken(newToken);
    setActivationTempPassword(tempPass);
    setCopiedLink(false);
    setCopiedMessage(false);

    await updatePatientInSupabase(patient.id, {
      activation_token: newToken,
      activation_token_expires_at: expiresAt,
      app_access_status: patient.app_access_status === 'active' ? 'active' : 'pending_activation',
    });
    await refreshPatients();
  };

  // Disparar WhatsApp de Ativação
  const handleSendWhatsAppInvite = async (patient: SupabasePatient, token: string, tempPass: string, isReset = false) => {
    const message = formatPatientInviteMessage(patient, {
      token,
      tempPassword: tempPass,
      isPasswordReset: isReset,
    });
    const cleanPhone = sanitizePhoneForStorage(patient.mobile_phone);
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast('success', `Link de ${isReset ? 'redefinição de senha' : 'ativação'} aberto no WhatsApp para ${patient.name}.`);
  };

  // Disparar via API Evolution GO (se configurado no backend)
  const handleSendViaEvolutionApi = async (
    patient: SupabasePatient,
    token: string,
    tempPass: string,
    isReset = false
  ) => {
    if (!patient.mobile_phone) {
      showToast('error', 'Este cliente não possui telefone/WhatsApp cadastrado.');
      return;
    }
    setSendingEvolution(true);
    const message = formatPatientInviteMessage(patient, {
      token,
      tempPassword: tempPass,
      isPasswordReset: isReset,
    });

    try {
      const response = await fetch('/api/whatsapp/send-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: patient.mobile_phone,
          message,
        }),
      });
      const data = await response.json();
      if (data.success && data.mode === 'evolution_go') {
        showToast('success', `Mensagem enviada automaticamente via WhatsApp para ${patient.name}!`);
      } else {
        handleSendWhatsAppInvite(patient, token, tempPass, isReset);
      }
    } catch {
      handleSendWhatsAppInvite(patient, token, tempPass, isReset);
    } finally {
      setSendingEvolution(false);
    }
  };

  // Disparar via SMS nativo
  const handleSendSmsInvite = (patient: SupabasePatient, token: string, tempPass: string) => {
    const portalUrl = formatPatientPortalUrl(patient, token);
    const smsText = `Bertuol Odontologia: Olá ${patient.name.split(' ')[0]}, acesse seu App Clube Sorriso em ${portalUrl} | Senha provisória: ${tempPass}`;
    const digits = (patient.mobile_phone || '').replace(/\D/g, '');
    window.open(`sms:${digits}?body=${encodeURIComponent(smsText)}`, '_self');
    showToast('info', `Aplicativo de SMS aberto para ${patient.name}.`);
  };

  // Abrir Modal de Renovação de Senha
  const handleOpenResetPassword = async (patient: SupabasePatient) => {
    const newCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const newToken = generatePatientActivationToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    setSelectedForReset(patient);
    setResetPasswordValue(`Bertuol@${newCode.slice(0, 4)}`);
    setResetTokenValue(newToken);
    setCopiedResetCode(false);

    await updatePatientInSupabase(patient.id, {
      activation_token: newToken,
      activation_token_expires_at: expiresAt,
    });
    await refreshPatients();
  };

  // Alternar Status Ativo / Bloqueado com 1 clique
  const handleToggleAccessStatus = async (
    patient: SupabasePatient,
    targetStatus: 'active' | 'pending_activation' | 'blocked'
  ) => {
    const token =
      targetStatus === 'active' && !patient.activation_token
        ? generatePatientActivationToken()
        : patient.activation_token;

    await updatePatientInSupabase(patient.id, {
      app_access_status: targetStatus,
      is_active: targetStatus !== 'blocked',
      activation_token: token,
    });
    await refreshPatients();

    const statusLabel =
      targetStatus === 'active'
        ? 'Ativo no App'
        : targetStatus === 'blocked'
          ? 'Bloqueado'
          : 'Pendente de Ativação';
    showToast('success', `Status de ${patient.name} atualizado para "${statusLabel}".`);
  };

  // Abrir Modal de Criação / Edição de Cliente
  const handleOpenEditModal = (patient?: SupabasePatient) => {
    if (patient) {
      setEditingPatient(patient);
      setEditForm({
        tenant_id: resolveClinicTenantUuid(patient.tenant_id),
        name: patient.name || '',
        document_id: patient.document_id || '',
        mobile_phone: patient.mobile_phone || '',
        email: patient.email || '',
        insurance_plan_name: patient.insurance_plan_name || 'Particular',
        clinical_record_number: patient.clinical_record_number || '',
        app_access_status:
          (patient.app_access_status as 'active' | 'pending_activation' | 'blocked') || 'pending_activation',
        is_active: patient.is_active ?? true,
        notes: patient.notes || '',
      });
    } else {
      setEditingPatient(null);
      setEditForm({
        tenant_id: TENANT_ID_PALMAS,
        name: '',
        document_id: '',
        mobile_phone: '',
        email: '',
        insurance_plan_name: 'Particular',
        clinical_record_number: '',
        app_access_status: 'pending_activation',
        is_active: true,
        notes: '',
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSavePatientForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast('error', 'Informe o nome completo do cliente.');
      return;
    }
    setIsSavingForm(true);
    try {
      if (editingPatient) {
        await updatePatientInSupabase(editingPatient.id, {
          tenant_id: editForm.tenant_id,
          name: editForm.name.trim(),
          document_id: editForm.document_id.trim() || null,
          mobile_phone: editForm.mobile_phone.trim() || null,
          email: editForm.email.trim() || null,
          insurance_plan_name: editForm.insurance_plan_name.trim() || 'Particular',
          clinical_record_number: editForm.clinical_record_number.trim() || null,
          app_access_status: editForm.app_access_status,
          is_active: editForm.app_access_status !== 'blocked' && editForm.is_active,
          notes: editForm.notes.trim() || null,
        });
        showToast('success', `Cadastro e permissões de ${editForm.name} atualizados com sucesso.`);
      } else {
        const token = generatePatientActivationToken();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await createPatientInSupabase({
          tenant_id: editForm.tenant_id,
          name: editForm.name.trim(),
          document_id: editForm.document_id.trim() || null,
          mobile_phone: editForm.mobile_phone.trim() || null,
          email: editForm.email.trim() || null,
          insurance_plan_name: editForm.insurance_plan_name.trim() || 'Particular',
          clinical_record_number: editForm.clinical_record_number.trim() || null,
          app_access_status: editForm.app_access_status,
          is_active: editForm.app_access_status !== 'blocked',
          activation_token: token,
          activation_token_expires_at: expiresAt,
          notes: editForm.notes.trim() || null,
        });
        showToast('success', `Cliente ${editForm.name} cadastrado com token ${token} pronto para envio.`);
      }
      await refreshPatients();
      setIsEditModalOpen(false);
    } finally {
      setIsSavingForm(false);
    }
  };

  const renderStatusText = (patient: SupabasePatient) => {
    const status = patient.app_access_status || (patient.is_active === false ? 'blocked' : 'pending_activation');
    if (status === 'active') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Ativo no App</span>
        </div>
      );
    }
    if (status === 'blocked') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
          <UserX className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>Bloqueado</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Pendente de Ativação</span>
      </div>
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Barra de Comando Unificada & Compacta no Topo */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
        {/* Linha 1: Título + Filtros de Status com Contadores + Ações */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="w-4 h-4 text-[#147A80] shrink-0" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Central de Credenciais & Acessos de Clientes (Clube Sorriso PWA)
            </h4>
            <span className="hidden xl:inline-block text-[11px] font-mono tabular-nums font-bold text-[#147A80] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md shrink-0">
              {filteredPatients.length.toLocaleString('pt-BR')} / {stats.total.toLocaleString('pt-BR')}
            </span>
            {isSearchingRemote && (
              <span className="text-[11px] text-[#147A80] font-semibold flex items-center gap-1 shrink-0">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Buscando...</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Abas de Status Integrando os KPIs em Uma Única Linha */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg overflow-x-auto">
              {(
                [
                  { id: 'all', label: `Todos (${stats.total.toLocaleString('pt-BR')})` },
                  { id: 'active', label: `Ativos (${stats.active.toLocaleString('pt-BR')})` },
                  { id: 'pending_activation', label: `Pendentes (${stats.pending.toLocaleString('pt-BR')})` },
                  { id: 'blocked', label: `Bloqueados (${stats.blocked.toLocaleString('pt-BR')})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Sincronizar com Supabase"
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#147A80]' : 'text-slate-600'}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenEditModal()}
              className="px-3 py-1.5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>

        {/* Linha 2: Busca por Nome em Destaque + CPF/WhatsApp + Unidade + Inicial A-Z */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Campo Principal: Busca por Nome */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#147A80] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="client-name-search-input"
              type="text"
              autoFocus
              value={nameSearchTerm}
              onChange={(e) => {
                setNameSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar cliente pelo NOME ou SOBRENOME (ex: Maria Silva, João, Flávio)..."
              className="w-full pl-9 pr-20 py-2 rounded-lg border-2 border-[#147A80]/40 focus:border-[#147A80] bg-teal-50/20 focus:bg-white text-xs sm:text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-hidden"
            />
            {nameSearchTerm && (
              <button
                type="button"
                onClick={() => {
                  setNameSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Campo Secundário: CPF / WhatsApp / Prontuário */}
          <div className="relative lg:w-56">
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={secondarySearchTerm}
              onChange={(e) => {
                setSecondarySearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="CPF, WhatsApp ou Prontuário..."
              className="w-full pl-8 pr-7 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#147A80]"
            />
            {secondarySearchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSecondarySearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros Compactos: Unidade + Inicial A-Z */}
          <div className="flex items-center gap-2 shrink-0">
            {canAccessAllUnits ? (
              <select
                value={tenantFilter}
                onChange={(e) => {
                  setTenantFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="all">Todas as Unidades</option>
                <option value={TENANT_ID_PALMAS}>Palmas - TO</option>
                <option value={TENANT_ID_PARAISO}>Paraíso - TO</option>
              </select>
            ) : (
              <div
                title="Lista de pacientes restrita automaticamente à sua unidade vinculada (LGPD)"
                className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#147A80]" />
                <span>{lockedTenantUuid === TENANT_ID_PARAISO ? 'Paraíso - TO' : 'Palmas - TO'}</span>
              </div>
            )}

            <select
              value={selectedInitialLetter}
              onChange={(e) => {
                setSelectedInitialLetter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 font-mono"
              title="Filtrar pela letra inicial do nome"
            >
              <option value="ALL">Inicial: A–Z</option>
              {ALPHABET_LETTERS.map((letter) => (
                <option key={letter} value={letter}>
                  Letra {letter}
                </option>
              ))}
            </select>

            {(nameSearchTerm || secondarySearchTerm || selectedInitialLetter !== 'ALL' || (canAccessAllUnits && tenantFilter !== 'all') || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setNameSearchTerm('');
                  setSecondarySearchTerm('');
                  setSelectedInitialLetter('ALL');
                  if (canAccessAllUnits) setTenantFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                title="Limpar todos os filtros"
                className="px-2.5 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackBanner && (
        <div
          className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedbackBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabela de Clientes Posicionada Imediatamente Abaixo da Busca */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto max-h-[58vh] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold shadow-2xs">
              <tr>
                <th className="px-4 py-2.5">Cliente / Paciente ({filteredPatients.length.toLocaleString('pt-BR')})</th>
                <th className="px-4 py-2.5">WhatsApp & Contato</th>
                <th className="px-4 py-2.5">CPF / Convênio</th>
                <th className="px-4 py-2.5">Status App & Token</th>
                <th className="px-4 py-2.5 text-right">Ações de Acesso & Senha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum cliente encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  const currentStatus =
                    patient.app_access_status || (patient.is_active === false ? 'blocked' : 'pending_activation');
                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{patient.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>Prontuário: {patient.clinical_record_number || patient.external_id || 'S/N'}</span>
                          {patient.notes && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[180px]" title={patient.notes}>
                                {patient.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono tabular-nums font-semibold text-slate-800">
                          {patient.mobile_phone ? formatPhoneDisplay(patient.mobile_phone) : 'Sem telefone'}
                        </div>
                        {patient.email && <div className="text-[11px] text-slate-500 truncate">{patient.email}</div>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono tabular-nums text-slate-700">
                          {patient.document_id || 'CPF não inf.'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {patient.insurance_plan_name || 'Particular'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {renderStatusText(patient)}
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {patient.activation_token ? `Token: ${patient.activation_token}` : 'Token não gerado'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Botão 1: Enviar Link de Ativação */}
                          <button
                            type="button"
                            onClick={() => handleOpenActivationModal(patient)}
                            title="Gerar e Enviar Link de Primeiro Acesso por WhatsApp ou SMS"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar Link</span>
                          </button>

                          {/* Botão 2: Renovar / Redefinir Senha */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(patient)}
                            title="Renovar ou Redefinir Senha de Acesso do Cliente"
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                            <span>Renovar Senha</span>
                          </button>

                          {/* Botão 3: Editar Dados e Permissões */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(patient)}
                            title="Editar cadastro completo e permissões do cliente"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão 4: Ativar / Bloquear Conta */}
                          {currentStatus === 'active' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleAccessStatus(patient, 'blocked')}
                              title="Bloquear acesso deste cliente ao aplicativo"
                              className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleAccessStatus(patient, 'active')}
                              title="Ativar acesso imediato deste cliente ao aplicativo"
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Paginação da Tabela */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Exibindo{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {filteredPatients.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              a{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {Math.min(safeCurrentPage * pageSize, filteredPatients.length)}
              </strong>{' '}
              de{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {filteredPatients.length.toLocaleString('pt-BR')}
              </strong>{' '}
              clientes
            </span>
            <span className="text-slate-300">·</span>
            <label className="flex items-center gap-1.5">
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 font-mono font-semibold"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
            >
              Primeira
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
            >
              Anterior
            </button>
            <span className="px-3 py-1 font-mono tabular-nums font-bold text-slate-800">
              Página {safeCurrentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
            >
              Próxima
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 font-semibold cursor-pointer"
            >
              Última
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: DISPARO DE LINK DE PRIMEIRO ACESSO (WHATSAPP / SMS / LINK DIRETO) */}
      {selectedForActivation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Ativação de Acesso ao App do Cliente</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliente: <strong className="text-slate-800">{selectedForActivation.name}</strong> ·{' '}
                  <span className="font-mono">{selectedForActivation.mobile_phone || 'Sem telefone'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForActivation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Token de Ativação (48h):</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">{activationToken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Senha Temporária Inicial:</span>
                <span className="font-mono font-bold text-emerald-700 tabular-nums">{activationTempPassword}</span>
              </div>
              <div className="pt-1 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1">Link Direto do Portal do Paciente:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formatPatientPortalUrl(selectedForActivation, activationToken)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(formatPatientPortalUrl(selectedForActivation, activationToken));
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleSendWhatsAppInvite(selectedForActivation, activationToken, activationTempPassword, false)
                }
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar por WhatsApp Web</span>
              </button>

              <button
                type="button"
                disabled={sendingEvolution}
                onClick={() =>
                  handleSendViaEvolutionApi(selectedForActivation, activationToken, activationTempPassword, false)
                }
                className="w-full py-2.5 px-3 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{sendingEvolution ? 'Enviando...' : 'Disparo Direto (API)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendSmsInvite(selectedForActivation, activationToken, activationTempPassword)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Smartphone className="w-4 h-4 text-slate-600" />
                <span>Enviar Link via SMS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = formatPatientInviteMessage(selectedForActivation, {
                    token: activationToken,
                    tempPassword: activationTempPassword,
                  });
                  navigator.clipboard.writeText(msg);
                  setCopiedMessage(true);
                  setTimeout(() => setCopiedMessage(false), 2000);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMessage ? 'Mensagem Copiada!' : 'Copiar Texto Completo'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleToggleAccessStatus(selectedForActivation, 'active');
                  setSelectedForActivation(null);
                }}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Marcar Conta como Ativa Agora</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedForActivation(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RENOVAÇÃO / REDEFINIÇÃO DE SENHA DO CLIENTE */}
      {selectedForReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Renovar Senha do Cliente</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliente: <strong className="text-slate-800">{selectedForReset.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForReset(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Senha Temporária / Código de Balcão
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setResetPasswordValue(generateSecureTemporaryPassword())}
                    title="Gerar outra senha"
                    className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetPasswordValue);
                      setCopiedResetCode(true);
                      setTimeout(() => setCopiedResetCode(false), 2000);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedResetCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResetCode ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Você pode informar esta senha presencialmente no balcão ou enviá-la com o link de renovação abaixo.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSendWhatsAppInvite(selectedForReset, resetTokenValue, resetPasswordValue, true);
                    setSelectedForReset(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Nova Senha & Link via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSendSmsInvite(selectedForReset, resetTokenValue, resetPasswordValue);
                    setSelectedForReset(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Enviar Nova Senha via SMS</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedForReset(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CADASTRO COMPLETO E PERMISSÕES DO CLIENTE */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePatientForm}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPatient ? 'Editar Dados e Acesso do Cliente' : 'Novo Cliente / Paciente'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atualize os dados cadastrais e o status de permissão no aplicativo Clube Sorriso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Unidade / Clínica (tenant_id) *</label>
                <select
                  value={canAccessAllUnits ? editForm.tenant_id : lockedTenantUuid}
                  disabled={!canAccessAllUnits}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tenant_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold disabled:bg-slate-100 disabled:text-slate-600"
                >
                  <option value={TENANT_ID_PALMAS}>
                    Palmas - TO ({TENANT_ID_PALMAS})
                  </option>
                  <option value={TENANT_ID_PARAISO}>
                    Paraíso do Tocantins - TO ({TENANT_ID_PARAISO})
                  </option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Maria Clara Oliveira"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp / Celular</label>
                <input
                  type="text"
                  value={editForm.mobile_phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, mobile_phone: e.target.value }))}
                  placeholder="(63) 99999-9999"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CPF / Documento</label>
                <input
                  type="text"
                  value={editForm.document_id}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, document_id: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plano / Convênio</label>
                <input
                  type="text"
                  value={editForm.insurance_plan_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, insurance_plan_name: e.target.value }))}
                  placeholder="Particular, Bradesco Dental..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nº do Prontuário</label>
                <input
                  type="text"
                  value={editForm.clinical_record_number}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, clinical_record_number: e.target.value }))}
                  placeholder="Ex: PR-1042"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Permissão de Acesso ao App</label>
                <select
                  value={editForm.app_access_status}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      app_access_status: e.target.value as 'active' | 'pending_activation' | 'blocked',
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold"
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="pending_activation">Pendente de Ativação (Aguardando Link)</option>
                  <option value="blocked">Bloqueado (Sem Acesso ao App)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Observações Clínicas / Atendimento</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Anotações relevantes para recepção e atendimento..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingForm}
                className="px-4 py-2 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold cursor-pointer"
              >
                {isSavingForm ? 'Salvando...' : editingPatient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
