import React from 'react';
import { Award, Bell, HelpCircle, LogOut, ShieldCheck, Sparkles, User, MessageSquare } from 'lucide-react';
import { APP_VERSION } from '../../config/version';
import type { PatientTier } from '../types/patientTypes';

interface PatientHeaderProps {
  patientName: string;
  points: number;
  tier: PatientTier;
  unreadCount?: number;
  unreadMessagesCount?: number;
  onOpenNotifications: () => void;
  onOpenMessages?: () => void;
  onOpenSupport?: () => void;
  onOpenAdminModal?: () => void;
  isBirthdayToday?: boolean;
  onLogout?: () => void;
}

const TIER_CONFIG: Record<
  PatientTier,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  bronze: {
    label: 'Bronze',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '🥉',
  },
  prata: {
    label: 'Prata',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: '🥈',
  },
  ouro: {
    label: 'Ouro',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: '🥇',
  },
  diamante: {
    label: 'Diamante',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: '💎',
  },
};

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patientName,
  points,
  tier,
  unreadCount = 0,
  unreadMessagesCount = 0,
  onOpenNotifications,
  onOpenMessages,
  onOpenSupport,
  onOpenAdminModal,
  isBirthdayToday = false,
  onLogout,
}) => {
  const currentTier = TIER_CONFIG[tier] || TIER_CONFIG.bronze;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Greeting */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#147A80] to-[#1FB5BD] flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm shrink-0">
            B
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#147A80] bg-teal-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                Clube Sorriso
              </span>
              <span className="text-[10px] font-mono tabular-nums text-gray-400 whitespace-nowrap">
                v{APP_VERSION}
              </span>
              {isBirthdayToday && (
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap">
                  🎂 Níver
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 truncate flex items-center gap-1">
              Olá, {patientName}
            </h1>
          </div>
        </div>

        {/* Gamification Points & Tier Badge & Notifications & Messages */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Points Pill */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-xs font-bold text-[#147A80] tabular-nums">{points}</span>
            <span className="hidden sm:inline text-[10px] text-teal-700 font-medium">pts</span>
          </div>

          {/* Tier Pill */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${currentTier.bg} ${currentTier.border} ${currentTier.color}`}
          >
            <span>{currentTier.icon}</span>
            <span>{currentTier.label}</span>
          </div>

          {/* Messages Button (Chat com a Clínica) */}
          {onOpenMessages && (
            <button
              type="button"
              onClick={onOpenMessages}
              className="relative min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-2 sm:p-2.5 rounded-xl text-[#147A80] bg-teal-50 hover:bg-teal-100/90 border border-teal-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Central de Mensagens e Dúvidas com a Recepção e Dentistas"
              aria-label="Abrir mensagens"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#147A80]" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-xs">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* Support Center Button (FAQ Paciente, IA & Cartilha A4) */}
          {onOpenSupport && (
            <button
              type="button"
              onClick={onOpenSupport}
              className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-2 sm:p-2.5 rounded-xl text-gray-600 hover:text-[#147A80] hover:bg-teal-50 transition-colors cursor-pointer flex items-center justify-center"
              title="Central de Suporte (FAQ, Assistente IA e Cartilha A4)"
              aria-label="Abrir Central de Suporte"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-2 sm:p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center"
            title="Central de Notificações"
            aria-label="Abrir notificações"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Admin shortcut if supplied */}
          {onOpenAdminModal && (
            <button
              type="button"
              onClick={onOpenAdminModal}
              className="hidden sm:flex min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 items-center justify-center"
              title="Gestão de Regras do Clube"
              aria-label="Gestão de Regras"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
              title="Sair / Encerrar Sessão"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
