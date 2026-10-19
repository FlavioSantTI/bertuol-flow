import React, { useState } from 'react';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { RootTenantSwitcherBanner } from '../../components/RootTenantSwitcherBanner';
import { useTenant } from '../../contexts/TenantContext';
import { AppUserContext } from '../../types/database';
import {
  Building2,
  Users,
  FileText,
  Activity,
  Shield,
  LayoutDashboard,
  Server,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface RootLayoutProps {
  userContext: AppUserContext;
  onNavigateToApp: () => void;
  onNavigateToPatient: () => void;
}

export const RootLayout: React.FC<RootLayoutProps> = ({
  userContext,
  onNavigateToApp,
  onNavigateToPatient,
}) => {
  const { availableClinics, activeClinicId, switchClinic } = useTenant();
  const [activeTab, setActiveTab] = useState<'tenants' | 'logs' | 'users'>('tenants');

  return (
    <ProtectedRoute allowedContext="root" userContext={userContext}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
        {/* Top Banner de Simulação Multi-Tenant */}
        <RootTenantSwitcherBanner userContext={userContext} />

        {/* Header do Painel Root / SuperAdmin */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Painel Global SuperAdmin (Root)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  Acesso Restrito
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Governança Multi-Tenant, Auditoria e Simulação de Contextos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onNavigateToApp}
              className="px-3.5 py-2 rounded-xl bg-[#147A80] hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Navegar pela Clínica (/app)</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToPatient}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver Portal Paciente (/portal)</span>
            </button>
          </div>
        </header>

        {/* Sub-Header de Navegação Root */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'tenants', label: 'Gestão de Clínicas (Tenants)', icon: Building2 },
            { id: 'users', label: 'Usuários Globais', icon: Users },
            { id: 'logs', label: 'Logs de Auditoria & Sistema', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo Principal do Root */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Clínicas Cadastradas</span>
                    <Building2 className="w-4 h-4 text-teal-400" />
                  </div>
                  <p className="text-2xl font-black text-white">{availableClinics.length}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Unidade Selecionada no Switcher</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-sm font-extrabold text-amber-300">
                    {activeClinicId === 'all'
                      ? 'Todas as Unidades (Visão Consolidada)'
                      : availableClinics.find((c) => c.id === activeClinicId)?.name || 'Unidade Padrão'}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Status dos Servidores & API</span>
                    <Server className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>100% Operacional (200 OK)</span>
                  </p>
                </div>
              </div>

              {/* Lista de Clínicas com Ação Instantânea de Impersonation */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Unidades Operacionais do Sistema</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableClinics.map((clinic) => {
                    const isSelected = activeClinicId === clinic.id;
                    return (
                      <div
                        key={clinic.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-950/20 border-amber-500/50 text-slate-100'
                            : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-white">{clinic.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 border border-teal-800 text-teal-300 font-mono">
                              ID: {clinic.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{clinic.address}</p>
                          <p className="text-xs text-slate-500 font-mono">{clinic.phone}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              switchClinic(clinic.id);
                              onNavigateToApp();
                            }}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Simular esta Unidade no /app</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span>Gestão Global de Usuários e Permissões</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualização consolidada de todos os usuários cadastrados nas unidades e seus papéis no sistema (`admin_clinica`, `dentista`, `recepcao`, `financeiro`, `paciente`, `superadmin`).
              </p>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Logs de Auditoria & Atividade Multi-Tenant</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registro síncrono de operações, trocas de status de atendimento, sincronizações e acessos do SuperAdmin.
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};
