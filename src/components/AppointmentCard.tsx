import React from 'react';
import { Appointment } from '../types/database';
import { ChevronRight, CheckCircle2, Phone } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const categoryColor = appointment.category?.color || '#147A80';
  const categoryName = appointment.category?.description || 'Geral';
  const hasAiSummary = Boolean(appointment.ai_summary);
  const clinic = appointment.clinic;
  const dentistName = appointment.dentist?.Name || appointment.dentist_name || 'Profissional';
  const specialty = appointment.dentist?.specialty?.split('•')[0]?.trim();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group w-full text-left bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-[#147A80]/50 rounded-xl px-4 py-3.5 transition-colors duration-150 cursor-pointer select-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Line 1: Clean Unboxed Metadata with Typographic Separators */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-600">
            <span className="font-semibold text-[#147A80] tabular-nums">
              {appointment.fromTime} – {appointment.toTime}
            </span>

            <span aria-hidden="true" className="text-slate-300">·</span>

            <span className="font-medium text-slate-800">{dentistName}</span>

            {specialty && (
              <>
                <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>
                <span className="text-slate-500 hidden sm:inline truncate max-w-[160px]">{specialty}</span>
              </>
            )}

            <span aria-hidden="true" className="text-slate-300">·</span>

            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: categoryColor }}
                aria-hidden="true"
              />
              <span>{categoryName}</span>
            </span>

            {clinic && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-500">{clinic.shortName}</span>
              </>
            )}

            {hasAiSummary && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Resumo pronto</span>
                </span>
              </>
            )}
          </div>

          {/* Line 2: Primary Anchor — Patient Name */}
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-[#147A80] transition-colors truncate">
              {appointment.PatientName}
            </h3>
            {appointment.patient?.Age && (
              <span className="text-xs text-slate-400 tabular-nums shrink-0">
                {appointment.patient.Age} anos
              </span>
            )}
          </div>

          {/* Line 3: Procedure */}
          <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-1">
            {appointment.Procedures}
          </p>
        </div>

        {/* Right Action Affordance */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
          {appointment.MobilePhone && (
            <span className="sm:hidden text-xs text-slate-500 flex items-center gap-1 font-mono tabular-nums">
              <Phone className="w-3 h-3 text-slate-400" />
              {appointment.MobilePhone}
            </span>
          )}

          <div className="w-9 h-9 rounded-lg bg-slate-50 group-hover:bg-[#EBF8F8] flex items-center justify-center text-slate-400 group-hover:text-[#147A80] transition-colors ml-auto sm:ml-0">
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Compact AI Summary Preview */}
      {hasAiSummary && appointment.ai_summary && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            <span className="font-semibold text-[#147A80]">Síntese clínica: </span>
            {appointment.ai_summary}
          </p>
        </div>
      )}
    </div>
  );
};
