// Notification Service: Handles Heads-Up In-App Banners, Sound Chime, Vibration and Web Push

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  time: string;
  category?: string;
  appointmentId?: number;
  actionText?: string;
  isDailyBriefing?: boolean;
}

class NotificationService {
  private listeners: ((notification: PushNotificationPayload) => void)[] = [];
  private audioContext: AudioContext | null = null;

  // Subscribe to in-app heads-up notifications
  subscribe(listener: (notification: PushNotificationPayload) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Schedule a notification after delaySeconds with live countdown callback
  scheduleDispatch(
    notification: PushNotificationPayload,
    delaySeconds: number,
    onTick?: (secondsLeft: number) => void
  ): () => void {
    let secondsLeft = delaySeconds;
    if (onTick) onTick(secondsLeft);

    const intervalId = setInterval(() => {
      secondsLeft -= 1;
      if (onTick) onTick(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(intervalId);
        this.dispatch(notification);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }

  // Play a realistic, soft clinical ding-dong chime using Web Audio API
  playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext = new AudioCtx();
        this.audioContext.resume();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Note 1: High crisp ding (880Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: Harmonious dong (1174Hz - D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('AudioContext não disponível:', e);
    }
  }

  // Haptic feedback for mobile devices
  vibrate() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 60, 150]);
      } catch (e) {
        // ignore vibration block
      }
    }
  }

  // Check if we are running inside an iframe (like AI Studio preview)
  isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  // Request browser OS notification permission if supported and not in an iframe
  async requestSystemPermission(): Promise<'granted' | 'denied' | 'default' | 'iframe_restricted'> {
    if (this.isInIframe()) {
      return 'iframe_restricted';
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Notification.requestPermission bloqueado:', err);
      return 'iframe_restricted';
    }
  }

  // Dispatch push notification
  dispatch(notification: PushNotificationPayload) {
    // 1. Play professional clinic chime sound
    this.playNotificationSound();

    // 2. Trigger vibration on device
    this.vibrate();

    // 3. Notify in-app subscribers (Heads-Up Banner)
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Erro no listener de notificação:', err);
      }
    });

    // 4. Try native OS notification or Service Worker showNotification if allowed and supported
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      !this.isInIframe()
    ) {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((registration) => {
              registration.showNotification(notification.title, {
                body: notification.body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                data: { appointmentId: notification.appointmentId },
              });
            })
            .catch(() => {
              new Notification(notification.title, {
                body: notification.body,
                icon: '/pwa-192x192.png',
              });
            });
        } else {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/pwa-192x192.png',
          });
        }
      } catch (e) {
        console.warn('Falha na notificação nativa:', e);
      }
    }
  }

  // Preferences: In-App Toast Duration on screen (seconds, 0 = sticky/never auto dismiss)
  getBannerDisplayDuration(): number {
    if (typeof window === 'undefined') return 20;
    const saved = localStorage.getItem('bertuol_banner_duration_sec');
    return saved !== null ? parseInt(saved, 10) : 20; // 20s default
  }

  setBannerDisplayDuration(seconds: number) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bertuol_banner_duration_sec', seconds.toString());
    }
  }

  // Preferences: Push test delay (seconds before ringing)
  getPushTestDelaySeconds(): number {
    if (typeof window === 'undefined') return 10;
    const saved = localStorage.getItem('bertuol_push_test_delay_sec');
    return saved !== null ? parseInt(saved, 10) : 10; // 10s default
  }

  setPushTestDelaySeconds(seconds: number) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bertuol_push_test_delay_sec', seconds.toString());
    }
  }

  // Preferences: Morning Briefing Scheduled Time (ex: '07:30')
  getMorningBriefingTime(): string {
    if (typeof window === 'undefined') return '07:30';
    return localStorage.getItem('bertuol_morning_briefing_time') || '07:30';
  }

  setMorningBriefingTime(time: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bertuol_morning_briefing_time', time);
    }
  }

  // Individual Dentist Alert Configuration
  getDentistSettings(dentistId: number, defaultPhone?: string): DentistAlertSettings {
    const defaultSettings: DentistAlertSettings = {
      dentistId,
      phone: defaultPhone || '(63) 99234-9680',
      pushEnabled: true,
      whatsappEnabled: true,
      inAppBannerEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      morningSummaryEnabled: true,
      morningSummaryTime: this.getMorningBriefingTime(),
      patientArrivalEnabled: true,
      aiSummaryReadyEnabled: true,
      cancellationOrSlotEnabled: true,
      bannerDurationSeconds: this.getBannerDisplayDuration(),
      testDelaySeconds: this.getPushTestDelaySeconds(),
    };

    if (typeof window === 'undefined') return defaultSettings;
    try {
      const raw = localStorage.getItem(`bertuol_alerts_dentist_${dentistId}`);
      if (!raw) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (e) {
      return defaultSettings;
    }
  }

  saveDentistSettings(settings: DentistAlertSettings) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        `bertuol_alerts_dentist_${settings.dentistId}`,
        JSON.stringify(settings)
      );
      this.setBannerDisplayDuration(settings.bannerDurationSeconds);
      this.setPushTestDelaySeconds(settings.testDelaySeconds);
      this.setMorningBriefingTime(settings.morningSummaryTime);
    } catch (e) {
      console.warn('Erro ao salvar preferências do dentista:', e);
    }
  }
}

export interface DentistAlertSettings {
  dentistId: number;
  phone: string;
  pushEnabled: boolean;
  whatsappEnabled: boolean;
  inAppBannerEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  morningSummaryEnabled: boolean;
  morningSummaryTime: string;
  patientArrivalEnabled: boolean;
  aiSummaryReadyEnabled: boolean;
  cancellationOrSlotEnabled: boolean;
  bannerDurationSeconds: number;
  testDelaySeconds: number;
}

export const notificationService = new NotificationService();
