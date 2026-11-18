import React, { useState, useEffect } from 'react';
import {
  X,
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  Gift,
  Award,
  AlertCircle,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Package,
  Plus,
  Trash2,
  Edit2,
  Users,
  Sliders,
  Check,
  TrendingUp,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react';
import type { RewardRedemption, RewardCatalogItem, GamificationRule } from '../types/database';

interface VoucherRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  clinicId?: number;
}

interface PatientSummary {
  phone: string;
  patientName: string;
  totalPoints: number;
  tier: string;
  historyCount: number;
  lastActivity: string;
}

export const VoucherRedemptionModal: React.FC<VoucherRedemptionModalProps> = ({
  isOpen,
  onClose,
  userName,
  clinicId,
}) => {
  const [activeTab, setActiveTab] = useState<'claim' | 'rules' | 'rewards' | 'patients' | 'vouchers'>('claim');
  const [secretCode, setSecretCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string; voucher?: any } | null>(
    null
  );

  // Data states
  const [vouchers, setVouchers] = useState<RewardRedemption[]>([]);
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [rules, setRules] = useState<GamificationRule[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Forms states
  // New Rule
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRulePoints, setNewRulePoints] = useState(10);
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('custom_event');
  const [isAddingRule, setIsAddingRule] = useState(false);

  // New Reward
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState(50);
  const [newRewardStock, setNewRewardStock] = useState(10);
  const [newRewardDays, setNewRewardDays] = useState(30);
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [isAddingReward, setIsAddingReward] = useState(false);

  // Manual Patient Credit
  const [creditPhone, setCreditPhone] = useState('');
  const [creditName, setCreditName] = useState('');
  const [creditPoints, setCreditPoints] = useState(20);
  const [creditDesc, setCreditDesc] = useState('');
  const [creditStatus, setCreditStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [vouchersRes, rewardsRes, rulesRes, patientsRes] = await Promise.all([
        fetch('/api/reception/vouchers'),
        fetch('/api/gamification/rewards'),
        fetch('/api/gamification/rules'),
        fetch('/api/gamification/patients'),
      ]);

      if (vouchersRes.ok) setVouchers(await vouchersRes.json());
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (patientsRes.ok) setPatients(await patientsRes.json());
    } catch (err) {
      console.warn('Erro ao carregar dados de gamificação:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Baixa de Voucher
  const handleClaim = async (codeToClaim?: string) => {
    const code = (codeToClaim || secretCode).trim().toUpperCase();
    if (!code) return;

    setIsProcessing(true);
    setResultMessage(null);

    try {
      const res = await fetch('/api/reception/voucher/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretCode: code,
          claimedBy: userName || 'Recepção Bertuol',
          clinicId: clinicId || 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultMessage({
          type: 'success',
          text: data.message,
          voucher: data.voucher,
        });
        setSecretCode('');
        loadAllData();
      } else {
        setResultMessage({
          type: 'error',
          text: data.message || 'Não foi possível validar o voucher.',
        });
      }
    } catch (err) {
      setResultMessage({
        type: 'error',
        text: 'Erro de conexão ao validar o voucher.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. CRUD Regras (RF05)
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;

    try {
      const res = await fetch('/api/gamification/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRuleTitle,
          description: newRuleDesc,
          points_reward: Number(newRulePoints),
          trigger_event: newRuleTrigger,
          is_active: true,
        }),
      });
      if (res.ok) {
        setNewRuleTitle('');
        setNewRuleDesc('');
        setNewRulePoints(10);
        setIsAddingRule(false);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRule = async (rule: GamificationRule) => {
    try {
      await fetch(`/api/gamification/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Deseja realmente remover esta regra de pontuação?')) return;
    try {
      await fetch(`/api/gamification/rules/${id}`, { method: 'DELETE' });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // 3. CRUD Prêmios (RF06)
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim()) return;

    try {
      const res = await fetch('/api/gamification/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRewardTitle,
          description: newRewardDesc,
          points_required: Number(newRewardPoints),
          stock_available: Number(newRewardStock),
          voucher_validity_days: Number(newRewardDays),
          is_active: true,
        }),
      });
      if (res.ok) {
        setNewRewardTitle('');
        setNewRewardDesc('');
        setNewRewardPoints(50);
        setNewRewardStock(10);
        setIsAddingReward(false);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStock = async (rewardId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    try {
      await fetch(`/api/gamification/rewards/${rewardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_available: nextStock }),
      });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Deseja realmente remover este brinde do catálogo?')) return;
    try {
      await fetch(`/api/gamification/rewards/${id}`, { method: 'DELETE' });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Lançamento de Pontos Avulsos
  const handleCreditPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditPhone.trim()) return;

    try {
      const res = await fetch('/api/gamification/patients/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: creditPhone,
          patientName: creditName || 'Paciente',
          points: Number(creditPoints),
          description: creditDesc || 'Pontuação bônus pela recepção',
          staffName: userName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreditStatus(`Sucesso! ${data.message}`);
        setCreditPoints(20);
        setCreditDesc('');
        setTimeout(() => setCreditStatus(null), 3500);
        loadAllData();
      }
    } catch (e) {
      setCreditStatus('Erro ao lançar pontos.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                Gestão da Gamificação e Clube Sorriso
              </h2>
              <p className="text-xs text-slate-500">Controle de regras, prêmios, vouchers e pontos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2 gap-1.5 overflow-x-auto text-xs font-medium no-scrollbar">
          <button
            onClick={() => setActiveTab('claim')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'claim'
                ? 'border-[#147A80] text-[#147A80] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Validar Voucher</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 tabular-nums ${
              activeTab === 'rules'
                ? 'border-[#147A80] text-[#147A80] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Regras ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 tabular-nums ${
              activeTab === 'rewards'
                ? 'border-[#147A80] text-[#147A80] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Prêmios ({rewards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'patients'
                ? 'border-[#147A80] text-[#147A80] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Lançar Pontos</span>
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 tabular-nums ${
              activeTab === 'vouchers'
                ? 'border-[#147A80] text-[#147A80] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Histórico ({vouchers.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#F8FAFC]/40">
          {activeTab === 'claim' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                <Gift className="w-4 h-4 text-[#147A80] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Como funciona a entrega do brinde:</p>
                  <p className="text-slate-600 mt-0.5">
                    O paciente apresentará o código no celular dele (ex: <strong>BT-4892</strong>). Digite o código abaixo para dar a baixa e entregar o brinde correspondente.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 block">
                  Código do Voucher (ex: BT-1234)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    placeholder="BT-____"
                    className="flex-1 h-11 px-4 rounded-lg bg-white border border-slate-300 text-base font-semibold tracking-widest text-[#147A80] uppercase focus:outline-none focus:ring-2 focus:ring-[#147A80] tabular-nums"
                  />
                  <button
                    disabled={isProcessing || !secretCode.trim()}
                    onClick={() => handleClaim()}
                    className="h-11 px-5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Validar e Entregar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Result feedback */}
              {resultMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs space-y-1.5 animate-in fade-in ${
                    resultMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {resultMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{resultMessage.text}</span>
                  </div>
                  {resultMessage.voucher && (
                    <p className="text-[11px] text-emerald-800 pl-7">
                      Entregue para: <strong>{resultMessage.voucher.patientName}</strong> • Código:{' '}
                      <strong>{resultMessage.voucher.secretCode}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700">
                    Regras de Pontuação Automática
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina quantos pontos o paciente ganha por ação no consultório ou no app.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingRule(!isAddingRule)}
                  className="h-9 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Regra</span>
                </button>
              </div>

              {isAddingRule && (
                <form
                  onSubmit={handleCreateRule}
                  className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                >
                  <h4 className="text-xs font-semibold text-[#147A80]">Criar Nova Regra de Pontuação</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-700 block mb-1">Título da Ação</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Indicação de Paciente"
                        value={newRuleTitle}
                        onChange={(e) => setNewRuleTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Pontos Ganhos</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newRulePoints}
                        onChange={(e) => setNewRulePoints(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80] tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Descrição Detalhada</label>
                    <input
                      type="text"
                      placeholder="Ex: Paciente indicou um colega que compareceu"
                      value={newRuleDesc}
                      onChange={(e) => setNewRuleDesc(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingRule(false)}
                      className="h-9 px-3.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs cursor-pointer"
                    >
                      Salvar Regra
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{rule.title}</span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                            rule.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {rule.is_active ? 'Ativa' : 'Desativada'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                      <span className="text-[11px] text-slate-400 font-mono">Gatilho: {rule.trigger_event}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-[#147A80] tabular-nums">
                        +{rule.points_reward} pts
                      </span>
                      <button
                        onClick={() => handleToggleRule(rule)}
                        title={rule.is_active ? 'Desativar Regra' : 'Ativar Regra'}
                        className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                      >
                        {rule.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        title="Remover Regra"
                        className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700">
                    Catálogo de Brindes e Prêmios
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastre novos mimos, controle de estoque e pontuação necessária para resgate.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingReward(!isAddingReward)}
                  className="h-9 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Prêmio</span>
                </button>
              </div>

              {isAddingReward && (
                <form
                  onSubmit={handleCreateReward}
                  className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                >
                  <h4 className="text-xs font-semibold text-[#147A80]">Cadastrar Novo Brinde</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-700 block mb-1">Título do Brinde</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Kit Clareamento Caseiro"
                        value={newRewardTitle}
                        onChange={(e) => setNewRewardTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Pontos Exigidos</label>
                      <input
                        type="number"
                        required
                        min="10"
                        value={newRewardPoints}
                        onChange={(e) => setNewRewardPoints(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80] tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Estoque Inicial</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={newRewardStock}
                        onChange={(e) => setNewRewardStock(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80] tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Estojo completo com bisnagas e moldeira"
                      value={newRewardDesc}
                      onChange={(e) => setNewRewardDesc(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingReward(false)}
                      className="h-9 px-3.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs cursor-pointer"
                    >
                      Salvar Brinde
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{reward.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{reward.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Excluir Prêmio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="font-semibold text-sm text-[#147A80] tabular-nums">{reward.points_required} pts</span>

                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 tabular-nums">
                        <span className="text-[11px] text-slate-500 font-medium">Estoque:</span>
                        <button
                          onClick={() => handleUpdateStock(reward.id, reward.stock_available, -1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 font-semibold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-semibold text-slate-900 px-1">{reward.stock_available}</span>
                        <button
                          onClick={() => handleUpdateStock(reward.id, reward.stock_available, 1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 font-semibold text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-4">
              <form
                onSubmit={handleCreditPoints}
                className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
              >
                <div className="flex items-center gap-2 text-[#147A80] font-semibold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Lançamento Manual de Pontos Avulsos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Telefone do Paciente</label>
                    <input
                      type="text"
                      required
                      placeholder="63984123456"
                      value={creditPhone}
                      onChange={(e) => setCreditPhone(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Nome (opcional)</label>
                    <input
                      type="text"
                      placeholder="Carlos Henrique"
                      value={creditName}
                      onChange={(e) => setCreditName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Quantidade de Pontos</label>
                    <input
                      type="number"
                      required
                      value={creditPoints}
                      onChange={(e) => setCreditPoints(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#147A80] focus:outline-none focus:ring-2 focus:ring-[#147A80] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Motivo do Lançamento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cortesia de aniversário / Gincana de prevenção"
                    value={creditDesc}
                    onChange={(e) => setCreditDesc(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {creditStatus ? (
                    <span className="text-xs font-medium text-emerald-700">{creditStatus}</span>
                  ) : <span />}
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lançar Pontuação</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 tabular-nums">
                  Pacientes com Pontuação Ativa ({patients.length})
                </h4>
                {patients.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhum paciente com pontos registrados ainda.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {patients.map((p) => (
                      <div key={p.phone} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <p className="font-semibold text-slate-900">{p.patientName}</p>
                          <p className="text-[11px] text-slate-400 font-mono tabular-nums">{p.phone}</p>
                        </div>
                        <div className="flex items-center gap-2.5 tabular-nums">
                          <span className="text-xs text-slate-500">Nível {p.tier}</span>
                          <span className="font-semibold text-[#147A80]">{p.totalPoints} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="space-y-3">
              {vouchers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum resgate de voucher registrado ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {vouchers.map((v) => {
                    const code = v.secretCode || v.secret_code || 'BT-0000';
                    const title = v.rewardTitle || v.reward?.title || 'Brinde';
                    const name = v.patientName || v.patient_name || 'Paciente';
                    const phone = v.patientPhone || v.patient_phone || '';
                    const claimedDate = v.claimedAt || v.claimed_at;
                    return (
                      <div key={v.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#147A80] tracking-wider tabular-nums">{code}</span>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                v.status === 'claimed'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {v.status === 'claimed' ? 'Entregue' : 'Pendente de Retirada'}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 mt-0.5">{title}</p>
                          <p className="text-xs text-slate-500">
                            Paciente: <strong className="font-medium text-slate-700">{name}</strong> ({phone})
                          </p>
                        </div>

                        {v.status !== 'claimed' ? (
                          <button
                            onClick={() => handleClaim(code)}
                            className="h-9 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs shrink-0 cursor-pointer"
                          >
                            Dar Baixa
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                            Retirado em {new Date(claimedDate || '').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#147A80]" />
            Controle de Gamificação Bertuol Odontologia
          </span>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 font-medium text-xs sm:text-sm text-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
