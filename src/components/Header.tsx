import React, { useState, useRef, useEffect } from 'react';
import { Dentist, Clinic, AppUserContext } from '../types/database';
import { getDefaultPermissionsForRole, normalizeUserRole } from '../services/dataService';
import { BertuolLogo } from './BertuolLogo';
import {
  ChevronDown,
  Database,
  Smartphone,
  Monitor,
  Stethoscope,
  Bell,
  Share2,
  Check,
  Building2,
  Lock,
  Users,
  KeyRound,
  LogOut,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Gift,
  QrCode,
  Fingerprint,
  MessageSquare,
  SlidersHorizontal,
  Target,
  Menu,
  X,
} from 'lucide-react';

interface HeaderProps {
  dentists: Dentist[];
  selectedDentist: Dentist | null;
  onSelectDentist: (dentist: Dentist | null) => void;
  clinics: Clinic[];
  selectedClinicId: number | 'all';
  onSelectClinic: (id: number | 'all') => void;
  userContext: AppUserContext;
  onUpdateUserContext?: (ctx: AppUserContext) => void;
  onOpenMultiClinicModal: () => void;
  isMobileView: boolean;
  onToggleView: () => void;
  onOpenSchemaModal: () => void;
  onOpenNotificationModal: () => void;
  onOpenClinicorpModal?: () => void;
  onOpenUserManagementModal?: () => void;
  onOpenChangePasswordModal?: () => void;
  onOpenWebAuthnModal?: () => void;
  onOpenRolloutReportModal?: () => void;
  onOpenVoucherModal?: () => void;
  onOpenTotemQRModal?: () => void;
  onOpenAdminGamificationModal?: () => void;
  onOpenMessagingModal?: () => void;
  unreadMessagesCount?: number;
  onOpenCRMModal?: () => void;
  crmBadgeCount?: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dentists,
  selectedDentist,
  onSelectDentist,
  clinics,
  selectedClinicId,
  onSelectClinic,
  userContext,
  onOpenMultiClinicModal,
  isMobileView,
  onToggleView,
  onOpenSchemaModal,
  onOpenNotificationModal,
  onOpenUserManagementModal,
  onOpenChangePasswordModal,
  onOpenWebAuthnModal,
  onOpenRolloutReportModal,
  onOpenVoucherModal,
  onOpenTotemQRModal,
  onOpenAdminGamificationModal,
  onOpenMessagingModal,
  unreadMessagesCount,
  onOpenCRMModal,
  crmBadgeCount,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    if (isAdminMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdminMenuOpen]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const normalizedRole = normalizeUserRole(userContext.role);
  const isDentist = normalizedRole === 'dentist';
  const isReceptionist = normalizedRole === 'receptionist';
  const isGerente = normalizedRole === 'gerente_atendimento';
  const isClinicaAdmin = normalizedRole === 'admin_clinica';
  const isAdmin =
    normalizedRole === 'admin_root' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'admin_tecnico';
  const isAvaliador =
    userContext.dentistId === 6036933394890752 ||
    Boolean(userContext.userName && userContext.userName.includes('Avaliador')) ||
    selectedDentist?.id === 6036933394890752 ||
    Boolean(selectedDentist?.Name && selectedDentist.Name.includes('Avaliador'));

  const effectivePermissions = {
    ...getDefaultPermissionsForRole(normalizedRole),
    ...userContext.permissions,
    ...(isReceptionist ? { canViewAllDentistsAgenda: true } : {}),
  };

  const canAccessCRM = !isDentist && Boolean(effectivePermissions.canAccessCRM);
  const canManageGamification = !isDentist && Boolean(effectivePermissions.canManageGamification);
  const canManageClinics = isAdmin || isClinicaAdmin || Boolean(effectivePermissions.canManageClinics);
  const canManageUsers = isAdmin || isClinicaAdmin || Boolean(effectivePermissions.canManageUsers);
  const canManageClientAccounts =
    !isDentist && (isAdmin || isClinicaAdmin || Boolean(effectivePermissions.canManageClientAccounts));
  const canSwitchDentist =
    isAdmin ||
    isClinicaAdmin ||
    isGerente ||
    isReceptionist ||
    Boolean(effectivePermissions.canViewAllDentistsAgenda);
  const canSwitchAllClinics =
    isAdmin ||
    isGerente ||
    (isClinicaAdmin && Array.isArray(userContext.allowedClinicIds) && userContext.allowedClinicIds.length > 1);
  const canAccessTotemConfig = !isDentist && Boolean(effectivePermissions.canAccessTotemConfig);
  const canViewClubeSorriso = Boolean(effectivePermissions.canViewClubeSorriso);

