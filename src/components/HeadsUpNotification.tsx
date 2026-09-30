import React, { useEffect, useState, useRef } from 'react';
import {
  notificationService,
  PushNotificationPayload,
} from '../services/notificationService';
import { Bell, X, Sparkles, ChevronRight, Stethoscope, Clock, Pause } from 'lucide-react';

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
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(20);
  const [secondsLeft, setSecondsLeft] = useState(20);

  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((payload) => {
      const configuredDuration = notificationService.getBannerDisplayDuration();
      setDuration(configuredDuration);
      setSecondsLeft(configuredDuration);
      setCurrent(payload);
      setVisible(true);
      setIsPaused(false);
    });

    return () => unsubscribe();
  }, []);

  // Countdown timer with pause on hover/interaction
  useEffect(() => {
    if (!visible || duration === 0) return; // 0 = persistent / sticky

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, duration, current]);

  if (!visible || !current) return null;

  const handleClick = () => {
    setVisible(false);
    if (current.appointmentId && onOpenAppointment) {
      onOpenAppointment(current.appointmentId);
    } else if (onOpenDailyBriefing) {
      onOpenDailyBriefing();
    }
  };

  const progressPercent = duration > 0 ? (secondsLeft / duration) * 100 : 100;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-[94%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        onClick={handleClick}
        className="relative bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-amber-400/90 cursor-pointer hover:bg-white transition-all ring-4 ring-amber-400/20"
        role="alert"
        aria-live="assertive"
      >
        {/* Top App Identity Line */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#FFB347] text-white flex items-center justify-center">
              <Stethoscope className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-bold text-gray-800 tracking-tight">
              BERTUOL ODONTOLOGIA • PUSH
            </span>
          </div>

          <div className="flex items-center gap-2">
            {duration > 0 ? (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-colors ${
                  isPaused
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isPaused ? (
                  <>
                    <Pause className="w-2.5 h-2.5" />
                    Pausado
                  </>
                ) : (
                  <>
                    <Clock className="w-2.5 h-2.5" />
                    {secondsLeft}s
                  </>
                )}
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                Fixo na Tela
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Dispensar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Line */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#ff8f00] flex items-center justify-center shrink-0 border border-amber-200 mt-0.5">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-[#1A1A1A] leading-tight flex items-center gap-1.5">
              {current.title}
            </h4>
            <p className="text-xs text-gray-700 mt-1 leading-snug line-clamp-2 font-medium">
              {current.body}
            </p>
          </div>
        </div>

        {/* Action Button inside notification */}
        <div className="mt-2.5 pt-2 flex items-center justify-between text-xs border-t border-gray-100">
          <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB347]" />
            {current.isDailyBriefing
              ? 'Toque para abrir e ver o Resumo Executivo da Agenda'
              : 'Toque para abrir a consulta e ver o Resumo IA'}
          </span>
          <div className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-0.5 shadow-2xs">
            <span>Abrir</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Visual Progress Bar displaying remaining time */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-amber-100 rounded-b-2xl overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isPaused ? 'bg-amber-600' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
