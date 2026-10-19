import React from 'react';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { AppUserContext } from '../../types/database';

interface PatientLayoutProps {
  userContext: AppUserContext;
  children: React.ReactNode;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({ userContext, children }) => {
  return (
    <ProtectedRoute allowedContext="patient" userContext={userContext}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
        {/* Layout do Paciente: Mobile First, Limpo, Dedicado */}
        <main className="w-full min-h-screen max-w-md sm:max-w-xl mx-auto shadow-2xl relative bg-slate-950">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
};
