import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  MessageSquare,
  BookOpen,
  Printer,
  ChevronDown,
  Send,
  Copy,
  Check,
  RefreshCw,
  GitBranch,
  ArrowRight,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  SUPPORT_META,
  getSupportArticles,
  getSupportCategories,
  resolveSupportAccessForRole,
  searchSupportArticles,
} from '../../data/supportKnowledgeBase';
import type {
  SupportArticle,
  SupportChatResponse,
  SupportChatTurn,
  SupportKBResponse,
  SupportMeta,
  SupportProfileId,
} from '../../types/support';
import { SupportPrintBooklet } from './SupportPrintBooklet';
import { APP_VERSION } from '../../config/version';

export interface SupportCenterViewProps {
  /** 'public' for /suporte, 'patient' for Patient Portal, 'app' for logged-in clinic staff */
  contextMode?: 'public' | 'patient' | 'app';
  mode?: 'standalone' | 'modal';
  userRole?: string | null;
  userName?: string | null;
  initialProfile?: SupportProfileId;
  initialView?: 'faq' | 'chat' | 'print';
  initialPrintMode?: boolean;
  autoPrint?: boolean;
  onClose?: () => void;
  onBackToApp?: () => void;
}

type SupportTab = 'faq' | 'chat' | 'github';

function formatShortDateBR(isoOrYmd?: string): string {
  if (!isoOrYmd) return '24/11/2026';
  const ymd = String(isoOrYmd).slice(0, 10);
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const SupportCenterView: React.FC<SupportCenterViewProps> = ({
  contextMode: explicitContextMode,
  mode = 'standalone',
  userRole,
  userName,
  initialProfile,
  initialView = 'faq',
  initialPrintMode = false,
  autoPrint = false,
  onClose,
  onBackToApp,
}) => {
  const contextMode: 'public' | 'patient' | 'app' = explicitContextMode
    ? explicitContextMode
    : !userRole
    ? 'public'
    : String(userRole).toLowerCase() === 'patient'
    ? 'patient'
    : 'app';

  const effectiveRole = contextMode === 'app' ? userRole : null;
  const initialAccess = useMemo(
    () => resolveSupportAccessForRole(effectiveRole),
    [effectiveRole]
  );

  const [allowedProfiles, setAllowedProfiles] = useState<SupportProfileId[]>(
    initialAccess.allowedProfiles
  );
  const [activeProfile, setActiveProfile] = useState<SupportProfileId>(() => {
    if (initialProfile && initialAccess.allowedProfiles.includes(initialProfile)) {
      return initialProfile;
    }
    return initialAccess.defaultProfile;
  });

  const [kbMeta, setKbMeta] = useState<SupportMeta>(SUPPORT_META);
  const [serverArticles, setServerArticles] = useState<SupportArticle[]>(() =>
    getSupportArticles(
      initialProfile && initialAccess.allowedProfiles.includes(initialProfile)
        ? initialProfile
        : initialAccess.defaultProfile
    )
  );
  const [countsByProfile, setCountsByProfile] = useState<Partial<Record<SupportProfileId, number>>>(
    () => {
      const counts: Partial<Record<SupportProfileId, number>> = {};
      for (const p of initialAccess.allowedProfiles) {
        counts[p] = getSupportArticles(p).length;
      }
      return counts;
    }
  );

  const [activeTab, setActiveTab] = useState<SupportTab>(initialView === 'chat' ? 'chat' : 'faq');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(
    Boolean(initialPrintMode || initialView === 'print')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [highlightedArticleId, setHighlightedArticleId] = useState<string | null>(null);

  // AI Chat state (scoped per profile)
  const [chatByProfile, setChatByProfile] = useState<Record<SupportProfileId, SupportChatTurn[]>>({
    patient: [],
    dentist: [],
    receptionist: [],
  });
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedTurnIdx, setCopiedTurnIdx] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const articleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sync KB from server (ensures GitHub-updated docs on disk are always fresh and role-enforced)
  useEffect(() => {
    let cancelled = false;
    const headers: Record<string, string> = {
      'x-support-context': contextMode,
    };
    if (contextMode === 'app' && userRole) {
      headers['x-user-role'] = userRole;
    }

    fetch(`/api/support/kb?profile=${encodeURIComponent(activeProfile)}`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SupportKBResponse | null) => {
        if (cancelled || !data || !data.success) return;
        if (Array.isArray(data.allowedProfiles) && data.allowedProfiles.length > 0) {
          setAllowedProfiles(data.allowedProfiles);
        }
        if (data.resolvedProfile && data.resolvedProfile !== activeProfile) {
          setActiveProfile(data.resolvedProfile);
        }
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setServerArticles(data.articles);
          setExpandedArticleId((prev) =>
            prev && data.articles.some((a) => a.id === prev) ? prev : data.articles[0].id
          );
        }
        if (data.meta) {
          setKbMeta((prev) => ({
            ...prev,
            ...data.meta,
            profiles: {
              ...SUPPORT_META.profiles,
              ...(data.meta.profiles || {}),
            },
          }));
        }
        if (data.countsByProfile) {
          setCountsByProfile(data.countsByProfile);
        }
      })
      .catch(() => {
        // Fallback smoothly to bundled GitHub KB
        const local = getSupportArticles(activeProfile);
        if (!cancelled) {
          setServerArticles(local);
          if (local[0]) setExpandedArticleId(local[0].id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeProfile, contextMode, userRole]);

  // Reset category filter when switching profile
  useEffect(() => {
    setSelectedCategory('all');
    setSearchQuery('');
    setChatError(null);
  }, [activeProfile]);

  const activeArticles = useMemo(() => {
    if (serverArticles.length > 0 && serverArticles[0]?.profile === activeProfile) {
      return serverArticles;
    }
    return getSupportArticles(activeProfile);
  }, [serverArticles, activeProfile]);

  const categories = useMemo(() => {
    if (activeArticles.length > 0) {
      const map = new Map<string, number>();
      for (const art of activeArticles) {
        map.set(art.category, (map.get(art.category) || 0) + 1);
      }
      return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    }
    return getSupportCategories(activeProfile);
  }, [activeArticles, activeProfile]);

  const filteredArticles = useMemo(() => {
    const base =
      selectedCategory === 'all'
        ? activeArticles
        : activeArticles.filter((a) => a.category === selectedCategory);
    const trimmed = searchQuery.trim();
    if (!trimmed) return base;

    const matchedIds = new Set(
      searchSupportArticles(activeProfile, trimmed, selectedCategory).map((a) => a.id)
    );
    const normalizedQ = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return base.filter((a) => {
      if (matchedIds.has(a.id)) return true;
      const hay = [a.title, a.summary, a.category, a.tip || '', ...a.steps, ...a.keywords]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return hay.includes(normalizedQ);
    });
  }, [activeArticles, activeProfile, searchQuery, selectedCategory]);

  const activeProfileMeta =
    kbMeta.profiles?.[activeProfile] || SUPPORT_META.profiles[activeProfile];
  const currentMessages = chatByProfile[activeProfile] || [];

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [currentMessages.length, isSendingChat, activeTab]);

  const handleSendChat = async (overrideMessage?: string) => {
    const promptText = (overrideMessage ?? chatInput).trim();
    if (!promptText || isSendingChat) return;

    setActiveTab('chat');
    setChatError(null);
    setLastFailedPrompt(null);
    if (!overrideMessage) setChatInput('');

    const userTurn: SupportChatTurn = {
      role: 'user',
      text: promptText,
      createdAt: new Date().toISOString(),
    };

    const priorTurns = currentMessages.slice(-6);
    setChatByProfile((prev) => ({
      ...prev,
      [activeProfile]: [...(prev[activeProfile] || []), userTurn],
    }));

    setIsSendingChat(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-support-context': contextMode,
      };
      if (contextMode === 'app' && userRole) {
        headers['x-user-role'] = userRole;
      }

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          profile: activeProfile,
          message: promptText,
          history: priorTurns.map((t) => ({ role: t.role, text: t.text })),
        }),
      });

      const data: SupportChatResponse = await res.json();
      if (!res.ok || !data.success || !data.answer) {
        throw new Error(
          data.error || 'Não foi possível consultar o assistente de IA no momento.'
        );
      }

      const assistantTurn: SupportChatTurn = {
        role: 'assistant',
        text: data.answer,
        citations: data.citations || [],
        escalateToHuman: Boolean(data.escalateToHuman),
        followUpSuggestions: data.followUpSuggestions || [],
        createdAt: new Date().toISOString(),
      };

      setChatByProfile((prev) => ({
        ...prev,
        [activeProfile]: [...(prev[activeProfile] || []), assistantTurn],
      }));
    } catch (err: any) {
      setChatError(err?.message || 'Erro de comunicação com o assistente de IA.');
      setLastFailedPrompt(promptText);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleJumpToCitation = (articleId: string) => {
    setActiveTab('faq');
    setSelectedCategory('all');
    setSearchQuery('');
    setExpandedArticleId(articleId);
    setHighlightedArticleId(articleId);
    window.setTimeout(() => {
      const el = articleRefs.current[articleId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
    window.setTimeout(() => {
      setHighlightedArticleId((curr) => (curr === articleId ? null : curr));
    }, 2800);
  };

  const handleCopyText = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTurnIdx(idx);
      window.setTimeout(() => setCopiedTurnIdx(null), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  if (isPrintMode) {
    return (
      <SupportPrintBooklet
        profile={activeProfile}
        allowedProfiles={allowedProfiles}
        onChangeProfile={(p) => setActiveProfile(p)}
        articles={activeArticles}
        meta={kbMeta}
        inPortal={mode === 'modal'}
        autoPrint={autoPrint}
        onClose={() => {
          if ((initialPrintMode || initialView === 'print') && typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/suporte');
          }
          setIsPrintMode(false);
        }}
      />
    );
  }

  const versionLabel = kbMeta.version || APP_VERSION;
  const syncDateLabel = formatShortDateBR(kbMeta.lastSyncedAt);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Top Bar (3-zone clean header) */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#147A80] text-white flex items-center justify-center font-bold text-sm shrink-0">
              B
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Central de Suporte
                </h1>
                <span className="text-xs text-slate-400 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-medium text-slate-500 hidden sm:inline truncate">
                  Perfil {activeProfileMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 tabular-nums truncate">
                Bertuol Flow v{versionLabel} · Atualizado em {syncDateLabel}
                {userName ? ` · ${userName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {allowedProfiles.length > 1 && (
              <div
                className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                role="tablist"
                aria-label="Selecionar perfil da documentação"
              >
                {allowedProfiles.map((profId) => {
                  const metaProf = SUPPORT_META.profiles[profId];
                  const isActive = profId === activeProfile;
                  return (
                    <button
                      key={profId}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveProfile(profId)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {metaProf?.shortLabel || profId}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsPrintMode(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#147A80] hover:bg-[#0F5C61] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cartilha A4 (PDF)</span>
              <span className="sm:hidden">PDF A4</span>
            </button>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Ir para o App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar Central de Suporte"
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Left Sidebar: Navigation + Categories + Print Card */}
          <aside className="space-y-5 lg:sticky lg:top-6">
            {/* Mode Switcher */}
            <div className="bg-white border border-slate-200 rounded-xl p-1.5 space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'faq'
                    ? 'bg-[#EBF8F8] text-[#147A80]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Perguntas Frequentes</span>
                </span>
                <span className="tabular-nums text-[11px] opacity-80">
                  {activeArticles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#EBF8F8] text-[#147A80]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Assistente IA (Chat)</span>
                </span>
                {currentMessages.length > 0 && (
                  <span className="tabular-nums text-[11px] opacity-80">
                    {Math.ceil(currentMessages.length / 2)}
                  </span>
                )}
              </button>

              {initialAccess.canViewGitHubStatus && contextMode === 'app' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('github')}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'github'
                      ? 'bg-[#EBF8F8] text-[#147A80]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 shrink-0" />
                    <span>Sincronização GitHub</span>
                  </span>
                </button>
              )}
            </div>

            {/* Categories Filter (when in FAQ tab) */}
            {activeTab === 'faq' && (
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="px-2 pb-2 text-xs font-semibold text-slate-500">
                  Categorias · {activeProfileMeta.shortLabel}
                </p>
                <nav className="space-y-0.5" aria-label="Categorias do FAQ">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span className="truncate">Todos os tópicos</span>
                    <span className="tabular-nums text-[11px] text-slate-500">
                      {activeArticles.length}
                    </span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                        selectedCategory === cat.name
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="tabular-nums text-[11px] text-slate-500">{cat.count}</span>
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Quick Print Booklet Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-900">
                Cartilha Impressa ({activeProfileMeta.label})
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gere o guia completo em folha A4 pronto para imprimir ou enviar em PDF, sempre sincronizado com a versão atual.
              </p>
              <button
                type="button"
                onClick={() => setIsPrintMode(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#147A80]" />
                <span>Visualizar Cartilha A4</span>
              </button>
            </div>
          </aside>

          {/* Main Right Viewport */}
          <main className="min-w-0 space-y-5">
            {/* TAB 1: FAQ INTERATIVO */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                {/* Search Header */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 [text-wrap:balance]">
                      {activeProfileMeta.bookletTitle}
                    </h2>
                    <p className="text-sm text-slate-600 max-w-2xl">
                      {activeProfileMeta.bookletSubtitle}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Buscar dúvidas de ${activeProfileMeta.shortLabel.toLowerCase()} (ex.: voucher, senha, check-in, agenda)...`}
                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#147A80] focus:outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (searchQuery.trim()) {
                          handleSendChat(searchQuery.trim());
                        } else {
                          setActiveTab('chat');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-[#147A80] hover:bg-[#0F5C61] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Perguntar à IA</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="tabular-nums">
                      Exibindo {filteredArticles.length} de {activeArticles.length}{' '}
                      {activeArticles.length === 1 ? 'orientação' : 'orientações'}
                      {selectedCategory !== 'all' ? ` · ${selectedCategory}` : ''}
                    </span>
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-[#147A80] hover:underline font-medium cursor-pointer"
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                </div>

                {/* FAQ List or Empty State */}
                {filteredArticles.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Nenhuma pergunta encontrada para &ldquo;{searchQuery}&rdquo;
                    </p>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Você pode perguntar diretamente ao Assistente de IA da Central de Suporte ou limpar o filtro para ver todos os guias.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSendChat(searchQuery.trim())}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#147A80] hover:bg-[#0F5C61] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Perguntar isso para a IA</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ver todas as perguntas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
                    {filteredArticles.map((article) => {
                      const isExpanded = expandedArticleId === article.id;
                      const isHighlighted = highlightedArticleId === article.id;

                      return (
                        <div
                          key={article.id}
                          ref={(el) => {
                            articleRefs.current[article.id] = el;
                          }}
                          className={`transition-colors ${
                            isHighlighted ? 'bg-[#EBF8F8]/70' : 'bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedArticleId(isExpanded ? null : article.id)
                            }
                            aria-expanded={isExpanded}
                            className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                                <span>{article.category}</span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">v{article.updatedInVersion}</span>
                              </div>
                              <h3 className="text-[15px] font-semibold text-slate-900 leading-snug">
                                {article.title}
                              </h3>
                              {!isExpanded && (
                                <p className="text-xs text-slate-600 line-clamp-1">
                                  {article.summary}
                                </p>
                              )}
                            </div>

                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-150 ${
                                isExpanded ? 'rotate-180 text-[#147A80]' : ''
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-5 pt-1 space-y-3.5 max-w-3xl">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {article.summary}
                              </p>

                              <ol className="space-y-2 text-sm text-slate-800 leading-relaxed">
                                {article.steps.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-2.5">
                                    <span className="font-mono tabular-nums text-xs font-bold text-[#147A80] mt-1 shrink-0">
                                      {idx + 1}.
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>

                              {article.tip && (
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                                  <span className="font-semibold text-slate-900">Dica: </span>
                                  {article.tip}
                                </div>
                              )}

                              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                <span className="tabular-nums">
                                  Revisado em {formatShortDateBR(article.lastReviewedAt)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSendChat(`Pode detalhar melhor: ${article.title}`)
                                  }
                                  className="inline-flex items-center gap-1 text-[#147A80] hover:underline font-semibold cursor-pointer"
                                >
                                  <span>Tirar dúvida sobre este tópico com a IA</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHAT DE SUPORTE COM IA */}
            {activeTab === 'chat' && (
              <div className="bg-white border border-slate-200 rounded-xl flex flex-col min-h-[520px] max-h-[72vh]">
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Assistente de Suporte · {activeProfileMeta.label}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Respostas fundamentadas exclusivamente na documentação oficial do perfil{' '}
                      {activeProfileMeta.label} (v{versionLabel}).
                    </p>
                  </div>
                  {currentMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setChatByProfile((prev) => ({ ...prev, [activeProfile]: [] }));
                        setChatError(null);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Limpar conversa
                    </button>
                  )}
                </div>

                {/* Chat Thread */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                  {currentMessages.length === 0 ? (
                    <div className="space-y-4 py-4">
                      <div className="space-y-1 max-w-xl">
                        <p className="text-sm font-semibold text-slate-900">
                          Como posso ajudar hoje?
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Faça uma pergunta livre abaixo ou escolha um dos atalhos frequentes para{' '}
                          {activeProfileMeta.shortLabel.toLowerCase()}. Cada resposta cita os guias oficiais consultados.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(activeProfileMeta.suggestedQuestions || []).map((question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => handleSendChat(question)}
                            className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-[#EBF8F8]/60 hover:border-[#147A80]/40 text-left text-xs font-medium text-slate-800 transition-colors flex items-start justify-between gap-2 cursor-pointer"
                          >
                            <span>{question}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#147A80] shrink-0 mt-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    currentMessages.map((turn, idx) => (
                      <div
                        key={idx}
                        className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed space-y-3 ${
                            turn.role === 'user'
                              ? 'bg-[#147A80] text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="whitespace-pre-line">{turn.text}</div>

                          {turn.role === 'assistant' && turn.escalateToHuman && (
                            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                              Este assunto requer atendimento direto da recepção ou equipe da clínica para confirmação individual.
                            </div>
                          )}

                          {turn.role === 'assistant' &&
                            turn.citations &&
                            turn.citations.length > 0 && (
                              <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                                <p className="text-[11px] font-semibold text-slate-500">
                                  Fontes oficiais consultadas
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {turn.citations.map((cit) => (
                                    <button
                                      key={cit.id}
                                      type="button"
                                      onClick={() => handleJumpToCitation(cit.id)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:border-[#147A80] text-xs font-medium text-slate-700 hover:text-[#147A80] transition-colors cursor-pointer"
                                    >
                                      <BookOpen className="w-3 h-3 shrink-0" />
                                      <span className="truncate max-w-[260px]">{cit.title}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                          {turn.role === 'assistant' &&
                            turn.followUpSuggestions &&
                            turn.followUpSuggestions.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-2">
                                {turn.followUpSuggestions.map((sug) => (
                                  <button
                                    key={sug}
                                    type="button"
                                    onClick={() => handleSendChat(sug)}
                                    className="text-xs text-[#147A80] hover:underline font-medium text-left cursor-pointer"
                                  >
                                    → {sug}
                                  </button>
                                ))}
                              </div>
                            )}

                          {turn.role === 'assistant' && (
                            <div className="pt-1 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleCopyText(turn.text, idx)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                              >
                                {copiedTurnIdx === idx ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar resposta</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {isSendingChat && (
                    <div className="flex justify-start">
                      <div className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-[#147A80] animate-spin" />
                        <span>Consultando a documentação oficial de {activeProfileMeta.label}...</span>
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{chatError}</span>
                      </div>
                      {lastFailedPrompt && (
                        <button
                          type="button"
                          onClick={() => handleSendChat(lastFailedPrompt)}
                          className="px-3 py-1.5 rounded-md bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Tentar novamente
                        </button>
                      )}
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="p-3.5 border-t border-slate-200 bg-white rounded-b-xl flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    maxLength={800}
                    disabled={isSendingChat}
                    placeholder={`Digite sua dúvida sobre o uso para ${activeProfileMeta.shortLabel.toLowerCase()}...`}
                    className="flex-1 h-10 px-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#147A80] focus:outline-none text-sm text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || chatInput.trim().length < 2}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-lg bg-[#147A80] hover:bg-[#0F5C61] disabled:opacity-50 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: STATUS DE SINCRONIZAÇÃO GITHUB (APENAS ADMIN/GERÊNCIA) */}
            {activeTab === 'github' && initialAccess.canViewGitHubStatus && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Atualização Automática via GitHub (Pull Request)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Sempre que um commit na branch principal altera funcionalidades que impactam Pacientes, Dentistas ou Atendentes, a GitHub Action analisa as mudanças, atualiza a base de conhecimento e abre um Pull Request para revisão antes de ir para produção.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Versão da Base</p>
                      <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                        v{versionLabel}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        Revisada em {syncDateLabel}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Repositório Fonte</p>
                      <p className="text-sm font-bold text-slate-900 font-mono mt-1 truncate">
                        {kbMeta.repository}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Branch: {kbMeta.branch} · Fluxo via PR
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Artigos por Perfil</p>
                      <div className="mt-1 space-y-0.5 text-xs text-slate-800 tabular-nums">
                        <p>Pacientes: {countsByProfile.patient ?? getSupportArticles('patient').length}</p>
                        <p>Dentistas: {countsByProfile.dentist ?? getSupportArticles('dentist').length}</p>
                        <p>Atendentes: {countsByProfile.receptionist ?? getSupportArticles('receptionist').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Mapa de Impacto Código → Perfis Monitorados
                    </h3>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {(kbMeta.impactMap || []).length} regras ativas
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-4 font-semibold">Área Funcional</th>
                          <th className="py-2 pr-4 font-semibold">Módulo Monitorado</th>
                          <th className="py-2 font-semibold">Perfis Atualizados no PR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(kbMeta.impactMap || []).map((rule) => (
                          <tr key={rule.pattern}>
                            <td className="py-2.5 pr-4 font-medium text-slate-900">
                              {rule.area}
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-slate-600">
                              {rule.pattern}
                            </td>
                            <td className="py-2.5 text-slate-700">
                              {rule.profiles
                                .map((p) => SUPPORT_META.profiles[p]?.shortLabel || p)
                                .join(' · ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Como manter ativo no GitHub:</p>
                    <p>
                      1. Cadastre o segredo <span className="font-mono text-slate-900">GEMINI_API_KEY</span> em Settings → Secrets and variables → Actions do repositório para que a Action redija rascunhos inteligentes de FAQ em cada PR.
                    </p>
                    <p>
                      2. Sempre que revisar e aprovar o Pull Request gerado, o FAQ online, o Chat de IA e as 3 Cartilhas A4 serão atualizados automaticamente no próximo deploy.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
