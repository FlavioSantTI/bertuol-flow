import React, { useState, useEffect } from 'react';
import { BertuolLogo } from './BertuolLogo';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { SystemUser, AppUserContext } from '../types/database';

interface LoginScreenProps {
  onLoginSuccess: (context: AppUserContext) => void;
  initialUserId?: string | null;
  initialEmail?: string | null;
  initialRole?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  initialUserId,
  initialEmail,
  initialRole,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberCredentials, setRememberCredentials] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bertuol_remember_credentials') === 'true';
    } catch {
      return false;
    }
  });

  // First Access state (mandatory password change)
  const [pendingFirstAccessUser, setPendingFirstAccessUser] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [changeSuccess, setChangeSuccess] = useState<boolean>(false);

  // Demo Profiles list
  const [showDemoProfiles, setShowDemoProfiles] = useState<boolean>(false);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [inviteUserFound, setInviteUserFound] = useState<SystemUser | null>(null);

  useEffect(() => {
    // Restore remembered credentials if enabled and not overridden by query params
    try {
      const savedRemember = localStorage.getItem('bertuol_remember_credentials') === 'true';
      if (savedRemember && !initialEmail && !initialUserId) {
        const savedEmail = localStorage.getItem('bertuol_saved_email');
        const savedPassword = localStorage.getItem('bertuol_saved_password');
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
      }
    } catch {}

    // If initialUserId matches Avaliador Bertuol, prefill email
    if (initialUserId === 'usr_1790684828991_8v2hw' && !email) {
      setEmail('suporte@flaviosantiago.com.br');
    }

    const users = dataService.getSystemUsers();
    setSystemUsers(users);

    // Check if coming with query params
    if (initialUserId) {
      const found = users.find((u) => u.id === initialUserId);
      if (found) {
        setInviteUserFound(found);
        setEmail(found.email);
      }
    }

    if (initialEmail) {
      const found = users.find((u) => u.email.toLowerCase() === initialEmail.toLowerCase());
      if (found) {
        setInviteUserFound(found);
        setEmail(found.email);
      } else {
        setEmail(initialEmail);
      }
    }

    // Sync from server registry
    fetch('/api/system-users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          data.users.forEach((su: SystemUser) => dataService.upsertSystemUser(su));
          const updatedUsers = dataService.getSystemUsers();
          setSystemUsers(updatedUsers);

          if (initialUserId) {
            const found = updatedUsers.find((u) => u.id === initialUserId);
            if (found) {
              setInviteUserFound(found);
              setEmail(found.email);
            }
          }
        }
      })
      .catch(() => {});
  }, [initialUserId, initialEmail]);

  // Handle standard login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Direct Online Authentication via /api/login (Supabase)
      const apiRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const apiData = await apiRes.json();

      if (apiData.success && apiData.user) {
        setIsLoading(false);
        // Sync local representation
        dataService.upsertSystemUser({
          ...apiData.user,
          password: password.trim(),
          mustChangePassword: Boolean(apiData.mustChangePassword),
        });

        if (apiData.mustChangePassword) {
          setPendingFirstAccessUser(apiData.user);
          return;
        }

        // Set authenticated user context
        dataService.setUserContext({
          userId: apiData.user.id,
          userName: apiData.user.name,
          role: apiData.user.role,
          clinicId: apiData.user.clinicId || 1,
          dentistId: apiData.user.dentist_id || 5229563695136768,
          isAuthenticated: true,
          mustChangePassword: false,
        });

        // Persist remembered credentials if requested
        try {
          if (rememberCredentials) {
            localStorage.setItem('bertuol_remember_credentials', 'true');
            localStorage.setItem('bertuol_saved_email', email.trim());
            localStorage.setItem('bertuol_saved_password', password.trim());
          } else {
            localStorage.removeItem('bertuol_remember_credentials');
            localStorage.removeItem('bertuol_saved_email');
            localStorage.removeItem('bertuol_saved_password');
          }
        } catch {}

        const userCtx = dataService.getUserContext();
        onLoginSuccess(userCtx);
        return;
      }

      if (apiData.error) {
        setIsLoading(false);
        setError(apiData.error);
        return;
      }

      // Fallback to local if needed
      const res = dataService.login(email, password);
      setIsLoading(false);
      if (!res.success || !res.user) {
        setError(res.error || 'Falha ao autenticar.');
        return;
      }
      if (res.mustChangePassword) {
        setPendingFirstAccessUser(res.user);
        return;
      }

      // Persist remembered credentials if requested
      try {
        if (rememberCredentials) {
          localStorage.setItem('bertuol_remember_credentials', 'true');
          localStorage.setItem('bertuol_saved_email', email.trim());
          localStorage.setItem('bertuol_saved_password', password.trim());
        } else {
          localStorage.removeItem('bertuol_remember_credentials');
          localStorage.removeItem('bertuol_saved_email');
          localStorage.removeItem('bertuol_saved_password');
        }
      } catch {}

      const userCtx = dataService.getUserContext();
      onLoginSuccess(userCtx);
    } catch {
      setIsLoading(false);
      setError('Erro de conexão ao processar login. Verifique sua conexão e tente novamente.');
    }
  };

  // Handle first access new password submit
  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFirstAccessUser) return;
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da nova senha não confere.');
      return;
    }

    setIsLoading(true);

    // Save locally
    const res = dataService.changeUserPassword(pendingFirstAccessUser.id, newPassword);

    // Also persist directly on server
    try {
      await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingFirstAccessUser.id, newPassword }),
      });
    } catch {}

    setIsLoading(false);

    if (!res.success || !res.user) {
      setError(res.error || 'Erro ao registrar nova senha.');
      return;
    }

    setChangeSuccess(true);
    setTimeout(() => {
      // Authenticate user with their new password
      const authRes = dataService.login(res.user!.email, newPassword);
      if (authRes.success) {
        const userCtx = dataService.getUserContext();
        onLoginSuccess(userCtx);
      }
    }, 1000);
  };

  // Quick 1-click test login for review & simulation
  const handleQuickLogin = (user: SystemUser) => {
    setError(null);
    if (user.mustChangePassword) {
      setEmail(user.email);
      setPassword(user.initialPassword || user.password || 'Bertuol@2026');
      setPendingFirstAccessUser(user);
    } else {
      const ctx = dataService.loginDirect(user);
      onLoginSuccess(ctx);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#EBF8F8] via-[#F4F7F8] to-[#FFF9E6] flex flex-col justify-center items-center p-4 sm:p-6 text-gray-900 font-sans selection:bg-[#4BBCBE]/20">
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header with Authentic Logo */}
        <div className="text-center mb-6">
          <BertuolLogo size="xl" mode="full" className="mx-auto" />
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-xs text-[#147A80] font-bold">
              Bertuol Flow • Agenda & Gestão Inteligente
            </p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#4BBCBE]/15 text-[#147A80] border border-[#4BBCBE]/30">
              Versão 1.0
            </span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-[#E2E6E7] overflow-hidden backdrop-blur-md">
          {/* STEP 1: Standard Login Form */}
          {!pendingFirstAccessUser && (
            <div className="p-6 sm:p-7 space-y-5">
              {/* Detected Invite Greeting Banner */}
              {inviteUserFound && (
                <div className="p-3.5 bg-[#EBF8F8] border border-[#4BBCBE]/40 text-[#147A80] rounded-2xl flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#199A9F] shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold text-xs block">
                      👋 Olá, {inviteUserFound.name}!
                    </span>
                    <span className="text-[11px] text-[#147A80] leading-snug block mt-0.5">
                      Seu acesso ao sistema foi liberado. Digite a senha provisória recebida no WhatsApp (ex:{' '}
                      <code className="font-mono font-bold bg-[#4BBCBE]/20 text-[#147A80] px-1 rounded">
                        Bertuol@2026
                      </code>
                      ) para acessar.
                    </span>
                  </div>
                </div>
              )}

              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                  Acessar Sistema
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Informe seus dados de acesso cadastrados
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* E-mail Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    E-mail ou Usuário *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@bertuolodontologia.com.br"
                      className="w-full bg-[#FAF9F6] border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#4BBCBE] focus:border-transparent transition-all outline-hidden shadow-2xs font-medium"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      Senha de Acesso *
                    </label>
                    <span className="text-[10px] text-gray-400">
                      Provisória ou Definitiva
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FAF9F6] border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#4BBCBE] focus:border-transparent transition-all outline-hidden shadow-2xs font-medium"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Login & Password Checkbox */}
                <div className="flex items-center justify-between pt-0.5 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={rememberCredentials}
                      onChange={(e) => setRememberCredentials(e.target.checked)}
                      className="w-4 h-4 rounded-md border-gray-300 text-[#4BBCBE] focus:ring-[#4BBCBE] focus:ring-offset-0 cursor-pointer accent-[#4BBCBE]"
                    />
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      Lembrar login e senha
                    </span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                    Neste dispositivo
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-linear-to-r from-[#4BBCBE] via-[#23B3BB] to-[#199A9F] hover:from-[#3BA8AA] hover:to-[#147A80] text-white font-black text-xs shadow-md shadow-[#4BBCBE]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Entrar no Sistema</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: First Access Mandatory Password Setup Form */}
          {pendingFirstAccessUser && (
            <div className="p-6 sm:p-7 space-y-5 bg-[#FAF9F6]">
              {/* Header */}
              <div className="bg-linear-to-r from-[#4BBCBE] via-[#23B3BB] to-[#199A9F] -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 p-5 text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight leading-tight">
                    Cadastrar Nova Senha Pessoal
                  </h3>
                  <p className="text-[11px] text-white/80 mt-0.5 truncate max-w-[240px]">
                    {pendingFirstAccessUser.name} ({pendingFirstAccessUser.email})
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-xs">Primeiro Acesso Detectado!</span>
                  <span className="text-[11px] text-amber-900 leading-snug block mt-0.5">
                    Por segurança e conformidade LGPD da sua agenda, substitua a senha provisória
                    criando uma nova senha pessoal definitiva.
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {changeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>Senha pessoal cadastrada com sucesso! Entrando na sua agenda...</span>
                </div>
              )}

              <form onSubmit={handleFirstAccessSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nova Senha Pessoal *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres..."
                      className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#FFB347] focus:border-transparent outline-hidden shadow-2xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a nova senha novamente..."
                      className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#FFB347] focus:border-transparent outline-hidden shadow-2xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit New Password Button */}
                <button
                  type="submit"
                  disabled={isLoading || changeSuccess}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Nova Senha e Concluir Acesso</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Quick Demo Switcher Accordion (Discreet for Evaluators) */}
          <div className="p-4 bg-gray-50/80 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setShowDemoProfiles(!showDemoProfiles)}
              className="text-[11px] text-gray-500 hover:text-gray-800 font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {showDemoProfiles
                  ? 'Ocultar Perfis de Demonstração'
                  : 'Acesso Rápido de Testes (Perfis Simulados)'}
              </span>
            </button>

            {showDemoProfiles && (
              <div className="mt-3 space-y-1.5 text-left animate-in fade-in">
                <span className="text-[10px] text-gray-400 font-semibold block mb-1">
                  Clique para entrar diretamente com o perfil:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {systemUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className="w-full p-2 rounded-xl bg-white hover:bg-amber-50/80 border border-gray-200 text-left transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-gray-800 group-hover:text-amber-800 block truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {u.email} • {u.role}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 group-hover:bg-amber-100 text-gray-600 group-hover:text-amber-800 shrink-0">
                        {u.mustChangePassword ? '1º Acesso' : 'Entrar'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div className="text-center mt-6 space-y-2 text-xs text-gray-400">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href="/manual-instalacao.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white text-[#147A80] hover:text-[#0f5c61] border border-[#4BBCBE]/30 font-bold text-[11px] shadow-2xs transition-all hover:scale-102"
            >
              <span>📱 Manual de Instalação</span>
            </a>
          </div>

          <p className="flex items-center justify-center gap-1.5 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Autenticação Criptografada • Sistema Bertuol Odontologia</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
            <span>Dúvidas ou redefinição de acesso? Entre em contato com o suporte.</span>
            <span>•</span>
            <span className="font-bold text-gray-500">Versão 1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
