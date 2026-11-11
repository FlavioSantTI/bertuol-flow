import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  QrCode,
  Sparkles,
  MapPin,
  Building2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface TotemQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateScan?: (clinicId: number, clinicName: string) => void;
}

export const TotemQRCodeModal: React.FC<TotemQRCodeModalProps> = ({
  isOpen,
  onClose,
  onSimulateScan,
}) => {
  const [selectedClinic, setSelectedClinic] = useState<{ id: number; name: string; address: string }>({
    id: 1,
    name: 'Unidade Matriz Palmas',
    address: '104 Sul, Av. JK, Palmas - TO',
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Generate QR Code with checkin URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bertuolodontologia.com.br';
  const qrPayload = `${baseUrl}/paciente?checkin=totem&clinic_id=${selectedClinic.id}&clinic_name=${encodeURIComponent(
    selectedClinic.name
  )}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(qrPayload, {
        width: 400,
        margin: 2,
        color: {
          dark: '#147A80', // Bertuol brand deep teal
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QRCode:', err));
    }
  }, [isOpen, selectedClinic]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `totem-checkin-bertuol-${selectedClinic.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const handlePrint = () => {
    try {
      // 1. Tenta impressão em iframe isolado sem as barras da página
      const existingFrame = document.getElementById('bertuol-print-frame');
      if (existingFrame) existingFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'bertuol-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Totem de Check-in Bertuol - ${selectedClinic.name}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; padding: 20px; color: #0f172a; background: #ffffff;
                display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh;
              }
              .card {
                border: 4px solid #147A80; border-radius: 36px; padding: 40px 30px;
                max-width: 440px; margin: 0 auto; text-align: center;
              }
              .brand { font-size: 26px; font-weight: 900; color: #147A80; margin-bottom: 2px; }
              .subbrand { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 20px; }
              .badge { display: inline-block; background: #f0fdfa; border: 1px solid #99f6e4; color: #0f766e; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
              .title { font-size: 26px; font-weight: 900; margin: 0 0 6px 0; color: #0f172a; }
              .clinic { font-size: 13px; color: #475569; margin-bottom: 20px; font-weight: 600; }
              .qr-box { border: 3px dashed #147A80; border-radius: 24px; padding: 14px; display: inline-block; background: #ffffff; margin-bottom: 20px; }
              .qr-img { width: 250px; height: 250px; display: block; }
              .instruction { font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 12px; line-height: 1.4; }
              .points-pill { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 12px; display: inline-block; margin-bottom: 16px; }
              .footer { font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="brand">bertuol</div>
              <div class="subbrand">Odontologia Avançada</div>
              <div class="badge">Totem de Autoatendimento</div>
              <div class="title">Check-in de Chegada</div>
              <div class="clinic">${selectedClinic.name} • ${selectedClinic.address}</div>
              <div class="qr-box"><img class="qr-img" src="${qrCodeDataUrl}" alt="QR Code Totem" /></div>
              <div class="instruction">Aponte a câmera do seu celular para este código ao chegar</div>
              <div class="points-pill">⭐ Ganhe +20 pontos no Clube Sorriso!</div>
              <div class="footer">Seu dentista é avisado instantaneamente na sala de atendimento.</div>
            </div>
          </body>
        </html>
      `;

      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          window.print();
        }
      }, 400);
    } catch (err) {
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-[#147A80] to-[#0f5c61] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <QrCode className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Totem de Check-in • QR Code de Balcão</h2>
              <p className="text-xs text-teal-100 font-medium">Display Oficial para Leitura dos Pacientes (RF03)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clinic Unit Switcher */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-600 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#147A80]" />
            Selecione a Unidade do Totem:
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() =>
                setSelectedClinic({
                  id: 1,
                  name: 'Unidade Matriz Palmas',
                  address: '104 Sul, Av. JK, Palmas - TO',
                })
              }
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedClinic.id === 1
                  ? 'bg-[#147A80] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Palmas
            </button>
            <button
              onClick={() =>
                setSelectedClinic({
                  id: 2,
                  name: 'Unidade Paraíso do Tocantins',
                  address: 'Av. Bernardo Sayão, Paraíso - TO',
                })
              }
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedClinic.id === 2
                  ? 'bg-[#147A80] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Paraíso
            </button>
          </div>
        </div>

        {/* Printable Totem Card Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-center flex-1 bg-[#FAFAFA]">
          {/* Acrylic Display Mockup */}
          <div
            id="printable-totem-display"
            className="max-w-xs mx-auto bg-white rounded-3xl p-6 shadow-xl border-4 border-[#147A80]/20 space-y-4 relative overflow-hidden"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#147A80] flex items-center justify-center text-white font-black text-sm">
                b
              </div>
              <div className="text-left leading-none">
                <span className="text-sm font-black text-[#147A80] tracking-tight block">bertuol</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">
                  Odontologia Avançada
                </span>
              </div>
            </div>

            {/* Checkin Title */}
            <div>
              <span className="px-3 py-1 rounded-full bg-teal-50 text-[#147A80] font-black text-[10px] uppercase tracking-wider border border-teal-200">
                Totem de Autoatendimento
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-2">Check-in de Chegada</h3>
              <p className="text-xs text-gray-500 mt-0.5">{selectedClinic.name}</p>
            </div>

            {/* QR Code Canvas */}
            <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-[#147A80]/40 shadow-inner flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code Check-in ${selectedClinic.name}`}
                  className="w-56 h-56 object-contain rounded-xl"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-xs">
                  Gerando QR Code...
                </div>
              )}
            </div>

            {/* Instruction */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-800 leading-tight">
                Aponte a câmera do seu celular para este código ao chegar
              </p>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Ganhe +20 pontos no Clube Sorriso!</span>
              </div>
            </div>

            <div className="text-[9px] text-gray-400 border-t border-gray-100 pt-2 font-medium">
              Seu dentista é avisado instantaneamente na sala de atendimento.
            </div>
          </div>

          {/* Quick Simulation Button (for laptop/browser testers) */}
          {onSimulateScan && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onSimulateScan(selectedClinic.id, selectedClinic.name);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#147A80]/20 transition-all cursor-pointer active:scale-98"
              >
                <Smartphone className="w-4 h-4 text-amber-300" />
                <span>Simular Leitura deste QR Code Agora (+20 pts)</span>
              </button>
              <p className="text-[11px] text-gray-400 mt-1.5">
                (Clique para testar o check-in imediato com este QR Code sem precisar de um 2º aparelho)
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedPayload ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copiar Link</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>Baixar Imagem</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-[#147A80] font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Tentar imprimir diretamente nesta janela"
            >
              <Printer className="w-3.5 h-3.5 text-[#147A80]" />
              <span>Imprimir Direto</span>
            </button>

            {/* Link direto que abre fora do iframe e chama a impressora nativa do Windows */}
            <a
              href={`/totem-imprimir?clinic_id=${selectedClinic.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-black flex items-center gap-2 transition-all shadow-md shadow-[#147A80]/20 cursor-pointer text-xs active:scale-95"
              title="Abre a folha A4 em nova guia e abre a impressora do Windows imediatamente"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Imprimir no Windows (A4)</span>
              <ExternalLink className="w-3.5 h-3.5 text-teal-200" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
