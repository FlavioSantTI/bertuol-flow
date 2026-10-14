export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushSubscriptionService = {
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  async getVapidPublicKey(): Promise<string | null> {
    try {
      const res = await fetch('/api/push/vapid-public-key');
      const data = await res.json();
      return data.publicKey || null;
    } catch {
      return null;
    }
  },

  async subscribe(phone: string, patientName: string): Promise<{
    success: boolean;
    subscription?: PushSubscription;
    error?: string;
  }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Push não é suportado neste navegador.' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Permissão de notificação não concedida.' };
      }

      const vapidKey = await this.getVapidPublicKey();
      if (!vapidKey) {
        return { success: false, error: 'Chave VAPID não configurada no servidor.' };
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
        });
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          patientName,
          role: 'paciente',
          subscription,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Erro ao registrar inscrição no servidor.' };
      }

      return { success: true, subscription };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao ativar notificações push.' };
    }
  },

  async checkCurrentSubscription(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return !!sub;
    } catch {
      return false;
    }
  },

  async sendReminderPush(params: {
    phone: string;
    patientName: string;
    appointmentTime: string;
    dentistName: string;
    clinicName: string;
    type: '1_day_before' | '2_hours_before';
  }) {
    const res = await fetch('/api/push/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async sendBirthdayPush(phone: string, patientName: string) {
    const res = await fetch('/api/push/send-birthday', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, patientName }),
    });
    return res.json();
  },
};
