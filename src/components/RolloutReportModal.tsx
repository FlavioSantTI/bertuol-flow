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
        return { label: '👑 Admin Root', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'admin_clinica':
        return { label: '🏢 Admin Clínica', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'gerente_atendimento':
        return { label: '👔 Gerente', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'receptionist':
        return { label: '🛎️ Recepção', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'dentist':
      default:
        return { label: '🩺 Dentista', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };

  // Rollout Statistics Calculations
  const totalUsers = systemUsers.length;
  const activeUsers = systemUsers.filter((u) => u.active).length;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 print:relative print:p-0 print:bg-white print:z-0">
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 print:max-h-none print:shadow-none print:border-none print:w-full"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Hidden in Print */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#199A9F] to-[#4BBCBE] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                Relatório de Implantação & Acessos
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Controle de adoção, acessos e primeiro acesso dos profissionais da clínica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              title="Atualizar Logs"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              title="Imprimir Relatório"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center min-w-[48px] min-h-[48px] rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block text-center border-b-2 border-gray-200 pb-4 mb-6">
          <h1 className="text-xl font-black text-gray-900">📊 Relatório Geral de Implantação e Adoção</h1>
          <p className="text-xs text-gray-500 font-semibold">Bertuol Odontologia Avançada • Data do Relatório: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Adocão Card */}
            <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-emerald-200 text-emerald-950 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">Adoção do Portal</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black leading-none">{adoptionPercentage}%</span>
                <p className="text-[10px] sm:text-xs text-emerald-800 font-semibold mt-1">Senha pessoal definida</p>
              </div>
            </div>

            {/* Total Logins */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">Acessos Totais</span>
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black leading-none">{logs.length}</span>
                <p className="text-[10px] sm:text-xs text-amber-800 font-semibold mt-1">Registros de login</p>
              </div>
            </div>

            {/* Unique Logins Card */}
            <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-blue-950 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">Contas Engajadas</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black leading-none">{uniqueUsersInLogs} / {totalUsers}</span>
                <p className="text-[10px] sm:text-xs text-blue-800 font-semibold mt-1">Profissionais ativos</p>
              </div>
            </div>

            {/* Security Passwords Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-950 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Primeiro Acesso</span>
                <ShieldCheck className="w-4 h-4 text-slate-600" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black leading-none">
                  {totalUsers - usersWithCustomPassword}
                </span>
                <p className="text-[10px] sm:text-xs text-slate-700 font-semibold mt-1">Ainda com senha provisória</p>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar - Hidden in Print */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl print:hidden">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar profissional por nome ou e-mail..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 bg-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#4BBCBE] font-semibold text-gray-800"
              />
            </div>

            {/* Filter Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl text-xs sm:text-sm py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-[#4BBCBE] font-bold text-gray-800"
              >
                <option value="all">Filtro: Todos os Perfis</option>
                <option value="dentist">🩺 Apenas Dentistas</option>
                <option value="receptionist">🛎️ Apenas Recepção</option>
                <option value="gerente_atendimento">👔 Apenas Gerentes</option>
                <option value="admin_clinica">🏢 Apenas Admins</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
            <div className="p-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Histórico Cronológico de Logins</span>
              <span className="text-xs font-bold text-[#147A80] bg-[#4BBCBE]/10 px-2 py-0.5 rounded-full">
                {filteredLogs.length} acessos encontrados
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#199A9F]" />
                <span className="text-xs font-semibold">Carregando histórico de acessos...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs font-medium">
                Nenhum registro de acesso corresponde aos filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="p-3.5">Profissional / E-mail</th>
                      <th className="p-3.5">Perfil</th>
                      <th className="p-3.5">Dispositivo / Sistema</th>
                      <th className="p-3.5">Horário do Acesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredLogs.map((log) => {
                      const badge = getRoleLabel(log.role);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3.5">
                            <div className="font-extrabold text-gray-900">{log.name}</div>
                            <div className="text-[11px] text-gray-500 font-medium">{log.email}</div>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                              <span>{parseDevice(log.device)}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-gray-900 font-bold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
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
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 print:hidden">
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
            Segurança em Conformidade com a **LGPD** • Registro armazenado no servidor corporativo.
          </p>
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-extrabold text-xs transition-all shadow-2xs"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
