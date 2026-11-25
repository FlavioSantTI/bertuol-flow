import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  QrCode,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
  Eye,
  Award,
  Zap,
} from 'lucide-react';

export interface TutorialStep {
  id: string;
  targetId: string;
  badge: string;
  title: string;
  description: string;
  highlightText?: string;
  pointsText?: string;
  icon: React.ReactNode;
  positionPreference?: 'top' | 'bottom' | 'center';
}

interface CheckinTutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateCheckin?: () => void;
  onTriggerCamera?: () => void;
  onOpenTotem?: () => void;
  isCheckedIn?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'step-welcome',
    targetId: 'tutorial-step-intro',
    badge: 'Passo 1 de 4 • Recepção Inteligente',
    title: 'Chegou na Clínica? Avise em 1 Segundo!',
    description:
      'Ao chegar na Bertuol Odontologia, você não precisa ficar em filas nem pranchetas de papel. Seu check-in avisa o dentista na hora e já acumula pontos!',
    highlightText: 'Sem filas e sem espera na recepção.',
    pointsText: '+20 pontos por pontualidade',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    positionPreference: 'bottom',
  },
  {
    id: 'step-totem',
    targetId: 'tutorial-step-totem',
    badge: 'Passo 2 de 4 • Totem da Clínica',
    title: 'Localize o Totem no Balcão',
    description:
      'Na recepção das unidades de Palmas ou Paraíso, localize o Totem de acrílico com o QR Code de presença. Você também pode tocar no botão abaixo para visualizá-lo na tela!',
    highlightText: 'QR Code exclusivo posicionado no balcão.',
    icon: <QrCode className="w-5 h-5 text-teal-600" />,
    positionPreference: 'bottom',
  },
  {
    id: 'step-camera',
    targetId: 'tutorial-step-camera',
    badge: 'Passo 3 de 4 • Destaque da Câmera',
    title: 'Toque para Ativar a Câmera',
    description:
      'Toque no botão destacado abaixo! O navegador abre sua câmera fotográfica traseira instantaneamente. É seguro, nativo do seu smartphone e não exige instalar nada da loja.',
    highlightText: 'Aponte a câmera para o Totem no balcão.',
    icon: <Camera className="w-5 h-5 text-emerald-600" />,
    positionPreference: 'top',
  },
  {
    id: 'step-rewards',
    targetId: 'tutorial-step-camera',
    badge: 'Passo 4 de 4 • Pontos Automáticos',
    title: 'Leitura Rápida & +20 Pontos Ganhos!',
    description:
      'Assim que a câmera focar o QR Code: sua presença é confirmada, o painel da Dra. Ariane / seu dentista apita que você chegou, e +20 pontos entram automaticamente no seu saldo!',
    highlightText: 'Troque seus pontos por limpezas e vouchers!',
    pointsText: 'Pontuação creditada na hora',
    icon: <Award className="w-5 h-5 text-yellow-500" />,
    positionPreference: 'top',
  },
];

