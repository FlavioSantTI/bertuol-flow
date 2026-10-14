import { useState, useEffect, useCallback } from 'react';
import { pushSubscriptionService } from '../services/pushSubscription';

export interface UseWebPushReturn {
  isPushSupported: boolean;
  pushPermission: NotificationPermission;
  isPushSubscribed: boolean;
  isSubscribing: boolean;
  pushStatusMessage: string | null;
  subscribe: () => Promise<boolean>;
  sendReminder: (type: '1_day_before' | '2_hours_before', details: {
    appointmentTime: string;
    dentistName: string;
    clinicName: string;
  }) => Promise<any>;
  sendBirthdayNotification: () => Promise<any>;
  setPushStatusMessage: (msg: string | null) => void;
}

export function useWebPush(phone: string, patientName: string): UseWebPushReturn {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const supported = pushSubscriptionService.isSupported();
    setIsPushSupported(supported);
    if (supported) {
      setPushPermission(pushSubscriptionService.getPermission());
      pushSubscriptionService.checkCurrentSubscription().then(setIsPushSubscribed);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsSubscribing(true);
    setPushStatusMessage(null);
    try {
      const res = await pushSubscriptionService.subscribe(phone, patientName);
      if (res.success) {
        setIsPushSubscribed(true);
        setPushPermission('granted');
        setPushStatusMessage('🔔 Notificações ativadas no seu celular com sucesso!');
        return true;
      } else {
        setPushStatusMessage(`⚠️ ${res.error || 'Não foi possível ativar'}`);
        return false;
      }
    } catch (err: any) {
      setPushStatusMessage(`⚠️ Erro: ${err?.message || 'Falha na inscrição'}`);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [phone, patientName]);

  const sendReminder = useCallback(
    async (
      type: '1_day_before' | '2_hours_before',
      details: { appointmentTime: string; dentistName: string; clinicName: string }
    ) => {
      return pushSubscriptionService.sendReminderPush({
        phone,
        patientName,
        appointmentTime: details.appointmentTime,
        dentistName: details.dentistName,
        clinicName: details.clinicName,
        type,
      });
    },
    [phone, patientName]
  );

  const sendBirthdayNotification = useCallback(async () => {
    return pushSubscriptionService.sendBirthdayPush(phone, patientName);
  }, [phone, patientName]);

  return {
    isPushSupported,
    pushPermission,
    isPushSubscribed,
    isSubscribing,
    pushStatusMessage,
    subscribe,
    sendReminder,
    sendBirthdayNotification,
    setPushStatusMessage,
  };
}
