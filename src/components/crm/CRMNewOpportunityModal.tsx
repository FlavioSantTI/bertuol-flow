import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CRMCustomField,
  CRMLabel,
  CRMLeadOpportunity,
  CRMPipeline,
  CRMPriority,
  CRMType,
} from '../../types/crm';
import { Clinic, Dentist } from '../../types/database';
import {
  createPatientInSupabase,
  deletePatientInSupabase,
  resolveClinicTenantUuid,
  searchPatientsByNameInSupabase,
  SupabasePatient,
  updatePatientInSupabase,
} from '../../services/supabaseService';
import {
  X,
  Plus,
  User,
  Phone,
  Layers,
  Tag,
  Calendar,
  Trash2,
  Search,
  UserPlus,
  Pencil,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

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
  onCreateLabel?: (name: string, color: CRMLabel['color']) => CRMLabel | null;
  defaultClinicId?: number | 'all';
}

interface PatientSearchResult {
  id: string;
  external_id?: string | null;
  clinicId: number;
  tenant_id?: string | null;
  name: string;
  mobile_phone?: string | null;
  document_id?: string | null;
  email?: string | null;
  insurance_plan_name?: string | null;
  notes?: string | null;
  source?: 'supabase' | 'clinicorp' | 'local';
}

const CHANNEL_CHIPS = [
  'WhatsApp',
  'Instagram',
  'Tráfego Pago',
  'Balcão / Presencial',
  'Indicação',
  'Telefone',
];
const QUICK_CUSTOM_PRESETS = ['Melhor Horário', 'Convênio', 'Instagram', 'Indicado por'];

