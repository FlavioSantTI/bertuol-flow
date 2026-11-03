import React, { useState, useEffect } from 'react';
import { CRMLeadOpportunity, CRMPipeline, CRMPriority, CRMStage, CRMType } from '../../types/crm';
import { Clinic, Dentist } from '../../types/database';
import { X, Plus, User, Phone, Sparkles } from 'lucide-react';

interface CRMNewOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  dentists: Dentist[];
  pipelines?: CRMPipeline[];
  defaultPipelineId?: string;
  onCreate: (opp: Omit<CRMLeadOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  defaultClinicId?: number | 'all';
}

export const CRMNewOpportunityModal: React.FC<CRMNewOpportunityModalProps> = ({
  isOpen,
  onClose,
  clinics,
  dentists,
  pipelines = [],
  defaultPipelineId,
  onCreate,
  defaultClinicId,
}) => {
  const initialClinicId =
    typeof defaultClinicId === 'number' ? defaultClinicId : clinics[0]?.id || 1;

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [clinicId, setClinicId] = useState<number>(initialClinicId);
  const [pipelineId, setPipelineId] = useState<string>(defaultPipelineId || pipelines[0]?.id || 'pipe-default');
  const [stage, setStage] = useState<CRMStage>('new');
  const [type, setType] = useState<CRMType>('whatsapp_lead');
  const [priority, setPriority] = useState<CRMPriority>('medium');
  const [dentistName, setDentistName] = useState(dentists[0]?.Name || 'Dr. Flávio Santiago');
  const [treatmentDescription, setTreatmentDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [pointsBonus, setPointsBonus] = useState<string>('50');
  const [notes, setNotes] = useState('');
  const [source] = useState('WhatsApp Receptor');

  useEffect(() => {
    if (isOpen) {
      const targetPipeId = defaultPipelineId || pipelines[0]?.id || 'pipe-default';
      setPipelineId(targetPipeId);
      const targetPipe = pipelines.find((p) => p.id === targetPipeId) || pipelines[0];
      setStage(targetPipe?.stages[0]?.id || 'new');
    }
  }, [isOpen, defaultPipelineId, pipelines]);

  if (!isOpen) return null;

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId) || pipelines[0];
  const availableStages = selectedPipeline?.stages || [{ id: 'new', title: 'Novo Lead', icon: '🆕' }];

  const handlePipelineChange = (newPipeId: string) => {
    setPipelineId(newPipeId);
    const pipe = pipelines.find((p) => p.id === newPipeId);
    if (pipe && pipe.stages.length > 0) {
      setStage(pipe.stages[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) return;

    onCreate({
      pipelineId,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      clinicId: Number(clinicId),
      type,
      stage,
      priority,
      dentistName,
      treatmentDescription: treatmentDescription.trim() || 'Consulta / Avaliação Geral',
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
      pointsBonus: pointsBonus ? parseInt(pointsBonus, 10) : 50,
      notes: notes.trim(),
      source,
    });

    setPatientName('');
    setPatientPhone('');
    setTreatmentDescription('');
    setEstimatedValue('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Nova Oportunidade / Lead</h3>
              <p className="text-xs text-slate-300">Cadastre paciente para acompanhamento do CRM</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Pipeline & Stage Selection */}
          {pipelines.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-teal-50/50 border border-teal-200/80 rounded-2xl p-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-teal-900 mb-1">
                  Funil (Pipeline) *
                </label>
                <select
                  value={pipelineId}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  className="w-full bg-white border border-teal-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#147A80]"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-teal-900 mb-1">
                  Etapa Inicial *
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full bg-white border border-teal-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#147A80]"
                >
                  {availableStages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon || '📌'} {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Patient Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Nome do Paciente *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                WhatsApp / Celular *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: 63999887766"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white transition-all font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Clinic & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Unidade *</label>
              <select
                value={clinicId}
                onChange={(e) => setClinicId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    📍 {c.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Tipo de Oportunidade
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CRMType)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
              >
                <option value="whatsapp_lead">💬 Lead WhatsApp Receptor</option>
                <option value="recall_6m">🔄 Recall Preventivo (6+ Meses)</option>
                <option value="treatment_pending">📑 Orçamento Pendente</option>
                <option value="indication">⭐ Indicação de Paciente</option>
                <option value="other">📌 Outro</option>
              </select>
            </div>
          </div>

          {/* Dentist & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Profissional Responsável
              </label>
              <select
                value={dentistName}
                onChange={(e) => setDentistName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
              >
                {dentists.map((d) => (
                  <option key={d.id} value={d.Name}>
                    {d.Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">Nível de Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CRMPriority)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
              >
                <option value="high">🔴 Alta Prioridade</option>
                <option value="medium">🟡 Média Prioridade</option>
                <option value="low">🟢 Normal</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">
              Tratamento / Interesse Principal
            </label>
            <input
              type="text"
              placeholder="Ex: Avaliação de Implantes, Limpeza Preventiva, Clareamento"
              value={treatmentDescription}
              onChange={(e) => setTreatmentDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
            />
          </div>

          {/* Value & Points Bonus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                placeholder="Ex: 350.00"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#147A80] focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-amber-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Bônus Clube Sorriso (Pts)
              </label>
              <input
                type="number"
                placeholder="Ex: 50"
                value={pointsBonus}
                onChange={(e) => setPointsBonus(e.target.value)}
                className="w-full bg-amber-50/60 border border-amber-200 text-amber-950 text-xs font-black rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1">Observações Internas</label>
            <textarea
              rows={2}
              placeholder="Ex: Preferência para atendimento no período da tarde."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl p-3 focus:ring-2 focus:ring-[#147A80] focus:bg-white"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-102"
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
