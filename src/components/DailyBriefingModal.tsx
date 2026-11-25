import React, { useState } from 'react';
import { Appointment, Dentist, Clinic } from '../types/database';
import {
  X,
  Sparkles,
  Clock,
  User,
  Calendar,
  Building2,
  Copy,
  Check,
  Bell,
  ChevronRight,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  selectedDentist: Dentist | null;
  clinic: Clinic | undefined;
  date: string;
  onSelectAppointment: (appointment: Appointment) => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  appointments,
  selectedDentist,
  clinic,
  date,
  onSelectAppointment,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPushScheduled, setIsPushScheduled] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format date nicely: "Segunda-feira, 28 de Setembro"
  const formattedDate = (() => {
    try {
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
    } catch {
      return date;
    }
  })();

  const dentistName = selectedDentist?.Name || 'Dr(a). Profissional';
  const clinicName = clinic?.name || 'Bertuol Odontologia Avançada';
  const total = appointments.length;
  const firstAppt = appointments[0];
  const lastAppt = appointments[appointments.length - 1];

  // Group procedures / categories count
  const procedureCounts: { [key: string]: number } = {};
  appointments.forEach((a) => {
    const cat = a.category?.description || 'Geral';
    procedureCounts[cat] = (procedureCounts[cat] || 0) + 1;
  });

  // Default smart synthesized executive summary
  const defaultSummary = (() => {
    if (total === 0) {
      return `Nenhum atendimento agendado para ${dentistName} nesta data. Aproveite para planejamento clínico e revisão de prontuários.`;
    }
    const catHighlights = Object.entries(procedureCounts)
      .map(([cat, qty]) => `${qty} ${cat}`)
      .join(', ');

    return `Bom dia, ${dentistName}! Hoje você tem ${total} atendimento${
      total > 1 ? 's' : ''
    } na unidade ${clinic?.shortName || 'Matriz'}. A sua jornada inicia às ${firstAppt?.fromTime} com ${
      firstAppt?.PatientName
    } (${firstAppt?.Procedures}) e encerra às ${lastAppt?.toTime}. Procedimentos do dia: ${catHighlights}. Todos os registros sincronizados com o Clinicorp.`;
  })();

  const currentSummary = aiSummary || defaultSummary;

  const handleGenerateAiBriefing = async () => {
    setIsGeneratingAi(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: 0,
          patientName: `Briefing Diário - ${dentistName}`,
          procedures: appointments.map((a) => `${a.fromTime} - ${a.PatientName} (${a.Procedures})`).join('; '),
          notes: `Total de ${total} pacientes agendados para ${date} na clínica ${clinicName}.`,
          category: 'Resumo Executivo da Agenda do Dia',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Falha ao conectar com o Google Gemini');
      }

      if (data.summary) {
        setAiSummary(data.summary);
      }
    } catch (err: any) {
      console.warn('Erro ao gerar briefing com IA:', err);
      setErrorMessage(
        'Usando síntese clínica local. (O Google Gemini está disponível quando a chave de API estiver conectada).'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopySummary = () => {
    const textToCopy = `RESUMO DA AGENDA • BERTUOL ODONTOLOGIA\nProfissional: ${dentistName}\nData: ${formattedDate}\nClínica: ${clinicName}\nTotal: ${total} atendimentos\n\n${currentSummary}\n\nProgramação:\n${appointments
      .map((a) => `• ${a.fromTime} - ${a.PatientName} (${a.Procedures})`)
      .join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendPushToDevice = () => {
    notificationService.dispatch({
      id: Date.now().toString(),
      title: `Agenda de Hoje • ${dentistName}`,
      body: `${total} consultas agendadas (${firstAppt?.fromTime || '08:00'} às ${lastAppt?.toTime || '17:00'}). 1º: ${firstAppt?.PatientName || 'Paciente'} (${firstAppt?.Procedures || 'Consulta'}).`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      category: 'Resumo Diário',
      isDailyBriefing: true,
    });

    setIsPushScheduled(true);
    setTimeout(() => setIsPushScheduled(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-[#147A80]">Briefing Executivo</span>
                <span className="text-slate-300">·</span>
                <span className="capitalize">{formattedDate}</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                Resumo da Agenda · {dentistName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Fechar resumo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]/40">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs font-medium text-slate-500 block">Total Consultas</span>
              <p className="text-xl sm:text-2xl font-semibold text-[#147A80] mt-0.5 tabular-nums">{total}</p>
              <span className="text-[11px] text-slate-500">hoje na agenda</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs font-medium text-slate-500 block">1º Atendimento</span>
              <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5 tabular-nums">
                {firstAppt ? firstAppt.fromTime : '--:--'}
              </p>
              <span className="text-[11px] text-slate-500 truncate block">
                {firstAppt ? firstAppt.PatientName.split(' ')[0] : 'Sem paciente'}
              </span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs font-medium text-slate-500 block">Término Previsto</span>
              <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-0.5 tabular-nums">
                {lastAppt ? lastAppt.toTime : '--:--'}
              </p>
              <span className="text-[11px] text-slate-500">última saída</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs font-medium text-slate-500 block">Unidade</span>
              <p className="text-base sm:text-lg font-semibold text-slate-900 mt-1 truncate">
                {clinic?.shortName || 'Matriz'}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Online
              </span>
            </div>
          </div>

          {/* AI Clinical Executive Summary Box */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#147A80]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Síntese Clínica Inteligente
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAiBriefing}
                  disabled={isGeneratingAi}
                  className="h-9 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Atualizar síntese com Google Gemini"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#147A80] ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Recalcular com IA</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  className="w-9 h-9 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Copiar Resumo"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
              {currentSummary}
            </p>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Timeline of the day */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-600 tabular-nums">
                Ordem Cronológica das Consultas ({total})
              </h3>
              <span className="text-xs text-slate-400">Toque para abrir a ficha</span>
            </div>

            {total === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                Nenhum paciente agendado para hoje.
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((appt, idx) => (
                  <div
                    key={appt.id}
                    onClick={() => {
                      onClose();
                      onSelectAppointment(appt);
                    }}
                    className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-[#147A80]/50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col items-center justify-center w-14 py-1.5 rounded-lg bg-slate-100 group-hover:bg-teal-50 text-slate-800 group-hover:text-[#147A80] transition-colors shrink-0 tabular-nums">
                        <span className="text-[10px] font-medium text-slate-400">#{idx + 1}</span>
                        <span className="text-xs font-semibold">{appt.fromTime}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">
                            {appt.PatientName}
                          </h4>
                          {appt.category && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 shrink-0">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: appt.category.color }}
                              />
                              {appt.category.description}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {appt.Procedures}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#147A80] font-medium shrink-0">
                      <span className="hidden sm:inline">Ver ficha</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleSendPushToDevice}
            className="w-full sm:w-auto h-10 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isPushScheduled ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            <span>
              {isPushScheduled ? 'Push Disparado para seu Aparelho' : 'Testar Notificação Push'}
            </span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopySummary}
              className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copiado' : 'Copiar Resumo'}</span>
            </button>

            <button
              onClick={onClose}
              className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
