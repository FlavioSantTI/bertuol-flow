import React, { useState } from 'react';
import { Dentist, Clinic, AppUserContext } from '../types/database';
import { BertuolLogo } from './BertuolLogo';
import {
  ChevronDown,
  Database,
  Smartphone,
  Monitor,
  UserCheck,
  Stethoscope,
  Bell,
  Layers,
  Share2,
  Check,
  Building2,
  Lock,
  Users,
  KeyRound,
  LogOut,
  Sparkles,
  Eye,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  dentists: Dentist[];
  selectedDentist: Dentist | null;
  onSelectDentist: (dentist: Dentist) => void;
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
  onUpdateUserContext,
  onOpenMultiClinicModal,
  isMobileView,
  onToggleView,
  onOpenSchemaModal,
  onOpenNotificationModal,
  onOpenClinicorpModal,
  onOpenUserManagementModal,
  onOpenChangePasswordModal,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

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

  const isReceptionist = userContext.role === 'receptionist';
  const isDentist = userContext.role === 'dentist';
  const isGerente = userContext.role === 'gerente_atendimento';
  const isClinicaAdmin = userContext.role === 'admin_clinica';
  const isAdmin = userContext.role === 'admin_root' || userContext.role === 'admin' || userContext.role === 'admin_tecnico';
  const isAvaliador =
    userContext.dentistId === 6036933394890752 ||
    Boolean(userContext.userName && userContext.userName.includes('Avaliador')) ||
    selectedDentist?.id === 6036933394890752 ||
    Boolean(selectedDentist?.Name && selectedDentist.Name.includes('Avaliador'));

  const canManageClinics = isAdmin || isClinicaAdmin || isGerente;
  const canManageUsers = isAdmin || isClinicaAdmin || !!userContext.permissions?.canManageUsers;
  const canSwitchDentist = isAdmin || isClinicaAdmin || isGerente;
  const currentClinic = clinics.find((c) => c.id === selectedClinicId);

  const getRoleBadge = () => {
    switch (userContext.role) {
      case 'admin_root':
      case 'admin':
        return { label: '👑 Admin Root', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'admin_clinica':
        return { label: '🏢 Admin Clínica', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'admin_tecnico':
        return { label: '🛠️ Admin Técnico', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'gerente_atendimento':
        return { label: '👔 Gerente Multiclínica', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'receptionist':
        return { label: '🛎️ Recepção', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'dentist':
      default:
        if (isAvaliador) {
          return { label: '📋 Avaliador', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
        }
        return { label: '🩺 Dentista', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };
  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs transition-all w-full max-w-full overflow-hidden">
      {/* DESKTOP HEADER (sm and up) */}
      <div className="hidden sm:flex max-w-6xl mx-auto px-4 py-2.5 items-center justify-between gap-3">
        {/* Brand / Logo (shrink-0 ensures it NEVER gets squeezed) */}
        <div className="flex items-center gap-3 shrink-0">
          <BertuolLogo size="md" mode="horizontal" />
          <div className="hidden md:flex flex-col pl-2.5 border-l border-[#E2E6E7]">
            <span className="text-[12px] font-extrabold text-[#199A9F] tracking-tight">
              Agenda Inteligente
            </span>
          </div>
        </div>

        {/* Right Actions & Multi-Tenant Selectors */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clinic Selector Dropdown */}
          {isReceptionist ? (
            <div
              title="Acesso local restrito à sua unidade (LGPD)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shrink-0 min-h-[44px]"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[140px]">
                {currentClinic?.shortName || 'Unidade Local'}
              </span>
            </div>
          ) : (
            <div className="relative">
              <select
                id="clinic-select-desktop"
                value={selectedClinicId}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  onSelectClinic(val);
                }}
                className="appearance-none bg-white hover:bg-gray-50 border border-gray-200 text-[#1A1A1A] font-semibold text-xs sm:text-sm rounded-xl pl-8 pr-7 py-2.5 min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-[#4BBCBE] focus:border-transparent transition-all cursor-pointer max-w-[160px] truncate shadow-2xs"
              >
                <option value="all">🏢 {clinics.filter((c) => c.active).length === 1 ? 'Unidade Palmas' : 'Todas as Clínicas'}</option>
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      📍 {c.shortName}
                    </option>
                  ))}
              </select>
              <Building2 className="w-4 h-4 text-[#199A9F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Dentist Selector (only when in Admin or Gerente mode) or Locked Badge for Dentist */}
          {canSwitchDentist ? (
            <div className="relative">
              <select
                id="dentist-select-desktop"
                value={selectedDentist?.id || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const found = dentists.find((d) => d.id === val);
                  if (found) onSelectDentist(found);
                }}
                className="appearance-none bg-[#F8F9FA] hover:bg-gray-100 border border-gray-200 text-[#1A1A1A] font-semibold text-xs sm:text-sm rounded-xl pl-3 pr-8 py-2.5 min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-[#4BBCBE] focus:border-transparent transition-all cursor-pointer max-w-[180px] truncate shadow-2xs"
              >
                {dentists.length === 0 ? (
                  <option value="">Carregando profissionais...</option>
                ) : (
                  dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.Name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : isDentist ? (
            <div
              title="Acesso clínico restrito à sua própria agenda (LGPD)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs font-bold shrink-0 min-h-[44px] shadow-2xs"
            >
              <Stethoscope className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate max-w-[160px]">
                {selectedDentist?.Name || userContext.userName || 'Avaliador Bertuol'}
              </span>
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />
            </div>
          ) : null}

          {/* User Management CRUD Modal Button (For Admin Root and Admin Clínica) */}
          {canManageUsers && onOpenUserManagementModal && (
            <button
              onClick={onOpenUserManagementModal}
              title={isAdmin ? 'Gestão Corporativa de Usuários e Permissões' : 'Gestão de Usuários da sua Clínica'}
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-orange-50 hover:bg-orange-100/90 border border-orange-200 text-orange-950 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Users className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="hidden xl:inline">Usuários</span>
            </button>
          )}

          {/* Multi-Clinic Modal Button (Only for Admins and Gerente) */}
          {canManageClinics && (
            <button
              onClick={onOpenMultiClinicModal}
              title="Gestão Multi-Clínicas, Webhooks e Perfis"
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">Multi-Clínicas</span>
            </button>
          )}

          {/* Database Schema SQL Modal Button (Only for Admin Root and Technical) */}
          {isAdmin && (
            <button
              onClick={onOpenSchemaModal}
              title="Visualizar e Copiar Script SQL do Supabase (Tabelas, Roles e Dispositivos)"
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-[#F8F9FA] hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="hidden xl:inline">SQL</span>
            </button>
          )}

          {/* Change Password Self-Service Button */}
          {onOpenChangePasswordModal && (
            <button
              onClick={onOpenChangePasswordModal}
              title={userContext.mustChangePassword ? 'Primeiro Acesso: Cadastre sua nova senha definitiva' : 'Alterar Minha Senha'}
              className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-xs transition-all cursor-pointer shadow-2xs ${
                userContext.mustChangePassword
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950 font-bold animate-pulse'
                  : 'bg-[#F8F9FA] hover:bg-gray-100 border-gray-200 text-gray-700 font-semibold'
              }`}
            >
              <KeyRound className={`w-4 h-4 shrink-0 ${userContext.mustChangePassword ? 'text-amber-700' : 'text-gray-500'}`} />
              <span className="hidden xl:inline">{userContext.mustChangePassword ? 'Cadastrar Senha!' : 'Senha'}</span>
            </button>
          )}

          {/* Share / Copy Direct Link Button */}
          <button
            onClick={handleCopyLink}
            title={copied ? 'Link copiado!' : 'Copiar link direto para este dentista e data'}
            className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                : 'bg-[#F8F9FA] hover:bg-gray-100 border-gray-200 text-gray-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden xl:inline">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-gray-600 shrink-0" />
                <span className="hidden xl:inline">Compartilhar</span>
              </>
            )}
          </button>

          {/* Notification & Alerts Settings Button */}
          <button
            onClick={onOpenNotificationModal}
            title={isDentist ? `Configurar Meus Alertas • ${selectedDentist?.Name || ''}` : "Central de Notificações e Alertas"}
            className={`relative flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border transition-all cursor-pointer shadow-2xs ${
              isDentist
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-300 text-amber-950 font-bold'
                : 'bg-[#F8F9FA] hover:bg-gray-100 border-gray-200 text-gray-700 font-semibold'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <span className="text-xs hidden md:inline">
              {isDentist ? 'Meus Alertas' : 'Alertas'}
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {/* FAQ Central de Dúvidas */}
          <a
            href="/faq.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Central de Ajuda (FAQ)"
            className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border bg-amber-500/10 hover:bg-amber-500/20 border-amber-300 text-amber-950 font-bold transition-all cursor-pointer shadow-2xs hover:scale-102"
          >
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs hidden md:inline">Ajuda (FAQ)</span>
          </a>

          {/* View Mode Toggle */}
          <button
            onClick={onToggleView}
            title={isMobileView ? 'Mudar para modo tela cheia' : 'Mudar para modo moldura móvel'}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-[#F8F9FA] hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            {isMobileView ? (
              <Monitor className="w-4 h-4 text-gray-700" />
            ) : (
              <Smartphone className="w-4 h-4 text-[#4BBCBE]" />
            )}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair / Desconectar do Sistema"
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-red-600 shrink-0" />
              <span className="hidden xl:inline">Sair</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE HEADER (sm:hidden - Perfectly fitted in 100% viewport width) */}
      <div className="sm:hidden w-full px-3 py-2.5 flex flex-col gap-2">
        {/* Row 1: Brand Logo + Primary Action Buttons */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <BertuolLogo size="sm" mode="horizontal" />
          </div>

          {/* Mobile Right Action Icons (40x40 touch targets) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* User Management Button (Admins) */}
            {canManageUsers && onOpenUserManagementModal && (
              <button
                onClick={onOpenUserManagementModal}
                title="Gestão de Usuários"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-orange-600" />
              </button>
            )}

            {/* Multi-Clinic Button (Only for Admins/Gerente) */}
            {canManageClinics && (
              <button
                onClick={onOpenMultiClinicModal}
                title="Gestão Multi-Clínicas"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
              </button>
            )}

            {/* Change Password Button */}
            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                title="Alterar Senha"
                className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors cursor-pointer ${
                  userContext.mustChangePassword
                    ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
                    : 'bg-[#F8F9FA] hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                <KeyRound className="w-4 h-4 text-amber-600" />
              </button>
            )}

            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              title="Copiar link"
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-[#F8F9FA] hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-gray-600" />}
            </button>

            {/* FAQ Central de Dúvidas Mobile */}
            <a
              href="/faq.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Central de Ajuda (FAQ)"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300 text-amber-950 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
            </a>

            {/* Bell Push Notifications Button */}
            <button
              onClick={onOpenNotificationModal}
              title="Notificações Push"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#F8F9FA] hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#199A9F]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4BBCBE] animate-pulse ring-1.5 ring-white" />
            </button>

            {/* Logout Mobile Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Selectors Bar (Side-by-side 50/50 in mobile) */}
        <div className="flex items-center gap-1.5 w-full min-w-0">
          {/* Clinic Selector */}
          {isReceptionist ? (
            <div className="flex-1 min-w-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold h-10">
              <Lock className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">{currentClinic?.shortName || 'Unidade Local'}</span>
            </div>
          ) : (
            <div className="relative flex-1 min-w-0">
              <select
                id="clinic-select-mobile"
                value={selectedClinicId}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  onSelectClinic(val);
                }}
                className="w-full appearance-none bg-white border border-gray-200 text-[#1A1A1A] font-semibold text-xs rounded-xl pl-7 pr-6 py-2 h-10 focus:outline-hidden focus:ring-2 focus:ring-[#4BBCBE] truncate shadow-2xs"
              >
                <option value="all">🏢 {clinics.filter((c) => c.active).length === 1 ? 'Palmas (Ativa)' : 'Todas as Clínicas'}</option>
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      📍 {c.shortName}
                    </option>
                  ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-[#199A9F] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-gray-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Dentist Selector (Admin / Gerente only) or Locked Badge for Dentist */}
          {canSwitchDentist ? (
            <div className="relative flex-1 min-w-0">
              <select
                id="dentist-select-mobile"
                value={selectedDentist?.id || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const found = dentists.find((d) => d.id === val);
                  if (found) onSelectDentist(found);
                }}
                className="w-full appearance-none bg-[#F8F9FA] border border-gray-200 text-[#1A1A1A] font-semibold text-xs rounded-xl pl-2.5 pr-6 py-2 h-10 focus:outline-hidden focus:ring-2 focus:ring-[#4BBCBE] truncate shadow-2xs"
              >
                {dentists.length === 0 ? (
                  <option value="">Carregando...</option>
                ) : (
                  dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.Name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : isDentist ? (
            <div
              title="Acesso clínico restrito à sua própria agenda (LGPD)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold flex-1 min-w-0 h-10 shadow-2xs"
            >
              <Stethoscope className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate text-xs">
                {selectedDentist?.Name || userContext.userName || 'Avaliador Bertuol'}
              </span>
              <Lock className="w-3 h-3 text-amber-600 shrink-0 ml-auto" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Selected Dentist Banner / Reception Banner / User Identity Bar */}
      <div className="bg-[#F8F9FA]/95 border-t border-gray-100 px-3 sm:px-4 py-1.5 text-xs text-gray-600 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isReceptionist ? (
              <>
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-bold text-[#1A1A1A] truncate">
                  {currentClinic?.shortName || 'Recepção'}:
                </span>
                <span className="text-gray-600 truncate">
                  Todos os Pacientes da Recepção
                </span>
              </>
            ) : canSwitchDentist ? (
              <>
                <Eye className="w-3.5 h-3.5 text-[#199A9F] shrink-0" />
                <span className="text-gray-500 hidden xs:inline shrink-0">Agenda em Exibição:</span>
                <span className="font-bold text-[#1A1A1A] truncate">
                  {selectedDentist?.Name || 'Todos os Profissionais'}
                </span>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="text-gray-500 truncate hidden sm:inline">
                  {selectedClinicId === 'all'
                    ? '🏢 Todas as Unidades'
                    : `📍 ${currentClinic?.shortName}`}
                </span>
              </>
            ) : (
              <>
                <Stethoscope className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-gray-500 hidden xs:inline shrink-0">Profissional:</span>
                <span className="font-bold text-[#1A1A1A] truncate">
                  {selectedDentist?.Name || userContext.userName || 'Dentista'}
                </span>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="text-gray-500 truncate hidden sm:inline">
                  {currentClinic?.shortName || 'Unidade Local'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {userContext.userName && (
              <span className="text-[11px] text-gray-700 font-medium hidden md:inline truncate max-w-[200px]">
                👤 <strong className="text-gray-900">{userContext.userName}</strong>
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${roleBadge.bg}`}
            >
              {roleBadge.label}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair / Desconectar do Sistema"
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 hover:bg-red-100/90 border border-red-200 text-red-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-95 shrink-0"
              >
                <LogOut className="w-3 h-3 text-red-600 shrink-0" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

