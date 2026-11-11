import React, { useState } from 'react';
import { X, Copy, Check, Database, RefreshCw, Layers, MessageSquare, ExternalLink } from 'lucide-react';
import { SUPABASE_DDL_SCRIPT, SUPABASE_MESSAGING_DDL } from '../utils/supabaseSql';

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
  const [activeTab, setActiveTab] = useState<'messaging' | 'general'>('messaging');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentScript = activeTab === 'messaging' ? SUPABASE_MESSAGING_DDL : SUPABASE_DDL_SCRIPT;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#147A80] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                Scripts SQL DDL — Supabase PostgreSQL
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Banco de Dados: <span className="font-mono text-teal-700">DB_Bertuol (sswbkfrpxboxmjvunhzt)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl bg-[#F8F9FA] hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('messaging')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeTab === 'messaging'
                  ? 'bg-white text-[#147A80] border-[#147A80] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800 border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#147A80]" />
              <span>1. Mensageria Interna (Tabelas do Chat)</span>
              <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[9px] font-black rounded-full">
                Novo
              </span>
            </button>

            <button
              onClick={() => setActiveTab('general')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeTab === 'general'
                  ? 'bg-white text-gray-900 border-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800 border-transparent'
              }`}
            >
              <Layers className="w-4 h-4 text-gray-600" />
              <span>2. Estrutura Completa (Agendamentos, RBAC & Totem)</span>
            </button>
          </div>

          <a
            href="https://supabase.com/dashboard/project/sswbkfrpxboxmjvunhzt/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-[#147A80] hover:underline flex items-center gap-1 hidden sm:flex"
          >
            <span>Abrir Supabase SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-sm text-[#1A1A1A]">
          {activeTab === 'messaging' ? (
            <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200 text-xs text-teal-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-[#147A80]">
                <MessageSquare className="w-4 h-4 text-[#147A80]" />
                Como rodar no Supabase (em 3 passos):
              </span>
              <ol className="list-decimal list-inside space-y-0.5 text-gray-700 pl-1">
                <li>Clique no botão verde <strong>"Copiar SQL da Mensageria"</strong> abaixo.</li>
                <li>Abra o <strong>SQL Editor do Supabase</strong> no seu navegador.</li>
                <li>Cole o código e clique em <strong>RUN (Executar)</strong>. As tabelas, índices e políticas de segurança serão criados instantaneamente.</li>
              </ol>
            </div>
          ) : (
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-700" />
                Isolamento Multitenant:
              </span>
              <p>
                Todas as consultas filtram rigorosamente por <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">Clinic_BusinessId</code> e <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">Dentist_PersonId</code>, garantindo privacidade clínica absoluta.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {activeTab === 'messaging' ? 'Script DDL de Mensageria (PostgreSQL):' : 'Script DDL Geral (Supabase):'}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#1A1A1A] text-teal-100 text-xs font-mono p-4 rounded-2xl overflow-x-auto max-h-[340px] leading-relaxed selection:bg-teal-700 selection:text-white">
              {currentScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F9FA] border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (window.confirm('Deseja recarregar os dados de demonstração da clínica?')) {
                onResetData();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-amber-700 px-3 py-2 rounded-xl hover:bg-gray-200/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar Dados Padrão da Clínica
          </button>

          <button
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-[#1A1A1A] font-bold text-sm transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
