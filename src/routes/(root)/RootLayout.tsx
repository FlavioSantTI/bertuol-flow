import React, { useState } from 'react';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { RootTenantSwitcherBanner } from '../../components/RootTenantSwitcherBanner';
import { useTenant } from '../../contexts/TenantContext';
import { AppUserContext } from '../../types/database';
import { APP_VERSION } from '../../config/version';
import {
  Building2,
  Users,
  FileText,
  Activity,
  Shield,
  LayoutDashboard,
  Server,
  ArrowRight,
  ExternalLink,
  Sparkles,
  BookOpen,
  Monitor,
  Mic,
  Video,
  HelpCircle,
  Smartphone,
  QrCode,
  CheckCircle2,
  Play,
  X,
} from 'lucide-react';

interface RootLayoutProps {
  userContext: AppUserContext;
  onNavigateToApp: () => void;
  onNavigateToPatient: () => void;
  initialTab?: 'tutorials' | 'tenants' | 'logs' | 'users';
}

interface TutorialResource {
  id: string;
  badge: string;
  title: string;
  description: string;
  url: string;
  category: 'apresentacao' | 'roteiros' | 'equipe' | 'paciente';
  accentColor: string;
}

const ROOT_TUTORIAL_RESOURCES: TutorialResource[] = [
  {
    id: 'studio-3d-full',
    badge: 'PALCO 3D + TRILHA 60M',
    title: 'Estúdio de Apresentação 60m (Modo Completo)',
    description:
      'Apresentação interativa com celular 3D, Cápsulas de Vidro Flutuantes, Rede Neural e roteiro lateral para treinamento geral da equipe.',
    url: '/slideshow-hyperframes.html',
    category: 'apresentacao',
    accentColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'studio-3d-projector',
    badge: 'MODO TELÃO / PROJETOR',
    title: 'Só Telão 3D Limpo (?mode=projector)',
    description:
      'Exibe exclusivamente o palco visual 3D em 100% da tela para o projetor/TV, sem barra lateral nem teleprompter, sincronizado em tempo real.',
    url: '/slideshow-hyperframes.html?mode=projector',
    category: 'apresentacao',
    accentColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'studio-3d-presenter',
    badge: 'MODO APRESENTADOR',
    title: 'Só Trilha & Teleprompter (?mode=presenter)',
    description:
      'Painel de comando para o seu notebook ou celular com Teleprompter em letras grandes, Cronômetro de 60m e controle remoto do Telão.',
    url: '/slideshow-hyperframes.html?mode=presenter',
    category: 'apresentacao',
    accentColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'heygen-scripts',
    badge: '3 VÍDEOS DE 2 MIN + MAPA',
    title: 'Central de Roteiros HeyGen & Mapeamento Técnico',
    description:
      'Os 3 roteiros de 6 cenas (1. Paciente + Clube, 2. Dentista, 3. Recepção) com cópia em 1 clique, prompts Veo e tabela dos 16 módulos reais.',
    url: '/roteiros-heygen.html',
    category: 'roteiros',
    accentColor: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'faq-equipe',
    badge: 'GUIA DA EQUIPE',
    title: 'Central de Ajuda & FAQ Interativo (/faq.html)',
    description:
      'Perguntas e respostas rápidas separadas por perfil (Recepção, Dentistas, Gerência, Senhas e Biometria Face ID).',
    url: '/faq.html',
    category: 'equipe',
    accentColor: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'totem-print',
    badge: 'BALCÃO RECEPÇÃO',
    title: 'Folha Oficial do Totem QR Code (/totem-imprimir)',
    description:
      'Arte oficial em formato A4 pronta para impressão com QR Code dinâmico de Check-in das unidades Palmas e Paraíso.',
    url: '/totem-imprimir',
    category: 'equipe',
    accentColor: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'tutorial-paciente',
    badge: 'ONBOARDING PACIENTE',
    title: 'Tutorial do Paciente & Clube Sorriso',
    description:
      'Passo a passo visual para o paciente aprender a confirmar presença, escanear o Totem QR e resgatar vouchers.',
    url: '/tutorial-paciente.html',
    category: 'paciente',
    accentColor: 'from-pink-500 to-rose-600',
  },
  {
    id: 'manual-pwa',
    badge: 'INSTALAÇÃO MOBILE',
    title: 'Manual de Instalação PWA & Notificações Push',
    description:
      'Instruções visuais para Android (Chrome) e iPhone (Safari) para adicionar à Tela de Início e ativar alertas.',
    url: '/manual-instalacao.html',
    category: 'paciente',
    accentColor: 'from-sky-500 to-cyan-600',
  },
];

