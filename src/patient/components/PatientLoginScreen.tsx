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
} from 'lucide-react';
import { BertuolLogo } from '../../components/BertuolLogo';
import { APP_VERSION } from '../../config/version';

export interface PatientLoginSuccessPayload {
  name: string;
  phone: string;
  clinicId: number;
  token?: string;
}

interface PatientLoginScreenProps {
  initialClinicId?: number;
  isVerifyingToken?: boolean;
  initialError?: string | null;
  onLoginSuccess: (payload: PatientLoginSuccessPayload) => void;
  onSwitchToStaffLogin?: () => void;
}

export const PatientLoginScreen: React.FC<PatientLoginScreenProps> = ({
  initialClinicId = 1,
  isVerifyingToken = false,
  initialError = null,
  onLoginSuccess,
  onSwitchToStaffLogin,
}) => {
  const [authTab, setAuthTab] = useState<'credentials' | 'register'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [passwordOrToken, setPasswordOrToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [clinicId, setClinicId] = useState<number>(initialClinicId || 1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.replace(/\D/g, '');
    if (cleanId.length < 8) {
      setError('Informe seu celular com DDD ou CPF completo.');
      return;
    }
    if (!passwordOrToken.trim()) {
      setError('Informe sua senha provisória ou token de ativação.');
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
          passwordOrToken: passwordOrToken.trim(),
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
        name: data.patient.name,
        phone: data.patient.phone,
        clinicId: data.patient.clinicId || clinicId,
        token: data.token,
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
    if (fullName.trim().length < 3) {
      setError('Informe seu nome completo.');
      return;
    }
    if (cleanPhone.length < 8) {
      setError('Informe seu celular com DDD (WhatsApp).');
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
          clinicId,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.patient) {
        setError(data?.error || 'Não foi possível concluir o acesso.');
        return;
      }

      onLoginSuccess({
        name: data.patient.name,
        phone: data.patient.phone,
        clinicId: data.patient.clinicId || clinicId,
        token: data.token,
      });
    } catch {
      setError('Falha de conexão com o servidor. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-sm w-full text-center space-y-3">
          <Loader2 className="w-7 h-7 text-[#147A80] animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-slate-900">Validando seu link de acesso...</h2>
          <p className="text-xs text-slate-500">
            Aguarde um instante enquanto carregamos seu portal do paciente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-900 antialiased selection:bg-[#147A80]/20">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BertuolLogo className="h-11" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-semibold text-[#147A80] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
              Portal do Paciente • Clube Sorriso
            </span>
            <h1 className="text-lg font-bold text-slate-900 mt-2">
              Acesse sua conta de paciente
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirme consultas, faça check-in na recepção e acompanhe seus pontos
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70">
            <button
              type="button"
              onClick={() => {
                setAuthTab('credentials');
                setError(null);
              }}
              className={`py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
                authTab === 'credentials'
                  ? 'border-[#147A80] text-[#147A80] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Já tenho acesso
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setError(null);
              }}
              className={`py-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
                authTab === 'register'
                  ? 'border-[#147A80] text-[#147A80] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Primeiro acesso
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {authTab === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Celular (WhatsApp) ou CPF *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Ex: (63) 99999-9999 ou CPF"
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha ou Token de Ativação *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={passwordOrToken}
                      onChange={(e) => setPasswordOrToken(e.target.value)}
                      placeholder="Token do WhatsApp ou senha provisória"
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Se ainda não recebeu seu token na recepção, utilize a aba{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('register');
                        setError(null);
                      }}
                      className="text-[#147A80] font-semibold hover:underline cursor-pointer"
                    >
                      Primeiro acesso
                    </button>
                    .
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando acesso...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Portal do Paciente</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Celular com DDD (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="(63) 99999-9999"
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade de atendimento
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={clinicId}
                      onChange={(e) => setClinicId(Number(e.target.value))}
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                    >
                      <option value={1}>Unidade Matriz — Palmas (104 Sul)</option>
                      <option value={2}>Unidade Paraíso do Tocantins</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ativando seu acesso...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar Clube Sorriso</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center space-y-2.5 text-xs text-slate-500">
          {onSwitchToStaffLogin && (
            <button
              type="button"
              onClick={onSwitchToStaffLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#147A80]" />
              <span>É dentista ou equipe? Login Profissional</span>
            </button>
          )}

          <p className="flex items-center justify-center gap-1.5 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Acesso protegido • Bertuol Odontologia</span>
          </p>
          <p className="text-[11px] text-slate-400 tabular-nums">Versão {APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
};
