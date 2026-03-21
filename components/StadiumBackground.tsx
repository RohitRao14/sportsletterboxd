"use client";

export function StadiumBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#060a0d]" />

      {/* Pitch green glow at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-64"
        style={{ background: "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(20,80,30,0.3) 0%, transparent 70%)" }} />

      {/* ── Left floodlight tower ── */}
      {/* Light source halo */}
      <div className="absolute top-0 left-[8%] w-6 h-6 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,240,180,1) 0%, rgba(255,220,100,0.6) 40%, transparent 70%)", boxShadow: "0 0 40px 20px rgba(255,220,100,0.4), 0 0 80px 40px rgba(255,200,80,0.15)", animation: "flicker 6s ease-in-out infinite" }} />

      {/* Left beam 1 — main wide cone */}
      <svg className="absolute top-0 left-0 w-1/2 h-full" style={{ animation: "beamPulse 8s ease-in-out infinite" }}>
        <defs>
          <linearGradient id="beam-l1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,230,120,0.18)" />
            <stop offset="60%" stopColor="rgba(255,220,100,0.04)" />
            <stop offset="100%" stopColor="rgba(255,220,100,0)" />
          </linearGradient>
        </defs>
        <polygon points="13%,0 8%,0 85%,100% 100%,100%" fill="url(#beam-l1)" />
      </svg>

      {/* Left beam 2 — narrow inner beam */}
      <svg className="absolute top-0 left-0 w-1/2 h-full" style={{ animation: "beamPulse 8s ease-in-out infinite 1s" }}>
        <defs>
          <linearGradient id="beam-l2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,245,200,0.25)" />
            <stop offset="40%" stopColor="rgba(255,235,150,0.08)" />
            <stop offset="100%" stopColor="rgba(255,235,150,0)" />
          </linearGradient>
        </defs>
        <polygon points="10%,0 6%,0 55%,100% 70%,100%" fill="url(#beam-l2)" />
      </svg>

      {/* ── Right floodlight tower ── */}
      {/* Light source halo */}
      <div className="absolute top-0 right-[8%] w-6 h-6 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,240,180,1) 0%, rgba(255,220,100,0.6) 40%, transparent 70%)", boxShadow: "0 0 40px 20px rgba(255,220,100,0.4), 0 0 80px 40px rgba(255,200,80,0.15)", animation: "flicker 6s ease-in-out infinite 2s" }} />

      {/* Right beam 1 — main wide cone */}
      <svg className="absolute top-0 right-0 w-1/2 h-full" style={{ animation: "beamPulse 8s ease-in-out infinite 0.5s" }}>
        <defs>
          <linearGradient id="beam-r1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,230,120,0.18)" />
            <stop offset="60%" stopColor="rgba(255,220,100,0.04)" />
            <stop offset="100%" stopColor="rgba(255,220,100,0)" />
          </linearGradient>
        </defs>
        <polygon points="87%,0 92%,0 15%,100% 0%,100%" fill="url(#beam-r1)" />
      </svg>

      {/* Right beam 2 — narrow inner beam */}
      <svg className="absolute top-0 right-0 w-1/2 h-full" style={{ animation: "beamPulse 8s ease-in-out infinite 1.5s" }}>
        <defs>
          <linearGradient id="beam-r2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,245,200,0.25)" />
            <stop offset="40%" stopColor="rgba(255,235,150,0.08)" />
            <stop offset="100%" stopColor="rgba(255,235,150,0)" />
          </linearGradient>
        </defs>
        <polygon points="90%,0 94%,0 45%,100% 30%,100%" fill="url(#beam-r2)" />
      </svg>

      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-40"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "200px 200px" }} />

      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          45% { opacity: 0.92; }
          50% { opacity: 0.98; }
          55% { opacity: 0.88; }
          60% { opacity: 1; }
          80% { opacity: 0.95; }
        }
        @keyframes beamPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
