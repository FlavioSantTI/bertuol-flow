import jsQR from 'jsqr';
import type { TotemScanResult } from '../types/patientTypes';

export class QrScannerService {
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;

  async startCamera(
    videoElement: HTMLVideoElement,
    onResult: (result: TotemScanResult) => void,
    onError?: (err: any) => void
  ): Promise<boolean> {
    try {
      this.stop();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      await videoElement.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const scanLoop = () => {
        if (!this.stream || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
          this.animFrameId = requestAnimationFrame(scanLoop);
          return;
        }

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            const raw = code.data.trim();
            const isValid = this.isTotemPayload(raw);
            const clinicId = this.parseClinicId(raw);

            onResult({
              rawCode: raw,
              clinicId,
              timestamp: new Date().toISOString(),
              valid: isValid,
            });
            return;
          }
        }

        this.animFrameId = requestAnimationFrame(scanLoop);
      };

      this.animFrameId = requestAnimationFrame(scanLoop);
      return true;
    } catch (err) {
      if (onError) onError(err);
      return false;
    }
  }

  isTotemPayload(data: string): boolean {
    return (
      data.includes('BERTUOL_TOTEM') ||
      data.includes('BT-TOTEM') ||
      data.includes('bertuol') ||
      data.includes('totem') ||
      data.includes('checkin') ||
      data.startsWith('http')
    );
  }

  parseClinicId(data: string): number {
    const match = data.match(/UNIT_(\d+)/i) || data.match(/clinicId=(\d+)/i) || data.match(/clinic_(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 1;
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}

export const qrScannerService = new QrScannerService();
