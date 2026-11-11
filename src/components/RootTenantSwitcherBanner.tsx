import React from 'react';
import { useTenant } from '../contexts/TenantContext';
import { AppUserContext } from '../types/database';
import { APP_VERSION } from '../config/version';
import { Building2, RefreshCw, ShieldAlert } from 'lucide-react';

interface RootTenantSwitcherBannerProps {
  userContext: AppUserContext;
}

export const RootTenantSwitcherBanner: React.FC<RootTenantSwitcherBannerProps> = ({ userContext }) => {
  const { activeClinicId, availableClinics, switchClinic, isImpersonating, resetToDefaultTenant } = useTenant();

  const isRootUser =
    userContext.role === 'admin_root' ||
    userContext.role === 'admin' ||
    userContext.role === 'superadmin' ||
    userContext.role === 'admin_tecnico' ||
    Boolean(
      userContext.email &&
        (userContext.email.toLowerCase() === 'favuca.dias@gmail.com' ||
          userContext.email.toLowerCase() === 'flavio.santiago.ti@outlook.com' ||
          userContext.email.toLowerCase().includes('flavio.santiago'))
    ) ||
    Boolean(
      userContext.userName &&
        (userContext.userName.includes('Flavio') || userContext.userName.includes('Favuca'))
    );

  // Exibe apenas para perfis SuperAdmin / Root
  if (!isRootUser) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md z-50 border-b border-amber-600">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-900 shrink-0 animate-pulse" />
        <span>
          <strong>MODO SUPERADMIN (ROOT):</strong> Visão Global Multi-Tenant Ativa
        </span>
        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px] font-mono font-black shrink-0">
          v{APP_VERSION}
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-900/10 px-2.5 py-1 rounded-lg border border-slate-900/20">
          <Building2 className="w-3.5 h-3.5 text-slate-900" />
          <span className="text-[11px] text-slate-900 font-extrabold">Simular Unidade:</span>
          <select
            value={String(activeClinicId)}
            onChange={(e) => {
              const val = e.target.value;
              switchClinic(val === 'all' ? 'all' : Number(val));
            }}
            className="bg-slate-900 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">Todas as Unidades (Visão Consolidada)</option>
            {availableClinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                🏢 {clinic.name} ({clinic.city || 'TO'})
              </option>
            ))}
          </select>
        </div>

        {isImpersonating && (
          <button
            type="button"
            onClick={resetToDefaultTenant}
            className="flex items-center gap-1 bg-slate-900 text-amber-300 hover:bg-slate-800 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
            title="Restaurar visualização padrão"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Resetar Filtro</span>
          </button>
        )}
      </div>
    </div>
  );
};
