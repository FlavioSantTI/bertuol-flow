import React, { useState } from 'react';
import {
  Phone,
  KeyRound,
  User,
  Building2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Stethoscope,
  Eye,
  EyeOff,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { BertuolLogo } from '../../components/BertuolLogo';
import { APP_VERSION } from '../../config/version';

import type { PatientTermsAcceptanceRecord } from '../../data/clubeSorrisoTerms';

export interface PatientLoginSuccessPayload {
  id?: string;
  name: string;
  phone: string;
  clinicId: number;
  token?: string;
  termsAccepted?: boolean;
  termsAcceptance?: PatientTermsAcceptanceRecord | null;
}

interface PatientLoginScreenProps {
  initialClinicId?: number;
  totemCheckinClinicName?: string | null;
  isVerifyingToken?: boolean;
  initialError?: string | null;
  onLoginSuccess: (payload: PatientLoginSuccessPayload) => void;
  onSwitchToStaffLogin?: () => void;
}

const formatPhoneMask = (raw: string): string => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formatCpfMask = (raw: string): string => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export const PatientLoginScreen: React.FC<PatientLoginScreenProps> = ({
  initialClinicId = 1,
  totemCheckinClinicName = null,
  isVerifyingToken = false,
  initialError = null,
  onLoginSuccess,
  onSwitchToStaffLogin,
}) => {
  const [authView, setAuthView] = useState<'credentials' | 'register' | 'reset'>('credentials');

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state (First access with simple password creation)
  const [fullName, setFullName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerCpf, setRegisterCpf] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [clinicId, setClinicId] = useState<number>(initialClinicId || 1);

  // Password reset state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetFirstName, setResetFirstName] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const switchView = (next: 'credentials' | 'register' | 'reset') => {
    setAuthView(next);
    setError(null);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.replace(/\D/g, '');
    if (cleanId.length < 8) {
      setError('Informe seu celular com DDD ou CPF completo.');
      return;
    }
    if (!password.trim()) {
      setError('Informe sua senha ou token de acesso.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/patient/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'credentials',
          identifier: cleanId,
          passwordOrToken: password.trim(),
          clinicId,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.patient) {
        setError(
          data?.error || 'Não foi possível validar seu acesso. Verifique os dados informados.'
        );
        return;
      }

      onLoginSuccess({
        id: data.patient.id ? String(data.patient.id) : undefined,
        name: data.patient.name,
        phone: data.patient.phone,
        clinicId: data.patient.clinicId || clinicId,
        token: data.token,
        termsAccepted: data.termsAccepted === true,
        termsAcceptance: data.termsAcceptance || null,
      });
    } catch {
      setError('Falha de conexão com o servidor. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = registerPhone.replace(/\D/g, '');
    const cleanCpf = registerCpf.replace(/\D/g, '');
    if (fullName.trim().length < 3) {
      setError('Informe seu nome completo.');
      return;
    }
    if (cleanPhone.length < 8) {
      setError('Informe seu celular com DDD (WhatsApp).');
      return;
    }
    if (registerPassword.trim().length < 4) {
      setError('Crie uma senha simples com pelo menos 4 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/patient/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'register',
          name: fullName.trim(),
          phone: cleanPhone,
          cpf: cleanCpf || undefined,
          password: registerPassword.trim(),
          clinicId,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.patient) {
        setError(data?.error || 'Não foi possível concluir seu acesso.');
        return;
      }

      onLoginSuccess({
        id: data.patient.id ? String(data.patient.id) : undefined,
        name: data.patient.name,
        phone: data.patient.phone,
        clinicId: data.patient.clinicId || clinicId,
        token: data.token,
        termsAccepted: data.termsAccepted === true,
        termsAcceptance: data.termsAcceptance || null,
      });
    } catch {
      setError('Falha de conexão com o servidor. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = resetIdentifier.replace(/\D/g, '');
    if (cleanId.length < 8) {
      setError('Informe seu celular com DDD ou CPF.');
      return;
    }
    if (resetFirstName.trim().length < 2) {
      setError('Informe seu primeiro nome para confirmar seu cadastro.');
      return;
    }
    if (resetNewPassword.trim().length < 4) {
      setError('A nova senha simples deve ter pelo menos 4 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/patient/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'reset-password',
          identifier: cleanId,
          firstName: resetFirstName.trim(),
          newPassword: resetNewPassword.trim(),
          clinicId,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.patient) {
        setError(data?.error || 'Não foi possível redefinir sua senha.');
        return;
      }

      onLoginSuccess({
        id: data.patient.id ? String(data.patient.id) : undefined,
        name: data.patient.name,
        phone: data.patient.phone,
        clinicId: data.patient.clinicId || clinicId,
        token: data.token,
        termsAccepted: data.termsAccepted === true,
        termsAcceptance: data.termsAcceptance || null,
      });
    } catch {
      setError('Falha de conexão com o servidor. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-emerald-50/40 to-white flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-teal-200/80 rounded-2xl shadow-sm p-8 max-w-sm w-full text-center space-y-3">
          <Loader2 className="w-7 h-7 text-[#0D9488] animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-slate-900">Preparando seu Clube Sorriso...</h2>
          <p className="text-xs text-slate-500">
            Validando seu link exclusivo de paciente. Aguarde um instante.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-emerald-50/35 to-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-900 antialiased selection:bg-[#0D9488]/20">
      <div className="w-full max-w-md mx-auto space-y-5">
        {/* Compact Mobile-First Header */}
        <header className="text-center space-y-2">
          <BertuolLogo size="lg" mode="full" className="mx-auto" />
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#0F766E]">
            <span>Portal do Paciente</span>
            <span aria-hidden="true" className="text-teal-300">·</span>
            <span>Clube Sorriso</span>
          </div>
        </header>

        {/* Focused Mobile-First Patient Auth Card */}
        <main className="bg-white rounded-2xl border border-teal-200/80 shadow-md overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#0D9488] to-emerald-500" />

          {authView !== 'reset' ? (
            <div className="grid grid-cols-2 border-b border-teal-100 bg-teal-50/40">
              <button
                type="button"
                onClick={() => switchView('credentials')}
                className={`min-h-[48px] px-3 py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  authView === 'credentials'
                    ? 'border-[#0D9488] text-[#0F766E] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Já tenho cadastro
              </button>
              <button
                type="button"
                onClick={() => switchView('register')}
                className={`min-h-[48px] px-3 py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  authView === 'register'
                    ? 'border-[#0D9488] text-[#0F766E] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Primeiro acesso
              </button>
            </div>
          ) : (
            <div className="px-5 py-3.5 border-b border-teal-100 bg-teal-50/40 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Criar ou redefinir senha
              </span>
              <button
                type="button"
                onClick={() => switchView('credentials')}
                className="inline-flex items-center gap-1 min-h-[40px] px-2 text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {authView === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <h1 className="text-base font-bold text-slate-900">
                    {totemCheckinClinicName ? 'Check-in de Chegada' : 'Entrar no Clube Sorriso'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {totemCheckinClinicName
                      ? `Entre com seu celular ou CPF para confirmar chegada em ${totemCheckinClinicName} (+20 pts)`
                      : 'Consultas, check-in rápido e pontos com seu celular ou CPF'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Celular (WhatsApp) ou CPF *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="(63) 99999-9999 ou CPF"
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Sua senha *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetIdentifier(identifier);
                        switchView('reset');
                      }}
                      className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer whitespace-nowrap py-1"
                    >
                      Esqueci ou criar senha
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha ou token"
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                    Primeira vez por aqui? Use o código recebido no WhatsApp ou toque em{' '}
                    <button
                      type="button"
                      onClick={() => switchView('register')}
                      className="text-[#0F766E] font-semibold hover:underline cursor-pointer"
                    >
                      Primeiro acesso
                    </button>
                    .
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Meu Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {authView === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <h1 className="text-base font-bold text-slate-900">Criar Meu Acesso</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ganhe +30 pts de boas-vindas no Clube Sorriso
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WhatsApp com DDD *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(formatPhoneMask(e.target.value))}
                        placeholder="(63) 99999-9999"
                        className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CPF (opcional)
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={registerCpf}
                        onChange={(e) => setRegisterCpf(formatCpfMask(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Crie uma senha simples (mín. 4 caracteres) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Ex: 4 dígitos ou palavra fácil"
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      aria-label={showRegisterPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade de atendimento
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={clinicId}
                      onChange={(e) => setClinicId(Number(e.target.value))}
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    >
                      <option value={1}>Unidade Matriz — Palmas (104 Sul)</option>
                      <option value={2}>Unidade Paraíso do Tocantins</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ativando seu acesso...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Acesso e Entrar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {authView === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Confirme seu celular ou CPF e seu primeiro nome para definir uma nova senha simples.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Celular (WhatsApp) ou CPF *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="(63) 99999-9999 ou CPF"
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seu primeiro nome *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={resetFirstName}
                      onChange={(e) => setResetFirstName(e.target.value)}
                      placeholder="Ex: Maria"
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nova senha simples (mín. 4 caracteres) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      className="w-full min-h-[46px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      aria-label={showResetPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showResetPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando nova senha...</span>
                    </>
                  ) : (
                    <>
                      <span>Salvar Nova Senha e Entrar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="px-5 py-3 bg-teal-50/40 border-t border-teal-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
              <span>Dados protegidos LGPD</span>
            </span>
            <span className="tabular-nums font-medium">v{APP_VERSION}</span>
          </div>
        </main>

        {/* Discrete Footer Link for Staff who landed on Patient Portal */}
        <footer className="flex flex-col items-center gap-2.5 pt-1 text-center text-xs text-slate-500">
          {onSwitchToStaffLogin && (
            <button
              type="button"
              onClick={onSwitchToStaffLogin}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#147A80]" />
              <span>É dentista ou equipe? Acessar login da clínica</span>
            </button>
          )}
          <span className="text-[11px] text-slate-400">
            © 2026 Bertuol Odontologia Avançada
          </span>
        </footer>
      </div>
    </div>
  );
};
