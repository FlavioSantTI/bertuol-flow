import React from 'react';
import { CRMLeadOpportunity, CRMStage } from '../../types/crm';
import {
  Phone,
  Calendar,
  MessageSquare,
  Sparkles,
  User,
  Clock,
  Building2,
  DollarSign,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Clinic } from '../../types/database';

interface CRMLeadCardProps {
  opportunity: CRMLeadOpportunity;
  clinics: Clinic[];
  onOpenQuickContact: (opp: CRMLeadOpportunity) => void;
  onUpdateStage: (id: string, stage: CRMStage) => void;
  onDelete: (id: string) => void;
  viewMode?: 'kanban' | 'list';
}

export const CRMLeadCard: React.FC<CRMLeadCardProps> = ({
  opportunity,
  clinics,
  onOpenQuickContact,
  onUpdateStage,
  onDelete,
  viewMode = 'kanban',
}) => {
  const clinic = clinics.find((c) => c.id === opportunity.clinicId);

  const getPriorityBadge = () => {
    switch (opportunity.priority) {
      case 'high':
        return { label: 'Alta Prioridade', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'medium':
        return { label: 'Média', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'low':
      default:
        return { label: 'Normal', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getTypeLabel = () => {
    switch (opportunity.type) {
      case 'recall_6m':
        return '🔄 Recall 6+ Meses';
      case 'treatment_pending':
        return '📑 Orçamento Aberto';
      case 'whatsapp_lead':
        return '💬 Lead WhatsApp';
      case 'indication':
        return '⭐ Indicação';
      default:
        return '📌 Outro Oportunidade';
    }
  };

  const priorityBadge = getPriorityBadge();

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-[#147A80]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-extrabold text-slate-900 text-base truncate">
                {opportunity.patientName}
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                {priorityBadge.label}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#147A80] border border-teal-200">
                {getTypeLabel()}
              </span>
            </div>

            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                {opportunity.patientPhone}
              </span>

              {clinic && (
                <span className="flex items-center gap-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {clinic.shortName}
                </span>
              )}

              {opportunity.dentistName && (
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  🩺 {opportunity.dentistName}
                </span>
              )}

              {opportunity.lastVisitDate && (
                <span className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Última visita: {opportunity.lastVisitDate}
                </span>
              )}
            </div>

            {opportunity.treatmentDescription && (
              <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                {opportunity.treatmentDescription}
              </p>
            )}
          </div>
        </div>

        {/* Right side values & action buttons */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 w-full md:w-auto justify-between md:justify-end">
          {opportunity.estimatedValue && opportunity.estimatedValue > 0 ? (
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Valor Est.
              </span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono">
                R$ {opportunity.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ) : null}

          {opportunity.pointsBonus ? (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-xl text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>+{opportunity.pointsBonus} Pts</span>
            </div>
          ) : null}

          {/* Selector Stage */}
          <select
            value={opportunity.stage}
            onChange={(e) => onUpdateStage(opportunity.id, e.target.value as CRMStage)}
            className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 cursor-pointer focus:ring-2 focus:ring-[#147A80]"
          >
            <option value="new">🆕 Novo</option>
            <option value="contacted">💬 Contatado</option>
            <option value="scheduled">📅 Agendado</option>
            <option value="converted">✅ Convertido</option>
            <option value="lost">❌ Perdido</option>
          </select>

          {/* Quick WhatsApp Action Button */}
          <button
            onClick={() => onOpenQuickContact(opportunity)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer hover:scale-102"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => onDelete(opportunity.id)}
            title="Excluir Oportunidade"
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Kanban Card View
  return (
    <div className="bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
            {priorityBadge.label}
          </span>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
            {getTypeLabel()}
          </span>
        </div>

        {/* Patient Name */}
        <h4 className="font-extrabold text-slate-900 text-sm mb-1 line-clamp-1 group-hover:text-[#147A80] transition-colors">
          {opportunity.patientName}
        </h4>

        {/* Phone & Clinic */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-mono font-semibold text-slate-700">{opportunity.patientPhone}</span>
          {clinic && <span className="font-medium text-slate-500 text-[11px]">📍 {clinic.shortName}</span>}
        </div>

        {/* Description */}
        {opportunity.treatmentDescription && (
          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2 mb-2">
            {opportunity.treatmentDescription}
          </p>
        )}

        {/* Dates / Last Visit */}
        {opportunity.lastVisitDate && (
          <div className="text-[11px] font-medium text-amber-800 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1 mb-2">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Última consulta: {opportunity.lastVisitDate}</span>
          </div>
        )}

        {/* Value and Points */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
          {opportunity.estimatedValue ? (
            <span className="font-black text-emerald-700 font-mono text-xs">
              R$ {opportunity.estimatedValue.toLocaleString('pt-BR')}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">Sem valor est.</span>
          )}

          {opportunity.pointsBonus ? (
            <span className="flex items-center gap-1 bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md text-[10px] font-black border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-600" />+{opportunity.pointsBonus} pts
            </span>
          ) : null}
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-1.5">
        <button
          onClick={() => onOpenQuickContact(opportunity)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        <select
          value={opportunity.stage}
          onChange={(e) => onUpdateStage(opportunity.id, e.target.value as CRMStage)}
          className="text-[11px] font-bold bg-slate-100 border border-slate-300 rounded-xl px-2 py-1.5 text-slate-800 cursor-pointer focus:ring-2 focus:ring-[#147A80]"
        >
          <option value="new">🆕 Novo</option>
          <option value="contacted">💬 Contatado</option>
          <option value="scheduled">📅 Agendado</option>
          <option value="converted">✅ Convertido</option>
          <option value="lost">❌ Perdido</option>
        </select>

        <button
          onClick={() => onDelete(opportunity.id)}
          title="Excluir Oportunidade"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
