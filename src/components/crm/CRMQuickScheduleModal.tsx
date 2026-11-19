import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CRMLeadOpportunity } from '../../types/crm';
import { Appointment, Clinic, Dentist } from '../../types/database';
import {
  CalendarPlus,
  X,
  Check,
  Clock,
  Building2,
  Stethoscope,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Loader2,
  CalendarClock,
  Tag,
} from 'lucide-react';

export interface QuickSchedulePayload {
  opportunity: CRMLeadOpportunity;
  clinicId: number;
  dentistId: number;
  dateKey: string;
  fromTime: string;
  toTime: string;
  procedures: string;
  notes: string;
  categoryId?: number;
  categoryDescription?: string;
  forceLocalOnly?: boolean;
}

export interface QuickScheduleResult {
  ok: boolean;
  error?: string;
  allowLocalFallback?: boolean;
}

interface ClinicorpSlot {
  time: string;
  available: boolean;
  conflictLabel?: string;
}

interface ClinicorpScheduleAppointment {
  id: number;
  itemType: string;
  fromTime: string;
  toTime: string;
  patientName: string;
  procedures: string;
  status?: string;
}

interface ClinicorpCategoryOption {
  id: number;
  description: string;
}

interface CRMQuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CRMLeadOpportunity | null;
  clinics: Clinic[];
  dentists: Dentist[];
  localAppointments?: Appointment[];
  onConfirmSchedule: (
    payload: QuickSchedulePayload
  ) => Promise<QuickScheduleResult | void> | QuickScheduleResult | void;
}

