export type SupportProfileId = 'patient' | 'dentist' | 'receptionist';

export interface SupportProfileMeta {
  id: SupportProfileId;
  label: string;
  shortLabel: string;
  audience: string;
  bookletTitle: string;
  bookletSubtitle: string;
  suggestedQuestions: string[];
}

export interface SupportImpactRule {
  pattern: string;
  profiles: SupportProfileId[];
  area: string;
}

export interface SupportMeta {
  version: string;
  lastSyncedAt: string;
  repository: string;
  branch: string;
  supportUrl: string;
  lastCommitSha?: string;
  lastImpactSummary?: string;
  profiles: Record<SupportProfileId, SupportProfileMeta>;
  impactMap: SupportImpactRule[];
}

export interface SupportArticle {
  id: string;
  profile: SupportProfileId;
  category: string;
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
  keywords: string[];
  includeInPrint: boolean;
  printOrder: number;
  updatedInVersion: string;
  lastReviewedAt: string;
}

export interface SupportChatCitation {
  id: string;
  title: string;
  category: string;
  profile: SupportProfileId;
}

export interface SupportChatTurn {
  role: 'user' | 'assistant';
  text: string;
  citations?: SupportChatCitation[];
  escalateToHuman?: boolean;
  followUpSuggestions?: string[];
  createdAt?: string;
}

export interface SupportChatResponse {
  success: boolean;
  resolvedProfile: SupportProfileId;
  allowedProfiles: SupportProfileId[];
  answer?: string;
  citations?: SupportChatCitation[];
  escalateToHuman?: boolean;
  followUpSuggestions?: string[];
  model?: string;
  error?: string;
}

export interface SupportKBResponse {
  success: boolean;
  meta: SupportMeta;
  resolvedProfile: SupportProfileId;
  allowedProfiles: SupportProfileId[];
  articles: SupportArticle[];
  countsByProfile: Partial<Record<SupportProfileId, number>>;
  error?: string;
}
