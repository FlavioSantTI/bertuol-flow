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

  const categoryColor = appointment.category?.color || '#FFB347';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: categoryColor }}
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Detalhes da Consulta (Clinicorp)
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] truncate">
                {appointment.PatientName}
              </h2>
            </div>
          </div>

          {/* Close button with 48x48 min touch target */}
          <button
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="flex items-center justify-center min-w-[48px] min-h-[48px] rounded-2xl bg-[#F8F9FA] hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Quick Badges */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Time Badge in prominent orange */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-[#ff8f00] font-bold text-sm border border-amber-200">
              <Clock className="w-4 h-4 text-[#FFB347]" />
              <span>
                {appointment.fromTime} – {appointment.toTime}
              </span>
            </div>

            {/* Category Badge */}
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs"
              style={{ backgroundColor: categoryColor }}
            >
              {categoryName}
            </span>

            {/* Professional / Dentist Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/90 text-amber-950 border border-amber-300 text-xs font-bold shadow-2xs">
              <Stethoscope className="w-3.5 h-3.5 text-[#d97706]" />
              <span>{appointment.dentist?.Name || appointment.dentist_name || 'Dr(a). Profissional'}</span>
            </div>

            {/* Insurance Plan */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span>{patient?.insurancePlanName || 'Particular'}</span>
            </div>
          </div>

          {/* Professional / Dentist Card */}
          <div className="bg-amber-50/70 rounded-2xl p-3.5 sm:p-4 border border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Profissional Responsável
                </span>
                <h4 className="text-sm sm:text-base font-bold text-gray-900">
                  {appointment.dentist?.Name || appointment.dentist_name || 'Dr(a). Profissional'}
                </h4>
                {appointment.dentist?.specialty && (
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">
                    {appointment.dentist.specialty}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Patient Card (RF04) */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FFB347]" />
                Dados do Paciente
              </span>
              {patient?.Age && (
                <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                  {patient.Age} anos
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Nome Completo</span>
                <p className="font-bold text-[#1A1A1A]">{appointment.PatientName}</p>
              </div>

              <div>
                <span className="text-xs text-gray-500 block">Telefone / Contato</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="font-semibold text-gray-800 hover:text-amber-600 transition-colors flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {appointment.MobilePhone || 'Não cadastrado'}
                  </a>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir WhatsApp"
                      className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
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
          <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#FFB347]" />
              Procedimento Previsto
            </span>
            <p className="text-base font-bold text-[#1A1A1A] leading-snug">
              {appointment.Procedures}
            </p>
          </div>

          {/* Clinical Notes / History (RF04) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Observações Clínicas Anteriores (Notes)
            </span>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-[#1A1A1A] leading-relaxed font-normal border border-gray-100">
              {appointment.Notes || patient?.Notes || (
                <span className="text-gray-400 italic">Nenhuma anotação prévia registrada.</span>
              )}
            </div>
          </div>

          {/* RF05 - AI Clinical Summary Section */}
          <div className="rounded-2xl border-2 border-[#FFB347]/50 bg-amber-50/40 p-4 sm:p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFB347] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#1A1A1A]">
                      Resumo Clínico Executivo (IA)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/90 text-amber-900 border border-amber-300">
                      Desativado na Fase de Testes
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-900/70 font-medium">
                    Google AI Studio • Gemini Flash
                  </span>
                </div>
              </div>

              {appointment.ai_summary && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopySummary}
                    title="Copiar Resumo"
                    className="p-2 rounded-xl bg-white hover:bg-amber-100 text-gray-700 transition-colors border border-amber-200 flex items-center gap-1 text-xs font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-600" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {/* Regenerate button disabled during test phase */}
                  <button
                    disabled={true}
                    title="Regeneração de IA provisoriamente desativada na fase de testes"
                    className="p-2 rounded-xl bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* AI Summary Display or Trigger Button */}
            {appointment.ai_summary ? (
              <div className="bg-white rounded-xl p-3.5 border border-amber-200/80 shadow-xs space-y-2 animate-in fade-in">
                <p className="text-sm text-[#1A1A1A] leading-relaxed font-medium">
                  {appointment.ai_summary}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                  <span>Gravado na tabela appointments (Supabase)</span>
                  <span className="font-semibold text-emerald-600">✓ Em cache</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Gera uma síntese executiva em até 3 frases sobre os pontos críticos, histórico e cuidados imediatos antes de iniciar o atendimento.
                </p>

                {/* Primary Orange AI Action Button - Provisoriamente desativado na fase de testes */}
                <button
                  type="button"
                  disabled={true}
                  title="Geração de resumo clínico provisoriamente desativada na fase de testes"
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-none cursor-not-allowed select-none opacity-80"
                >
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span>Gerar Resumo Clínico (IA) • Desativado na Fase de Testes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F8F9FA] border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            <span>Clinic_BusinessId: {appointment.Clinic_BusinessId}</span>
          </div>

          <button
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-white hover:bg-gray-200/70 border border-gray-300 text-[#1A1A1A] font-bold text-sm transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