const formatPhoneMask = (raw: string): string => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formatCpfMask = (raw: string): string => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const resolveClinicIdFromTenant = (tenantId?: string | null, fallback = 1): number => {
  if (!tenantId) return fallback;
  const lower = tenantId.toLowerCase();
  if (lower.includes('5d30567b') || lower === '2' || lower.includes('paraiso')) return 2;
  return 1;
};

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
  onCreateLabel,
  defaultClinicId,
}) => {
  const initialClinicId =
    typeof defaultClinicId === 'number' ? defaultClinicId : clinics[0]?.id || 1;

  // Patient Search & CRUD states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Inline Patient CRUD Form (create / edit)
  const [crudMode, setCrudMode] = useState<'none' | 'create' | 'edit'>('none');
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [crudName, setCrudName] = useState('');
  const [crudPhone, setCrudPhone] = useState('');
  const [crudCpf, setCrudCpf] = useState('');
  const [crudEmail, setCrudEmail] = useState('');
  const [crudInsurance, setCrudInsurance] = useState('Particular');
  const [crudClinicId, setCrudClinicId] = useState<number>(initialClinicId);
  const [crudNotes, setCrudNotes] = useState('');
  const [isSavingCrud, setIsSavingCrud] = useState(false);
  const [crudError, setCrudError] = useState<string | null>(null);
  const [crudFeedback, setCrudFeedback] = useState<string | null>(null);

  // Lead / Opportunity fields
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
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<CRMLabel['color']>('teal');
  const [customFields, setCustomFields] = useState<CRMCustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('WhatsApp');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const searchAbortRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      const targetPipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
      setPipelineId(targetPipeline?.id || 'campaigns');
      setPointsBonus(String(targetPipeline?.defaultPointsBonus ?? 50));
      if (targetPipeline?.id === 'budgets') {
        setType('treatment_pending');
      } else if (targetPipeline?.id === 'recall_6m') {
        setType('recall_6m');
      } else if (targetPipeline?.id === 'birthdays') {
        setType('birthday');
      } else {
        setType('whatsapp_lead');
      }
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setSelectedPatient(null);
      setConfirmDeleteId(null);
      setIsDeletingId(null);
      setCrudMode('none');
      setEditingPatientId(null);
      setCrudError(null);
      setCrudFeedback(null);

      setPatientName('');
      setPatientPhone('');
      setClinicId(initialClinicId);
      setDentistName('Sem preferência');
      setTreatmentDescription('');
      setEstimatedValue('');
      setNextContactDate('');
      setSelectedLabels([]);
      setNewLabelName('');
      setNewLabelColor('teal');
      setCustomFields([]);
      setNewFieldLabel('');
      setNewFieldValue('');
      setNotes('');
      setSource('WhatsApp');
      setShowAdvanced(false);
    }
  }, [isOpen, activePipelineId, pipelines, initialClinicId]);

  // Debounced unified search across Backend API + Supabase client cache + Clinicorp
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearchingPatients(false);
      return;
    }

    const reqId = ++searchAbortRef.current;
    setIsSearchingPatients(true);

    const timer = setTimeout(async () => {
      try {
        const [apiRes, supaList] = await Promise.all([
          fetch(`/api/patients/search?q=${encodeURIComponent(trimmed)}&clinicId=${clinicId}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          searchPatientsByNameInSupabase(trimmed).catch(() => [] as SupabasePatient[]),
        ]);

        if (reqId !== searchAbortRef.current) return;

        const merged = new Map<string, PatientSearchResult>();

        if (apiRes?.success && Array.isArray(apiRes.patients)) {
          for (const p of apiRes.patients) {
            if (!p?.id || !p?.name) continue;
            merged.set(p.id, {
              id: p.id,
              external_id: p.external_id || null,
              clinicId: p.clinicId || resolveClinicIdFromTenant(p.tenant_id, clinicId),
              tenant_id: p.tenant_id || null,
              name: p.name,
              mobile_phone: p.mobile_phone || null,
              document_id: p.document_id || null,
              email: p.email || null,
              insurance_plan_name: p.insurance_plan_name || 'Particular',
              notes: p.notes || null,
              source: p.source || 'supabase',
            });
          }
        }

        for (const sp of supaList) {
          if (!sp?.id || !sp?.name || sp.is_deleted) continue;
          if (!merged.has(sp.id)) {
            merged.set(sp.id, {
              id: sp.id,
              external_id: sp.external_id || null,
              clinicId: resolveClinicIdFromTenant(sp.tenant_id, clinicId),
              tenant_id: sp.tenant_id || null,
              name: sp.name,
              mobile_phone: sp.mobile_phone || null,
              document_id: sp.document_id || null,
              email: sp.email || null,
              insurance_plan_name: sp.insurance_plan_name || 'Particular',
              notes: sp.notes || null,
              source: 'supabase',
            });
          }
        }

        setSearchResults(Array.from(merged.values()).slice(0, 20));
        setHasSearched(true);
      } finally {
        if (reqId === searchAbortRef.current) {
          setIsSearchingPatients(false);
        }
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchQuery, clinicId, isOpen]);

  if (!isOpen) return null;

  const linkPatientToLead = (p: PatientSearchResult) => {
    setSelectedPatient(p);
    setPatientName(p.name);
    setPatientPhone(p.mobile_phone || '');
    if (p.clinicId) setClinicId(p.clinicId);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setCrudMode('none');
    setConfirmDeleteId(null);
  };

  const unlinkPatient = () => {
    setSelectedPatient(null);
  };

  const openCreatePatientForm = (prefillRaw?: string) => {
    const raw = (prefillRaw || '').trim();
    const onlyDigits = raw.replace(/\D/g, '');
    const isNumericQuery = raw.length > 0 && /^[\d\s().-]+$/.test(raw);

    setCrudMode('create');
    setEditingPatientId(null);
    setCrudError(null);
    setCrudFeedback(null);

    if (isNumericQuery && onlyDigits.length === 11 && !onlyDigits.startsWith('639') && !onlyDigits.startsWith('119')) {
      setCrudName('');
      setCrudPhone('');
      setCrudCpf(formatCpfMask(onlyDigits));
    } else if (isNumericQuery) {
      setCrudName('');
      setCrudPhone(formatPhoneMask(onlyDigits));
      setCrudCpf('');
    } else {
      setCrudName(raw);
      setCrudPhone(patientPhone ? formatPhoneMask(patientPhone) : '');
      setCrudCpf('');
    }

    setCrudEmail('');
    setCrudInsurance('Particular');
    setCrudClinicId(clinicId);
    setCrudNotes('');
  };

  const openEditPatientForm = (p: PatientSearchResult) => {
    setCrudMode('edit');
    setEditingPatientId(p.id);
    setCrudError(null);
    setCrudFeedback(null);
    setCrudName(p.name || '');
    setCrudPhone(p.mobile_phone ? formatPhoneMask(p.mobile_phone) : '');
    setCrudCpf(p.document_id ? formatCpfMask(p.document_id) : '');
    setCrudEmail(p.email || '');
    setCrudInsurance(p.insurance_plan_name || 'Particular');
    setCrudClinicId(p.clinicId || clinicId);
    setCrudNotes(p.notes || '');
  };

  const handleSavePatientCrud = async () => {
    setCrudError(null);
    if (crudName.trim().length < 2) {
      setCrudError('Informe o nome completo do paciente.');
      return;
    }

    setIsSavingCrud(true);
    try {
      const tenantUuid = resolveClinicTenantUuid(crudClinicId);
      const cleanPhone = crudPhone.replace(/\D/g, '');
      const cleanCpf = crudCpf.replace(/\D/g, '');

      if (crudMode === 'create') {
        const apiRes = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: crudName.trim(),
            mobile_phone: cleanPhone || null,
            document_id: cleanCpf || null,
            email: crudEmail.trim() || null,
            insurance_plan_name: crudInsurance.trim() || 'Particular',
            clinicId: crudClinicId,
            tenant_id: tenantUuid,
            notes: crudNotes.trim() || null,
          }),
        })
          .then((r) => r.json())
          .catch(() => null);

        // Also keep Supabase client cache synced
        const supaRes = await createPatientInSupabase({
          name: crudName.trim(),
          mobile_phone: cleanPhone || null,
          document_id: cleanCpf || null,
          email: crudEmail.trim() || null,
          insurance_plan_name: crudInsurance.trim() || 'Particular',
          tenant_id: tenantUuid,
          notes: crudNotes.trim() || null,
        }).catch(() => null);

        const created = apiRes?.patient || supaRes?.data;
        if (!created) {
          setCrudError(apiRes?.error || 'Não foi possível incluir o paciente.');
          return;
        }

        const linked: PatientSearchResult = {
          id: created.id,
          external_id: created.external_id || null,
          clinicId: crudClinicId,
          tenant_id: tenantUuid,
          name: created.name,
          mobile_phone: created.mobile_phone || cleanPhone || null,
          document_id: created.document_id || cleanCpf || null,
          email: created.email || crudEmail.trim() || null,
          insurance_plan_name: created.insurance_plan_name || crudInsurance.trim() || 'Particular',
          notes: created.notes || crudNotes.trim() || null,
          source: 'supabase',
        };

        linkPatientToLead(linked);
        setCrudFeedback(`Paciente "${linked.name}" incluído na base e vinculado ao atendimento.`);
      } else if (crudMode === 'edit' && editingPatientId) {
        const apiRes = await fetch(`/api/patients/${encodeURIComponent(editingPatientId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: crudName.trim(),
            mobile_phone: cleanPhone || null,
            document_id: cleanCpf || null,
            email: crudEmail.trim() || null,
            insurance_plan_name: crudInsurance.trim() || 'Particular',
            clinicId: crudClinicId,
            tenant_id: tenantUuid,
            notes: crudNotes.trim() || null,
          }),
        })
          .then((r) => r.json())
          .catch(() => null);

        await updatePatientInSupabase(editingPatientId, {
          name: crudName.trim(),
          mobile_phone: cleanPhone || null,
          document_id: cleanCpf || null,
          email: crudEmail.trim() || null,
          insurance_plan_name: crudInsurance.trim() || 'Particular',
          tenant_id: tenantUuid,
          notes: crudNotes.trim() || null,
        }).catch(() => null);

        const updated: PatientSearchResult = {
          id: editingPatientId,
          clinicId: crudClinicId,
          tenant_id: tenantUuid,
          name: apiRes?.patient?.name || crudName.trim(),
          mobile_phone: apiRes?.patient?.mobile_phone ?? (cleanPhone || null),
          document_id: apiRes?.patient?.document_id ?? (cleanCpf || null),
          email: apiRes?.patient?.email ?? (crudEmail.trim() || null),
          insurance_plan_name: apiRes?.patient?.insurance_plan_name || crudInsurance.trim() || 'Particular',
          notes: apiRes?.patient?.notes ?? (crudNotes.trim() || null),
          source: 'supabase',
        };

        setSearchResults((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        linkPatientToLead(updated);
        setCrudFeedback(`Cadastro de "${updated.name}" atualizado na base.`);
      }
    } finally {
      setIsSavingCrud(false);
    }
  };

  const handleConfirmDeletePatient = async (targetId: string) => {
    setIsDeletingId(targetId);
    try {
      await fetch(`/api/patients/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      }).catch(() => null);
      await deletePatientInSupabase(targetId).catch(() => null);

      setSearchResults((prev) => prev.filter((item) => item.id !== targetId));
      if (selectedPatient?.id === targetId) {
        setSelectedPatient(null);
      }
      setConfirmDeleteId(null);
      setCrudFeedback('Paciente removido da base com sucesso.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const toggleLabel = (lblId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(lblId) ? prev.filter((id) => id !== lblId) : [...prev, lblId]
    );
  };

  const handleQuickCreateLabel = () => {
    const clean = newLabelName.trim();
    if (!clean || !onCreateLabel) return;
    const created = onCreateLabel(clean, newLabelColor);
    if (created?.id) {
      setSelectedLabels((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
    }
    setNewLabelName('');
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
      patientId: selectedPatient?.external_id || selectedPatient?.id || null,
      patientCpf: selectedPatient?.document_id || undefined,
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
      treatmentDescription:
        treatmentDescription.trim() || notes.trim() || 'Atendimento / Avaliação',
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
      pointsBonus: pointsBonus ? parseInt(pointsBonus, 10) : 50,
      nextContactDate: nextContactDate || undefined,
      assignedUser: currentUserName,
      notes: notes.trim(),
      source: source.trim() || 'Atendimento Livre',
    });

    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#147A80] border border-teal-200 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Novo Atendimento / Lead</h3>
              <p className="text-xs text-slate-500">
                Busque o paciente na base ou inclua um novo cadastro antes de salvar no funil
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* 1. Patient Base Search + CRUD Section */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#147A80]" />
                <span>Buscar Paciente na Base (Nome, WhatsApp ou CPF)</span>
              </label>
              {crudMode === 'none' && (
                <button
                  type="button"
                  onClick={() => openCreatePatientForm(searchQuery)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#147A80] hover:underline cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Incluir novo paciente</span>
                </button>
              )}
            </div>

            {crudFeedback && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{crudFeedback}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCrudFeedback(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
                  aria-label="Dispensar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Selected Patient Summary Strip */}
            {selectedPatient && crudMode === 'none' && (
              <div className="bg-white border border-teal-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Check className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
                    <span className="truncate">{selectedPatient.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    <span>{selectedPatient.mobile_phone || 'Sem telefone'}</span>
                    {selectedPatient.document_id && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>CPF {selectedPatient.document_id}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{selectedPatient.insurance_plan_name || 'Particular'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditPatientForm(selectedPatient)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3 text-[#147A80]" />
                    <span>Editar</span>
                  </button>

                  {confirmDeleteId === selectedPatient.id ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isDeletingId === selectedPatient.id}
                        onClick={() => handleConfirmDeletePatient(selectedPatient.id)}
                        className="h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isDeletingId === selectedPatient.id ? 'Excluindo...' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedPatient.id)}
                      className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={unlinkPatient}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold cursor-pointer"
                  >
                    Trocar
                  </button>
                </div>
              </div>
            )}

            {/* Search Input (shown when no patient linked or editing search) */}
            {!selectedPatient && crudMode === 'none' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setConfirmDeleteId(null);
                    }}
                    placeholder="Digite nome, WhatsApp ou CPF (mín. 2 caracteres)..."
                    className="w-full h-10 bg-white border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-9 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setHasSearched(false);
                      }}
                      aria-label="Limpar busca"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isSearchingPatients && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-1.5 px-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#147A80]" />
                    <span>Buscando pacientes na base da clínica...</span>
                  </div>
                )}

                {!isSearchingPatients && searchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-teal-50/40 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => linkPatientToLead(item)}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 tabular-nums mt-0.5">
                            <span>{item.mobile_phone || 'Sem telefone'}</span>
                            {item.document_id && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>CPF {item.document_id}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span>{item.insurance_plan_name || 'Particular'}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {item.source === 'clinicorp' ? 'Clinicorp' : 'Base Clínica'}
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => linkPatientToLead(item)}
                            className="h-8 px-2.5 rounded-lg bg-teal-50 hover:bg-[#147A80] text-[#147A80] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Selecionar
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditPatientForm(item)}
                            title="Editar paciente"
                            aria-label={`Editar ${item.name}`}
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteId === item.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isDeletingId === item.id}
                                onClick={() => handleConfirmDeletePatient(item.id)}
                                className="h-8 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                {isDeletingId === item.id ? '...' : 'Excluir'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="Excluir paciente da base"
                              aria-label={`Excluir ${item.name}`}
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isSearchingPatients && hasSearched && searchResults.length === 0 && (
                  <div className="bg-white border border-dashed border-slate-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                      Nenhum paciente encontrado na base para{' '}
                      <strong className="text-slate-900">&ldquo;{searchQuery.trim()}&rdquo;</strong>.
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreatePatientForm(searchQuery)}
                      className="h-9 px-3.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Incluir na Base de Pacientes</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Inline Patient Create / Edit Form */}
            {crudMode !== 'none' && (
              <div className="bg-white border border-teal-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    {crudMode === 'create'
                      ? 'Incluir Novo Paciente na Base'
                      : 'Editar Cadastro do Paciente'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setCrudMode('none');
                      setCrudError(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                {crudError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{crudError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      value={crudName}
                      onChange={(e) => setCrudName(e.target.value)}
                      placeholder="Nome completo do paciente"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      WhatsApp / Celular
                    </label>
                    <input
                      type="tel"
                      value={crudPhone}
                      onChange={(e) => setCrudPhone(formatPhoneMask(e.target.value))}
                      placeholder="(63) 99999-9999"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={crudCpf}
                      onChange={(e) => setCrudCpf(formatCpfMask(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={crudEmail}
                      onChange={(e) => setCrudEmail(e.target.value)}
                      placeholder="paciente@email.com"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Convênio / Plano
                    </label>
                    <input
                      type="text"
                      value={crudInsurance}
                      onChange={(e) => setCrudInsurance(e.target.value)}
                      placeholder="Particular"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Unidade principal
                    </label>
                    <select
                      value={crudClinicId}
                      onChange={(e) => setCrudClinicId(Number(e.target.value))}
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
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
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Observações do cadastro
                    </label>
                    <input
                      type="text"
                      value={crudNotes}
                      onChange={(e) => setCrudNotes(e.target.value)}
                      placeholder="Alergias, preferências..."
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCrudMode('none')}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isSavingCrud}
                    onClick={handleSavePatientCrud}
                    className="h-8 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSavingCrud ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {crudMode === 'create'
                            ? 'Salvar Paciente e Vincular'
                            : 'Atualizar Cadastro'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Lead Identification Fields (auto-filled when patient linked, editable for quick leads) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome / Identificação do Lead *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria (Instagram) ou selecione acima"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp / Contato
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 63999887766 ou @instagram"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[#147A80] focus:bg-white font-mono tabular-nums"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Free Text Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              O que o paciente precisa / Anotação livre
            </label>
            <textarea
              rows={2}
              placeholder="Escreva livremente: Ex. Perguntou sobre implante, quer passar em Palmas na sexta à tarde..."
              value={treatmentDescription}
              onChange={(e) => setTreatmentDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
            />
          </div>

          {/* Pipeline & Unit & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Funil
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
                className="w-full h-10 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade</label>
              <select
                value={clinicId}
                onChange={(e) => setClinicId(Number(e.target.value))}
                className="w-full h-10 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Canal de origem
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_CHIPS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSource(ch)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    source === ch
                      ? 'bg-[#147A80] text-white border-[#147A80]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Rótulos (sempre visível + criação rápida) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#147A80]" />
              <span>Rótulos</span>
              <span className="text-[11px] font-normal text-slate-400">
                (selecione ou crie um novo)
              </span>
            </label>

            <div className="flex flex-wrap gap-1.5">
              {labels.map((lbl) => {
                const selected = selectedLabels.includes(lbl.id);
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleLabel(lbl.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#147A80] text-white border-[#147A80]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {selected ? `✓ ${lbl.name}` : lbl.name}
                  </button>
                );
              })}
              {labels.length === 0 && (
                <span className="text-xs text-slate-400">Nenhum rótulo cadastrado ainda.</span>
              )}
            </div>

            {onCreateLabel && (
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/70">
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickCreateLabel();
                    }
                  }}
                  placeholder="Criar novo rótulo (ex: Urgência, VIP)..."
                  className="flex-1 h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                />
                <select
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value as CRMLabel['color'])}
                  className="h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs text-slate-700"
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
                  onClick={handleQuickCreateLabel}
                  disabled={!newLabelName.trim()}
                  className="h-8 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  + Criar
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Free Custom Fields */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Campos extras (opcional)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CUSTOM_PRESETS.filter(
                  (p) => !customFields.some((c) => c.label === p)
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addCustomField(preset)}
                    className="text-[11px] font-semibold text-[#147A80] hover:underline cursor-pointer"
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
                      prev.map((item) =>
                        item.id === cf.id ? { ...item, label: e.target.value } : item
                      )
                    )
                  }
                  className="w-1/3 h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-semibold"
                />
                <input
                  type="text"
                  value={cf.value}
                  onChange={(e) =>
                    setCustomFields((prev) =>
                      prev.map((item) =>
                        item.id === cf.id ? { ...item, value: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Preencha..."
                  className="flex-1 h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCustomFields((prev) => prev.filter((item) => item.id !== cf.id))
                  }
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
                className="w-1/3 h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs"
              />
              <input
                type="text"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder="Informação..."
                className="flex-1 h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs"
              />
              <button
                type="button"
                onClick={() => addCustomField()}
                className="h-9 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold cursor-pointer"
              >
                Adicionar
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
              ? 'Ocultar detalhes adicionais (dentista, valor, follow-up)'
              : '+ Mais detalhes (dentista, valor R$, data de follow-up)'}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo / Categoria
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CRMType)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5"
                  >
                    <option value="whatsapp_lead">Lead WhatsApp</option>
                    <option value="treatment_pending">Orçamento Pendente</option>
                    <option value="birthday">Aniversariante</option>
                    <option value="indication">Indicação</option>
                    <option value="recall_6m">Recall 6+ Meses</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Profissional
                  </label>
                  <select
                    value={dentistName}
                    onChange={(e) => setDentistName(e.target.value)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CRMPriority)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5"
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Valor est. (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bônus Clube (Pts)
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={pointsBonus}
                    onChange={(e) => setPointsBonus(e.target.value)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Follow-up
                  </label>
                  <input
                    type="date"
                    value={nextContactDate}
                    onChange={(e) => setNextContactDate(e.target.value)}
                    className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono rounded-xl px-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nota inicial da recepção
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
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar no Funil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
