import { useState, useRef, useCallback, useEffect } from 'react';
import { qrScannerService } from '../services/qrScannerService';
import type { TotemScanResult } from '../types/patientTypes';

export interface UseTotemScannerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  isPermissionDenied: boolean;
  errorMessage: string | null;
  startScanner: (onScanned: (result: TotemScanResult) => void) => Promise<boolean>;
  stopScanner: () => void;
  resetState: () => void;
}

export function useTotemScanner(): UseTotemScannerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    qrScannerService.stop();
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(
    async (onScanned: (result: TotemScanResult) => void): Promise<boolean> => {
      if (!videoRef.current) return false;
      setIsPermissionDenied(false);
      setErrorMessage(null);

      const ok = await qrScannerService.startCamera(
        videoRef.current,
        (res) => {
          stopScanner();
          onScanned(res);
        },
        (err) => {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setIsPermissionDenied(true);
          } else {
            setErrorMessage('Não foi possível acessar a câmera do dispositivo.');
          }
          setIsScanning(false);
        }
      );

      if (ok) {
        setIsScanning(true);
      }
      return ok;
    },
    [stopScanner]
  );

  const resetState = useCallback(() => {
    stopScanner();
    setIsPermissionDenied(false);
    setErrorMessage(null);
  }, [stopScanner]);

  useEffect(() => {
    return () => {
      qrScannerService.stop();
    };
  }, []);

  return {
    videoRef,
    isScanning,
    isPermissionDenied,
    errorMessage,
    startScanner,
    stopScanner,
    resetState,
  };
}
