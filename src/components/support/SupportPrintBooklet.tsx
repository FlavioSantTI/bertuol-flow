import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Printer, Check, Download, Loader2, FileText } from 'lucide-react';
import {
  SUPPORT_META,
  getSupportArticles,
} from '../../data/supportKnowledgeBase';
import type {
  SupportArticle,
  SupportMeta,
  SupportProfileId,
} from '../../types/support';
import { APP_VERSION } from '../../config/version';
import { APP_ROUTES, buildOfficialUrl } from '../../config/siteUrls';
import {
  generateSupportBookletPdf,
  triggerBlobDownload,
} from '../../utils/supportBookletPdf';

interface SupportPrintBookletProps {
  profile: SupportProfileId;
  allowedProfiles: SupportProfileId[];
  onChangeProfile?: (profile: SupportProfileId) => void;
  articles?: SupportArticle[];
  meta?: SupportMeta;
  onClose?: () => void;
  inPortal?: boolean;
  autoPrint?: boolean;
}

function formatDateBR(isoOrYmd?: string): string {
  if (!isoOrYmd) return '24/11/2026';
  const ymd = String(isoOrYmd).slice(0, 10);
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const SupportPrintBooklet: React.FC<SupportPrintBookletProps> = ({
  profile,
  allowedProfiles,
  onChangeProfile,
  articles: externalArticles,
  meta: externalMeta,
  onClose,
  inPortal = false,
  autoPrint = false,
}) => {
  const [includeCoverAndQr, setIncludeCoverAndQr] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    message: string;
    downloadUrl?: string;
    filename?: string;
  } | null>(null);
  const lastBlobUrlRef = useRef<string | null>(null);
  const autoPrintTriggeredRef = useRef(false);

  const safeProfile: SupportProfileId = allowedProfiles.includes(profile)
    ? profile
    : allowedProfiles[0] || 'patient';

  const meta = externalMeta || SUPPORT_META;
  const profileMeta =
    meta.profiles?.[safeProfile] || SUPPORT_META.profiles[safeProfile];

  const printableArticles = useMemo(() => {
    const source =
      externalArticles && externalArticles.length > 0 && externalArticles[0]?.profile === safeProfile
        ? externalArticles
        : getSupportArticles(safeProfile);
    return source
      .filter((a) => a.includeInPrint !== false)
      .slice()
      .sort((a, b) => a.printOrder - b.printOrder);
  }, [externalArticles, safeProfile]);

  const groupedSections = useMemo(() => {
    const map = new Map<string, SupportArticle[]>();
    for (const art of printableArticles) {
      const list = map.get(art.category) || [];
      list.push(art);
      map.set(art.category, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [printableArticles]);

  const supportPublicUrl = useMemo(() => {
    return meta.supportUrl || buildOfficialUrl(APP_ROUTES.SUPPORT);
  }, [meta.supportUrl]);

  const versionLabel = meta.version || APP_VERSION;
  const syncDateBR = formatDateBR(meta.lastSyncedAt);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(supportPublicUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [supportPublicUrl]);

  // Cleanup any generated Blob URL on unmount
  useEffect(() => {
    return () => {
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = null;
      }
    };
  }, []);

  // Reset status notice when switching profile
  useEffect(() => {
    setStatusNotice(null);
    setDownloadSuccess(false);
  }, [safeProfile]);

  const handleDownloadPdf = useCallback(
    (customMessage?: string) => {
      try {
        setIsGeneratingPdf(true);
        if (lastBlobUrlRef.current) {
          URL.revokeObjectURL(lastBlobUrlRef.current);
          lastBlobUrlRef.current = null;
        }

        const { blob, filename } = generateSupportBookletPdf({
          profile: safeProfile,
          profileMeta,
          groupedSections,
          totalArticles: printableArticles.length,
          versionLabel,
          syncDateBR,
          supportPublicUrl,
          includeCoverAndQr,
          qrDataUrl,
        });

        const url = triggerBlobDownload(blob, filename);
        lastBlobUrlRef.current = url;
        setDownloadSuccess(true);
        setStatusNotice({
          message:
            customMessage ||
            `Cartilha PDF (${filename}) gerada em formato A4. Caso o download não inicie automaticamente, use o link ao lado.`,
          downloadUrl: url,
          filename,
        });
        window.setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err) {
        console.error('[SupportPrintBooklet] Erro ao gerar PDF:', err);
        setStatusNotice({
          message:
            'Não foi possível gerar o PDF automaticamente. Tente usar o botão Imprimir (Ctrl+P / Cmd+P).',
        });
      } finally {
        setIsGeneratingPdf(false);
      }
    },
    [
      safeProfile,
      profileMeta,
      groupedSections,
      printableArticles.length,
      versionLabel,
      syncDateBR,
      supportPublicUrl,
      includeCoverAndQr,
      qrDataUrl,
    ]
  );

  const triggerPrint = useCallback(() => {
    document.body.classList.add('support-booklet-printing');
    if (inPortal) {
      document.body.classList.add('support-booklet-in-portal');
    }

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('support-booklet-printing');
      document.body.classList.remove('support-booklet-in-portal');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    const isEmbeddedFrame = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    // Invoke window.print() synchronously inside click gesture so browsers allow it
    const startedAt = performance.now();
    try {
      window.print();
    } catch {
      // Fall through to PDF fallback below
    }
    const elapsedMs = performance.now() - startedAt;

    // Sandboxed iframes (e.g. embedded preview) silently ignore window.print() in < 80ms
    if (isEmbeddedFrame && elapsedMs < 80) {
      cleanup();
      handleDownloadPdf(
        'A impressão direta é bloqueada em janelas incorporadas. Baixamos a Cartilha A4 em PDF para você abrir e imprimir.'
      );
      return;
    }

    // Safety cleanup if browser doesn't dispatch afterprint
    window.setTimeout(cleanup, 1500);
  }, [inPortal, handleDownloadPdf]);

  useEffect(() => {
    if (autoPrint && qrDataUrl && !autoPrintTriggeredRef.current) {
      autoPrintTriggeredRef.current = true;
      const timer = window.setTimeout(() => triggerPrint(), 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [autoPrint, qrDataUrl, triggerPrint]);

  return (
    <div
      className={`support-booklet-root bg-slate-100 text-slate-900 ${
        inPortal ? 'h-full overflow-y-auto' : 'min-h-screen'
      }`}
    >
      {/* Toolbar fixa (oculta na impressão A4) */}
      <div className="support-no-print sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar à Central</span>
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                Cartilha A4 · {profileMeta.label}
              </p>
              <p className="text-xs text-slate-500 tabular-nums">
                {printableArticles.length} tópicos · v{versionLabel} · Revisado em {syncDateBR}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allowedProfiles.length > 1 && onChangeProfile && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {allowedProfiles.map((profId) => {
                  const pMeta = SUPPORT_META.profiles[profId];
                  const active = profId === safeProfile;
                  return (
                    <button
                      key={profId}
                      type="button"
                      onClick={() => onChangeProfile(profId)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {pMeta?.shortLabel || profId}
                    </button>
                  );
                })}
              </div>
            )}

            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none px-1.5">
              <input
                type="checkbox"
                checked={includeCoverAndQr}
                onChange={(e) => setIncludeCoverAndQr(e.target.checked)}
                className="rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
              />
              <span>Capa e QR</span>
            </label>

            <button
              type="button"
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={() => handleDownloadPdf()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#147A80] hover:bg-[#0F5C61] disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {isGeneratingPdf
                  ? 'Gerando PDF...'
                  : downloadSuccess
                  ? 'PDF baixado'
                  : 'Baixar PDF (A4)'}
              </span>
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="border-t border-teal-100 bg-teal-50/70">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-teal-900">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
                <span className="leading-snug">{statusNotice.message}</span>
              </div>
              {statusNotice.downloadUrl && statusNotice.filename && (
                <a
                  href={statusNotice.downloadUrl}
                  download={statusNotice.filename}
                  className="inline-flex items-center gap-1 font-semibold text-[#147A80] hover:text-[#0F5C61] underline underline-offset-2 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar arquivo novamente</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Folha editorial A4 */}
      <div className="support-booklet-sheet max-w-[210mm] mx-auto my-6 bg-white border border-slate-200 shadow-sm px-8 py-10 sm:px-12 sm:py-12">
        {/* Cabeçalho / Capa Editorial */}
        {includeCoverAndQr ? (
          <header className="support-print-block pb-7 mb-8 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs font-semibold text-[#147A80] tracking-wide">
                Bertuol Odontologia Avançada · Bertuol Flow
              </p>
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight [text-wrap:balance]">
                {profileMeta.bookletTitle}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {profileMeta.bookletSubtitle}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                <span>Perfil: {profileMeta.label}</span>
                <span aria-hidden="true">·</span>
                <span>Versão v{versionLabel}</span>
                <span aria-hidden="true">·</span>
                <span>Atualizado em {syncDateBR}</span>
                <span aria-hidden="true">·</span>
                <span>{printableArticles.length} guias</span>
              </div>
            </div>

            {qrDataUrl && (
              <div className="shrink-0 flex flex-col items-center p-3 border border-slate-200 rounded-xl bg-white">
                <img
                  src={qrDataUrl}
                  alt="QR Code para acessar a Central de Suporte Online"
                  className="w-24 h-24 object-contain"
                />
                <span className="mt-1.5 text-[10px] font-semibold text-slate-700 text-center">
                  Versão Online & Chat IA
                </span>
                <span className="text-[9px] text-slate-500 text-center font-mono">
                  /suporte
                </span>
              </div>
            )}
          </header>
        ) : (
          <header className="support-print-block pb-4 mb-6 border-b border-slate-200 flex items-baseline justify-between gap-4">
            <h1 className="text-xl font-bold text-slate-900">{profileMeta.bookletTitle}</h1>
            <span className="text-xs text-slate-500 tabular-nums shrink-0">
              v{versionLabel} · {syncDateBR}
            </span>
          </header>
        )}

        {/* Sumário compacto */}
        <section className="support-print-block mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h2 className="text-xs font-bold text-slate-700 mb-2.5">
            Sumário desta Cartilha ({groupedSections.length} seções)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-700">
            {groupedSections.map((section, idx) => (
              <div key={section.category} className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800 truncate">
                  {String(idx + 1).padStart(2, '0')}. {section.category}
                </span>
                <span className="text-slate-500 tabular-nums shrink-0">
                  {section.items.length} {section.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Seções de Perguntas e Passo a Passo */}
        <div className="space-y-8">
          {groupedSections.map((section, sectionIdx) => (
            <section key={section.category} className="space-y-4">
              <div className="pb-2 border-b border-slate-200 flex items-baseline justify-between gap-4">
                <h2 className="text-base font-bold text-slate-900">
                  {String(sectionIdx + 1).padStart(2, '0')}. {section.category}
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {section.items.length}{' '}
                  {section.items.length === 1 ? 'orientação' : 'orientações'}
                </span>
              </div>

              <div className="space-y-5">
                {section.items.map((article) => (
                  <article
                    key={article.id}
                    className="support-print-block pb-5 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {article.summary}
                    </p>

                    <ol className="mt-3 space-y-1.5 text-xs text-slate-800 leading-relaxed">
                      {article.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5">
                          <span className="font-mono tabular-nums font-semibold text-[#147A80] shrink-0 mt-0.5">
                            {sIdx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>

                    {article.tip && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <span className="font-semibold text-slate-900">Importante: </span>
                        {article.tip}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Rodapé Editorial */}
        <footer className="support-print-block mt-10 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">
              Bertuol Odontologia Avançada · Central de Suporte Bertuol Flow
            </p>
            <p>
              Unidades Palmas - TO e Paraíso do Tocantins - TO · Dúvidas adicionais? Acesse{' '}
              <span className="font-mono text-slate-700">{supportPublicUrl}</span>
            </p>
          </div>
          <div className="tabular-nums text-left sm:text-right shrink-0">
            <p>Versão v{versionLabel}</p>
            <p>Base sincronizada em {syncDateBR}</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
