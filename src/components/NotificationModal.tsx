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
      title: 'Bertuol Odontologia: Lembrete de Consulta',
      body: 'Olá Juceline! Sua consulta de Ortodontia é amanhã às 14:00 com Dra. Muryel Castro. Toque para confirmar.',
      whatsappText: 'Olá Juceline! Lembramos que sua consulta na *Bertuol Odontologia* é amanhã às *14:00* com a *Dra. Muryel Castro*. Para confirmar sua presença, responda com 1 ou SIM. Muito obrigado!',
      category: 'Lembrete Paciente',
      icon: CalendarCheck,
      color: 'border-teal-200 text-[#147A80] bg-teal-50',
    },
    {
      id: 1,
      badge: 'Lembrete 2h Antes',
      title: 'Sua consulta começa em 2 horas!',
      body: 'Olá Mariana! Sua consulta com Dr. Ari Bertuol na Bertuol Odontologia é hoje às 16:30 (daqui a 2 horas). Toque para fazer pré-check-in sem filas!',
      whatsappText: 'Olá Mariana! Lembrando que sua consulta na *Bertuol Odontologia* é hoje às *16:30* (em 2 horas). Aguardamos você!',
      category: 'Lembrete Paciente',
      icon: Clock,
      color: 'border-teal-200 text-[#147A80] bg-teal-50',
    },
    {
      id: 2,
      badge: 'Feliz Aniversário',
      title: 'Feliz Aniversário da Equipe Bertuol!',
      body: 'Olá Alice! Parabéns pelo seu dia! Preparamos uma cortesia exclusiva de Profilaxia & Diagnóstico Sky Câmera no seu app!',
      whatsappText: 'Parabéns pelo seu dia, Alice! A *Bertuol Odontologia* te deseja muita saúde. Acesse seu app para resgatar sua cortesia exclusiva de aniversário!',
      category: 'Aniversário',
      icon: Sparkles,
      color: 'border-pink-200 text-pink-600 bg-pink-50',
    },
    {
      id: 3,
      badge: 'Confirmação de Agendamento',
      title: 'Consulta Agendada com Sucesso!',
      body: 'Olá Mariana! Seu horário foi reservado para amanhã às 14:00 na Bertuol Odontologia Avançada.',
      whatsappText: 'Olá Mariana! Sua consulta na *Bertuol Odontologia Avançada* foi confirmada com sucesso para amanhã às *14:00*. Estamos à sua disposição caso precise de algo antes!',
      category: 'Confirmação',
      icon: CheckCircle2,
      color: 'border-emerald-200 text-emerald-600 bg-emerald-50',
    },
    {
      id: 4,
      badge: 'Sala Pronta / Check-in',
      title: 'Sua Sala já está Liberada!',
      body: 'Olá Carlos! O Dr. Claudio Borba já está pronto para atendê-lo. Pode se dirigir ao Consultório 1.',
      whatsappText: 'Olá Carlos! Seu dentista já está pronto para atendê-lo. Pode entrar na sala de atendimento. Tenha uma excelente consulta!',
      category: 'Recepção',
      icon: UserCheck,
      color: 'border-blue-200 text-blue-600 bg-blue-50',
    },
    {
      id: 5,
      badge: 'Cuidados Pós-Procedimento',
      title: 'Orientações e Cuidados Pós-Atendimento',
      body: 'Dr. Claudio: Olá Fernanda, evite mastigar na região operada e tome os medicamentos conforme a receita.',
      whatsappText: 'Olá Fernanda! Esperamos que esteja bem após seu procedimento na *Bertuol Odontologia*. Recomendações: evite alimentos duros ou quentes hoje. Sua receita digital já foi enviada. Qualquer desconforto nos avise!',
      category: 'Pós-Consulta',
      icon: Sparkles,
      color: 'border-purple-200 text-purple-600 bg-purple-50',
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
        'Notificações Ativadas com Sucesso!',
        `Bertuol Odontologia: Alertas do Dr. Ari Bertuol conectados no seu aparelho.`,
        'Configuração'
      );
    } else if (result === 'iframe_restricted') {
      triggerNotification(
        'Modo Heads-Up Push Ativado!',
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
    // Não fecha abruptamente: o usuário pode dispensar via Sair ou ESC
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200 overflow-hidden">
      <div
        className="bg-white w-full max-w-2xl h-[93dvh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200 max-w-full"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe / Pull Handle */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {userRole === 'dentist'
                    ? 'Configurações de Alertas do Dentista'
                    : 'Central de Alertas & Notificações'}
                </h2>
                {savedSettingsToast && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> Salvo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                {activeDentist?.Name || 'Profissional'} · Bertuol Odontologia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 sm:px-4 pt-1.5 text-xs font-semibold overflow-x-auto no-scrollbar shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
              activeTab === 'settings'
                ? 'border-[#147A80] text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'settings' ? 'text-[#147A80]' : 'text-slate-400'}`} />
            <span>Configurar Alertas</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
              activeTab === 'test'
                ? 'border-[#147A80] text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'test' ? 'text-[#147A80]' : 'text-slate-400'}`} />
            <span>Testar no Celular</span>
          </button>
          {userRole !== 'dentist' && (
            <>
              <button
                onClick={() => setActiveTab('simulation')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                  activeTab === 'simulation'
                    ? 'border-[#147A80] text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'simulation' ? 'text-[#147A80]' : 'text-slate-400'}`} />
                <span>Geral (Agenda)</span>
              </button>
              <button
                onClick={() => setActiveTab('architecture')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                  activeTab === 'architecture'
                    ? 'border-[#147A80] text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'architecture' ? 'text-[#147A80]' : 'text-slate-400'}`} />
                <span>Arquitetura</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                  activeTab === 'code'
                    ? 'border-[#147A80] text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Code2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'code' ? 'text-[#147A80]' : 'text-slate-400'}`} />
                <span>Flutter FCM</span>
              </button>
            </>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 w-full max-w-full">
          {/* TAB 1: DENTIST CONFIGURATION DASHBOARD */}
          {activeTab === 'settings' && (
            <div className="space-y-4 w-full max-w-full">
              {/* Card do Perfil do Dentista */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#147A80] text-white flex items-center justify-center font-bold text-base shrink-0">
                      {activeDentist?.Name?.replace('Dr. ', '').replace('Dra. ', '').slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                          {activeDentist?.Name || 'Profissional'}
                        </h3>
                        <span className="text-xs font-medium text-slate-500">
                          · Dentista
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Defina como e quando você deseja ser notificado sobre seus pacientes.
                      </p>
                    </div>
                  </div>

                  {/* Status de Permissão de Push */}
                  <div className="shrink-0">
                    {permissionStatus === 'granted' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Push Ativo no Celular
                      </span>
                    ) : (
                      <button
                        onClick={handleRequestPermission}
                        className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Ativar Push no Aparelho
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Central Tutorial Box */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs sm:text-sm block">Dúvidas sobre como ativar as notificações?</span>
                    <p className="text-xs text-rose-800 leading-normal">
                      Os celulares (especialmente iPhones) exigem regras específicas para permitir sons e alertas em segundo plano.
                    </p>
                  </div>
                </div>
                <a
                  href="/como-ativar-notificacoes.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Tutorial Completo</span>
                </a>
              </div>

              {/* SEÇÃO 1: CANAIS DE NOTIFICAÇÃO */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#147A80]" />
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                      1. Onde Você Deseja Receber Alertas?
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-slate-400">Canais</span>
                </div>

                <div className="space-y-2.5">
                  {/* Canal 1: Push no Celular */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#147A80] border border-teal-200/80 flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">
                          Notificação Push no Smartphone (iPhone / Android)
                        </span>
                        <p className="text-xs text-slate-500">
                          Aparece na tela de bloqueio e na central de notificações mesmo com o app fechado.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('pushEnabled', !dentistSettings.pushEnabled)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.pushEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                          dentistSettings.pushEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Canal 2: WhatsApp Pessoal */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">
                            Alertas no seu WhatsApp Pessoal
                          </span>
                          <p className="text-xs text-slate-500">
                            Receba mensagens da recepção diretamente no número cadastrado.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('whatsappEnabled', !dentistSettings.whatsappEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                          dentistSettings.whatsappEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                            dentistSettings.whatsappEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {dentistSettings.whatsappEnabled && (
                      <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            value={ariPhone}
                            onChange={(e) => setAriPhone(e.target.value)}
                            placeholder="(63) 99234-9680"
                            className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-xs font-mono font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80] tabular-nums"
                          />
                        </div>
                        <button
                          onClick={() => {
                            updateSetting('phone', ariPhone);
                            handleSaveAriPhone(null as any);
                          }}
                          className="h-9 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Telefone</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Canal 3: Banner Flutuante na Tela (In-App Toast) */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">
                          Banner Flutuante no Topo da Tela
                        </span>
                        <p className="text-xs text-slate-500">
                          Aviso no topo do navegador com toque sonoro enquanto você usa a agenda.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('inAppBannerEnabled', !dentistSettings.inAppBannerEnabled)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.inAppBannerEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                          dentistSettings.inAppBannerEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: QUAIS EVENTOS CLÍNICOS VOCÊ QUER RECEBER */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#147A80]" />
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                      2. Quais Alertas Clínicos Você Deseja?
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-slate-400">Gatilhos</span>
                </div>

                <div className="space-y-3">
                  {/* Evento 1: Resumo Executivo Matinal */}
                  <div className="p-3 rounded-xl bg-teal-50/40 border border-teal-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                          <span>Resumo Executivo Matinal da Agenda (IA)</span>
                          <span className="text-[11px] font-semibold text-[#147A80]">
                            · Recomendado
                          </span>
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Síntese rápida dos pacientes do dia, horários de início/fim e procedimentos previstos.
                        </p>
                      </div>
                      <button
                        onClick={() => updateSetting('morningSummaryEnabled', !dentistSettings.morningSummaryEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                          dentistSettings.morningSummaryEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                            dentistSettings.morningSummaryEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {dentistSettings.morningSummaryEnabled && (
                      <div className="pt-2.5 mt-2 border-t border-teal-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">
                            Horário de Envio Matinal:
                          </span>
                          <span className="text-xs font-bold text-[#147A80] bg-white px-2 py-0.5 rounded border border-teal-200 tabular-nums">
                            {dentistSettings.morningSummaryTime || '07:30'}h
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto">
                          {['07:00', '07:30', '08:00', '08:30'].map((timeStr) => (
                            <button
                              key={timeStr}
                              type="button"
                              onClick={() => updateSetting('morningSummaryTime', timeStr)}
                              className={`h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer text-center tabular-nums ${
                                dentistSettings.morningSummaryTime === timeStr
                                  ? 'bg-[#147A80] text-white border-[#147A80]'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        Paciente Chegou na Recepção (Check-in)
                      </span>
                      <p className="text-xs text-slate-500">
                        Notificação imediata assim que a recepção confirmar a presença do paciente no consultório.
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting('patientArrivalEnabled', !dentistSettings.patientArrivalEnabled)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.patientArrivalEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                          dentistSettings.patientArrivalEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Evento 3: Síntese Clínica IA Pronta */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        Síntese Clínica IA Pronta
                      </span>
                      <p className="text-xs text-slate-500">
                        Alerta com o resumo da anamnese, histórico de tratamentos e cuidados cirúrgicos.
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting('aiSummaryReadyEnabled', !dentistSettings.aiSummaryReadyEnabled)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.aiSummaryReadyEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                          dentistSettings.aiSummaryReadyEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Evento 4: Encaixes e Cancelamentos */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        Encaixes ou Cancelamentos de Última Hora
                      </span>
                      <p className="text-xs text-slate-500">
                        Avise-me se um paciente desmarcar ou se houver um encaixe urgente para o mesmo dia.
                      </p>
                    </div>
                    <button
                      onClick={() => updateSetting('cancellationOrSlotEnabled', !dentistSettings.cancellationOrSlotEnabled)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                        dentistSettings.cancellationOrSlotEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                          dentistSettings.cancellationOrSlotEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: SOM, VIBRAÇÃO & TEMPOS */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#147A80]" />
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                      3. Som, Vibração e Duração
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-slate-400">Sensorial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Som Clínico */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Sinal Sonoro Suave</span>
                      <p className="text-[11px] text-slate-500">Carrilhão clínico harmonioso</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => notificationService.playNotificationSound()}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                        title="Ouvir som de teste"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateSetting('soundEnabled', !dentistSettings.soundEnabled)}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                          dentistSettings.soundEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                            dentistSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Vibração */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Vibração no Celular</span>
                      <p className="text-[11px] text-slate-500">Pulso tátil suave no aparelho</p>
                    </div>
                    <button
                      onClick={() => {
                        updateSetting('vibrationEnabled', !dentistSettings.vibrationEnabled);
                        notificationService.vibrate();
                      }}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                        dentistSettings.vibrationEnabled ? 'bg-[#147A80]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                          dentistSettings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Duração do Banner */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      Permanência do Aviso na Tela:
                    </span>
                    <span className="text-xs font-semibold text-[#147A80] tabular-nums">
                      {dentistSettings.bannerDurationSeconds === 0 ? 'Fixo até fechar (Sair ou ESC)' : `${dentistSettings.bannerDurationSeconds}s`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    {[
                      { sec: 0, label: 'Fixo (Sair / ESC)' },
                      { sec: 60, label: '60s (Longo)' },
                      { sec: 30, label: '30s' },
                      { sec: 15, label: '15s' },
                    ].map((opt) => (
                      <button
                        key={opt.sec}
                        type="button"
                        onClick={() => handleUpdateToastDuration(opt.sec)}
                        className={`h-8 px-1.5 rounded-lg text-[11px] font-semibold text-center border transition-colors cursor-pointer tabular-nums ${
                          dentistSettings.bannerDurationSeconds === opt.sec
                            ? 'bg-[#147A80] text-white border-[#147A80]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Recomendado: Fixo, permitindo ler com calma e fechar a qualquer momento pelo botão <strong>Sair</strong> ou tecla <strong>ESC</strong>.
                  </p>
                </div>
              </div>

              {/* BOTÃO PARA TESTAR NO CELULAR */}
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('test')}
                  className="w-full h-11 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Ir para Tela de Teste no Celular com {activeDentist?.Name}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MOBILE TESTING */}
          {activeTab === 'test' && (
            <div className="space-y-4 w-full max-w-full">
              {/* PASSO 1 CRÍTICO: AUTORIZAR NOTIFICAÇÕES NO IPHONE */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-colors ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        permissionStatus === 'granted'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#147A80] text-white'
                      }`}
                    >
                      {permissionStatus === 'granted' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {permissionStatus === 'granted'
                          ? 'App Ativo no iPhone (Ajustes > Notificações)'
                          : 'Passo 1 Obrigatório no iPhone: Autorizar Alertas'}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
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
                    className="mt-3 w-full h-10 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Toque Aqui para Ativar Notificações no iPhone</span>
                  </button>
                )}
              </div>

              {/* Active Countdown Warning - Hero Placement */}
              {countdownSeconds !== null && (
                <div className="p-3.5 rounded-xl bg-[#147A80] text-white flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Timer className="w-5 h-5 animate-spin shrink-0 text-white" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm tabular-nums">
                        BLOQUEIE A TELA AGORA! ({countdownSeconds}s)
                      </p>
                      <p className="text-xs text-teal-100 truncate">
                        O alerta chegará com som e vibração na tela desligada.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCountdownSeconds(null)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white font-semibold shrink-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* CARD 1: TESTE WEB PUSH NA TELA DE BLOQUEIO */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 border border-slate-800 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-teal-300 block">
                        Opção 1 · Push Nativo
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">
                        Alerta com Tela do Celular Bloqueada
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-teal-300 shrink-0">
                    Dr. Ari
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed tabular-nums">
                  Toque em um dos botões abaixo e <strong>bloqueie a tela do seu celular imediatamente</strong>. Em {testDelaySeconds}s o alerta nativo tocará na tela desligada:
                </p>

                {/* BOTÕES DE DISPARO DE TESTE NATIVO */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() =>
                      triggerScheduledNotification(
                        `Agenda de Hoje · ${selectedDentist?.Name || 'Dr. Claudio Borba'}`,
                        '4 atendimentos programados (08:00 às 15:30). 1º: Weliton Reis (Prótese) às 08:00. Toque para ver o resumo completo.',
                        'Resumo Diário',
                        testDelaySeconds,
                        undefined,
                        true
                      )
                    }
                    disabled={countdownSeconds !== null}
                    className="w-full h-11 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer tabular-nums"
                  >
                    <Timer className="w-4 h-4 shrink-0" />
                    <span>
                      {countdownSeconds !== null
                        ? `BLOQUEIE A TELA AGORA! (${countdownSeconds}s)`
                        : `Testar Push de Resumo Matinal da Agenda (em ${testDelaySeconds}s)`}
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      triggerScheduledNotification(
                        `Próximo Atendimento: ${selectedDentist?.Name || 'Dr. Claudio Borba'}`,
                        'Paciente Weliton Reis (Ajustes na prótese) aguardando na recepção. Resumo clínico da IA disponível.',
                        'Cirurgia',
                        testDelaySeconds
                      )
                    }
                    disabled={countdownSeconds !== null}
                    className="w-full h-10 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer tabular-nums"
                  >
                    <Bell className="w-4 h-4 text-teal-300 shrink-0" />
                    <span>Testar Alerta de Chegada do Paciente (em {testDelaySeconds}s)</span>
                  </button>
                </div>

                {/* CONTROLES DE TEMPO & PADRÕES */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Ajuste de Tempos e Padrões da Notificação
                    </span>
                  </div>

                  {/* Config 1 */}
                  <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-200 font-semibold">
                        Tempo de Exibição na Tela (Toast):
                      </span>
                      <span className="text-xs text-teal-300 font-semibold tabular-nums">
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
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold text-center border transition-colors cursor-pointer tabular-nums ${
                            toastDuration === opt.sec
                              ? 'bg-[#147A80] text-white border-[#147A80]'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dica: Ao passar o mouse ou encostar o dedo no aviso, ele <strong>pausa automaticamente</strong> para você ler com calma.
                    </p>
                  </div>

                  {/* Config 2 */}
                  <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-200 font-semibold">
                        Tempo para Bloquear Celular (Contagem):
                      </span>
                      <span className="text-xs text-teal-300 font-semibold tabular-nums">
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
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold text-center border transition-colors cursor-pointer tabular-nums ${
                            testDelaySeconds === opt.sec
                              ? 'bg-[#147A80] text-white border-[#147A80]'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Config 3 */}
                  <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-200 font-semibold">
                        Horário do Briefing Matinal no Dia a Dia:
                      </span>
                      <span className="text-xs text-teal-300 font-semibold tabular-nums">
                        {morningBriefingTime}h
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1 w-full">
                      {['07:00', '07:30', '08:00', '08:30'].map((timeStr) => (
                        <button
                          key={timeStr}
                          type="button"
                          onClick={() => handleUpdateBriefingTime(timeStr)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center border transition-colors cursor-pointer tabular-nums ${
                            morningBriefingTime === timeStr
                              ? 'bg-[#147A80] text-white border-[#147A80]'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          {timeStr}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Em produção, o servidor envia o Push automaticamente neste horário todos os dias, antes do dentista sair de casa.
                    </p>
                  </div>
                </div>

                {/* Botão de Disparo Imediato */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Quer ver o alerta de imediato?</span>
                  <button
                    onClick={() =>
                      triggerNotification(
                        'Teste Imediato: Dr. Ari Bertuol',
                        'Alerta de paciente na recepção enviado para o Dr. Ari Bertuol com sucesso!',
                        'Sistema'
                      )
                    }
                    className="h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Disparar Agora
                  </button>
                </div>

                {/* Link do PWA no celular */}
                <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <span className="block text-[11px] text-slate-400 font-semibold">
                    Para testar no celular fora do preview (PWA):
                  </span>
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="font-mono text-[11px] text-teal-200 truncate min-w-0 flex-1">
                      {mobileAppUrl}
                    </span>
                    <button
                      onClick={handleCopyMobileLink}
                      className="px-2.5 py-1 rounded-md bg-[#147A80] hover:bg-[#0f5c61] text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedMobileLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedMobileLink ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    * No iPhone: abra no Safari e toque em <strong>&ldquo;Compartilhar &gt; Adicionar à Tela de Início&rdquo;</strong>. No Android: abra no Chrome e toque em <strong>Permitir</strong>.
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
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 font-mono break-words">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                    Mensagem que chegará no seu WhatsApp:
                  </span>
                  &ldquo;<strong>Bertuol Odontologia</strong>: Olá Dr. Ari Bertuol! Seu paciente Marcos Vinicius (Cirurgia e Implante) fez check-in na recepção. O resumo clínico da IA já está no app.&rdquo;
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 flex-1 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Abrir WhatsApp com o Alerta</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleSendViaApi}
                    disabled={isSendingApi}
                    className="h-10 px-4 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isSendingApi ? 'Disparando...' : 'Testar via API'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: SOM CLÍNICO & BANNER FLUTUANTE */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                <div className="min-w-0">
                  <h5 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#147A80] shrink-0" />
                    <span>Sinal Sonoro Clínico & Banner Flutuante</span>
                  </h5>
                  <p className="text-xs text-slate-500">
                    Toque para ouvir o carrilhão e testar a notificação flutuante na tela.
                  </p>
                </div>

                <button
                  onClick={() => {
                    notificationService.playNotificationSound();
                    triggerNotification(
                      'Paciente na Recepção: Marcos Vinicius',
                      'Check-in realizado para Cirurgia de Implante às 09:30.',
                      'Recepção'
                    );
                  }}
                  className="h-9 px-4 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0 text-center"
                >
                  Ouvir Som & Ver Banner
                </button>
              </div>
            </div>
          )}
          {activeTab === 'simulation' && (
            <div className="space-y-4">
              {/* Audience Selector: Patient vs Dentist */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setTargetAudience('patient')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    targetAudience === 'patient'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#147A80]" />
                  Simular Celular do Cliente / Paciente
                </button>
                <button
                  onClick={() => setTargetAudience('dentist')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    targetAudience === 'dentist'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#147A80]" />
                  Simular Celular do Dentista
                </button>
              </div>

              {/* Status & Sound Chime Header */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <Smartphone className="w-4 h-4 text-[#147A80] shrink-0" />
                  <span>
                    {targetAudience === 'patient'
                      ? 'Simulador de Notificações e Lembretes de Consulta para Pacientes.'
                      : 'Simulador de Alertas de Atendimento e Resumo IA para o Dentista.'}
                  </span>
                </div>
                <button
                  onClick={() => notificationService.playNotificationSound()}
                  title="Testar sinal sonoro clínico"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[#147A80] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Ouvir Som
                </button>
              </div>

              {/* Active Countdown Warning */}
              {countdownSeconds !== null && (
                <div className="p-3.5 rounded-xl bg-[#147A80] text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Timer className="w-5 h-5 animate-spin" />
                    <div>
                      <p className="font-bold text-xs sm:text-sm tabular-nums">
                        Disparo programado em {countdownSeconds} segundo{countdownSeconds !== 1 ? 's' : ''}!
                      </p>
                      <p className="text-xs text-teal-100">
                        Bloqueie a tela do celular ou minimize esta janela agora para ver o alerta chegar.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCountdownSeconds(null)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-semibold cursor-pointer"
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
                    <span className="text-xs font-semibold text-slate-600 block mb-2">
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
                            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-teal-50/70 border-[#147A80] ring-2 ring-[#147A80]/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${sc.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-[#147A80] block">
                                {sc.badge}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 block truncate">
                                {sc.title.replace('Bertuol Odontologia: ', '')}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Smartphone Lockscreen Mockup Preview */}
                  <div className="w-full">
                    <span className="text-xs font-semibold text-slate-600 block mb-2">
                      2. Visualização na Tela de Bloqueio do Celular:
                    </span>
                    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-sm rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-black p-4 text-white shadow-xl border border-slate-700 overflow-hidden">
                      {/* Dynamic Island / Notch */}
                      <div className="w-24 h-3.5 bg-black rounded-full mx-auto mb-2.5 border border-slate-800" />

                      {/* Mockup Lockscreen Clock */}
                      <div className="text-center py-2">
                        <div className="text-4xl font-extralight tracking-tight tabular-nums">09:41</div>
                        <div className="text-[11px] text-slate-300 font-medium capitalize">
                          {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </div>
                      </div>

                      {/* Notification Card */}
                      <div className="mt-3 bg-white/95 backdrop-blur-md text-slate-900 rounded-xl p-3.5 shadow-xl border border-white/20 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-md bg-[#147A80] flex items-center justify-center text-white text-[9px] font-bold">
                              B
                            </div>
                            <span className="font-bold tracking-tight text-slate-800">
                              BERTUOL ODONTOLOGIA
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">agora</span>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-950 leading-snug">
                            {patientScenarios[selectedPatientScenario].title}
                          </h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                            {patientScenarios[selectedPatientScenario].body}
                          </p>
                        </div>
                      </div>

                      {/* Lockscreen Action hints */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 mt-4 pt-1 border-t border-slate-800">
                        <span>Deslize para ver</span>
                        <span>Toque para abrir</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Action Buttons for Patient Notification */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-slate-600 block">
                      3. Disparar Simulação:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const sc = patientScenarios[selectedPatientScenario];
                          triggerNotification(sc.title, sc.body, sc.category);
                        }}
                        className="h-10 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        Disparar Agora
                      </button>

                      <button
                        onClick={() => {
                          const sc = patientScenarios[selectedPatientScenario];
                          triggerScheduledNotification(sc.title, sc.body, sc.category, 5);
                        }}
                        className="h-10 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        title="Dá 5 segundos para você bloquear a tela do celular ou mudar de janela"
                      >
                        <Timer className="w-4 h-4 text-teal-300" />
                        Em 5s (Bloquear Tela)
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          patientScenarios[selectedPatientScenario].whatsappText
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
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
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <span className="text-xs font-semibold text-slate-600">
                      Alertas para o Consultório ({selectedDentist?.Name || 'Dentista'}):
                    </span>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-[#147A80]" />
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">
                              Lembrete de Início de Consulta (15 min antes)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Horário, paciente e procedimento
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={dentistSettings.cancellationOrSlotEnabled}
                          onChange={(e) => updateSetting('cancellationOrSlotEnabled', e.target.checked)}
                          className="w-4 h-4 accent-[#147A80] rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-[#147A80]" />
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">
                              Resumo Clínico da IA Gerado
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Síntese com pontos críticos pronta
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={dentistSettings.aiSummaryReadyEnabled}
                          onChange={(e) => updateSetting('aiSummaryReadyEnabled', e.target.checked)}
                          className="w-4 h-4 accent-[#147A80] rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block">
                              Paciente Chegou na Recepção (Check-in)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Gatilho imediato da recepção/Clinicorp
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={dentistSettings.patientArrivalEnabled}
                          onChange={(e) => updateSetting('patientArrivalEnabled', e.target.checked)}
                          className="w-4 h-4 accent-[#147A80] rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Immediate push notifications for Dentist */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Disparar Alertas no Aparelho do Dentista:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            'Próximo Atendimento às 09:30',
                            'Paciente: Marcos Vinicius (Ortodontia) - Instalação de Alinhadores. Toque para ver o resumo clínico com IA.',
                            'Ortodontia',
                            0,
                            202
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-[#147A80] text-left transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">
                            Lembrete de Consulta (15m)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Avisa antes de começar a consulta
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-slate-400 group-hover:text-[#147A80] shrink-0 ml-2" />
                      </button>

                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            'Resumo IA Pronto: Fernanda Paiva',
                            'Pontos de atenção: Checar adaptação do arco superior e sensibilidade dentinária relatada.',
                            'Ortodontia',
                            0,
                            201
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-[#147A80] text-left transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">
                            Alerta de Resumo IA
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Síntese executiva gerada
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-slate-400 group-hover:text-[#147A80] shrink-0 ml-2" />
                      </button>

                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            'Paciente Aguardando na Recepção',
                            'Carlos Alberto Mendes acabou de fazer check-in na recepção para Endodontia.',
                            'Endodontia',
                            0,
                            203
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-[#147A80] text-left transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">
                            Check-in na Recepção
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Aviso em tempo real Clinicorp
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-slate-400 group-hover:text-[#147A80] shrink-0 ml-2" />
                      </button>

                      <button
                        onClick={() =>
                          triggerScheduledNotification(
                            'Briefing Matinal: 4 Pacientes Hoje',
                            'Primeira consulta às 08:00 com Fernanda Paiva. 2 resumos clínicos já estão sintetizados.',
                            'Geral',
                            0
                          )
                        }
                        className="p-3 rounded-xl bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-[#147A80] text-left transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">
                            Briefing Matinal
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Agenda consolidada do dia
                          </span>
                        </div>
                        <Send className="w-4 h-4 text-slate-400 group-hover:text-[#147A80] shrink-0 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback toast message com botão Sair / ESC */}
              {lastDispatched && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Notificação disparada: &ldquo;{lastDispatched}&rdquo;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      ESC ou clique em Sair
                    </span>
                    <button
                      type="button"
                      onClick={() => setLastDispatched(null)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3 text-rose-500" />
                      <span>Sair (Esc)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-900 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#147A80]" />
                  Fluxo de Produção: Clinicorp &rarr; FCM &rarr; Smartphone
                </h4>
                <p className="text-slate-600 text-xs">
                  Para que o dentista receba notificações mesmo com a tela do celular desligada no bolso:
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-teal-50 text-[#147A80] font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                      1
                    </span>
                    <div>
                      <strong className="block text-xs text-slate-900">
                        Registro do Token (FCM)
                      </strong>
                      <span className="text-slate-600 text-xs">
                        Ao logar no Flutter ou PWA, o dispositivo gera um token FCM único e grava no banco na tabela <code className="bg-slate-100 px-1 py-0.5 rounded">dentists.fcm_token</code>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-teal-50 text-[#147A80] font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                      2
                    </span>
                    <div>
                      <strong className="block text-xs text-slate-900">
                        Gatilho do Webhook do Clinicorp
                      </strong>
                      <span className="text-slate-600 text-xs">
                        Quando há novo agendamento, reagendamento ou check-in na recepção, o Clinicorp envia um webhook HTTP com <code className="bg-slate-100 px-1 py-0.5 rounded">Dentist_PersonId</code>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-teal-50 text-[#147A80] font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                      3
                    </span>
                    <div>
                      <strong className="block text-xs text-slate-900">
                        Disparo com Alta Prioridade no Firebase
                      </strong>
                      <span className="text-slate-600 text-xs">
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
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#147A80]" />
                    Implementação no Flutter (Service FCM):
                  </span>
                  <button
                    onClick={() => handleCopyCode(FLUTTER_FCM_CODE, 'flutter')}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium cursor-pointer"
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
                <pre className="bg-slate-900 text-teal-100 text-xs font-mono p-3.5 rounded-xl overflow-x-auto max-h-[200px] leading-relaxed">
                  {FLUTTER_FCM_CODE}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    Disparo no Backend (Node.js / Supabase Edge Function):
                  </span>
                  <button
                    onClick={() => handleCopyCode(BACKEND_DISPATCH_CODE, 'backend')}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium cursor-pointer"
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
                <pre className="bg-slate-900 text-teal-100 text-xs font-mono p-3.5 rounded-xl overflow-x-auto max-h-[200px] leading-relaxed">
                  {BACKEND_DISPATCH_CODE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Bertuol Odontologia · Notificações Ativas
          </span>
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
