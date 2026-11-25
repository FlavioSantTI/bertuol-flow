import { useState, useEffect, useCallback } from 'react';
import type { PatientTier, PatientVoucher, PointTransaction } from '../types/patientTypes';
import { patientApiService } from '../services/patientApiService';

export interface UsePatientProfileReturn {
  points: number;
  tier: PatientTier;
  tierProgress: number;
  pointsHistory: PointTransaction[];
  vouchers: PatientVoucher[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  awardPoints: (amount: number, description: string) => void;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  setVouchers: React.Dispatch<React.SetStateAction<PatientVoucher[]>>;
  setPointsHistory: React.Dispatch<React.SetStateAction<PointTransaction[]>>;
}

export function calculateTier(pts: number): { tier: PatientTier; progress: number } {
  if (pts >= 500) {
    return { tier: 'diamante', progress: 100 };
  } else if (pts >= 250) {
    const progress = Math.min(100, Math.round(((pts - 250) / 250) * 100));
    return { tier: 'ouro', progress };
  } else if (pts >= 100) {
    const progress = Math.min(100, Math.round(((pts - 100) / 150) * 100));
    return { tier: 'prata', progress };
  } else {
    const progress = Math.min(100, Math.round((pts / 100) * 100));
    return { tier: 'bronze', progress };
  }
}

export function usePatientProfile(phone: string, initialPoints = 40): UsePatientProfileReturn {
  const [points, setPoints] = useState<number>(initialPoints);
  const [pointsHistory, setPointsHistory] = useState<PointTransaction[]>([]);
  const [vouchers, setVouchers] = useState<PatientVoucher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { tier, progress: tierProgress } = calculateTier(points);

  const refresh = useCallback(async () => {
    if (!phone) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await patientApiService.getProfile(phone);
      if (data && data.profile) {
        setPoints(data.profile.points ?? 0);
      }
      if (data && data.vouchers) {
        setVouchers(data.vouchers);
      }
      if (data && data.history) {
        setPointsHistory(data.history);
      }
    } catch (err: any) {
      console.warn('Erro ao carregar perfil do paciente:', err?.message);
      setError(err?.message || 'Falha ao sincronizar dados');
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const awardPoints = useCallback((amount: number, description: string) => {
    setPoints((prev) => prev + amount);
    const newTx: PointTransaction = {
      id: `pt_local_${Date.now()}`,
      patient_phone: phone,
      points: amount,
      description,
      created_at: new Date().toISOString(),
    };
    setPointsHistory((prev) => [newTx, ...prev]);
  }, [phone]);

  return {
    points,
    tier,
    tierProgress,
    pointsHistory,
    vouchers,
    isLoading,
    error,
    refresh,
    awardPoints,
    setPoints,
    setVouchers,
    setPointsHistory,
  };
}
