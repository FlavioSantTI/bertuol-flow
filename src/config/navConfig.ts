export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: string;
  requiredPermission?: string;
  roles?: string[];
}

// 1. Navegação do Portal do Paciente (/portal/*)
export const PATIENT_NAV: NavItem[] = [
  { id: 'appointments', label: 'Meus Agendamentos', path: '/portal/agendamentos', icon: 'Calendar' },
  { id: 'history', label: 'Histórico & Tratamentos', path: '/portal/historico', icon: 'Clock' },
  { id: 'messages', label: 'Falar com a Clínica', path: '/portal/mensagens', icon: 'MessageSquare' },
  { id: 'profile', label: 'Meu Perfil', path: '/portal/perfil', icon: 'User' },
];

// 2. Navegação da Aplicação da Clínica (/app/*)
export const CLINIC_NAV: NavItem[] = [
  { id: 'agenda', label: 'Agenda Geral', path: '/app/agenda', icon: 'Calendar', requiredPermission: 'view_agenda' },
  { id: 'patients', label: 'Prontuários & Pacientes', path: '/app/pacientes', icon: 'Users', requiredPermission: 'view_patients' },
  { id: 'financial', label: 'Financeiro & Caixas', path: '/app/financeiro', icon: 'DollarSign', requiredPermission: 'view_financial' },
  { id: 'users', label: 'Usuários & Perfis', path: '/app/usuarios', icon: 'ShieldCheck', requiredPermission: 'manage_users' },
  { id: 'settings', label: 'Configurações da Unidade', path: '/app/configuracoes', icon: 'Settings', requiredPermission: 'manage_clinic' },
];

// 3. Navegação da Área SuperAdmin / Root (/root/*)
export const ROOT_NAV: NavItem[] = [
  { id: 'global_dashboard', label: 'Visão Geral Multi-Tenant', path: '/root/dashboard', icon: 'Activity' },
  { id: 'tenants_management', label: 'Gestão de Clínicas', path: '/root/clinicas', icon: 'Building2' },
  { id: 'global_users', label: 'Todos os Usuários', path: '/root/usuarios', icon: 'Users' },
  { id: 'audit_logs', label: 'Logs & Auditoria Global', path: '/root/logs', icon: 'FileText' },
];
