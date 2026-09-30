import React, { useState } from 'react';
import { X, Copy, Check, Database, RefreshCw, Layers } from 'lucide-react';
import { SUPABASE_DDL_SCRIPT } from '../utils/supabaseSql';

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
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_DDL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                Modelagem Supabase & Clinicorp
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Estrutura relacional DDL (PostgreSQL) com suporte a Multitenancy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center min-w-[48px] min-h-[48px] rounded-2xl bg-[#F8F9FA] hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm text-[#1A1A1A]">
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              Isolamento Multitenant:
            </span>
            <p>
              Todas as consultas filtram rigorosamente por <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">Clinic_BusinessId</code> e <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">Dentist_PersonId</code>, garantindo privacidade clínica absoluta.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Script SQL DDL (Supabase):
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-600" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#1A1A1A] text-amber-100/90 text-xs font-mono p-4 rounded-2xl overflow-x-auto max-h-[300px] leading-relaxed">
              {SUPABASE_DDL_SCRIPT}
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
