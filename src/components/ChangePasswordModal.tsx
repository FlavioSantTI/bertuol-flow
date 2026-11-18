import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck, Sparkles } from 'lucide-react';
import { AppUserContext, SystemUser } from '../types/database';
import { dataService, getDefaultPermissionsForRole } from '../services/dataService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserContext: AppUserContext;
  isForcedFirstAccess?: boolean;
  onPasswordChanged?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUserContext,
  isForcedFirstAccess = false,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Password strength check
  const isLengthOk = newPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isStrong = isLengthOk && hasLetter && hasNumberOrSymbol;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLengthOk) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da nova senha não confere.');
      return;
    }

    // Find user in system by userId, getSystemUserById, or email
    let targetUser = currentUserContext.userId ? dataService.getSystemUserById(currentUserContext.userId) : undefined;
    if (!targetUser) {
      const allUsers = dataService.getSystemUsers();
      targetUser = allUsers.find(
        (u) =>
          (currentUserContext.userId && u.id === currentUserContext.userId) ||
          (currentUserContext.email && u.email.toLowerCase() === currentUserContext.email.toLowerCase()) ||
          (currentUserContext.dentistId && u.dentist_id === currentUserContext.dentistId)
      );
    }

    let userToUpdate: SystemUser;
    if (targetUser) {
      userToUpdate = targetUser;
    } else {
      // Auto-register session user if missing in current local storage
      userToUpdate = {
        id: currentUserContext.userId || `usr_${Date.now()}`,
        name: currentUserContext.userName || 'Profissional Bertuol',
        email: currentUserContext.email || 'usuario@bertuolodontologia.com.br',
        role: currentUserContext.role || 'dentist',
        clinicId: currentUserContext.clinicId || 1,
        allowedClinicIds: currentUserContext.allowedClinicIds || [1],
        dentist_id: currentUserContext.dentistId,
        permissions: getDefaultPermissionsForRole(currentUserContext.role || 'dentist'),
        active: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      };
      dataService.upsertSystemUser(userToUpdate);
    }

    // If current password provided, verify if matches (or accept Bertuol@2026 or targetUser.initialPassword)
    if (userToUpdate.password && currentPassword.trim()) {
      const inputPass = currentPassword.trim();
      const matches =
        inputPass === userToUpdate.password ||
        inputPass === userToUpdate.initialPassword ||
        inputPass === 'Bertuol@2026';
      if (!matches) {
        setError('A senha provisória informada não confere com a recebida.');
        return;
      }
    }

    const res = dataService.changeUserPassword(userToUpdate.id, newPassword.trim());
    if (!res.success) {
      setError(res.error || 'Falha ao alterar senha.');
      return;
    }

    setSuccess(true);
    if (onPasswordChanged) onPasswordChanged();

    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {isForcedFirstAccess ? 'Cadastrar Senha Definitiva' : 'Alterar Minha Senha'}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">
                {currentUserContext.userName} ({currentUserContext.email || 'Usuário'})
              </p>
            </div>
          </div>

          {!isForcedFirstAccess && (
            <button
              onClick={onClose}
              aria-label="Fechar janela"
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs bg-[#F8FAFC]/40">
          {isForcedFirstAccess && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-xs">Primeiro Acesso Detectado</span>
                <span className="text-xs text-amber-800 leading-snug block mt-0.5">
                  Por segurança e privacidade da sua agenda, substitua a senha provisória cadastrando uma nova senha pessoal.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Senha cadastrada com sucesso! Redirecionando...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isForcedFirstAccess ? 'Senha Provisória Recebida' : 'Senha Atual'}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Informe a senha atual..."
                className="w-full h-10 bg-white border border-slate-300 rounded-lg pl-3 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nova Senha Pessoal *</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres..."
                className="w-full h-10 bg-white border border-slate-300 rounded-lg pl-3 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirmar Nova Senha *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a nova senha novamente..."
                className="w-full h-10 bg-white border border-slate-300 rounded-lg pl-3 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <span className="font-semibold text-slate-700 block mb-1">Requisitos de Segurança</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLengthOk ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <span className={isLengthOk ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                Pelo menos 6 caracteres
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasLetter ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <span className={hasLetter ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                Contém letras
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isMatch ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <span className={isMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                Senhas coincidem exatamente
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            {!isForcedFirstAccess && (
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={!isLengthOk || !isMatch || success}
              className="h-10 px-5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Salvar Nova Senha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
