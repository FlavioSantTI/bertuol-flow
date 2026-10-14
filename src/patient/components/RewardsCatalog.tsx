import React from 'react';
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  Gift,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DashboardFinanceiro } from '../../components/DashboardFinanceiro';
import type { RewardCatalogItem } from '../../types/database';
import type { PatientTier, PointTransaction, BirthdayGiftInfo } from '../types/patientTypes';

interface RewardsCatalogProps {
  totalPoints: number;
  tier: PatientTier;
  tierProgress: number;
  tierLabel: string;
  rewardsSubTab: 'catalog' | 'extrato' | 'dashboard';
  setRewardsSubTab: (tab: 'catalog' | 'extrato' | 'dashboard') => void;
  pointsHistory: PointTransaction[];
  extratoFilter: 'all' | 'earn' | 'redeem';
  setExtratoFilter: (filter: 'all' | 'earn' | 'redeem') => void;
  rewards: RewardCatalogItem[];
  onSelectReward: (reward: RewardCatalogItem) => void;
  selectedReward: RewardCatalogItem | null;
  onCancelRedeem: () => void;
  onConfirmRedeem: (reward: RewardCatalogItem) => void;
  isRedeeming: boolean;
  isBirthdayToday?: boolean;
  birthdayGiftVoucher?: BirthdayGiftInfo | null;
  onOpenBirthdaySchedule?: () => void;
}

