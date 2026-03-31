interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  centered?: boolean;
}

const containerStyles = {
  sm: 'gap-2.5',
  md: 'gap-3.5',
  lg: 'gap-4',
} as const;

const markStyles = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
} as const;

const letterStyles = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
} as const;

const titleStyles = {
  sm: 'text-[0.95rem] tracking-[0.34em]',
  md: 'text-[1.05rem] tracking-[0.38em]',
  lg: 'text-[1.65rem] tracking-[0.42em]',
} as const;

const taglineStyles = {
  sm: 'text-[0.54rem] tracking-[0.28em]',
  md: 'text-[0.58rem] tracking-[0.3em]',
  lg: 'text-[0.68rem] tracking-[0.32em]',
} as const;

export function BrandLogo({ size = 'md', showTagline = false, centered = false }: BrandLogoProps) {
  return (
    <div
      className={`inline-flex items-center ${containerStyles[size]} ${
        centered ? 'justify-center text-center' : 'justify-start text-left'
      }`}
    >
      <div className={`relative ${markStyles[size]} shrink-0`}>
        <div className="absolute inset-0 rounded-[30%] bg-gradient-to-br from-slate-950 via-violet-700 to-amber-300 shadow-[0_18px_40px_-18px_rgba(76,29,149,0.6)]" />
        <div className="absolute inset-[2px] rounded-[28%] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),rgba(255,255,255,0.18)_36%,transparent_37%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(109,40,217,0.92)_58%,rgba(251,191,36,0.92))]" />
        <div className="absolute inset-[7%] rounded-[26%] ring-1 ring-white/25" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-serif ${letterStyles[size]} font-semibold text-white drop-shadow-sm`}>O</span>
        </div>
        <div className="absolute right-[18%] top-[18%] h-[18%] w-[18%] rounded-full bg-white/80 blur-[1px]" />
      </div>

      <div className={`flex flex-col ${centered ? 'items-center' : 'items-start'} leading-none`}>
        <span
          className={`bg-gradient-to-r from-slate-950 via-violet-800 to-amber-500 bg-clip-text font-semibold uppercase text-transparent ${titleStyles[size]}`}
        >
          OROSOCIAL
        </span>
        {showTagline && (
          <span className={`mt-2 uppercase text-neutral-500 ${taglineStyles[size]}`}>Elegant social living</span>
        )}
      </div>
    </div>
  );
}
