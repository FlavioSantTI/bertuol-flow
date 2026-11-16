import React, { useState, useEffect } from 'react';
import { CRMLabel, CRMLeadOpportunity, CRMPipeline, CRMPriority, CRMType } from '../../types/crm';
import { Clinic, Dentist } from '../../types/database';
import { X, Plus, User, Phone, Layers, Tag, Calendar } from 'lucide-react';

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
  const [dentistName, setDentistName] = useState(dentists[0]?.Name || 'Dr. Flávio Santiago');
  const [treatmentDescription, setTreatmentDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [pointsBonus, setPointsBonus] = useState<string>('50');
  const [nextContactDate, setNextContactDate] = useState<string>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('WhatsApp Receptor');

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
      setTreatmentDescription('');
      setEstimatedValue('');
      setNextContactDate('');
      setSelectedLabels([]);
      setNotes('');
    }
  }, [isOpen, activePipelineId, pipelines]);

  if (!isOpen) return null;

  const toggleLabel = (lblId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(lblId) ? prev.filter((id) => id !== lblId) : [...prev, lblId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) return;

    const targetPipeline = pipelines.find((p) => p.id === pipelineId);
    const firstStageId = targetPipeline?.stages[0]?.id || 'new';

    onCreate({
      pipelineId,
      patientName: patientName.trim(),
      primeiroNome: patientName.trim().split(' ')[0],
      patientPhone: patientPhone.trim(),
      clinicId: Number(clinicId),
      type,
      stage: firstStageId,
      priority,
      labels: selectedLabels,
      dentistName,
      treatmentDescription: treatmentDescription.trim() || 'Consulta / Avaliação Geral',
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
      pointsBonus: pointsBonus ? parseInt(pointsBonus, 10) : 50,
      nextContactDate: nextContactDate || undefined,
      assignedUser: currentUserName,
      notes: notes.trim(),
      source,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Nova Oportunidade / Lead</h3>
              <p className="text-xs text-slate-300">
                Sincronizado no Supabase para toda a equipe das clínicas
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Nome do Paciente *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                WhatsApp / Celular *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: 63999887766"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white font-mono tabular-nums"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Funil de Destino *
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80]"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Origem / Tipo de Oportunidade
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CRMType)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80]"
              >
                <option value="whatsapp_lead">Lead WhatsApp / Tráfego Pago</option>
                <option value="treatment_pending">Orçamento Pendente</option>
                <option value="indication">Indicação Clube Sorriso</option>
                <option value="recall_6m">Recall Preventivo (6+ Meses)</option>
                <option value="other">Outra Oportunidade</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Unidade *</label>
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

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Dentista
              </label>
              <select
                value={dentistName}
                onChange={(e) => setDentistName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5"
              >
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5"
              >
                <option value="high">Alta Prioridade</option>
                <option value="medium">Média</option>
                <option value="low">Normal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Tratamento / Interesse Principal
              </label>
              <input
                type="text"
                placeholder="Ex: Avaliação de Implantes, Clareamento, Prótese"
                value={treatmentDescription}
                onChange={(e) => setTreatmentDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-3 py-2.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Origem (Canal)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Instagram / Indicação"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-3 py-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-amber-800 mb-1">
                Bônus Clube Sorriso (Pts)
              </label>
              <input
                type="number"
                placeholder="50"
                value={pointsBonus}
                onChange={(e) => setPointsBonus(e.target.value)}
                className="w-full bg-amber-50/60 border border-amber-200 text-amber-950 text-xs font-bold rounded-xl px-3 py-2.5 font-mono tabular-nums"
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl px-3 py-2.5"
              />
            </div>
          </div>

          {/* Labels selector */}
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

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Nota Inicial / Observações
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Preferência para atendimento no período da tarde."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3"
            />
          </div>

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
              <span>Criar Oportunidade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
