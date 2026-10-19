import React from 'react';
import { X, Download, FileText, Image as ImageIcon, Video } from 'lucide-react';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'document' | 'audio' | string;
  title?: string;
  patientName?: string;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  title = 'Visualização de Mídia',
  patientName,
}) => {
  if (!isOpen || !mediaUrl) return null;

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <header className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
            {mediaType === 'image' && <ImageIcon className="w-5 h-5" />}
            {mediaType === 'video' && <Video className="w-5 h-5" />}
            {mediaType === 'document' && <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
            {patientName && (
              <p className="text-xs text-slate-400 mt-0.5">Paciente: {patientName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={mediaUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Baixar arquivo"
          >
            <Download className="w-4 h-4" />
            <span>Baixar</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Viewer */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {mediaType === 'image' && (
          <img
            src={mediaUrl}
            alt={title}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
          />
        )}

        {mediaType === 'video' && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-slate-800"
          />
        )}

        {mediaType === 'document' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center text-white space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">{title}</h4>
              <p className="text-xs text-slate-400 mt-1">
                Documento anexado à conversa do paciente.
              </p>
            </div>
            <a
              href={mediaUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Documento</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
