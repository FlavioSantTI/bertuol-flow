import React, { useState, useEffect } from 'react';
import {
  CRMCustomField,
  CRMLabel,
  CRMLeadOpportunity,
  CRMPipeline,
  CRMPriority,
} from '../../types/crm';
import { Clinic, Dentist } from '../../types/database';
import { CRMService } from '../../services/crmService';
import {
  X,
  MessageSquare,
  CalendarPlus,
  Plus,
  Trash2,
  Send,
  Save,
  Calendar,
  Tag,
  FileText,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

interface CRMLeadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CRMLeadOpportunity | null;
  clinics: Clinic[];
  dentists: Dentist[];
  pipelines: CRMPipeline[];
  labels: CRMLabel[];
  currentUserName: string;
  onSaveOpportunity: (oppId: string, updates: Partial<CRMLeadOpportunity>) => void;
  onStageChangeRequest: (opp: CRMLeadOpportunity, targetStageId: string) => void;
  onMovePipeline: (oppId: string, targetPipelineId: string) => void;
  onAddNote: (oppId: string, text: string, author: string) => void;
  onToggleLabel: (oppId: string, labelId: string) => void;
  onCreateLabel: (name: string, color: CRMLabel['color']) => void;
  onDeleteLabel: (labelId: string) => void;
  onOpenQuickContact: (opp: CRMLeadOpportunity) => void;
  onOpenQuickSchedule: (opp: CRMLeadOpportunity) => void;
}

const SOURCE_SUGGESTIONS = [
  'WhatsApp',
  'Instagram',
  'Tráfego Pago',
  'Balcão / Presencial',
  'Indicação',
  'Ligação Telefônica',
  'Google',
];

const CUSTOM_FIELD_PRESETS = [
  'Melhor Horário',
  'Instagram / Rede',
  'Convênio / Plano',
  'Indicado por',
  'Forma de Pagamento',
  'Queixa Principal',
];

