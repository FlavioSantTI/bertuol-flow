import React from 'react';
import { Award, Bell, LogOut, ShieldCheck, Sparkles, User } from 'lucide-react';
import type { PatientTier } from '../types/patientTypes';

interface PatientHeaderProps {
  patientName: string;
  points: number;
  tier: PatientTier;
  unreadCount?: number;
  onOpenNotifications: () => void;
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
  onOpenNotifications,
  onOpenAdminModal,
  isBirthdayToday = false,
  onLogout,
}) => {
  const currentTier = TIER_CONFIG[tier] || TIER_CONFIG.bronze;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand & Greeting */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#147A80] to-[#1FB5BD] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            B
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#147A80] bg-teal-50 px-1.5 py-0.5 rounded">
                Clube Sorriso
              </span>
              {isBirthdayToday && (
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  🎂 Níver
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">
              Olá, {patientName}
            </h1>
          </div>
        </div>

        {/* Gamification Points & Tier Badge & Notifications */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Points Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-bold text-[#147A80]">{points}</span>
            <span className="text-[10px] text-teal-700 font-medium">pts</span>
          </div>

          {/* Tier Pill */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${currentTier.bg} ${currentTier.border} ${currentTier.color}`}
          >
            <span>{currentTier.icon}</span>
            <span>{currentTier.label}</span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Central de Notificações"
            aria-label="Abrir notificações"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Admin shortcut if supplied */}
          {onOpenAdminModal && (
            <button
              onClick={onOpenAdminModal}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Gestão de Regras do Clube"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sair / Encerrar Sessão"
              aria-label="Sair da conta"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
