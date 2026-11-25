import React, { useState, useEffect } from 'react';
import {
  X,
  Fingerprint,
  Smartphone,
  Laptop,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { webauthnService, WebAuthnDeviceItem } from '../services/webauthnService';
import { AppUserContext } from '../types/database';

interface WebAuthnModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: AppUserContext;
}

export const WebAuthnModal: React.FC<WebAuthnModalProps> = ({
  isOpen,
  onClose,
  userContext,
}) => {
  const [devices, setDevices] = useState<WebAuthnDeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [isHardwareSupported, setIsHardwareSupported] = useState<boolean>(true);

  // Suggest default device name based on User-Agent
  useEffect(() => {
    if (isOpen) {
      const ua = navigator.userAgent;
      let defaultLabel = 'Meu Dispositivo';
      if (/iPhone/i.test(ua)) defaultLabel = `iPhone de ${userContext.userName?.split(' ')[0] || 'Dentista'}`;
      else if (/iPad/i.test(ua)) defaultLabel = `iPad Consultório (${userContext.userName?.split(' ')[0] || 'Clínica'})`;
      else if (/Macintosh|Mac OS/i.test(ua)) defaultLabel = `MacBook (${userContext.userName?.split(' ')[0] || 'Dr.'})`;
      else if (/Windows/i.test(ua)) defaultLabel = `Windows Consultório (${userContext.userName?.split(' ')[0] || 'Dr.'})`;
      else if (/Android/i.test(ua)) defaultLabel = `Android de ${userContext.userName?.split(' ')[0] || 'Dentista'}`;

      setDeviceName(defaultLabel);
      setFeedback(null);
      loadDevices();

      webauthnService.hasPlatformAuthenticator().then((avail) => {
        setIsHardwareSupported(avail || webauthnService.isSupported());
      });
    }
  }, [isOpen, userContext]);

  const loadDevices = async () => {
    if (!userContext.userId) return;
    setIsLoading(true);
    const list = await webauthnService.listUserDevices(userContext.userId);
    setDevices(list);
    setIsLoading(false);
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userContext.userId || !userContext.email) {
      setFeedback({
        type: 'error',
        message: 'Usuário não identificado para vinculação de biometria.',
      });
      return;
    }

    setFeedback(null);
    setIsRegistering(true);

    const result = await webauthnService.registerDevice(
      userContext.userId,
      userContext.email,
      userContext.userName || 'Profissional Bertuol',
      deviceName.trim() || 'Dispositivo Biométrico'
    );

    setIsRegistering(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Biometria cadastrada com sucesso! Agora você pode entrar com 1 toque.',
      });
      loadDevices();
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Não foi possível cadastrar a biometria neste aparelho.',
      });
    }
  };

  const handleDeleteDevice = async (credentialId: string, label: string) => {
    if (!window.confirm(`Deseja revogar a chave biométrica de "${label}"?`)) {
      return;
    }

    const res = await webauthnService.deleteDevice(credentialId);
    if (res.success) {
      setDevices((prev) => prev.filter((d) => d.id !== credentialId));
      setFeedback({
        type: 'success',
        message: `Dispositivo "${label}" revogado com sucesso.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Erro ao remover dispositivo.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                Autenticação Biométrica e Passkeys
              </h2>
              <p className="text-xs text-slate-500">
                Acesso com Face ID, Touch ID ou Windows Hello sem digitar senha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[75vh] bg-[#F8FAFC]/40">
          {/* Explanation Banner */}
          <div className="p-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#147A80] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-900">
                Segurança Criptográfica Padrão FIDO2 / W3C
              </span>
              <span>
                Sua biometria nunca sai do chip de segurança deste aparelho. O Bertuol Flow apenas valida a assinatura digital garantindo acesso em 1 toque.
              </span>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Section: Register Current Device */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#147A80]" />
              <h3 className="text-xs font-semibold text-slate-800">
                Cadastrar Este Aparelho
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Dê um nome para identificar este dispositivo e confirme com sua biometria.
            </p>

            <form onSubmit={handleRegisterDevice} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Aparelho *
                </label>
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Ex: iPhone 15 Pro Dr. Favuca"
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-900 focus:ring-2 focus:ring-[#147A80] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering || !deviceName.trim()}
                className="w-full h-10 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Aguardando biometria no dispositivo...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>Ativar Face ID / Biometria Neste Aparelho</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section: Registered Devices List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-700 tabular-nums">
                Dispositivos Cadastrados ({devices.length})
              </h3>
              <button
                onClick={loadDevices}
                className="text-xs text-slate-500 hover:text-[#147A80] flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#147A80]" />
                <span>Carregando chaves cadastradas...</span>
              </div>
            ) : devices.length === 0 ? (
              <div className="py-7 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-white">
                <Fingerprint className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-600 block">
                  Nenhum dispositivo cadastrado ainda
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Cadastre seu iPhone, Android ou notebook acima para fazer login em 1 clique.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => {
                  const isMobile =
                    /iPhone|iPad|Android/i.test(device.deviceName) ||
                    device.deviceName.toLowerCase().includes('phone') ||
                    device.deviceName.toLowerCase().includes('celular');

                  return (
                    <div
                      key={device.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200/70 flex items-center justify-center text-[#147A80] shrink-0">
                          {isMobile ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-900 block truncate">
                            {device.deviceName}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 tabular-nums">
                            <span>
                              Criado em {new Date(device.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            {device.lastUsedAt && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-700 font-medium">
                                  Último uso {new Date(device.lastUsedAt).toLocaleDateString('pt-BR')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDevice(device.id, device.deviceName)}
                        title="Revogar chave deste dispositivo"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
