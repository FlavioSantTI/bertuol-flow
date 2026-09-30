import React, { useState } from 'react';
import { Bot, X, Check, Stethoscope, Crown, Users, Sparkles, ChevronRight, ShieldCheck, Building, KeyRound, LogOut } from 'lucide-react';
import { AppUserContext, Dentist, Clinic } from '../types/database';

interface FloatingPersonaBotProps {
  userContext: AppUserContext;
  onUpdateUserContext: (ctx: AppUserContext) => void;
  dentists: Dentist[];
  selectedDentist: Dentist | null;
  onSelectDentist: (dentist: Dentist) => void;
  clinics: Clinic[];
  selectedClinicId: number | 'all';
  onSelectClinic: (id: number | 'all') => void;
  onOpenUserManagementModal?: () => void;
  onOpenChangePasswordModal?: () => void;
  onLogout?: () => void;
}

export const FloatingPersonaBot: React.FC<FloatingPersonaBotProps> = ({
  userContext,
  onUpdateUserContext,
  dentists,
  selectedDentist,
  onSelectDentist,
  clinics,
  selectedClinicId,
  onSelectClinic,
  onOpenUserManagementModal,
  onOpenChangePasswordModal,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const isDentist = userContext.role === 'dentist';
  const isAdmin = userContext.role === 'admin_root' || userContext.role === 'admin';
  const isClinicaAdmin = userContext.role === 'admin_clinica';
  const isReceptionist = userContext.role === 'receptionist';

  const handleSelectRole = (role: 'dentist' | 'admin_root' | 'admin_clinica' | 'receptionist') => {
    if (role === 'dentist') {
      const drAri = dentists.find((d) => d.id === 6177152107544576) || dentists[0];
      if (drAri) onSelectDentist(drAri);
      onSelectClinic(1); // Set to Palmas
      onUpdateUserContext({
        role: 'dentist',
        userName: drAri?.Name || 'Dr. Ari Bertuol',
        dentistId: drAri?.id || 6177152107544576,
        clinicId: 1,
        canAccessConfig: false,
      });
    } else if (role === 'admin_clinica') {
      onSelectClinic(1);
      onUpdateUserContext({
        role: 'admin_clinica',
        userName: 'Mariana Alencar (Admin Clínica Palmas)',
        clinicId: 1,
        allowedClinicIds: [1],
        canAccessConfig: false,
      });
    } else if (role === 'receptionist') {
      onSelectClinic(1); // Lock to Palmas
      onUpdateUserContext({
        role: 'receptionist',
        userName: 'Recepção Palmas',
        receptionClinicId: 1,
        clinicId: 1,
        canAccessConfig: false,
      });
    } else {
      onSelectClinic('all');
      onUpdateUserContext({
        role: 'admin_root',
        userName: 'Favuca Dias (Admin Root)',
        clinicId: 1,
        allowedClinicIds: [1, 2, 3],
        canAccessConfig: true,
      });
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-auto">
      {/* Floating Chat/Widget Card */}
      {isOpen && (
        <div className="mb-3 w-[340px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Bot Card Header */}
          <div className="bg-linear-to-r from-[#FFB347] to-[#ff981a] p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                <Bot className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Robô Simulador de Visão</h3>
                <span className="text-[11px] text-amber-100 font-medium">
                  Alterne papéis para testar a UI/UX
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bot Card Content */}
          <div className="p-4 space-y-3 bg-[#FAF8F5]">
            <div className="text-xs text-gray-600 bg-white p-3 rounded-2xl border border-amber-100 shadow-2xs">
              <span className="font-bold text-gray-900 block mb-0.5">Olá! Eu sou o assistente de testes 🤖</span>
              Escolha qual perfil você quer simular agora para verificar o que o usuário deve ou não enxergar na tela:
            </div>

            {/* Profile 1: Dentist View */}
            <button
              onClick={() => handleSelectRole('dentist')}
              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                isDentist
                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white hover:bg-emerald-50/40 border-gray-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDentist ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">1. Visão do Dentista</span>
                  {isDentist && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                  Agenda individual, apenas clínica de Palmas, alertas no celular, <strong>sem botões de TI ou SQL</strong>.
                </p>
              </div>
            </button>

            {/* Profile 2: Admin Root View */}
            <button
              onClick={() => handleSelectRole('admin_root')}
              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                isAdmin
                  ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-white hover:bg-purple-50/40 border-gray-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isAdmin ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">2. Visão Admin Root</span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                  Acesso irrestrito a todas as configurações, Multi-Clínicas, SQL Supabase e Webhooks da Clinicorp.
                </p>
              </div>
            </button>

            {/* Profile 3: Admin Clínica View */}
            <button
              onClick={() => handleSelectRole('admin_clinica')}
              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                isClinicaAdmin
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white hover:bg-amber-50/40 border-gray-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isClinicaAdmin ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                <Building className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">3. Visão Admin Clínica</span>
                  {isClinicaAdmin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                  Gestão restrita à Clínica Palmas e filiais derivadas. Gerencia apenas seus próprios usuários.
                </p>
              </div>
            </button>

            {/* Profile 4: Receptionist View */}
            <button
              onClick={() => handleSelectRole('receptionist')}
              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                isReceptionist
                  ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white hover:bg-blue-50/40 border-gray-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isReceptionist ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">4. Visão Recepção (Palmas)</span>
                  {isReceptionist && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                  Travada na unidade Palmas (LGPD), vê todos os dentistas da unidade para check-in de pacientes.
                </p>
              </div>
            </button>

            {/* User Management Direct Button */}
            {(isAdmin || isClinicaAdmin) && onOpenUserManagementModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenUserManagementModal();
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1"
              >
                <Users className="w-4 h-4" />
                <span>Abrir Gestão de Usuários (CRUDs)</span>
              </button>
            )}

            {/* Change Password / First Access Action */}
            {onOpenChangePasswordModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenChangePasswordModal();
                }}
                className="w-full py-2 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200/90 text-gray-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-gray-600" />
                <span>{userContext.mustChangePassword ? 'Cadastrar Senha Inicial (Pendente!)' : 'Alterar Minha Senha'}</span>
              </button>
            )}

            {/* Logout Action */}
            {onLogout && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full py-2 px-3 rounded-2xl bg-red-50 hover:bg-red-100/90 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-red-200"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Desconectar / Sair do Sistema</span>
              </button>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-amber-50 border-t border-amber-200/70 text-[11px] text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Fase de Testes • Unidade Palmas
            </span>
            <span className="font-bold text-amber-800">Piloto Ativo</span>
          </div>
        </div>
      )}

      {/* Robot Floating Action Button (Widget Bubble) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-3.5 py-3 rounded-full bg-linear-to-r from-[#FFB347] to-[#ff981a] hover:from-[#ffa328] hover:to-[#f08c10] active:scale-95 text-white font-bold text-xs shadow-xl shadow-amber-500/30 transition-all cursor-pointer border-2 border-white"
        title="Simulador de Perfil (Robozinho)"
        aria-label="Abrir Robô Simulador de Visão"
      >
        {/* Animated Robot Icon */}
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </div>

        {/* Text Pill Badge */}
        <div className="flex flex-col text-left pr-1">
          <span className="text-[10px] uppercase tracking-wider text-amber-100 font-extrabold leading-none">
            Simulador
          </span>
          <span className="text-xs font-black leading-tight">
            {isDentist ? '🩺 Dentista' : isAdmin ? '👑 Admin' : '🛎️ Recepção'}
          </span>
        </div>

        {/* Pulse Indicator */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
      </button>
    </div>
  );
};
