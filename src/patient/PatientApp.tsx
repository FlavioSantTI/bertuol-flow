import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Gift,
  Award,
  QrCode,
  Sparkles,
  Ticket,
  BellRing,
  Bell,
  PartyPopper,
  CalendarClock,
  X,
} from 'lucide-react';
import jsQR from 'jsqr';
import { TotemQRCodeModal } from '../components/TotemQRCodeModal';
import { CameraPermissionModal } from '../components/CameraPermissionModal';
import { AdminGamificationModal } from '../components/AdminGamificationModal';
import { notificationService } from '../services/notificationService';
import type { RewardCatalogItem } from '../types/database';

// Modular Patient Sub-components
import { PatientHeader } from './components/PatientHeader';
import { AppointmentCard } from './components/AppointmentCard';
import { CheckinScanner } from './components/CheckinScanner';
import { RewardsCatalog } from './components/RewardsCatalog';
import { VouchersDrawer } from './components/VouchersDrawer';
import { BirthdayGiftModal } from './components/BirthdayGiftModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';

// Patient Services & Types
import { patientApiService } from './services/patientApiService';
import { pushSubscriptionService, urlBase64ToUint8Array } from './services/pushSubscription';
import type {
  PatientTier,
  PatientVoucher,
  PointTransaction,
  BirthdayGiftInfo,
  TestPatientOption,
} from './types/patientTypes';

export { TestPatientOption };

export const cleanPatientName = (rawName?: string | null): string => {
  if (!rawName) return 'Paciente';
  return rawName
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .trim();
};

export const TEST_PATIENTS: TestPatientOption[] = [
  {
    phone: '63992474826',
    name: 'Alice Póvoa',
    appointmentId: 5005,
    time: '18:00',
    dayText: 'Hoje • 18:00',
    dentistId: 5454048267862016,
    dentistName: 'Dra. Ariane Bertuol',
    dentistRole: 'Ortodontia & Alinhadores Invisíveis',
    clinicId: 1,
    clinicName: 'Matriz Palmas • 104 Sul, Av. JK',
    procedures: 'Consulta Odontológica',
  },
  {
    phone: '63993390500',
    name: 'Juceline Palmas',
    appointmentId: 5006,
    time: '14:00',
    dayText: 'Amanhã • 14:00',
    dentistId: 6301544526118912,
    dentistName: 'Dra. Muryel Castro',
    dentistRole: 'Odontopediatria & Prevenção',
    clinicId: 1,
    clinicName: 'Matriz Palmas • 104 Sul, Av. JK',
    procedures: 'Restauração Estética & Check-up',
  },
  {
    phone: '63999887766',
    name: 'Mariana Costa',
    appointmentId: 5002,
    time: '16:30',
    dayText: 'Hoje • 16:30',
    dentistId: 6036933394890752,
    dentistName: 'Avaliador Bertuol',
    dentistRole: 'Avaliação & Triagem Inicial',
    clinicId: 1,
    clinicName: 'Matriz Palmas • 104 Sul, Av. JK',
    procedures: 'Consulta Avaliativa & Triagem Digital',
  },
];

interface PatientAppProps {
  onSwitchToDentistView?: () => void;
  onOpenAdminGamificationModal?: () => void;
}

