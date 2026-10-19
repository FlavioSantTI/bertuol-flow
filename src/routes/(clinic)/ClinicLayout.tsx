import React from 'react';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { RootTenantSwitcherBanner } from '../../components/RootTenantSwitcherBanner';
import { AppUserContext } from '../../types/database';

interface ClinicLayoutProps {
  userContext: AppUserContext;
  children: React.ReactNode;
}

export const ClinicLayout: React.FC<ClinicLayoutProps> = ({ userContext, children }) => {
  return (
    <ProtectedRoute allowedContext="clinic" userContext={userContext}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
        {/* Banner do SuperAdmin quando ativo */}
        <RootTenantSwitcherBanner userContext={userContext} />

        {/* Conteúdo do Sistema Interno da Clínica */}
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </ProtectedRoute>
  );
};
