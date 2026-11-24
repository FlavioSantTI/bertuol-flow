import React, { useState } from 'react';
import { CRMLabel, CRMLeadOpportunity, CRMPipelineStage } from '../../types/crm';
import { CRMService } from '../../services/crmService';
import { extractBirthdayVoucherInfo } from '../../utils/crmBirthdayVoucher';
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
  GripVertical,
  Tag,
  Gift,
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
  onOpenDrawer: (opp: CRMLeadOpportunity) => void;
  onOpenLabels?: (opp: CRMLeadOpportunity) => void;
  onUpdateStage: (opp: CRMLeadOpportunity, targetStageId: string) => void;
  onDelete: (id: string) => void;
  onDragStartCard?: (e: React.DragEvent, oppId: string) => void;
  viewMode?: 'kanban' | 'list';
}

const LABEL_DOT_TONE: Record<CRMLabel['color'], string> = {
  teal: 'bg-[#147A80]',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-400',
};

const LABEL_TEXT_TONE: Record<CRMLabel['color'], string> = {
  teal: 'text-teal-800 bg-teal-50/70',
  amber: 'text-amber-900 bg-amber-50/70',
  rose: 'text-rose-800 bg-rose-50/70',
  indigo: 'text-indigo-800 bg-indigo-50/70',
  emerald: 'text-emerald-800 bg-emerald-50/70',
  slate: 'text-slate-700 bg-slate-100',
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
  onOpenDrawer,
  onOpenLabels,
  onUpdateStage,
  onDelete,
  onDragStartCard,
  viewMode = 'kanban',
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  const clinic = clinics.find((c) => c.id === opportunity.clinicId);
  const formattedPhone = CRMService.formatPhoneDisplay(opportunity.patientPhone);
  const resolvedLabels = (opportunity.labels || [])
    .map((id) => allLabels.find((l) => l.id === id))
    .filter((l): l is CRMLabel => Boolean(l));

  const birthdayVoucher = extractBirthdayVoucherInfo(opportunity);
  const customFields = (opportunity.customFields || []).filter((cf) => {
    if (!cf.value || !cf.value.trim()) return false;
    if (birthdayVoucher && (/voucher/i.test(cf.label) || /validade/i.test(cf.label))) return false;
    return true;
  });
  const hasSLAWarning = slaDaysStale >= 2;

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(opportunity.patientPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1600);
  };

  const handleCopyVoucher = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!birthdayVoucher?.code) return;
    navigator.clipboard.writeText(birthdayVoucher.code);
    setCopiedVoucher(true);
    setTimeout(() => setCopiedVoucher(false), 1600);
  };

  const birthdayCountdownText = (() => {
    if (!birthdayVoucher) return null;
    if (birthdayVoucher.state === 'redeemed') {
      return { text: 'Resgatado', className: 'text-[#16A34A] font-semibold' };
    }
    if (birthdayVoucher.state === 'expired') {
      return {
        text: `Expirado${birthdayVoucher.expiresLabelBR ? ` · ${birthdayVoucher.expiresLabelBR}` : ''}`,
        className: 'text-[#DC2626] font-semibold',
      };
    }
    if (birthdayVoucher.state === 'today') {
      return {
        text: `Vence hoje${birthdayVoucher.expiresLabelBR ? ` · ${birthdayVoucher.expiresLabelBR}` : ''}`,
        className: 'text-[#D97706] font-semibold',
      };
    }
    if (birthdayVoucher.daysRemaining != null) {
      const label = `Vence em ${birthdayVoucher.daysRemaining} ${
        birthdayVoucher.daysRemaining === 1 ? 'dia' : 'dias'
      }${birthdayVoucher.expiresLabelBR ? ` · ${birthdayVoucher.expiresLabelBR}` : ''}`;
      return {
        text: label,
        className:
          birthdayVoucher.state === 'expiring_soon'
            ? 'text-[#D97706] font-semibold'
            : 'text-[#147A80] font-semibold',
      };
    }
    return null;
  })();

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpenDrawer(opportunity)}
        className="bg-white border border-slate-200 hover:border-[#147A80]/50 rounded-xl px-4 py-3 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-900 text-sm truncate hover:text-[#147A80]">
              {opportunity.patientName}
            </h4>

            <span className="text-xs text-slate-300" aria-hidden="true">·</span>

            <button
              type="button"
              onClick={handleCopyPhone}
              title="Copiar contato"
              className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-medium text-slate-600 hover:text-[#147A80] cursor-pointer"
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
              <span className="text-[11px] font-semibold text-rose-700">· Prioridade alta</span>
            )}

            {hasSLAWarning && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 tabular-nums">
                · <AlertTriangle className="w-3 h-3" /> SLA {slaDaysStale}d
              </span>
            )}

            {isFollowUpDue && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
                  isFollowUpOverdue ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                · <Calendar className="w-3 h-3" />
                {isFollowUpOverdue ? 'Retorno atrasado' : 'Retornar hoje'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            {clinic && <span className="font-medium text-slate-700">{clinic.shortName}</span>}
            {opportunity.source && (
              <>
                <span aria-hidden="true">·</span>
                <span>{opportunity.source}</span>
              </>
            )}
            {opportunity.dentistName && opportunity.dentistName !== 'Sem preferência' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{opportunity.dentistName}</span>
              </>
            )}
            {opportunity.lastVisitDate && opportunity.type === 'recall_6m' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Última: {opportunity.lastVisitDate}
                  {opportunity.diasDesdeUltimo ? ` (${opportunity.diasDesdeUltimo}d)` : ''}
                </span>
              </>
            )}
            {opportunity.estimateDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Orç. {opportunity.estimateDate.split('-').reverse().slice(0, 2).join('/')}
                </span>
              </>
            )}
            {opportunity.estimateProcedures && opportunity.estimateProcedures.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-slate-700">
                  {opportunity.estimateProcedures.length}{' '}
                  {opportunity.estimateProcedures.length === 1 ? 'procedimento' : 'procedimentos'}
                </span>
              </>
            )}
            {birthdayVoucher && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleCopyVoucher}
                  title="Copiar código do voucher de aniversário"
                  className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-[#147A80] hover:underline cursor-pointer"
                >
                  <Gift className="w-3 h-3 shrink-0" />
                  <span>{birthdayVoucher.code}</span>
                  {copiedVoucher ? (
                    <Check className="w-3 h-3 text-[#16A34A]" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
                {birthdayCountdownText && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className={`tabular-nums ${birthdayCountdownText.className}`}>
                      {birthdayCountdownText.text}
                    </span>
                  </>
                )}
              </>
            )}
            {opportunity.scheduledDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#147A80] tabular-nums">
                  Agendado: {opportunity.scheduledDate} {opportunity.scheduledTime || ''}
                </span>
              </>
            )}
          </div>

          {(opportunity.treatmentDescription || resolvedLabels.length > 0 || customFields.length > 0 || opportunity.notes) && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
              {opportunity.treatmentDescription && (
                <span className="text-slate-600">{opportunity.treatmentDescription}</span>
              )}
              {customFields.slice(0, 2).map((cf) => (
                <span key={cf.id} className="text-[11px] text-slate-500">
                  · <strong className="text-slate-700">{cf.label}:</strong> {cf.value}
                </span>
              ))}
              {resolvedLabels.slice(0, 3).map((lbl) => (
                <span
                  key={lbl.id}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${LABEL_TEXT_TONE[lbl.color]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${LABEL_DOT_TONE[lbl.color]}`} />
                  {lbl.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-2 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-left lg:text-right mr-1">
            {opportunity.estimatedValue && opportunity.estimatedValue > 0 ? (
              <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums block">
                R$ {opportunity.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-xs text-slate-400 block">Sem valor</span>
            )}
            {opportunity.pointsBonus ? (
              <span className="text-[11px] text-amber-700 tabular-nums">+{opportunity.pointsBonus} pts</span>
            ) : null}
          </div>

          {onOpenLabels && (
            <button
              type="button"
              onClick={() => onOpenLabels(opportunity)}
              title="Incluir ou gerenciar rótulos e notas"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#147A80] hover:border-[#147A80] transition-colors cursor-pointer"
            >
              <Tag className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenDrawer(opportunity)}
            title="Abrir Ficha Livre"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#147A80] hover:border-[#147A80] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickSchedule(opportunity)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-[#147A80]" />
            <span>Agendar</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickContact(opportunity)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#147A80] hover:bg-[#0F5C61] text-white font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <select
            value={opportunity.stage}
            onChange={(e) => onUpdateStage(opportunity, e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 cursor-pointer focus:ring-2 focus:ring-[#147A80]/30"
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
            title="Excluir oportunidade"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Compact Draggable Kanban Card (Click opens Free-Form Ficha Drawer)
  return (
    <div
      draggable
      onDragStart={(e) => {
        if (onDragStartCard) onDragStartCard(e, opportunity.id);
      }}
      onClick={() => onOpenDrawer(opportunity)}
      className="bg-white border border-slate-200 hover:border-[#147A80]/60 rounded-xl p-3 transition-colors flex flex-col justify-between gap-2 group cursor-pointer active:opacity-75"
    >
      <div className="space-y-1.5">
        {/* Header: Grip + Name + Ficha button */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 shrink-0 -ml-1 cursor-grab" />
            <h4
              className="font-semibold text-slate-900 text-[13px] leading-snug line-clamp-1 group-hover:text-[#147A80] transition-colors"
              title={opportunity.patientName}
            >
              {opportunity.patientName}
            </h4>
          </div>

          <div className="flex items-center gap-0.5 -mt-0.5 -mr-1 shrink-0">
            {onOpenLabels && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLabels(opportunity);
                }}
                title="Rótulos e Notas"
                className="p-1 rounded-md text-slate-400 hover:text-[#147A80] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDrawer(opportunity);
              }}
              title="Abrir Ficha Livre"
              className="p-1 rounded-md text-slate-400 hover:text-[#147A80] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contact & Urgent Priority */}
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleCopyPhone}
            title="Copiar contato"
            className="inline-flex items-center gap-1 font-mono tabular-nums text-[11px] font-medium text-slate-700 hover:text-[#147A80] cursor-pointer"
          >
            <span>{formattedPhone}</span>
            {copiedPhone ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {opportunity.priority === 'high' && (
            <span className="text-[11px] font-semibold text-rose-700">Alta</span>
          )}
        </div>

        {/* Unified Single-Line Context Metadata */}
        <p className="text-[11px] text-slate-500 truncate">
          <span>{clinic?.shortName || 'Palmas'}</span>
          {opportunity.source && opportunity.source !== 'Supabase crm_leads_recall' && (
            <span> · {opportunity.source}</span>
          )}
          {opportunity.dentistName && opportunity.dentistName !== 'Sem preferência' && (
            <span> · {opportunity.dentistName}</span>
          )}
          {opportunity.estimateDate && (
            <span className="tabular-nums">
              {' '}· Orç. {opportunity.estimateDate.split('-').reverse().slice(0, 2).join('/')}
            </span>
          )}
          {opportunity.estimateProcedures && opportunity.estimateProcedures.length > 0 && (
            <span className="tabular-nums font-medium text-slate-700">
              {' '}· {opportunity.estimateProcedures.length}{' '}
              {opportunity.estimateProcedures.length === 1 ? 'item' : 'itens'}
            </span>
          )}
          {opportunity.diasDesdeUltimo && opportunity.type === 'recall_6m' ? (
            <span className="tabular-nums"> · {opportunity.diasDesdeUltimo}d</span>
          ) : null}
        </p>

        {/* Birthday Voucher Code & 7-Day Countdown */}
        {birthdayVoucher && (
          <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5 tabular-nums">
            <button
              type="button"
              onClick={handleCopyVoucher}
              title="Copiar código do voucher de aniversário"
              className="inline-flex items-center gap-1 font-mono font-semibold text-[#147A80] hover:underline cursor-pointer truncate"
            >
              <Gift className="w-3 h-3 shrink-0" />
              <span>{birthdayVoucher.code}</span>
              {copiedVoucher ? (
                <Check className="w-3 h-3 text-[#16A34A] shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-slate-300 group-hover:text-slate-400 shrink-0" />
              )}
            </button>
            {birthdayCountdownText && (
              <span className={`shrink-0 ${birthdayCountdownText.className}`}>
                {birthdayCountdownText.text}
              </span>
            )}
          </div>
        )}

        {/* Treatment / Free Description */}
        {opportunity.treatmentDescription && (
          <p className="text-xs text-slate-700 line-clamp-2 leading-snug">
            {opportunity.treatmentDescription}
          </p>
        )}

        {/* Max 1-2 Custom Fields inline */}
        {customFields.length > 0 && (
          <p className="text-[11px] text-slate-500 truncate">
            {customFields.slice(0, 2).map((cf, idx) => (
              <span key={cf.id}>
                {idx > 0 ? ' · ' : ''}
                <span className="font-medium text-slate-700">{cf.label}:</span> {cf.value}
              </span>
            ))}
          </p>
        )}

        {/* Active SLA / Follow-up / Schedule indicator */}
        {(hasSLAWarning || isFollowUpDue || opportunity.nextContactDate || opportunity.scheduledDate || opportunity.lostReason) && (
          <div className="space-y-0.5 pt-0.5 text-[11px] tabular-nums">
            {hasSLAWarning && (
              <div className="flex items-center gap-1 font-semibold text-rose-700">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Sem retorno há {slaDaysStale}d</span>
              </div>
            )}
            {opportunity.nextContactDate && (
              <div
                className={`flex items-center gap-1 font-medium ${
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
              <div className="font-semibold text-[#147A80]">
                Agendado: {opportunity.scheduledDate} {opportunity.scheduledTime || ''}
              </div>
            )}
            {opportunity.lostReason && (
              <div className="text-rose-700 line-clamp-1">Motivo: {opportunity.lostReason}</div>
            )}
          </div>
        )}

        {/* Max 2 Subtle Labels */}
        {resolvedLabels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {resolvedLabels.slice(0, 2).map((lbl) => (
              <span
                key={lbl.id}
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${LABEL_TEXT_TONE[lbl.color]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${LABEL_DOT_TONE[lbl.color]}`} />
                {lbl.name}
              </span>
            ))}
            {resolvedLabels.length > 2 && (
              <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                +{resolvedLabels.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Slim Single-Row Footer (Stage changed via Drag & Drop or Drawer) */}
      <div className="border-t border-slate-100 pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-[11px] tabular-nums">
          <span className={opportunity.estimatedValue ? 'font-semibold text-slate-900 font-mono' : 'text-slate-400'}>
            {opportunity.estimatedValue
              ? `R$ ${opportunity.estimatedValue.toLocaleString('pt-BR')}`
              : 'Sem valor'}
          </span>

          <div className="flex items-center gap-2 text-slate-500">
            {opportunity.pointsBonus ? <span className="text-amber-700">+{opportunity.pointsBonus} pts</span> : null}
            {opportunity.contactAttempts > 0 && <span>{opportunity.contactAttempts}ª tent.</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenQuickContact(opportunity)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#147A80] hover:bg-[#0F5C61] text-white font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickSchedule(opportunity)}
            title="Agendar na Grade"
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-[#147A80]" />
            <span>Agendar</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(opportunity.id)}
            title="Excluir Oportunidade"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
