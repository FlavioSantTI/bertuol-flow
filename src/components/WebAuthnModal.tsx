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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#E2E6E7]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-[#4BBCBE] via-[#23B3BB] to-[#199A9F] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Fingerprint className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                Autenticação Biométrica & Passkeys
              </h2>
              <p className="text-xs text-white/90">
                Acesso com Face ID, Touch ID ou Windows Hello sem digitar senha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 max-h-[75vh]">
          {/* Explanation Banner */}
          <div className="p-3.5 bg-teal-50/70 border border-[#4BBCBE]/30 text-teal-950 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-[#199A9F] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-teal-900">
                Segurança Criptográfica Padrão FIDO2 / W3C
              </span>
              <span>
                Sua biometria nunca sai do chip de segurança deste aparelho (Secure Enclave / TPM). O
                Bertuol Flow apenas valida a assinatura digital garantindo acesso em 1 toque.
              </span>
            </div>
          </div>

          {/* Feedback alerts */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-800'
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
          <div className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#199A9F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Cadastrar Este Aparelho
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-3.5 leading-relaxed">
              Dê um nome para identificar este dispositivo (ex: celular pessoal ou tablet do
              consultório) e confirme com sua biometria.
            </p>

            <form onSubmit={handleRegisterDevice} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Nome / Apelido do Aparelho *
                </label>
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Ex: iPhone 15 Pro Dr. Favuca"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-[#4BBCBE] focus:border-transparent outline-hidden font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering || !deviceName.trim()}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-linear-to-r from-[#4BBCBE] to-[#199A9F] hover:from-[#3BA8AA] hover:to-[#147A80] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Aguardando biometria no dispositivo...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 stroke-[2.5]" />
                    <span>Ativar Face ID / Biometria Neste Aparelho</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section: Registered Devices List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Dispositivos Cadastrados ({devices.length})
              </h3>
              <button
                onClick={loadDevices}
                className="text-xs text-gray-500 hover:text-[#199A9F] flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#4BBCBE]" />
                <span>Carregando chaves cadastradas...</span>
              </div>
            ) : devices.length === 0 ? (
              <div className="py-7 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60">
                <Fingerprint className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <span className="text-xs font-bold text-gray-600 block">
                  Nenhum dispositivo cadastrado ainda
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">
                  Cadastre seu iPhone, Android ou notebook acima para fazer login em 1 clique.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {devices.map((device) => {
                  const isMobile =
                    /iPhone|iPad|Android/i.test(device.deviceName) ||
                    device.deviceName.toLowerCase().includes('phone') ||
                    device.deviceName.toLowerCase().includes('celular');

                  return (
                    <div
                      key={device.id}
                      className="p-3.5 bg-white border border-gray-200 rounded-2xl flex items-center justify-between gap-3 hover:border-gray-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#199A9F] shrink-0">
                          {isMobile ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-900 block truncate">
                            {device.deviceName}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                            <span>
                              Criado em {new Date(device.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            {device.lastUsedAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 font-semibold">
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
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
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
        <div className="p-4 bg-[#F8F9FA] border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
