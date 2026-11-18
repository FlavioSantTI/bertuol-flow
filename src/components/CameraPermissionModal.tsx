import React from 'react';
import {
  X,
  Camera,
  AlertTriangle,
  Smartphone,
  Globe,
  RefreshCw,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Como Ativar a Câmera
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Permissão necessária para ler o QR Code
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 bg-slate-50/70">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Fallback - 100% Reliable Camera Photo Button */}
          <div className="p-4 rounded-xl bg-[#147A80] text-white shadow-sm space-y-2 text-center">
            <span className="text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-md inline-block">
              Opção Mais Direta
            </span>
            <h3 className="text-sm font-bold">Tirar Foto do Totem com a Câmera</h3>
            <p className="text-xs text-teal-100">
              Abre diretamente o aplicativo de câmera do seu celular para fotografar o código.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onUsePhotoCapture();
              }}
              className="w-full h-10 mt-2 px-4 rounded-xl bg-white hover:bg-teal-50 text-[#147A80] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Abrir Câmera do Celular</span>
            </button>
          </div>

          <div className="relative py-1 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-slate-50 px-2.5 text-[11px] text-slate-500 font-semibold relative">
              Ou libere a câmera ao vivo no navegador
            </span>
          </div>

          {/* Android Chrome Instructions */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Smartphone className="w-4 h-4 text-[#147A80]" />
              <span>No Celular (Android / Chrome):</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600 leading-relaxed text-xs">
              <li>Toque no ícone de <strong>ajustes ou cadeado</strong> ao lado do endereço web no topo.</li>
              <li>Toque em <strong>Permissões</strong> ou <strong>Configurações do site</strong>.</li>
              <li>Encontre <strong>Câmera</strong> e marque <strong>Permitir</strong>.</li>
              <li>Recarregue a página e tente novamente.</li>
            </ol>
          </div>

          {/* iPhone Safari Instructions */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Globe className="w-4 h-4 text-[#147A80]" />
              <span>No iPhone (Safari / iOS):</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600 leading-relaxed text-xs">
              <li>Toque no ícone <strong>aA</strong> no lado esquerdo da barra de endereço.</li>
              <li>Toque em <strong>Ajustes do Site</strong>.</li>
              <li>Na opção <strong>Câmera</strong>, selecione <strong>Permitir</strong>.</li>
            </ol>
          </div>

          {/* Desktop Instructions */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-[#147A80]" />
              <span>No Computador (Chrome / Edge / Windows):</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600 leading-relaxed text-xs">
              <li>Clique no ícone de <strong>cadeado</strong> à esquerda da URL.</li>
              <li>Ative a chave da <strong>Câmera</strong> para a posição <strong>Permitir</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="h-9 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Ativar Novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