const timeToMinutes = (hhmm: string): number | null => {
  if (!hhmm || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export const CRMQuickScheduleModal: React.FC<CRMQuickScheduleModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  clinics,
  dentists,
  localAppointments = [],
  onConfirmSchedule,
}) => {
  const [clinicId, setClinicId] = useState<number>(1);
  const [dentistId, setDentistId] = useState<number>(dentists[0]?.id || 1);
  const [dateKey, setDateKey] = useState<string>('');
  const [fromTime, setFromTime] = useState<string>('09:00');
  const [toTime, setToTime] = useState<string>('09:45');
  const [procedures, setProcedures] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Clinicorp live schedule & categories states
  const [categories, setCategories] = useState<ClinicorpCategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoadingSchedule, setIsLoadingSchedule] = useState<boolean>(false);
  const [scheduleSource, setScheduleSource] = useState<'clinicorp' | 'local' | 'idle'>('idle');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [liveAppointments, setLiveAppointments] = useState<ClinicorpScheduleAppointment[]>([]);
  const [liveSlots, setLiveSlots] = useState<ClinicorpSlot[]>([]);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [allowLocalFallback, setAllowLocalFallback] = useState<boolean>(false);

  useEffect(() => {
    if (!opportunity || !isOpen) return;
    setClinicId(opportunity.clinicId || clinics[0]?.id || 1);

    const matchedDentist = dentists.find((d) =>
      opportunity.dentistName
        ? d.Name.toLowerCase().includes(
            opportunity.dentistName.toLowerCase().replace(/dr\.|dra\./gi, '').trim()
          )
        : false
    );
    setDentistId(matchedDentist?.id || dentists[0]?.id || 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultStart = opportunity.scheduledTime || '09:00';
    setDateKey(opportunity.scheduledDate || tomorrow.toISOString().split('T')[0]);
    setFromTime(defaultStart);

    const startMin = timeToMinutes(defaultStart);
    if (startMin !== null) {
      const endMin = startMin + 45;
      setToTime(
        `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
      );
    } else {
      setToTime('09:45');
    }

    setProcedures(opportunity.treatmentDescription || 'Avaliação / Profilaxia Preventiva');
    setNotes(opportunity.notes || 'Agendamento direto pelo CRM Bertuol');
    setSubmitError(null);
    setAllowLocalFallback(false);
    setIsSubmitting(false);
  }, [opportunity, clinics, dentists, isOpen]);

  // Load Clinicorp categories once when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    fetch('/api/clinicorp/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.success || !Array.isArray(data.categories)) return;
        const normalized: ClinicorpCategoryOption[] = data.categories
          .map((c: any) => ({
            id: Number(c?.id || c?.CategoryId || 0),
            description: String(c?.Description || c?.description || c?.Name || '').trim(),
          }))
          .filter((c: ClinicorpCategoryOption) => c.id > 0 && Boolean(c.description));
        setCategories(normalized);
        if (normalized.length > 0 && !selectedCategoryId) {
          const preferred =
            normalized.find((c) => /consulta|avalia|retorno|proced/i.test(c.description)) ||
            normalized[0];
          setSelectedCategoryId(String(preferred.id));
        }
      })
      .catch(() => {
        // Optional metadata; backend resolves category automatically if omitted
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Compute local cached appointments for fallback when Clinicorp is offline/unconfigured
  const localDayAppointments = useMemo<ClinicorpScheduleAppointment[]>(() => {
    if (!dateKey) return [];
    const selectedClinic = clinics.find((c) => Number(c.id) === Number(clinicId));
    const targetBusinessId = selectedClinic?.clinicorp_business_id;

    return localAppointments
      .filter((appt) => {
        const apptDate = String(appt.date || '').split('T')[0];
        if (apptDate !== dateKey) return false;
        if (dentistId && Number(appt.Dentist_PersonId) !== Number(dentistId)) return false;
        if (targetBusinessId && Number(appt.Clinic_BusinessId) !== Number(targetBusinessId)) {
          return false;
        }
        return true;
      })
      .map((appt) => ({
        id: appt.id,
        itemType: 'APPOINTMENT',
        fromTime: appt.fromTime?.slice(0, 5) || '09:00',
        toTime: appt.toTime?.slice(0, 5) || '09:45',
        patientName: appt.PatientName || 'Paciente Agendado',
        procedures: appt.Procedures || '',
      }))
      .sort((a, b) => (timeToMinutes(a.fromTime) ?? 0) - (timeToMinutes(b.fromTime) ?? 0));
  }, [localAppointments, dateKey, dentistId, clinicId, clinics]);

  const fetchDentistSchedule = useCallback(async () => {
    if (!isOpen || !dateKey || !dentistId) return;
    setIsLoadingSchedule(true);
    setScheduleError(null);

    try {
      const params = new URLSearchParams({
        date: dateKey,
        dentistId: String(dentistId),
        clinicId: String(clinicId),
      });
      const res = await fetch(`/api/clinicorp/dentist-schedule?${params.toString()}`);
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setLiveAppointments(Array.isArray(data.appointments) ? data.appointments : []);
        setLiveSlots(Array.isArray(data.slots) ? data.slots : []);
        setScheduleSource('clinicorp');
        setScheduleError(null);
      } else {
        setScheduleSource('local');
        setLiveAppointments([]);
        setLiveSlots([]);
        setScheduleError(
          data?.error || 'Não foi possível consultar a agenda ao vivo do Clinicorp.'
        );
      }
    } catch {
      setScheduleSource('local');
      setLiveAppointments([]);
      setLiveSlots([]);
      setScheduleError('Falha de rede ao consultar agenda do Clinicorp.');
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [isOpen, dateKey, dentistId, clinicId]);

  useEffect(() => {
    if (!isOpen || !dateKey || !dentistId) return;
    fetchDentistSchedule();
  }, [isOpen, dateKey, dentistId, clinicId, fetchDentistSchedule]);

  const effectiveAppointments =
    scheduleSource === 'clinicorp' ? liveAppointments : localDayAppointments;

  const effectiveSlots = useMemo<ClinicorpSlot[]>(() => {
    if (scheduleSource === 'clinicorp' && liveSlots.length > 0) {
      return liveSlots;
    }
    const slots: ClinicorpSlot[] = [];
    for (let min = 8 * 60; min <= 18 * 60 + 30; min += 30) {
      const hh = String(Math.floor(min / 60)).padStart(2, '0');
      const mm = String(min % 60).padStart(2, '0');
      const slotTime = `${hh}:${mm}`;
      const slotEnd = min + 30;
      const conflict = localDayAppointments.find((appt) => {
        const s = timeToMinutes(appt.fromTime);
        const e = timeToMinutes(appt.toTime);
        if (s === null || e === null) return false;
        return min < e && slotEnd > s;
      });
      slots.push({
        time: slotTime,
        available: !conflict,
        conflictLabel: conflict
          ? `${conflict.fromTime}-${conflict.toTime} · ${conflict.patientName}`
          : undefined,
      });
    }
    return slots;
  }, [scheduleSource, liveSlots, localDayAppointments]);

  const overlappingAppointments = useMemo(() => {
    const start = timeToMinutes(fromTime);
    const end = timeToMinutes(toTime);
    if (start === null || end === null || end <= start) return [];
    return effectiveAppointments.filter((appt) => {
      const s = timeToMinutes(appt.fromTime);
      const e = timeToMinutes(appt.toTime);
      if (s === null || e === null) return false;
      return start < e && end > s;
    });
  }, [fromTime, toTime, effectiveAppointments]);

  if (!isOpen || !opportunity) return null;

  const handleTimeChange = (start: string) => {
    setFromTime(start);
    const totalStart = timeToMinutes(start);
    if (totalStart !== null) {
      const total = totalStart + 45;
      const endH = String(Math.floor(total / 60) % 24).padStart(2, '0');
      const endM = String(total % 60).padStart(2, '0');
      setToTime(`${endH}:${endM}`);
    }
  };

  const buildPayload = (forceLocalOnly = false): QuickSchedulePayload => {
    const cat = categories.find((c) => String(c.id) === selectedCategoryId);
    return {
      opportunity,
      clinicId,
      dentistId,
      dateKey,
      fromTime,
      toTime,
      procedures,
      notes,
      categoryId: cat ? cat.id : undefined,
      categoryDescription: cat ? cat.description : undefined,
      forceLocalOnly,
    };
  };

  const executeSchedule = async (forceLocalOnly = false) => {
    if (!dateKey || !fromTime || !toTime || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setAllowLocalFallback(false);

    try {
      const result = await onConfirmSchedule(buildPayload(forceLocalOnly));
      if (result && result.ok === false) {
        setSubmitError(result.error || 'Erro ao enviar agendamento para o Clinicorp.');
        setAllowLocalFallback(Boolean(result.allowLocalFallback));
      } else {
        onClose();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Falha inesperada ao confirmar agendamento.');
      setAllowLocalFallback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSchedule(false);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-[#147A80]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Agendar Consulta no Clinicorp
              </h3>
              <p className="text-xs text-slate-500">
                Consulta disponibilidade do dentista, grava no Clinicorp e move o lead para Agendado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
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
              <span className="text-slate-500 font-mono ml-2 tabular-nums">
                {opportunity.patientPhone}
              </span>
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-mono font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#147A80]"
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
                disabled={isSubmitting}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-mono font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Término *</label>
              <input
                type="time"
                required
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-mono font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
            </div>
          </div>

          {/* Live Dentist Availability Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#147A80]" />
                <span className="text-xs font-bold text-slate-800">
                  Agenda do Dentista ({dateKey ? dateKey.split('-').reverse().join('/') : '—'})
                </span>
                {scheduleSource === 'clinicorp' && !isLoadingSchedule && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Sincronizada com Clinicorp
                  </span>
                )}
                {scheduleSource === 'local' && !isLoadingSchedule && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Cache local
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={fetchDentistSchedule}
                disabled={isLoadingSchedule || isSubmitting}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#147A80] px-2 py-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSchedule ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {isLoadingSchedule ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#147A80]" />
                <span>Consultando horários livres e bloqueios no Clinicorp...</span>
              </div>
            ) : (
              <>
                {scheduleError && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {scheduleError} Exibindo cache local da agenda para seleção de horário.
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>Clique em um horário livre para preencher Início (+45 min)</span>
                    <span className="tabular-nums">
                      {effectiveSlots.filter((s) => s.available).length} livres ·{' '}
                      {effectiveAppointments.length} compromisso(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {effectiveSlots.map((slot) => {
                      const isSelected = fromTime.slice(0, 5) === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available || isSubmitting}
                          onClick={() => handleTimeChange(slot.time)}
                          title={
                            slot.available
                              ? `Selecionar horário ${slot.time}`
                              : slot.conflictLabel || 'Horário ocupado'
                          }
                          className={`h-8 rounded-lg text-xs font-mono font-semibold tabular-nums transition-colors border ${
                            !slot.available
                              ? 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                              : isSelected
                                ? 'bg-[#147A80] border-[#147A80] text-white shadow-xs cursor-pointer'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-[#147A80] hover:text-[#147A80] cursor-pointer'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {effectiveAppointments.length > 0 && (
                  <div className="border-t border-slate-200 pt-2.5">
                    <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                      Horários já ocupados nesta data:
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {effectiveAppointments.map((appt) => (
                        <div
                          key={`${appt.id}-${appt.fromTime}`}
                          className="flex items-center justify-between text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                              {appt.fromTime}–{appt.toTime}
                            </span>
                            <span className="font-medium truncate">{appt.patientName}</span>
                          </div>
                          {appt.procedures && (
                            <span className="text-slate-500 truncate max-w-[160px] ml-2">
                              {appt.procedures}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {overlappingAppointments.length > 0 && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Conflito de horário detectado</p>
                      <p className="text-[11px] text-amber-800">
                        O intervalo {fromTime}–{toTime} sobrepõe:{' '}
                        {overlappingAppointments
                          .map((c) => `${c.fromTime}–${c.toTime} (${c.patientName})`)
                          .join(', ')}
                        .
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className={`grid grid-cols-1 ${categories.length > 0 ? 'sm:grid-cols-2' : ''} gap-3`}>
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Categoria Clinicorp
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Procedimento / Motivo da consulta
              </label>
              <input
                type="text"
                value={procedures}
                onChange={(e) => setProcedures(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações para o agendamento
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
            />
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Não foi possível gravar no Clinicorp</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{submitError}</p>
                </div>
              </div>
              {allowLocalFallback && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => executeSchedule(true)}
                    className="h-8 px-3 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 text-[11px] font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Registrar apenas no CRM (sem Clinicorp)
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 flex items-center gap-1.5 px-5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando ao Clinicorp...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Enviar ao Clinicorp</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
