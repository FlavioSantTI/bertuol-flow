import React, { useState, useEffect } from 'react';
import {
  CRMCustomField,
  CRMLabel,
  CRMLeadOpportunity,
  CRMPipeline,
  CRMPriority,
  CRMType,
} from '../../types/crm';
import { Clinic, Dentist } from '../../types/database';
import { X, Plus, User, Phone, Layers, Tag, Calendar, Trash2 } from 'lucide-react';

interface CRMNewOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  dentists: Dentist[];
  pipelines: CRMPipeline[];
  labels: CRMLabel[];
  activePipelineId: string;
  currentUserName: string;
  onCreate: (
    opp: Omit<CRMLeadOpportunity, 'id' | 'createdAt' | 'updatedAt' | 'labels' | 'contactAttempts'> & {
      labels?: string[];
    }
  ) => void;
  defaultClinicId?: number | 'all';
}

const CHANNEL_CHIPS = ['WhatsApp', 'Instagram', 'Tráfego Pago', 'Balcão / Presencial', 'Indicação', 'Telefone'];
const QUICK_CUSTOM_PRESETS = ['Melhor Horário', 'Convênio', 'Instagram', 'Indicado por'];

export const CRMNewOpportunityModal: React.FC<CRMNewOpportunityModalProps> = ({
  isOpen,
  onClose,
  clinics,
  dentists,
  pipelines,
  labels,
  activePipelineId,
  currentUserName,
  onCreate,
  defaultClinicId,
}) => {
  const initialClinicId =
    typeof defaultClinicId === 'number' ? defaultClinicId : clinics[0]?.id || 1;

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [clinicId, setClinicId] = useState<number>(initialClinicId);
  const [pipelineId, setPipelineId] = useState<string>(activePipelineId || 'campaigns');
  const [type, setType] = useState<CRMType>('whatsapp_lead');
  const [priority, setPriority] = useState<CRMPriority>('medium');
  const [dentistName, setDentistName] = useState('Sem preferência');
  const [treatmentDescription, setTreatmentDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [pointsBonus, setPointsBonus] = useState<string>('50');
  const [nextContactDate, setNextContactDate] = useState<string>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<CRMCustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('WhatsApp');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const targetPipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
      setPipelineId(targetPipeline?.id || 'campaigns');
      setPointsBonus(String(targetPipeline?.defaultPointsBonus ?? 50));
      if (targetPipeline?.id === 'budgets') {
        setType('treatment_pending');
      } else if (targetPipeline?.id === 'recall_6m') {
        setType('recall_6m');
      } else {
        setType('whatsapp_lead');
      }
      setPatientName('');
      setPatientPhone('');
      setDentistName('Sem preferência');
      setTreatmentDescription('');
      setEstimatedValue('');
      setNextContactDate('');
      setSelectedLabels([]);
      setCustomFields([]);
      setNewFieldLabel('');
      setNewFieldValue('');
      setNotes('');
      setSource('WhatsApp');
      setShowAdvanced(false);
    }
  }, [isOpen, activePipelineId, pipelines]);

  if (!isOpen) return null;

  const toggleLabel = (lblId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(lblId) ? prev.filter((id) => id !== lblId) : [...prev, lblId]
    );
  };

  const addCustomField = (preset?: string) => {
    const lbl = (preset || newFieldLabel).trim();
    if (!lbl) return;
    setCustomFields((prev) => [
      ...prev,
      {
        id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        label: lbl,
        value: preset ? '' : newFieldValue.trim(),
      },
    ]);
    if (!preset) {
      setNewFieldLabel('');
      setNewFieldValue('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const targetPipeline = pipelines.find((p) => p.id === pipelineId);
    const firstStageId = targetPipeline?.stages[0]?.id || 'new';

    onCreate({
      pipelineId,
      patientName: patientName.trim(),
      primeiroNome: patientName.trim().split(' ')[0],
      patientPhone: patientPhone.trim() || 'Sem telefone',
      clinicId: Number(clinicId),
      type,
      stage: firstStageId,
      priority,
      labels: selectedLabels,
      customFields: customFields.filter((cf) => cf.label.trim() && cf.value.trim()),
      dentistName: dentistName || 'Sem preferência',
      treatmentDescription: treatmentDescription.trim() || notes.trim() || 'Atendimento / Avaliação',
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
      pointsBonus: pointsBonus ? parseInt(pointsBonus, 10) : 50,
      nextContactDate: nextContactDate || undefined,
      assignedUser: currentUserName,
      notes: notes.trim(),
      source: source.trim() || 'Atendimento Livre',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Ficha Livre — Novo Atendimento / Lead</h3>
              <p className="text-xs text-slate-300">
                Preencha apenas o que tiver em mãos; o restante pode completar depois
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Essential Free-form Trio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Nome / Identificação *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Maria (Instagram) ou João Silva"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                WhatsApp / Contato Livre
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 63999887766 ou @instagram"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Free Text Summary */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              O que o paciente precisa / Anotação livre
            </label>
            <textarea
              rows={2}
              placeholder="Escreva livremente: Ex. Perguntou sobre implante, quer passar em Palmas na sexta à tarde..."
              value={treatmentDescription}
              onChange={(e) => setTreatmentDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-[#147A80]"
            />
          </div>

          {/* Pipeline & Unit & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Funil
              </label>
              <select
                value={pipelineId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setPipelineId(nextId);
                  const found = pipelines.find((p) => p.id === nextId);
                  if (found?.defaultPointsBonus != null) {
                    setPointsBonus(String(found.defaultPointsBonus));
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Unidade</label>
              <select
                value={clinicId}
                onChange={(e) => setClinicId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5"
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
          </div>

          {/* Quick Channel Chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Por onde chegou? (Canal)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CHANNEL_CHIPS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSource(ch)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                    source === ch
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Free Custom Fields */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-600">
                Campos Livres Extras (Opcional)
              </span>
              <div className="flex flex-wrap gap-1">
                {QUICK_CUSTOM_PRESETS.filter(
                  (p) => !customFields.some((c) => c.label === p)
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addCustomField(preset)}
                    className="text-[10px] font-semibold text-[#147A80] hover:underline cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {customFields.map((cf) => (
              <div key={cf.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cf.label}
                  onChange={(e) =>
                    setCustomFields((prev) =>
                      prev.map((item) => (item.id === cf.id ? { ...item, label: e.target.value } : item))
                    )
                  }
                  className="w-1/3 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                />
                <input
                  type="text"
                  value={cf.value}
                  onChange={(e) =>
                    setCustomFields((prev) =>
                      prev.map((item) => (item.id === cf.id ? { ...item, value: e.target.value } : item))
                    )
                  }
                  placeholder="Preencha..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setCustomFields((prev) => prev.filter((item) => item.id !== cf.id))}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Campo personalizado"
                className="w-1/3 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder="Informação..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => addCustomField()}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Toggleable Secondary Fields */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-semibold text-[#147A80] hover:underline cursor-pointer"
          >
            {showAdvanced
              ? 'Ocultar detalhes adicionais (dentista, valor, follow-up, rótulos)'
              : '+ Mais detalhes (dentista, valor R$, data de follow-up, rótulos)'}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Tipo / Categoria
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CRMType)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5 py-2"
                  >
                    <option value="whatsapp_lead">Lead WhatsApp</option>
                    <option value="treatment_pending">Orçamento Pendente</option>
                    <option value="indication">Indicação</option>
                    <option value="recall_6m">Recall 6+ Meses</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Profissional
                  </label>
                  <select
                    value={dentistName}
                    onChange={(e) => setDentistName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5 py-2"
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
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CRMPriority)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5 py-2"
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Valor Est. (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-amber-800 mb-1">
                    Bônus Clube (Pts)
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={pointsBonus}
                    onChange={(e) => setPointsBonus(e.target.value)}
                    className="w-full bg-amber-50/60 border border-amber-200 text-amber-950 text-xs font-bold rounded-xl px-3 py-2 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Follow-up
                  </label>
                  <input
                    type="date"
                    value={nextContactDate}
                    onChange={(e) => setNextContactDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {labels.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Rótulos
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((lbl) => {
                      const selected = selectedLabels.includes(lbl.id);
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => toggleLabel(lbl.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {selected ? `✓ ${lbl.name}` : lbl.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Nota Inicial da Recepção
                </label>
                <textarea
                  rows={2}
                  placeholder="Observação para histórico..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5"
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar no Funil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
