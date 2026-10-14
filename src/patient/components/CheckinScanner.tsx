import React from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Camera,
  Info,
  MapPin,
} from 'lucide-react';

interface CheckinScannerProps {
  isCheckedIn: boolean;
  checkinTime: string | null;
  dentistName: string;
  isCameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraError: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onTriggerFileCapture: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoCapture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenTotemModal: () => void;
  onOpenHelpModal: () => void;
  onManualCheckin: (clinicId: number, clinicName: string) => void;
}

export const CheckinScanner: React.FC<CheckinScannerProps> = ({
  isCheckedIn,
  checkinTime,
  dentistName,
  isCameraActive,
  videoRef,
  cameraError,
  onStartCamera,
  onStopCamera,
  onTriggerFileCapture,
  fileInputRef,
  onPhotoCapture,
  onOpenTotemModal,
  onOpenHelpModal,
  onManualCheckin,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-[#147A80] mx-auto flex items-center justify-center shadow-xs">
          <QrCode className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-black text-gray-900">Check-in de Presença</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
            Ao chegar na clínica, aponte a câmera para o Totem no balcão da recepção para avisar o dentista e acumular <strong>+20 pontos</strong>!
          </p>
        </div>

        {isCheckedIn ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Check-in Realizado com Sucesso!</span>
            </div>
            <p className="text-xs text-emerald-800">
              Horário registrado: <strong>{checkinTime}</strong>. A equipe e o {dentistName} receberam o aviso no painel de atendimento e chamarão você em breve.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 text-xs">
              <span className="text-emerald-700 font-medium">Pontos de Pontualidade:</span>
              <span className="font-black text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                +20 pts ganhos!
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Live Camera Scanner Box */}
            {isCameraActive && (
              <div className="rounded-2xl overflow-hidden bg-black relative aspect-square max-w-xs mx-auto border-2 border-[#147A80]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-teal-400/50 m-8 rounded-2xl flex items-center justify-center pointer-events-none">
                  <div className="w-full h-0.5 bg-teal-400 animate-pulse" />
                </div>
                <button
                  onClick={onStopCamera}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/70 text-white text-xs font-bold"
                >
                  Fechar Câmera
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              {/* Native Mobile Camera trigger (hidden file input) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPhotoCapture}
                className="hidden"
              />

              {/* Camera Error Alert */}
              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-left font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{cameraError}</span>
                  </span>
                  <button
                    onClick={onOpenHelpModal}
                    className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] shrink-0 cursor-pointer"
                  >
                    Como Ativar
                  </button>
                </div>
              )}

              {/* Modal to display Totem QR code */}
              <button
                onClick={onOpenTotemModal}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs hover:scale-[1.01]"
              >
                <span className="flex items-center gap-2.5">
                  <QrCode className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-left">
                    <strong className="block text-xs">Exibir QR Code Oficial do Totem de Balcão</strong>
                    <span className="text-[10px] text-amber-800 font-normal">
                      Abra na tela para apontar o celular ou imprimir para a recepção
                    </span>
                  </span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-200 text-amber-950 text-[10px] font-black shrink-0">
                  Ver Totem
                </span>
              </button>

              {/* Native Camera Photo */}
              <button
                onClick={onTriggerFileCapture}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
              >
                <Camera className="w-4 h-4 text-emerald-200" />
                <span>📸 Abrir Câmera do Celular (Tirar Foto do Totem)</span>
              </button>

              {/* Live Web Scanner */}
              <button
                onClick={onStartCamera}
                className="w-full py-2.5 px-4 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-teal-400" />
                <span>🎥 Escanear com Câmera ao Vivo no Navegador</span>
              </button>

              {/* Camera Permissions Guide */}
              <button
                type="button"
                onClick={onOpenHelpModal}
                className="text-[11px] text-gray-500 hover:text-[#147A80] font-semibold flex items-center justify-center gap-1 py-0.5 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-gray-400" />
                <span>Como liberar a permissão da câmera no navegador?</span>
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-2 text-[10px] text-gray-400 uppercase font-bold absolute">
                  Ou toque na sua unidade:
                </span>
              </div>

              {/* Quick 1-click check-in shortcuts */}
              <button
                onClick={() => onManualCheckin(1, 'Matriz Palmas')}
                className="w-full py-3 px-4 rounded-2xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <span>Estou na Recepção de <strong>Palmas</strong></span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-black">
                  +20 pts
                </span>
              </button>

              <button
                onClick={() => onManualCheckin(2, 'Unidade Paraíso')}
                className="w-full py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>Estou na Recepção de <strong>Paraíso</strong></span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-300 text-gray-800 text-[11px] font-black">
                  +20 pts
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
