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
import { LoginScreen } from './components/LoginScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { SkeletonCard } from './components/SkeletonLoader';
import { dataService, formatDateKey, getDefaultPermissionsForRole } from './services/dataService';
import {
  fetchDentistas,
  fetchPatients,
  fetchAppointmentsFromSupabase,
  updateAppointmentAiSummaryInSupabase,
} from './services/supabaseService';
import { Appointment, Category, Dentist, Clinic, AppUserContext, SystemUser, UserRole } from './types/database';
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

  // Multi-Tenant state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | 'all'>('all');
  const [userContext, setUserContext] = useState<AppUserContext>(dataService.getUserContext());
  const [urlParamsUserId, setUrlParamsUserId] = useState<string | null>(null);
  const [urlParamsEmail, setUrlParamsEmail] = useState<string | null>(null);
  const [urlParamsRole, setUrlParamsRole] = useState<string | null>(null);

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
    let initialDentist: Dentist | null = null;
    if (paramDentist) {
      initialDentist =
        list.find((d) => String(d.id) === paramDentist) ||
        list.find((d) => d.Name.toLowerCase().includes(paramDentist)) ||
        null;
    }
    if (!initialDentist && userContext.dentistId) {
      initialDentist = list.find((d) => d.id === userContext.dentistId) || null;
    }
    if (!initialDentist) {
      const selectedId = dataService.getSelectedDentistId();
      initialDentist = list.find((d) => d.id === selectedId) || list.find((d) => d.id === 6036933394890752) || list[0] || null;
    }
    setSelectedDentist(initialDentist);

    // Background multi-device sync
    fetch('/api/system-users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          data.users.forEach((su: SystemUser) => dataService.upsertSystemUser(su));
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
            if (paramDentist) {
              const matchedParam =
                updatedList.find((d) => String(d.id) === paramDentist) ||
                updatedList.find((d) => d.Name.toLowerCase().includes(paramDentist));
              if (matchedParam) return matchedParam;
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

  // Keep URL query parameters in sync with selected dentist and date
  useEffect(() => {
    if (!selectedDentist) return;
    try {
      const dateKey = formatDateKey(currentDate);
      const params = new URLSearchParams(window.location.search);
      params.set('dentist', String(selectedDentist.id));
      params.set('date', dateKey);
      const newRelativePathQuery = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newRelativePathQuery);
    } catch {
      // Safe fallback: ignore iframe restrictions on history manipulation
    }
  }, [selectedDentist, currentDate]);

  // Load appointments when selectedDentist, currentDate, selectedClinicId, or userContext changes
  useEffect(() => {
    setIsLoading(true);
    const dateKey = formatDateKey(currentDate);
    const dentistId = selectedDentist?.id || 0;

    // Initial load from local cache with multi-tenant filtering
    const cached = dataService.getAppointments(dentistId, dateKey, selectedClinicId, userContext);
    setAppointments(cached);

    // Fetch directly from live Clinicorp appointments API
    fetch(`/api/clinicorp/appointments?from=${dateKey}&to=${dateKey}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.appointments)) {
          dataService.syncAppointmentsFromClinicorp(resData.appointments, dateKey);
          const fresh = dataService.getAppointments(dentistId, dateKey, selectedClinicId, userContext);
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
  }, [selectedDentist, currentDate, selectedClinicId, userContext]);

  const handleSelectDentist = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    dataService.setSelectedDentistId(dentist.id);
  };

  const handleSelectClinic = (clinicId: number | 'all') => {
    setSelectedClinicId(clinicId);
    dataService.setSelectedClinicId(clinicId);
  };

  const handleUpdateUserContext = (ctx: AppUserContext) => {
    setUserContext(ctx);
    dataService.setUserContext(ctx);
    if (ctx.role === 'receptionist') {
      const recClinicId = ctx.receptionClinicId || 1;
      setSelectedClinicId(recClinicId);
      dataService.setSelectedClinicId(recClinicId);
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
    const newContext: AppUserContext = {
      userId: user.id,
      role: user.role,
      userName: user.name,
      email: user.email,
      dentistId: user.dentist_id,
      clinicId: user.clinicId,
      allowedClinicIds: user.allowedClinicIds,
      receptionClinicId: user.role === 'receptionist' ? user.clinicId : undefined,
      canAccessConfig: user.role === 'admin_root' || user.role === 'admin',
      permissions: user.permissions,
      mustChangePassword: user.mustChangePassword,
    };
    handleUpdateUserContext(newContext);

    if (user.dentist_id) {
      const foundDentist = dentists.find((d) => d.id === user.dentist_id);
      if (foundDentist) handleSelectDentist(foundDentist);
    }

    if (user.role === 'receptionist') {
      handleSelectClinic(user.clinicId);
    } else if (user.clinicId) {
      handleSelectClinic(user.clinicId);
    }

    if (user.mustChangePassword) {
      setIsChangePasswordModalOpen(true);
    }
  };

  const handleLoginSuccess = (context: AppUserContext) => {
    setUserContext(context);
    if (context.clinicId) {
      dataService.setSelectedClinicId(context.clinicId);
      setSelectedClinicId(context.clinicId);
    }
    if (context.dentistId) {
      const allDentists = dataService.getDentists();
      const foundDentist =
        allDentists.find((d) => d.id === context.dentistId) ||
        dentists.find((d) => d.id === context.dentistId);
      if (foundDentist) {
        setSelectedDentist(foundDentist);
        dataService.setSelectedDentistId(foundDentist.id);
      }
    }
    if (context.mustChangePassword) {
      setIsChangePasswordModalOpen(true);
    }
  };

  const handleLogout = () => {
    dataService.logout();
    setUserContext(dataService.getUserContext());
  };

  // If user is not authenticated, show secure Login Gate
  if (!userContext.isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        initialUserId={urlParamsUserId}
        initialEmail={urlParamsEmail}
        initialRole={urlParamsRole}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#4BBCBE]/30 selection:text-[#1A1A1A] w-full max-w-full overflow-x-hidden">
      {/* Top Header Component (Multi-Tenant, RF01 Dropdown & Branding) */}
      <Header
        dentists={dentists}
        selectedDentist={selectedDentist}
        onSelectDentist={handleSelectDentist}
        clinics={clinics}
        selectedClinicId={selectedClinicId}
        onSelectClinic={handleSelectClinic}
        userContext={userContext}
        onUpdateUserContext={handleUpdateUserContext}
        onOpenMultiClinicModal={() => setIsMultiClinicModalOpen(true)}
        isMobileView={isMobileFrameView}
        onToggleView={() => setIsMobileFrameView(!isMobileFrameView)}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenClinicorpModal={() => setIsClinicorpModalOpen(true)}
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* First Access / Temporary Password Alert Banner */}
      {userContext.mustChangePassword && (
        <div className="bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-3 sm:px-4 py-2.5 shadow-sm shrink-0 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-6xl mx-auto w-full justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
              <span>
                👋 <strong>Primeiro Acesso Detectado:</strong> Você está utilizando uma senha provisória. Por segurança, cadastre sua nova senha definitiva.
              </span>
            </span>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-black text-xs shadow-xs cursor-pointer shrink-0 transition-transform active:scale-95 text-center"
            >
              Cadastrar Minha Senha Agora
            </button>
          </div>
        </div>
      )}

      {/* PWA Install & Alert Prompt Banner */}
      <PWAInstallBanner onOpenNotifications={() => setIsNotificationModalOpen(true)} />

      {/* Main Container: Supports Mobile Frame Simulation or Full Responsive */}
      <main className="flex-1 flex justify-center py-2 sm:py-6 px-1.5 sm:px-4 w-full max-w-full overflow-x-hidden min-w-0">
        <div
          className={`w-full max-w-full min-w-0 transition-all duration-300 ${
            isMobileFrameView
              ? 'max-w-[420px] bg-white rounded-[40px] shadow-2xl border-8 border-gray-900 overflow-hidden flex flex-col min-h-[780px] my-auto'
              : 'max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col'
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
          <div className="p-3 sm:p-4 bg-white border-b border-gray-100 space-y-3">
            {/* Quick Metrics pill */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Progresso do Dia:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {summarizedCount} de {totalDayAppointments} com Resumo IA
                </span>
              </div>

              {summarizedCount < totalDayAppointments && (
                <span className="hidden sm:inline-flex text-[11px] text-amber-700 font-medium">
                  {totalDayAppointments - summarizedCount} aguardando síntese
                </span>
              )}
            </div>

            {/* Daily Executive Briefing (Push Preview & Resumo IA da Agenda) */}
            {appointments.length > 0 && (
              <div
                onClick={() => setIsDailyBriefingOpen(true)}
                className="bg-linear-to-r from-amber-500/10 via-orange-500/5 to-white hover:from-amber-500/15 hover:via-orange-500/10 rounded-2xl p-3 sm:p-3.5 border border-amber-300/80 shadow-xs cursor-pointer transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block truncate">
                          Resumo Executivo da Agenda • {selectedDentist?.Name || 'Geral'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200/80 text-amber-950 shrink-0">
                          {appointments.length} consultas
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 font-medium truncate mt-0.5">
                        Início às <strong>{appointments[0]?.fromTime}</strong> • 1º paciente: <strong>{appointments[0]?.PatientName || 'Paciente'}</strong> ({appointments[0]?.Procedures})
                      </p>
                      <span className="text-[11px] text-amber-700 font-bold group-hover:underline flex items-center gap-1 mt-0.5">
                        Toque para abrir a síntese clínica do dia
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      title="Configurar push matinal"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline">Push Matinal</span>
                    </button>

                    <div className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs group-hover:bg-amber-600 transition-colors">
                      <span className="hidden md:inline">Ver Resumo</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por paciente, procedimento ou histórico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FA] hover:bg-gray-100/80 focus:bg-white text-xs sm:text-sm text-[#1A1A1A] placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#4BBCBE] focus:border-transparent transition-all min-h-[44px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Category Pills Filter */}
            {dayCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F8F9FA] text-gray-600 hover:bg-gray-200/80'
                  }`}
                >
                  Todas ({appointments.length})
                </button>

                {dayCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setSelectedCategoryFilter(
                        selectedCategoryFilter === cat.id ? 'all' : cat.id
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                      selectedCategoryFilter === cat.id
                        ? 'border-transparent text-white shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
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
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chronological List of Appointments (RF02) */}
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 bg-[#F8F9FA]/40">
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="space-y-3">
                {filteredAppointments.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onClick={() => setSelectedAppointment(appt)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State (PRD UI/UX Section 2) */
              <div className="py-14 sm:py-20 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#4BBCBE] border border-teal-200/60 shadow-xs">
                  <CalendarX className="w-8 h-8 stroke-[1.8]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#1A1A1A]">
                    Nenhum paciente agendado para esta data
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
                    {searchQuery
                      ? 'Nenhum agendamento encontrado com os filtros informados.'
                      : 'Utilize os botões de navegação acima para verificar outros dias da semana.'}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategoryFilter('all');
                    }}
                    className="mt-2 text-xs font-bold text-[#199A9F] hover:underline"
                  >
                    Redefinir Filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick AI Tip / Footer */}
          <div className="bg-white p-3 px-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#4BBCBE]" />
              Toque no paciente para abrir a ficha e o Resumo IA
            </span>
            <span className="text-[11px] font-semibold text-gray-400">
              Bertuol • Clinicorp Ready
            </span>
          </div>

          {/* App Footer */}
          <footer className="mt-8 pt-4 pb-4 border-t border-[#E2E6E7] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#147A80]">Bertuol Flow</span>
              <span className="text-gray-300">•</span>
              <span className="text-[11px] text-gray-500">Bertuol Odontologia Avançada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#4BBCBE]/15 text-[#147A80] border border-[#4BBCBE]/30 shadow-2xs">
                Versão 0.9.1 RC
              </span>
              <span className="text-[10px] text-gray-400">© 2026</span>
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
      {userContext.role === 'admin_root' && (
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
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        currentUserContext={userContext}
        onSimulateUser={handleSimulateUser}
        clinics={clinics}
        dentists={dentists}
      />

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
    </div>
  );
}
