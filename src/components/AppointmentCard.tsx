import React from 'react';
import { Appointment } from '../types/database';
import { Clock, Sparkles, ChevronRight, CheckCircle2, Building2, Stethoscope, Phone } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const categoryColor = appointment.category?.color || '#4BBCBE';
  const categoryName = appointment.category?.description || 'Geral';
  const hasAiSummary = Boolean(appointment.ai_summary);
  const clinic = appointment.clinic;
  const dentistName = appointment.dentist?.Name || appointment.dentist_name || 'Dr(a). Profissional';
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
      className="group w-full text-left bg-white hover:bg-[#FAFDFD] border border-[#E2E6E7] hover:border-[#4BBCBE]/60 rounded-2xl p-4 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer select-none relative overflow-hidden"
    >
      {/* Category colored indicator bar on left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-1.5">
        {/* Left Side: Time, Patient Name & Procedure */}
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Time & Badges Row */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Time in Turquoise Highlight */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EBF8F8] text-[#147A80] font-bold text-xs tracking-tight border border-[#4BBCBE]/30">
              <Clock className="w-3.5 h-3.5 text-[#199A9F]" />
              <span className="tabular-nums">
                {appointment.fromTime} – {appointment.toTime}
              </span>
            </div>

            {/* Professional / Dentist Tag */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF9E6] text-[#8C6B00] border border-[#FFCC29]/60 shadow-2xs">
              <Stethoscope className="w-3 h-3 text-[#D4A30B] shrink-0" />
              <span>{dentistName}</span>
            </span>

            {/* Category Tag with native Clinicorp color */}
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white tracking-wide shadow-2xs"
              style={{ backgroundColor: categoryColor }}
            >
              {categoryName}
            </span>

            {/* Multi-Tenant Clinic Badge */}
            {clinic && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs"
                style={{
                  backgroundColor: `${clinic.colorTag}15`,
                  borderColor: `${clinic.colorTag}40`,
                  color: clinic.colorTag,
                }}
              >
                <Building2 className="w-3 h-3" />
                {clinic.shortName}
              </span>
            )}

            {/* AI Summary Indicator Badge */}
            {hasAiSummary ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Resumo IA Pronto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                <Sparkles className="w-3 h-3 text-[#FFCC29]" />
                IA Disponível
              </span>
            )}
          </div>

          {/* Patient Name */}
          <div className="flex items-center gap-2 pt-0.5">
            <h3 className="text-base font-bold text-[#1E293B] group-hover:text-[#147A80] transition-colors truncate">
              {appointment.PatientName}
            </h3>
            {appointment.patient?.Age && (
              <span className="text-xs text-gray-400 font-medium">
                ({appointment.patient.Age} anos)
              </span>
            )}
          </div>

          {/* Dedicated Dentist Line */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
            <span className="text-gray-400 font-normal">Dentista:</span>
            <span className="font-semibold text-gray-900">{dentistName}</span>
            {specialty && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 text-[11px] truncate">{specialty}</span>
              </>
            )}
          </div>

          {/* Procedure */}
          <p className="text-sm font-medium text-gray-600 line-clamp-1">
            {appointment.Procedures}
          </p>
        </div>

        {/* Right Action: Chevron and quick detail touch target */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
          {appointment.MobilePhone && (
            <span className="sm:hidden text-xs text-gray-500 flex items-center gap-1 font-medium">
              <Phone className="w-3 h-3 text-gray-400" />
              {appointment.MobilePhone}
            </span>
          )}

          <div className="min-w-[40px] min-h-[40px] rounded-xl bg-[#F4F7F8] group-hover:bg-[#EBF8F8] flex items-center justify-center text-gray-400 group-hover:text-[#147A80] transition-colors ml-auto sm:ml-0">
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Mini preview of AI Summary if exists */}
      {hasAiSummary && appointment.ai_summary && (
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 pl-1.5">
          <p className="text-xs text-gray-600 italic line-clamp-2 bg-[#EBF8F8]/60 p-2 rounded-lg border border-[#4BBCBE]/30">
            <strong className="text-[#147A80] not-italic font-semibold">Resumo IA: </strong>
            {appointment.ai_summary}
          </p>
        </div>
      )}
    </div>
  );
};
