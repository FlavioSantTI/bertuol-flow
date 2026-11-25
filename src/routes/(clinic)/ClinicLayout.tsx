import React from 'react';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { AppUserContext } from '../../types/database';

interface ClinicLayoutProps {
  userContext: AppUserContext;
  children: React.ReactNode;
}

export const ClinicLayout: React.FC<ClinicLayoutProps> = ({ userContext, children }) => {
  return (
    <ProtectedRoute allowedContext="clinic" userContext={userContext}>
      <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans flex flex-col">
        {/* Conteúdo do Sistema Interno da Clínica */}
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </ProtectedRoute>
  );
};
