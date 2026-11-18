import React, { useState } from 'react';
import { Appointment } from '../types/database';
import {
  X,
  Clock,
  User,
  Phone,
  Shield,
  FileText,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Stethoscope,
  Info,
  Lock,
} from 'lucide-react';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onUpdateSummary: (appointmentId: number, summary: string) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  onClose,
  onUpdateSummary,
}) => {
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!appointment) return null;

  const categoryColor = appointment.category?.color || '#4BBCBE';
  const categoryName = appointment.category?.description || 'Geral';
  const patient = appointment.patient;

  const handleGenerateSummary = async () => {
    setIsLoadingAi(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          patientName: appointment.PatientName,
          age: patient?.Age,
          procedures: appointment.Procedures,
          notes: appointment.Notes || patient?.Notes,
          category: categoryName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro ao comunicar com a IA');
      }

      if (data.summary) {
        onUpdateSummary(appointment.id, data.summary);
      }
    } catch (err: any) {
      console.error('Erro na síntese clínica:', err);
      setErrorMessage(
        err.message || 'Não foi possível gerar a síntese com o Google Gemini. Verifique a conexão.'
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopySummary = () => {
    if (appointment.ai_summary) {
      navigator.clipboard.writeText(appointment.ai_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // WhatsApp quick link
  const cleanPhone = appointment.MobilePhone?.replace(/\D/g, '') || '';
  const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-500 block">
                Detalhes da Consulta (Clinicorp)
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {appointment.PatientName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]/40">
          {/* Unified Clinical Metadata Strip */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#147A80]" />
                {appointment.fromTime} – {appointment.toTime}
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: categoryColor }}
                />
                {categoryName}
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                {patient?.insurancePlanName || 'Particular'}
              </span>
            </div>

            <div className="text-slate-700 font-medium flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#147A80]" />
              <span>{appointment.dentist?.Name || appointment.dentist_name || 'Dr(a). Profissional'}</span>
              {appointment.dentist?.specialty && (
                <span className="text-slate-400">· {appointment.dentist.specialty}</span>
              )}
            </div>
          </div>

          {/* Patient Card (RF04) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#147A80]" />
                Dados do Paciente
              </span>
              {patient?.Age && (
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {patient.Age} anos
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Nome Completo</span>
                <p className="font-semibold text-slate-900 mt-0.5">{appointment.PatientName}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Telefone / Contato</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="font-medium text-slate-800 hover:text-[#147A80] transition-colors flex items-center gap-1.5 tabular-nums"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {appointment.MobilePhone || 'Não cadastrado'}
                  </a>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir WhatsApp"
                      className="px-2 py-1 rounded-lg bg-teal-50 text-[#147A80] hover:bg-teal-100 border border-teal-200/70 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Procedure Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#147A80]" />
              Procedimento Previsto
            </span>
            <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
              {appointment.Procedures}
            </p>
          </div>

          {/* Clinical Notes / History (RF04) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#147A80]" />
              Observações Clínicas Anteriores
            </span>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-800 leading-relaxed border border-slate-200/70">
              {appointment.Notes || patient?.Notes || (
                <span className="text-slate-400 italic">Nenhuma anotação prévia registrada.</span>
              )}
            </div>
          </div>

          {/* RF05 - AI Clinical Summary Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Resumo Clínico Executivo (IA)
                    </h4>
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                      Desativado na Fase de Testes
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Síntese clínica · Gemini Flash
                  </span>
                </div>
              </div>

              {appointment.ai_summary && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopySummary}
                    title="Copiar Resumo"
                    className="h-9 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    disabled={true}
                    title="Regeneração de IA provisoriamente desativada na fase de testes"
                    className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center cursor-not-allowed opacity-70"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {appointment.ai_summary ? (
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2">
                <p className="text-sm text-slate-800 leading-relaxed">
                  {appointment.ai_summary}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/70">
                  <span>Gravado no Supabase</span>
                  <span className="font-medium text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Em cache
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gera uma síntese executiva em até 3 frases sobre os pontos críticos, histórico e cuidados imediatos antes de iniciar o atendimento.
                </p>

                <button
                  type="button"
                  disabled={true}
                  title="Geração de resumo clínico provisoriamente desativada na fase de testes"
                  className="w-full h-10 px-4 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Gerar Resumo Clínico (IA) · Desativado na Fase de Testes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 tabular-nums">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Unidade ID: {appointment.Clinic_BusinessId}</span>
          </div>

          <button
            onClick={onClose}
            className="h-10 px-5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
