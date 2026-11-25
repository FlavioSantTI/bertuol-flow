import React from 'react';

interface BertuolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mode?: 'full' | 'horizontal' | 'icon' | 'badge';
  variant?: 'light' | 'dark' | 'monochrome';
  showFlowTag?: boolean;
}

export const BertuolLogo: React.FC<BertuolLogoProps> = ({
  className = '',
  size = 'md',
  mode = 'horizontal',
  variant = 'light',
  showFlowTag = true,
}) => {
  // Official Palette from brand identity XML
  const TURQUOISE = '#4BBCBE'; // RGB(75, 188, 194) / C71 M11 Y33 K0
  const GOLD_YELLOW = '#FFCC29'; // RGB(255, 204, 41)
  const DARK_SLATE = variant === 'dark' ? '#F8FAFC' : '#333A3F';
  const TEAL_TEXT = variant === 'dark' ? '#5FE2E4' : '#14A5AC';

  const sizeMap = {
    xs: { iconH: 22, textH: 'text-xs', subH: 'text-[7px]', flowH: 'text-[9px]' },
    sm: { iconH: 28, textH: 'text-sm', subH: 'text-[8px]', flowH: 'text-[11px]' },
    md: { iconH: 36, textH: 'text-base', subH: 'text-[9px]', flowH: 'text-xs' },
    lg: { iconH: 48, textH: 'text-xl', subH: 'text-[11px]', flowH: 'text-sm' },
    xl: { iconH: 64, textH: 'text-2xl', subH: 'text-xs', flowH: 'text-base' },
  };

  const { iconH, textH, subH, flowH } = sizeMap[size];

  // SVG Symbol: The iconic 'b' with smile curve
  const renderSymbol = () => (
    <svg
      height={iconH}
      viewBox="0 0 110 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-2xs"
    >
      {/* Base Smile Curve (Yellow Arc) */}
      <path
        d="M 12 88 C 30 110, 80 112, 102 88 C 88 104, 32 104, 12 88 Z"
        fill={GOLD_YELLOW}
      />

      {/* Right Yellow Circle / Curve */}
      <path
        d="M 46 45 C 75 45, 96 64, 96 82 C 96 99, 74 105, 46 105 Z"
        fill={GOLD_YELLOW}
      />

      {/* Inner Yellow Cutout Accent */}
      <rect x="52" y="70" width="22" height="7" rx="3.5" fill="#FFFFFF" />

      {/* Left Teal Stem & Tooth Shape */}
      <path
        d="M 22 10 C 29 10, 36 17, 36 24 L 36 78 C 36 94, 52 105, 68 105 C 44 105, 20 94, 20 74 L 20 24 C 20 17, 25 10, 22 10 Z"
        fill={TURQUOISE}
      />
      <rect x="20" y="10" width="16" height="74" rx="8" fill={TURQUOISE} />

      {/* Teal bottom connector loop */}
      <path
        d="M 20 62 C 20 86, 38 105, 62 105 C 48 105, 20 95, 20 62 Z"
        fill={TURQUOISE}
      />
    </svg>
  );

  if (mode === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderSymbol()}</div>;
  }

  if (mode === 'full') {
    return (
      <div className={`flex flex-col items-center text-center gap-1.5 ${className}`}>
        {renderSymbol()}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-none ${textH}`}
              style={{ color: TEAL_TEXT, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              bertuol
            </span>
            {showFlowTag && (
              <span
                className={`font-black italic px-2 py-0.5 rounded-lg bg-linear-to-r from-[#FFCC29] to-[#ffb800] text-[#7A5500] leading-none ${flowH} shadow-2xs`}
              >
                FLOW
              </span>
            )}
          </div>
          <span
            className={`font-bold uppercase tracking-[0.22em] mt-1.5 ${subH}`}
            style={{ color: DARK_SLATE }}
          >
            ODONTOLOGIA AVANÇADA
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal lockup
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderSymbol()}
      <div className="flex flex-col leading-none select-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-extrabold tracking-tight ${textH}`}
            style={{ color: TEAL_TEXT, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            bertuol
          </span>
          {showFlowTag && (
            <span
              className={`font-extrabold italic px-1.5 py-0.5 rounded-md bg-linear-to-r from-[#FFCC29] to-[#ffb800] text-[#7A5500] leading-none ${flowH} shadow-2xs`}
            >
              FLOW
            </span>
          )}
        </div>
        <span
          className={`font-bold uppercase tracking-[0.18em] mt-0.5 ${subH}`}
          style={{ color: DARK_SLATE }}
        >
          ODONTOLOGIA AVANÇADA
        </span>
      </div>
    </div>
  );
};
