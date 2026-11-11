import React from 'react';
import {
  X,
  Camera,
  AlertTriangle,
  Smartphone,
  Globe,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface CameraPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onUsePhotoCapture: () => void;
  errorMessage?: string | null;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onUsePhotoCapture,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-amber-500 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Camera className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">Como Ativar a Câmera</h2>
              <p className="text-xs text-amber-900/80 font-medium">Permissão necessária para ler o QR Code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-amber-950 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 bg-[#FAFAFA]">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Fallback - 100% Reliable Camera Photo Button */}
          <div className="p-4 rounded-2xl bg-[#147A80] text-white shadow-md space-y-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
              Opção Mais Rápida e Direta
            </span>
            <h3 className="text-sm font-black">Tirar Foto do Totem com a Câmera</h3>
            <p className="text-xs text-teal-100">
              Abre diretamente o aplicativo de câmera do seu celular para você fotografar o código.
            </p>
            <button
              onClick={() => {
                onClose();
                onUsePhotoCapture();
              }}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Camera className="w-4 h-4 text-amber-950" />
              <span>Abrir Câmera do Celular Agora</span>
            </button>
          </div>

          <div className="relative py-1 flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-[#FAFAFA] px-2 text-[10px] text-gray-400 uppercase font-bold absolute">
              Ou libere a câmera ao vivo no navegador:
            </span>
          </div>

          {/* Android Chrome Instructions */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <Smartphone className="w-4 h-4 text-[#147A80]" />
              <span>No Celular (Android / Chrome):</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-gray-600 leading-relaxed text-[11px]">
              <li>Toque no ícone de <strong>ajustes/cadeado 🔒</strong> ao lado do endereço web no topo.</li>
              <li>Toque em <strong>Permissões</strong> ou <strong>Configurações do site</strong>.</li>
              <li>Encontre <strong>Câmera</strong> e marque <strong>Permitir</strong>.</li>
              <li>Recarregue a página e tente novamente.</li>
            </ol>
          </div>

          {/* iPhone Safari Instructions */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <Globe className="w-4 h-4 text-[#147A80]" />
              <span>No iPhone (Safari / iOS):</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-gray-600 leading-relaxed text-[11px]">
              <li>Toque no ícone <strong>aA</strong> no lado esquerdo da barra de endereço.</li>
              <li>Toque em <strong>Ajustes do Site</strong>.</li>
              <li>Na opção <strong>Câmera</strong>, selecione <strong>Permitir</strong>.</li>
            </ol>
          </div>

          {/* Desktop Instructions */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <Lock className="w-4 h-4 text-[#147A80]" />
              <span>No Computador (Chrome / Edge / Windows):</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-gray-600 leading-relaxed text-[11px]">
              <li>Clique no ícone de <strong>cadeado 🔒</strong> à esquerda da URL.</li>
              <li>Ative a chave da <strong>Câmera</strong> para a posição <strong>Permitir</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="px-4 py-2.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Ativar Novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
