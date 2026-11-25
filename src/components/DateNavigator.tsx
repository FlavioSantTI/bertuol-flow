import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateKey } from '../services/dataService';

interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  totalAppointments: number;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onDateChange,
  totalAppointments,
}) => {
  const handlePreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1);
    onDateChange(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    onDateChange(next);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday = formatDateKey(currentDate) === formatDateKey(new Date());

  const formattedDayOfWeek = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const capitalizedDayOfWeek =
    formattedDayOfWeek.charAt(0).toUpperCase() + formattedDayOfWeek.slice(1);
  const formattedFullDate = currentDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        {/* Clean Date & Count Header (Zero Pill) */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-[#147A80]">
              {isToday ? 'Hoje' : capitalizedDayOfWeek}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {totalAppointments} {totalAppointments === 1 ? 'consulta' : 'consultas'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5 truncate">
            {formattedFullDate}
          </h2>
        </div>

        {/* Segmented Date Controls */}
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handlePreviousDay}
            title="Dia Anterior"
            aria-label="Dia Anterior"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 min-h-[38px] px-3 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white/70 font-medium text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            onClick={handleToday}
            title="Ir para Hoje"
            aria-label="Ir para Hoje"
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
              isToday
                ? 'bg-[#147A80] text-white shadow-2xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Hoje</span>
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            title="Dia Seguinte"
            aria-label="Dia Seguinte"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 min-h-[38px] px-3 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-white/70 font-medium text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
