import React from 'react';
import { AppUserContext, UserPermissions } from '../../types/database';
import { Lock, UserX, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedContext: 'patient' | 'clinic' | 'root';
  requiredPermission?: keyof UserPermissions;
  userContext: AppUserContext;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedContext,
  requiredPermission,
  userContext,
  children,
}) => {
  const isRootUser =
    userContext.role === 'admin_root' ||
    userContext.role === 'admin' ||
    userContext.role === 'superadmin';

  // 1. Bypass absoluto para SuperAdmin / Root
  if (isRootUser) {
    return <>{children}</>;
  }

  // 2. Proteção do Contexto SuperAdmin (/root/*)
  if (allowedContext === 'root') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Acesso Restrito ao SuperAdmin</h3>
            <p className="text-xs text-slate-400 mt-1">
              Você não possui privilégios de administrador do sistema para acessar `/root/*`.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (window.location.href = userContext.role === 'paciente' ? '/?app=paciente' : '/')}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Voltar para Minha Área
          </button>
        </div>
      </div>
    );
  }

  // 3. Proteção da Aplicação Interna da Clínica (/app/*)
  if (allowedContext === 'clinic') {
    if (userContext.role === 'paciente') {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-950/80 border border-amber-800 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
              <UserX className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Área Exclusiva da Clínica</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pacientes devem utilizar o Portal do Paciente para agendamentos e consultas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => (window.location.href = '/?app=paciente')}
              className="w-full py-2.5 rounded-xl bg-[#147A80] hover:bg-teal-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Ir para o Portal do Paciente
            </button>
          </div>
        </div>
      );
    }

    // Checagem de permissão granular do perfil da clínica
    if (requiredPermission && !userContext.permissions?.[requiredPermission]) {
      return (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl m-4 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-100">Recurso Indisponível para seu Perfil</h4>
          <p className="text-xs text-slate-400">
            Seu perfil (`{userContext.role}`) não possui a permissão requerida `{String(requiredPermission)}`.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};
