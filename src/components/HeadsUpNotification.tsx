import React, { useEffect, useState } from 'react';
import {
  notificationService,
  PushNotificationPayload,
} from '../services/notificationService';
import { X, Sparkles, ChevronRight, Stethoscope, Pin } from 'lucide-react';
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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-lg animate-in slide-in-from-top-4 fade-in duration-300 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div
        className="relative bg-white/98 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-[#4BBCBE] ring-4 ring-[#4BBCBE]/20 space-y-3"
        role="alert"
        aria-live="assertive"
      >
        {/* Top App Identity Line */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#4BBCBE] text-white flex items-center justify-center">
              <Stethoscope className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-black text-gray-800 tracking-tight uppercase">
              BERTUOL ODONTOLOGIA • NOTIFICAÇÃO
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de Notificação 100% Fixada na Tela */}
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Pin className="w-3 h-3 text-emerald-600 rotate-45" />
              <span>Fixado na Tela</span>
            </span>

            <button
              onClick={() => setVisible(false)}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Sair / Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Line */}
        <div className="flex items-start gap-3">
          <BertuolBotAvatar mood="alert" size="md" className="shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
              {current.title}
            </h4>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed font-medium">
              {current.body}
            </p>
          </div>
        </div>

        {/* Informative Guidance & Action Buttons */}
        <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Mensagem solicitada pelo usuário para sair pelo botão Sair ou ESC */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-900 font-mono font-black text-[10px] border border-gray-300 shadow-2xs">
              ESC
            </span>
            <span className="font-semibold text-gray-600">
              ou clique em <strong className="text-gray-900 font-bold">Sair</strong> para fechar
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Botão Sair com atalho ESC */}
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 font-bold text-xs border border-gray-200 hover:border-rose-200 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <X className="w-3.5 h-3.5 text-rose-500" />
              <span>Sair (Esc)</span>
            </button>

            {/* Botão Abrir Consulta ou Detalhes */}
            <button
              type="button"
              onClick={handleClick}
              className="px-3.5 py-1.5 rounded-xl bg-[#4BBCBE] hover:bg-[#199A9F] text-white font-black text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{current.isDailyBriefing ? 'Ver Resumo' : 'Abrir Consulta'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
