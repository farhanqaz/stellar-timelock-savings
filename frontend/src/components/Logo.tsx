type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  variant?: "default" | "mark-only";
  className?: string;
};

export function Logo({ size = 32, showWordmark = true, variant = "default", className = "" }: LogoProps) {
  const markOnly = variant === "mark-only" || !showWordmark;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-500 hover:scale-[1.03]">
        <defs>
          <linearGradient id="vault-body" x1="10" y1="8" x2="30" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E4E4E7" />
            <stop offset="1" stopColor="#A1A1AA" />
          </linearGradient>
          <linearGradient id="vault-accent" x1="14" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C4B5FD" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="32" height="32" rx="9" fill="#18181B" stroke="rgb(255 255 255 / 0.08)" strokeWidth="1" />
        <path
          d="M20 9a11 11 0 0 1 0 22"
          stroke="rgb(255 255 255 / 0.12)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <rect x="13" y="15" width="14" height="13" rx="2.5" fill="url(#vault-body)" fillOpacity="0.9" />
        <rect x="14.5" y="17" width="11" height="9" rx="1.5" fill="#09090B" fillOpacity="0.55" />
        <path d="M16.5 15V13.2a3.5 3.5 0 0 1 7 0V15" stroke="url(#vault-accent)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="21.5" r="2.2" fill="url(#vault-accent)" />
      </svg>
      {!markOnly && (
        <div className="flex flex-col">
          <span className="text-[15px] font-medium tracking-[-0.02em] text-zinc-50">Timelock</span>
          <span className="text-[11px] font-normal tracking-[0.04em] text-zinc-500">Savings Protocol</span>
        </div>
      )}
    </div>
  );
}
