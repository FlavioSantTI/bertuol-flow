import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, BellRing, Sparkles } from 'lucide-react';

interface PWAInstallBannerProps {
  onOpenNotifications?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenNotifications }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed as PWA or user dismissed this session
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if browser supports installation or is iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-linear-to-r from-[#4BBCBE] via-[#23B3BB] to-[#199A9F] text-white px-3 sm:px-4 py-2 shadow-xs border-b border-[#4BBCBE]/30 w-full max-w-full overflow-hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 text-xs sm:text-sm min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate text-white leading-tight text-xs sm:text-sm">
                Instale o Bertuol Flow no celular
              </p>
              <p className="text-[10px] sm:text-[11px] text-white/90 truncate hidden xs:block">
                Receba alertas sonoros e notificações de pacientes direto no seu dispositivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-amber-900 font-bold text-[11px] sm:text-xs hover:bg-amber-50 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-amber-900 font-bold text-[11px] sm:text-xs hover:bg-amber-50 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Como Instalar</span>
              </button>
            )}

            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                title="Configurar Alertas e Som"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/15 hover:bg-black/25 text-white text-xs font-semibold transition-colors shrink-0"
              >
                <BellRing className="w-3.5 h-3.5" />
                Alertas
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md text-amber-100 hover:text-white hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
              title="Dispensar por enquanto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guided Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-gray-600 space-y-2.5">
              <p className="font-medium text-gray-800">
                Para ter o aplicativo na tela inicial do seu iPhone e receber alertas:
              </p>
              <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    No Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima) na barra inferior.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Toque em <strong>"Adicionar"</strong> no canto superior direito.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 font-medium">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>O ícone oficial da Bertuol será adicionado à sua tela de apps!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
