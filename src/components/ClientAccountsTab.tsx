import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Smartphone, 
  Send, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  UserX,
  RefreshCw,
  Copy
} from 'lucide-react';
import { SupabasePatient } from '../services/supabaseService';

interface ClientAccountsTabProps {
  patients: SupabasePatient[];
  refreshPatients: () => void;
  currentUserContext: any;
}

export const ClientAccountsTab: React.FC<ClientAccountsTabProps> = ({ 
  patients, 
  refreshPatients, 
  currentUserContext 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.mobile_phone && p.mobile_phone.includes(searchTerm));
      const matchesStatus = 
        statusFilter === 'all' || (p.app_access_status || 'pending_activation') === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  const getStatusBadge = (status: string | null | undefined) => {
    const s = status || 'pending_activation';
    switch (s) {
      case 'active': return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">Ativo</span>;
      case 'blocked': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Bloqueado</span>;
      default: return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Pendente</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos os Status</option>
          <option value="active">Ativo</option>
          <option value="pending_activation">Pendente</option>
          <option value="blocked">Bloqueado</option>
        </select>
        <button onClick={refreshPatients} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100 uppercase text-gray-600 font-bold">
            <tr>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Status App</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPatients.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.mobile_phone || '-'}</td>
                <td className="px-4 py-3">{getStatusBadge(p.app_access_status)}</td>
                <td className="px-4 py-3 flex justify-end gap-2">
                  <button title="Enviar Link de Ativação" className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600">
                    <Send className="w-4 h-4" />
                  </button>
                  <button title="Redefinir Senha" className="p-1.5 hover:bg-amber-50 rounded text-amber-600">
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button title="Bloquear Acesso" className="p-1.5 hover:bg-red-50 rounded text-red-600">
                    <UserX className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