const LABEL_COLOR_CLASSES: Record<CRMLabel['color'], string> = {
  teal: 'bg-teal-50 text-teal-800 border-teal-200',
  amber: 'bg-amber-50 text-amber-900 border-amber-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const CRMLeadDrawer: React.FC<CRMLeadDrawerProps> = ({
  isOpen,
  onClose,
  opportunity,
  clinics,
  dentists,
  pipelines,
  labels,
  currentUserName,
  onSaveOpportunity,
  onStageChangeRequest,
  onMovePipeline,
  onAddNote,
  onToggleLabel,
  onCreateLabel,
  onDeleteLabel,
  onOpenQuickContact,
  onOpenQuickSchedule,
}) => {
  const [drawerTab, setDrawerTab] = useState<'ficha' | 'notas'>('ficha');

  // Editable form state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [clinicId, setClinicId] = useState<number>(1);
  const [dentistName, setDentistName] = useState('');
  const [source, setSource] = useState('');
  const [priority, setPriority] = useState<CRMPriority>('medium');
  const [treatmentDescription, setTreatmentDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [pointsBonus, setPointsBonus] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [customFields, setCustomFields] = useState<CRMCustomField[]>([]);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Add custom field inline
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // Notes & new label
  const [noteText, setNoteText] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<CRMLabel['color']>('teal');

  useEffect(() => {
    if (!opportunity) return;
    setPatientName(opportunity.patientName || '');
    setPatientPhone(opportunity.patientPhone || '');
    setClinicId(opportunity.clinicId || clinics[0]?.id || 1);
    setDentistName(opportunity.dentistName || '');
    setSource(opportunity.source || 'WhatsApp');
    setPriority(opportunity.priority || 'medium');
    setTreatmentDescription(opportunity.treatmentDescription || '');
    setEstimatedValue(
      opportunity.estimatedValue != null && opportunity.estimatedValue > 0
        ? String(opportunity.estimatedValue)
        : ''
    );
    setPointsBonus(String(opportunity.pointsBonus ?? 50));
    setNextContactDate(opportunity.nextContactDate || '');
    setCustomFields(Array.isArray(opportunity.customFields) ? opportunity.customFields : []);
    setNewFieldLabel('');
    setNewFieldValue('');
    setNoteText('');
    setSavedFeedback(false);
  }, [opportunity, isOpen, clinics]);

  if (!isOpen || !opportunity) return null;

  const activePipeline = pipelines.find((p) => p.id === opportunity.pipelineId) || pipelines[0];
  const pipelineStages = activePipeline?.stages || [];

  const handleSaveFicha = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patientName.trim()) return;

    onSaveOpportunity(opportunity.id, {
      patientName: patientName.trim(),
      primeiroNome: patientName.trim().split(' ')[0],
      patientPhone: patientPhone.trim() || 'Sem telefone',
      clinicId: Number(clinicId),
      dentistName: dentistName.trim() || 'Sem preferência',
      source: source.trim() || 'Atendimento Livre',
      priority,
      treatmentDescription: treatmentDescription.trim(),
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
      pointsBonus: pointsBonus ? parseInt(pointsBonus, 10) : 0,
      nextContactDate: nextContactDate || undefined,
      customFields: customFields.filter((cf) => cf.label.trim() && cf.value.trim()),
    });

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleAddCustomField = (presetLabel?: string) => {
    const lbl = (presetLabel || newFieldLabel).trim();
    if (!lbl) return;
    const item: CRMCustomField = {
      id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: lbl,
      value: presetLabel ? '' : newFieldValue.trim(),
    };
    const next = [...customFields, item];
    setCustomFields(next);
    if (!presetLabel) {
      setNewFieldLabel('');
      setNewFieldValue('');
      onSaveOpportunity(opportunity.id, { customFields: next });
    }
  };

  const handleUpdateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    setCustomFields((prev) => prev.map((cf) => (cf.id === id ? { ...cf, [key]: val } : cf)));
  };

  const handleRemoveCustomField = (id: string) => {
    const next = customFields.filter((cf) => cf.id !== id);
    setCustomFields(next);
    onSaveOpportunity(opportunity.id, { customFields: next });
  };

  const quickOffsetFollowUp = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    setNextContactDate(iso);
    onSaveOpportunity(opportunity.id, { nextContactDate: iso });
  };

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(opportunity.id, noteText.trim(), currentUserName);
    setNoteText('');
  };

  const history = opportunity.notesHistory || [];

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-[2px] flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="bg-slate-900 px-5 py-4 text-white shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] text-teal-300 font-semibold uppercase tracking-wide">
                <span>Ficha Livre do Atendimento</span>
                {opportunity.contactAttempts > 0 && (
                  <span className="font-mono tabular-nums text-slate-300">
                    · {opportunity.contactAttempts}ª tentativa
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-white truncate mt-0.5">
                {patientName || opportunity.patientName}
              </h3>
              <p className="text-xs text-slate-300 font-mono tabular-nums">
                {CRMService.formatPhoneDisplay(patientPhone || opportunity.patientPhone)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Instant Action Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenQuickContact(opportunity)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickSchedule(opportunity)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-teal-300" />
              <span>Agendar na Grade</span>
            </button>

            <select
              value={opportunity.stage}
              onChange={(e) => onStageChangeRequest(opportunity, e.target.value)}
              className="ml-auto bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 cursor-pointer"
            >
              {pipelineStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drawer Sub-Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDrawerTab('ficha')}
              className={`py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                drawerTab === 'ficha'
                  ? 'border-[#147A80] text-[#147A80]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ficha & Campos Livres</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerTab('notas')}
              className={`py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                drawerTab === 'notas'
                  ? 'border-[#147A80] text-[#147A80]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notas & Histórico ({history.length})</span>
            </button>
          </div>

          {savedFeedback && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <Check className="w-3.5 h-3.5" /> Salvo no Supabase
            </span>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
          {drawerTab === 'ficha' ? (
            <form onSubmit={handleSaveFicha} className="space-y-4">
              {/* Primary Contact Info */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Dados do Contato (Edição Livre)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nome / Identificação *
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      WhatsApp, Telefone ou @Instagram
                    </label>
                    <input
                      type="text"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="(63) 99999-9999 ou @perfil"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Interesse / Assunto Livre (o que a atendente anotou)
                  </label>
                  <textarea
                    rows={2}
                    value={treatmentDescription}
                    onChange={(e) => setTreatmentDescription(e.target.value)}
                    placeholder="Escreva livremente: Ex. Quer saber valor de clareamento e avaliação para implante..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unidade</label>
                    <select
                      value={clinicId}
                      onChange={(e) => setClinicId(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900"
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
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Profissional
                    </label>
                    <select
                      value={dentistName}
                      onChange={(e) => setDentistName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="Sem preferência">Sem preferência</option>
                      {dentists.map((d) => (
                        <option key={d.id} value={d.Name}>
                          {d.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as CRMPriority)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Média</option>
                      <option value="low">Normal</option>
                    </select>
                  </div>
                </div>

                {/* Channel / Source Free Input + Quick Chips */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Canal / Origem do Contato
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Ex: Instagram, WhatsApp, Indicação..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 mb-1.5"
                  />
                  <div className="flex flex-wrap gap-1">
                    {SOURCE_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSource(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                          source === s
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value, Points & Pipeline Transfer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Valor Est. (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Clube Sorriso (Pts)
                    </label>
                    <input
                      type="number"
                      placeholder="50"
                      value={pointsBonus}
                      onChange={(e) => setPointsBonus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Funil</label>
                    <select
                      value={opportunity.pipelineId}
                      onChange={(e) => onMovePipeline(opportunity.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 cursor-pointer"
                    >
                      {pipelines.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Free-Form Custom Fields */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Campos Livres da Atendente
                  </h4>
                  <span className="text-[11px] text-slate-400">Adicione qualquer informação extra</span>
                </div>

                {/* Preset quick chips */}
                <div className="flex flex-wrap gap-1">
                  {CUSTOM_FIELD_PRESETS.filter(
                    (preset) => !customFields.some((cf) => cf.label.toLowerCase() === preset.toLowerCase())
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddCustomField(preset)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 hover:text-[#147A80] text-slate-700 text-[11px] font-semibold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>

                {/* Existing Custom Fields */}
                {customFields.length > 0 && (
                  <div className="space-y-2">
                    {customFields.map((cf) => (
                      <div key={cf.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cf.label}
                          onChange={(e) => handleUpdateCustomField(cf.id, 'label', e.target.value)}
                          placeholder="Campo"
                          className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        />
                        <input
                          type="text"
                          value={cf.value}
                          onChange={(e) => handleUpdateCustomField(cf.id, 'value', e.target.value)}
                          placeholder="Valor / Informação livre..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(cf.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remover campo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add completely custom field */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Nome do campo (ex: Cidade)"
                    className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Conteúdo..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomField()}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Follow-up & Labels */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#147A80]" /> Próximo Follow-up
                    </span>
                    {nextContactDate && (
                      <button
                        type="button"
                        onClick={() => setNextContactDate('')}
                        className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={nextContactDate}
                      onChange={(e) => setNextContactDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => quickOffsetFollowUp(1)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Amanhã
                    </button>
                    <button
                      type="button"
                      onClick={() => quickOffsetFollowUp(3)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      +3 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => quickOffsetFollowUp(7)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      +7 dias
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#147A80]" /> Rótulos
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((lbl) => {
                      const active = (opportunity.labels || []).includes(lbl.id);
                      return (
                        <div key={lbl.id} className="inline-flex items-center group">
                          <button
                            type="button"
                            onClick={() => onToggleLabel(opportunity.id, lbl.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                              active
                                ? `${LABEL_COLOR_CLASSES[lbl.color]} ring-2 ring-slate-900/15`
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {active ? `✓ ${lbl.name}` : lbl.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteLabel(lbl.id)}
                            className="ml-0.5 p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Criar novo rótulo..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                    <select
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value as CRMLabel['color'])}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="teal">Turquesa</option>
                      <option value="amber">Âmbar</option>
                      <option value="indigo">Índigo</option>
                      <option value="emerald">Verde</option>
                      <option value="rose">Vermelho</option>
                      <option value="slate">Cinza</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newLabelName.trim()) return;
                        onCreateLabel(newLabelName.trim(), newLabelColor);
                        setNewLabelName('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Criar
                    </button>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 pt-2 pb-1 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações da Ficha</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleSendNote} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                <label className="block text-[11px] font-bold uppercase text-slate-500">
                  Registrar Nova Nota / Evolução do Atendimento
                </label>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Escreva livremente o que foi conversado com o paciente..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Registrar Nota</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                {history.length === 0 && !opportunity.notes ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                    Nenhuma nota registrada ainda para este atendimento.
                  </div>
                ) : (
                  <>
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-bold text-slate-800">{entry.author}</span>
                          <span className="font-mono tabular-nums">
                            {new Date(entry.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                      </div>
                    ))}
                    {history.length === 0 && opportunity.notes && (
                      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700">
                        {opportunity.notes}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
