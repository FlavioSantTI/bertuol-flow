import React, { useState, useRef } from 'react';
import {
  Check,
  ShieldCheck,
  FileText,
  Lock,
  LogOut,
  Loader2,
  AlertCircle,
  X,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { BertuolLogo } from '../../components/BertuolLogo';
import {
  CLUBE_SORRISO_CLAUSES,
  CLUBE_SORRISO_KEY_RULES,
  CLUBE_SORRISO_LEVELS,
  CLUBE_SORRISO_OPERATOR,
  CLUBE_SORRISO_PRIVACY_SECTIONS,
  CLUBE_SORRISO_TERMS_LABEL,
  CLUBE_SORRISO_TERMS_VERSION,
  CLUBE_SORRISO_UNITS,
  type PatientTermsAcceptanceRecord,
} from '../../data/clubeSorrisoTerms';
import { patientApiService } from '../services/patientApiService';

interface PatientTermsGateProps {
  mode: 'gate' | 'viewer';
  patientName: string;
  patientPhone: string;
  patientId?: string | null;
  clinicId?: number;
  existingAcceptance?: PatientTermsAcceptanceRecord | null;
  onAccepted?: (record: PatientTermsAcceptanceRecord) => void;
  onDeclineAndLogout?: () => void;
  onCloseViewer?: () => void;
}

type ReaderTab = 'clauses' | 'summary' | 'privacy';

function formatAcceptanceDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const PatientTermsGate: React.FC<PatientTermsGateProps> = ({
  mode,
  patientName,
  patientPhone,
  patientId,
  clinicId = 1,
  existingAcceptance = null,
  onAccepted,
  onDeclineAndLogout,
  onCloseViewer,
}) => {
  const [activeTab, setActiveTab] = useState<ReaderTab>('clauses');
  const [acceptedMandatory, setAcceptedMandatory] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      return;
    }
    const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / maxScroll) * 100)));
    setScrollProgress(pct);
  };

  const handleSwitchTab = (tab: ReaderTab) => {
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setScrollProgress(0);
  };

  const handleConfirmAccept = async () => {
    if (!acceptedMandatory || isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await patientApiService.acceptTerms({
        phone: patientPhone,
        patientId: patientId || undefined,
        patientName,
        clinicId,
        acceptedTerms: true,
        acceptedPrivacy: true,
        marketingOptIn,
        termsVersion: CLUBE_SORRISO_TERMS_VERSION,
        channel: 'patient_portal_first_access',
      });

      if (!response.success || !response.acceptance) {
        setErrorMessage('Não foi possível confirmar o registro do seu aceite. Tente novamente.');
        return;
      }

      onAccepted?.(response.acceptance);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Erro de conexão ao registrar seu aceite. Verifique sua internet e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isViewer = mode === 'viewer';

  return (
    <div
      className={
        isViewer
          ? 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4'
          : 'min-h-screen bg-slate-50 text-slate-900 flex flex-col'
      }
      role={isViewer ? 'dialog' : 'main'}
      aria-modal={isViewer ? true : undefined}
      aria-labelledby="clube-sorriso-terms-title"
    >
      <div
        className={
          isViewer
            ? 'w-full max-w-3xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden'
            : 'w-full max-w-3xl mx-auto flex-1 flex flex-col bg-white sm:my-6 sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm overflow-hidden'
        }
      >
        {/* Header */}
        <header className="px-4 sm:px-6 pt-4 pb-3.5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#147A80]/10 flex items-center justify-center shrink-0">
                <BertuolLogo className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#147A80] tracking-tight">
                  Clube Sorriso Bertuol · {CLUBE_SORRISO_TERMS_LABEL}
                </p>
                <h1
                  id="clube-sorriso-terms-title"
                  className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate"
                >
                  {isViewer ? 'Regulamento Oficial e Privacidade' : 'Aceite Obrigatório para Primeiro Acesso'}
                </h1>
              </div>
            </div>

            {isViewer && onCloseViewer && (
              <button
                type="button"
                onClick={onCloseViewer}
                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Fechar regulamento"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {!isViewer ? (
            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
              Olá, <span className="font-semibold text-slate-900">{patientName}</span>. Para acessar suas consultas,
              check-in e pontos do programa, leia e aceite o regulamento e a política de privacidade abaixo.
            </p>
          ) : existingAcceptance ? (
            <div className="mt-3 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#147A80] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">Aceite registrado eletronicamente</span> em{' '}
                  <span className="font-medium tabular-nums">
                    {formatAcceptanceDate(existingAcceptance.acceptedAt)}
                  </span>{' '}
                  · Versão <span className="font-mono">{existingAcceptance.termsVersion}</span>
                </div>
              </div>
              <div className="text-xs text-slate-600 sm:text-right shrink-0">
                Comunicações:{' '}
                <span className="font-semibold text-slate-900">
                  {existingAcceptance.marketingOptIn ? 'Autorizadas' : 'Não autorizadas'}
                </span>
              </div>
            </div>
          ) : null}

          {/* Segmented Reader Tabs */}
          <div
            role="tablist"
            aria-label="Seções do regulamento"
            className="mt-3.5 grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'clauses'}
              onClick={() => handleSwitchTab('clauses')}
              className={`min-h-[44px] px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'clauses'
                  ? 'bg-white text-[#147A80] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 hidden sm:block" />
              <span>Regulamento</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'summary'}
              onClick={() => handleSwitchTab('summary')}
              className={`min-h-[44px] px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-white text-[#147A80] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 shrink-0 hidden sm:block" />
              <span>Regras e Níveis</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              onClick={() => handleSwitchTab('privacy')}
              className={`min-h-[44px] px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white text-[#147A80] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0 hidden sm:block" />
              <span>Privacidade</span>
            </button>
          </div>
        </header>

        {/* Subtle reading progress hairline */}
        <div className="h-0.5 w-full bg-slate-100 shrink-0" aria-hidden="true">
          <div
            className="h-full bg-[#147A80] transition-all duration-150"
            style={{ width: `${Math.max(8, scrollProgress)}%` }}
          />
        </div>

        {/* Scrollable Document Body */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5 bg-white"
        >
          {activeTab === 'clauses' && (
            <section className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Regulamento do Programa Clube Sorriso Bertuol
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {CLUBE_SORRISO_OPERATOR} · {CLUBE_SORRISO_UNITS}
                </p>
              </div>

              <ol className="divide-y divide-slate-100">
                {CLUBE_SORRISO_CLAUSES.map((clause) => (
                  <li key={clause.number} className="py-3.5 first:pt-0 last:pb-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                      <span className="text-[#147A80] tabular-nums mr-1.5">
                        Cláusula {clause.number}.
                      </span>
                      {clause.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{clause.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {activeTab === 'summary' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Níveis e Multiplicadores de Pontos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Definidos pelos pontos de status dos últimos 12 meses ou entrada acelerada.
                </p>

                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="hidden sm:grid sm:grid-cols-12 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <span className="col-span-2">Nível</span>
                    <span className="col-span-2">Fator</span>
                    <span className="col-span-4">Critério de Acesso</span>
                    <span className="col-span-4">Benefício Principal</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {CLUBE_SORRISO_LEVELS.map((level) => (
                      <div
                        key={level.id}
                        className="px-4 py-3 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-start text-sm"
                      >
                        <div className="sm:col-span-2 flex items-center justify-between sm:block">
                          <span className="font-bold text-slate-900">{level.name}</span>
                          <span className="sm:hidden font-bold text-[#147A80] tabular-nums">
                            {level.multiplier}
                          </span>
                        </div>
                        <div className="hidden sm:block sm:col-span-2 font-bold text-[#147A80] tabular-nums">
                          {level.multiplier}
                        </div>
                        <div className="sm:col-span-4 text-xs sm:text-sm text-slate-700 leading-snug">
                          {level.requirement}
                        </div>
                        <div className="sm:col-span-4 text-xs text-slate-500 leading-snug">
                          {level.highlight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Regras Essenciais do Programa
                </h2>
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {CLUBE_SORRISO_KEY_RULES.map((rule) => (
                    <div key={rule.title} className="py-3">
                      <h3 className="text-sm font-semibold text-slate-900">{rule.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{rule.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'privacy' && (
            <section className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Política de Privacidade e Conformidade Legal (LGPD)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Lei 13.709/2018 (LGPD) · Código de Defesa do Consumidor · Resolução CFO 271/2025
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {CLUBE_SORRISO_PRIVACY_SECTIONS.map((sec) => (
                  <div key={sec.title} className="py-3.5 first:pt-0 last:pb-0">
                    <h3 className="text-sm font-semibold text-slate-900">{sec.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{sec.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer: Gate Acceptance Controls OR Viewer Receipt Close */}
        {!isViewer ? (
          <footer className="sticky bottom-0 z-10 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/95 backdrop-blur-md space-y-3 shrink-0">
            {/* Mandatory Terms + Privacy Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-[#147A80]/50 transition-colors cursor-pointer min-h-[48px]">
              <input
                type="checkbox"
                checked={acceptedMandatory}
                onChange={(e) => {
                  setAcceptedMandatory(e.target.checked);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  acceptedMandatory
                    ? 'bg-[#147A80] border-[#147A80] text-white'
                    : 'bg-white border-slate-300 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span className="text-xs sm:text-sm text-slate-700 leading-snug">
                <strong className="text-slate-900">Obrigatório:</strong> Li e aceito integralmente o{' '}
                <strong className="text-slate-900">Regulamento do Clube Sorriso Bertuol (Versão 1.0)</strong> e a{' '}
                <strong className="text-slate-900">Política de Privacidade (LGPD)</strong>.
              </span>
            </label>

            {/* Optional LGPD Marketing Consent Checkbox */}
            <label className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/80 hover:border-slate-300 transition-colors cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  marketingOptIn
                    ? 'bg-[#147A80] border-[#147A80] text-white'
                    : 'bg-white border-slate-300 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span className="text-xs text-slate-600 leading-snug">
                <span className="font-semibold text-slate-800">Opcional (LGPD):</span> Autorizo receber avisos de
                vencimento de pontos, novidades e benefícios do Clube Sorriso Bertuol.
              </span>
            </label>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row-reverse items-stretch sm:items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={!acceptedMandatory || isSubmitting}
                onClick={handleConfirmAccept}
                className={`min-h-[48px] flex-1 px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  acceptedMandatory && !isSubmitting
                    ? 'bg-[#147A80] hover:bg-[#106368] text-white shadow-sm cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando aceite...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Aceitar Termos e Acessar o App</span>
                  </>
                )}
              </button>

              {onDeclineAndLogout && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onDeclineAndLogout}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Não concordo · Sair</span>
                </button>
              )}
            </div>
          </footer>
        ) : (
          <footer className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 truncate">
              {existingAcceptance?.termsHash
                ? `Registro verificado · #${existingAcceptance.termsHash.slice(0, 12)}`
                : `Documento oficial · ${CLUBE_SORRISO_TERMS_VERSION}`}
            </div>
            {onCloseViewer && (
              <button
                type="button"
                onClick={onCloseViewer}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#147A80] hover:bg-[#106368] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Entendi
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
};