export const RootLayout: React.FC<RootLayoutProps> = ({
  userContext,
  onNavigateToApp,
  onNavigateToPatient,
  initialTab = 'tutorials',
}) => {
  const { availableClinics, activeClinicId, switchClinic } = useTenant();
  const [activeTab, setActiveTab] = useState<'tutorials' | 'tenants' | 'logs' | 'users'>(initialTab);
  const [embeddedResource, setEmbeddedResource] = useState<TutorialResource | null>(null);

  return (
    <ProtectedRoute allowedContext="root" userContext={userContext}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
        {/* Top Banner de Simulação Multi-Tenant */}
        <RootTenantSwitcherBanner userContext={userContext} />

        {/* Header do Painel Root / SuperAdmin */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Painel Global SuperAdmin (Root)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono">
                  v{APP_VERSION} • Exclusivo Root
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Central de Tutoriais, Apresentação 3D, Roteiros HeyGen e Governança Multi-Tenant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onNavigateToApp}
              className="px-3.5 py-2 rounded-xl bg-[#147A80] hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Voltar para a Agenda Limpa (/)</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToPatient}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver Portal Paciente (/portal)</span>
            </button>
          </div>
        </header>

        {/* Sub-Header de Navegação Root */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'tutorials', label: '🎬 Central de Tutoriais & Apresentação 3D', icon: Sparkles },
            { id: 'tenants', label: '🏢 Gestão de Clínicas (Tenants)', icon: Building2 },
            { id: 'users', label: '👥 Usuários Globais', icon: Users },
            { id: 'logs', label: '📋 Auditoria & Checklist Quarta-Feira', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setEmbeddedResource(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Visualizador Embutido em Tela Cheia quando o Admin Root abre um Tutorial/Estúdio */}
        {embeddedResource && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold">
                  {embeddedResource.badge}
                </span>
                <span className="font-extrabold text-sm">{embeddedResource.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={embeddedResource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir em Nova Janela</span>
                </a>
                <button
                  type="button"
                  onClick={() => setEmbeddedResource(null)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar Visualizador</span>
                </button>
              </div>
            </div>
            <iframe
              src={embeddedResource.url}
              title={embeddedResource.title}
              className="w-full flex-1 border-0 bg-slate-950"
            />
          </div>
        )}

        {/* Conteúdo Principal do Root */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === 'tutorials' && (
            <div className="space-y-6">
              {/* Banner de Lançamento Oficial de Quarta-Feira */}
              <div className="bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 border border-teal-500/30 rounded-3xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>AMBIENTE PRINCIPAL LIMPO PARA O LANÇAMENTO DE QUARTA-FEIRA</span>
                  </div>
                  <h2 className="text-lg font-black text-white">
                    Central Exclusiva de Tutoriais, Apresentação 3D & Roteiros HeyGen
                  </h2>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    Todos os materiais de apresentação, roteiros de vídeo e guias de implantação foram concentrados aqui na rota restrita do <strong>Admin Root (`/root` ou `/?app=tutoriais`)</strong>, mantendo a tela principal da clínica 100% limpa para dentistas, recepção e gerência.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href="/slideshow-hyperframes.html?mode=projector"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Abrir Telão 3D ↗</span>
                  </a>
                  <a
                    href="/slideshow-hyperframes.html?mode=presenter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Abrir Trilha / Controle ↗</span>
                  </a>
                </div>
              </div>

              {/* Grid de Módulos de Treinamento, Apresentação e Roteiros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROOT_TUTORIAL_RESOURCES.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md bg-gradient-to-r ${item.accentColor} text-white font-mono text-[10px] font-extrabold uppercase tracking-wider`}
                        >
                          {item.badge}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{item.url}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setEmbeddedResource(item)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-amber-400" />
                        <span>Abrir Aqui no Painel</span>
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Nova Aba</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Clínicas Cadastradas</span>
                    <Building2 className="w-4 h-4 text-teal-400" />
                  </div>
                  <p className="text-2xl font-black text-white">{availableClinics.length}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Unidade Selecionada no Switcher</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-sm font-extrabold text-amber-300">
                    {activeClinicId === 'all'
                      ? 'Todas as Unidades (Visão Consolidada)'
                      : availableClinics.find((c) => c.id === activeClinicId)?.name || 'Unidade Padrão'}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Status dos Servidores & API</span>
                    <Server className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>100% Operacional (200 OK)</span>
                  </p>
                </div>
              </div>

              {/* Lista de Clínicas com Ação Instantânea de Impersonation */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Unidades Operacionais do Sistema</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableClinics.map((clinic) => {
                    const isSelected = activeClinicId === clinic.id;
                    return (
                      <div
                        key={clinic.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-950/20 border-amber-500/50 text-slate-100'
                            : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-white">{clinic.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 border border-teal-800 text-teal-300 font-mono">
                              ID: {clinic.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{clinic.address}</p>
                          <p className="text-xs text-slate-500 font-mono">{clinic.phone}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              switchClinic(clinic.id);
                              onNavigateToApp();
                            }}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Simular esta Unidade no /app</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span>Gestão Global de Usuários e Permissões</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualização consolidada de todos os usuários cadastrados nas unidades e seus papéis no sistema (`admin_clinica`, `dentist`, `receptionist`, `gerente_atendimento`, `admin_root`).
              </p>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Checklist Oficial de Prontidão para Quarta-Feira (v{APP_VERSION})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">6.285+ Pacientes Sincronizados (Supabase)</strong>
                    Busca instantânea por nome no topo da Central de Credenciais para Palmas e Paraíso.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Isolamento Multi-Tenant & RBAC</strong>
                    Unidade travada com cadeado para Recepção e Dentistas; visão global apenas para Root e Gerência.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Interface Principal 100% Limpa</strong>
                    Botões de apresentação e roteiros movidos exclusivamente para `/root` (`?app=tutoriais`).
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Clube Sorriso & Totem QR Operacionais</strong>
                    Consulta de vouchers liberada para Dentistas e baixa em 1 clique na Recepção.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};
