import React, { useEffect, useState } from 'react';
import {
  notificationService,
  PushNotificationPayload,
} from '../services/notificationService';
import { X, ChevronRight, Stethoscope, Pin } from 'lucide-react';
import { BertuolBotAvatar } from './BertuolBotAvatar';

interface HeadsUpNotificationProps {
  onOpenAppointment?: (appointmentId: number) => void;
  onOpenDailyBriefing?: () => void;
}

export const HeadsUpNotification: React.FC<HeadsUpNotificationProps> = ({
  onOpenAppointment,
  onOpenDailyBriefing,
}) => {
  const [current, setCurrent] = useState<PushNotificationPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((payload) => {
      setCurrent(payload);
      setVisible(true);
    });

    return () => unsubscribe();
  }, []);

  // Fechar notificação fixada ao pressionar a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        setVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  if (!visible || !current) return null;

  const handleClick = () => {
    setVisible(false);
    if (current.appointmentId && onOpenAppointment) {
      onOpenAppointment(current.appointmentId);
    } else if (onOpenDailyBriefing) {
      onOpenDailyBriefing();
    }
  };

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-lg animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <div
        className="relative bg-white/98 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-200 ring-1 ring-slate-900/5 space-y-3"
        role="alert"
        aria-live="assertive"
      >
        {/* Top App Identity Line */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 tracking-tight">
              Bertuol Odontologia • Notificação
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de Notificação Fixada na Tela */}
            <span className="text-[11px] bg-teal-50 text-[#147A80] border border-teal-200/80 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Pin className="w-3 h-3 rotate-45" />
              <span>Fixado na Tela</span>
            </span>

            <button
              type="button"
              onClick={() => setVisible(false)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Sair / Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Line */}
        <div className="flex items-start gap-3">
          <BertuolBotAvatar mood="alert" size="md" className="shrink-0 mt-0.5" showRadarWaves={false} />

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              {current.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium tabular-nums">
              {current.body}
            </p>
          </div>
        </div>

        {/* Informative Guidance & Action Buttons */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[10px] border border-slate-200">
              ESC
            </span>
            <span className="font-medium">
              ou clique em <strong className="text-slate-800 font-semibold">Sair</strong> para fechar
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Sair (Esc)</span>
            </button>

            <button
              type="button"
              onClick={handleClick}
              className="h-9 px-3.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{current.isDailyBriefing ? 'Ver Resumo' : 'Abrir Consulta'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