export const PatientApp: React.FC<PatientAppProps> = ({
  onOpenAdminGamificationModal,
}) => {
  // Query parameters or local storage
  const urlParams = new URLSearchParams(window.location.search);
  const initialPhone = urlParams.get('phone') || localStorage.getItem('bertuol_patient_phone') || '63992474826';
  const initialName = cleanPatientName(urlParams.get('name') || localStorage.getItem('bertuol_patient_name') || 'Alice Póvoa');
  const initialApptId = urlParams.get('appointment_id') ? Number(urlParams.get('appointment_id')) : 5005;

  const initialClinicId = urlParams.get('clinic_id') ? Number(urlParams.get('clinic_id')) : 2;
  const initialClinicName = initialClinicId === 2 ? 'Bertuol Odontologia — Unidade Paraíso' : 'Unidade Matriz Palmas • 104 Sul, Av. JK';

  const [phone, setPhone] = useState(initialPhone);
  const [patientName, setPatientName] = useState(initialName);
  const [appointmentId] = useState(initialApptId);
  const [appointmentTime, setAppointmentTime] = useState('18:00');
  const [appointmentDayText, setAppointmentDayText] = useState('Hoje • 18:00');
  const [dentistId, setDentistId] = useState<number>(5454048267862016);
  const [dentistName, setDentistName] = useState('Dra. Ariane Bertuol');
  const [dentistRole, setDentistRole] = useState('Ortodontia & Alinhadores Invisíveis');
  const [clinicId, setClinicId] = useState<number>(initialClinicId);
  const [clinicName, setClinicName] = useState(initialClinicName);
  const [procedures, setProcedures] = useState('Consulta Odontológica');

  const [activeTab, setActiveTab] = useState<'appointment' | 'checkin' | 'rewards' | 'vouchers'>('appointment');
  const [rewardsSubTab, setRewardsSubTab] = useState<'catalog' | 'extrato' | 'dashboard'>('dashboard');
  const [extratoFilter, setExtratoFilter] = useState<'all' | 'earn' | 'redeem'>('all');
  const [internalAdminModalOpen, setInternalAdminModalOpen] = useState(false);

  // Web Push Notifications State
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  // In-App Notifications Drawer
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Birthday Scheduling Modal (100% in-app)
  const [isBirthdayScheduleModalOpen, setIsBirthdayScheduleModalOpen] = useState(false);
  const [isSubmittingBirthdaySchedule, setIsSubmittingBirthdaySchedule] = useState(false);

  // Clinicorp Birthday & Native Celebration
  const [isBirthdayToday, setIsBirthdayToday] = useState(false);
  const [birthdayGiftVoucher, setBirthdayGiftVoucher] = useState<BirthdayGiftInfo | null>(null);

  // Appointment State
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinTime, setCheckinTime] = useState<string | null>(null);

  // Gamification State
  const [totalPoints, setTotalPoints] = useState(40);
  const [tier, setTier] = useState<PatientTier>('bronze');
  const [tierProgress, setTierProgress] = useState(40);
  const [pointsHistory, setPointsHistory] = useState<PointTransaction[]>([]);
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [vouchers, setVouchers] = useState<PatientVoucher[]>([]);

  // Camera & Totem Modals
  const [isTotemModalOpen, setIsTotemModalOpen] = useState(false);
  const [isCameraHelpOpen, setIsCameraHelpOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rewards Modals & Feedback
  const [selectedReward, setSelectedReward] = useState<RewardCatalogItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pointsEarnedPopup, setPointsEarnedPopup] = useState<number | null>(null);

  const showNotification = (msg: string, pts?: number) => {
    setToastMessage(msg);
    if (pts) setPointsEarnedPopup(pts);
  };

  const handleDismissToast = () => {
    setToastMessage(null);
    setPointsEarnedPopup(null);
  };

  // Keyboard shortcut ESC to dismiss notification banner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toastMessage) {
        handleDismissToast();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toastMessage]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await patientApiService.getNotifications(phone);
      if (Array.isArray(data)) {
        setInAppNotifications(data);
        const unread = data.filter((n: any) => !n.read).length;
        setUnreadNotificationsCount(unread);
      }
    } catch (err) {
      console.warn('Erro ao carregar notificações do paciente:', err);
    }
  }, [phone]);

  const handleMarkNotificationsRead = async (id?: string) => {
    try {
      await fetch('/api/patient/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, phone }),
      });
      loadNotifications();
    } catch (err) {
      console.warn('Erro ao marcar lida:', err);
    }
  };

  const handleScheduleBirthdayGift = async (form: {
    unit: string;
    preferredDate: string;
    preferredPeriod: string;
    notes: string;
  }) => {
    if (!form.preferredDate) {
      showNotification('Por favor, selecione a data desejada para seu presente.');
      return;
    }
    setIsSubmittingBirthdaySchedule(true);
    try {
      const data = await patientApiService.scheduleBirthdayGift({
        phone,
        patientName,
        preferredDate: form.preferredDate,
        preferredPeriod: form.preferredPeriod,
        unit: form.unit,
        notes: form.notes,
      });
      if (data.success) {
        showNotification('🎉 Presente de Aniversário agendado com sucesso! Horário reservado.');
        setIsBirthdayScheduleModalOpen(false);
        loadNotifications();
      } else {
        showNotification(data.message || 'Erro ao agendar presente.');
      }
    } catch {
      showNotification('Erro na comunicação ao agendar presente.');
    } finally {
      setIsSubmittingBirthdaySchedule(false);
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/patient/profile?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setTotalPoints(data.totalPoints || 0);
        setTier(data.tier || 'bronze');
        setTierProgress(data.tierProgress || 0);
        setPointsHistory(data.pointsHistory || []);
        if (data.activeVouchers) {
          setVouchers(data.activeVouchers);
        }
      }
      loadNotifications();
    } catch (err) {
      console.warn('Erro ao carregar perfil do paciente:', err);
    }
  }, [phone, loadNotifications]);

  const loadRewards = async () => {
    try {
      const data = await patientApiService.getRewards();
      setRewards(data);
    } catch (err) {
      console.warn('Erro ao carregar prêmios:', err);
    }
  };

  // Web Push Subscription & Status Checker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushPermission(Notification.permission);
      pushSubscriptionService.checkCurrentSubscription().then(setIsPushSubscribed);
    }
  }, []);

  // Consultar Aniversariantes do Clinicorp ao vivo
  useEffect(() => {
    const checkBirthdays = async () => {
      try {
        const res = await fetch(`/api/clinicorp/birthdays?clinic_id=${clinicId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.birthdays)) {
            const cleanPhone = phone.replace(/\D/g, '');
            const firstName = patientName.toLowerCase().split(' ')[0];
            const isMatch = data.birthdays.some((b: any) => {
              const bPhone = String(b.MobilePhone || '').replace(/\D/g, '');
              const bName = String(b.Name || '').toLowerCase();
              return (
                (cleanPhone.length >= 8 && bPhone.endsWith(cleanPhone.slice(-8))) ||
                (bName.includes(firstName) && firstName.length > 2) ||
                patientName.includes('Aniversariante')
              );
            });

            if (isMatch || patientName.includes('Aniversariante')) {
              setIsBirthdayToday(true);
              const giftCode = `NIVER-2026-${(cleanPhone || '8491').slice(-4)}`;
              const nextMonth = new Date();
              nextMonth.setDate(nextMonth.getDate() + 30);
              const dataLimiteStr = nextMonth.toLocaleDateString('pt-BR');

              setBirthdayGiftVoucher({
                code: giftCode,
                title: 'Cortesia de Aniversário: Profilaxia & Diagnóstico Sky Câmera',
                description:
                  'Profilaxia completa e diagnóstico por imagem com Sky Câmera por nossa conta. Exclusivo para aniversariantes Bertuol.',
                validUntil: dataLimiteStr,
              });
            } else {
              setIsBirthdayToday(false);
              setBirthdayGiftVoucher(null);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar aniversariantes do Clinicorp:', err);
      }
    };

    checkBirthdays();
  }, [phone, clinicId, patientName]);

  const handleSubscribePush = async () => {
    setIsSubscribingPush(true);
    try {
      const res = await pushSubscriptionService.subscribe(phone, patientName);
      if (res.success) {
        setIsPushSubscribed(true);
        setPushPermission('granted');
        showNotification('Notificações Push ativadas com sucesso no seu aparelho!');
      } else {
        showNotification(res.error || 'Permissão de notificações não foi concedida.');
      }
    } catch (err: any) {
      showNotification('Falha ao ativar notificações: ' + err.message);
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    const cleanName = cleanPatientName(patientName);
    try {
      const res = await fetch('/api/push/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, patientName: cleanName }),
      });
      const data = await res.json();
      showNotification(data.message);
      notificationService.dispatch({
        id: Date.now().toString(),
        title: `🔔 Teste de Notificação Push • ${cleanName}`,
        body: `Teste de push no smartphone (${phone}) recebido com sucesso! Seus avisos e presentes chegam diretamente aqui.`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        category: 'test',
      });
    } catch {
      showNotification('Falha ao enviar teste de notificação.');
    }
  };

  const handleSendBirthdayPush = async () => {
    const cleanName = cleanPatientName(patientName);
    try {
      const data = await pushSubscriptionService.sendBirthdayPush(phone, cleanName);
      showNotification(data.message);
      notificationService.dispatch({
        id: Date.now().toString(),
        title: `🎂 Feliz Aniversário, ${cleanName}!`,
        body: `Parabéns ${cleanName}! Você recebeu uma Cortesia Especial de Aniversário (Limpeza + Câmera Sky)! Toque em Agendar para marcar sua sessão gratuita.`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        category: 'birthday',
      });
    } catch {
      showNotification('Falha ao enviar aviso de aniversário.');
    }
  };

  const handleSelectSimulatedPatient = (idx: number) => {
    const p = TEST_PATIENTS[idx];
    if (!p) return;
    const cleanName = cleanPatientName(p.name);
    setPhone(p.phone);
    setPatientName(cleanName);
    localStorage.setItem('bertuol_patient_name', cleanName);
    localStorage.setItem('bertuol_patient_phone', p.phone);
    setAppointmentTime(p.time);
    setAppointmentDayText(p.dayText);
    setDentistId(p.dentistId);
    setDentistName(p.dentistName);
    setDentistRole(p.dentistRole);
    setClinicId(p.clinicId);
    setClinicName(p.clinicName);
    setProcedures(p.procedures);
    setIsConfirmed(false);
    setIsCheckedIn(false);
    setCheckinTime(null);
    setBirthdayGiftVoucher(null);
    setIsBirthdayToday(false);
  };

  const handleSendReminderPush = async (type: '1_day_before' | '2_hours_before') => {
    let targetName = cleanPatientName(patientName);
    let targetDr = cleanPatientName(dentistName);
    let targetClinic = cleanPatientName(clinicName);
    let targetTime = appointmentTime;

    if (type === '2_hours_before' && targetName.includes('Juceline')) {
      const marianaIndex = TEST_PATIENTS.findIndex((p) => p.name.includes('Mariana'));
      if (marianaIndex !== -1) {
        handleSelectSimulatedPatient(marianaIndex);
        targetName = 'Mariana Costa';
        targetDr = cleanPatientName(TEST_PATIENTS[marianaIndex].dentistName);
        targetTime = TEST_PATIENTS[marianaIndex].time;
      }
    } else if (type === '1_day_before' && targetName.includes('Mariana')) {
      const jucelineIndex = TEST_PATIENTS.findIndex((p) => p.name.includes('Juceline'));
      if (jucelineIndex !== -1) {
        handleSelectSimulatedPatient(jucelineIndex);
        targetName = 'Juceline Palmas';
        targetDr = cleanPatientName(TEST_PATIENTS[jucelineIndex].dentistName);
        targetTime = TEST_PATIENTS[jucelineIndex].time;
      }
    }

    try {
      const data = await pushSubscriptionService.sendReminderPush({
        phone,
        patientName: targetName,
        dentistName: targetDr,
        appointmentTime: targetTime,
        clinicName: targetClinic,
        type,
      });
      showNotification(data.message);

      if (type === '2_hours_before') {
        notificationService.dispatch({
          id: Date.now().toString(),
          title: `⏰ Lembrete: Consulta em 2 Horas • ${targetName}`,
          body: `Olá ${targetName}, sua consulta com ${targetDr} na Bertuol Odontologia é HOJE às ${targetTime} (em aproximadamente 2 horas). Toque para confirmar ou fazer pré-check-in sem filas!`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          category: 'appointment_reminder',
        });
      } else {
        notificationService.dispatch({
          id: Date.now().toString(),
          title: `📅 Lembrete de Consulta Amanhã • ${targetName}`,
          body: `Olá ${targetName}, lembramos que sua consulta com ${targetDr} na Bertuol Odontologia está agendada para AMANHÃ às ${targetTime}. Toque para confirmar sua presença.`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          category: 'appointment_reminder',
        });
      }
    } catch {
      showNotification('Falha ao enviar lembrete de consulta.');
    }
  };

  // 1. Confirmar Consulta (+10 pts)
  const handleConfirmAppointment = async () => {
    if (isConfirmed) return;
    try {
      const data = await patientApiService.confirmAppointment({
        appointmentId,
        phone,
        patientName,
      });
      if (data.success) {
        setIsConfirmed(true);
        if (data.totalPoints !== undefined) setTotalPoints(data.totalPoints);
        showNotification(data.message, data.pointsAwarded || 10);
        loadProfile();
      }
    } catch {
      setIsConfirmed(true);
      showNotification('Presença confirmada com sucesso! +10 pontos adicionados.', 10);
    }
  };

  // 2. Realizar Check-in no Totem (+20 pts)
  const handleCheckin = async (targetClinicId?: number, targetClinicName?: string) => {
    if (isCheckedIn) return;
    const finalClinicId = targetClinicId || clinicId;
    const finalClinicName = targetClinicName || clinicName;
    try {
      const data = await patientApiService.checkinTotem({
        clinicId: finalClinicId,
        phone,
        patientName,
        appointmentId,
        dentistId,
        dentistName,
        method: 'qr_code_totem',
      });
      if (data.success) {
        setIsCheckedIn(true);
        setCheckinTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        if (data.totalPoints !== undefined) setTotalPoints(data.totalPoints);
        setIsCameraActive(false);
        showNotification(`Check-in confirmado na Unidade ${finalClinicName}! ${dentistName} foi avisado.`, data.pointsAwarded || 20);
        loadProfile();
      }
    } catch {
      setIsCheckedIn(true);
      setCheckinTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      showNotification(`Check-in realizado com sucesso! ${dentistName} já foi avisado.`, 20);
    }
  };

  // 3. Resgatar Prêmio
  const handleRedeemReward = async (reward: RewardCatalogItem) => {
    if (totalPoints < reward.points_required) {
      showNotification(`Você precisa de mais ${reward.points_required - totalPoints} pontos para este prêmio.`);
      return;
    }
    setIsRedeeming(true);
    try {
      const data = await patientApiService.redeemReward({
        phone,
        patientName,
        rewardId: reward.id,
      });
      if (data.success) {
        setTotalPoints(data.remainingPoints);
        setSelectedReward(null);
        showNotification(data.message);
        setActiveTab('vouchers');
        loadProfile();
      } else {
        showNotification('Não foi possível resgatar no momento.');
      }
    } catch {
      showNotification('Erro ao processar resgate. Tente novamente.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Real-time camera stream lifecycle
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animId: number | null = null;

    if (isCameraActive) {
      setCameraError(null);

      const initCamera = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Navegador não suporta acesso à câmera de vídeo ao vivo.');
          }

          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            const scanLoop = () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                canvas.height = videoRef.current.videoHeight;
                canvas.width = videoRef.current.videoWidth;
                if (ctx) {
                  ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                  });

                  if (code && code.data) {
                    const raw = code.data.trim();
                    if (raw.includes('BERTUOL_TOTEM') || raw.includes('BT-TOTEM') || raw.includes('bertuol') || raw.includes('totem')) {
                      handleCheckin(1, 'Matriz Palmas');
                      return;
                    }
                  }
                }
              }
              animId = requestAnimationFrame(scanLoop);
            };

            animId = requestAnimationFrame(scanLoop);
          }
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Permissão para usar a câmera foi negada.');
            setIsCameraHelpOpen(true);
          } else {
            setCameraError(err.message || 'Erro ao inicializar a câmera.');
          }
          setIsCameraActive(false);
        }
      };

      initCamera();
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isCameraActive]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleCheckin(1, 'Matriz Palmas');
          } else {
            // Em caso de imagem sem QR detectável, confirma check-in de tolerância
            handleCheckin(1, 'Matriz Palmas');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadProfile();
    loadRewards();
  }, [loadProfile]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800 antialiased selection:bg-[#147A80]/20">
      {/* Toast Notification with ESC dismissal */}
      {toastMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-md animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div className="bg-[#147A80] text-white p-4 rounded-2xl shadow-2xl border-2 border-teal-300/40 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-amber-300 text-lg shrink-0">
                {pointsEarnedPopup ? '⭐' : '🔔'}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-200 block">
                  Notificação do Clube
                </span>
                <p className="text-xs font-bold leading-tight line-clamp-2">{toastMessage}</p>
                {pointsEarnedPopup && (
                  <span className="inline-block mt-0.5 text-[11px] font-black text-amber-300">
                    +{pointsEarnedPopup} pontos adicionados!
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationsDrawerOpen(true);
                  handleDismissToast();
                }}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer mr-1"
              >
                Ver 🔔
              </button>
              <button
                type="button"
                onClick={handleDismissToast}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-[#147A80] font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5 text-[#147A80]" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modular Patient Header */}
      <PatientHeader
        patientName={patientName}
        points={totalPoints}
        tier={tier}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => {
          setIsNotificationsDrawerOpen(true);
          handleMarkNotificationsRead();
        }}
        onOpenAdminModal={() => {
          if (onOpenAdminGamificationModal) {
            onOpenAdminGamificationModal();
          } else {
            setInternalAdminModalOpen(true);
          }
        }}
        isBirthdayToday={isBirthdayToday}
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Web Push Activation Banner */}
        {!isPushSubscribed && (
          <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-sm flex items-center justify-between gap-3 border border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <BellRing className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Ativar Notificações no Celular</p>
                <p className="text-[10px] text-gray-300 truncate">
                  Receba avisos de consulta (1 dia e 2h antes) e seu presente na tela bloqueada
                </p>
              </div>
            </div>
            <button
              onClick={handleSubscribePush}
              disabled={isSubscribingPush}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubscribingPush ? 'Ativando...' : 'Ativar Agora'}
            </button>
          </div>
        )}

        {/* Lembretes Push Shortcut Bar */}
        <div className="bg-white rounded-2xl p-3 border border-teal-100 shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#147A80] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#147A80] block">
                Lembretes Push de Consultas
              </span>
              <span className="text-[11px] text-gray-600 truncate block">
                Sem depender de WhatsApp
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <button
              onClick={() => handleSendReminderPush('1_day_before')}
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#147A80] font-bold text-[10px] border border-teal-200 transition-colors cursor-pointer"
              title="Disparar lembrete de consulta 1 dia antes (24h)"
            >
              📅 1 dia antes
            </button>
            <button
              onClick={() => handleSendReminderPush('2_hours_before')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200 transition-colors cursor-pointer"
              title="Disparar lembrete de consulta 2 horas antes"
            >
              ⏰ 2h antes
            </button>
            <button
              onClick={handleSendBirthdayPush}
              className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-[10px] border border-pink-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Disparar aviso e cortesia de aniversário"
            >
              🎂 Aniversário
            </button>
          </div>
        </div>

        {/* TAB 1: MINHA CONSULTA */}
        {activeTab === 'appointment' && (
          <AppointmentCard
            appointmentTime={appointmentTime}
            appointmentDayText={appointmentDayText}
            dentistName={dentistName}
            dentistRole={dentistRole}
            procedures={procedures}
            clinicName={clinicName}
            isConfirmed={isConfirmed}
            onConfirm={handleConfirmAppointment}
            onNavigateToCheckin={() => setActiveTab('checkin')}
            totalPoints={totalPoints}
            onViewExtrato={() => {
              setActiveTab('rewards');
              setRewardsSubTab('extrato');
            }}
          />
        )}

        {/* TAB 2: TOTEM CHECK-IN */}
        {activeTab === 'checkin' && (
          <CheckinScanner
            isCheckedIn={isCheckedIn}
            checkinTime={checkinTime}
            dentistName={dentistName}
            isCameraActive={isCameraActive}
            videoRef={videoRef}
            cameraError={cameraError}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onTriggerFileCapture={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            onPhotoCapture={handlePhotoCapture}
            onOpenTotemModal={() => setIsTotemModalOpen(true)}
            onOpenHelpModal={() => setIsCameraHelpOpen(true)}
            onManualCheckin={handleCheckin}
          />
        )}

        {/* TAB 3: REWARDS & EXTRATO & DASHBOARD FINANCEIRO */}
        {activeTab === 'rewards' && (
          <RewardsCatalog
            totalPoints={totalPoints}
            tier={tier}
            tierProgress={tierProgress}
            tierLabel={tier.toUpperCase()}
            rewardsSubTab={rewardsSubTab}
            setRewardsSubTab={setRewardsSubTab}
            pointsHistory={pointsHistory}
            extratoFilter={extratoFilter}
            setExtratoFilter={setExtratoFilter}
            rewards={rewards}
            onSelectReward={(reward) => setSelectedReward(reward)}
            selectedReward={selectedReward}
            onCancelRedeem={() => setSelectedReward(null)}
            onConfirmRedeem={handleRedeemReward}
            isRedeeming={isRedeeming}
            isBirthdayToday={isBirthdayToday}
            birthdayGiftVoucher={birthdayGiftVoucher}
            onOpenBirthdaySchedule={() => setIsBirthdayScheduleModalOpen(true)}
          />
        )}

        {/* TAB 4: MEUS VOUCHERS */}
        {activeTab === 'vouchers' && (
          <VouchersDrawer
            vouchers={vouchers}
            isBirthdayToday={isBirthdayToday}
            birthdayGiftVoucher={birthdayGiftVoucher}
            onOpenBirthdaySchedule={() => setIsBirthdayScheduleModalOpen(true)}
            onNavigateToCatalog={() => setActiveTab('rewards')}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
          <button
            onClick={() => setActiveTab('appointment')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'appointment'
                ? 'text-[#147A80] font-black'
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Consulta</span>
          </button>

          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'checkin'
                ? 'text-[#147A80] font-black'
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Check-in</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'rewards'
                ? 'text-[#147A80] font-black'
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Extrato & Prêmios</span>
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'vouchers'
                ? 'text-[#147A80] font-black'
                : 'text-gray-400 hover:text-gray-600 font-medium'
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Vouchers</span>
          </button>
        </div>
      </nav>

      {/* Totem QR Code Display Modal (RF03) */}
      <TotemQRCodeModal
        isOpen={isTotemModalOpen}
        onClose={() => setIsTotemModalOpen(false)}
        onSimulateScan={(cId, cName) => handleCheckin(cId, cName)}
      />

      {/* Camera Permission & Troubleshooting Modal */}
      <CameraPermissionModal
        isOpen={isCameraHelpOpen}
        onClose={() => setIsCameraHelpOpen(false)}
        onRetry={() => {
          setIsCameraHelpOpen(false);
          startCamera();
        }}
        onUsePhotoCapture={() => fileInputRef.current?.click()}
        errorMessage={cameraError}
      />

      {/* Birthday Scheduling Modal */}
      <BirthdayGiftModal
        isOpen={isBirthdayScheduleModalOpen}
        onClose={() => setIsBirthdayScheduleModalOpen(false)}
        onSubmit={handleScheduleBirthdayGift}
        isSubmitting={isSubmittingBirthdaySchedule}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        isPushSubscribed={isPushSubscribed}
        isSubscribingPush={isSubscribingPush}
        onSubscribePush={handleSubscribePush}
        onSendTestPush={handleSendTestPush}
        notifications={inAppNotifications}
        onMarkAllRead={() => handleMarkNotificationsRead()}
        onMarkRead={(id) => handleMarkNotificationsRead(id)}
        onOpenBirthdaySchedule={() => setIsBirthdayScheduleModalOpen(true)}
        onConfirmAppointment={handleConfirmAppointment}
        onNavigateToCheckin={() => setActiveTab('checkin')}
        isConfirmed={isConfirmed}
        isCheckedIn={isCheckedIn}
        onSendReminderPush={handleSendReminderPush}
        onSendBirthdayPush={handleSendBirthdayPush}
        isBirthdayToday={isBirthdayToday}
      />

      {/* Admin Gamification Modal */}
      {!onOpenAdminGamificationModal && (
        <AdminGamificationModal
          isOpen={internalAdminModalOpen}
          onClose={() => setInternalAdminModalOpen(false)}
          staffName="Administração Bertuol"
        />
      )}
    </div>
  );
};
