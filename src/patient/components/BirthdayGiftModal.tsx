import React, { useState } from 'react';
import { Cake, Sparkles, X } from 'lucide-react';

interface BirthdayGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: {
    unit: string;
    preferredDate: string;
    preferredPeriod: string;
    notes: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const BirthdayGiftModal: React.FC<BirthdayGiftModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState({
    unit: 'Bertuol Odontologia Avançada - Matriz Palmas',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredPeriod: 'Manhã (08h às 12h)',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Agendar Meu Presente</h3>
              <p className="text-[11px] text-gray-500">Profilaxia & Diagnóstico Sky Câmera por nossa conta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs pt-3">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Cortesia Gratuita de Aniversário
            </span>
            <p className="text-[11px] text-amber-800 leading-snug">
              Este procedimento <strong>não consome pontos</strong> do Clube Sorriso e será realizado com nossa tecnologia Sky Câmera!
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Unidade Bertuol:</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#147A80] font-medium bg-gray-50"
            >
              <option value="Bertuol Odontologia Avançada - Matriz Palmas">Matriz Palmas (104 Sul, Av. JK)</option>
              <option value="Bertuol Odontologia - Unidade Paraíso">Unidade Paraíso do Tocantins (Centro)</option>
              <option value="Bertuol Odontologia - Unidade Araguaína">Unidade Araguaína (Setor Central)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Data Preferencial:</label>
            <input
              type="date"
              required
              value={form.preferredDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#147A80] font-medium bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Turno Preferido:</label>
            <select
              value={form.preferredPeriod}
              onChange={(e) => setForm({ ...form, preferredPeriod: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#147A80] font-medium bg-gray-50"
            >
              <option value="Manhã (08h às 12h)">Manhã (08h às 12h)</option>
              <option value="Tarde (14h às 18h)">Tarde (14h às 18h)</option>
              <option value="Qualquer Horário">Qualquer Horário Disponível</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Observações ou Preferências (opcional):</label>
            <textarea
              rows={2}
              placeholder="Ex: Prefiro início da manhã ou após às 16h..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#147A80] font-medium bg-gray-50 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar no App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
