import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SupportCenterView } from './SupportCenterView';
import type { SupportProfileId } from '../../types/support';

interface SupportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextMode?: 'patient' | 'app';
  userRole?: string | null;
  userName?: string | null;
  initialProfile?: SupportProfileId;
  initialView?: 'faq' | 'chat' | 'print';
}

export const SupportCenterModal: React.FC<SupportCenterModalProps> = ({
  isOpen,
  onClose,
  contextMode,
  userRole,
  userName,
  initialProfile,
  initialView = 'faq',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedContext: 'patient' | 'app' =
    contextMode || (String(userRole || '').toLowerCase() === 'patient' ? 'patient' : 'app');

  return createPortal(
    <div
      className="support-modal-backdrop fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Central de Suporte Bertuol Flow"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="support-modal-shell w-full max-w-6xl h-full sm:h-[90vh] bg-[#F8FAFC] sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        <SupportCenterView
          mode="modal"
          contextMode={resolvedContext}
          userRole={userRole}
          userName={userName}
          initialProfile={initialProfile}
          initialView={initialView}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body
  );
};
