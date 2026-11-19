import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DateNavigator } from './components/DateNavigator';
import { AppointmentCard } from './components/AppointmentCard';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';
import { NotificationModal } from './components/NotificationModal';
import { HeadsUpNotification } from './components/HeadsUpNotification';
import { ClinicorpSyncModal } from './components/ClinicorpSyncModal';
import { MultiClinicModal } from './components/MultiClinicModal';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { FloatingPersonaBot } from './components/FloatingPersonaBot';
import { UserManagementModal } from './components/UserManagementModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { RolloutReportModal } from './components/RolloutReportModal';
import { VoucherRedemptionModal } from './components/VoucherRedemptionModal';
import { TotemQRCodeModal } from './components/TotemQRCodeModal';
import { AdminGamificationModal } from './components/AdminGamificationModal';
import { BertuolBotAvatar } from './components/BertuolBotAvatar';
import { LoginScreen } from './components/LoginScreen';
import { WebAuthnModal } from './components/WebAuthnModal';
import { PatientApp } from './patient/PatientApp';
import { InternalMessagingModal } from './components/InternalMessagingModal';
import { MiniCRMModal } from './components/crm/MiniCRMModal';
import { messagingService } from './services/messagingService';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { SkeletonCard } from './components/SkeletonLoader';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { PatientLayout } from './routes/(patient)/PatientLayout';
import { ClinicLayout } from './routes/(clinic)/ClinicLayout';
import { RootLayout } from './routes/(root)/RootLayout';
import { APP_VERSION } from './config/version';
import { dataService, formatDateKey, getDefaultPermissionsForRole, normalizeUserRole } from './services/dataService';
import {
  fetchDentistas,
  fetchPatients,
  fetchAppointmentsFromSupabase,
  updateAppointmentAiSummaryInSupabase,
} from './services/supabaseService';
import { Appointment, Category, Dentist, Clinic, AppUserContext, SystemUser, UserRole, UserPermissions } from './types/database';
import {
  CalendarX,
  Search,
  Sparkles,
  Smartphone,
  ChevronRight,
  Clock,
  Filter,
  CheckCircle2,
  Building2,
  Lock,
  Users,
  Bell,
  Stethoscope,
} from 'lucide-react';

export interface ComponentAccessRule {
  allowedRoles: UserRole[];
  permissionKey?: keyof UserPermissions;
  anyPermissionKeys?: (keyof UserPermissions)[];
}

export const COMPONENT_ACCESS_MAP: Record<string, ComponentAccessRule> = {
  crm: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento', 'receptionist'],
    permissionKey: 'canAccessCRM',
  },
  userManagement: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento', 'receptionist'],
    anyPermissionKeys: ['canManageUsers', 'canManageClientAccounts'],
  },
  multiClinic: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento'],
    permissionKey: 'canManageClinics',
  },
  adminGamification: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento', 'receptionist'],
    permissionKey: 'canManageGamification',
  },
  databaseSchema: {
    allowedRoles: ['admin_root', 'admin', 'admin_tecnico'],
    permissionKey: 'canAccessConfig',
  },
  clinicorpSync: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'admin_tecnico'],
    permissionKey: 'canAccessConfig',
  },
  rolloutReport: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento'],
    permissionKey: 'canExportData',
  },
  voucherRedemption: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento', 'receptionist', 'dentist'],
    permissionKey: 'canViewClubeSorriso',
  },
  totemQR: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento', 'receptionist'],
    permissionKey: 'canAccessTotemConfig',
  },
  webAuthn: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento', 'receptionist', 'dentist'],
    permissionKey: 'canManageWebAuthn',
  },
  internalMessaging: {
    allowedRoles: ['admin_root', 'admin', 'admin_clinica', 'gerente_atendimento', 'receptionist', 'dentist'],
    permissionKey: 'canSendInternalMessages',
  },
  adminSimulationToolbar: {
    allowedRoles: ['admin_root', 'admin', 'admin_tecnico'],
  },
};

export function canAccessComponent(componentKey: string, context: AppUserContext): boolean {
  const rule = COMPONENT_ACCESS_MAP[componentKey];
  if (!rule) return true;

  const normalizedRole = normalizeUserRole(context.role);

  const isSuperAdminRole =
    normalizedRole === 'admin_root' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'admin_tecnico';

  if (isSuperAdminRole) return true;

  const roleAllowed = rule.allowedRoles.includes(normalizedRole);
  if (rule.anyPermissionKeys && rule.anyPermissionKeys.length > 0) {
    const anyPermAllowed = rule.anyPermissionKeys.some((k) => Boolean(context.permissions?.[k]));
    return roleAllowed && anyPermAllowed;
  }
  if (rule.permissionKey) {
    const permKey = rule.permissionKey as keyof UserPermissions;
    const permAllowed = Boolean(context.permissions?.[permKey]);
    return roleAllowed && permAllowed;
  }
  return roleAllowed;
}