export const RewardsCatalog: React.FC<RewardsCatalogProps> = ({
  totalPoints,
  tier,
  tierProgress,
  tierLabel,
  rewardsSubTab,
  setRewardsSubTab,
  pointsHistory,
  extratoFilter,
  setExtratoFilter,
  rewards,
  onSelectReward,
  selectedReward,
  onCancelRedeem,
  onConfirmRedeem,
  isRedeeming,
  isBirthdayToday = false,
  birthdayGiftVoucher,
  onOpenBirthdaySchedule,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Wallet & Progress Card */}
      <div className="bg-gradient-to-br from-[#147A80] to-[#0d4f53] text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-teal-200 font-bold uppercase tracking-wider">
              Saldo Disponível no Clube Sorriso
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-black">{totalPoints}</span>
              <span className="text-sm font-bold text-amber-300">pontos</span>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{tierLabel}</span>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold text-teal-100">
            <span>Progresso para o próximo nível</span>
            <span>{tierProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${tierProgress}%` }}
            />
          </div>
        </div>

        {/* Quick Sub-tab Switcher inside Wallet Card */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 flex-wrap">
          <button
            onClick={() => setRewardsSubTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              rewardsSubTab === 'dashboard'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 Dashboard Financeiro</span>
          </button>
          <button
            onClick={() => setRewardsSubTab('extrato')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              rewardsSubTab === 'extrato'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>📜 Extrato ({pointsHistory.length})</span>
          </button>
          <button
            onClick={() => setRewardsSubTab('catalog')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              rewardsSubTab === 'catalog'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>🎁 Catálogo ({rewards.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation Selector */}
      <div className="grid grid-cols-3 p-1 bg-gray-200/80 rounded-2xl gap-1 text-xs font-bold">
        <button
          onClick={() => setRewardsSubTab('dashboard')}
          className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
            rewardsSubTab === 'dashboard'
              ? 'bg-white text-[#147A80] shadow-xs font-black'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#147A80]" />
          <span className="truncate">Dashboard</span>
        </button>
        <button
          onClick={() => setRewardsSubTab('extrato')}
          className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
            rewardsSubTab === 'extrato'
              ? 'bg-white text-[#147A80] shadow-xs font-black'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#147A80]" />
          <span className="truncate">Extrato ({pointsHistory.length})</span>
        </button>
        <button
          onClick={() => setRewardsSubTab('catalog')}
          className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
            rewardsSubTab === 'catalog'
              ? 'bg-white text-gray-900 shadow-xs font-black'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Gift className="w-4 h-4 text-[#147A80]" />
          <span className="truncate">Prêmios ({rewards.length})</span>
        </button>
      </div>

      {/* ==================== SUB-TAB DASHBOARD FINANCEIRO (RECHARTS) ==================== */}
      {rewardsSubTab === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in">
          <DashboardFinanceiro pointsHistory={pointsHistory} totalPoints={totalPoints} />
        </div>
      )}

      {/* ==================== SUB-TAB A: EXTRATO DETALHADO DE PONTOS ==================== */}
      {rewardsSubTab === 'extrato' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Total Ganho
              </span>
              <span className="text-base font-black text-emerald-600 block mt-0.5">
                +{pointsHistory.filter((p) => p.points > 0).reduce((acc, p) => acc + p.points, 0)}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">
                Resgates
              </span>
              <span className="text-base font-black text-rose-600 block mt-0.5">
                {pointsHistory.filter((p) => p.points < 0).reduce((acc, p) => acc + p.points, 0)}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-teal-200 shadow-xs text-center bg-teal-50/40">
              <span className="text-[10px] text-[#147A80] font-bold uppercase tracking-wider block">
                Saldo Atual
              </span>
              <span className="text-base font-black text-[#147A80] block mt-0.5">
                {totalPoints} pts
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-gray-400">Filtrar:</span>
            <button
              onClick={() => setExtratoFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                extratoFilter === 'all'
                  ? 'bg-[#147A80] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Todos ({pointsHistory.length})
            </button>
            <button
              onClick={() => setExtratoFilter('earn')}
              className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                extratoFilter === 'earn'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Entradas (+)
            </button>
            <button
              onClick={() => setExtratoFilter('redeem')}
              className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                extratoFilter === 'redeem'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Resgates (-)
            </button>
          </div>

          {/* Cortesia de Aniversário Exclusiva no Extrato de Prêmios - Fixo apenas quando isBirthdayToday for verdadeiro */}
          {isBirthdayToday && (
            <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 rounded-2xl p-4 border border-teal-200/90 shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                  🎁
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      Cortesia de Aniversário
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                      0 Pontos
                    </span>
                    {birthdayGiftVoucher?.code && (
                      <span className="text-[10px] font-mono font-bold bg-white/90 px-1.5 py-0.5 rounded text-[#147A80] border border-teal-200">
                        {birthdayGiftVoucher.code}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 truncate mt-1">
                    {birthdayGiftVoucher?.title || 'Profilaxia & Diagnóstico Sky Câmera'}
                  </h4>
                  <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                    {birthdayGiftVoucher?.description || 'Cortesia concedida aos aniversariantes do Clube Sorriso Bertuol.'}
                  </p>
                  {birthdayGiftVoucher?.validUntil && (
                    <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                      Válido até: {birthdayGiftVoucher.validUntil}
                    </span>
                  )}
                </div>
              </div>
              {onOpenBirthdaySchedule && (
                <button
                  type="button"
                  onClick={onOpenBirthdaySchedule}
                  className="px-3.5 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  Agendar Presente
                </button>
              )}
            </div>
          )}

          {/* Extrato Transactions List */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#147A80]" />
                Histórico Completo de Lançamentos
              </h3>
              <span className="text-[10px] text-gray-400 font-semibold">
                Atualizado em tempo real
              </span>
            </div>

            {pointsHistory.length === 0 ? (
              <div className="py-8 text-center text-gray-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">Nenhuma movimentação registrada ainda.</p>
                <p className="text-[11px] text-gray-400">
                  Faça check-in no totem ou confirme sua consulta para ganhar seus primeiros pontos!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pointsHistory
                  .filter((item) => {
                    if (extratoFilter === 'earn') return item.points > 0;
                    if (extratoFilter === 'redeem') return item.points < 0;
                    return true;
                  })
                  .map((item) => {
                    const isPositive = item.points > 0;
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}
                          >
                            {isPositive ? '↓' : '↑'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 leading-snug truncate">
                              {item.description}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(item.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}{' '}
                              às{' '}
                              {new Date(item.created_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-xl font-black text-xs shrink-0 shadow-2xs ${
                            isPositive
                              ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100/80 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPositive ? `+${item.points}` : item.points} pts
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB B: CATÁLOGO DE PRÊMIOS ==================== */}
      {rewardsSubTab === 'catalog' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#147A80]" />
              Catálogo de Prêmios Resgatáveis
            </h3>
            <span className="text-[11px] text-[#147A80] font-bold">
              {rewards.length} brindes
            </span>
          </div>

          <div className="space-y-3">
            {rewards.map((reward) => {
              const canRedeem = totalPoints >= reward.points_required;
              return (
                <div
                  key={reward.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3.5 transition-all"
                >
                  {reward.image_url ? (
                    <img
                      src={reward.image_url}
                      alt={reward.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100 border border-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                      <Gift className="w-7 h-7" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {reward.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                      {reward.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-black text-[#147A80]">
                        {reward.points_required} pts
                      </span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500">
                        Estoque: {reward.stock_available} un.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectReward(reward)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      canRedeem
                        ? 'bg-[#147A80] hover:bg-[#0f5c61] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Resgatar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">Resgatar Prêmio</h3>
              <p className="text-xs text-gray-500">
                Você deseja trocar <strong>{selectedReward.points_required} pontos</strong> por:
              </p>
              <p className="text-sm font-bold text-[#147A80] pt-1">{selectedReward.title}</p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>Seu Saldo Atual:</span>
                <strong>{totalPoints} pts</strong>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Custo do Resgate:</span>
                <strong>-{selectedReward.points_required} pts</strong>
              </div>
              <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-200 font-bold">
                <span>Saldo Restante:</span>
                <strong>{totalPoints - selectedReward.points_required} pts</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={onCancelRedeem}
                className="py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRedeeming}
                onClick={() => onConfirmRedeem(selectedReward)}
                className="py-2.5 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isRedeeming ? 'Processando...' : 'Confirmar Resgate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