  const boundClinic =
    clinics.find((c) => c.id === selectedClinicId) ||
    clinics.find((c) => c.id === userContext.clinicId) ||
    clinics[0];

  const getRoleLabel = () => {
    switch (normalizedRole) {
      case 'admin_root':
      case 'admin':
        return 'Admin Root';
      case 'admin_clinica':
        return 'Admin Clínica';
      case 'admin_tecnico':
        return 'Admin Técnico';
      case 'gerente_atendimento':
        return 'Gerente Multiclínica';
      case 'receptionist':
        return 'Recepção';
      case 'dentist':
      default:
        return isAvaliador ? 'Avaliador' : 'Dentista';
    }
  };

  const roleLabel = getRoleLabel();
  const hasUnread = typeof unreadMessagesCount === 'number' && unreadMessagesCount > 0;

  const renderManagementMenuContent = (closeFn: () => void) => (
    <div className="divide-y divide-slate-100">
      {/* User Identity Summary */}
      <div className="px-4 py-2.5 bg-slate-50/70">
        <p className="text-xs font-semibold text-slate-900 truncate">
          {userContext.userName || 'Equipe Bertuol'}
        </p>
        <p className="text-[11px] text-slate-500">
          {roleLabel} · {selectedClinicId === 'all' ? 'Todas as Unidades' : boundClinic?.shortName || 'Unidade Local'}
        </p>
      </div>

      {/* Group 1: Gestão & Operação */}
      {(canAccessCRM || canManageUsers || canManageClientAccounts || canManageClinics || isAdmin) && (
        <div className="p-1.5 space-y-0.5">
          <span className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 block">
            Gestão e Equipe
          </span>
          {canAccessCRM && onOpenCRMModal && (
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenCRMModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Target className="w-4 h-4 text-[#147A80] shrink-0" />
              <span>CRM Bertuol</span>
            </button>
          )}
          {(canManageUsers || canManageClientAccounts) && onOpenUserManagementModal && (
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenUserManagementModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#147A80] shrink-0" />
              <span>{canManageUsers ? 'Usuários e Clientes' : 'Credenciais de Clientes'}</span>
            </button>
          )}
          {canManageClinics && (
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenMultiClinicModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#147A80] shrink-0" />
              <span>Unidades Multi-Clínicas</span>
            </button>
          )}
          {isAdmin && onOpenRolloutReportModal && (
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenRolloutReportModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Relatório de Implantação</span>
            </button>
          )}
        </div>
      )}

      {/* Group 2: Clube Sorriso & Totem */}
      {(canManageGamification || canViewClubeSorriso || canAccessTotemConfig) && (
        <div className="p-1.5 space-y-0.5">
          <span className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 block">
            Clube Sorriso e Recepção
          </span>
          {canManageGamification && onOpenAdminGamificationModal && (
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenAdminGamificationModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#147A80] shrink-0" />
              <span>Admin Clube e Push</span>
            </button>
          )}
          {(canManageGamification || canViewClubeSorriso) && onOpenVoucherModal && (
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenVoucherModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Gift className="w-4 h-4 text-[#147A80] shrink-0" />
              <span>{isDentist ? 'Consultar Vouchers' : 'Baixa de Vouchers'}</span>
            </button>
          )}
          {canAccessTotemConfig && onOpenTotemQRModal && (
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenTotemQRModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-slate-500 shrink-0" />
              <span>QR Code e Totem</span>
            </button>
          )}
        </div>
      )}

      {/* Group 3: Segurança e Conta */}
      <div className="p-1.5 space-y-0.5">
        <span className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 block">
          Conta e Segurança
        </span>
        {onOpenWebAuthnModal && (
          <button
            type="button"
            onClick={() => {
              closeFn();
              onOpenWebAuthnModal();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
          >
            <Fingerprint className="w-4 h-4 text-[#147A80] shrink-0" />
            <span>Biometria e Face ID</span>
          </button>
        )}
        {onOpenChangePasswordModal && (
          <button
            type="button"
            onClick={() => {
              closeFn();
              onOpenChangePasswordModal();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Alterar Senha</span>
          </button>
        )}
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => {
                closeFn();
                onToggleView();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              {isMobileView ? (
                <Monitor className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span>{isMobileView ? 'Modo Tela Cheia' : 'Simular Tela Móvel'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                closeFn();
                onOpenSchemaModal();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Script SQL Supabase</span>
            </button>
            <button
              type="button"
              onClick={() => {
                closeFn();
                handleCopyLink();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Share2 className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span>{copied ? 'Link Copiado' : 'Copiar Link da Agenda'}</span>
            </button>
          </>
        )}
        <a
          href="/faq.html"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeFn}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Central de Ajuda (FAQ)</span>
        </a>
        {onLogout && (
          <button
            type="button"
            onClick={() => {
              closeFn();
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors text-left cursor-pointer mt-1"
          >
            <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Sair do Sistema</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full">
      {/* DESKTOP 3-ZONE HEADER */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-4 py-2.5 items-center justify-between gap-6">
        {/* Zone 1: Brand + Context Selectors */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">
            <BertuolLogo size="md" mode="horizontal" />
          </div>

          <span className="h-5 w-px bg-slate-200 hidden lg:block shrink-0" aria-hidden="true" />

          {/* Clinic Selector / Lock */}
          {!canSwitchAllClinics ? (
            <div
              title="Unidade vinculada"
              className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[140px]">{boundClinic?.shortName || 'Unidade Palmas'}</span>
            </div>
          ) : (
            <div className="relative shrink-0">
              <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="clinic-select-desktop"
                value={selectedClinicId}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  onSelectClinic(val);
                }}
                className="appearance-none bg-slate-50 hover:bg-white border border-slate-200 text-slate-800 font-medium text-xs rounded-lg pl-8 pr-7 h-10 focus:outline-hidden focus:ring-2 focus:ring-[#147A80]/30 focus:border-[#147A80] transition-colors cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">
                  {clinics.filter((c) => c.active).length === 1 ? 'Unidade Palmas' : 'Todas as Clínicas'}
                </option>
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Dentist Selector / Lock */}
          {canSwitchDentist ? (
            <div className="relative shrink-0">
              <select
                id="dentist-select-desktop"
                value={selectedDentist ? String(selectedDentist.id) : 'all'}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    onSelectDentist(null);
                    return;
                  }
                  const val = Number(e.target.value);
                  const found = dentists.find((d) => d.id === val);
                  if (found) onSelectDentist(found);
                }}
                className="appearance-none bg-slate-50 hover:bg-white border border-slate-200 text-slate-800 font-medium text-xs rounded-lg pl-3 pr-7 h-10 focus:outline-hidden focus:ring-2 focus:ring-[#147A80]/30 focus:border-[#147A80] transition-colors cursor-pointer max-w-[190px] truncate"
              >
                <option value="all">Todos os Dentistas</option>
                {dentists.length === 0 ? (
                  <option value="" disabled>Carregando profissionais...</option>
                ) : (
                  dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.Name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : isDentist ? (
            <div
              title="Agenda restrita ao profissional autenticado"
              className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium shrink-0"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
              <span className="truncate max-w-[160px]">
                {selectedDentist?.Name || userContext.userName || 'Profissional'}
              </span>
            </div>
          ) : null}
        </div>

        {/* Zone 2: Exactly 3 Primary Actions (Mensagens · CRM/Vouchers · Alertas) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenMessagingModal && (
            <button
              type="button"
              onClick={onOpenMessagingModal}
              title="Central de Mensagens e Atendimento"
              className={`flex items-center gap-2 px-4 h-10 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                hasUnread
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#147A80] hover:bg-[#0F5C61] text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Mensagens</span>
              {hasUnread && (
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-white text-[11px] font-mono tabular-nums">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {canAccessCRM && onOpenCRMModal ? (
            <button
              type="button"
              onClick={onOpenCRMModal}
              title="CRM Bertuol"
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Target className="w-4 h-4 text-[#147A80] shrink-0" />
              <span>CRM</span>
              {typeof crmBadgeCount === 'number' && crmBadgeCount > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  ({crmBadgeCount})
                </span>
              )}
            </button>
          ) : isDentist && canViewClubeSorriso && onOpenVoucherModal ? (
            <button
              type="button"
              onClick={onOpenVoucherModal}
              title="Consultar Pontos e Vouchers do Clube Sorriso"
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Gift className="w-4 h-4 text-[#147A80] shrink-0" />
              <span>Vouchers</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpenNotificationModal}
            title="Central de Alertas e Notificações"
            className="flex items-center gap-2 px-3.5 h-10 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Bell className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="hidden md:inline">Alertas</span>
          </button>
        </div>

        {/* Zone 3: Organized Gestão Dropdown + Sign Out */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative shrink-0" ref={adminMenuRef}>
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              title="Menu de Gestão, Clube e Configurações"
              className={`flex items-center gap-1.5 px-3.5 h-10 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isAdminMenuOpen
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Gestão</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAdminMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                {renderManagementMenuContent(() => setIsAdminMenuOpen(false))}
              </div>
            )}
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sair do Sistema"
              className="flex items-center gap-1.5 px-3 h-10 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">Sair</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE 2-ROW CLEAN HEADER */}
      <div className="sm:hidden w-full px-3 py-2.5 flex flex-col gap-2">
        {/* Row 1: Brand + Primary Actions (Chat, CRM/Alertas, Menu) */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="min-w-0 shrink-0">
            <BertuolLogo size="sm" mode="horizontal" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenMessagingModal && (
              <button
                type="button"
                onClick={onOpenMessagingModal}
                className={`flex items-center gap-1.5 px-3 h-10 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  hasUnread ? 'bg-amber-600 text-white' : 'bg-[#147A80] text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
                {hasUnread && (
                  <span className="px-1 rounded bg-white/20 text-[10px] font-mono tabular-nums">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            )}

            {canAccessCRM && onOpenCRMModal && (
              <button
                type="button"
                onClick={onOpenCRMModal}
                className="flex items-center gap-1 px-2.5 h-10 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                <Target className="w-4 h-4 text-[#147A80]" />
                <span>CRM</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNotificationModal}
              aria-label="Alertas"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Menu de Gestão"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: 50/50 Clinic & Dentist Selectors */}
        <div className="flex items-center gap-2 w-full min-w-0">
          {!canSwitchAllClinics ? (
            <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium h-10">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{boundClinic?.shortName || 'Unidade Palmas'}</span>
            </div>
          ) : (
            <div className="relative flex-1 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="clinic-select-mobile"
                value={selectedClinicId}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  onSelectClinic(val);
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs rounded-lg pl-7 pr-6 h-10 focus:outline-hidden focus:ring-2 focus:ring-[#147A80]/30 truncate"
              >
                <option value="all">
                  {clinics.filter((c) => c.active).length === 1 ? 'Palmas' : 'Todas Clínicas'}
                </option>
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {canSwitchDentist ? (
            <div className="relative flex-1 min-w-0">
              <select
                id="dentist-select-mobile"
                value={selectedDentist ? String(selectedDentist.id) : 'all'}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    onSelectDentist(null);
                    return;
                  }
                  const val = Number(e.target.value);
                  const found = dentists.find((d) => d.id === val);
                  if (found) onSelectDentist(found);
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs rounded-lg pl-2.5 pr-6 h-10 focus:outline-hidden focus:ring-2 focus:ring-[#147A80]/30 truncate"
              >
                <option value="all">Todos os Dentistas</option>
                {dentists.length === 0 ? (
                  <option value="" disabled>Carregando...</option>
                ) : (
                  dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.Name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : isDentist ? (
            <div className="flex items-center gap-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium flex-1 min-w-0 h-10">
              <Stethoscope className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
              <span className="truncate">{selectedDentist?.Name || userContext.userName || 'Profissional'}</span>
            </div>
          ) : null}
        </div>

        {/* Mobile Expandable Gestão Drawer */}
        {isMobileMenuOpen && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden mt-0.5">
            {renderManagementMenuContent(() => setIsMobileMenuOpen(false))}
          </div>
        )}
      </div>
    </header>
  );
};
