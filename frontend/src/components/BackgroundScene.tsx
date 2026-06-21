export function BackgroundScene() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="scene-mesh scene-mesh-shift absolute inset-0" />

      {/* primary aurora */}
      <div className="aurora aurora-a absolute -top-[35%] left-1/2 h-[75vh] w-[95vw] -translate-x-1/2 rounded-full bg-violet-700/10 blur-[130px]" />
      <div className="aurora aurora-b absolute top-[20%] -right-[10%] h-[50vh] w-[50vw] rounded-full bg-indigo-900/10 blur-[100px]" />
      <div className="aurora aurora-c absolute -bottom-[20%] -left-[10%] h-[45vh] w-[45vw] rounded-full bg-violet-950/15 blur-[110px]" />

      {/* architectural arcs */}
      <svg className="arc arc-1 absolute left-1/2 top-[8%] h-[520px] w-[520px] -translate-x-1/2 opacity-[0.07]" viewBox="0 0 520 520" fill="none">
        <circle cx="260" cy="260" r="240" stroke="url(#arcGrad)" strokeWidth="1" strokeDasharray="4 12" />
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="520" y2="520">
            <stop stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg className="arc arc-2 absolute right-[5%] top-[30%] h-64 w-64 opacity-[0.05]" viewBox="0 0 256 256" fill="none">
        <path d="M128 16a112 112 0 0 1 0 224" stroke="#C4B5FD" strokeWidth="1" strokeDasharray="2 8" />
      </svg>

      <svg className="arc arc-3 absolute bottom-[15%] left-[8%] h-48 w-48 opacity-[0.06]" viewBox="0 0 200 200" fill="none">
        <rect x="40" y="40" width="120" height="120" rx="24" stroke="#A78BFA" strokeWidth="0.75" transform="rotate(12 100 100)" />
      </svg>

      {/* light beams */}
      <div className="beam beam-1 absolute -left-1/4 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-violet-500/4 to-transparent" />
      <div className="beam beam-2 absolute -right-1/4 top-0 h-full w-1/2 -rotate-12 bg-gradient-to-l from-transparent via-indigo-400/3 to-transparent" />

      <div className="scene-grid scene-grid-drift absolute inset-0" />
      <div className="scene-grain absolute inset-0" />

      {/* horizon line */}
      <div className="horizon-glow absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
