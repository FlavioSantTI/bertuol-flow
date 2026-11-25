import metaJson from '../../docs/support-kb/meta.json';
import patientJson from '../../docs/support-kb/patient.json';
import dentistJson from '../../docs/support-kb/dentist.json';
import receptionistJson from '../../docs/support-kb/receptionist.json';
import type {
  SupportArticle,
  SupportMeta,
  SupportProfileId,
} from '../types/support';

export const SUPPORT_META: SupportMeta = metaJson as SupportMeta;

export const SUPPORT_ARTICLES_BY_PROFILE: Record<SupportProfileId, SupportArticle[]> = {
  patient: (patientJson as SupportArticle[]).slice().sort((a, b) => a.printOrder - b.printOrder),
  dentist: (dentistJson as SupportArticle[]).slice().sort((a, b) => a.printOrder - b.printOrder),
  receptionist: (receptionistJson as SupportArticle[])
    .slice()
    .sort((a, b) => a.printOrder - b.printOrder),
};

export function normalizeSearchText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getSupportArticles(profile: SupportProfileId): SupportArticle[] {
  return SUPPORT_ARTICLES_BY_PROFILE[profile] || [];
}

export function getSupportCategories(profile: SupportProfileId): { name: string; count: number }[] {
  const articles = getSupportArticles(profile);
  const map = new Map<string, number>();
  for (const art of articles) {
    map.set(art.category, (map.get(art.category) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

export function searchSupportArticles(
  profile: SupportProfileId,
  query: string,
  category?: string
): SupportArticle[] {
  const base = getSupportArticles(profile);
  const byCategory =
    category && category !== 'all' ? base.filter((a) => a.category === category) : base;

  const q = normalizeSearchText(query);
  if (!q) return byCategory;

  const tokens = q.split(/\s+/).filter(Boolean);
  return byCategory.filter((article) => {
    const haystack = normalizeSearchText(
      [
        article.title,
        article.summary,
        article.category,
        article.tip || '',
        ...article.steps,
        ...article.keywords,
      ].join(' ')
    );
    return tokens.every((tok) => haystack.includes(tok));
  });
}

export function resolveSupportAccessForRole(rawRole?: string | null): {
  defaultProfile: SupportProfileId;
  allowedProfiles: SupportProfileId[];
  canViewGitHubStatus: boolean;
} {
  const role = String(rawRole || '').trim().toLowerCase();

  if (
    role === 'admin_root' ||
    role === 'admin' ||
    role === 'admin_clinica' ||
    role === 'admin_tecnico' ||
    role === 'gerente_atendimento' ||
    role === 'gerente'
  ) {
    return {
      defaultProfile: 'receptionist',
      allowedProfiles: ['receptionist', 'dentist', 'patient'],
      canViewGitHubStatus: true,
    };
  }

  if (role === 'receptionist' || role === 'recepcionista' || role === 'atendente') {
    return {
      defaultProfile: 'receptionist',
      allowedProfiles: ['receptionist', 'patient'],
      canViewGitHubStatus: false,
    };
  }

  if (role === 'dentist' || role === 'dentista') {
    return {
      defaultProfile: 'dentist',
      allowedProfiles: ['dentist'],
      canViewGitHubStatus: false,
    };
  }

  // Public visitors (/suporte) and authenticated patients ONLY ever receive patient content
  return {
    defaultProfile: 'patient',
    allowedProfiles: ['patient'],
    canViewGitHubStatus: false,
  };
}
