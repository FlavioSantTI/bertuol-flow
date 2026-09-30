import React, { useState, useMemo } from 'react';
import {
  X,
  UserPlus,
  Users,
  Search,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Share2,
  Check,
  Stethoscope,
  Crown,
  Key,
  Lock,
  Smartphone,
  MessageSquare,
  Sparkles,
  Phone,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Filter,
  UserCheck,
  Building,
  KeyRound,
  Send,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import {
  AppUserContext,
  Clinic,
  Dentist,
  SystemUser,
  UserPermissions,
  UserRole,
} from '../types/database';
import {
  dataService,
  getDefaultPermissionsForRole,
  generateSecureTemporaryPassword,
  formatInviteWhatsAppUrl,
  formatInviteTextMessage,
  formatInviteUrl,
  formatPhoneDisplay,
  sanitizePhoneForStorage,
} from '../services/dataService';

// Helper to apply dynamic Brazilian phone mask: (DD) 99999-9999 or (DD) 3333-4444
function applyPhoneMask(value: string | null | undefined): string {
  if (!value) return '';
  let digits = String(value).replace(/\D/g, '');

  // If user pasted/loaded with country code 55 (e.g. 5563981487023 or 556332154000)
  if (digits.startsWith('55') && digits.length > 10) {
    digits = digits.slice(2);
  }

  // Limit to 11 digits (DDD + 9 digits)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Landline: (63) 3215-4000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Mobile: (63) 98148-7023
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserContext: AppUserContext;
  onSimulateUser: (user: SystemUser) => void;
  clinics: Clinic[];
  dentists: Dentist[];
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserContext,
  onSimulateUser,
  clinics,
  dentists,
}) => {
  // Local state for users loaded from dataService
  const [users, setUsers] = useState<SystemUser[]>(() =>
    dataService.getSystemUsers(currentUserContext)
  );

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinicFilter, setSelectedClinicFilter] = useState<number | 'all'>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal form state (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form inputs
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    clinicId: number;
    allowedClinicIds: number[];
    dentist_id?: number;
    permissions: UserPermissions;
    active: boolean;
    initialPassword?: string;
    mustChangePassword: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'dentist',
    clinicId: clinics[0]?.id || 1,
    allowedClinicIds: [clinics[0]?.id || 1],
    permissions: getDefaultPermissionsForRole('dentist'),
    active: true,
    initialPassword: 'Bertuol@2026',
    mustChangePassword: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // State for password visibility in form
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Invite modal state (WhatsApp / Magic Link / Credentials)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUserForInvite, setSelectedUserForInvite] = useState<SystemUser | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [sendingViaEvolution, setSendingViaEvolution] = useState(false);
  const [evolutionStatusMessage, setEvolutionStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Send WhatsApp message via Evolution GO
  const handleSendViaEvolutionGo = async () => {
    if (!selectedUserForInvite) return;
    setSendingViaEvolution(true);
    setEvolutionStatusMessage(null);

    const message = formatInviteTextMessage(selectedUserForInvite);
    try {
      const response = await fetch('/api/whatsapp/send-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: selectedUserForInvite.phone,
          message,
        }),
      });

      const data = await response.json();
      if (data.success && data.mode === 'evolution_go') {
        setEvolutionStatusMessage({ type: 'success', text: '✅ Mensagem enviada com sucesso via Evolution GO!' });
        dataService.markInviteSent(selectedUserForInvite.id);
        refreshUsers();
      } else if (data.fallbackUrl) {
        setEvolutionStatusMessage({
          type: 'info',
          text: data.message || 'Evolution GO não configurado no servidor. Abrindo WhatsApp Web...',
        });
        window.open(data.fallbackUrl, '_blank');
        dataService.markInviteSent(selectedUserForInvite.id);
        refreshUsers();
      } else {
        setEvolutionStatusMessage({ type: 'error', text: `❌ ${data.error || 'Erro ao enviar via Evolution GO'}` });
      }
    } catch (err: any) {
      setEvolutionStatusMessage({ type: 'error', text: `❌ Falha na conexão com Evolution GO: ${err?.message}` });
    } finally {
      setSendingViaEvolution(false);
    }
  };

  // Reset password modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<SystemUser | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMustChange, setResetMustChange] = useState(true);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Pre-cadastro / Import from base state
  const [isPreCadastroModalOpen, setIsPreCadastroModalOpen] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  const isAdminRoot =
    currentUserContext.role === 'admin_root' || currentUserContext.role === 'admin';
  const isAdminClinica = currentUserContext.role === 'admin_clinica';

  // Allowed clinics for current actor
  const actorClinicId = currentUserContext.clinicId || 1;
  const actorAllowedClinics = useMemo(() => {
    if (isAdminRoot) return clinics;
    return clinics.filter(
      (c) =>
        c.id === actorClinicId ||
        (currentUserContext.allowedClinicIds && currentUserContext.allowedClinicIds.includes(c.id))
    );
  }, [isAdminRoot, clinics, actorClinicId, currentUserContext.allowedClinicIds]);

  // Reload users
  const refreshUsers = () => {
    const list = dataService.getSystemUsers(currentUserContext);
    setUsers(list);
  };

  // Open Invite Modal
  const handleOpenInviteModal = (user: SystemUser) => {
    setSelectedUserForInvite(user);
    setInviteCopied(false);
    setIsInviteModalOpen(true);
    dataService.markInviteSent(user.id);
    refreshUsers();
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (user: SystemUser) => {
    setSelectedUserForReset(user);
    setResetNewPassword(generateSecureTemporaryPassword());
    setResetMustChange(true);
    setResetSuccessMessage(null);
    setIsResetModalOpen(true);
  };

  // Execute Password Reset
  const handleExecuteResetPassword = (sendWhatsApp: boolean = false) => {
    if (!selectedUserForReset) return;
    const res = dataService.resetUserPassword(selectedUserForReset.id, resetNewPassword, currentUserContext);
    if (!res.success) {
      alert(res.error || 'Erro ao redefinir senha.');
      return;
    }
    refreshUsers();
    setResetSuccessMessage(`Senha redefinida para "${resetNewPassword}" com sucesso!`);

    if (sendWhatsApp) {
      const waUrl = formatInviteWhatsAppUrl(selectedUserForReset, resetNewPassword);
      window.open(waUrl, '_blank');
      setIsResetModalOpen(false);
    } else {
      setTimeout(() => {
        setIsResetModalOpen(false);
      }, 1500);
    }
  };

  // Base Dentists status mapping (Registered vs Pending Pre-cadastro)
  const baseDentistsStatus = useMemo(() => {
    return dentists.map((d) => {
      const existingUser = users.find(
        (u) =>
          u.dentist_id === d.id ||
          (d.Email && u.email.toLowerCase() === d.Email.toLowerCase()) ||
          u.name.toLowerCase().includes(d.Name.toLowerCase().replace('dr. ', '').replace('dra. ', '').trim())
      );
      return {
        dentist: d,
        isRegistered: !!existingUser,
        user: existingUser,
      };
    });
  }, [dentists, users]);

  const pendingDentists = useMemo(() => {
    return baseDentistsStatus.filter((b) => !b.isRegistered);
  }, [baseDentistsStatus]);

  // Handler to auto-fill form from selected dentist
  const handleSelectDentistForPreCadastro = (dentistId: number) => {
    const dentist = dentists.find((d) => d.id === dentistId);
    if (!dentist) return;

    const mainClinicId = dentist.affiliatedClinicIds?.[0] || 1;
    const allowed =
      dentist.affiliatedClinicIds && dentist.affiliatedClinicIds.length > 0
        ? dentist.affiliatedClinicIds
        : [mainClinicId];

    const cleanEmail =
      dentist.Email ||
      `${dentist.Name.toLowerCase()
        .replace(/dr\.|dra\.|dr\(a\)\./gi, '')
        .trim()
        .replace(/[^a-z0-9]/g, '.')}@bertuolodontologia.com.br`;

    setFormData((prev) => ({
      ...prev,
      name: dentist.Name,
      email: cleanEmail,
      phone: applyPhoneMask(dentist.MobilePhone || ''),
      role: 'dentist',
      clinicId: mainClinicId,
      allowedClinicIds: allowed,
      dentist_id: dentist.id,
      permissions: getDefaultPermissionsForRole('dentist'),
    }));
  };

  // Handler to pre-register a single dentist with 1 click
  const handlePreCadastrarDentist = (dentist: Dentist) => {
    const mainClinicId = dentist.affiliatedClinicIds?.[0] || 1;
    const allowedClinics =
      dentist.affiliatedClinicIds && dentist.affiliatedClinicIds.length > 0
        ? dentist.affiliatedClinicIds
        : [mainClinicId];

    const cleanEmail =
      dentist.Email ||
      `${dentist.Name.toLowerCase()
        .replace(/dr\.|dra\.|dr\(a\)\./gi, '')
        .trim()
        .replace(/[^a-z0-9]/g, '.')}@bertuolodontologia.com.br`;

    const newUserData = {
      name: dentist.Name,
      email: cleanEmail,
      phone: sanitizePhoneForStorage(dentist.MobilePhone || ''),
      role: 'dentist' as UserRole,
      clinicId: mainClinicId,
      allowedClinicIds: allowedClinics,
      dentist_id: dentist.id,
      permissions: getDefaultPermissionsForRole('dentist'),
      active: true,
    };

    const res = dataService.createSystemUser(newUserData, currentUserContext);
    if (res.error) {
      alert(res.error);
    } else {
      refreshUsers();
      setBatchSuccessMessage(`Dentista ${dentist.Name} pré-cadastrado com sucesso!`);
      setTimeout(() => setBatchSuccessMessage(null), 3500);
    }
  };

  // Handler to pre-register ALL pending dentists with 1 click
  const handleBatchPreCadastrarAll = () => {
    let count = 0;
    pendingDentists.forEach(({ dentist }) => {
      const mainClinicId = dentist.affiliatedClinicIds?.[0] || 1;
      const allowedClinics =
        dentist.affiliatedClinicIds && dentist.affiliatedClinicIds.length > 0
          ? dentist.affiliatedClinicIds
          : [mainClinicId];

      const cleanEmail =
        dentist.Email ||
        `${dentist.Name.toLowerCase()
          .replace(/dr\.|dra\.|dr\(a\)\./gi, '')
          .trim()
          .replace(/[^a-z0-9]/g, '.')}@bertuolodontologia.com.br`;

      const newUserData = {
        name: dentist.Name,
        email: cleanEmail,
        phone: sanitizePhoneForStorage(dentist.MobilePhone || ''),
        role: 'dentist' as UserRole,
        clinicId: mainClinicId,
        allowedClinicIds: allowedClinics,
        dentist_id: dentist.id,
        permissions: getDefaultPermissionsForRole('dentist'),
        active: true,
      };

      const res = dataService.createSystemUser(newUserData, currentUserContext);
      if (res.user) count++;
    });

    refreshUsers();
    setBatchSuccessMessage(`${count} dentistas da base foram pré-cadastrados com sucesso!`);
    setTimeout(() => setBatchSuccessMessage(null), 4500);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      // Clinic Filter
      if (selectedClinicFilter !== 'all') {
        const matchClinic =
          u.clinicId === selectedClinicFilter || u.allowedClinicIds.includes(selectedClinicFilter);
        if (!matchClinic) return false;
      }

      // Role Filter
      if (selectedRoleFilter !== 'all') {
        if (u.role !== selectedRoleFilter) return false;
      }

      // Status Filter
      if (selectedStatusFilter === 'active' && !u.active) return false;
      if (selectedStatusFilter === 'inactive' && u.active) return false;

      return true;
    });
  }, [users, searchQuery, selectedClinicFilter, selectedRoleFilter, selectedStatusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length;
    const dentistsCount = users.filter((u) => u.role === 'dentist').length;
    const receptionCount = users.filter((u) => u.role === 'receptionist').length;
    const adminsCount = users.filter(
      (u) => u.role === 'admin_root' || u.role === 'admin' || u.role === 'admin_clinica'
    ).length;
    return { total, dentistsCount, receptionCount, adminsCount };
  }, [users]);

  // Open Create Form
  const handleOpenCreateForm = () => {
    const defaultClinic = actorAllowedClinics[0]?.id || 1;
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'dentist',
      clinicId: defaultClinic,
      allowedClinicIds: [defaultClinic],
      dentist_id: dentists[0]?.id,
      permissions: getDefaultPermissionsForRole('dentist'),
      active: true,
      initialPassword: 'Bertuol@2026',
      mustChangePassword: true,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (user: SystemUser) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: applyPhoneMask(user.phone || ''),
      role: user.role,
      clinicId: user.clinicId,
      allowedClinicIds: user.allowedClinicIds || [user.clinicId],
      dentist_id: user.dentist_id,
      permissions: { ...user.permissions },
      active: user.active,
      initialPassword: user.initialPassword || user.password || '',
      mustChangePassword: user.mustChangePassword ?? false,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Handle Form Role Change (auto-update default permissions)
  const handleRoleChange = (newRole: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: getDefaultPermissionsForRole(newRole),
      dentist_id: newRole === 'dentist' ? dentists[0]?.id : undefined,
    }));
  };

  // Handle Toggle Permission Checkbox
  const handleTogglePermission = (key: keyof UserPermissions) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  // Handle Allowed Clinic Checkbox
  const handleToggleAllowedClinic = (clinicId: number) => {
    setFormData((prev) => {
      const exists = prev.allowedClinicIds.includes(clinicId);
      let updated: number[];
      if (exists) {
        // Do not remove if it is the main clinicId or the only one
        if (clinicId === prev.clinicId && prev.allowedClinicIds.length === 1) {
          return prev;
        }
        updated = prev.allowedClinicIds.filter((id) => id !== clinicId);
        if (updated.length === 0) updated = [prev.clinicId];
      } else {
        updated = [...prev.allowedClinicIds, clinicId];
      }
      return { ...prev, allowedClinicIds: updated };
    });
  };

  // Submit Form (Save User)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Informe o nome completo do usuário.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Informe um e-mail válido.');
      return;
    }

    if (editingUserId) {
      // UPDATE
      const res = dataService.updateSystemUser(editingUserId, formData, currentUserContext);
      if (res.error) {
        setFormError(res.error);
        return;
      }
    } else {
      // CREATE
      const res = dataService.createSystemUser(formData, currentUserContext);
      if (res.error) {
        setFormError(res.error);
        return;
      }
    }

    refreshUsers();
    setIsFormOpen(false);
  };

  // Toggle user active status
  const handleToggleStatus = (userId: string) => {
    dataService.toggleUserStatus(userId, currentUserContext);
    refreshUsers();
  };

  // Delete user
  const handleDeleteUser = (userId: string) => {
    const res = dataService.deleteSystemUser(userId, currentUserContext);
    if (!res.success) {
      alert(res.error || 'Não foi possível excluir este usuário.');
    } else {
      refreshUsers();
    }
    setDeleteConfirmId(null);
  };

  // Copy Magic Link for fast login simulation
  const handleCopyLink = (user: SystemUser) => {
    const magicLink = formatInviteUrl(user);
    try {
      navigator.clipboard.writeText(magicLink);
      setCopiedUserId(user.id);
      setTimeout(() => setCopiedUserId(null), 2500);
    } catch {
      setCopiedUserId(user.id);
      setTimeout(() => setCopiedUserId(null), 2500);
    }
  };

  // Helpers for Badges
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin_root':
      case 'admin':
        return {
          label: '👑 Admin Root',
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          desc: 'Acesso Global Total',
        };
      case 'admin_clinica':
        return {
          label: '🏢 Admin Clínica',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          desc: 'Gestão da Clínica & Unidades',
        };
      case 'gerente_atendimento':
        return {
          label: '👔 Gerente Atendimento',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          desc: 'Gestor de Agendas e Check-ins',
        };
      case 'receptionist':
        return {
          label: '🛎️ Recepção',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          desc: 'Atendimento e Check-in Local',
        };
      case 'dentist':
      default:
        return {
          label: '🩺 Dentista',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          desc: 'Agenda Individual & Alertas',
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-[#4BBCBE] via-[#23B3BB] to-[#199A9F] p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner shrink-0">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                  Gestão de Usuários & Perfis
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/25 text-white border border-white/30 shrink-0">
                  {isAdminRoot ? '👑 Visão Corporativa Root' : '🏢 Visão Admin Clínica'}
                </span>
              </div>
              <p className="text-xs text-white/90 truncate mt-0.5">
                {isAdminRoot
                  ? 'Controle irrestrito: visualização e gestão de usuários de todas as clínicas e unidades derivadas'
                  : `Gestão restrita aos usuários vinculados à sua clínica (${actorAllowedClinics.map((c) => c.shortName).join(', ')})`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 ml-2"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#FAF9F6]">
          {/* Top Scope Notification */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              isAdminRoot
                ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}
          >
            <ShieldCheck
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                isAdminRoot ? 'text-purple-600' : 'text-amber-600'
              }`}
            />
            <div className="text-xs">
              <span className="font-bold block mb-0.5">
                {isAdminRoot
                  ? 'Regra Corporativa Root Ativa (Hierarquia Máxima):'
                  : 'Regra de Franquia / Unidade Ativa (Segregação LGPD):'}
              </span>
              {isAdminRoot ? (
                <span>
                  Como <strong>Admin Root</strong>, você enxerga e gerencia usuários de{' '}
                  <strong>todas as clínicas</strong> (Palmas, Paraíso, Araguaína e novas unidades),
                  com permissão para conceder qualquer perfil e escopo.
                </span>
              ) : (
                <span>
                  Como <strong>Admin de Clínica</strong>, você possui autorização estrita para
                  gerenciar profissionais e recepção da sua clínica e unidades derivadas. Os dados e
                  usuários de outras franquias são preservados em sigilo total.
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] text-gray-500 font-semibold block">Total Visível</span>
              <span className="text-lg sm:text-xl font-black text-gray-900">{stats.total}</span>
              <span className="text-[10px] text-gray-400 block">usuários no escopo</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] text-emerald-700 font-semibold block flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" /> Dentistas
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-900">
                {stats.dentistsCount}
              </span>
              <span className="text-[10px] text-emerald-600 block">corpo clínico</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-blue-200 shadow-2xs">
              <span className="text-[11px] text-blue-700 font-semibold block flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Recepção
              </span>
              <span className="text-lg sm:text-xl font-black text-blue-900">
                {stats.receptionCount}
              </span>
              <span className="text-[10px] text-blue-600 block">atendimento local</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-purple-200 shadow-2xs">
              <span className="text-[11px] text-purple-700 font-semibold block flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Gestão / Admins
              </span>
              <span className="text-lg sm:text-xl font-black text-purple-900">
                {stats.adminsCount}
              </span>
              <span className="text-[10px] text-purple-600 block">gestores ativos</span>
            </div>
          </div>

          {/* Action Row: Filters + Create Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, e-mail ou telefone..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Clinic Filter */}
              <div className="relative">
                <select
                  value={selectedClinicFilter}
                  onChange={(e) =>
                    setSelectedClinicFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="appearance-none bg-white border border-gray-200 rounded-xl pl-2.5 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">
                    🏢 {isAdminRoot ? 'Todas as Clínicas' : 'Minhas Unidades'}
                  </option>
                  {actorAllowedClinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      📍 {c.shortName}
                    </option>
                  ))}
                </select>
                <Filter className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value as UserRole | 'all')}
                  className="appearance-none bg-white border border-gray-200 rounded-xl pl-2.5 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">Todos os Perfis</option>
                  <option value="dentist">🩺 Dentistas</option>
                  <option value="receptionist">🛎️ Recepção</option>
                  <option value="admin_clinica">🏢 Admin Clínica</option>
                  {isAdminRoot && <option value="admin_root">👑 Admin Root</option>}
                  <option value="gerente_atendimento">👔 Gerente Atendimento</option>
                </select>
                <Filter className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Batch Import / Pre-Cadastro Button */}
              <button
                onClick={() => setIsPreCadastroModalOpen(true)}
                title="Puxar dentistas da base da Clinicorp / Supabase e pré-cadastrar no sistema"
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Puxar da Base ({pendingDentists.length} pendentes)</span>
              </button>

              {/* Create User Button */}
              <button
                onClick={handleOpenCreateForm}
                className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Usuário</span>
              </button>
            </div>
          </div>

          {/* Batch Success Notification */}
          {batchSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {batchSuccessMessage}
              </span>
              <button
                onClick={() => setBatchSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Users List Table / Cards */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-gray-200">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-gray-700">Nenhum usuário encontrado</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Tente alterar os termos da busca ou os filtros aplicados.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                const mainClinic = clinics.find((c) => c.id === user.clinicId);
                const allowedClinicNames = (user.allowedClinicIds || [user.clinicId])
                  .map((id) => clinics.find((c) => c.id === id)?.shortName)
                  .filter(Boolean);

                const isRootUser = user.id === 'usr_favuca_root';
                const isCurrentLoggedIn =
                  currentUserContext.email === user.email ||
                  (currentUserContext.role === 'admin_root' && user.role === 'admin_root');

                return (
                  <div
                    key={user.id}
                    className={`p-4 bg-white rounded-2xl border transition-all ${
                      !user.active
                        ? 'border-gray-200 bg-gray-50/70 opacity-75'
                        : 'border-gray-200/90 hover:border-amber-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: User Identity & Info */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-2xs"
                          style={{
                            backgroundColor:
                              user.role === 'admin_root'
                                ? '#9333EA'
                                : user.role === 'admin_clinica'
                                ? '#D97706'
                                : user.role === 'dentist'
                                ? '#059669'
                                : '#2563EB',
                          }}
                        >
                          {user.name.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{user.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}
                            >
                              {roleBadge.label}
                            </span>
                            {user.active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                                Inativo
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                            <span className="truncate">{user.email}</span>
                            {user.phone && <span>• {formatPhoneDisplay(user.phone)}</span>}
                            <span>
                              • Matriz:{' '}
                              <strong className="text-gray-700">
                                {mainClinic?.shortName || 'Palmas'}
                              </strong>
                            </span>
                          </div>

                          {/* Allowed Units Pills & Password Status */}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-400 font-semibold mr-0.5">
                              Unidades:
                            </span>
                            {allowedClinicNames.map((name, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                              >
                                📍 {name}
                              </span>
                            ))}

                            {/* Password Status Badge */}
                            {user.mustChangePassword ? (
                              <span
                                title="Usuário ainda utiliza senha provisória e deverá cadastrar uma nova no primeiro acesso"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" /> Troca de Senha Pendente
                              </span>
                            ) : (
                              <span
                                title="Usuário já cadastrou sua senha definitiva"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200"
                              >
                                <Lock className="w-3 h-3 text-gray-400" /> Senha Cadastrada
                              </span>
                            )}

                            {user.inviteSentAt && (
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                                • <Send className="w-2.5 h-2.5" /> Convite enviado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Permissions Badges & Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        {/* Granular Permissions Quick Badges */}
                        <div
                          className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-200/80 mr-1"
                          title="Permissões ativas deste usuário"
                        >
                          <span
                            title={
                              user.permissions?.canViewAgenda
                                ? 'Visualizar Agenda: Permitido'
                                : 'Visualizar Agenda: Negado'
                            }
                            className={`p-1 rounded-md text-[10px] font-bold ${
                              user.permissions?.canViewAgenda
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            Agenda
                          </span>
                          <span
                            title={
                              user.permissions?.canCheckIn
                                ? 'Check-in: Permitido'
                                : 'Check-in: Negado'
                            }
                            className={`p-1 rounded-md text-[10px] font-bold ${
                              user.permissions?.canCheckIn
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            Check-in
                          </span>
                          <span
                            title={
                              user.permissions?.canReceiveWhatsApp
                                ? 'Alertas WhatsApp: Ativo'
                                : 'Alertas WhatsApp: Inativo'
                            }
                            className={`p-1 rounded-md text-[10px] font-bold ${
                              user.permissions?.canReceiveWhatsApp
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            Zap
                          </span>
                          <span
                            title={
                              user.permissions?.canReceivePush
                                ? 'Push Celular: Ativo'
                                : 'Push Celular: Inativo'
                            }
                            className={`p-1 rounded-md text-[10px] font-bold ${
                              user.permissions?.canReceivePush
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            Push
                          </span>
                          {user.permissions?.canAccessConfig && (
                            <span
                              title="Configurações Técnicas e Webhooks: Permitido"
                              className="p-1 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800"
                            >
                              Config
                            </span>
                          )}
                        </div>

                        {/* Send WhatsApp Access Link Button */}
                        <button
                          onClick={() => handleOpenInviteModal(user)}
                          title="Enviar link de acesso e credenciais via WhatsApp ou E-mail"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enviar Acesso</span>
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenResetModal(user)}
                          title="Redefinir senha e gerar nova senha provisória"
                          className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-gray-200 text-gray-700 hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-700" />
                        </button>

                        {/* Simulate User Button */}
                        <button
                          onClick={() => {
                            onSimulateUser(user);
                            onClose();
                          }}
                          title="Simular visualização exata deste usuário no aplicativo"
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Simular</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditForm(user)}
                          title="Editar dados e permissões do usuário"
                          className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-gray-200 text-gray-700 hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button (Protected for root) */}
                        {!isRootUser && (
                          <div className="relative">
                            {deleteConfirmId === user.id ? (
                              <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                                <span className="text-[10px] text-red-700 font-bold px-1">
                                  Excluir?
                                </span>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 rounded-lg bg-gray-200 text-gray-700 text-[10px] font-bold"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(user.id)}
                                title="Excluir usuário do sistema"
                                className="p-2 rounded-xl bg-white hover:bg-red-50 border border-gray-200 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Permissões validadas em tempo real com controle RBAC por unidade</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-300 overflow-hidden my-auto flex flex-col max-h-[90vh]">
            {/* Form Header */}
            <div className="bg-linear-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-sm sm:text-base font-bold">
                  {editingUserId ? 'Editar Usuário e Permissões' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveUser} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Auto-fill from Base Dentists (Only on create) */}
              {!editingUserId && (
                <div className="p-3.5 bg-linear-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                      Puxar Dados de um Dentista da Base (Auto-preenchimento)
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                      1 Clique
                    </span>
                  </div>

                  <select
                    onChange={(e) => {
                      const dId = Number(e.target.value);
                      if (!dId) return;
                      handleSelectDentistForPreCadastro(dId);
                    }}
                    defaultValue=""
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">⚡ Selecione um dentista para importar dados da base...</option>
                    {dentists.map((d) => {
                      const isAlready = users.some((u) => u.dentist_id === d.id);
                      return (
                        <option key={d.id} value={d.id}>
                          {isAlready ? '✓ (Já cadastrado) ' : '✨ '} {d.Name} — {d.specialty || d.CRO}
                        </option>
                      );
                    })}
                  </select>

                  <p className="text-[11px] text-amber-900/80 leading-snug">
                    Importa automaticamente o nome oficial, e-mail institucional, celular/WhatsApp, unidades de atendimento e vínculo com o Clinicorp.
                  </p>
                </div>
              )}

              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  1. Dados Básicos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Dra. Mariana Alencar"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">E-mail de Acesso *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="exemplo@bertuolodontologia.com.br"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Telefone / WhatsApp (para Notificações)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: applyPhoneMask(e.target.value) })
                      }
                      placeholder="(63) 98148-7023"
                      maxLength={15}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Status da Conta</label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="user_status"
                          checked={formData.active}
                          onChange={() => setFormData({ ...formData, active: true })}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-emerald-700">Ativo</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="user_status"
                          checked={!formData.active}
                          onChange={() => setFormData({ ...formData, active: false })}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-gray-500">Inativo</span>
                      </label>
                    </div>
                  </div>

                  {/* Initial / Temporary Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-700 font-bold">
                        {editingUserId ? 'Senha do Usuário' : 'Senha Inicial Provisória *'}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            initialPassword: generateSecureTemporaryPassword(),
                          }))
                        }
                        className="text-[10px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Gerar Aleatória
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        value={formData.initialPassword || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, initialPassword: e.target.value })
                        }
                        placeholder="Ex: Bertuol@2026"
                        className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-xs font-mono text-gray-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Must change password checkbox */}
                  <div className="flex items-center pt-2 sm:pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mustChangePassword}
                        onChange={(e) =>
                          setFormData({ ...formData, mustChangePassword: e.target.checked })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs text-gray-800 font-semibold">
                        Exigir troca no 1º acesso (Recomendado)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Role Selection */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  2. Papel / Perfil de Acesso (RBAC)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option 1: Dentist */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      formData.role === 'dentist'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role_select"
                      checked={formData.role === 'dentist'}
                      onChange={() => handleRoleChange('dentist')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block">🩺 Dentista</span>
                      <span className="text-[11px] text-gray-500 leading-snug block">
                        Acesso exclusivo à sua própria agenda e alertas no celular.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Receptionist */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      formData.role === 'receptionist'
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role_select"
                      checked={formData.role === 'receptionist'}
                      onChange={() => handleRoleChange('receptionist')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block">🛎️ Recepção</span>
                      <span className="text-[11px] text-gray-500 leading-snug block">
                        Acesso à recepção da unidade física com check-in de pacientes.
                      </span>
                    </div>
                  </label>

                  {/* Option 3: Admin Clínica */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      formData.role === 'admin_clinica'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role_select"
                      checked={formData.role === 'admin_clinica'}
                      onChange={() => handleRoleChange('admin_clinica')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block">🏢 Admin Clínica</span>
                      <span className="text-[11px] text-gray-500 leading-snug block">
                        Gestão da sua clínica e unidades derivadas, agendas e usuários.
                      </span>
                    </div>
                  </label>

                  {/* Option 4: Admin Root (Only visible/creatable by Admin Root) */}
                  {isAdminRoot && (
                    <label
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        formData.role === 'admin_root'
                          ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role_select"
                        checked={formData.role === 'admin_root'}
                        onChange={() => handleRoleChange('admin_root')}
                        className="mt-0.5 text-purple-600"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block">👑 Admin Root</span>
                        <span className="text-[11px] text-gray-500 leading-snug block">
                          Acesso global irrestrito a todas as clínicas e dados técnicos.
                        </span>
                      </div>
                    </label>
                  )}
                </div>

                {/* Dentist Person Linking (if role === dentist) */}
                {formData.role === 'dentist' && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                    <label className="block text-emerald-950 font-bold">
                      Vincular ao Profissional da Clinicorp:
                    </label>
                    <select
                      value={formData.dentist_id || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, dentist_id: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-gray-900 font-semibold text-xs"
                    >
                      {dentists.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.Name} ({d.CRO})
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-emerald-800 block">
                      Permite sincronização automática de horários e pacientes deste dentista.
                    </span>
                  </div>
                )}
              </div>

              {/* Section 3: Clinic and Units Scope */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  3. Vinculação de Clínica e Unidades Derivadas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Clínica Matriz *</label>
                    <select
                      value={formData.clinicId}
                      disabled={isAdminClinica} // Locked if admin_clinica
                      onChange={(e) => {
                        const newCid = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          clinicId: newCid,
                          allowedClinicIds: prev.allowedClinicIds.includes(newCid)
                            ? prev.allowedClinicIds
                            : [...prev.allowedClinicIds, newCid],
                        }));
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-semibold focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      {actorAllowedClinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          📍 {c.name}
                        </option>
                      ))}
                    </select>
                    {isAdminClinica && (
                      <span className="text-[10px] text-amber-700 mt-1 block">
                        🔒 Travado na sua clínica de gestão.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Unidades Autorizadas para Acesso
                    </label>
                    <div className="space-y-1.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
                      {actorAllowedClinics.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={formData.allowedClinicIds.includes(c.id)}
                            onChange={() => handleToggleAllowedClinic(c.id)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-gray-800 font-medium">
                            {c.shortName} {c.id === formData.clinicId ? '(Matriz)' : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Granular Permissions Matrix */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px]">
                    4. Ações & Funções Permitidas (Permissões Granulares)
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        permissions: getDefaultPermissionsForRole(prev.role),
                      }))
                    }
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                  >
                    Restaurar Padrão do Perfil
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* 1. canViewAgenda */}
                  <label className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">Visualizar Agenda do Dia</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.permissions.canViewAgenda}
                      onChange={() => handleTogglePermission('canViewAgenda')}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* 2. canCheckIn */}
                  <label className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        Realizar Check-in / Troca de Status
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.permissions.canCheckIn}
                      onChange={() => handleTogglePermission('canCheckIn')}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* 3. canReceiveWhatsApp */}
                  <label className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">Alertas via WhatsApp</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.permissions.canReceiveWhatsApp}
                      onChange={() => handleTogglePermission('canReceiveWhatsApp')}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* 4. canReceivePush */}
                  <label className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">Push Notifications Celular</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.permissions.canReceivePush}
                      onChange={() => handleTogglePermission('canReceivePush')}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* 5. canViewPatientPhone */}
                  <label className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        Visualizar Telefones (LGPD)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.permissions.canViewPatientPhone}
                      onChange={() => handleTogglePermission('canViewPatientPhone')}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* 6. canGenerateAISummary */}
                  <label className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        Gerar Resumos com IA (Gemini)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.permissions.canGenerateAISummary}
                      onChange={() => handleTogglePermission('canGenerateAISummary')}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* 7. canManageUsers */}
                  <label className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        Gerenciar Usuários da Clínica
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageUsers}
                      onChange={() => handleTogglePermission('canManageUsers')}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* 8. canAccessConfig (Admin Root only) */}
                  <label
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer ${
                      isAdminRoot
                        ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        Configurações Técnicas & Webhooks
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!isAdminRoot}
                      checked={formData.permissions.canAccessConfig}
                      onChange={() => handleTogglePermission('canAccessConfig')}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-xs transition-all cursor-pointer"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED PRE-CADASTRO EM LOTE MODAL */}
      {isPreCadastroModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-emerald-300 overflow-hidden my-auto flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight leading-tight">
                    Puxar Dentistas da Base (Pré-Cadastro em Lote)
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Profissionais cadastrados no Clinicorp / Supabase prontos para virar usuários
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreCadastroModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FAF9F6] flex-1 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                  <span className="text-[11px] text-gray-500 font-semibold block">Total na Base</span>
                  <span className="text-lg font-black text-gray-900">{dentists.length}</span>
                  <span className="text-[10px] text-gray-400 block">profissionais Clinicorp</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-2xs">
                  <span className="text-[11px] text-emerald-700 font-semibold block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Já Cadastrados
                  </span>
                  <span className="text-lg font-black text-emerald-900">
                    {baseDentistsStatus.filter((b) => b.isRegistered).length}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">com acesso ativo</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-amber-300 shadow-2xs">
                  <span className="text-[11px] text-amber-800 font-semibold block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Pendentes
                  </span>
                  <span className="text-lg font-black text-amber-950">
                    {pendingDentists.length}
                  </span>
                  <span className="text-[10px] text-amber-700 block">aguardando ativação</span>
                </div>
              </div>

              {/* Batch Action Banner */}
              {pendingDentists.length > 0 ? (
                <div className="p-4 bg-linear-to-r from-emerald-500 to-teal-600 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm leading-tight">
                      Existem {pendingDentists.length} dentistas na base sem usuário criado
                    </h4>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      Deseja puxar e pré-cadastrar todos com e-mail, telefone, CRO e clínicas em 1 clique?
                    </p>
                  </div>
                  <button
                    onClick={handleBatchPreCadastrarAll}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs shadow-md transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Pré-cadastrar Todos ({pendingDentists.length})</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Todos os dentistas cadastrados no Clinicorp já possuem usuário ativo no sistema!</span>
                </div>
              )}

              {/* Dentists List */}
              <div className="space-y-2.5">
                <h4 className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                  Profissionais da Base Clinicorp & Status de Acesso
                </h4>

                <div className="space-y-2">
                  {baseDentistsStatus.map(({ dentist, isRegistered, user }) => {
                    const affiliatedNames = (dentist.affiliatedClinicIds || [1])
                      .map((id) => clinics.find((c) => c.id === id)?.shortName)
                      .filter(Boolean);

                    return (
                      <div
                        key={dentist.id}
                        className={`p-3.5 bg-white rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isRegistered
                            ? 'border-gray-200 bg-gray-50/50'
                            : 'border-emerald-200/90 shadow-2xs hover:border-emerald-400'
                        }`}
                      >
                        {/* Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {dentist.avatarUrl ? (
                            <img
                              src={dentist.avatarUrl}
                              alt={dentist.Name}
                              className="w-10 h-10 rounded-2xl object-cover border border-gray-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                              <Stethoscope className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-gray-900 text-xs truncate">
                                {dentist.Name}
                              </span>
                              <span className="text-[10px] text-gray-500 font-semibold">
                                {dentist.CRO}
                              </span>
                              {isRegistered ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Já no Sistema
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  ⏳ Pendente
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                              {dentist.specialty || 'Cirurgião-Dentista'} • {dentist.MobilePhone || 'Sem telefone'} • {dentist.Email}
                            </p>

                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span className="text-[10px] text-gray-400 font-medium">Unidades:</span>
                              {affiliatedNames.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200"
                                >
                                  📍 {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-2 shrink-0 sm:self-center">
                          {isRegistered ? (
                            <button
                              onClick={() => {
                                if (user) {
                                  onSimulateUser(user);
                                  setIsPreCadastroModalOpen(false);
                                  onClose();
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Simular Visão</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePreCadastrarDentist(dentist)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Pré-cadastrar Agora</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500">
                Os dentistas pré-cadastrados recebem acesso instantâneo via link e push notification.
              </span>
              <button
                onClick={() => setIsPreCadastroModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP & EMAIL INVITE MODAL */}
      {isInviteModalOpen && selectedUserForInvite && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-300 overflow-hidden my-auto flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Enviar Convite & Acesso</h4>
                  <p className="text-[11px] text-emerald-100">{selectedUserForInvite.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3.5 bg-[#FAF9F6] text-xs">
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                <span className="text-gray-500 font-semibold block text-[11px]">Destinatário:</span>
                <span className="font-extrabold text-gray-900 text-xs block">{selectedUserForInvite.name}</span>
                <span className="text-gray-600 block">{selectedUserForInvite.email}</span>
                {selectedUserForInvite.phone && (
                  <span className="text-emerald-700 font-bold block">{formatPhoneDisplay(selectedUserForInvite.phone)}</span>
                )}
              </div>

              {/* Message Bubble Preview */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-700 block text-[11px]">
                  Prévia da Mensagem WhatsApp (Pronta para Enviar):
                </span>
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-2xl font-mono text-[11px] leading-relaxed shadow-inner whitespace-pre-line max-h-56 overflow-y-auto">
                  {formatInviteTextMessage(selectedUserForInvite)}
                </div>
              </div>

              {/* Evolution GO Feedback Message */}
              {evolutionStatusMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    evolutionStatusMessage.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : evolutionStatusMessage.type === 'error'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {evolutionStatusMessage.text}
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2 pt-1">
                {/* 1. Send Automatically via Evolution GO */}
                <button
                  type="button"
                  disabled={sendingViaEvolution}
                  onClick={handleSendViaEvolutionGo}
                  className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {sendingViaEvolution ? 'Disparando via Evolution GO...' : '⚡ Disparar via Evolution GO (Automático)'}
                  </span>
                </button>

                {/* 2. Send via WhatsApp Web/App button */}
                <a
                  href={formatInviteWhatsAppUrl(selectedUserForInvite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    dataService.markInviteSent(selectedUserForInvite.id);
                    refreshUsers();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Abrir no WhatsApp Web / App Manual</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>

                {/* 3. Copy Full Text button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formatInviteTextMessage(selectedUserForInvite));
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2500);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {inviteCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-black">Mensagem Copiada para a Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-600" />
                      <span>Copiar Mensagem Completa (com link e senha)</span>
                    </>
                  )}
                </button>

                {/* 3. Copy Link Only */}
                <button
                  onClick={() => {
                    const accessUrl = formatInviteUrl(selectedUserForInvite);
                    navigator.clipboard.writeText(accessUrl);
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2500);
                  }}
                  className="w-full py-1.5 text-center text-gray-500 hover:text-gray-800 font-semibold text-[11px] underline cursor-pointer"
                >
                  Copiar apenas o link de acesso direto (com auto-configuração)
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-white border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && selectedUserForReset && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-300 overflow-hidden my-auto flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                <h4 className="text-sm font-bold">Redefinir Senha do Usuário</h4>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3.5 bg-[#FAF9F6] text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-0.5">
                <span className="font-bold text-gray-900 text-xs block">{selectedUserForReset.name}</span>
                <span className="text-gray-600 block">{selectedUserForReset.email}</span>
              </div>

              {resetSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              {/* Temporary password input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700">Nova Senha Provisória:</label>
                  <button
                    type="button"
                    onClick={() => setResetNewPassword(generateSecureTemporaryPassword())}
                    className="text-[10px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Gerar Outra
                  </button>
                </div>
                <input
                  type="text"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Must change password checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={resetMustChange}
                  onChange={(e) => setResetMustChange(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs text-gray-800 font-semibold">
                  Exigir que o usuário cadastre nova senha no próximo acesso
                </span>
              </label>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteResetPassword(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Salvar e Enviar Nova Senha via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteResetPassword(false)}
                  className="w-full py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Salvar Apenas no Sistema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
