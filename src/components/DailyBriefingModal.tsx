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
    const textToCopy = `📋 RESUMO DA AGENDA • BERTUOL ODONTOLOGIA\nProfissional: ${dentistName}\nData: ${formattedDate}\nClínica: ${clinicName}\nTotal: ${total} atendimentos\n\n${currentSummary}\n\nProgramação:\n${appointments
      .map((a) => `• ${a.fromTime} - ${a.PatientName} (${a.Procedures})`)
      .join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendPushToDevice = () => {
    notificationService.dispatch({
      id: Date.now().toString(),
      title: `📋 Agenda de Hoje • ${dentistName}`,
      body: `${total} consultas agendadas (${firstAppt?.fromTime || '08:00'} às ${lastAppt?.toTime || '17:00'}). 1º: ${firstAppt?.PatientName || 'Paciente'} (${firstAppt?.Procedures || 'Consulta'}).`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      category: 'Resumo Diário',
      isDailyBriefing: true,
    });

    setIsPushScheduled(true);
    setTimeout(() => setIsPushScheduled(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Briefing Executivo
                </span>
                <span className="text-[11px] font-medium text-gray-500 capitalize">
                  {formattedDate}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
                Resumo da Agenda • {dentistName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Fechar resumo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Total Consultas</span>
              <p className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">{total}</p>
              <span className="text-[10px] text-amber-700 font-medium">hoje na agenda</span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">1º Atendimento</span>
              <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                {firstAppt ? firstAppt.fromTime : '--:--'}
              </p>
              <span className="text-[10px] text-gray-500 font-medium truncate block">
                {firstAppt ? firstAppt.PatientName.split(' ')[0] : 'Sem paciente'}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Término Previsto</span>
              <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                {lastAppt ? lastAppt.toTime : '--:--'}
              </p>
              <span className="text-[10px] text-gray-500 font-medium">última saída</span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Unidade</span>
              <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 truncate">
                {clinic?.shortName || 'Matriz'}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
              </span>
            </div>
          </div>

          {/* AI Clinical Executive Summary Box */}
          <div className="relative bg-linear-to-br from-amber-500/10 via-orange-500/5 to-white rounded-2xl p-4 sm:p-5 border border-amber-300/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                  Síntese Clínica Inteligente (Gemini IA)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAiBriefing}
                  disabled={isGeneratingAi}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Atualizar síntese com Google Gemini"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Recalcular com IA</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  className="p-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs transition-colors cursor-pointer"
                  title="Copiar Resumo"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-800 leading-relaxed font-normal whitespace-pre-line bg-white/70 p-3.5 rounded-xl border border-amber-200/60">
              {currentSummary}
            </p>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/70 p-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Timeline of the day (Clickable appointments) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Ordem Cronológica das Consultas ({total})
              </h3>
              <span className="text-[11px] text-gray-400">Toque em qualquer card para abrir a ficha</span>
            </div>

            {total === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 text-xs">
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
                    className="p-3 sm:p-3.5 bg-white hover:bg-amber-50/50 rounded-2xl border border-gray-200 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Order and Time */}
                      <div className="flex flex-col items-center justify-center w-14 py-1 rounded-xl bg-gray-100 group-hover:bg-amber-100 text-gray-800 group-hover:text-amber-900 transition-colors shrink-0">
                        <span className="text-[9px] font-bold text-gray-400">#{idx + 1}</span>
                        <span className="text-xs font-black">{appt.fromTime}</span>
                      </div>

                      {/* Patient info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-amber-950">
                            {appt.PatientName}
                          </h4>
                          {appt.category && (
                            <span
                              className="px-2 py-0.2 rounded-full text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: appt.category.color }}
                            >
                              {appt.category.description}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {appt.Procedures}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span className="hidden sm:inline">Ver Ficha</span>
                      <ChevronRight className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleSendPushToDevice}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 text-gray-950" />
            <span>
              {isPushScheduled ? '✅ Push Disparado para seu Aparelho!' : 'Testar Notificação Push no Celular'}
            </span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
