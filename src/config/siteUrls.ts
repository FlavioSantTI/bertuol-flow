// Central official production domain and canonical routes for Bertuol Flow.
// Shared links (patient invites, QR codes, webhooks, booklets, WhatsApp/SMS)
// always point here so preview/staging origins never leak to patients or staff.

const RAW_OFFICIAL_ENV =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_OFFICIAL_APP_URL) ||
  '';

const DEFAULT_OFFICIAL_SITE_URL = 'https://bertuolflow.app-bertuol.tech';

function normalizeBaseUrl(raw?: string | null): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === 'MY_APP_URL') {
    return DEFAULT_OFFICIAL_SITE_URL;
  }
  return trimmed;
}

export const OFFICIAL_SITE_URL = normalizeBaseUrl(RAW_OFFICIAL_ENV);

export const APP_ROUTES = {
  HOME: '/',
  PROFESSIONAL: '/',
  PATIENT: '/paciente',
  SUPPORT: '/suporte',
  SUPPORT_PRINT: '/suporte/imprimir',
  TOTEM_PRINT: '/totem-imprimir',
  ROOT: '/root',
  MANUAL_INSTALL: '/manual-instalacao.html',
  TUTORIAL_PATIENT: '/tutorial-paciente.html',
  SLIDESHOW: '/slideshow-hyperframes.html',
  HEYGEN_SCRIPTS: '/roteiros-heygen.html',
  CLINICORP_WEBHOOK_PREFIX: '/api/webhooks/clinicorp',
  BIRTHDAY_WEBHOOK: '/api/crm/birthdays/run-daily',
  SORRISO_CAMPAIGN_WEBHOOK: '/api/crm/campaigns/sorriso/process-batch',
} as const;

export function getOfficialBaseUrl(customBaseUrl?: string): string {
  if (customBaseUrl && customBaseUrl.trim()) {
    return normalizeBaseUrl(customBaseUrl);
  }
  return OFFICIAL_SITE_URL;
}

export function buildOfficialUrl(
  routePath: string,
  params?: URLSearchParams | Record<string, string | number | boolean | null | undefined>,
  customBaseUrl?: string
): string {
  const baseUrl = getOfficialBaseUrl(customBaseUrl);
  const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  let queryString = '';

  if (params instanceof URLSearchParams) {
    queryString = params.toString();
  } else if (params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && String(value).length > 0) {
        search.set(key, String(value));
      }
    }
    queryString = search.toString();
  }

  return `${baseUrl}${normalizedPath}${queryString ? `?${queryString}` : ''}`;
}
