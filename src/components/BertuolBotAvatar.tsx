import React from 'react';

export type BotMood = 'alert' | 'idle' | 'happy' | 'compact';

interface BertuolBotAvatarProps {
  mood?: BotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRadarWaves?: boolean;
}

export const BertuolBotAvatar: React.FC<BertuolBotAvatarProps> = ({
  mood = 'alert',
  size = 'md',
  className = '',
  showRadarWaves = true,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const isAlert = mood === 'alert';
  const isHappy = mood === 'happy';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Animated Radar Pulse Waves (Gold & Teal glow) */}
      {isAlert && showRadarWaves && (
        <>
          <span className="absolute -inset-1.5 rounded-full bg-amber-400/50 animate-ping opacity-85" />
          <span className="absolute -inset-3 rounded-full bg-amber-500/30 animate-pulse delay-150" />
        </>
      )}

      {/* Futuristic Animated SVG Bertuol Bot com Bordas Douradas Bertuol */}
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full drop-shadow-[0_4px_8px_rgba(217,119,6,0.35)] select-none ${
          isAlert ? 'animate-[bounce_1.5s_infinite]' : isHappy ? 'animate-[pulse_1s_infinite]' : 'animate-[bounce_3s_infinite]'
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Bertuol Signature Gold Gradient for Luxury Borders */}
          <linearGradient id="botGoldBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="55%" stopColor="#D97706" />
            <stop offset="85%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Visor Bezel Gold Gradient */}
          <linearGradient id="botVisorGold" x1="20" y1="28" x2="80" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Porcelain Body Gradient */}
          <linearGradient id="botPorcelain" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#F8FAFC" />
            <stop offset="1" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Teal Brand Accent */}
          <linearGradient id="botTeal" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1DB4BC" />
            <stop offset="1" stopColor="#147A80" />
          </linearGradient>

          {/* Golden Amber Fill Accent */}
          <linearGradient id="botAmber" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>

          {/* Dark OLED Visor */}
          <linearGradient id="botVisor" x1="20" y1="35" x2="80" y2="65" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B2527" />
            <stop offset="1" stopColor="#021213" />
          </linearGradient>

          {/* Glowing Eyes */}
          <radialGradient id="eyeGlow" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="80%" stopColor="#0284C7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="eyeGlowAmber" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="1" />
            <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- Antenna & Radar Orb (Borda Dourada) --- */}
        <line x1="50" y1="20" x2="50" y2="9" stroke="url(#botGoldBorder)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="8" r="5" fill="url(#botAmber)" stroke="url(#botGoldBorder)" strokeWidth="1.5" className="animate-pulse" />
        {isAlert && (
          <circle cx="50" cy="8" r="8.5" stroke="url(#botGoldBorder)" strokeWidth="1.5" opacity="0.75" className="animate-ping" />
        )}

        {/* --- Ear Pods com Borda Dourada --- */}
        <rect x="13" y="37" width="7" height="19" rx="3.5" fill="url(#botTeal)" stroke="url(#botGoldBorder)" strokeWidth="1.5" />
        <rect x="80" y="37" width="7" height="19" rx="3.5" fill="url(#botTeal)" stroke="url(#botGoldBorder)" strokeWidth="1.5" />

        {/* --- Robot Head com Borda Dourada Bertuol --- */}
        <rect
          x="18"
          y="20"
          width="64"
          height="52"
          rx="22"
          fill="url(#botPorcelain)"
          stroke="url(#botGoldBorder)"
          strokeWidth="2.5"
        />

        {/* Visor Bezel & Glass com Borda Dourada */}
        <rect
          x="24"
          y="29"
          width="52"
          height="34"
          rx="14"
          fill="url(#botVisor)"
          stroke="url(#botVisorGold)"
          strokeWidth="2"
        />

        {/* Visor Glare highlight */}
        <path d="M 28 34 Q 50 31 72 34" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

        {/* --- LED Expressive Eyes --- */}
        {isAlert ? (
          // Alert / Curious Bright Eyes com detalhes dourados
          <>
            <circle cx="39" cy="45" r="6" fill="url(#eyeGlowAmber)" />
            <circle cx="39" cy="45" r="2.5" fill="#FFFFFF" />
            <circle cx="61" cy="45" r="6" fill="url(#eyeGlowAmber)" />
            <circle cx="61" cy="45" r="2.5" fill="#FFFFFF" />
            {/* Cute Alert Smile */}
            <path d="M 44 54 Q 50 58 56 54" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
          </>
        ) : isHappy ? (
          // Happy Eyes
          <>
            <path d="M 34 47 Q 39 40 44 47" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            <path d="M 56 47 Q 61 40 66 47" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            {/* Cheerful Smile */}
            <path d="M 43 53 Q 50 60 57 53" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          // Idle Eyes
          <>
            <circle cx="39" cy="45" r="5" fill="url(#eyeGlow)" />
            <circle cx="39" cy="45" r="2" fill="#FFFFFF" />
            <circle cx="61" cy="45" r="5" fill="url(#eyeGlow)" />
            <circle cx="61" cy="45" r="2" fill="#FFFFFF" />
            {/* Calm mouth bar */}
            <rect x="46" y="54" width="8" height="2" rx="1" fill="#38BDF8" opacity="0.75" />
          </>
        )}

        {/* --- Chest Collar com Borda Dourada e Marca 'b' --- */}
        <path d="M 36 72 L 64 72 L 60 84 L 40 84 Z" fill="url(#botTeal)" stroke="url(#botGoldBorder)" strokeWidth="1.5" opacity="0.95" />
        <circle cx="50" cy="78" r="3.5" fill="url(#botAmber)" stroke="url(#botGoldBorder)" strokeWidth="1" />
        <path d="M 49 76 L 49 80 A 2 2 0 0 0 51 78 A 2 2 0 0 0 49 76" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />

        {/* --- Floating Magnetic Hands com Borda Dourada --- */}
        {isAlert ? (
          <>
            <circle cx="12" cy="58" r="4.5" fill="url(#botPorcelain)" stroke="url(#botGoldBorder)" strokeWidth="1.5" />
            {/* Waving Right Hand com acabamento dourado */}
            <g className="animate-[spin_2s_ease-in-out_infinite] origin-[88px_50px]">
              <circle cx="88" cy="50" r="5.5" fill="url(#botAmber)" stroke="url(#botGoldBorder)" strokeWidth="2" />
              <path d="M 86 45 L 88 41 M 90 45 L 93 42" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </>
        ) : (
          <>
            <circle cx="12" cy="62" r="4.5" fill="url(#botPorcelain)" stroke="url(#botGoldBorder)" strokeWidth="1.5" />
            <circle cx="88" cy="62" r="4.5" fill="url(#botPorcelain)" stroke="url(#botGoldBorder)" strokeWidth="1.5" />
          </>
        )}
      </svg>
    </div>
  );
};
