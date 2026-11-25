import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  QrCode,
  Info,
  Sparkles,
} from 'lucide-react';

interface AppointmentCardProps {
  appointmentTime: string;
  appointmentDayText: string;
  dentistName: string;
  dentistRole: string;
  procedures: string;
  clinicName: string;
  isConfirmed: boolean;
  onConfirm: () => void;
  onNavigateToCheckin: () => void;
  totalPoints: number;
  onViewExtrato: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointmentTime,
  appointmentDayText,
  dentistName,
  dentistRole,
  procedures,
  clinicName,
  isConfirmed,
  onConfirm,
  onNavigateToCheckin,
  totalPoints,
  onViewExtrato,
}) => {
  const doctorInitials = dentistName
    .split(' ')
    .filter((w) => !w.toLowerCase().startsWith('dr'))
    .map((n) => n[0])
    .slice(0, 2)
    .join('') || 'DR';

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Main Appointment Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#147A80] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#147A80]" />
            Próxima Consulta
          </span>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isConfirmed
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isConfirmed ? '✓ Presença Confirmada' : '⏳ Aguardando Confirmação'}
          </span>
        </div>

        {/* Time & Doctor Details */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{appointmentTime}</span>
            <span className="text-xs text-gray-500 font-medium">{appointmentDayText}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#147A80]/10 flex items-center justify-center text-[#147A80] font-bold text-xs shrink-0">
                {doctorInitials}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{dentistName}</p>
                <p className="text-[11px] text-gray-500">{dentistRole}</p>
              </div>
            </div>

            <div className="text-[11px] text-[#147A80] font-semibold bg-teal-50/80 px-2.5 py-1 rounded-lg">
              Procedimento: {procedures}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 pt-1 border-t border-gray-200/60">
              <MapPin className="w-3.5 h-3.5 text-[#147A80] shrink-0" />
              <span className="truncate">{clinicName}</span>
            </div>
          </div>

          {/* 1-Click Confirmation CTA (RF01 / RF02) */}
          {!isConfirmed ? (
            <button
              onClick={onConfirm}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#147A80]/20 transition-all active:scale-98 cursor-pointer group"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Confirmar Minha Presença</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black ml-1">
                +10 pts
              </span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Obrigado! Sua presença está confirmada.</p>
                <p className="text-[11px] text-emerald-700">
                  Você ganhou <strong>+10 pontos</strong> no seu Clube Sorriso.
                </p>
              </div>
            </div>
          )}

          {/* Location / Navigation Links */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="https://maps.google.com/?q=Bertuol+Odontologia+Palmas"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#147A80]" />
              <span>Ver no Mapa</span>
            </a>
            <button
              onClick={onNavigateToCheckin}
              className="py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#147A80] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#147A80]" />
              <span>Fazer Check-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loyalty Points Teaser Card */}
      <div className="bg-gradient-to-r from-teal-700 via-[#147A80] to-teal-800 rounded-3xl p-4 text-white shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center font-black text-amber-300 text-lg shrink-0">
            ⭐
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-200 block">
              Clube Sorriso Bertuol
            </span>
            <span className="text-xs sm:text-sm font-black truncate block">
              Você tem <strong className="text-amber-300">{totalPoints} pontos</strong> disponíveis
            </span>
          </div>
        </div>
        <button
          onClick={onViewExtrato}
          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          Ver Extrato
        </button>
      </div>

      {/* Preparation / Clinical Guidelines */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#147A80]" />
          Orientações para o Atendimento
        </h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50">
            <span className="text-base">⏰</span>
            <p>
              <strong>Chegue 10 minutos antes</strong> para realizar o check-in no totem do balcão e garantir seus pontos.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50">
            <span className="text-base">🪥</span>
            <p>
              Escove os dentes antes da consulta. Disponibilizamos kits descartáveis na recepção.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50">
            <span className="text-base">📱</span>
            <p>
              Ao chegar, aponte a câmera para o <strong>QR Code do balcão</strong> para avisar a equipe instantaneamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
