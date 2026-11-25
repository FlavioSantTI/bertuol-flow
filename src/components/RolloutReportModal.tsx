import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Users,
  Smartphone,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Printer,
  ShieldCheck,
  CheckCircle,
  Activity,
  Layers,
  ArrowDownToLine,
} from 'lucide-react';
import { SystemUser } from '../types/database';

interface AccessLog {
  id: string;
  usuario_id: string;
  name: string;
  email: string;
  role: string;
  device: string;
  timestamp: string;
}

interface RolloutReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemUsers: SystemUser[];
}

export const RolloutReportModal: React.FC<RolloutReportModalProps> = ({
  isOpen,
  onClose,
  systemUsers,
}) => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/api/access-logs')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.logs) {
            setLogs(data.logs);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error loading access logs:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen, refreshTrigger]);

  if (!isOpen) return null;

  // Format Date in Brazilian standard (DD/MM/YYYY às HH:MM)
  const formatBrazilianDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  // Humanize the User-Agent device string into clean labels
  const parseDevice = (ua: string) => {
    if (!ua) return 'Web App';
    const lower = ua.toLowerCase();
    if (lower.includes('iphone') || lower.includes('ipad')) {
      if (lower.includes('safari') && !lower.includes('chrome') && !lower.includes('crios')) {
        return 'iPhone / iPad (iOS Safari)';
      }
      return 'Dispositivo Apple iOS';
    }
    if (lower.includes('android')) {
      return 'Smartphone Android (Chrome)';
    }
    if (lower.includes('windows')) {
      return 'Computador Windows (PC)';
    }
    if (lower.includes('macintosh') || lower.includes('mac os')) {
      return 'Computador Apple Mac';
    }
    if (lower.includes('linux')) {
      return 'Computador Linux';
    }
    return 'Navegador Web';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin_root':
        return { label: 'Admin Root', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'admin_clinica':
        return { label: 'Admin Clínica', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'gerente_atendimento':
        return { label: 'Gerente', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'receptionist':
        return { label: 'Recepção', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'dentist':
      default:
        return { label: 'Dentista', bg: 'bg-teal-50 text-[#0f5c61] border-teal-200' };
    }
  };

  // Rollout Statistics Calculations
  const totalUsers = systemUsers.length;

  // Calculate adoption rate (how many users have changed their provisional password 'Bertuol@2026')
  const usersWithCustomPassword = systemUsers.filter((u) => !u.mustChangePassword).length;
  const adoptionPercentage = totalUsers > 0 ? Math.round((usersWithCustomPassword / totalUsers) * 100) : 0;

  // Total unique active accounts that accessed the system at least once according to logs
  const uniqueUsersInLogs = new Set(logs.map((l) => l.email.toLowerCase())).size;

  // Filters logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || log.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200 print:relative print:p-0 print:bg-white print:z-0">
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:w-full"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Hidden in Print */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                Relatório de Implantação e Acessos
              </h2>
              <p className="text-xs text-slate-500">
                Controle de adoção, acessos e primeiro acesso dos profissionais da clínica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              title="Atualizar Logs"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              title="Imprimir Relatório"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              aria-label="Fechar relatório"
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block text-center border-b-2 border-slate-200 pb-4 mb-6">
          <h1 className="text-xl font-bold text-slate-900">Relatório Geral de Implantação e Adoção</h1>
          <p className="text-xs text-slate-500 font-medium">Bertuol Odontologia Avançada · Data do Relatório: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]/40">
          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Adoção do Portal</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-none tabular-nums">{adoptionPercentage}%</span>
                <p className="text-xs text-slate-500 mt-1">Senha pessoal definida</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Acessos Totais</span>
                <Activity className="w-4 h-4 text-[#147A80]" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-none tabular-nums">{logs.length}</span>
                <p className="text-xs text-slate-500 mt-1">Registros de login</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Contas Engajadas</span>
                <Users className="w-4 h-4 text-[#147A80]" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-none tabular-nums">{uniqueUsersInLogs} / {totalUsers}</span>
                <p className="text-xs text-slate-500 mt-1">Profissionais ativos</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Primeiro Acesso</span>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-none tabular-nums">
                  {totalUsers - usersWithCustomPassword}
                </span>
                <p className="text-xs text-slate-500 mt-1">Ainda com senha provisória</p>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar - Hidden in Print */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar profissional por nome ou e-mail..."
                className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147A80] text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 bg-white border border-slate-200 rounded-lg text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#147A80] font-medium text-slate-800"
              >
                <option value="all">Todos os Perfis</option>
                <option value="dentist">Apenas Dentistas</option>
                <option value="receptionist">Apenas Recepção</option>
                <option value="gerente_atendimento">Apenas Gerentes</option>
                <option value="admin_clinica">Apenas Admins</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Histórico Cronológico de Logins</span>
              <span className="text-xs font-medium text-[#147A80] tabular-nums">
                {filteredLogs.length} acessos encontrados
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#147A80]" />
                <span className="text-xs font-medium">Carregando histórico de acessos...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">
                Nenhum registro de acesso corresponde aos filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                      <th className="p-3.5">Profissional / E-mail</th>
                      <th className="p-3.5">Perfil</th>
                      <th className="p-3.5">Dispositivo / Sistema</th>
                      <th className="p-3.5">Horário do Acesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredLogs.map((log) => {
                      const badge = getRoleLabel(log.role);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900">{log.name}</div>
                            <div className="text-[11px] text-slate-500">{log.email}</div>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{parseDevice(log.device)}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-800 font-medium whitespace-nowrap tabular-nums">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatBrazilianDate(log.timestamp)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <p className="text-xs text-slate-500">
            Segurança em conformidade com a <strong className="font-semibold text-slate-700">LGPD</strong> · Registro armazenado no servidor corporativo.
          </p>
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
