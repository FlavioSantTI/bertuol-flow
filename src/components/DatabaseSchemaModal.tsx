import React, { useState } from 'react';
import { X, Copy, Check, Database, RefreshCw, Layers, MessageSquare, ExternalLink, Users } from 'lucide-react';
import { SUPABASE_DDL_SCRIPT, SUPABASE_MESSAGING_DDL, SUPABASE_CRM_RECALL_DDL } from '../utils/supabaseSql';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'crm_recall' | 'messaging' | 'general'>('crm_recall');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentScript =
    activeTab === 'crm_recall'
      ? SUPABASE_CRM_RECALL_DDL
      : activeTab === 'messaging'
      ? SUPABASE_MESSAGING_DDL
      : SUPABASE_DDL_SCRIPT;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                Scripts SQL DDL — Supabase PostgreSQL
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Banco de Dados: <span className="font-mono text-[#147A80]">DB_Bertuol (sswbkfrpxboxmjvunhzt)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('crm_recall')}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                activeTab === 'crm_recall'
                  ? 'bg-white text-[#147A80] border-[#147A80] font-semibold'
                  : 'text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1. CRM Recall 180d</span>
            </button>

            <button
              onClick={() => setActiveTab('messaging')}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                activeTab === 'messaging'
                  ? 'bg-white text-[#147A80] border-[#147A80] font-semibold'
                  : 'text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>2. Mensageria Interna</span>
            </button>

            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-white text-[#147A80] border-[#147A80] font-semibold'
                  : 'text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Estrutura Completa (RBAC & Totem)</span>
            </button>
          </div>

          <a
            href="https://supabase.com/dashboard/project/sswbkfrpxboxmjvunhzt/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#147A80] hover:underline items-center gap-1 hidden sm:flex shrink-0 pb-1.5"
          >
            <span>Abrir Supabase SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm text-slate-900 bg-[#F8FAFC]/40">
          {activeTab === 'crm_recall' ? (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-semibold flex items-center gap-1.5 text-[#147A80]">
                <Users className="w-4 h-4" />
                Tabela Oficial do CRM Recall (crm_leads_recall)
              </span>
              <p>
                Execute o script abaixo no <strong>SQL Editor do Supabase</strong>. No fluxo do n8n das 06:00h, aponte o nó do Supabase para a tabela <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">crm_leads_recall</code> usando operação <strong>Upsert</strong> na coluna <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">patient_id</code>.
              </p>
            </div>
          ) : activeTab === 'messaging' ? (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-semibold flex items-center gap-1.5 text-[#147A80]">
                <MessageSquare className="w-4 h-4" />
                Como rodar no Supabase (em 3 passos)
              </span>
              <ol className="list-decimal list-inside space-y-0.5 pl-1">
                <li>Clique no botão <strong>&quot;Copiar SQL&quot;</strong> abaixo.</li>
                <li>Abra o <strong>SQL Editor do Supabase</strong> no seu navegador.</li>
                <li>Cole o código e clique em <strong>RUN (Executar)</strong>.</li>
              </ol>
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-semibold flex items-center gap-1.5 text-[#147A80]">
                <Layers className="w-4 h-4" />
                Isolamento Multitenant
              </span>
              <p>
                Todas as consultas filtram rigorosamente por <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Clinic_BusinessId</code> e <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Dentist_PersonId</code>, garantindo privacidade clínica absoluta.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">
                {activeTab === 'crm_recall'
                  ? 'Script SQL da Tabela crm_leads_recall'
                  : activeTab === 'messaging'
                  ? 'Script DDL de Mensageria (PostgreSQL)'
                  : 'Script DDL Geral (Supabase)'}
              </span>
              <button
                onClick={handleCopy}
                className="h-9 flex items-center gap-1.5 text-xs font-medium px-3.5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado com Sucesso</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 text-teal-100 text-xs font-mono p-4 rounded-xl overflow-x-auto max-h-[340px] leading-relaxed selection:bg-teal-700 selection:text-white">
              {currentScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onResetData();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#147A80] px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar Dados Padrão da Clínica
          </button>

          <button
            onClick={onClose}
            className="h-10 px-5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
