import React from 'react';
import {
  Bell,
  BellRing,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  Cake,
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isPushSubscribed: boolean;
  isSubscribingPush: boolean;
  onSubscribePush: () => void;
  onSendTestPush: () => void;
  notifications: any[];
  onMarkAllRead: () => void;
  onMarkRead: (id?: string) => void;
  onOpenBirthdaySchedule: () => void;
  onConfirmAppointment: () => void;
  onNavigateToCheckin: () => void;
  isConfirmed: boolean;
  isCheckedIn: boolean;
  onSendReminderPush: (type: '1_day_before' | '2_hours_before') => void;
  onSendBirthdayPush: () => void;
  isBirthdayToday?: boolean;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  isPushSubscribed,
  isSubscribingPush,
  onSubscribePush,
  onSendTestPush,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onOpenBirthdaySchedule,
  onConfirmAppointment,
  onNavigateToCheckin,
  isConfirmed,
  isCheckedIn,
  onSendReminderPush,
  onSendBirthdayPush,
  isBirthdayToday = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-[#147A80] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Central de Notificações</h3>
              <p className="text-[10px] text-gray-500">Lembretes de consulta & cortesias exclusivas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
          {/* Status do Push Nativo */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs text-amber-300">
                <BellRing className="w-4 h-4" />
                Web Push no Aparelho
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isPushSubscribed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isPushSubscribed ? 'Ativo no Celular' : 'Não Ativado'}
              </span>
            </div>
            <p className="text-[11px] text-gray-300">
              {isPushSubscribed
                ? 'Seu aparelho recebe avisos 1 dia antes, 2 horas antes e cortesias mesmo com o app fechado.'
                : 'Ative para receber avisos sem depender de WhatsApp.'}
            </p>
            {!isPushSubscribed ? (
              <button
                onClick={onSubscribePush}
                disabled={isSubscribingPush}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isSubscribingPush ? 'Ativando...' : 'Ativar Notificações no Celular'}</span>
              </button>
            ) : (
              <button
                onClick={onSendTestPush}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-[11px] border border-slate-700 transition-colors"
              >
                Disparar Notificação de Teste
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                Avisos Recebidos ({notifications.length})
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[10px] text-[#147A80] font-bold hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 space-y-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                <Bell className="w-7 h-7 mx-auto text-gray-300" />
                <p className="font-bold text-gray-600">Nenhum aviso no momento</p>
                <p className="text-[11px] text-gray-400">Use os botões de simulação abaixo para testar os disparos!</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isBday = notif.type === 'birthday';
                const is1d = notif.type === 'reminder_1_day';
                const is2h = notif.type === 'reminder_2_hours';
                const createdDate = notif.createdAt ? new Date(notif.createdAt) : new Date();

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      !notif.read
                        ? 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg">
                          {isBday ? '🎂' : is1d ? '📅' : is2h ? '⏰' : '🔔'}
                        </span>
                        <div>
                          <h4 className="font-black text-gray-900 text-xs leading-snug">{notif.title}</h4>
                          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{notif.body}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {createdDate.toLocaleDateString('pt-BR')} às{' '}
                            {createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Ações Diretas na Notificação (Sem WhatsApp) */}
                    {isBday && isBirthdayToday && (
                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenBirthdaySchedule();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-[11px] shadow-2xs cursor-pointer active:scale-95"
                        >
                          🎁 Agendar Meu Presente
                        </button>
                      </div>
                    )}

                    {is1d && !isConfirmed && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            onConfirmAppointment();
                            onMarkRead(notif.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-bold text-[11px] shadow-2xs cursor-pointer active:scale-95"
                        >
                          Confirmar Presença no App (+10 pts)
                        </button>
                      </div>
                    )}

                    {is2h && !isCheckedIn && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToCheckin();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer active:scale-95"
                        >
                          Fazer Check-in no Balcão (+20 pts)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer com simulador rápido */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">
            Simulador de Teste Rápido (Disparos Imediatos)
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onSendReminderPush('1_day_before')}
              className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-[10px] transition-colors"
            >
              📅 1 Dia Antes
            </button>
            <button
              onClick={() => onSendReminderPush('2_hours_before')}
              className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-[10px] transition-colors"
            >
              ⏰ 2 Horas Antes
            </button>
            <button
              onClick={onSendBirthdayPush}
              className="py-1.5 px-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-black text-[10px] transition-colors"
            >
              🎂 Aniversário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
