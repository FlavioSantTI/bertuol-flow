import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
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

  // Format readable Portuguese date
  const formattedDayOfWeek = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const capitalizedDayOfWeek =
    formattedDayOfWeek.charAt(0).toUpperCase() + formattedDayOfWeek.slice(1);
  const formattedFullDate = currentDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white border-b border-gray-100 p-3 sm:p-4 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        {/* Date Display */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#147A80] bg-[#EBF8F8] px-2 py-0.5 rounded-md border border-[#4BBCBE]/30 shrink-0">
              {isToday ? 'Hoje' : capitalizedDayOfWeek}
            </span>
            <span className="text-xs text-gray-500 font-medium truncate">
              {totalAppointments} {totalAppointments === 1 ? 'consulta' : 'consultas'}
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-[#1E293B] tracking-tight mt-0.5 truncate">
            {formattedFullDate}
          </h2>
        </div>

        {/* Date Navigation Controls (RF03) */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
          {/* Previous Day */}
          <button
            onClick={handlePreviousDay}
            title="Dia Anterior"
            aria-label="Dia Anterior"
            className="flex-1 sm:flex-initial flex items-center justify-center min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-white hover:bg-[#F4F7F8] active:scale-95 border border-[#E2E6E7] text-[#1E293B] font-medium text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700 sm:mr-1 shrink-0" />
            <span className="hidden xs:inline">Anterior</span>
          </button>

          {/* Today Button */}
          <button
            onClick={handleToday}
            title="Ir para Hoje"
            aria-label="Ir para Hoje"
            className={`flex-1 sm:flex-initial flex items-center justify-center min-h-[44px] px-3 sm:px-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer ${
              isToday
                ? 'bg-linear-to-r from-[#4BBCBE] to-[#23B3BB] text-white hover:from-[#3BA8AA] hover:to-[#199A9F] shadow-[#4BBCBE]/30'
                : 'bg-white hover:bg-[#F4F7F8] border border-[#E2E6E7] text-[#1E293B]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1 shrink-0" />
            Hoje
          </button>

          {/* Next Day */}
          <button
            onClick={handleNextDay}
            title="Dia Seguinte"
            aria-label="Dia Seguinte"
            className="flex-1 sm:flex-initial flex items-center justify-center min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-white hover:bg-[#F4F7F8] active:scale-95 border border-[#E2E6E7] text-[#1E293B] font-medium text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
          >
            <span className="hidden xs:inline">Próximo</span>
            <ChevronRight className="w-4 h-4 text-gray-700 sm:ml-1 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
