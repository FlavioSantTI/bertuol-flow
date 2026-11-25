import { jsPDF } from 'jspdf';
import type {
  SupportArticle,
  SupportProfileId,
  SupportProfileMeta,
} from '../types/support';

export interface SupportBookletPdfInput {
  profile: SupportProfileId;
  profileMeta: SupportProfileMeta;
  groupedSections: Array<{
    category: string;
    items: SupportArticle[];
  }>;
  totalArticles: number;
  versionLabel: string;
  syncDateBR: string;
  supportPublicUrl: string;
  includeCoverAndQr: boolean;
  qrDataUrl?: string;
}

export interface SupportBookletPdfResult {
  blob: Blob;
  filename: string;
}

const PROFILE_FILE_SLUG: Record<SupportProfileId, string> = {
  patient: 'paciente',
  dentist: 'dentista',
  receptionist: 'recepcao-crm',
};

/**
 * Normalizes Unicode characters unsupported by jsPDF's built-in Helvetica WinAnsi
 * encoding while preserving all Portuguese accents (á, é, í, ó, ú, ã, õ, ç, â, ê, ô, à).
 */
function sanitizePdfText(raw: string): string {
  return String(raw || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '->')
    .replace(/\u2022/g, '-')
    .replace(/\u00B7/g, ' | ')
    .replace(/\u00A0/g, ' ')
    // Strip supplementary-plane emojis/symbols that WinAnsi cannot encode
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateSupportBookletPdf(
  input: SupportBookletPdfInput
): SupportBookletPdfResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const marginTop = 18;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginX * 2;
  const maxY = pageHeight - marginBottom;

  const TEAL: [number, number, number] = [20, 122, 128]; // #147A80
  const SLATE_900: [number, number, number] = [15, 23, 42];
  const SLATE_700: [number, number, number] = [51, 65, 85];
  const SLATE_500: [number, number, number] = [100, 116, 139];
  const BORDER_LIGHT: [number, number, number] = [226, 232, 240];
  const BG_SOFT: [number, number, number] = [248, 250, 252];

  let y = marginTop;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > maxY) {
      doc.addPage();
      // Subtle top accent bar on continuation pages
      doc.setFillColor(...TEAL);
      doc.rect(0, 0, pageWidth, 2.2, 'F');
      y = marginTop;
    }
  };

  // Top brand strip on page 1
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageWidth, 3.5, 'F');

  // --- Editorial Cover / Header ---
  if (input.includeCoverAndQr) {
    const hasQr = Boolean(input.qrDataUrl && input.qrDataUrl.startsWith('data:image/'));
    const headerTextWidth = hasQr ? contentWidth - 38 : contentWidth;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL);
    doc.text(
      sanitizePdfText('BERTUOL ODONTOLOGIA AVANÇADA  |  BERTUOL FLOW'),
      marginX,
      y
    );

    const titleLines = doc.splitTextToSize(
      sanitizePdfText(input.profileMeta.bookletTitle),
      headerTextWidth
    );
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...SLATE_900);
    doc.text(titleLines, marginX, y + 7);
    const afterTitleY = y + 7 + (titleLines.length - 1) * 7.2 + 4.5;

    const subtitleLines = doc.splitTextToSize(
      sanitizePdfText(input.profileMeta.bookletSubtitle),
      headerTextWidth
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...SLATE_700);
    doc.text(subtitleLines, marginX, afterTitleY);
    const afterSubtitleY = afterTitleY + subtitleLines.length * 4.6 + 2.5;

    const metaLine = sanitizePdfText(
      `Perfil: ${input.profileMeta.label}  |  Versão v${input.versionLabel}  |  Atualizado em ${input.syncDateBR}  |  ${input.totalArticles} guias`
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_500);
    doc.text(metaLine, marginX, afterSubtitleY);

    let headerBottom = afterSubtitleY + 4;

    if (hasQr && input.qrDataUrl) {
      const qrBoxSize = 31;
      const qrBoxX = pageWidth - marginX - qrBoxSize;
      const qrBoxY = y - 3;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...BORDER_LIGHT);
      doc.setLineWidth(0.35);
      doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 8, 2.5, 2.5, 'FD');
      doc.addImage(input.qrDataUrl, 'PNG', qrBoxX + 3, qrBoxY + 2.5, 25, 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...SLATE_700);
      doc.text('Versão Online & IA', qrBoxX + qrBoxSize / 2, qrBoxY + 30.8, {
        align: 'center',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...SLATE_500);
      doc.text('/suporte', qrBoxX + qrBoxSize / 2, qrBoxY + 34.2, {
        align: 'center',
      });

      headerBottom = Math.max(headerBottom, qrBoxY + qrBoxSize + 10);
    }

    y = headerBottom + 2;
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setLineWidth(0.4);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 7;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...SLATE_900);
    doc.text(sanitizePdfText(input.profileMeta.bookletTitle), marginX, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE_500);
    doc.text(
      sanitizePdfText(`v${input.versionLabel}  |  ${input.syncDateBR}`),
      pageWidth - marginX,
      y,
      { align: 'right' }
    );

    y += 4;
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setLineWidth(0.4);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6.5;
  }

  // --- Compact Table of Contents ---
  const tocCols = 2;
  const tocRows = Math.ceil(input.groupedSections.length / tocCols);
  const tocHeight = 11 + tocRows * 5.2 + 3;
  ensureSpace(tocHeight + 4);

  doc.setFillColor(...BG_SOFT);
  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, contentWidth, tocHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_700);
  doc.text(
    sanitizePdfText(
      `Sumário desta Cartilha (${input.groupedSections.length} seções)`
    ),
    marginX + 4,
    y + 6.5
  );

  const colWidth = (contentWidth - 12) / 2;
  input.groupedSections.forEach((sec, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cellX = marginX + 4 + col * (colWidth + 4);
    const cellY = y + 12.2 + row * 5.2;

    const label = sanitizePdfText(
      `${String(idx + 1).padStart(2, '0')}. ${sec.category}`
    );
    const countLabel = `${sec.items.length} ${
      sec.items.length === 1 ? 'item' : 'itens'
    }`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_900);
    const clippedLabel =
      label.length > 36 ? `${label.slice(0, 35).trim()}...` : label;
    doc.text(clippedLabel, cellX, cellY);

    doc.setTextColor(...SLATE_500);
    doc.text(countLabel, cellX + colWidth, cellY, { align: 'right' });
  });

  y += tocHeight + 8;

  // --- Sections & Articles ---
  input.groupedSections.forEach((section, sectionIdx) => {
    // Ensure section heading + at least first article title stay together
    ensureSpace(28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...TEAL);
    doc.text(
      sanitizePdfText(
        `${String(sectionIdx + 1).padStart(2, '0')}. ${section.category}`
      ),
      marginX,
      y
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_500);
    doc.text(
      `${section.items.length} ${
        section.items.length === 1 ? 'orientação' : 'orientações'
      }`,
      pageWidth - marginX,
      y,
      { align: 'right' }
    );

    y += 2.5;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.35);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;

    section.items.forEach((article, artIdx) => {
      // Pre-calculate article height for clean page breaks
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const titleLines = doc.splitTextToSize(
        sanitizePdfText(article.title),
        contentWidth
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const summaryLines = doc.splitTextToSize(
        sanitizePdfText(article.summary),
        contentWidth
      );

      const stepBlocks = article.steps.map((step, sIdx) => ({
        num: `${sIdx + 1}.`,
        lines: doc.splitTextToSize(sanitizePdfText(step), contentWidth - 7),
      }));

      const tipLines = article.tip
        ? doc.splitTextToSize(
            sanitizePdfText(`Importante: ${article.tip}`),
            contentWidth - 8
          )
        : [];

      const estHeight =
        titleLines.length * 4.8 +
        summaryLines.length * 4.1 +
        3 +
        stepBlocks.reduce((acc, b) => acc + b.lines.length * 4.1 + 1.4, 0) +
        (tipLines.length > 0 ? tipLines.length * 4.0 + 7 : 0) +
        6;

      // If whole article fits on a fresh page, avoid splitting it mid-article
      if (estHeight < maxY - marginTop - 10) {
        ensureSpace(estHeight);
      } else {
        ensureSpace(22);
      }

      // Article Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...SLATE_900);
      doc.text(titleLines, marginX, y);
      y += titleLines.length * 4.8 + 1;

      // Summary
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...SLATE_700);
      doc.text(summaryLines, marginX, y);
      y += summaryLines.length * 4.1 + 2.5;

      // Numbered Steps
      stepBlocks.forEach((block) => {
        ensureSpace(block.lines.length * 4.1 + 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...TEAL);
        doc.text(block.num, marginX + 1, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...SLATE_900);
        doc.text(block.lines, marginX + 7, y);
        y += block.lines.length * 4.1 + 1.4;
      });

      // Optional Tip Box
      if (tipLines.length > 0) {
        const tipBoxHeight = tipLines.length * 4.0 + 5.2;
        ensureSpace(tipBoxHeight + 3);
        y += 1.2;

        doc.setFillColor(...BG_SOFT);
        doc.setDrawColor(...BORDER_LIGHT);
        doc.setLineWidth(0.28);
        doc.roundedRect(marginX, y, contentWidth, tipBoxHeight, 1.8, 1.8, 'FD');

        // Left teal accent bar inside tip box
        doc.setFillColor(...TEAL);
        doc.rect(marginX, y, 1.2, tipBoxHeight, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.setTextColor(...SLATE_700);
        doc.text(tipLines, marginX + 4.5, y + 4.5);
        y += tipBoxHeight + 2.5;
      }

      // Subtle divider between articles in the same section
      if (artIdx < section.items.length - 1) {
        y += 2;
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.25);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 4.5;
      } else {
        y += 6;
      }
    });
  });

  // --- Running Footer & Page Numbers on all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 11;
    doc.setDrawColor(...BORDER_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_500);
    doc.text(
      sanitizePdfText(
        `Bertuol Odontologia Avançada  |  Central de Suporte v${input.versionLabel}  |  ${input.supportPublicUrl}`
      ),
      marginX,
      footerY
    );
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginX, footerY, {
      align: 'right',
    });
  }

  const slug = PROFILE_FILE_SLUG[input.profile] || input.profile;
  const safeVer = String(input.versionLabel || '1.7.0').replace(/[^0-9A-Za-z._-]/g, '');
  const filename = `cartilha-${slug}-bertuol-flow-v${safeVer}.pdf`;
  const blob = doc.output('blob');

  return { blob, filename };
}

export function triggerBlobDownload(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return url;
}
