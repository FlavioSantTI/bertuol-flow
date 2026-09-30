import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Category } from '../types/database';

interface ClinicorpSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: (categories: Category[]) => void;
}

export const ClinicorpSyncModal: React.FC<ClinicorpSyncModalProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated,
}) => {
  const [user, setUser] = useState(() => localStorage.getItem('clinicorp_api_user') || 'qsparaisoto');
  const [key, setKey] = useState(() => localStorage.getItem('clinicorp_api_key') || 'f77112ec-f697-4e2e-8966-f18f8826d4c6');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    count: number;
    categories: any[];
  } | null>(null);

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !key.trim()) {
      setErrorMessage('Por favor, preencha o Usuário API e o Token API.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      // Salva no localStorage para conveniência
      localStorage.setItem('clinicorp_api_user', user.trim());
      localStorage.setItem('clinicorp_api_key', key.trim());

      const res = await fetch('/api/clinicorp/sync-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user.trim(),
          key: key.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Falha ao sincronizar com o Clinicorp.');
      }

      setSuccessResult({
        count: data.count || (data.categories ? data.categories.length : 0),
        categories: data.categories || [],
      });

      // Mapeia para o formato de categorias do app
      const defaultColors = [
        '#8B5CF6',
        '#0284C7',
        '#E11D48',
        '#D97706',
        '#059669',
        '#DC2626',
        '#4F46E5',
        '#0D9488',
      ];

      const mappedCategories: Category[] = (data.categories || []).map((c: any, i: number) => ({
        id: String(c.id || c.CategoryId || `cat_${i}`),
        description: c.description || c.CategoryDescription || c.name || `Categoria ${i + 1}`,
        color: c.color || c.CategoryColor || defaultColors[i % defaultColors.length],
        Clinic_BusinessId: 5053762760081408,
      }));

      if (mappedCategories.length > 0) {
        onCategoriesUpdated(mappedCategories);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao consultar a API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                  Sincronizar Categorias Clinicorp
                </h2>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded">
                  API Direta
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">GET /appointment/list_categories</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl bg-[#F8F9FA] hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm text-[#1A1A1A]">
          {/* Instruções de onde achar a chave */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 text-xs space-y-1.5">
            <p className="font-semibold text-gray-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              Onde encontrar suas credenciais no Clinicorp:
            </p>
            <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1">
              <li>Faça login no painel do <strong>Clinicorp</strong>.</li>
              <li>Acesse o menu <strong>Gerenciar Assinatura</strong>.</li>
              <li>Clique em <strong>Acesso Externo e Integrações</strong>.</li>
              <li>Copie o <strong>Usuário API</strong> (Username) e o <strong>Token API</strong> (Password).</li>
            </ol>
          </div>

          <form onSubmit={handleSync} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Usuário API (Username)
              </label>
              <input
                type="text"
                placeholder="Ex: seu_usuario_clinicorp ou ID de acesso"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F9FA] hover:bg-gray-100/70 focus:bg-white text-xs sm:text-sm text-[#1A1A1A] rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFB347] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Token API (Password / Key)
              </label>
              <input
                type="password"
                placeholder="Ex: token_secreto_clinicorp_12345"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F9FA] hover:bg-gray-100/70 focus:bg-white text-xs sm:text-sm text-[#1A1A1A] rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#FFB347] transition-all font-mono"
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {successResult.count} categorias sincronizadas com sucesso do Clinicorp!
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  As especialidades foram persistidas na tabela <code>appointment_categories</code> do Supabase e atualizadas na barra de filtros.
                </p>
                {successResult.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {successResult.categories.map((c: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold text-white shadow-2xs"
                        style={{ backgroundColor: c.color || c.CategoryColor || '#8B5CF6' }}
                      >
                        {c.description || c.CategoryDescription || c.name || `Cat ${c.id}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] px-4 py-2.5 bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {isLoading ? 'Consultando API Clinicorp...' : 'Puxar Categorias Agora'}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Autenticação Segura via Proxy Server
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