export default function App() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileFrameView, setIsMobileFrameView] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isClinicorpModalOpen, setIsClinicorpModalOpen] = useState(false);
  const [isMultiClinicModalOpen, setIsMultiClinicModalOpen] = useState(false);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isRolloutReportModalOpen, setIsRolloutReportModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isTotemModalOpen, setIsTotemModalOpen] = useState(false);
  const [isAdminGamificationOpen, setIsAdminGamificationOpen] = useState(false);
  const [isWebAuthnModalOpen, setIsWebAuthnModalOpen] = useState(false);
  const [isInternalMessagingOpen, setIsInternalMessagingOpen] = useState(false);
  const [isCRMModalOpen, setIsCRMModalOpen] = useState(false);
  const [unreadStaffMessagesCount, setUnreadStaffMessagesCount] = useState(0);
  const [arrivalAlert, setArrivalAlert] = useState<{
    patientName: string;
    dentistName?: string;
    clinicId: number;
    time: string;
  } | null>(null);
  const [lastSeenCheckinId, setLastSeenCheckinId] = useState<string | null>(null);

  const [appMode, setAppMode] = useState<'patient' | 'dentist' | 'root'>(() => {
    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app')?.toLowerCase();

    if (
      pathname.startsWith('/root') ||
      pathname.startsWith('/tutoriais') ||
      appParam === 'root' ||
      appParam === 'admin' ||
      appParam === 'tutoriais'
    ) {
      return 'root';
    }
    if (pathname.startsWith('/portal') || appParam === 'paciente' || appParam === 'patient') {
      return 'patient';
    }
    return 'dentist';
  });

  // Multi-Tenant state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | 'all'>('all');
  const [userContext, setUserContext] = useState<AppUserContext>(dataService.getUserContext());
  const [urlParamsUserId, setUrlParamsUserId] = useState<string | null>(null);
  const [urlParamsEmail, setUrlParamsEmail] = useState<string | null>(null);
  const [urlParamsRole, setUrlParamsRole] = useState<string | null>(null);

  // Admin Root Simulation state (Alternativa A)
  const [simulatedRole, setSimulatedRole] = useState<UserRole | 'none'>('none');

  const realUserIsRoot = useMemo(() => {
    return (
      userContext.role === 'admin_root' ||
      userContext.role === 'admin' ||
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
      )
    );
  }, [userContext]);

  const effectiveUserContext = useMemo(() => {
    const baseRole = normalizeUserRole(
      simulatedRole !== 'none' && realUserIsRoot ? simulatedRole : userContext.role
    );
    const defaultPerms = getDefaultPermissionsForRole(baseRole);

    const mergedPermissions = {
      ...defaultPerms,
      ...(userContext.permissions || {}),
      ...(baseRole === 'receptionist' ? { canViewAllDentistsAgenda: true } : {}),
    };

    if (simulatedRole !== 'none' && realUserIsRoot) {
      const boundClinicId = selectedClinicId !== 'all' ? selectedClinicId : userContext.clinicId || 1;
      const boundAllowedClinics =
        simulatedRole === 'gerente_atendimento' ? [1, 2] : [boundClinicId];
      return {
        ...userContext,
        role: simulatedRole,
        clinicId: boundClinicId,
        receptionClinicId: simulatedRole === 'receptionist' ? boundClinicId : undefined,
        allowedClinicIds: boundAllowedClinics,
        permissions: getDefaultPermissionsForRole(simulatedRole),
      };
    }

    return {
      ...userContext,
      role: baseRole,
      permissions: mergedPermissions,
    };
  }, [userContext, simulatedRole, realUserIsRoot, selectedClinicId]);

  const componentAccess = useMemo(() => {
    return {
      crm: canAccessComponent('crm', effectiveUserContext),
      userManagement: canAccessComponent('userManagement', effectiveUserContext),
      multiClinic: canAccessComponent('multiClinic', effectiveUserContext),
      adminGamification: canAccessComponent('adminGamification', effectiveUserContext),
      databaseSchema: canAccessComponent('databaseSchema', effectiveUserContext),
      clinicorpSync: canAccessComponent('clinicorpSync', effectiveUserContext),
      rolloutReport: canAccessComponent('rolloutReport', effectiveUserContext),
      voucherRedemption: canAccessComponent('voucherRedemption', effectiveUserContext),
      totemQR: canAccessComponent('totemQR', effectiveUserContext),
      webAuthn: canAccessComponent('webAuthn', effectiveUserContext),
      internalMessaging: canAccessComponent('internalMessaging', effectiveUserContext),
      adminSimulationToolbar: realUserIsRoot,
    };
  }, [effectiveUserContext, realUserIsRoot]);

  // Load dentists and check URL query params on initial mount
  useEffect(() => {
    const loadedClinics = dataService.getClinics();
    setClinics(loadedClinics);
    setSelectedClinicId(dataService.getSelectedClinicId());
    setUserContext(dataService.getUserContext());

    const params = new URLSearchParams(window.location.search);
    const paramUserId = params.get('user_id');
    const paramRole = params.get('role') as UserRole | null;
    const paramEmail = params.get('email');
    const paramName = params.get('name');
    const paramClinicId = params.get('clinic_id');
    const paramDentist = (params.get('dentist') || params.get('dentist_id'))?.toLowerCase();
    const paramFirstAccess = params.get('first_access');
    const paramDate = params.get('date');

    if (paramUserId) setUrlParamsUserId(paramUserId);
    if (paramEmail) setUrlParamsEmail(paramEmail);
    if (paramRole) setUrlParamsRole(paramRole);

    if (paramDate) {
      const parsedDate = new Date(`${paramDate}T12:00:00`);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
      }
    }

    const list = dataService.getDentists();
    setDentists(list);

    // 1. Ensure user from invite link is registered in local service if opened on fresh device
    if (paramUserId) {
      let targetUser = dataService.getSystemUserById(paramUserId);
      if (!targetUser && paramEmail) {
        targetUser = dataService.getSystemUsers().find(
          (u) => u.email.toLowerCase() === paramEmail.toLowerCase()
        );
      }

      if (!targetUser) {
        const assignedRole: UserRole = paramRole || 'dentist';
        const assignedClinic = paramClinicId ? Number(paramClinicId) : 1;
        let assignedDentistId: number | undefined = paramDentist ? Number(paramDentist) : undefined;
        if (!assignedDentistId && paramEmail) {
          const matchedDentist = list.find((d) => d.Email && d.Email.toLowerCase() === paramEmail.toLowerCase());
          if (matchedDentist) assignedDentistId = matchedDentist.id;
        }

        targetUser = {
          id: paramUserId,
          name: paramName || (paramEmail ? paramEmail.split('@')[0] : 'Profissional Bertuol'),
          email: paramEmail || 'usuario@bertuolodontologia.com.br',
          role: assignedRole,
          clinicId: assignedClinic,
          allowedClinicIds: [assignedClinic],
          dentist_id: assignedDentistId,
          permissions: getDefaultPermissionsForRole(assignedRole),
          active: true,
          password: 'Bertuol@2026',
          initialPassword: 'Bertuol@2026',
          mustChangePassword: true, // Invited users accessing via link must authenticate and create password!
          createdAt: new Date().toISOString(),
          lastLoginAt: 'Aguardando 1º acesso',
        };
        dataService.upsertSystemUser(targetUser);
      }
    }

    // Find initial dentist from query param or cache if available
    const currentCtx = dataService.getUserContext();
    const currentNormalizedRole = normalizeUserRole(currentCtx.role);
    let initialDentist: Dentist | null = null;
    if (paramDentist && paramDentist !== 'all') {
      initialDentist =
        list.find((d) => String(d.id) === paramDentist) ||
        list.find((d) => d.Name.toLowerCase().includes(paramDentist)) ||
        null;
    } else if (paramDentist === 'all') {
      initialDentist = null;
    } else if (currentNormalizedRole === 'receptionist') {
      const selectedId = dataService.getSelectedDentistId();
      initialDentist = selectedId === 0 ? null : list.find((d) => d.id === selectedId) || null;
    } else {
      if (currentCtx.dentistId && currentNormalizedRole === 'dentist') {
        initialDentist = list.find((d) => d.id === currentCtx.dentistId) || null;
      }
      if (!initialDentist) {
        const selectedId = dataService.getSelectedDentistId();
        if (selectedId === 0 && currentNormalizedRole !== 'dentist') {
          initialDentist = null;
        } else {
          initialDentist = list.find((d) => d.id === selectedId) || list.find((d) => d.id === 6036933394890752) || list[0] || null;
        }
      }
    }
    setSelectedDentist(initialDentist);

    // Background multi-device sync (also refreshes the logged-in user's role/permissions from DB)
    fetch('/api/system-users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          data.users.forEach((su: SystemUser) => dataService.upsertSystemUser(su, { skipRemoteSync: true }));
          const activeCtx = dataService.getUserContext();
          if (activeCtx?.isAuthenticated && (activeCtx.userId || activeCtx.email)) {
            const freshRecord = data.users.find(
              (su: SystemUser) =>
                (activeCtx.userId && su.id === activeCtx.userId) ||
                (activeCtx.email && su.email && su.email.toLowerCase() === activeCtx.email.toLowerCase())
            );
            if (freshRecord) {
              const freshRole = normalizeUserRole(freshRecord.role);
              const freshClinicId = freshRecord.clinicId || activeCtx.clinicId || 1;
              const syncedCtx: AppUserContext = {
                ...activeCtx,
                userId: freshRecord.id,
                userName: freshRecord.name || activeCtx.userName,
                email: freshRecord.email || activeCtx.email,
                role: freshRole,
                clinicId: freshClinicId,
                receptionClinicId: freshRole === 'receptionist' ? freshClinicId : activeCtx.receptionClinicId,
                allowedClinicIds: freshRecord.allowedClinicIds || activeCtx.allowedClinicIds || [freshClinicId],
                dentistId: freshRole === 'receptionist' ? undefined : (freshRecord.dentist_id ?? activeCtx.dentistId),
                permissions: {
                  ...getDefaultPermissionsForRole(freshRole),
                  ...(freshRecord.permissions || {}),
                  ...(freshRole === 'receptionist' ? { canViewAllDentistsAgenda: true } : {}),
                },
              };
              dataService.setUserContext(syncedCtx);
              setUserContext(dataService.getUserContext());
              if (freshRole === 'receptionist') {
                setSelectedClinicId(freshClinicId);
                dataService.setSelectedClinicId(freshClinicId);
              }
            }
          }
        }
      })
      .catch(() => {});

    // 1. Fetch real Bertuol dentistas directly from Clinicorp API
    fetch('/api/clinicorp/professionals')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.professionals?.length > 0) {
          dataService.syncProfissionaisFromClinicorp(resData.professionals);
          const updatedList = dataService.getDentists();
          setDentists(updatedList);
          setSelectedDentist((prev) => {
            if (paramDentist === 'all') return null;
            if (paramDentist) {
              const matchedParam =
                updatedList.find((d) => String(d.id) === paramDentist) ||
                updatedList.find((d) => d.Name.toLowerCase().includes(paramDentist));
              if (matchedParam) return matchedParam;
            }
            const activeRole = normalizeUserRole(dataService.getUserContext().role);
            if (!prev && (activeRole === 'receptionist' || dataService.getSelectedDentistId() === 0)) {
              return null;
            }
            if (!prev) return updatedList.find((d) => d.id === 5229563695136768) || updatedList[0] || null;
            return updatedList.find((d) => d.id === prev.id) || updatedList.find((d) => d.id === 5229563695136768) || updatedList[0] || null;
          });
        }
      })
      .catch((err) => console.warn('Aviso: Falha ao carregar profissionais do Clinicorp:', err));

    // 2. Automatically sync official appointment categories from Clinicorp API
    fetch('/api/clinicorp/categories')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.categories && resData.categories.length > 0) {
          dataService.syncCategoriesFromClinicorp(resData.categories);
        }
      })
      .catch((err) => console.warn('Aviso: Falha ao carregar categorias do Clinicorp:', err));
  }, []);

  // Abre automaticamente o modal da Central de Atendimento se o link contiver modal=mensageria ou app=atendente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modalParam = params.get('modal')?.toLowerCase();
    const appParam = params.get('app')?.toLowerCase();
    if (modalParam === 'mensageria' || modalParam === 'messaging' || appParam === 'atendente' || appParam === 'staff') {
      setIsInternalMessagingOpen(true);
    }
  }, []);

  // Keep URL query parameters in sync with selected dentist and date
  useEffect(() => {
    try {
      const dateKey = formatDateKey(currentDate);
      const params = new URLSearchParams(window.location.search);
      params.set('dentist', selectedDentist ? String(selectedDentist.id) : 'all');
      params.set('date', dateKey);
      const newRelativePathQuery = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newRelativePathQuery);
    } catch {
      // Safe fallback: ignore iframe restrictions on history manipulation
    }
  }, [selectedDentist, currentDate]);

  // Load appointments when selectedDentist, currentDate, selectedClinicId, or effectiveUserContext changes
  useEffect(() => {
    setIsLoading(true);
    const dateKey = formatDateKey(currentDate);
    const dentistId = selectedDentist?.id || 0;

    // Initial load from local cache with multi-tenant filtering
    const cached = dataService.getAppointments(dentistId, dateKey, selectedClinicId, effectiveUserContext);
    setAppointments(cached);

    // Fetch directly from live Clinicorp appointments API
    fetch(`/api/clinicorp/appointments?from=${dateKey}&to=${dateKey}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.appointments)) {
          dataService.syncAppointmentsFromClinicorp(resData.appointments, dateKey);
          const fresh = dataService.getAppointments(dentistId, dateKey, selectedClinicId, effectiveUserContext);
          setAppointments(fresh);
        } else if (cached.length > 0) {
          setAppointments(cached);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Erro ao carregar agendamentos do Clinicorp:', err);
        if (cached.length > 0) {
          setAppointments(cached);
        }
        setIsLoading(false);
      });
  }, [selectedDentist, currentDate, selectedClinicId, effectiveUserContext]);

  // Listener em tempo real para avisar chegada de paciente no Totem (RF04)
  useEffect(() => {
    const checkArrivals = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (userContext.role === 'dentist' && selectedDentist?.id) {
          queryParams.set('dentist_id', String(selectedDentist.id));
        }
        if (typeof selectedClinicId === 'number') {
          queryParams.set('clinic_id', String(selectedClinicId));
        }
        const res = await fetch(`/api/reception/checkins/recent?${queryParams.toString()}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const latest = list[0];
            const checkinTime = new Date(latest.timestamp).getTime();
            const now = Date.now();
            // Notifica se o checkin ocorreu nos últimos 5 minutos e não foi dispensado
            if (now - checkinTime < 300000 && latest.id !== lastSeenCheckinId) {
              setLastSeenCheckinId(latest.id);
              setArrivalAlert({
                patientName: latest.patientName,
                dentistName: latest.dentistName,
                clinicId: latest.clinicId,
                time: new Date(latest.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              });

              // Chime sonoro suave via Web Audio API (não depende de arquivo de áudio externo)
              try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                  const ctx = new AudioCtx();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Nota Ré5
                  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // Nota Lá5
                  gain.gain.setValueAtTime(0.12, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.5);
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {}
    };

    const interval = setInterval(checkArrivals, 7000);
    return () => clearInterval(interval);
  }, [selectedDentist, selectedClinicId, userContext, lastSeenCheckinId]);

  // Listener para contagem de mensagens não lidas da equipe (Recepção / Dentista)
  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const isDentist = effectiveUserContext.role === 'dentist';
        const currentDentistName =
          dentists.find((d) => d.id === effectiveUserContext.dentistId)?.Name || effectiveUserContext.userName;
        const convs = await messagingService.getConversations({
          clinicId: selectedClinicId,
          dentistName: isDentist ? currentDentistName : undefined,
          role: effectiveUserContext.role,
        });
        if (isMounted) {
          const totalUnread = convs.reduce((acc, c) => acc + (c.unread_count || 0), 0);
          setUnreadStaffMessagesCount(totalUnread);
        }
      } catch {
        // Ignora erros transitórios de rede
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [effectiveUserContext, selectedClinicId, dentists]);

  const handleSelectDentist = (dentist: Dentist | null) => {
    setSelectedDentist(dentist);
    dataService.setSelectedDentistId(dentist ? dentist.id : 0);
  };

  const handleSelectClinic = (clinicId: number | 'all') => {
    setSelectedClinicId(clinicId);
    dataService.setSelectedClinicId(clinicId);
  };

  const handleUpdateUserContext = (ctx: AppUserContext) => {
    const normalizedRole = normalizeUserRole(ctx.role);
    dataService.setUserContext({ ...ctx, role: normalizedRole });
    setUserContext(dataService.getUserContext());
    if (normalizedRole === 'receptionist') {
      const recClinicId = ctx.receptionClinicId || ctx.clinicId || 1;
      setSelectedClinicId(recClinicId);
      dataService.setSelectedClinicId(recClinicId);
      setSelectedDentist(null);
      dataService.setSelectedDentistId(0);
    }
  };

  const handleUpdateSummary = (appointmentId: number, summary: string) => {
    // 1. Update in memory/local storage
    const updated = dataService.updateAppointmentSummary(appointmentId, summary);
    if (updated) {
      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? { ...app, ai_summary: summary } : app))
      );
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment((prev) => (prev ? { ...prev, ai_summary: summary } : null));
      }
    }

    // 2. Persist to live Supabase DB asynchronously
    updateAppointmentAiSummaryInSupabase(appointmentId, summary);
  };

  const handleResetData = () => {
    dataService.resetToDefaults();
    const list = dataService.getDentists();
    setDentists(list);
    setClinics(dataService.getClinics());
    if (selectedDentist) {
      const dateKey = formatDateKey(currentDate);
      setAppointments(dataService.getAppointments(selectedDentist.id, dateKey, selectedClinicId, userContext));
    }
  };

  const handleOpenAppointmentById = (appointmentId: number) => {
    const found = dataService.getAppointmentById(appointmentId);
    if (found) {
      setSelectedAppointment(found);
    }
  };

  // Filter appointments by search & category
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const matchesSearch =
        !searchQuery ||
        app.PatientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.Procedures.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.Notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategoryFilter === 'all' || app.CategoryId === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [appointments, searchQuery, selectedCategoryFilter]);

  // Unique categories in current day's appointments for quick pill filter
  const dayCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    appointments.forEach((a) => {
      if (a.category && !map.has(a.CategoryId)) {
        map.set(a.CategoryId, {
          id: a.CategoryId,
          name: a.category.description,
          color: a.category.color,
        });
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  // Daily statistics
  const totalDayAppointments = appointments.length;
  const summarizedCount = appointments.filter((a) => Boolean(a.ai_summary)).length;

  const handleCategoriesUpdated = (_newCategories: Category[]) => {
    if (selectedDentist) {
      const dateKey = formatDateKey(currentDate);
      setAppointments(dataService.getAppointments(selectedDentist.id, dateKey));
    }
  };

  const handleSimulateUser = (user: SystemUser) => {
    const normalizedRole = normalizeUserRole(user.role);
    const newContext: AppUserContext = {
      userId: user.id,
      role: normalizedRole,
      userName: user.name,
      email: user.email,
      dentistId: normalizedRole === 'receptionist' ? undefined : user.dentist_id,
      clinicId: user.clinicId,
      allowedClinicIds: user.allowedClinicIds,
      receptionClinicId: normalizedRole === 'receptionist' ? user.clinicId : undefined,
      canAccessConfig: normalizedRole === 'admin_root' || normalizedRole === 'admin',
      permissions: {
        ...getDefaultPermissionsForRole(normalizedRole),
        ...(user.permissions || {}),
      },
      mustChangePassword: user.mustChangePassword,
      isAuthenticated: true,
    };
    handleUpdateUserContext(newContext);

    if (normalizedRole === 'receptionist') {
      handleSelectDentist(null);
      handleSelectClinic(user.clinicId || 1);
    } else {
      if (user.dentist_id) {
        const foundDentist = dentists.find((d) => d.id === user.dentist_id);
        if (foundDentist) handleSelectDentist(foundDentist);
      }
      if (user.clinicId) {
        handleSelectClinic(user.clinicId);
      }
    }

    if (user.mustChangePassword) {
      setIsChangePasswordModalOpen(true);
    }
  };

  const handleLoginSuccess = (context: AppUserContext) => {
    const normalizedRole = normalizeUserRole(context.role);
    dataService.setUserContext({ ...context, role: normalizedRole });
    const normalizedCtx = dataService.getUserContext();
    setUserContext(normalizedCtx);

    if (normalizedCtx.clinicId) {
      dataService.setSelectedClinicId(normalizedCtx.clinicId);
      setSelectedClinicId(normalizedCtx.clinicId);
    }
    if (normalizedRole === 'receptionist') {
      setSelectedDentist(null);
      dataService.setSelectedDentistId(0);
    } else if (normalizedCtx.dentistId) {
      const allDentists = dataService.getDentists();
      const foundDentist =
        allDentists.find((d) => d.id === normalizedCtx.dentistId) ||
        dentists.find((d) => d.id === normalizedCtx.dentistId);
      if (foundDentist) {
        setSelectedDentist(foundDentist);
        dataService.setSelectedDentistId(foundDentist.id);
      }
    }
    if (normalizedCtx.mustChangePassword) {
      setIsChangePasswordModalOpen(true);
    }
  };

  const handleLogout = () => {
    dataService.logout();
    setUserContext(dataService.getUserContext());
  };

  const handleSwitchToDentist = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('app');
    const nextPath = url.pathname.toLowerCase().startsWith('/portal') ? '/' : url.pathname;
    window.history.pushState({}, '', nextPath + (url.search ? url.search : ''));
    setAppMode('dentist');
  };

  const handleSwitchToPatient = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('app', 'paciente');
    window.history.pushState({}, '', url.pathname + '?' + url.searchParams.toString());
    setAppMode('patient');
  };

  const handleSwitchToRoot = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('app', 'root');
    window.history.pushState({}, '', url.pathname + '?' + url.searchParams.toString());
    setAppMode('root');
  };

  // 1. Modo SuperAdmin / Root (/root/*)
  if (appMode === 'root') {
    return (
      <TenantProvider>
        <RootLayout
          userContext={effectiveUserContext}
          onNavigateToApp={handleSwitchToDentist}
          onNavigateToPatient={handleSwitchToPatient}
        />
      </TenantProvider>
    );
  }

  // 2. Modo Paciente ativo (/portal/*)
  if (appMode === 'patient') {
    return (
      <TenantProvider>
        <PatientLayout userContext={effectiveUserContext}>
          <PatientApp
            onSwitchToDentistView={handleSwitchToDentist}
            onOpenAdminGamificationModal={() => setIsAdminGamificationOpen(true)}
          />
          {/* Admin Clube de Vantagens (acessível diretamente a partir do modo paciente) */}
          <AdminGamificationModal
            isOpen={isAdminGamificationOpen}
            onClose={() => setIsAdminGamificationOpen(false)}
            staffName={userContext.userName || 'Administração Bertuol'}
          />
          {/* Heads-Up Push Notification Banner (Top of Screen) - 100% Fixado */}
          <HeadsUpNotification
            onOpenAppointment={handleOpenAppointmentById}
            onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
          />
        </PatientLayout>
      </TenantProvider>
    );
  }

  // Se o usuário não está autenticado na Aplicação da Clínica, exibe a tela de Login
  if (!userContext.isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          initialUserId={urlParamsUserId}
          initialEmail={urlParamsEmail}
          initialRole={urlParamsRole}
        />
      </div>
    );
  }

  return (
    <TenantProvider>
      <ClinicLayout userContext={effectiveUserContext}>
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#147A80]/20 selection:text-slate-900 w-full max-w-full overflow-x-hidden">
      {/* Barra Compacta Exclusiva do SuperAdmin Root */}
      {componentAccess.adminSimulationToolbar && (
        <div className="bg-slate-900 text-slate-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0 z-40 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-semibold text-slate-100 truncate">Modo SuperAdmin Root</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">v{APP_VERSION}</span>
            {simulatedRole !== 'none' && (
              <>
                <span className="text-slate-500" aria-hidden="true">·</span>
                <span className="text-[11px] font-semibold text-amber-300">Simulando perfil</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={String(selectedClinicId)}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  handleSelectClinic(val);
                }}
                className="bg-transparent text-slate-100 text-xs font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="text-slate-900">Todas as Unidades</option>
                {clinics
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">
                      {c.shortName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={simulatedRole}
                onChange={(e) => {
                  const nextRole = e.target.value as UserRole | 'none';
                  setSimulatedRole(nextRole);
                  if (nextRole === 'receptionist') {
                    handleSelectDentist(null);
                  }
                  if (
                    (nextRole === 'receptionist' || nextRole === 'dentist' || nextRole === 'admin_clinica') &&
                    selectedClinicId === 'all'
                  ) {
                    handleSelectClinic(1);
                  }
                }}
                className="bg-transparent text-slate-100 text-xs font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="none" className="text-slate-900">Visão Admin Root</option>
                <option value="admin_clinica" className="text-slate-900">Admin Clínica</option>
                <option value="gerente_atendimento" className="text-slate-900">Gerente Multiclínica</option>
                <option value="receptionist" className="text-slate-900">Recepção Local</option>
                <option value="dentist" className="text-slate-900">Dentista</option>
              </select>
            </div>

            {simulatedRole !== 'none' && (
              <button
                type="button"
                onClick={() => {
                  setSimulatedRole('none');
                  handleSelectClinic('all');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs cursor-pointer transition-colors"
              >
                Restaurar Root
              </button>
            )}

            <button
              type="button"
              onClick={handleSwitchToRoot}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-medium text-xs cursor-pointer transition-colors"
              title="Abrir Central Admin Root e Tutoriais (/root)"
            >
              Central Root
            </button>
          </div>
        </div>
      )}

      {/* Top Header Component (Multi-Tenant, RF01 Dropdown & Branding) */}
      <Header
        dentists={dentists}
        selectedDentist={selectedDentist}
        onSelectDentist={handleSelectDentist}
        clinics={clinics}
        selectedClinicId={selectedClinicId}
        onSelectClinic={handleSelectClinic}
        userContext={effectiveUserContext}
        onUpdateUserContext={handleUpdateUserContext}
        onOpenMultiClinicModal={() => setIsMultiClinicModalOpen(true)}
        isMobileView={isMobileFrameView}
        onToggleView={() => setIsMobileFrameView(!isMobileFrameView)}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenClinicorpModal={() => setIsClinicorpModalOpen(true)}
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onOpenWebAuthnModal={() => setIsWebAuthnModalOpen(true)}
        onOpenRolloutReportModal={() => setIsRolloutReportModalOpen(true)}
        onOpenVoucherModal={() => setIsVoucherModalOpen(true)}
        onOpenTotemQRModal={() => setIsTotemModalOpen(true)}
        onOpenAdminGamificationModal={() => setIsAdminGamificationOpen(true)}
        onOpenMessagingModal={() => setIsInternalMessagingOpen(true)}
        unreadMessagesCount={unreadStaffMessagesCount}
        onOpenCRMModal={() => setIsCRMModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Live Reception Totem Arrival Alert Banner (RF04) */}
      {arrivalAlert && (
        <div className="bg-[#147A80] text-white px-4 py-3 shrink-0 border-b border-[#0F5C61] z-30">
          <div className="flex items-center gap-3 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <BertuolBotAvatar mood="alert" size="md" className="shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-teal-100 flex items-center gap-2">
                  <span>Check-in na recepção · {arrivalAlert.time}</span>
                  {arrivalAlert.dentistName?.includes('Avaliador') && (
                    <span className="font-semibold text-white">· Ambiente de testes</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold truncate mt-0.5">
                  Paciente {arrivalAlert.patientName} realizou check-in para {arrivalAlert.dentistName || 'o consultório'}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setArrivalAlert(null)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              Dispensar
            </button>
          </div>
        </div>
      )}

      {/* First Access / Temporary Password Alert Banner */}
      {userContext.mustChangePassword && (
        <div className="bg-amber-600 text-white px-4 py-2.5 shrink-0 border-b border-amber-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-4xl mx-auto w-full justify-between text-xs">
            <span className="font-medium">
              <strong className="font-semibold">Primeiro acesso:</strong> Você está utilizando uma senha provisória. Cadastre sua senha definitiva para proteger sua conta.
            </span>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs cursor-pointer shrink-0 transition-colors"
            >
              Cadastrar Senha
            </button>
          </div>
        </div>
      )}

      {/* PWA Install & Alert Prompt Banner */}
      <PWAInstallBanner onOpenNotifications={() => setIsNotificationModalOpen(true)} />

      {/* Main Container: Supports Mobile Frame Simulation or Full Responsive */}
      <main className="flex-1 flex justify-center py-3 sm:py-6 px-2 sm:px-4 w-full max-w-full overflow-x-hidden min-w-0">
        <div
          className={`w-full max-w-full min-w-0 transition-all duration-300 ${
            isMobileFrameView
              ? 'max-w-[420px] bg-white rounded-[40px] shadow-2xl border-8 border-gray-900 overflow-hidden flex flex-col min-h-[780px] my-auto'
              : 'max-w-4xl bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col'
          }`}
        >
          {/* Mobile frame simulated top status indicator */}
          {isMobileFrameView && (
            <div className="bg-gray-900 text-white px-6 pt-2 pb-1.5 flex items-center justify-between text-xs select-none">
              <span className="font-semibold text-[11px]">09:41</span>
              <div className="w-16 h-4 bg-black rounded-full mx-auto" />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Date Navigation Bar (RF03) */}
          <DateNavigator
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            totalAppointments={totalDayAppointments}
          />

          {/* Quick Metrics Bar & Search / Filter */}
          <div className="px-4 py-3.5 sm:px-5 bg-white border-b border-slate-200 space-y-3">
            {/* Clean Unboxed Metrics Line */}
            <div className="flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Progresso do dia</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 tabular-nums">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {summarizedCount} de {totalDayAppointments} com resumo IA
                  </span>
                </span>
              </div>

              {summarizedCount < totalDayAppointments && (
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {totalDayAppointments - summarizedCount} aguardando síntese
                </span>
              )}
            </div>

            {/* Sober Daily Executive Briefing Strip */}
            {appointments.length > 0 && (
              <div
                onClick={() => setIsDailyBriefingOpen(true)}
                className="bg-slate-50 hover:bg-slate-100/80 rounded-xl p-3 sm:px-4 border border-slate-200 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#EBF8F8] text-[#147A80] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900 truncate">
                          Resumo do dia · {selectedDentist?.Name || 'Todos os Dentistas'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="tabular-nums shrink-0">{appointments.length} consultas</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5 tabular-nums">
                        Início às <strong className="text-slate-800">{appointments[0]?.fromTime}</strong> com{' '}
                        <strong className="text-slate-800">{appointments[0]?.PatientName || 'Paciente'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Configurar push matinal"
                    >
                      <Bell className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Push Matinal</span>
                    </button>

                    <div className="px-3 py-1.5 rounded-lg bg-[#147A80] group-hover:bg-[#0F5C61] text-white text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap">
                      <span className="hidden md:inline">Ver Resumo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por paciente, procedimento ou observação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-16 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#147A80]/25 focus:border-[#147A80] transition-colors min-h-[40px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Category Filter Buttons */}
            {dayCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-[#147A80] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  Todas ({appointments.length})
                </button>

                {dayCategories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() =>
                      setSelectedCategoryFilter(
                        selectedCategoryFilter === cat.id ? 'all' : cat.id
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition-colors flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
                      selectedCategoryFilter === cat.id
                        ? 'border-transparent text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    style={{
                      backgroundColor:
                        selectedCategoryFilter === cat.id ? cat.color : undefined,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          selectedCategoryFilter === cat.id ? '#ffffff' : cat.color,
                      }}
                    />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chronological List of Appointments (RF02) */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2.5 bg-slate-50/70">
            {isLoading ? (
              <div className="space-y-2.5">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="space-y-2.5">
                {filteredAppointments.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onClick={() => setSelectedAppointment(appt)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="py-14 sm:py-20 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-[#147A80] border border-slate-200">
                  <CalendarX className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Nenhum paciente agendado para esta data
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                    {searchQuery
                      ? 'Nenhum agendamento encontrado com os filtros informados.'
                      : 'Utilize os botões de navegação acima para verificar outros dias da semana.'}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategoryFilter('all');
                    }}
                    className="mt-2 text-xs font-semibold text-[#147A80] hover:underline cursor-pointer"
                  >
                    Redefinir filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Single Clean App Footer */}
          <footer className="bg-white px-4 sm:px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Bertuol Flow</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span>Bertuol Odontologia Avançada</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
              <span>Toque em qualquer atendimento para abrir detalhes e síntese</span>
              <span aria-hidden="true">·</span>
              <span>v{APP_VERSION}</span>
            </div>
          </footer>

          {/* Mobile frame simulated home indicator */}
          {isMobileFrameView && (
            <div className="bg-white py-2 flex justify-center">
              <div className="w-32 h-1 bg-gray-400 rounded-full" />
            </div>
          )}
        </div>
      </main>

      {/* Screen 2: Consultation Details Modal (RF04 & RF05 with Gemini AI) */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdateSummary={handleUpdateSummary}
      />

      {/* Supabase Schema / DDL Modal */}
      <DatabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        onResetData={handleResetData}
      />

      {/* Clinicorp API Sync Modal */}
      <ClinicorpSyncModal
        isOpen={isClinicorpModalOpen}
        onClose={() => setIsClinicorpModalOpen(false)}
        onCategoriesUpdated={handleCategoriesUpdated}
      />

      {/* Push Notification Center Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        dentists={dentists}
        selectedDentist={selectedDentist}
        onSelectDentist={handleSelectDentist}
        onOpenAppointment={handleOpenAppointmentById}
        userRole={userContext.role}
      />

      {/* Multi-Clinic & Multi-Tenant Management Modal */}
      <MultiClinicModal
        isOpen={isMultiClinicModalOpen}
        onClose={() => setIsMultiClinicModalOpen(false)}
        clinics={clinics}
        selectedClinicId={selectedClinicId}
        onSelectClinic={handleSelectClinic}
        userContext={userContext}
        onUpdateUserContext={handleUpdateUserContext}
        onClinicsUpdated={(updatedClinics) => setClinics(updatedClinics)}
      />

      {/* Heads-Up Push Notification Banner (Top of Screen) */}
      <HeadsUpNotification
        onOpenAppointment={handleOpenAppointmentById}
        onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
      />

      {/* Daily Executive Agenda Briefing Modal */}
      <DailyBriefingModal
        isOpen={isDailyBriefingOpen}
        onClose={() => setIsDailyBriefingOpen(false)}
        appointments={appointments}
        selectedDentist={selectedDentist}
        clinic={clinics.find((c) => c.id === (selectedClinicId === 'all' ? 1 : selectedClinicId))}
        date={formatDateKey(currentDate)}
        onSelectAppointment={(appt) => {
          setSelectedAppointment(appt);
        }}
      />

      {/* Floating Robot Widget (Chat-style Persona Simulator - Only for Admin Root) */}
      {componentAccess.adminSimulationToolbar && (
        <FloatingPersonaBot
          userContext={userContext}
          onUpdateUserContext={handleUpdateUserContext}
          dentists={dentists}
          selectedDentist={selectedDentist}
          onSelectDentist={handleSelectDentist}
          clinics={clinics}
          selectedClinicId={selectedClinicId}
          onSelectClinic={handleSelectClinic}
          onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
          onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* User Management & RBAC CRUD Modal */}
      {componentAccess.userManagement && (
        <UserManagementModal
          isOpen={isUserManagementModalOpen}
          onClose={() => setIsUserManagementModalOpen(false)}
          currentUserContext={userContext}
          onSimulateUser={handleSimulateUser}
          clinics={clinics}
          dentists={dentists}
        />
      )}

      {/* Self-Service Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUserContext={userContext}
        isForcedFirstAccess={userContext.mustChangePassword}
        onPasswordChanged={() => {
          const updatedCtx = dataService.getUserContext();
          setUserContext(updatedCtx);
        }}
      />

      {/* Rollout Report & Access Logs Modal */}
      {componentAccess.rolloutReport && (
        <RolloutReportModal
          isOpen={isRolloutReportModalOpen}
          onClose={() => setIsRolloutReportModalOpen(false)}
          systemUsers={dataService.getSystemUsers()}
        />
      )}

      {/* Clube Sorriso Voucher & Gamification Modal (RF05, RF06, RF07) */}
      {componentAccess.voucherRedemption && (
        <VoucherRedemptionModal
          isOpen={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
          userName={userContext.userName || 'Recepção Bertuol'}
          clinicId={typeof selectedClinicId === 'number' ? selectedClinicId : 1}
        />
      )}

      {/* Admin Clube de Vantagens: Painel de Controle e CRUDs (RF05, RF06, RF07) */}
      {componentAccess.adminGamification && (
        <AdminGamificationModal
          isOpen={isAdminGamificationOpen}
          onClose={() => setIsAdminGamificationOpen(false)}
          staffName={userContext.userName || 'Administração Bertuol'}
        />
      )}

      {/* Totem QR Code Display Modal (RF03) */}
      {componentAccess.totemQR && (
        <TotemQRCodeModal
          isOpen={isTotemModalOpen}
          onClose={() => setIsTotemModalOpen(false)}
        />
      )}

      {/* WebAuthn Biometrics & Passkeys Modal */}
      {componentAccess.webAuthn && (
        <WebAuthnModal
          isOpen={isWebAuthnModalOpen}
          onClose={() => setIsWebAuthnModalOpen(false)}
          userContext={userContext}
        />
      )}

      {/* Internal Staff Messaging Modal (Bertuol Flow) */}
      {componentAccess.internalMessaging && (
        <InternalMessagingModal
          isOpen={isInternalMessagingOpen}
          onClose={() => setIsInternalMessagingOpen(false)}
          userContext={effectiveUserContext}
          dentists={dentists}
          clinics={clinics}
          selectedClinicId={selectedClinicId}
        />
      )}

      {/* CRM Modal (Recall 6+ Meses & Pipeline WhatsApp) */}
      {componentAccess.crm && (
        <MiniCRMModal
          isOpen={isCRMModalOpen}
          onClose={() => setIsCRMModalOpen(false)}
          clinics={clinics}
          dentists={dentists}
          patients={dataService.getPatients()}
          appointments={appointments}
          userContext={effectiveUserContext}
          selectedClinicIdFilter={selectedClinicId}
          onAppointmentCreatedFromCRM={(newAppt) => {
            const dateKey = formatDateKey(currentDate);
            if (newAppt.date === dateKey) {
              setAppointments(
                dataService.getAppointments(selectedDentist?.id || 0, dateKey, selectedClinicId, effectiveUserContext)
              );
            }
          }}
        />
      )}
        </div>
      </ClinicLayout>
    </TenantProvider>
  );
}
