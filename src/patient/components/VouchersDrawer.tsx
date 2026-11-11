import React, { useState } from 'react';
import {
  Ticket,
  QrCode,
  Check,
  Copy,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import type { PatientVoucher, BirthdayGiftInfo } from '../types/patientTypes';

interface VouchersDrawerProps {
  vouchers: PatientVoucher[];
  isBirthdayToday?: boolean;
  birthdayGiftVoucher?: BirthdayGiftInfo | null;
  onOpenBirthdaySchedule: () => void;
  onNavigateToCatalog: () => void;
}

export const VouchersDrawer: React.FC<VouchersDrawerProps> = ({
  vouchers,
  isBirthdayToday = false,
  birthdayGiftVoucher,
  onOpenBirthdaySchedule,
  onNavigateToCatalog,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Cortesia Especial de Aniversário (Não consome pontos do Clube) - Exclusivo para aniversariantes */}
      {isBirthdayToday && (
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-teal-800 rounded-3xl p-5 text-white shadow-md border border-amber-300/40 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-amber-100">
              🎁 Cortesia Exclusiva de Aniversário
            </span>
            <span className="text-[10px] font-black bg-amber-950/70 px-2 py-0.5 rounded-full text-amber-300 border border-amber-400/30">
              Fora do Clube • 0 Pontos
            </span>
          </div>
          <h4 className="text-base font-black text-white">
            Profilaxia & Diagnóstico Sky Câmera
          </h4>
          <p className="text-xs text-amber-100 mt-1 leading-relaxed">
            Presente de aniversário exclusivo para você. Não consome seus pontos acumulados no Clube Sorriso!
          </p>
          <div className="mt-3 p-3 rounded-2xl bg-black/20 border border-white/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-200 font-semibold block uppercase">Validade</span>
              <span className="font-bold text-white text-xs">{birthdayGiftVoucher?.validUntil || '30 dias'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-200 font-semibold block uppercase">Código Exclusivo</span>
              <span className="font-mono text-xs font-black text-amber-300">{birthdayGiftVoucher?.code || 'NIVER-2026'}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onOpenBirthdaySchedule}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-amber-50 text-[#147A80] font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <CalendarClock className="w-4 h-4 text-[#147A80]" />
              <span>Agendar Meu Presente no App</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-[#147A80]" />
          Meus Vouchers Resgatados
        </h3>
        <span className="text-[11px] text-gray-500 font-medium">
          {vouchers.length} no histórico
        </span>
      </div>

      {vouchers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <Ticket className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">Nenhum voucher resgatado ainda</h4>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Acumule pontos confirmando suas consultas e fazendo check-in no totem para trocar por kits e tratamentos!
          </p>
          <button
            onClick={onNavigateToCatalog}
            className="px-4 py-2 rounded-xl bg-[#147A80] text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Ver Catálogo de Prêmios
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((voucher) => {
            const isClaimed = voucher.status === 'claimed';
            const code = voucher.secretCode || 'BT-0000';
            const expiresStr = voucher.expiresAt || new Date().toISOString();
            const pointsSpent = voucher.pointsSpent ?? 50;
            const title = voucher.rewardTitle || 'Brinde Bertuol';

            return (
              <div
                key={voucher.id}
                className={`bg-white rounded-3xl p-5 shadow-sm border ${
                  isClaimed ? 'border-gray-200 opacity-75' : 'border-amber-200/80 ring-2 ring-amber-100'
                } relative overflow-hidden`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        isClaimed
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isClaimed ? '✓ Entregue na Recepção' : '🎟️ Disponível para Retirada'}
                    </span>
                    <h4 className="text-sm font-black text-gray-900 mt-1.5">
                      {title}
                    </h4>
                  </div>

                  {/* QR Code representation */}
                  <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-1 shrink-0">
                    <QrCode className="w-10 h-10 text-gray-800" />
                  </div>
                </div>

                {/* Code Pill with 1-click copy */}
                <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">
                      Código de Resgate:
                    </p>
                    <p className="text-base font-black tracking-widest text-[#147A80]">
                      {code}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode === code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  <span>
                    Válido até: <strong>{new Date(expiresStr).toLocaleDateString('pt-BR')}</strong>
                  </span>
                  <span>{pointsSpent} pts gastos</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
