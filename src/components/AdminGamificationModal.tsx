import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Gift,
  Settings,
  Users,
  Ticket,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Award,
  Crown,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  UploadCloud,
  ImageIcon,
  FileCheck,
  Bell,
  Send,
  Smartphone,
  PartyPopper,
  Check,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import type { RewardCatalogItem, GamificationRule, GamificationTier } from '../types/database';

interface PatientGamificationSummary {
  phone: string;
  patientName: string;
  totalPoints: number;
  tier: 'bronze' | 'prata' | 'ouro' | 'diamante';
  historyCount: number;
  lastActivity: string;
  history: Array<{
    id: string;
    points: number;
    description: string;
    created_at: string;
  }>;
}

interface VoucherAuditItem {
  id: string;
  rewardId: string;
  rewardTitle: string;
  patientPhone: string;
  patientName: string;
  pointsSpent: number;
  secretCode: string;
  status: 'pending' | 'used' | 'expired';
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  clinicId?: number;
}

interface AdminGamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName?: string;
}

export const AdminGamificationModal: React.FC<AdminGamificationModalProps> = ({
  isOpen,
  onClose,
  staffName = 'Administração Bertuol',
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'rules' | 'tiers' | 'patients' | 'vouchers' | 'notifications' | 'metrics'>('rewards');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data States
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [rules, setRules] = useState<GamificationRule[]>([]);
  const [tiers, setTiers] = useState<GamificationTier[]>([]);
  const [patients, setPatients] = useState<PatientGamificationSummary[]>([]);
  const [vouchers, setVouchers] = useState<VoucherAuditItem[]>([]);

  // Push & Notification Management States
  const [notificationsSubTab, setNotificationsSubTab] = useState<'birthdays' | 'reminders' | 'requests' | 'subscribers'>('birthdays');
  const [clinicorpBirthdays, setClinicorpBirthdays] = useState<any[]>([]);
  const [clinicorpAppointments, setClinicorpAppointments] = useState<any[]>([]);
  const [birthdayRequests, setBirthdayRequests] = useState<any[]>([]);
  const [pushSubscribers, setPushSubscribers] = useState<any[]>([]);
  const [isDispatchingAllBirthdays, setIsDispatchingAllBirthdays] = useState(false);
  const [sendingPushForPhone, setSendingPushForPhone] = useState<string | null>(null);
  const [reminderTypeFilter, setReminderTypeFilter] = useState<'1_day' | '2_hours'>('1_day');
  const [testPushPhone, setTestPushPhone] = useState('63992474826');
  const [testPushName, setTestPushName] = useState('Alice Póvoa');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForStatement, setSelectedPatientForStatement] = useState<PatientGamificationSummary | null>(null);

  // Forms / Modals
  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardCatalogItem | null>(null);
  const [rewardFormData, setRewardFormData] = useState({
    title: '',
    description: '',
    points_required: 50,
    stock_available: 10,
    voucher_validity_days: 30,
    clinic_id: '' as string | number,
    image_url: '',
    is_active: true,
  });

  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GamificationRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    title: '',
    description: '',
    points_reward: 20,
    trigger_event: 'custom_event',
    is_active: true,
  });

  const [tierFormOpen, setTierFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<GamificationTier | null>(null);
  const [tierFormData, setTierFormData] = useState({
    name: '',
    badge: '⭐',
    min_points: 100,
    color_theme: 'ouro',
    multiplier: 1.25,
    benefits_description: '',
    is_active: true,
  });

  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditFormData, setCreditFormData] = useState({
    phone: '',
    patientName: '',
    points: 20,
    description: '',
  });

  // Image Upload state (Armazenamento 100% local no servidor)
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localGallery, setLocalGallery] = useState<Array<{ filename: string; url: string }>>([]);
  const [showGallery, setShowGallery] = useState(false);

  // Load all initial data on modal open
  useEffect(() => {
    if (isOpen) {
      loadAllData();
      fetchLocalGallery();
    }
  }, [isOpen]);

  // Fechar feedback de notificação ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && feedback) {
        setFeedback(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback]);

  const fetchLocalGallery = async () => {
    try {
      const res = await fetch('/api/upload/images');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.images)) {
          setLocalGallery(data.images);
        }
      }
    } catch (e) {
      console.warn('Erro ao listar imagens locais:', e);
    }
  };

  const handleProcessFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('A imagem é muito grande. O limite máximo é de 20 MB.');
      return;
    }

    setUploadError(null);
    setIsUploadingImage(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64,
          }),
        });

        const data = await res.json();
        if (data.success && data.url) {
          setRewardFormData((prev) => ({ ...prev, image_url: data.url }));
          showNotification('Imagem salva com sucesso no servidor local!');
          fetchLocalGallery();
        } else {
          setUploadError(data.error || 'Falha ao salvar imagem no servidor.');
        }
      } catch (err: any) {
        setUploadError('Erro de conexão ao enviar a imagem.');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Erro ao ler arquivo do computador.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [resRewards, resRules, resTiers, resPatients, resVouchers] = await Promise.all([
        fetch('/api/gamification/rewards'),
        fetch('/api/gamification/rules'),
        fetch('/api/gamification/tiers'),
        fetch('/api/gamification/patients'),
        fetch('/api/reception/vouchers'),
      ]);

      if (resRewards.ok) setRewards(await resRewards.json());
      if (resRules.ok) setRules(await resRules.json());
      if (resTiers.ok) setTiers(await resTiers.json());
      if (resPatients.ok) setPatients(await resPatients.json());
      if (resVouchers.ok) setVouchers(await resVouchers.json());

      await fetchNotificationData();
    } catch (err) {
      console.error('Erro ao carregar dados do Clube:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationData = async () => {
    try {
      const [resBdays, resSubs, resReqs] = await Promise.all([
        fetch('/api/clinicorp/birthdays'),
        fetch('/api/push/subscriptions'),
        fetch('/api/patient/birthday-requests'),
      ]);

      if (resBdays.ok) {
        const data = await resBdays.json();
        if (data.success && Array.isArray(data.birthdays)) {
          setClinicorpBirthdays(data.birthdays);
        }
      }
      if (resSubs.ok) {
        const data = await resSubs.json();
        if (data.success && Array.isArray(data.subscribers)) {
          setPushSubscribers(data.subscribers);
        }
      }
      if (resReqs.ok) {
        const data = await resReqs.json();
        if (data.success && Array.isArray(data.requests)) {
          setBirthdayRequests(data.requests);
        }
      }

      // Consultas de hoje e amanhã do Clinicorp
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const [resToday, resTomorrow] = await Promise.all([
        fetch(`/api/clinicorp/appointments?from=${todayStr}&to=${todayStr}`),
        fetch(`/api/clinicorp/appointments?from=${tomorrowStr}&to=${tomorrowStr}`),
      ]);

      const combined: any[] = [];
      if (resToday.ok) {
        const data = await resToday.json();
        if (data.success && Array.isArray(data.appointments)) {
          data.appointments.forEach((a: any) =>
            combined.push({ ...a, targetType: '2_hours_before', displayDay: 'Hoje (2 Horas Antes)' })
          );
        }
      }
      if (resTomorrow.ok) {
        const data = await resTomorrow.json();
        if (data.success && Array.isArray(data.appointments)) {
          data.appointments.forEach((a: any) =>
            combined.push({ ...a, targetType: '1_day_before', displayDay: 'Amanhã (1 Dia Antes)' })
          );
        }
      }
      setClinicorpAppointments(combined);
    } catch (e) {
      console.warn('Erro ao carregar dados de notificações:', e);
    }
  };

  const handleDispatchAllBirthdays = async () => {
    setIsDispatchingAllBirthdays(true);
    try {
      const res = await fetch('/api/notifications/dispatch-all-birthdays', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchNotificationData();
      } else {
        showNotification(data.error || 'Falha ao disparar cortesias.', 'error');
      }
    } catch {
      showNotification('Erro na conexão ao disparar para aniversariantes.', 'error');
    } finally {
      setIsDispatchingAllBirthdays(false);
    }
  };

  const handleSendIndividualBirthdayPush = async (patient: any) => {
    const cleanPhone = String(patient.MobilePhone || '').replace(/\D/g, '');
    setSendingPushForPhone(cleanPhone);
    try {
      const res = await fetch('/api/push/send-birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          patientName: patient.Name,
          dataLimite: new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR'),
        }),
      });
      const data = await res.json();
      showNotification(data.message, data.success ? 'success' : 'error');
      if (data.success) {
        notificationService.dispatch({
          id: Date.now().toString(),
          title: `🎁 Cortesia de Aniversário • ${patient.Name}`,
          body: `Parabéns ${patient.Name}! Seu presente especial de Aniversário (Limpeza Dental + Câmera Sky) está liberado no app!`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          category: 'birthday',
        });
      }
    } catch {
      showNotification('Erro ao disparar cortesia de aniversário.', 'error');
    } finally {
      setSendingPushForPhone(null);
    }
  };

  const handleSendReminderPush = async (appt: any) => {
    const cleanPhone = String(appt.MobilePhone || '').replace(/\D/g, '');
    const cleanApptName = String(appt.Name || 'Paciente').replace(/\s*\([^)]*\)/g, '').trim();
    setSendingPushForPhone(cleanPhone);
    try {
      const res = await fetch('/api/push/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          patientName: cleanApptName,
          dentistName: 'Dr(a). Bertuol',
          time: appt.fromTime || 'horário marcado',
          type: appt.targetType || '1_day_before',
          clinicName: 'Bertuol Odontologia',
        }),
      });
      const data = await res.json();
      showNotification(data.message, data.success ? 'success' : 'error');
      if (data.success) {
        if (appt.targetType === '2_hours_before') {
          notificationService.dispatch({
            id: Date.now().toString(),
            title: `⏰ Lembrete: Consulta em 2 Horas • ${cleanApptName}`,
            body: `Olá ${cleanApptName}, sua consulta na Bertuol Odontologia é HOJE às ${appt.fromTime || 'horário agendado'} (em aproximadamente 2 horas). Toque para confirmar ou fazer pré-check-in.`,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            category: 'appointment_reminder',
          });
        } else {
          notificationService.dispatch({
            id: Date.now().toString(),
            title: `📅 Lembrete: Consulta Amanhã • ${cleanApptName}`,
            body: `Olá ${cleanApptName}, sua consulta na Bertuol Odontologia está marcada para AMANHÃ às ${appt.fromTime || 'horário agendado'}. Toque para confirmar sua presença.`,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            category: 'appointment_reminder',
          });
        }
      }
    } catch {
      showNotification('Erro ao disparar lembrete de consulta.', 'error');
    } finally {
      setSendingPushForPhone(null);
    }
  };

  const handleSendCustomTestPush = async () => {
    if (!testPushPhone) {
      showNotification('Informe o telefone para o teste.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/push/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPushPhone, patientName: testPushName }),
      });
      const data = await res.json();
      showNotification(data.message, data.success ? 'success' : 'error');
      if (data.success) {
        notificationService.dispatch({
          id: Date.now().toString(),
          title: `🔔 Teste de Notificação Push • ${testPushName || 'Paciente'}`,
          body: `Este é um teste interativo de notificação push da Bertuol Odontologia para ${testPushPhone}.`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          category: 'test',
        });
      }
    } catch {
      showNotification('Erro ao disparar push de teste.', 'error');
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message: msg, type });
    // 100% Fixado na tela: o usuário decide quando fechar pelo botão Sair (Esc) ou tecla ESC
  };

  // ==========================================
  // CRUD RECOMPENSAS / BRINDES (RF06)
  // ==========================================
  const handleOpenRewardForm = (reward?: RewardCatalogItem) => {
    if (reward) {
      setEditingReward(reward);
      setRewardFormData({
        title: reward.title,
        description: reward.description || '',
        points_required: reward.points_required,
        stock_available: reward.stock_available,
        voucher_validity_days: reward.voucher_validity_days || 30,
        clinic_id: reward.clinic_id || '',
        image_url: reward.image_url || '',
        is_active: reward.is_active,
      });
    } else {
      setEditingReward(null);
      setRewardFormData({
        title: '',
        description: '',
        points_required: 50,
        stock_available: 15,
        voucher_validity_days: 30,
        clinic_id: '',
        image_url: '',
        is_active: true,
      });
    }
    setUploadError(null);
    setIsUploadingImage(false);
    setShowGallery(false);
    fetchLocalGallery();
    setRewardFormOpen(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardFormData.title || !rewardFormData.points_required) {
      showNotification('Preencha o título e pontos necessários.', 'error');
      return;
    }

    try {
      const payload = {
        ...rewardFormData,
        clinic_id: rewardFormData.clinic_id ? Number(rewardFormData.clinic_id) : null,
      };

      if (editingReward) {
        // PUT
        const res = await fetch(`/api/gamification/rewards/${editingReward.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setRewards((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          showNotification(`Prêmio "${updated.title}" atualizado com sucesso!`);
          setRewardFormOpen(false);
        }
      } else {
        // POST
        const res = await fetch('/api/gamification/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setRewards((prev) => [created, ...prev]);
          showNotification(`Novo prêmio "${created.title}" cadastrado com sucesso!`);
          setRewardFormOpen(false);
        }
      }
    } catch (err: any) {
      showNotification('Erro ao salvar prêmio: ' + err.message, 'error');
    }
  };

  const handleDeleteReward = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o prêmio "${title}"?`)) return;
    try {
      const res = await fetch(`/api/gamification/rewards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRewards((prev) => prev.filter((r) => r.id !== id));
        showNotification(`Prêmio "${title}" removido com sucesso.`);
      }
    } catch (err: any) {
      showNotification('Erro ao excluir prêmio: ' + err.message, 'error');
    }
  };

  const handleToggleRewardActive = async (reward: RewardCatalogItem) => {
    try {
      const nextActive = !reward.is_active;
      const res = await fetch(`/api/gamification/rewards/${reward.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRewards((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        showNotification(`Prêmio ${nextActive ? 'ativado' : 'desativado'}.`);
      }
    } catch (err: any) {
      showNotification('Erro ao alterar status: ' + err.message, 'error');
    }
  };

  // ==========================================
  // CRUD REGRAS DE PONTUAÇÃO (RF05)
  // ==========================================
  const handleOpenRuleForm = (rule?: GamificationRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleFormData({
        title: rule.title,
        description: rule.description || '',
        points_reward: rule.points_reward,
        trigger_event: rule.trigger_event,
        is_active: rule.is_active,
      });
    } else {
      setEditingRule(null);
      setRuleFormData({
        title: '',
        description: '',
        points_reward: 20,
        trigger_event: 'custom_event',
        is_active: true,
      });
    }
    setRuleFormOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleFormData.title || !ruleFormData.points_reward) {
      showNotification('Preencha o título e pontos da regra.', 'error');
      return;
    }

    try {
      if (editingRule) {
        const res = await fetch(`/api/gamification/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleFormData),
        });
        if (res.ok) {
          const updated = await res.json();
          setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          showNotification(`Regra "${updated.title}" atualizada.`);
          setRuleFormOpen(false);
        }
      } else {
        const res = await fetch('/api/gamification/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleFormData),
        });
        if (res.ok) {
          const created = await res.json();
          setRules((prev) => [created, ...prev]);
          showNotification(`Nova regra "${created.title}" criada.`);
          setRuleFormOpen(false);
        }
      }
    } catch (err: any) {
      showNotification('Erro ao salvar regra: ' + err.message, 'error');
    }
  };

  const handleDeleteRule = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente remover a regra "${title}"?`)) return;
    try {
      const res = await fetch(`/api/gamification/rules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        showNotification(`Regra "${title}" removida.`);
      }
    } catch (err: any) {
      showNotification('Erro ao excluir regra: ' + err.message, 'error');
    }
  };

  // ==========================================
  // CRUD CATEGORIAS / NÍVEIS DE FIDELIDADE (TIERS)
  // ==========================================
  const handleOpenTierForm = (tier?: GamificationTier) => {
    if (tier) {
      setEditingTier(tier);
      setTierFormData({
        name: tier.name,
        badge: tier.badge,
        min_points: tier.min_points,
        color_theme: tier.color_theme,
        multiplier: tier.multiplier || 1.0,
        benefits_description: tier.benefits_description || '',
        is_active: tier.is_active,
      });
    } else {
      setEditingTier(null);
      setTierFormData({
        name: '',
        badge: '👑',
        min_points: 250,
        color_theme: 'ouro',
        multiplier: 1.25,
        benefits_description: 'Benefícios VIP, atendimento prioritário e brindes exclusivos.',
        is_active: true,
      });
    }
    setTierFormOpen(true);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierFormData.name || tierFormData.min_points === undefined) {
      showNotification('Preencha o nome e a pontuação mínima da categoria.', 'error');
      return;
    }

    try {
      if (editingTier) {
        const res = await fetch(`/api/gamification/tiers/${editingTier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tierFormData),
        });
        if (res.ok) {
          const updated = await res.json();
          setTiers((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t)).sort((a, b) => a.min_points - b.min_points)
          );
          showNotification(`Categoria "${updated.name}" atualizada com sucesso!`);
          setTierFormOpen(false);
          loadAllData();
        }
      } else {
        const res = await fetch('/api/gamification/tiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tierFormData),
        });
        if (res.ok) {
          const created = await res.json();
          setTiers((prev) => [...prev, created].sort((a, b) => a.min_points - b.min_points));
          showNotification(`Nova categoria "${created.name}" cadastrada!`);
          setTierFormOpen(false);
          loadAllData();
        }
      }
    } catch (err: any) {
      showNotification('Erro ao salvar categoria: ' + err.message, 'error');
    }
  };

  const handleDeleteTier = async (id: string, name: string) => {
    if (tiers.length <= 1) {
      showNotification('O sistema deve manter pelo menos uma categoria ativa.', 'error');
      return;
    }
    if (!confirm(`Deseja realmente excluir a categoria "${name}"?`)) return;
    try {
      const res = await fetch(`/api/gamification/tiers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTiers((prev) => prev.filter((t) => t.id !== id));
        showNotification(`Categoria "${name}" removida.`);
        loadAllData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao remover categoria', 'error');
      }
    } catch (err: any) {
      showNotification('Erro ao excluir categoria: ' + err.message, 'error');
    }
  };

  const handleToggleTierActive = async (tier: GamificationTier) => {
    try {
      const nextActive = !tier.is_active;
      const res = await fetch(`/api/gamification/tiers/${tier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTiers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        showNotification(`Categoria ${nextActive ? 'ativada' : 'pausada'}.`);
        loadAllData();
      }
    } catch (err: any) {
      showNotification('Erro ao alterar status: ' + err.message, 'error');
    }
  };

  // ==========================================
  // LANÇAMENTO MANUAL DE PONTOS (RF07)
  // ==========================================
  const handleOpenCreditModal = (patient?: PatientGamificationSummary) => {
    if (patient) {
      setCreditFormData({
        phone: patient.phone,
        patientName: patient.patientName,
        points: 20,
        description: 'Bônus por pontualidade e engajamento clínico',
      });
    } else {
      setCreditFormData({
        phone: '',
        patientName: '',
        points: 20,
        description: 'Bônus de fidelidade ou indicação de amigo',
      });
    }
    setCreditModalOpen(true);
  };

  const handleSaveCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditFormData.phone || creditFormData.points === undefined) {
      showNotification('Informe o telefone e a pontuação.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/gamification/patients/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...creditFormData,
          staffName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(data.message || 'Pontuação creditada com sucesso!');
        setCreditModalOpen(false);
        loadAllData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao creditar pontos', 'error');
      }
    } catch (err: any) {
      showNotification('Erro ao lançar pontos: ' + err.message, 'error');
    }
  };

  // ==========================================
  // VALIDAÇÃO / BAIXA DE VOUCHERS
  // ==========================================
  const handleRedeemVoucher = async (code: string) => {
    try {
      const res = await fetch('/api/reception/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretCode: code,
          staffName,
          clinicId: 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(data.message);
        loadAllData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao dar baixa no voucher', 'error');
      }
    } catch (err: any) {
      showNotification('Erro ao resgatar voucher: ' + err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col h-[94vh] max-h-[850px] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-amber-600 via-amber-500 to-[#147A80] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Painel de Controle do Admin • Clube de Vantagens
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                  RF05 / RF06 / RF07
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                Gestão completa de Prêmios, Regras de Pontos, Saldos de Pacientes e Auditoria de Vouchers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner com Sair / ESC */}
        {feedback && (
          <div
            className={`px-4 py-3 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm ${
              feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{feedback.message}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-white/80 hidden sm:inline">
                Pressione ESC ou clique em Sair para fechar
              </span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-black text-[11px] transition-all flex items-center gap-1 cursor-pointer border border-white/20 active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>Sair (Esc)</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold">
          <div className="flex items-center gap-1 py-2">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'rewards'
                  ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Catálogo de Prêmios ({rewards.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Regras de Pontos ({rules.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tiers'
                  ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Categorias & Níveis ({tiers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'patients'
                  ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Saldos de Pacientes ({patients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('vouchers')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'vouchers'
                  ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Auditoria de Vouchers ({vouchers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Bell className="w-4 h-4 text-amber-900" />
              <span>🔔 Notificações & Push ({clinicorpBirthdays.length})</span>
            </button>
          </div>

          <button
            onClick={loadAllData}
            title="Atualizar dados do servidor"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAFAFA]">
          {/* ========================================================
              TAB 1: CRUD CATÁLOGO DE PRÊMIOS (RF06)
          ======================================================== */}
          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Catálogo de Recompensas e Brindes Físicos</h3>
                  <p className="text-xs text-gray-500">
                    Defina os itens resgatáveis pelos pacientes, controle de estoque e pontuação exigida.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenRewardForm()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Prêmio</span>
                </button>
              </div>

              {/* Grid de Prêmios */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`bg-white rounded-2xl p-4 border transition-all shadow-xs flex flex-col justify-between ${
                      reward.is_active ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60 bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        {reward.image_url ? (
                          <img
                            src={reward.image_url}
                            alt={reward.title}
                            className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                            <Gift className="w-8 h-8" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#147A80] bg-teal-50 px-2 py-0.5 rounded-md">
                              {reward.clinic_id ? (reward.clinic_id === 2 ? 'Paraíso' : 'Palmas') : 'Todas as Unidades'}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                reward.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {reward.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 mt-1 truncate">{reward.title}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{reward.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-center text-[11px]">
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold block">Pontos</span>
                          <span className="font-black text-amber-600">{reward.points_required} pts</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold block">Estoque</span>
                          <span className={`font-black ${reward.stock_available < 3 ? 'text-rose-600' : 'text-gray-800'}`}>
                            {reward.stock_available} un.
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold block">Validade</span>
                          <span className="font-bold text-gray-700">{reward.voucher_validity_days || 30} dias</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleRewardActive(reward)}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {reward.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenRewardForm(reward)}
                          title="Editar prêmio"
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReward(reward.id, reward.title)}
                          title="Excluir prêmio"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: CRUD REGRAS DE PONTUAÇÃO (RF05)
          ======================================================== */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Regras de Bonificação e Gamificação</h3>
                  <p className="text-xs text-gray-500">
                    Defina quantos pontos o paciente ganha por pontualidade no totem, confirmação ou engajamento.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenRuleForm()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Regra de Pontuação</span>
                </button>
              </div>

              {/* Lista de Regras */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="divide-y divide-gray-100">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 font-black text-amber-800 text-sm">
                          +{rule.points_reward}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-gray-900">{rule.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono">
                              {rule.trigger_event}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                rule.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {rule.is_active ? 'Ativa' : 'Pausada'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenRuleForm(rule)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.title)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: CRUD CATEGORIAS / NÍVEIS DE FIDELIDADE (TIERS)
          ======================================================== */}
          {activeTab === 'tiers' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Categorias & Níveis de Fidelidade do Paciente (Tiers)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Defina a régua de pontuação para o paciente evoluir (Bronze, Prata, Ouro, Diamante...), multiplicadores de bônus e benefícios.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenTierForm()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Categoria / Nível</span>
                </button>
              </div>

              {/* Grid de Categorias */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {tiers.map((tierItem) => (
                  <div
                    key={tierItem.id}
                    className={`bg-white rounded-3xl p-5 border flex flex-col justify-between shadow-xs transition-all ${
                      tierItem.is_active ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60 bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl p-2 rounded-2xl bg-amber-50 border border-amber-100 shrink-0">
                          {tierItem.badge}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              tierItem.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {tierItem.is_active ? 'Ativa' : 'Pausada'}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {tierItem.multiplier}x Bônus
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-sm font-black text-gray-900">{tierItem.name}</h4>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xs font-bold text-gray-500">A partir de</span>
                          <span className="text-base font-black text-[#147A80]">{tierItem.min_points}</span>
                          <span className="text-xs font-bold text-gray-500">pontos</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100 min-h-[4rem]">
                          {tierItem.benefits_description || 'Sem descrição de benefícios cadastrada.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleTierActive(tierItem)}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {tierItem.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenTierForm(tierItem)}
                          title="Editar categoria"
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tierItem.id, tierItem.name)}
                          title="Excluir categoria"
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: GESTÃO DE PACIENTES & SALDOS (RF07)
          ======================================================== */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Carteira de Fidelidade dos Pacientes</h3>
                  <p className="text-xs text-gray-500">
                    Consulte saldos, visualize extratos completos e realize créditos ou estornos manuais de pontos.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCreditModal()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lançar / Ajustar Pontos Manualmente</span>
                </button>
              </div>

              {/* Campo de Busca */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente por nome ou telefone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Tabela de Pacientes */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-black">
                      <tr>
                        <th className="p-3.5">Paciente</th>
                        <th className="p-3.5">Telefone</th>
                        <th className="p-3.5">Nível</th>
                        <th className="p-3.5">Saldo de Pontos</th>
                        <th className="p-3.5">Movimentações</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patients
                        .filter(
                          (p) =>
                            p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.phone.includes(searchTerm)
                        )
                        .map((pat) => (
                          <tr key={pat.phone} className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3.5 font-bold text-gray-900">{pat.patientName}</td>
                            <td className="p-3.5 text-gray-600 font-mono text-[11px]">{pat.phone}</td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                                {pat.tier}
                              </span>
                            </td>
                            <td className="p-3.5 font-black text-[#147A80] text-sm">{pat.totalPoints} pts</td>
                            <td className="p-3.5 text-gray-500 text-[11px]">{pat.historyCount} lançamentos</td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedPatientForStatement(pat)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#147A80] font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Extrato
                                </button>
                                <button
                                  onClick={() => handleOpenCreditModal(pat)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Ajustar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal / Gaveta de Extrato do Paciente Selecionado */}
              {selectedPatientForStatement && (
                <div className="p-4 rounded-3xl bg-white border-2 border-teal-500 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#147A80]" />
                      <h4 className="text-xs font-black text-gray-900">
                        Extrato do Paciente: {selectedPatientForStatement.patientName} ({selectedPatientForStatement.phone})
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedPatientForStatement(null)}
                      className="text-xs text-gray-400 hover:text-gray-700 font-bold cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 text-xs">
                    {selectedPatientForStatement.history.map((h) => (
                      <div key={h.id} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800">{h.description}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(h.created_at).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span
                          className={`font-black text-xs ${
                            h.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {h.points > 0 ? `+${h.points}` : h.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 4: AUDITORIA DE VOUCHERS RESGATADOS (RF07)
          ======================================================== */}
          {activeTab === 'vouchers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Auditoria & Validação de Vouchers de Brindes</h3>
                  <p className="text-xs text-gray-500">
                    Acompanhe todos os códigos emitidos pelos pacientes e confirme a entrega presencial.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-black">
                      <tr>
                        <th className="p-3.5">Código Voucher</th>
                        <th className="p-3.5">Prêmio</th>
                        <th className="p-3.5">Paciente</th>
                        <th className="p-3.5">Pontos Gastos</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Data Resgate</th>
                        <th className="p-3.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {vouchers.map((vch) => {
                        const isPending = vch.status === 'pending';
                        return (
                          <tr key={vch.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3.5">
                              <span className="font-mono font-black text-xs bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 rounded-lg">
                                {vch.secretCode}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-gray-900">{vch.rewardTitle}</td>
                            <td className="p-3.5">
                              <div className="font-bold text-gray-800">{vch.patientName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{vch.patientPhone}</div>
                            </td>
                            <td className="p-3.5 font-black text-rose-600">-{vch.pointsSpent} pts</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isPending ? 'Pendente' : 'Entregue'}
                              </span>
                            </td>
                            <td className="p-3.5 text-gray-500 text-[11px]">
                              {new Date(vch.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-3.5 text-right">
                              {isPending ? (
                                <button
                                  onClick={() => handleRedeemVoucher(vch.secretCode)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs transition-all cursor-pointer"
                                >
                                  Dar Baixa
                                </button>
                              ) : (
                                <span className="text-[11px] text-gray-400 font-bold">✓ Entregue</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: NOTIFICAÇÕES & WEB PUSH (ANIVERSARIANTES & AVISOS DE CONSULTA)
          ======================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header and Sub-tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600" />
                    Central de Notificações, Aniversariantes & Lembretes Push
                  </h3>
                  <p className="text-xs text-gray-500">
                    Dispare cortesias de aniversário (sem dependência de WhatsApp) e envie lembretes automáticos de consulta (1 dia e 2h antes).
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold shrink-0">
                  <button
                    onClick={() => setNotificationsSubTab('birthdays')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      notificationsSubTab === 'birthdays'
                        ? 'bg-white text-gray-900 shadow-xs font-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    🎂 Aniversariantes ({clinicorpBirthdays.length})
                  </button>
                  <button
                    onClick={() => setNotificationsSubTab('reminders')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      notificationsSubTab === 'reminders'
                        ? 'bg-white text-gray-900 shadow-xs font-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    📅 Lembretes ({clinicorpAppointments.length})
                  </button>
                  <button
                    onClick={() => setNotificationsSubTab('requests')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      notificationsSubTab === 'requests'
                        ? 'bg-white text-gray-900 shadow-xs font-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    🎁 Agendamentos ({birthdayRequests.length})
                  </button>
                  <button
                    onClick={() => setNotificationsSubTab('subscribers')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      notificationsSubTab === 'subscribers'
                        ? 'bg-white text-gray-900 shadow-xs font-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    📱 Celulares ({pushSubscribers.length})
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: ANIVERSARIANTES CLINICORP AO VIVO */}
              {notificationsSubTab === 'birthdays' && (
                <div className="space-y-4">
                  {/* Template Message Card */}
                  <div className="p-4 rounded-3xl bg-linear-to-r from-amber-500 via-amber-600 to-teal-800 text-white shadow-md border border-amber-300/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="w-5 h-5 text-amber-200" />
                        <div>
                          <h4 className="text-sm font-black">Modelo Oficial de Mensagem de Aniversário</h4>
                          <p className="text-[11px] text-amber-100">
                            Entregue como Notificação Push nativa no celular e Card Exclusivo no App (0 Pontos)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDispatchAllBirthdays}
                        disabled={isDispatchingAllBirthdays || clinicorpBirthdays.length === 0}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-[#147A80] font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <Send className="w-4 h-4 text-[#147A80]" />
                        <span>{isDispatchingAllBirthdays ? 'Disparando...' : `🚀 Disparar para Todos (${clinicorpBirthdays.length})`}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/25 border border-white/20 text-xs font-mono leading-relaxed text-amber-50">
                      Olá, <strong>*Nome*</strong>. Feliz aniversário! 🚀<br />
                      Queremos que seu sorriso acompanhe suas conquistas. Por isso, você recebeu uma <strong>*Cortesia de Aniversário*</strong>: Profilaxia e Diagnóstico por Imagem (Sky Câmera) por nossa conta.<br />
                      Válido até <strong>*30 dias*</strong>. Agende seu presente direto no App do Paciente!
                    </div>
                  </div>

                  {/* Birthdays Table from Clinicorp */}
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-700 flex items-center gap-2">
                        <span>Aniversariantes de Hoje do Clinicorp</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[#147A80] text-[10px] font-black">
                          API Ao Vivo: {clinicorpBirthdays.length} pacientes
                        </span>
                      </span>
                      <button
                        onClick={fetchNotificationData}
                        className="text-[11px] font-bold text-[#147A80] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Atualizar
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/60 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-black">
                          <tr>
                            <th className="p-3.5">Paciente</th>
                            <th className="p-3.5">Telefone</th>
                            <th className="p-3.5">Idade</th>
                            <th className="p-3.5">Data Nasc.</th>
                            <th className="p-3.5 text-right">Disparo Push / In-App</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {clinicorpBirthdays.map((b: any, idx: number) => {
                            const cleanPhone = String(b.MobilePhone || '').replace(/\D/g, '');
                            const isSending = sendingPushForPhone === cleanPhone;
                            return (
                              <tr key={b.PatientId || idx} className="hover:bg-gray-50/80 transition-colors">
                                <td className="p-3.5 font-bold text-gray-900 flex items-center gap-2">
                                  <span>🎂</span>
                                  <span>{b.Name}</span>
                                </td>
                                <td className="p-3.5 font-mono text-gray-600">{b.MobilePhone || 'Sem telefone'}</td>
                                <td className="p-3.5 font-bold text-amber-700">{b.Age ? `${b.Age} anos` : '-'}</td>
                                <td className="p-3.5 text-gray-500">
                                  {b.BirthDate ? new Date(b.BirthDate).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => handleSendIndividualBirthdayPush(b)}
                                    disabled={isSending}
                                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-[11px] shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                  >
                                    {isSending ? 'Enviando...' : 'Enviar Cortesia'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: LEMBRETES DE CONSULTAS (1 DIA ANTES & 2 HORAS ANTES) */}
              {notificationsSubTab === 'reminders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReminderTypeFilter('1_day')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          reminderTypeFilter === '1_day'
                            ? 'bg-[#147A80] text-white shadow-xs font-black'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        📅 Consultas de Amanhã (Lembrete 1 Dia Antes)
                      </button>
                      <button
                        onClick={() => setReminderTypeFilter('2_hours')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          reminderTypeFilter === '2_hours'
                            ? 'bg-[#147A80] text-white shadow-xs font-black'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        ⏰ Consultas de Hoje (Lembrete 2 Horas Antes)
                      </button>
                    </div>

                    <span className="text-xs text-gray-500 font-medium">
                      Total: {clinicorpAppointments.filter((a) => reminderTypeFilter === '1_day' ? a.targetType === '1_day_before' : a.targetType === '2_hours_before').length} agendamentos
                    </span>
                  </div>

                  {/* Appointments Table */}
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-black">
                          <tr>
                            <th className="p-3.5">Horário</th>
                            <th className="p-3.5">Paciente</th>
                            <th className="p-3.5">Telefone</th>
                            <th className="p-3.5">Procedimento / Notas</th>
                            <th className="p-3.5 text-right">Lembrete Push</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {clinicorpAppointments
                            .filter((a) =>
                              reminderTypeFilter === '1_day'
                                ? a.targetType === '1_day_before'
                                : a.targetType === '2_hours_before'
                            )
                            .map((appt: any, idx: number) => {
                              const cleanPhone = String(appt.MobilePhone || '').replace(/\D/g, '');
                              const isSending = sendingPushForPhone === cleanPhone;
                              return (
                                <tr key={appt.id || idx} className="hover:bg-gray-50/80 transition-colors">
                                  <td className="p-3.5 font-black text-gray-900">
                                    <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-[#147A80] font-mono">
                                      {appt.fromTime || '14:00'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-bold text-gray-900">
                                    {appt.Name || appt.patientName || 'Paciente Agendado'}
                                  </td>
                                  <td className="p-3.5 font-mono text-gray-600">{appt.MobilePhone || 'Sem celular'}</td>
                                  <td className="p-3.5 text-gray-600 truncate max-w-xs">
                                    {appt.Notes || 'Atendimento Clínico Geral'}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      onClick={() => handleSendReminderPush(appt)}
                                      disabled={isSending}
                                      className="px-3 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                    >
                                      {isSending ? 'Enviando...' : `Disparar Lembrete (${reminderTypeFilter === '1_day' ? '1d' : '2h'})`}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: SOLICITAÇÕES DE AGENDAMENTO FEITAS PELO APP */}
              {notificationsSubTab === 'requests' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 text-[#147A80] text-xs">
                    <p className="font-bold">Agendamentos Solicitados no App do Paciente (Sem WhatsApp):</p>
                    <p className="text-[11px] text-teal-800 mt-0.5">
                      Quando o paciente recebe o voucher de aniversário, ele solicita data e período diretamente pelo aplicativo. A recepção valida e agenda no Clinicorp.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                    {birthdayRequests.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 space-y-2">
                        <Gift className="w-8 h-8 mx-auto text-gray-300" />
                        <p className="text-xs font-bold text-gray-600">Nenhuma solicitação de cortesia pendente</p>
                        <p className="text-[11px] text-gray-400">
                          Quando um aniversariante solicitar o agendamento pelo app, aparecerá listado aqui.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-black">
                          <tr>
                            <th className="p-3.5">Paciente</th>
                            <th className="p-3.5">Data Preferencial</th>
                            <th className="p-3.5">Turno</th>
                            <th className="p-3.5">Unidade</th>
                            <th className="p-3.5">Observações</th>
                            <th className="p-3.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {birthdayRequests.map((req: any) => (
                            <tr key={req.id} className="hover:bg-gray-50/80">
                              <td className="p-3.5 font-bold text-gray-900">
                                <div>{req.patientName}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{req.phone}</div>
                              </td>
                              <td className="p-3.5 font-black text-[#147A80]">{req.preferredDate}</td>
                              <td className="p-3.5 text-gray-700">{req.preferredPeriod}</td>
                              <td className="p-3.5 text-gray-600">{req.unit}</td>
                              <td className="p-3.5 text-gray-500 italic truncate max-w-xs">{req.notes || '-'}</td>
                              <td className="p-3.5 text-right">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                                  ✓ Solicitado
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: CELULARES CONECTADOS (WEB PUSH) */}
              {notificationsSubTab === 'subscribers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-slate-900 text-white space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <Smartphone className="w-4 h-4" />
                        <span>Aparelhos Ativos com Web Push</span>
                      </div>
                      <div className="text-3xl font-black">{pushSubscribers.length}</div>
                      <p className="text-[11px] text-gray-300">
                        Dispositivos móveis que autorizaram notificações push e recebem avisos na tela de bloqueio.
                      </p>
                    </div>

                    <div className="p-4 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-2.5">
                      <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#147A80]" />
                        Teste Direto de Push em Aparelho
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Telefone"
                          value={testPushPhone}
                          onChange={(e) => setTestPushPhone(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Nome do Paciente"
                          value={testPushName}
                          onChange={(e) => setTestPushName(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs"
                        />
                      </div>
                      <button
                        onClick={handleSendCustomTestPush}
                        className="w-full py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        Disparar Push de Teste Agora
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Form: Criar / Editar Prêmio */}
        {rewardFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="text-sm font-black text-gray-900">
                  {editingReward ? 'Editar Prêmio' : 'Cadastrar Novo Prêmio'}
                </h4>
                <button onClick={() => setRewardFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveReward} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Título do Prêmio *</label>
                  <input
                    type="text"
                    required
                    value={rewardFormData.title}
                    onChange={(e) => setRewardFormData({ ...rewardFormData, title: e.target.value })}
                    placeholder="Ex: Kit Higiene Dental Premium"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Descrição Detalhada</label>
                  <textarea
                    rows={2}
                    value={rewardFormData.description}
                    onChange={(e) => setRewardFormData({ ...rewardFormData, description: e.target.value })}
                    placeholder="Ex: Contém escova de cerdas macias, fio dental e necessaire Bertuol."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Pontos Exigidos *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={rewardFormData.points_required}
                      onChange={(e) => setRewardFormData({ ...rewardFormData, points_required: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Estoque Físico *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={rewardFormData.stock_available}
                      onChange={(e) => setRewardFormData({ ...rewardFormData, stock_available: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Validade do Voucher (dias)</label>
                    <input
                      type="number"
                      min={1}
                      value={rewardFormData.voucher_validity_days}
                      onChange={(e) => setRewardFormData({ ...rewardFormData, voucher_validity_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Unidade Vinculada</label>
                    <select
                      value={rewardFormData.clinic_id}
                      onChange={(e) => setRewardFormData({ ...rewardFormData, clinic_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">Todas as Unidades</option>
                      <option value="1">Unidade Matriz Palmas</option>
                      <option value="2">Unidade Paraíso</option>
                    </select>
                  </div>
                </div>

                {/* Upload Local de Imagem (Armazenamento 100% Interno no Servidor) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Foto do Prêmio (Armazenamento Local)
                    </label>
                    {localGallery.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowGallery(!showGallery)}
                        className="text-[10px] font-bold text-[#147A80] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>{showGallery ? 'Ocultar Galeria' : `Galeria Salva (${localGallery.length})`}</span>
                      </button>
                    )}
                  </div>

                  {/* Hidden native file input */}
                  <input
                    type="file"
                    ref={imageFileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessFile(file);
                      if (e.target) e.target.value = '';
                    }}
                    className="hidden"
                  />

                  {/* Preview ou Dropzone */}
                  {rewardFormData.image_url ? (
                    <div className="p-3 rounded-2xl bg-amber-50/60 border-2 border-amber-200 flex items-center gap-3">
                      <img
                        src={rewardFormData.image_url}
                        alt="Preview do Prêmio"
                        className="w-16 h-16 rounded-xl object-cover border border-amber-300 shadow-2xs shrink-0 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase">
                          <FileCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span className={rewardFormData.image_url.includes('supabase.co') ? 'text-indigo-700' : 'text-emerald-700'}>
                            {rewardFormData.image_url.includes('supabase.co')
                              ? '☁️ Supabase Storage (Bucket rewards)'
                              : '💾 Armazenamento Local Bertuol'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-600 truncate mt-0.5">
                          {rewardFormData.image_url}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => imageFileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
                          >
                            Trocar Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => setRewardFormData((prev) => ({ ...prev, image_url: '' }))}
                            className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] transition-all cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploadingImage && imageFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleProcessFile(file);
                      }}
                      className={`p-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-amber-400 bg-gray-50/70 hover:bg-amber-50/30 transition-all flex flex-col items-center justify-center text-center cursor-pointer group ${
                        isUploadingImage ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        {isUploadingImage ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>
                      <p className="text-xs font-black text-gray-800">
                        {isUploadingImage ? 'Enviando imagem ao servidor...' : '📁 Clique para escolher foto do computador ou celular'}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        PNG, JPG, WEBP até 20 MB • Salvo diretamente na pasta local do servidor
                      </p>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{uploadError}</span>
                    </p>
                  )}

                  {/* Galeria de Fotos Salvas Localmente */}
                  {showGallery && localGallery.length > 0 && (
                    <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 animate-in fade-in">
                      <p className="text-[10px] font-bold text-gray-600">
                        Clique em uma imagem da pasta local para selecioná-la:
                      </p>
                      <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                        {localGallery.map((img) => (
                          <button
                            type="button"
                            key={img.filename}
                            onClick={() => {
                              setRewardFormData((prev) => ({ ...prev, image_url: img.url }));
                              setShowGallery(false);
                            }}
                            className={`p-1 rounded-xl border transition-all text-left group hover:scale-102 ${
                              rewardFormData.image_url === img.url
                                ? 'border-[#147A80] ring-2 ring-[#147A80]/30 bg-teal-50'
                                : 'border-gray-200 bg-white hover:border-amber-400'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.filename}
                              className="w-full h-12 rounded-lg object-cover bg-gray-100"
                            />
                            <p className="text-[9px] font-mono text-gray-500 truncate mt-1">
                              {img.filename.replace(/^premio-\d+-/, '')}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input opcional caso queira colar um caminho manual */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={rewardFormData.image_url}
                      onChange={(e) => setRewardFormData({ ...rewardFormData, image_url: e.target.value })}
                      placeholder="Caminho local salvo: /uploads/rewards/premio-exemplo.png"
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-[10px] font-mono text-gray-600 bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rewardActiveCheck"
                    checked={rewardFormData.is_active}
                    onChange={(e) => setRewardFormData({ ...rewardFormData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="rewardActiveCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Item Ativo e Visível para os Pacientes
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setRewardFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black shadow-xs cursor-pointer"
                  >
                    Salvar Prêmio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Form: Criar / Editar Regra de Pontuação */}
        {ruleFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="text-sm font-black text-gray-900">
                  {editingRule ? 'Editar Regra de Pontuação' : 'Nova Regra de Pontuação'}
                </h4>
                <button onClick={() => setRuleFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Título da Regra *</label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.title}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, title: e.target.value })}
                    placeholder="Ex: Check-in Presencial no Totem"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Descrição Explicativa</label>
                  <textarea
                    rows={2}
                    value={ruleFormData.description}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                    placeholder="Ex: Pontos concedidos automaticamente ao ler o QR Code na chegada."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Pontos Concedidos (+pts) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={ruleFormData.points_reward}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, points_reward: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Gatilho do Evento</label>
                    <select
                      value={ruleFormData.trigger_event}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, trigger_event: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="qr_code_totem">Leitura Totem QR (Presencial)</option>
                      <option value="whatsapp_confirm">Confirmação WhatsApp</option>
                      <option value="google_review">Avaliação Google 5 Estrelas</option>
                      <option value="friend_referral">Indicação de Amigo</option>
                      <option value="birthday">Aniversário do Paciente</option>
                      <option value="custom_event">Evento Customizado</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="ruleActiveCheck"
                    checked={ruleFormData.is_active}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="ruleActiveCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Regra Ativa no Sistema
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setRuleFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black shadow-xs cursor-pointer"
                  >
                    Salvar Regra
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Form: Crédito / Ajuste Manual de Pontos */}
        {creditModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-black text-gray-900">Lançar / Ajustar Pontos do Paciente</h4>
                </div>
                <button onClick={() => setCreditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCredit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Telefone do Paciente (apenas dígitos) *</label>
                  <input
                    type="text"
                    required
                    value={creditFormData.phone}
                    onChange={(e) => setCreditFormData({ ...creditFormData, phone: e.target.value })}
                    placeholder="Ex: 63984123456"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Nome do Paciente</label>
                  <input
                    type="text"
                    value={creditFormData.patientName}
                    onChange={(e) => setCreditFormData({ ...creditFormData, patientName: e.target.value })}
                    placeholder="Ex: Carlos Henrique Silva"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Pontos a Lançar (Use valor positivo para crédito ou negativo para débito) *
                  </label>
                  <input
                    type="number"
                    required
                    value={creditFormData.points}
                    onChange={(e) => setCreditFormData({ ...creditFormData, points: Number(e.target.value) })}
                    placeholder="Ex: 50 ou -20"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-black text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Motivo / Justificativa do Lançamento *</label>
                  <textarea
                    rows={2}
                    required
                    value={creditFormData.description}
                    onChange={(e) => setCreditFormData({ ...creditFormData, description: e.target.value })}
                    placeholder="Ex: Bônus concedido por indicação de amigo ou cortesia da recepção."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCreditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs cursor-pointer"
                  >
                    Confirmar Lançamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Form: Criar / Editar Categoria (Tier) */}
        {tierFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-black text-gray-900">
                    {editingTier ? 'Editar Categoria de Fidelidade' : 'Cadastrar Nova Categoria (Tier)'}
                  </h4>
                </div>
                <button onClick={() => setTierFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTier} className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Nome da Categoria *</label>
                    <input
                      type="text"
                      required
                      value={tierFormData.name}
                      onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                      placeholder="Ex: Ouro, Platinum, VIP"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Emoji / Ícone</label>
                    <input
                      type="text"
                      value={tierFormData.badge}
                      onChange={(e) => setTierFormData({ ...tierFormData, badge: e.target.value })}
                      placeholder="Ex: 🥇 ou 💎"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-center text-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Pontos Mínimos *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={tierFormData.min_points}
                      onChange={(e) => setTierFormData({ ...tierFormData, min_points: Number(e.target.value) })}
                      placeholder="Ex: 180"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-[#147A80] focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Multiplicador Bônus</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1}
                      value={tierFormData.multiplier}
                      onChange={(e) => setTierFormData({ ...tierFormData, multiplier: Number(e.target.value) })}
                      placeholder="Ex: 1.25"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Descrição dos Benefícios *</label>
                  <textarea
                    rows={3}
                    required
                    value={tierFormData.benefits_description}
                    onChange={(e) => setTierFormData({ ...tierFormData, benefits_description: e.target.value })}
                    placeholder="Ex: 25% de bônus em todos os check-ins, voucher especial de aniversário e prioridade na agenda."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="tierActiveCheck"
                    checked={tierFormData.is_active}
                    onChange={(e) => setTierFormData({ ...tierFormData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="tierActiveCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Categoria Ativa no Clube
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setTierFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black shadow-xs cursor-pointer"
                  >
                    Salvar Categoria
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
