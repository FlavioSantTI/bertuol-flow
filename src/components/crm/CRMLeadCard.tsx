import React, { useState } from 'react';
import { CRMLabel, CRMLeadOpportunity, CRMPipelineStage } from '../../types/crm';
import { CRMService } from '../../services/crmService';
import { Clinic } from '../../types/database';
import {
  Phone,
  MessageSquare,
  CalendarPlus,
  FileText,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

interface CRMLeadCardProps {
  opportunity: CRMLeadOpportunity;
  clinics: Clinic[];
  pipelineStages: CRMPipelineStage[];
  allLabels: CRMLabel[];
  isFollowUpDue?: boolean;
  isFollowUpOverdue?: boolean;
  slaDaysStale?: number;
  onOpenQuickContact: (opp: CRMLeadOpportunity) => void;
  onOpenQuickSchedule: (opp: CRMLeadOpportunity) => void;
  onOpenNotesLabels: (opp: CRMLeadOpportunity) => void;
  onUpdateStage: (opp: CRMLeadOpportunity, targetStageId: string) => void;
  onDelete: (id: string) => void;
  viewMode?: 'kanban' | 'list';
}

const LABEL_TONE: Record<CRMLabel['color'], string> = {
  teal: 'bg-teal-50 text-teal-800 border-teal-200/80',
  amber: 'bg-amber-50 text-amber-900 border-amber-200/80',
  rose: 'bg-rose-50 text-rose-800 border-rose-200/80',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
};

export const CRMLeadCard: React.FC<CRMLeadCardProps> = ({
  opportunity,
  clinics,
  pipelineStages,
  allLabels,
  isFollowUpDue = false,
  isFollowUpOverdue = false,
  slaDaysStale = 0,
  onOpenQuickContact,
  onOpenQuickSchedule,
  onOpenNotesLabels,
  onUpdateStage,
  onDelete,
  viewMode = 'kanban',
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const clinic = clinics.find((c) => c.id === opportunity.clinicId);
  const formattedPhone = CRMService.formatPhoneDisplay(opportunity.patientPhone);
  const resolvedLabels = (opportunity.labels || [])
    .map((id) => allLabels.find((l) => l.id === id))
    .filter((l): l is CRMLabel => Boolean(l));

  const priorityLabel =
    opportunity.priority === 'high' ? 'Alta' : opportunity.priority === 'medium' ? 'Média' : 'Normal';

  const hasSLAWarning = slaDaysStale >= 2;

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(opportunity.patientPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1600);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3.5 transition-all shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Row 1: Patient Name + Clean Inline Status/Priority */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="font-bold text-slate-900 text-sm truncate">{opportunity.patientName}</h4>

            <span className="text-xs text-slate-400">·</span>

            <button
              type="button"
              onClick={handleCopyPhone}
              title="Copiar telefone"
              className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-semibold text-slate-700 hover:text-[#147A80] cursor-pointer"
            >
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{formattedPhone}</span>
              {copiedPhone ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-slate-300" />
              )}
            </button>

            {opportunity.priority === 'high' && (
              <span className="text-[11px] font-semibold text-rose-700">· Prioridade {priorityLabel}</span>
            )}

            {hasSLAWarning && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md tabular-nums">
                <AlertTriangle className="w-3 h-3" />
                Sem retorno há {slaDaysStale}d
              </span>
            )}

            {isFollowUpDue && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border tabular-nums ${
                  isFollowUpOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {isFollowUpOverdue ? 'Follow-up atrasado' : 'Follow-up hoje'} ({opportunity.nextContactDate})
              </span>
            )}
          </div>

          {/* Row 2: Clean Metadata with · separators */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            {clinic && <span className="font-medium text-slate-700">{clinic.shortName}</span>}
            {opportunity.dentistName && (
              <>
                <span aria-hidden="true">·</span>
                <span>{opportunity.dentistName}</span>
              </>
            )}
            {opportunity.lastVisitDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Última: {opportunity.lastVisitDate}
                  {opportunity.diasDesdeUltimo ? ` (${opportunity.diasDesdeUltimo}d)` : ''}
                </span>
              </>
            )}
            {opportunity.contactAttempts > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-slate-700">
                  {opportunity.contactAttempts}ª tentativa
                </span>
              </>
            )}
            {opportunity.scheduledDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-indigo-700 tabular-nums">
                  Agendado: {opportunity.scheduledDate} {opportunity.scheduledTime || ''}
                </span>
              </>
            )}
          </div>

          {/* Row 3: Procedure + Labels + Latest Note */}
          {(opportunity.treatmentDescription || resolvedLabels.length > 0 || opportunity.notes || opportunity.lostReason) && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
              {opportunity.treatmentDescription && (
                <span className="text-slate-600">{opportunity.treatmentDescription}</span>
              )}
              {resolvedLabels.map((lbl) => (
                <span
                  key={lbl.id}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${LABEL_TONE[lbl.color]}`}
                >
                  {lbl.name}
                </span>
              ))}
              {opportunity.notes && (
                <button
                  type="button"
                  onClick={() => onOpenNotesLabels(opportunity)}
                  className="text-[11px] text-slate-600 hover:text-[#147A80] underline decoration-slate-300 cursor-pointer truncate max-w-md"
                >
                  Nota: &ldquo;{opportunity.notes}&rdquo;
                </button>
              )}
              {opportunity.lostReason && (
                <span className="text-[11px] font-medium text-rose-700">
                  Motivo: {opportunity.lostReason}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Numeric Values & Actions */}
        <div className="flex items-center gap-2.5 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100">
          <div className="text-left lg:text-right mr-1">
            {opportunity.estimatedValue && opportunity.estimatedValue > 0 ? (
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums block">
                R$ {opportunity.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-xs text-slate-400 block">Sem valor</span>
            )}
            {opportunity.pointsBonus ? (
              <span className="text-[11px] font-semibold text-amber-700 tabular-nums">
                +{opportunity.pointsBonus} pts Clube
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onOpenNotesLabels(opportunity)}
            title="Notas, Rótulos e Follow-up"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#147A80] hover:border-[#147A80] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickSchedule(opportunity)}
            title="Agendar Consulta em 1-Clique"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-[#147A80]" />
            <span>Agendar</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickContact(opportunity)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <select
            value={opportunity.stage}
            onChange={(e) => onUpdateStage(opportunity, e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 cursor-pointer focus:ring-2 focus:ring-[#147A80]"
          >
            {pipelineStages.map((stg) => (
              <option key={stg.id} value={stg.id}>
                {stg.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onDelete(opportunity.id)}
            title="Excluir Oportunidade"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Clean Executive Kanban Card View (Zero Pill Sandwich)
  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-2.5 group">
      <div className="space-y-1.5">
        {/* Top Line: Patient Name first + Discrete Note/Tag trigger */}
        <div className="flex items-start justify-between gap-2">
          <h4
            className="font-bold text-slate-900 text-[13px] leading-snug line-clamp-1 group-hover:text-[#147A80] transition-colors"
            title={opportunity.patientName}
          >
            {opportunity.patientName}
          </h4>

          <button
            type="button"
            onClick={() => onOpenNotesLabels(opportunity)}
            title="Abrir Notas, Rótulos e Follow-up"
            className="p-1 -mt-0.5 -mr-1 rounded-md text-slate-400 hover:text-[#147A80] hover:bg-teal-50 transition-colors cursor-pointer shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Phone & Quick Copy + Priority */}
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleCopyPhone}
            title="Copiar telefone"
            className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-slate-700 hover:text-[#147A80] cursor-pointer"
          >
            <span>{formattedPhone}</span>
            {copiedPhone ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          <span
            className={`text-[11px] font-semibold ${
              opportunity.priority === 'high' ? 'text-rose-700' : 'text-slate-400'
            }`}
          >
            {priorityLabel}
          </span>
        </div>

        {/* Unified Clinical Context Line (no nested boxes) */}
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <span>{clinic?.shortName || 'Palmas'}</span>
          {opportunity.dentistName && <span> · {opportunity.dentistName}</span>}
          {opportunity.diasDesdeUltimo ? (
            <span className="tabular-nums"> · {opportunity.diasDesdeUltimo}d inativo</span>
          ) : null}
        </p>

        {/* Treatment Description */}
        {opportunity.treatmentDescription && (
          <p className="text-[11px] text-slate-700 line-clamp-2 leading-snug">
            {opportunity.treatmentDescription}
          </p>
        )}

        {/* SLA / Follow-up / Scheduled Semantic Indicators */}
        {(hasSLAWarning || isFollowUpDue || opportunity.nextContactDate || opportunity.scheduledDate || opportunity.lostReason) && (
          <div className="space-y-1 pt-0.5">
            {hasSLAWarning && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 tabular-nums">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Sem retorno há {slaDaysStale} dias (SLA)</span>
              </div>
            )}

            {opportunity.nextContactDate && (
              <div
                className={`flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
                  isFollowUpOverdue
                    ? 'text-rose-700'
                    : isFollowUpDue
                    ? 'text-amber-700'
                    : 'text-slate-500'
                }`}
              >
                <Calendar className="w-3 h-3 shrink-0" />
                <span>
                  {isFollowUpOverdue
                    ? `Retorno atrasado (${opportunity.nextContactDate})`
                    : isFollowUpDue
                    ? 'Retornar hoje'
                    : `Retornar em ${opportunity.nextContactDate}`}
                </span>
              </div>
            )}

            {opportunity.scheduledDate && (
              <div className="text-[11px] font-semibold text-indigo-700 tabular-nums">
                Agenda: {opportunity.scheduledDate} {opportunity.scheduledTime || ''}
              </div>
            )}

            {opportunity.lostReason && (
              <div className="text-[11px] font-medium text-rose-700 line-clamp-1">
                Motivo: {opportunity.lostReason}
              </div>
            )}
          </div>
        )}

        {/* Compact Labels + Latest Note Preview */}
        {(resolvedLabels.length > 0 || opportunity.notes) && (
          <div className="space-y-1 pt-0.5">
            {resolvedLabels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {resolvedLabels.slice(0, 3).map((lbl) => (
                  <span
                    key={lbl.id}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${LABEL_TONE[lbl.color]}`}
                  >
                    {lbl.name}
                  </span>
                ))}
                {resolvedLabels.length > 3 && (
                  <span className="text-[10px] text-slate-400 font-semibold">
                    +{resolvedLabels.length - 3}
                  </span>
                )}
              </div>
            )}

            {opportunity.notes && (
              <button
                type="button"
                onClick={() => onOpenNotesLabels(opportunity)}
                className="block w-full text-left text-[11px] text-slate-600 hover:text-[#147A80] line-clamp-1 cursor-pointer"
                title={opportunity.notes}
              >
                &ldquo;{opportunity.notes}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer: Value, Attempts & Primary Actions */}
      <div className="border-t border-slate-100 pt-2 space-y-2">
        <div className="flex items-center justify-between text-xs tabular-nums">
          <div className="flex items-center gap-1.5">
            {opportunity.estimatedValue ? (
              <span className="font-bold text-slate-900 font-mono">
                R$ {opportunity.estimatedValue.toLocaleString('pt-BR')}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Sem valor</span>
            )}
            {opportunity.pointsBonus ? (
              <span className="text-[11px] font-semibold text-amber-700">· +{opportunity.pointsBonus} pts</span>
            ) : null}
          </div>

          {opportunity.contactAttempts > 0 && (
            <span className="text-[11px] font-medium text-slate-500">
              {opportunity.contactAttempts}ª tent.
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenQuickContact(opportunity)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickSchedule(opportunity)}
            title="Agendar na Grade em 1-Clique"
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-[#147A80]" />
            <span>Agendar</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-1.5">
          <select
            value={opportunity.stage}
            onChange={(e) => onUpdateStage(opportunity, e.target.value)}
            className="flex-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer focus:ring-2 focus:ring-[#147A80] truncate"
          >
            {pipelineStages.map((stg) => (
              <option key={stg.id} value={stg.id}>
                {stg.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onDelete(opportunity.id)}
            title="Excluir Oportunidade"
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
