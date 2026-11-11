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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div
          className={`p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-xs ${
            isForcedFirstAccess
              ? 'bg-linear-to-r from-amber-500 via-orange-500 to-amber-600'
              : 'bg-linear-to-r from-gray-900 to-gray-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                {isForcedFirstAccess ? 'Cadastrar Senha Definitiva' : 'Alterar Minha Senha'}
              </h3>
              <p className="text-xs text-white/80 mt-0.5 truncate max-w-[240px]">
                {currentUserContext.userName} ({currentUserContext.email || 'Usuário'})
              </p>
            </div>
          </div>

          {!isForcedFirstAccess && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs bg-[#FAF9F6]">
          {isForcedFirstAccess && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold block text-xs">Primeiro Acesso Detectado!</span>
                <span className="text-[11px] text-amber-900 leading-snug block mt-0.5">
                  Por segurança e privacidade da sua agenda, substitua a senha provisória cadastrando
                  uma nova senha pessoal.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>Senha cadastrada com sucesso! Redirecionando...</span>
            </div>
          )}

          {/* Current Password Field */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">
              {isForcedFirstAccess ? 'Senha Provisória Recebida' : 'Senha Atual'}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Informe a senha atual..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Nova Senha Pessoal *</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Confirmar Nova Senha *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a nova senha novamente..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Quality Criteria */}
          <div className="p-3 bg-white rounded-2xl border border-gray-200 space-y-1.5 text-[11px]">
            <span className="font-bold text-gray-700 block mb-1">Requisitos de Segurança:</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                isLengthOk ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-gray-200 text-gray-500'
              }`}>
                {isLengthOk ? '✓' : '•'}
              </span>
              <span className={isLengthOk ? 'text-emerald-800 font-semibold' : 'text-gray-500'}>
                Pelo menos 6 caracteres
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                hasLetter ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-gray-200 text-gray-500'
              }`}>
                {hasLetter ? '✓' : '•'}
              </span>
              <span className={hasLetter ? 'text-emerald-800 font-semibold' : 'text-gray-500'}>
                Contém letras
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                isMatch ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-gray-200 text-gray-500'
              }`}>
                {isMatch ? '✓' : '•'}
              </span>
              <span className={isMatch ? 'text-emerald-800 font-semibold' : 'text-gray-500'}>
                Senhas coincidem exatamente
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            {!isForcedFirstAccess && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={!isLengthOk || !isMatch || success}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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
