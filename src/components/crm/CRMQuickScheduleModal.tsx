import React, { useState, useEffect } from 'react';
import { CRMLeadOpportunity } from '../../types/crm';
import { Clinic, Dentist } from '../../types/database';
import { CalendarPlus, X, Check, Clock, Building2, Stethoscope, Sparkles } from 'lucide-react';

interface CRMQuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CRMLeadOpportunity | null;
  clinics: Clinic[];
  dentists: Dentist[];
  onConfirmSchedule: (payload: {
    opportunity: CRMLeadOpportunity;
    clinicId: number;
    dentistId: number;
    dateKey: string;
    fromTime: string;
    toTime: string;
    procedures: string;
    notes: string;
  }) => void;
}

export const CRMQuickScheduleModal: React.FC<CRMQuickScheduleModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  clinics,
  dentists,
  onConfirmSchedule,
}) => {
  const [clinicId, setClinicId] = useState<number>(1);
  const [dentistId, setDentistId] = useState<number>(dentists[0]?.id || 1);
  const [dateKey, setDateKey] = useState<string>('');
  const [fromTime, setFromTime] = useState<string>('09:00');
  const [toTime, setToTime] = useState<string>('09:45');
  const [procedures, setProcedures] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!opportunity) return;
    setClinicId(opportunity.clinicId || clinics[0]?.id || 1);

    const matchedDentist = dentists.find((d) =>
      opportunity.dentistName
        ? d.Name.toLowerCase().includes(opportunity.dentistName.toLowerCase().replace(/dr\.|dra\./gi, '').trim())
        : false
    );
    setDentistId(matchedDentist?.id || dentists[0]?.id || 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDateKey(opportunity.scheduledDate || tomorrow.toISOString().split('T')[0]);
    setFromTime(opportunity.scheduledTime || '09:00');
    setToTime('09:45');
    setProcedures(opportunity.treatmentDescription || 'Avaliação / Profilaxia Preventiva');
    setNotes(opportunity.notes || 'Agendamento direto pelo CRM Bertuol');
  }, [opportunity, clinics, dentists, isOpen]);

  if (!isOpen || !opportunity) return null;

  const handleTimeChange = (start: string) => {
    setFromTime(start);
    const [h, m] = start.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const total = h * 60 + m + 45;
      const endH = String(Math.floor(total / 60) % 24).padStart(2, '0');
      const endM = String(total % 60).padStart(2, '0');
      setToTime(`${endH}:${endM}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateKey || !fromTime) return;
    onConfirmSchedule({
      opportunity,
      clinicId,
      dentistId,
      dateKey,
      fromTime,
      toTime,
      procedures,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-[#147A80]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Agendar Consulta em 1-Clique</h3>
              <p className="text-xs text-slate-500">
                Insere na agenda clínica e move o lead para Agendado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Paciente</span>
              <span className="font-bold text-slate-900">{opportunity.patientName}</span>
              <span className="text-slate-500 font-mono ml-2 tabular-nums">{opportunity.patientPhone}</span>
            </div>
            {opportunity.pointsBonus ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />+{opportunity.pointsBonus} pts Clube
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Unidade *
              </label>
              <select
                value={clinicId}
                onChange={(e) => setClinicId(Number(e.target.value))}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              >
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Dentista *
              </label>
              <select
                value={dentistId}
                onChange={(e) => setDentistId(Number(e.target.value))}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              >
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.Name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Início *
              </label>
              <input
                type="time"
                required
                value={fromTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Término *</label>
              <input
                type="time"
                required
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procedimento / Motivo da consulta
            </label>
            <input
              type="text"
              value={procedures}
              onChange={(e) => setProcedures(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações para o agendamento
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 flex items-center gap-1.5 px-5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar na Agenda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
