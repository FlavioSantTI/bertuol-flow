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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-[#147A80] via-[#0f5c61] to-[#147A80] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Gift className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Gestão da Gamificação & Clube Sorriso</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px]">
                  CRUD Ativo
                </span>
              </div>
              <p className="text-xs text-teal-100 font-medium">Controle de Regras (RF05), Prêmios (RF06), Vouchers e Pontos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-3 pt-2 gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('claim')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'claim'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Validar Voucher</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'rules'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>CRUD Regras ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'rewards'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>CRUD Prêmios ({rewards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'patients'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Lançar Pontos</span>
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vouchers'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Histórico ({vouchers.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* ========================================================
              TAB 1: VALIDAR VOUCHER / BAIXA
          ======================================================== */}
          {activeTab === 'claim' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Como funciona a entrega do brinde:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    O paciente apresentará o código no celular dele (ex: <strong>BT-4892</strong>). Digite o código abaixo para dar a baixa e entregar o brinde correspondente.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Código do Voucher (ex: BT-1234):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    placeholder="BT-____"
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 text-lg font-black tracking-widest text-[#147A80] uppercase focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                  />
                  <button
                    disabled={isProcessing || !secretCode.trim()}
                    onClick={() => handleClaim()}
                    className="px-6 py-3 rounded-2xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Validar & Entregar</span>
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

          {/* ========================================================
              TAB 2: CRUD DE REGRAS DE PONTUAÇÃO (RF05)
          ======================================================== */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Regras de Pontuação Automática
                  </h3>
                  <p className="text-xs text-gray-500">
                    Defina quantos pontos o paciente ganha por ação no consultório ou no app.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingRule(!isAddingRule)}
                  className="px-3 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Regra</span>
                </button>
              </div>

              {/* Add Rule Form */}
              {isAddingRule && (
                <form
                  onSubmit={handleCreateRule}
                  className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3 animate-in fade-in"
                >
                  <h4 className="text-xs font-black text-[#147A80] uppercase">Criar Nova Regra de Pontuação</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Título da Ação:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Indicação de Paciente"
                        value={newRuleTitle}
                        onChange={(e) => setNewRuleTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Pontos Ganhos:</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newRulePoints}
                        onChange={(e) => setNewRulePoints(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Descrição Detalhada:</label>
                    <input
                      type="text"
                      placeholder="Ex: Paciente indicou um colega que compareceu"
                      value={newRuleDesc}
                      onChange={(e) => setNewRuleDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingRule(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Salvar Regra
                    </button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs">{rule.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rule.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {rule.is_active ? 'Ativa' : 'Desativada'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{rule.description}</p>
                      <span className="text-[10px] text-gray-400 font-mono">Gatilho: {rule.trigger_event}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                        +{rule.points_reward} pts
                      </span>
                      <button
                        onClick={() => handleToggleRule(rule)}
                        title={rule.is_active ? 'Desativar Regra' : 'Ativar Regra'}
                        className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        {rule.is_active ? '⏸' : '▶'}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        title="Remover Regra"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: CRUD DO CATÁLOGO DE PRÊMIOS (RF06)
          ======================================================== */}
          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Catálogo de Brindes & Prêmios
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cadastre novos mimos, controle de estoque e pontuação necessária para resgate.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingReward(!isAddingReward)}
                  className="px-3 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Prêmio</span>
                </button>
              </div>

              {/* Add Reward Form */}
              {isAddingReward && (
                <form
                  onSubmit={handleCreateReward}
                  className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in"
                >
                  <h4 className="text-xs font-black text-amber-900 uppercase">Cadastrar Novo Brinde</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Título do Brinde:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Kit Clareamento Caseiro"
                        value={newRewardTitle}
                        onChange={(e) => setNewRewardTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Pontos Exigidos:</label>
                      <input
                        type="number"
                        required
                        min="10"
                        value={newRewardPoints}
                        onChange={(e) => setNewRewardPoints(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Estoque Inicial:</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={newRewardStock}
                        onChange={(e) => setNewRewardStock(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Descrição:</label>
                    <input
                      type="text"
                      placeholder="Ex: Estojo completo com bisnagas e moldeira"
                      value={newRewardDesc}
                      onChange={(e) => setNewRewardDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingReward(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Salvar Brinde
                    </button>
                  </div>
                </form>
              )}

              {/* Rewards Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 text-xs space-y-2 relative shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{reward.title}</h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{reward.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                        title="Excluir Prêmio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                      <span className="font-black text-sm text-[#147A80]">{reward.points_required} pts</span>

                      {/* Stock Adjustment Controls */}
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200">
                        <span className="text-[10px] text-gray-500 font-bold">Estoque:</span>
                        <button
                          onClick={() => handleUpdateStock(reward.id, reward.stock_available, -1)}
                          className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-black text-gray-900 px-1">{reward.stock_available}</span>
                        <button
                          onClick={() => handleUpdateStock(reward.id, reward.stock_available, 1)}
                          className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 font-bold text-xs flex items-center justify-center cursor-pointer"
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

          {/* ========================================================
              TAB 4: GESTÃO DE PONTOS DE PACIENTES
          ======================================================== */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              {/* Credit Points Form */}
              <form
                onSubmit={handleCreditPoints}
                className="p-4 rounded-2xl bg-linear-to-r from-teal-50 to-emerald-50 border border-teal-200 space-y-3"
              >
                <div className="flex items-center gap-2 text-[#147A80] font-black text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Lançamento Manual de Pontos Avulsos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Telefone do Paciente:</label>
                    <input
                      type="text"
                      required
                      placeholder="63984123456"
                      value={creditPhone}
                      onChange={(e) => setCreditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Nome (opcional):</label>
                    <input
                      type="text"
                      placeholder="Carlos Henrique"
                      value={creditName}
                      onChange={(e) => setCreditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Quantidade de Pontos:</label>
                    <input
                      type="number"
                      required
                      value={creditPoints}
                      onChange={(e) => setCreditPoints(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-[#147A80] focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Motivo do Lançamento:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cortesia de aniversário / Gincana de prevenção"
                    value={creditDesc}
                    onChange={(e) => setCreditDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:ring-2 focus:ring-[#147A80]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {creditStatus ? (
                    <span className="text-xs font-bold text-emerald-700 animate-in fade-in">{creditStatus}</span>
                  ) : <span />}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lançar Pontuação</span>
                  </button>
                </div>
              </form>

              {/* Patients Points Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase">
                  Pacientes com Pontuação Ativa ({patients.length})
                </h4>
                {patients.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Nenhum paciente com pontos registrados ainda.</p>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    {patients.map((p) => (
                      <div key={p.phone} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50">
                        <div>
                          <p className="font-bold text-gray-900">{p.patientName}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{p.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            Nível {p.tier}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                            {p.totalPoints} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: HISTÓRICO DE VOUCHERS GERADOS
          ======================================================== */}
          {activeTab === 'vouchers' && (
            <div className="space-y-3">
              {vouchers.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Nenhum resgate de voucher registrado ainda.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {vouchers.map((v) => {
                    const code = v.secretCode || v.secret_code || 'BT-0000';
                    const title = v.rewardTitle || v.reward?.title || 'Brinde';
                    const name = v.patientName || v.patient_name || 'Paciente';
                    const phone = v.patientPhone || v.patient_phone || '';
                    const claimedDate = v.claimedAt || v.claimed_at;
                    return (
                      <div key={v.id} className="p-3.5 bg-white hover:bg-gray-50 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[#147A80] tracking-wider">{code}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                v.status === 'claimed'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {v.status === 'claimed' ? 'Entregue' : 'Pendente de Retirada'}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900 mt-0.5">{title}</p>
                          <p className="text-[10px] text-gray-400">
                            Paciente: <strong>{name}</strong> ({phone})
                          </p>
                        </div>

                        {v.status !== 'claimed' ? (
                          <button
                            onClick={() => handleClaim(code)}
                            className="px-3 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
                          >
                            Dar Baixa
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 shrink-0">
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
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Controle de Gamificação Bertuol Odontologia
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-xs text-gray-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
