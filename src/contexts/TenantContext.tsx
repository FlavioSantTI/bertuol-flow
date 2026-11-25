import React, { createContext, useContext, useState } from 'react';
import { Clinic } from '../types/database';

interface TenantContextType {
  activeClinicId: number | 'all';
  activeClinic: Clinic | null;
  availableClinics: Clinic[];
  switchClinic: (clinicId: number | 'all') => void;
  isImpersonating: boolean;
  resetToDefaultTenant: () => void;
  setAvailableClinicsList: (clinics: Clinic[]) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableClinics, setAvailableClinics] = useState<Clinic[]>([
    {
      id: 1,
      name: 'Unidade Palmas',
      shortName: 'Palmas',
      slug: 'palmas',
      address: 'Quadra 104 Sul, Av. LO-01, nº 12',
      phone: '(63) 3215-1000',
      whatsappNumber: '(63) 99247-4826',
      clinicorp_business_id: 101,
      colorTag: '#147A80',
      active: true,
      city: 'Palmas',
      state: 'TO',
    },
    {
      id: 2,
      name: 'Unidade Paraíso do Tocantins',
      shortName: 'Paraíso',
      slug: 'paraiso',
      address: 'Av. Bernardo Sayão, nº 1450',
      phone: '(63) 3602-2000',
      whatsappNumber: '(63) 99247-4826',
      clinicorp_business_id: 102,
      colorTag: '#0F5B5F',
      active: true,
      city: 'Paraíso do Tocantins',
      state: 'TO',
    },
  ]);

  const [activeClinicId, setActiveClinicId] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('@bertuol_active_clinic_id');
    if (saved === 'all') return 'all';
    return saved ? Number(saved) : 'all';
  });

  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    return localStorage.getItem('@bertuol_is_impersonating') === 'true';
  });

  const activeClinic =
    typeof activeClinicId === 'number'
      ? availableClinics.find((c) => c.id === activeClinicId) || null
      : null;

  const switchClinic = (clinicId: number | 'all') => {
    setActiveClinicId(clinicId);
    setIsImpersonating(true);
    localStorage.setItem('@bertuol_active_clinic_id', String(clinicId));
    localStorage.setItem('@bertuol_is_impersonating', 'true');
  };

  const resetToDefaultTenant = () => {
    setActiveClinicId('all');
    setIsImpersonating(false);
    localStorage.removeItem('@bertuol_active_clinic_id');
    localStorage.removeItem('@bertuol_is_impersonating');
  };

  const setAvailableClinicsList = (clinics: Clinic[]) => {
    if (clinics && clinics.length > 0) {
      setAvailableClinics(clinics);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        activeClinicId,
        activeClinic,
        availableClinics,
        switchClinic,
        isImpersonating,
        resetToDefaultTenant,
        setAvailableClinicsList,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser utilizado dentro do TenantProvider');
  }
  return context;
};