export const CheckinTutorialOverlay: React.FC<CheckinTutorialOverlayProps> = ({
  isOpen,
  onClose,
  onSimulateCheckin,
  onTriggerCamera,
  onOpenTotem,
  isCheckedIn = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 400,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const step = TUTORIAL_STEPS[currentStepIndex];

  // Update target rect on step change or resize
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      if (!step) return;
      const el = document.getElementById(step.targetId);
      if (el) {
        // Smooth scroll element into view if out of bounds
        const rect = el.getBoundingClientRect();
        const isInViewport =
          rect.top >= 60 &&
          rect.bottom <= window.innerHeight - 60;

        if (!isInViewport) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }

        // Slight timeout to catch end of smooth scroll
        setTimeout(() => {
          const freshRect = el.getBoundingClientRect();
          setTargetRect(freshRect);
        }, 150);
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isOpen, currentStepIndex, step]);

  if (!isOpen) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, TUTORIAL_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('bertuol_checkin_tutorial_completed', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  // Determine card placement relative to target element
  let cardPositionStyle: React.CSSProperties = {};
  const padding = 12;
  const cardWidth = Math.min(windowDimensions.width - 24, 380);

  if (targetRect) {
    const spaceBelow = windowDimensions.height - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (step.positionPreference === 'bottom' || spaceBelow > 280) {
      // Place below target
      cardPositionStyle = {
        position: 'fixed',
        top: Math.min(targetRect.bottom + padding, windowDimensions.height - 290),
        left: Math.max(12, Math.min(targetRect.left + targetRect.width / 2 - cardWidth / 2, windowDimensions.width - cardWidth - 12)),
        width: cardWidth,
      };
    } else {
      // Place above target
      cardPositionStyle = {
        position: 'fixed',
        bottom: Math.min(windowDimensions.height - targetRect.top + padding, windowDimensions.height - 80),
        left: Math.max(12, Math.min(targetRect.left + targetRect.width / 2 - cardWidth / 2, windowDimensions.width - cardWidth - 12)),
        width: cardWidth,
      };
    }
  } else {
    // Fallback centered
    cardPositionStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: cardWidth,
    };
  }

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden select-none animate-in fade-in duration-200">
      {/* Dark backdrop with cutout SVG spotlight */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 9991 }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            {/* White area = visible dark mask */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout = transparent spotlight */}
            {targetRect && (
              <rect
                x={Math.max(4, targetRect.left - 6)}
                y={Math.max(4, targetRect.top - 6)}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="20"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 20, 24, 0.78)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Pulsing highlight border directly around target element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out z-[9992] rounded-[22px] border-2 border-[#1FB5BD] shadow-[0_0_25px_rgba(31,181,189,0.7)] animate-pulse"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          {/* Beacon badge on top corner */}
          <div className="absolute -top-3.5 -right-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Foco</span>
          </div>
        </div>
      )}

      {/* Interactive Tooltip Card */}
      <div
        style={{ ...cardPositionStyle, zIndex: 9995 }}
        className="transition-all duration-200 ease-out"
      >
        <div className="bg-white rounded-3xl p-5 shadow-2xl border-2 border-teal-500/30 text-gray-900 relative space-y-3.5 backdrop-blur-xl">
          {/* Header Row: Badge & Close Button */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#147A80] bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              {step.icon}
              <span>{step.badge}</span>
            </span>

            <button
              onClick={handleComplete}
              title="Fechar tutorial"
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-gray-900 leading-snug flex items-center gap-2">
              <span>{step.title}</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed font-normal">
              {step.description}
            </p>
          </div>

          {/* Feature Highlight Pill & Points Badge */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {step.highlightText && (
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50/80 border border-teal-200/60 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{step.highlightText}</span>
              </span>
            )}
            {step.pointsText && (
              <span className="text-[11px] font-black text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-300 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                ⭐ {step.pointsText}
              </span>
            )}
          </div>

          {/* Quick Context Action Button (e.g. Try camera, view totem, simulate checkin) */}
          {currentStepIndex === 1 && onOpenTotem && (
            <button
              type="button"
              onClick={() => {
                onOpenTotem();
                handleNext();
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span>Ver QR Code do Totem Agora</span>
            </button>
          )}

          {currentStepIndex === 2 && onTriggerCamera && (
            <button
              type="button"
              onClick={() => {
                handleNext();
                onTriggerCamera();
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-700" />
              <span>Testar Abertura da Câmera</span>
            </button>
          )}

          {isLastStep && onSimulateCheckin && !isCheckedIn && (
            <button
              type="button"
              onClick={() => {
                handleComplete();
                onSimulateCheckin();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simular Check-in Agora (+20 Pontos)</span>
            </button>
          )}

          {/* Progress Indicators & Navigation Controls */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-[#147A80]'
                      : idx < currentStepIndex
                      ? 'w-2 bg-teal-300'
                      : 'w-2 bg-gray-200'
                  }`}
                  aria-label={`Ir para passo ${idx + 1}`}
                />
              ))}
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <span>{isLastStep ? 'Concluir Tutorial' : 'Próximo'}</span>
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
