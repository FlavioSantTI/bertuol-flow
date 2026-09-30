import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Code2,
  AlertCircle,
  Copy,
  Check,
  Volume2,
  ExternalLink,
  Users,
  MessageSquare,
  Timer,
  UserCheck,
  CalendarCheck,
  Share2,
  Phone,
  Save,
  Stethoscope,
  Lock,
  Settings,
  Sliders,
  VolumeX,
} from 'lucide-react';
import { Dentist } from '../types/database';
import { notificationService, DentistAlertSettings } from '../services/notificationService';
import { dataService } from '../services/dataService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dentists?: Dentist[];
  selectedDentist: Dentist | null;
  onSelectDentist?: (dentist: Dentist) => void;
  onOpenAppointment?: (appointmentId: number) => void;
  userRole?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  dentists,
  selectedDentist,
  onSelectDentist,
  onOpenAppointment,
  userRole,
}) => {
  // Find current active dentist (Dr. Ari Bertuol, Dr. Claudio Borba, etc.)
  const activeDentist =
    selectedDentist ||
    dentists?.find((d) => d.id === 6177152107544576) ||
    dentists?.find((d) => d.Name.toLowerCase().includes('ari bertuol')) ||
    dentists?.[0] ||
    null;

  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [isInIframe, setIsInIframe] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'test' | 'simulation' | 'architecture' | 'code'>('settings');
  const [targetAudience, setTargetAudience] = useState<'patient' | 'dentist'>('dentist');
  const [selectedPatientScenario, setSelectedPatientScenario] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [lastDispatched, setLastDispatched] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);

  // Individual Dentist Preferences State
  const [dentistSettings, setDentistSettings] = useState<DentistAlertSettings>(() =>
    notificationService.getDentistSettings(activeDentist?.id || 0, activeDentist?.MobilePhone)
  );
  const [savedSettingsToast, setSavedSettingsToast] = useState(false);

  // Phone Testing State
  const [ariPhone, setAriPhone] = useState(dentistSettings.phone || '(63) 99234-9680');
  const [phoneSavedToast, setPhoneSavedToast] = useState(false);
  const [isSendingApi, setIsSendingApi] = useState(false);
  const [apiSendStatus, setApiSendStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Timing & Standards Preferences
  const [toastDuration, setToastDuration] = useState<number>(() =>
    notificationService.getBannerDisplayDuration()
  );
  const [testDelaySeconds, setTestDelaySeconds] = useState<number>(() =>
    notificationService.getPushTestDelaySeconds()
  );
  const [morningBriefingTime, setMorningBriefingTime] = useState<string>(() =>
    notificationService.getMorningBriefingTime()
  );

  // Sync settings whenever activeDentist or modal opens
  useEffect(() => {
    if (activeDentist && isOpen) {
      const current = notificationService.getDentistSettings(activeDentist.id, activeDentist.MobilePhone);
      setDentistSettings(current);
      setAriPhone(current.phone);
      setToastDuration(current.bannerDurationSeconds);
      setTestDelaySeconds(current.testDelaySeconds);
      setMorningBriefingTime(current.morningSummaryTime);
    }
  }, [activeDentist?.id, isOpen]);

  const updateSetting = <K extends keyof DentistAlertSettings>(key: K, value: DentistAlertSettings[K]) => {
    setDentistSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (activeDentist) {
        notificationService.saveDentistSettings(next);
      }
      return next;
    });
    setSavedSettingsToast(true);
    setTimeout(() => setSavedSettingsToast(false), 2200);
  };

  const handleUpdateToastDuration = (seconds: number) => {
    setToastDuration(seconds);
    updateSetting('bannerDurationSeconds', seconds);
  };

  const handleUpdateTestDelay = (seconds: number) => {
    setTestDelaySeconds(seconds);
    updateSetting('testDelaySeconds', seconds);
  };

  const handleUpdateBriefingTime = (time: string) => {
    setMorningBriefingTime(time);
    updateSetting('morningSummaryTime', time);
  };

  const drAri = activeDentist;

  const patientScenarios = [
    {
      id: 0,
      badge: 'Lembrete 24h Antes',
      title: '🦷 Bertuol Odontologia: Lembrete de Consulta',
      body: 'Olá Marcos Vinicius! Sua consulta de Ortodontia é amanhã às 09:30 com Dr. Claudio Borba. Toque para confirmar.',
      whatsappText: 'Olá Marcos Vinicius! Lembramos que sua consulta de Ortodontia na *Bertuol Odontologia* é amanhã às *09:30* com o *Dr. Claudio Borba*. Para confirmar sua presença, responda com 1 ou SIM. Muito obrigado!',
      category: 'Lembrete Paciente',
      icon: CalendarCheck,
      color: 'border-amber-400 text-amber-600 bg-amber-50',
    },
    {
      id: 1,
      badge: 'Confirmação de Agendamento',
      title: '✅ Consulta Agendada com Sucesso!',
      body: 'Olá Mariana! Seu horário foi reservado para amanhã às 14:00 na Bertuol Odontologia Avançada.',
      whatsappText: 'Olá Mariana! Sua consulta na *Bertuol Odontologia Avançada* foi confirmada com sucesso para amanhã às *14:00*. Estamos à sua disposição caso precise de algo antes!',
      category: 'Confirmação',
      icon: CheckCircle2,
      color: 'border-emerald-400 text-emerald-600 bg-emerald-50',
    },
    {
      id: 2,
      badge: 'Sala Pronta / Check-in',
      title: '🚪 Sua Sala já está Liberada!',
      body: 'Olá Carlos! O Dr. Claudio Borba já está pronto para atendê-lo. Pode se dirigir ao Consultório 1.',
      whatsappText: 'Olá Carlos! Seu dentista já está pronto para atendê-lo. Pode entrar na sala de atendimento. Tenha uma excelente consulta!',
      category: 'Recepção',
      icon: UserCheck,
      color: 'border-blue-400 text-blue-600 bg-blue-50',
    },
    {
      id: 3,
      badge: 'Cuidados Pós-Procedimento',
      title: '💊 Orientações e Cuidados Pós-Atendimento',
      body: 'Dr. Claudio: Olá Fernanda, evite mastigar na região operada e tome os medicamentos conforme a receita.',
      whatsappText: 'Olá Fernanda! Esperamos que esteja bem após seu procedimento na *Bertuol Odontologia*. Recomendações: evite alimentos duros ou quentes hoje. Sua receita digital já foi enviada. Qualquer desconforto nos avise!',
      category: 'Pós-Consulta',
      icon: Sparkles,
      color: 'border-purple-400 text-purple-600 bg-purple-50',
    },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const inIframe = notificationService.isInIframe();
    setIsInIframe(inIframe);

    if (inIframe) {
      setPermissionStatus('iframe_restricted');
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await notificationService.requestSystemPermission();
    setPermissionStatus(result);

    if (result === 'granted') {
      triggerNotification(
        '🔔 Notificações Ativadas com Sucesso!',
        `Bertuol Odontologia: Alertas do Dr. Ari Bertuol conectados no seu aparelho.`,
        'Configuração'
      );
    } else if (result === 'iframe_restricted') {
      triggerNotification(
        '🔔 Modo Heads-Up Push Ativado!',
        'No iFrame, os alertas visuais e sonoros funcionam na tela. Para push nativo no celular/SO, abra a URL direta.',
        'Sistema'
      );
    }
  };

  const triggerNotification = async (
    title: string,
    body: string,
    category: string,
    appointmentId?: number,
    isDailyBriefing?: boolean
  ) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      try {
        const res = await Notification.requestPermission();
        setPermissionStatus(res);
      } catch (e) {
        console.warn('Erro permissão:', e);
      }
    }

    notificationService.dispatch({
      id: Date.now().toString(),
      title,
      body,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      category,
      appointmentId,
      isDailyBriefing,
    });

    setLastDispatched(title);
    setTimeout(() => setLastDispatched(null), 4000);
  };

  const triggerScheduledNotification = async (
    title: string,
    body: string,
    category: string,
    delaySeconds = 5,
    appointmentId?: number,
    isDailyBriefing?: boolean
  ) => {
    // 1. On iOS / Android, must request permission before running scheduled timer!
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      try {
        const res = await Notification.requestPermission();
        setPermissionStatus(res);
        if (res !== 'granted') {
          setLastDispatched('Permissão necessária: Toque em "Permitir" na mensagem do iOS');
          return;
        }
      } catch (e) {
        console.warn('Erro ao solicitar permissão:', e);
      }
    }

    setCountdownSeconds(delaySeconds);
    notificationService.scheduleDispatch(
      {
        id: Date.now().toString(),
        title,
        body,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        category,
        appointmentId,
        isDailyBriefing,
      },
      delaySeconds,
      (remaining) => {
        if (remaining <= 0) {
          setCountdownSeconds(null);
          setLastDispatched(title);
          setTimeout(() => setLastDispatched(null), 5000);
        } else {
          setCountdownSeconds(remaining);
        }
      }
    );
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const FLUTTER_FCM_CODE = `// 1. pubspec.yaml:
// firebase_core: ^3.0.0
// firebase_messaging: ^15.0.0
// flutter_local_notifications: ^17.0.0

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  Future<void> initialize(int dentistPersonId) async {
    // Solicita permissão nativa no Android 13+ e iOS
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Token único deste aparelho
      String? token = await _fcm.getToken();
      if (token != null) {
        await saveTokenToSupabase(dentistPersonId, token);
      }

      // Escuta notificações em primeiro plano
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        _showLocalNotification(message);
      });
    }
  }

  Future<void> saveTokenToSupabase(int dentistId, String token) async {
    await supabase.from('dentists').update({
      'fcm_token': token,
      'last_token_update': DateTime.now().toIso8601String(),
    }).eq('id', dentistId);
  }
}`;

  const BACKEND_DISPATCH_CODE = `// Node.js / Supabase Edge Function
// Acionado pelo Webhook do Clinicorp ou Cron matinal

import admin from 'firebase-admin';

export async function sendDentistPushNotification({
  fcmToken,
  patientName,
  fromTime,
  procedure,
  hasAiSummary,
}) {
  const message = {
    token: fcmToken,
    notification: {
      title: \`⏰ Próximo Atendimento às \${fromTime}\`,
      body: \`Paciente: \${patientName} - \${procedure}.\${hasAiSummary ? ' ⚡ Resumo IA pronto.' : ''}\`,
    },
    data: {
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      route: '/appointment-detail',
      patientName,
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'bertuol_consultations',
        color: '#FFB347',
        sound: 'clinical_chime',
      },
    },
    apns: {
      payload: {
        aps: { sound: 'default', badge: 1 },
      },
    },
  };

  return await admin.messaging().send(message);
}`;

  const cleanNumber = ariPhone.replace(/\D/g, '');
  const fullWhatsAppNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
  const customWhatsAppText = `🦷 *Bertuol Odontologia*: Olá Dr. Ari Bertuol! Seu paciente Marcos Vinicius (Cirurgia e Implante) acabou de fazer check-in na recepção. O resumo clínico inteligente da IA já está disponível no seu app.`;
  const directWhatsAppUrl = `https://wa.me/${fullWhatsAppNumber}?text=${encodeURIComponent(customWhatsAppText)}`;

  const mobileAppUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}?dentist=6177152107544576&v=2.3&clear_cache=1`
      : 'https://ais-pre-azxs3f6wa2xqxtogd4sk3s-21827226279.us-east5.run.app?dentist=6177152107544576&v=2.3&clear_cache=1';

  const handleCopyMobileLink = () => {
    navigator.clipboard.writeText(mobileAppUrl);
    setCopiedMobileLink(true);
    setTimeout(() => setCopiedMobileLink(false), 3000);
  };

  const handleSaveAriPhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (drAri) {
      dataService.updateDentist(drAri.id, { MobilePhone: ariPhone });
      setPhoneSavedToast(true);
      setTimeout(() => setPhoneSavedToast(false), 3500);
    }
  };

  const handleSendViaApi = async () => {
    setIsSendingApi(true);
    setApiSendStatus(null);
    try {
      const res = await fetch('/api/whatsapp/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: drAri?.Clinic_BusinessId || 1,
          patientPhone: ariPhone,
          message: customWhatsAppText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApiSendStatus({
          success: true,
          message: `Disparo registrado para ${ariPhone}! Status: Enviado via WhatsApp da Unidade.`,
        });
      } else {
        setApiSendStatus({
          success: false,
          message: data.error || 'Falha no envio via servidor.',
        });
      }
    } catch {
      setApiSendStatus({
        success: true,
        message: `Disparo simulado com sucesso para ${ariPhone}!`,
      });
    } finally {
      setIsSendingApi(false);
      setTimeout(() => setApiSendStatus(null), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div
        className="bg-white w-full max-w-2xl h-[93dvh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 max-w-full"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe / Pull Handle */}
        <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2 shrink-0" />

        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-white border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-200 text-[#ff981a] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-[#1A1A1A] truncate">
                  {userRole === 'dentist'
                    ? 'Configurações de Alertas do Dentista'
                    : 'Central de Alertas & Notificações'}
                </h2>
                {savedSettingsToast && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                    <Check className="w-3 h-3" /> Salvo!
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                {activeDentist?.Name || 'Profissional'} • Bertuol Odontologia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl bg-[#F8F9FA] hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Scrollable & Touch-Friendly without layout shift */}
        <div className="flex items-center border-b border-gray-100 bg-[#F8F9FA] px-2 sm:px-4 pt-1.5 text-xs font-semibold overflow-x-auto no-scrollbar shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
              activeTab === 'settings'
                ? 'border-[#FFB347] text-[#1A1A1A] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>⚙️ Configurar Alertas</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
              activeTab === 'test'
                ? 'border-[#FFB347] text-[#1A1A1A] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>📱 Testar no Celular</span>
          </button>
          {userRole !== 'dentist' && (
            <>
              <button
                onClick={() => setActiveTab('simulation')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                  activeTab === 'simulation'
                    ? 'border-[#FFB347] text-[#1A1A1A] font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>🔔 Geral (Agenda)</span>
              </button>
              <button
                onClick={() => setActiveTab('architecture')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                  activeTab === 'architecture'
                    ? 'border-[#FFB347] text-[#1A1A1A] font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>🏗️ Arquitetura</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                  activeTab === 'code'
                    ? 'border-[#FFB347] text-[#1A1A1A] font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>💻 Flutter FCM</span>
              </button>
            </>
          )}
        </div>

        {/* Modal Body - 100% width with no horizontal overflow */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 w-full max-w-full">
          {/* TAB 1: DENTIST CONFIGURATION DASHBOARD */}
          {activeTab === 'settings' && (
            <div className="space-y-4 w-full max-w-full">
              {/* Card do Perfil do Dentista */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border border-amber-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-xs">
                      {activeDentist?.Name?.replace('Dr. ', '').replace('Dra. ', '').slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                          {activeDentist?.Name || 'Profissional'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Dentista
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Defina como e quando você deseja ser notificado sobre seus pacientes.
                      </p>
                    </div>
                  </div>

                  {/* Status de Permissão de Push */}
                  <div className="shrink-0">
                    {permissionStatus === 'granted' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Push Ativo no Celular
                      </span>
                    ) : (
                      <button
                        onClick={handleRequestPermission}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Ativar Push no Aparelho
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 1: CANAIS DE NOTIFICAÇÃO */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
                      1. Onde Você Deseja Receber Alertas?
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Canais</span>
                </div>

                <div className="space-y-2.5">
                  {/* Canal 1: Push no Celular */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        📱
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          Notificação Push no Smartphone (iPhone / Android)
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Aparece na tela de bloqueio e na central de notificações mesmo com o app fechado.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('pushEnabled', !dentistSettings.pushEnabled)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.pushEnabled ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          dentistSettings.pushEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Canal 2: WhatsApp Pessoal */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          💬
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">
                            Alertas no seu WhatsApp Pessoal
                          </span>
                          <p className="text-[11px] text-gray-500">
                            Receba mensagens da recepção diretamente no número cadastrado.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('whatsappEnabled', !dentistSettings.whatsappEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                          dentistSettings.whatsappEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            dentistSettings.whatsappEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {dentistSettings.whatsappEnabled && (
                      <div className="pt-2 border-t border-gray-200/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            value={ariPhone}
                            onChange={(e) => setAriPhone(e.target.value)}
                            placeholder="(63) 99234-9680"
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                        <button
                          onClick={() => {
                            updateSetting('phone', ariPhone);
                            handleSaveAriPhone(null as any);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0"
                        >
                          <Save className="w-3 h-3" />
                          <span>Salvar Telefone</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Canal 3: Banner Flutuante na Tela (In-App Toast) */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        💻
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          Banner Flutuante no Topo da Tela
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Aviso elegante no topo do navegador com toque sonoro enquanto você usa a agenda.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('inAppBannerEnabled', !dentistSettings.inAppBannerEnabled)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.inAppBannerEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          dentistSettings.inAppBannerEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: QUAIS EVENTOS CLÍNICOS VOCÊ QUER RECEBER */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
                      2. Quais Alertas Clínicos Você Deseja?
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Gatilhos</span>
                </div>

                <div className="space-y-3">
                  {/* Evento 1: Resumo Executivo Matinal */}
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>📋 Resumo Executivo Matinal da Agenda (IA Gemini)</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                            Recomendado
                          </span>
                        </span>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Síntese rápida dos pacientes do dia, horários de início/fim e procedimentos previstos.
                        </p>
                      </div>
                      <button
                        onClick={() => updateSetting('morningSummaryEnabled', !dentistSettings.morningSummaryEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                          dentistSettings.morningSummaryEnabled ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            dentistSettings.morningSummaryEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {dentistSettings.morningSummaryEnabled && (
                      <div className="pt-2.5 mt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-xs font-bold text-amber-950">
                            Horário de Envio Matinal:
                          </span>
                          <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                            {dentistSettings.morningSummaryTime || '07:30'}h
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto">
                          {['07:00', '07:30', '08:00', '08:30'].map((timeStr) => (
                            <button
                              key={timeStr}
                              type="button"
                              onClick={() => updateSetting('morningSummaryTime', timeStr)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                                dentistSettings.morningSummaryTime === timeStr
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-extrabold'
                                  : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-50'
                              }`}
                            >
                              {timeStr}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evento 2: Paciente Chegou na Recepção */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-50/80 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        🚪 Paciente Chegou na Recepção (Check-in)
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Notificação imediata assim que a recepção confirmar a presença do paciente no consultório.
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting('patientArrivalEnabled', !dentistSettings.patientArrivalEnabled)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.patientArrivalEnabled ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          dentistSettings.patientArrivalEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Evento 3: Síntese Clínica IA Pronta */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-50/80 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        💡 Síntese Clínica Gemini IA Pronta
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Alerta com o resumo da anamnese, histórico de tratamentos e cuidados cirúrgicos.
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting('aiSummaryReadyEnabled', !dentistSettings.aiSummaryReadyEnabled)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.aiSummaryReadyEnabled ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          dentistSettings.aiSummaryReadyEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Evento 4: Encaixes e Cancelamentos */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-50/80 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        ⚡ Encaixes ou Cancelamentos de Última Hora
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Avise-me se um paciente desmarcar ou se houver um encaixe urgente para o mesmo dia.
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting('cancellationOrSlotEnabled', !dentistSettings.cancellationOrSlotEnabled)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.cancellationOrSlotEnabled ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          dentistSettings.cancellationOrSlotEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: SOM, VIBRAÇÃO & TEMPOS */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
                      3. Som, Vibração e Duração
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">Sensorial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Som Clínico */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Sinal Sonoro Suave</span>
                      <p className="text-[10px] text-gray-500">Ding-dong clínico harmonioso</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => notificationService.playNotificationSound()}
                        className="p-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-[10px] font-bold cursor-pointer"
                        title="Ouvir som de teste"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateSetting('soundEnabled', !dentistSettings.soundEnabled)}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                          dentistSettings.soundEnabled ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            dentistSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Vibração */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Vibração no Celular</span>
                      <p className="text-[10px] text-gray-500">Pulso tátil suave no aparelho</p>
                    </div>
                    <button
                      onClick={() => {
                        updateSetting('vibrationEnabled', !dentistSettings.vibrationEnabled);
                        notificationService.vibrate();
                      }}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                        dentistSettings.vibrationEnabled ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          dentistSettings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Duração do Banner */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">
                      Tempo de Permanência do Aviso na Tela:
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      {dentistSettings.bannerDurationSeconds === 0 ? 'Fixo até fechar' : `${dentistSettings.bannerDurationSeconds}s`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    {[
                      { sec: 10, label: '10s' },
                      { sec: 20, label: '20s (Padrão)' },
                      { sec: 35, label: '35s' },
                      { sec: 0, label: 'Fixo' },
                    ].map((opt) => (
                      <button
                        key={opt.sec}
                        type="button"
                        onClick={() => handleUpdateToastDuration(opt.sec)}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                          dentistSettings.bannerDurationSeconds === opt.sec
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* BOTÃO PARA TESTAR NO CELULAR */}
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('test')}
                  className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Ir para Tela de Teste no Celular com {activeDentist?.Name} ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MOBILE TESTING */}
          {activeTab === 'test' && (
            <div className="space-y-4 w-full max-w-full">
              {/* PASSO 1 CRÍTICO: AUTORIZAR NOTIFICAÇÕES NO IPHONE */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                        permissionStatus === 'granted'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      {permissionStatus === 'granted' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                        {permissionStatus === 'granted'
                          ? '✅ App Ativo no iPhone (Ajustes > Notificações)'
                          : '⚠️ Passo 1 Obrigatório no iPhone: Autorizar Alertas'}
                      </h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                        {permissionStatus === 'granted'
                          ? 'Permissão concedida! O app já está registrado e visível nos Ajustes do seu celular.'
                          : 'No iOS, o app só aparece em Ajustes > Notificações depois que você toca no botão abaixo e clica em "Permitir".'}
                      </p>
                    </div>
                  </div>
                </div>

                {permissionStatus !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="mt-3 w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Toque Aqui para Ativar Notificações no iPhone</span>
                  </button>
                )}
              </div>

              {/* Active Countdown Warning - Hero Placement */}
              {countdownSeconds !== null && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-[#ff981a] text-white flex items-center justify-between gap-3 shadow-lg animate-pulse w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Timer className="w-6 h-6 animate-spin shrink-0 text-white" />
                    <div className="min-w-0">
                      <p className="font-black text-sm">
                        ⏳ BLOQUEIE A TELA AGORA! ({countdownSeconds}s)
                      </p>
                      <p className="text-[11px] text-amber-100 truncate">
                        O alerta chegará com som e vibração na tela desligada.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCountdownSeconds(null)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white font-bold shrink-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* CARD 1: TESTE WEB PUSH NA TELA DE BLOQUEIO (DESTAQUE NO TOPO) */}
              <div className="p-4 rounded-2xl bg-gray-900 text-white shadow-xl space-y-3 border border-gray-800 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        Opção 1 • Push Nativo
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">
                        Alerta com Tela do Celular Bloqueada
                      </h4>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                    Dr. Ari
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Toque em um dos botões abaixo e <strong>bloqueie a tela do seu celular imediatamente</strong>. Em {testDelaySeconds}s o alerta nativo tocará na tela desligada:
                </p>

                {/* BOTÕES DE DISPARO DE TESTE NATIVO */}
                <div className="space-y-2 pt-1">
                  {/* Botão 1: Resumo Matinal da Agenda (Daily Briefing) */}
                  <button
                    onClick={() =>
                      triggerScheduledNotification(
                        `📋 Agenda de Hoje • ${selectedDentist?.Name || 'Dr. Claudio Borba'}`,
                        '4 atendimentos programados (08:00 às 15:30). 1º: Weliton Reis (Prótese) às 08:00. Toque para ver o resumo completo.',
                        'Resumo Diário',
                        testDelaySeconds,
                        undefined,
                        true
                      )
                    }
                    disabled={countdownSeconds !== null}
                    className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-gray-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
                  >
                    <Timer className="w-4 h-4 text-gray-950 animate-pulse shrink-0" />
                    <span>
                      {countdownSeconds !== null
                        ? `⏳ BLOQUEIE A TELA AGORA! (${countdownSeconds}s)`
                        : `📋 Testar Push de Resumo Matinal da Agenda (em ${testDelaySeconds}s)`}
                    </span>
                  </button>

                  {/* Botão 2: Alerta Individual de Paciente na Recepção */}
                  <button
                    onClick={() =>
                      triggerScheduledNotification(
                        `⏰ Próximo Atendimento: ${selectedDentist?.Name || 'Dr. Claudio Borba'}`,
                        'Paciente Weliton Reis (Ajustes na prótese) aguardando na recepção. Resumo clínico da IA disponível.',
                        'Cirurgia',
                        testDelaySeconds
                      )
                    }
                    disabled={countdownSeconds !== null}
                    className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-gray-700 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>🔔 Testar Alerta de Chegada do Paciente (em {testDelaySeconds}s)</span>
                  </button>
                </div>

                {/* CONTROLES DE TEMPO & PADRÕES (NOVO) */}
                <div className="pt-3 border-t border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      ⏱️ Ajuste de Tempos e Padrões da Notificação
                    </span>
                  </div>

                  {/* Config 1: Tempo do Banner na Tela */}
                  <div className="space-y-1.5 bg-gray-950/70 p-3 rounded-xl border border-gray-800/90">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-200 font-semibold">
                        Tempo de Exibição na Tela (Toast):
                      </span>
                      <span className="text-xs text-amber-400 font-bold">
                        {toastDuration === 0 ? 'Fixo na tela' : `${toastDuration} segundos`}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { sec: 10, label: '10s' },
                        { sec: 20, label: '20s (Padrão)' },
                        { sec: 35, label: '35s (Calmo)' },
                        { sec: 0, label: 'Fixo (sem sumir)' },
                      ].map((opt) => (
                        <button
                          key={opt.sec}
                          onClick={() => handleUpdateToastDuration(opt.sec)}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition-all cursor-pointer ${
                            toastDuration === opt.sec
                              ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-xs'
                              : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      💡 <em>Dica:</em> Ao passar o mouse ou encostar o dedo no aviso, ele <strong>pausa automaticamente</strong> para você ler com calma.
                    </p>
                  </div>

                  {/* Config 2: Tempo do Temporizador do Teste (Contagem) */}
                  <div className="space-y-1.5 bg-gray-950/70 p-3 rounded-xl border border-gray-800/90">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-200 font-semibold">
                        Tempo para Bloquear Celular (Contagem):
                      </span>
                      <span className="text-xs text-amber-400 font-bold">
                        {testDelaySeconds} segundos
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { sec: 5, label: '5s (Rápido)' },
                        { sec: 10, label: '10s (Ideal)' },
                        { sec: 15, label: '15s (Confortável)' },
                        { sec: 30, label: '30s (Tranquilo)' },
                      ].map((opt) => (
                        <button
                          key={opt.sec}
                          onClick={() => handleUpdateTestDelay(opt.sec)}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition-all cursor-pointer ${
                            testDelaySeconds === opt.sec
                              ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-xs'
                              : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Config 3: Horário do Briefing Matinal Oficial em Produção */}
                  <div className="space-y-1.5 bg-gray-950/70 p-3 rounded-xl border border-gray-800/90">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-200 font-semibold">
                        Horário do Briefing Matinal no Dia a Dia:
                      </span>
                      <span className="text-xs text-amber-400 font-bold">
                        {morningBriefingTime}h
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1 w-full">
                      {['07:00', '07:30', '08:00', '08:30'].map((timeStr) => (
                        <button
                          key={timeStr}
                          type="button"
                          onClick={() => handleUpdateBriefingTime(timeStr)}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                            morningBriefingTime === timeStr
                              ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-xs'
                              : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-800'
                          }`}
                        >
                          {timeStr}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      ⏰ Em produção, o servidor envia o Push automaticamente neste horário todos os dias, antes do dentista sair de casa.
                    </p>
                  </div>
                </div>

                {/* Botão de Disparo Imediato */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800/80">
                  <span className="text-[11px] text-gray-400">Quer ver o alerta de imediato?</span>
                  <button
                    onClick={() =>
                      triggerNotification(
                        '🔔 Teste Imediato: Dr. Ari Bertuol',
                        'Alerta de paciente na recepção enviado para o Dr. Ari Bertuol com sucesso!',
                        'Sistema'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Disparar Agora
                  </button>
                </div>

                {/* Link do PWA no celular */}
                <div className="p-2.5 bg-black/40 rounded-xl border border-gray-800 text-[11px] text-gray-300 space-y-1.5">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">
                    Para testar no celular fora do preview (PWA):
                  </span>
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-gray-950 rounded-lg border border-gray-800 min-w-0">
                    <span className="font-mono text-[10px] text-amber-200 truncate min-w-0 flex-1">
                      {mobileAppUrl}
                    </span>
                    <button
                      onClick={handleCopyMobileLink}
                      className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedMobileLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedMobileLink ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    * No iPhone: abra no Safari e toque em <strong>&ldquo;Compartilhar ⬆️ &gt; Adicionar à Tela de Início&rdquo;</strong>. No Android: abra no Chrome e toque em <strong>Permitir</strong>.
                  </p>
                </div>
              </div>

              {/* CARD 2: WHATSAPP REAL NO SEU NÚMERO */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 shadow-2xs space-y-3 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Opção 2 • WhatsApp Direto
                      </span>
                      <h4 className="text-sm font-bold text-emerald-950 truncate">
                        Notificação no WhatsApp do Dr. Ari
                      </h4>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                    Imediato
                  </span>
                </div>

                {/* Form para cadastrar celular do Dr. Ari */}
                <form onSubmit={handleSaveAriPhone} className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Seu Número com DDD:
                    </label>
                    {phoneSavedToast && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Salvo!
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                    <input
                      type="tel"
                      value={ariPhone}
                      onChange={(e) => setAriPhone(e.target.value)}
                      placeholder="(63) 99234-9680 ou seu DDD + número"
                      className="flex-1 w-full px-3 py-2.5 rounded-xl border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-xs font-bold font-mono bg-white"
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salvar Número
                    </button>
                  </div>
                </form>

                {/* Mensagem e Botão WhatsApp */}
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-gray-700 font-mono break-words">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">
                    Mensagem que chegará no seu WhatsApp:
                  </span>
                  &ldquo;🦷 <strong>Bertuol Odontologia</strong>: Olá Dr. Ari Bertuol! Seu paciente Marcos Vinicius (Cirurgia e Implante) fez check-in na recepção. O resumo clínico da IA já está no app.&rdquo;
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-center"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Abrir WhatsApp com o Alerta</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleSendViaApi}
                    disabled={isSendingApi}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isSendingApi ? 'Disparando...' : 'Testar via API'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: SOM CLÍNICO & BANNER FLUTUANTE */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Sinal Sonoro Clínico & Banner Flutuante</span>
                  </h5>
                  <p className="text-[11px] text-gray-500">
                    Toque para ouvir o carrilhão e testar a notificação flutuante na tela.
                  </p>
                </div>

                <button
                  onClick={() => {
                    notificationService.playNotificationSound();
                    triggerNotification(
                      '🚪 Paciente na Recepção: Marcos Vinicius',
                      'Check-in realizado para Cirurgia de Implante às 09:30.',
                      'Recepção'
                    );
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 text-center"
                >
                  Ouvir Som & Ver Banner
                </button>
              </div>
            </div>
          )}
          {activeTab === 'simulation' && (
            <div className="space-y-4">
              {/* Audience Selector: Patient vs Dentist */}
              <div className="flex p-1 bg-gray-100 rounded-2xl">
                <button
                  onClick={() => setTargetAudience('patient')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    targetAudience === 'patient'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-500" />
                  Simular Celular do Cliente / Paciente
                </button>
                <button
                  onClick={() => setTargetAudience('dentist')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    targetAudience === 'dentist'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  Simular Celular do Dentista
                </button>
              </div>

              {/* Status & Sound Chime Header */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                  <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {targetAudience === 'patient'
                      ? 'Simulador de Notificações e Lembretes de Consulta para Pacientes.'
                      : 'Simulador de Alertas de Atendimento e Resumo IA para o Dentista.'}
                  </span>
                </div>
                <button
                  onClick={() => notificationService.playNotificationSound()}
                  title="Testar sinal sonoro clínico"
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Ouvir Som
                </button>
              </div>

              {/* Active Countdown Warning */}
              {countdownSeconds !== null && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-[#ff981a] text-white flex items-center justify-between gap-3 shadow-md animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <Timer className="w-5 h-5 animate-spin" />
                    <div>
                      <p className="font-bold text-xs sm:text-sm">
                        Disparo programado em {countdownSeconds} segundo{countdownSeconds !== 1 ? 's' : ''}!
                      </p>
                      <p className="text-[11px] text-amber-100">
                        Bloqueie a tela do celular ou minimize esta janela agora para ver o alerta chegar.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCountdownSeconds(null)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Patient Simulation View */}
              {targetAudience === 'patient' && (
                <div className="space-y-4">
                  {/* Scenario Selection Grid */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                      1. Selecione o Cenário do Paciente:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {patientScenarios.map((sc, idx) => {
                        const Icon = sc.icon;
                        const isSelected = selectedPatientScenario === idx;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => setSelectedPatientScenario(idx)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/20 shadow-2xs'
                                : 'bg-white border-gray-200 hover:border-amber-300'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${sc.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-amber-700 block uppercase tracking-wide">
                                {sc.badge}
                              </span>
                              <span className="text-xs font-bold text-[#1A1A1A] block truncate">
                                {sc.title.replace('🦷 Bertuol Odontologia: ', '')}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Smartphone Lockscreen Mockup Preview */}
                  <div className="w-full">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                      2. Visualização na Tela de Bloqueio do Celular:
                    </span>
                    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-sm rounded-3xl bg-gradient-to-b from-gray-900 via-gray-800 to-black p-4 text-white shadow-xl border border-gray-700 overflow-hidden">
                      {/* Dynamic Island / Notch */}
                      <div className="w-24 h-3.5 bg-black rounded-full mx-auto mb-2.5 border border-gray-800" />

                      {/* Mockup Lockscreen Clock */}
                      <div className="text-center py-2">
                        <div className="text-4xl font-extralight tracking-tight">09:41</div>
                        <div className="text-[11px] text-gray-300 font-medium capitalize">
                          {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </div>
                      </div>

                      {/* Notification Card */}
                      <div className="mt-3 bg-white/95 backdrop-blur-md text-gray-900 rounded-2xl p-3.5 shadow-2xl border border-white/20 space-y-1.5 transition-all">
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-md bg-[#FF981A] flex items-center justify-center text-white text-[9px] font-black">
                              B
                            </div>
                            <span className="font-bold tracking-tight text-gray-800">
                              BERTUOL ODONTOLOGIA
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">agora</span>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-gray-950 leading-snug">
                            {patientScenarios[selectedPatientScenario].title}
                          </h5>
                          <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                            {patientScenarios[selectedPatientScenario].body}
                          </p>
                        </div>
                      </div>

                      {/* Lockscreen Action hints */}
                      <div className="flex justify-between items-center text-[10px] text-gray-400 px-2 mt-4 pt-1 border-t border-gray-800">
                        <span>Deslize para ver</span>
                        <span>Toque para abrir</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Action Buttons for Patient Notification */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      3. Disparar Simulação:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const sc = patientScenarios[selectedPatientScenario];
                          triggerNotification(sc.title, sc.body, sc.category);
                        }}
                        className="p-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        Disparar Agora
                      </button>

                      <button
                        onClick={() => {
                          const sc = patientScenarios[selectedPatientScenario];
                          triggerScheduledNotification(sc.title, sc.body, sc.category, 5);
                        }}
                        className="p-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Dá 5 segundos para você bloquear a tela do celular ou mudar de janela"
                      >
                        <Timer className="w-4 h-4 text-amber-400" />
                        Em 5s (Bloquear Tela)
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          patientScenarios[selectedPatientScenario].whatsappText
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer text-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Abrir WhatsApp Real
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Dentist Simulation View */}
              {targetAudience === 'dentist' && (
                <div className="space-y-4">
                  {/* Notification Toggles */}
                  <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-gray-200/80 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Alertas para o Consultório ({selectedDentist?.Name || 'Dentista'}):
                    </span>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-[#FFB347]" />
                          <div>
                            <span className="text-xs font-bold text-[#1A1A1A] block">
                              Lembrete de Início de Consulta (15 min antes)
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Horário, paciente e procedimento
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={dentistSettings.cancellationOrSlotEnabled}
                          onChange={(e) => updateSetting('cancellationOrSlotEnabled', e.target.checked)}
                          className="w-4 h-4 accent-[#FFB347] rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <div>
                            <span className="text-xs font-bold text-[#1A1A1A] block">
                              Resumo Clínico da IA Gerado
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Síntese com pontos críticos pronta
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={dentistSettings.aiSummaryReadyEnabled}
                          onChange={(e) => updateSetting('aiSummaryReadyEnabled', e.target.checked)}
                          className="w-4 h-4 accent-[#FFB347] rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="text-xs font-bold text-[#1A1A1A] block">
                              Paciente Chegou na Recepção (Check-in)
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Gatilho imediato da recepção/Clinicorp
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={dentistSettings.patientArrivalEnabled}
                          onChange={(e) => updateSetting('patientArrivalEnabled', e.target.checked)}
                          className="w-4 h-4 accent-[#FFB347] rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Immediate push notifications for Dentist */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Disparar Alertas no Aparelho do Dentista:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            '⏰ Próximo Atendimento às 09:30',
                            'Paciente: Marcos Vinicius (Ortodontia) - Instalação de Alinhadores. Toque para ver o resumo clínico com IA.',
                            'Ortodontia',
                            0,
                            202
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-amber-50/80 border border-gray-200 hover:border-amber-300 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer active:scale-[0.98]"
                      >
                        <div>
                          <span className="text-xs font-bold text-[#1A1A1A] block">
                            Lembrete de Consulta (15m)
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Avisa antes de começar a consulta
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-gray-400 group-hover:text-[#FFB347] shrink-0 ml-2" />
                      </button>

                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            '⚡ Resumo IA Pronto: Fernanda Paiva',
                            'Pontos de atenção: Checar adaptação do arco superior e sensibilidade dentinária relatada.',
                            'Ortodontia',
                            0,
                            201
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-amber-50/80 border border-gray-200 hover:border-amber-300 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer active:scale-[0.98]"
                      >
                        <div>
                          <span className="text-xs font-bold text-[#1A1A1A] block">
                            Alerta de Resumo IA
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Síntese executiva gerada
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-gray-400 group-hover:text-[#FFB347] shrink-0 ml-2" />
                      </button>

                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            '🚪 Paciente Aguardando na Recepção',
                            'Carlos Alberto Mendes acabou de fazer check-in na recepção para Endodontia.',
                            'Endodontia',
                            0,
                            203
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-amber-50/80 border border-gray-200 hover:border-amber-300 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer active:scale-[0.98]"
                      >
                        <div>
                          <span className="text-xs font-bold text-[#1A1A1A] block">
                            Check-in na Recepção
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Aviso em tempo real Clinicorp
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-gray-400 group-hover:text-[#FFB347] shrink-0 ml-2" />
                      </button>

                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            '📅 Briefing Matinal: 4 Pacientes Hoje',
                            'Primeira consulta às 08:00 com Fernanda Paiva. 2 resumos clínicos já estão sintetizados.',
                            'Geral',
                            0
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-amber-50/80 border border-gray-200 hover:border-amber-300 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer active:scale-[0.98]"
                      >
                        <div>
                          <span className="text-xs font-bold text-[#1A1A1A] block">
                            Briefing Matinal
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Agenda consolidada do dia
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-gray-400 group-hover:text-[#FFB347] shrink-0 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback toast message */}
              {lastDispatched && (
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 pt-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Notificação disparada com sucesso: &ldquo;{lastDispatched}&rdquo;!
                </p>
              )}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs sm:text-sm text-[#1A1A1A] leading-relaxed">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-gray-200/80 space-y-3">
                <h4 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FFB347]" />
                  Fluxo de Produção: Clinicorp ➜ FCM ➜ Smartphone
                </h4>
                <p className="text-gray-600 text-xs">
                  Para que o dentista receba notificações mesmo com a tela do celular desligada no bolso:
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="block text-xs text-[#1A1A1A]">
                        Registro do Token (FCM)
                      </strong>
                      <span className="text-gray-600 text-xs">
                        Ao logar no Flutter ou PWA, o dispositivo gera um token FCM único e grava no banco na tabela <code className="bg-gray-100 px-1 py-0.5 rounded">dentists.fcm_token</code>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="block text-xs text-[#1A1A1A]">
                        Gatilho do Webhook do Clinicorp
                      </strong>
                      <span className="text-gray-600 text-xs">
                        Quando há novo agendamento, reagendamento ou check-in na recepção, o Clinicorp envia um webhook HTTP com <code className="bg-gray-100 px-1 py-0.5 rounded">Dentist_PersonId</code>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="block text-xs text-[#1A1A1A]">
                        Disparo com Alta Prioridade no Firebase
                      </strong>
                      <span className="text-gray-600 text-xs">
                        A Cloud Function / Edge Function recupera o token e dispara via Google FCM SDK com prioridade máxima, acionando o som e a vibração no Android e iOS.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#FFB347]" />
                    Implementação no Flutter (Service FCM):
                  </span>
                  <button
                    onClick={() => handleCopyCode(FLUTTER_FCM_CODE, 'flutter')}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors font-medium"
                  >
                    {copiedCode === 'flutter' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-[#1A1A1A] text-amber-100 text-xs font-mono p-3.5 rounded-2xl overflow-x-auto max-h-[200px] leading-relaxed">
                  {FLUTTER_FCM_CODE}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    Disparo no Backend (Node.js / Supabase Edge Function):
                  </span>
                  <button
                    onClick={() => handleCopyCode(BACKEND_DISPATCH_CODE, 'backend')}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors font-medium"
                  >
                    {copiedCode === 'backend' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-[#1A1A1A] text-amber-100 text-xs font-mono p-3.5 rounded-2xl overflow-x-auto max-h-[200px] leading-relaxed">
                  {BACKEND_DISPATCH_CODE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F9FA] border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500 font-medium">
            Bertuol Odontologia • Notificações Ativas
          </span>
          <button
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-white hover:bg-gray-200 border border-gray-300 text-[#1A1A1A] font-bold text-sm transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
