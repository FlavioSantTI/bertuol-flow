import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  QrCode,
  Sparkles,
  Building2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Megaphone,
  FileCode2,
  Link2,
} from 'lucide-react';

interface TotemQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateScan?: (clinicId: number, clinicName: string) => void;
}

const OFFICIAL_DOMAIN = 'https://bertuolflow.app-bertuol.tech';

export const TotemQRCodeModal: React.FC<TotemQRCodeModalProps> = ({
  isOpen,
  onClose,
  onSimulateScan,
}) => {
  const [activeMode, setActiveMode] = useState<'marketing' | 'totem'>(
    onSimulateScan ? 'totem' : 'marketing'
  );
  const [selectedClinic, setSelectedClinic] = useState<{ id: number; name: string; address: string }>({
    id: 1,
    name: 'Unidade Matriz Palmas',
    address: '104 Sul, Av. JK, Palmas - TO',
  });

  // Marketing folder options (always rooted at /paciente so patients never land on staff login)
  const [marketingPreset, setMarketingPreset] = useState<'patient_portal' | 'checkin_direct' | 'custom'>('patient_portal');
  const [customUrl, setCustomUrl] = useState<string>(`${OFFICIAL_DOMAIN}/paciente?utm_source=folder`);
  const [qrColor, setQrColor] = useState<'#0D9488' | '#0F172A'>('#0D9488');
  const [transparentBg, setTransparentBg] = useState<boolean>(false);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrHighResDataUrl, setQrHighResDataUrl] = useState<string>('');
  const [qrSvgMarkup, setQrSvgMarkup] = useState<string>('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveMode(onSimulateScan ? 'totem' : 'marketing');
    }
  }, [isOpen, onSimulateScan]);

  const totemBaseUrl =
    typeof window !== 'undefined' ? window.location.origin : OFFICIAL_DOMAIN;
  const totemPayload = `${totemBaseUrl}/paciente?checkin=totem&clinic_id=${selectedClinic.id}&clinic_name=${encodeURIComponent(
    selectedClinic.name
  )}`;

  const marketingPayload =
    marketingPreset === 'patient_portal'
      ? `${OFFICIAL_DOMAIN}/paciente`
      : marketingPreset === 'checkin_direct'
        ? `${OFFICIAL_DOMAIN}/paciente?checkin=totem&clinic_id=${selectedClinic.id}&clinic_name=${encodeURIComponent(
            selectedClinic.name
          )}`
        : customUrl.trim() || `${OFFICIAL_DOMAIN}/paciente`;

  const qrPayload = activeMode === 'marketing' ? marketingPayload : totemPayload;

  useEffect(() => {
    if (!isOpen || !qrPayload) return;

    const darkColor = activeMode === 'marketing' ? qrColor : '#0D9488';
    const lightColor = activeMode === 'marketing' && transparentBg ? '#00000000' : '#FFFFFF';

    let cancelled = false;

    Promise.all([
      QRCode.toDataURL(qrPayload, {
        width: 400,
        margin: 2,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: 'H',
      }),
      QRCode.toDataURL(qrPayload, {
        width: 1200,
        margin: 2,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: 'H',
      }),
      QRCode.toString(qrPayload, {
        type: 'svg',
        margin: 2,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: 'H',
      }),
    ])
      .then(([previewUrl, highResUrl, svgStr]) => {
        if (cancelled) return;
        setQrCodeDataUrl(previewUrl);
        setQrHighResDataUrl(highResUrl);
        setQrSvgMarkup(svgStr);
      })
      .catch((err) => console.error('Erro ao gerar QRCode:', err));

    return () => {
      cancelled = true;
    };
  }, [isOpen, qrPayload, activeMode, qrColor, transparentBg]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadPng = () => {
    const urlToDownload = qrHighResDataUrl || qrCodeDataUrl;
    if (!urlToDownload) return;
    const a = document.createElement('a');
    a.href = urlToDownload;
    a.download =
      activeMode === 'marketing'
        ? `qrcode-portal-paciente-bertuol-1200px.png`
        : `totem-checkin-bertuol-${selectedClinic.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const handleDownloadSvg = () => {
    if (!qrSvgMarkup) return;
    const blob = new Blob([qrSvgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      activeMode === 'marketing'
        ? `qrcode-portal-paciente-bertuol-vetor.svg`
        : `totem-checkin-bertuol-${selectedClinic.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePrint = () => {
    try {
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
                border: 4px solid #0D9488; border-radius: 36px; padding: 40px 30px;
                max-width: 440px; margin: 0 auto; text-align: center;
              }
              .brand { font-size: 26px; font-weight: 900; color: #0F766E; margin-bottom: 2px; }
              .subbrand { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 20px; }
              .badge { display: inline-block; background: #f0fdfa; border: 1px solid #99f6e4; color: #0f766e; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
              .title { font-size: 26px; font-weight: 900; margin: 0 0 6px 0; color: #0f172a; }
              .clinic { font-size: 13px; color: #475569; margin-bottom: 20px; font-weight: 600; }
              .qr-box { border: 3px dashed #0D9488; border-radius: 24px; padding: 14px; display: inline-block; background: #ffffff; margin-bottom: 20px; }
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
              <div class="points-pill">Ganhe +20 pontos no Clube Sorriso</div>
              <div class="footer">Seu dentista é avisado instantaneamente na sala de atendimento.</div>
            </div>
          </body>
        </html>
      `;

      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        const t0 = performance.now();
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
        const elapsed = performance.now() - t0;
        if (window.self !== window.top && elapsed < 90) {
          window.open(`/totem-imprimir?clinic_id=${selectedClinic.id}&autoprint=1`, '_blank', 'noopener,noreferrer');
        }
      }, 250);
    } catch {
      window.open(`/totem-imprimir?clinic_id=${selectedClinic.id}&autoprint=1`, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">
                Central de QR Code · Bertuol Flow
              </h2>
              <p className="text-xs text-slate-500">
                Gere QR Codes para folders de marketing ou para o totem da recepção
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de QR Code"
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('marketing')}
            className={`flex-1 h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeMode === 'marketing'
                ? 'bg-[#147A80] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Folder Marketing (Pacientes)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('totem')}
            className={`flex-1 h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeMode === 'totem'
                ? 'bg-[#147A80] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Totem de Check-in (Recepção)</span>
          </button>
        </div>

        {/* Sub-controls per mode */}
        {activeMode === 'marketing' ? (
          <div className="px-5 py-3.5 bg-white border-b border-slate-200 space-y-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Link de Destino para o Folder
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMarketingPreset('patient_portal')}
                  className={`h-9 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    marketingPreset === 'patient_portal'
                      ? 'bg-teal-50 border-[#0D9488] text-[#0F766E]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Portal Clube Sorriso (/paciente)
                </button>
                <button
                  type="button"
                  onClick={() => setMarketingPreset('checkin_direct')}
                  className={`h-9 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    marketingPreset === 'checkin_direct'
                      ? 'bg-teal-50 border-[#0D9488] text-[#0F766E]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Check-in Direto (?checkin=totem)
                </button>
                <button
                  type="button"
                  onClick={() => setMarketingPreset('custom')}
                  className={`h-9 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    marketingPreset === 'custom'
                      ? 'bg-teal-50 border-[#0D9488] text-[#0F766E]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  URL Personalizada
                </button>
              </div>
            </div>

            {marketingPreset === 'custom' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Cole ou edite o endereço exclusivo de pacientes (ex: com UTM)
                </label>
                <div className="relative">
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://bertuolflow.app-bertuol.tech/paciente?utm_source=folder"
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>
            )}

            {/* Print styling options */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600">Cor:</span>
                <button
                  type="button"
                  onClick={() => setQrColor('#0D9488')}
                  className={`h-8 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                    qrColor === '#0D9488'
                      ? 'border-[#0D9488] bg-teal-50 text-[#0F766E]'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-sm bg-[#0D9488]" />
                  <span>Verde Teal (Paciente)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrColor('#0F172A')}
                  className={`h-8 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                    qrColor === '#0F172A'
                      ? 'border-slate-900 bg-slate-100 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-sm bg-slate-900" />
                  <span>Preto Gráfico</span>
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#0D9488] cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-700">
                  Fundo Transparente (para arte)
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs gap-2">
            <span className="font-medium text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#147A80]" />
              Unidade do Totem:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() =>
                  setSelectedClinic({
                    id: 1,
                    name: 'Unidade Matriz Palmas',
                    address: '104 Sul, Av. JK, Palmas - TO',
                  })
                }
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedClinic.id === 1
                    ? 'bg-[#147A80] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Palmas
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedClinic({
                    id: 2,
                    name: 'Unidade Paraíso do Tocantins',
                    address: 'Av. Bernardo Sayão, Paraíso - TO',
                  })
                }
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedClinic.id === 2
                    ? 'bg-[#147A80] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paraíso
              </button>
            </div>
          </div>
        )}

        {/* Preview Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-center flex-1 bg-[#F8FAFC]">
          {activeMode === 'marketing' ? (
            <div className="max-w-sm mx-auto space-y-3">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
                <div className="text-center">
                  <span className="text-[11px] font-semibold text-[#0F766E] block">
                    Arte Pronta para Impressão (300 DPI / Vetor)
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {marketingPreset === 'patient_portal'
                      ? 'Portal do Paciente & Clube Sorriso'
                      : marketingPreset === 'checkin_direct'
                        ? `Check-in Direto · ${selectedClinic.name}`
                        : 'QR Code Personalizado (Paciente)'}
                  </h3>
                </div>

                <div
                  className={`p-4 rounded-xl border border-slate-200 flex items-center justify-center ${
                    transparentBg
                      ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] bg-slate-50'
                      : 'bg-white'
                  }`}
                >
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Portal do Paciente Bertuol"
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                      Gerando QR Code...
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
                  <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    URL codificada neste QR Code:
                  </span>
                  <p className="text-[11px] font-mono text-[#147A80] break-all select-all">
                    {qrPayload}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dica para gráfica: prefira o arquivo <strong>SVG (Vetor)</strong> para ampliar sem perder nitidez, ou o <strong>PNG 1200px</strong> para uso rápido em Canva e redes sociais.
              </p>
            </div>
          ) : (
            <div
              id="printable-totem-display"
              className="max-w-xs mx-auto bg-white rounded-2xl p-6 shadow-sm border-2 border-[#0D9488]/35 space-y-4"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0D9488] flex items-center justify-center text-white font-bold text-sm">
                  b
                </div>
                <div className="text-left leading-none">
                  <span className="text-sm font-bold text-[#0F766E] tracking-tight block">bertuol</span>
                  <span className="text-[9px] font-medium text-slate-400 tracking-wider block">
                    Clube Sorriso · Paciente
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#0F766E] block">
                  Totem de Autoatendimento
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Check-in de Chegada</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedClinic.name}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-dashed border-[#0D9488]/45 flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR Code Check-in ${selectedClinic.name}`}
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                    Gerando QR Code...
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  Aponte a câmera do seu celular para este código ao chegar
                </p>
                <div className="p-2 rounded-lg bg-teal-50 border border-teal-200/70 text-[#0f5c61] text-xs font-medium flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
                  <span>Ganhe +20 pontos no Clube Sorriso</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                Seu dentista é avisado instantaneamente na sala de atendimento.
              </div>
            </div>
          )}

          {activeMode === 'totem' && onSimulateScan && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onSimulateScan(selectedClinic.id, selectedClinic.name);
                  onClose();
                }}
                className="w-full h-10 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Simular Leitura deste QR Code (+20 pts)</span>
              </button>
              <p className="text-xs text-slate-500 mt-1.5">
                Teste o check-in imediato sem precisar de um segundo aparelho.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedPayload ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar Link</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Baixar PNG (Alta Res.)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="h-9 px-3.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Formato vetorial ideal para gráfica e folders"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Baixar SVG (Vetor)</span>
            </button>

            {activeMode === 'totem' && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-9 px-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#147A80] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Tentar imprimir diretamente nesta janela"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Direto</span>
                </button>

                <a
                  href={`/totem-imprimir?clinic_id=${selectedClinic.id}&autoprint=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Abre a folha A4 em nova guia e abre a impressora do Windows imediatamente"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimir A4</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
