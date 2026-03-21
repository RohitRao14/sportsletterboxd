"use client";

export function StadiumBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">

      {/* Sky background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #040810 0%, #060d18 50%, #071020 100%)"
      }} />

      {/* ── LEFT POLE ── */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>

        {/* Pole */}
        <rect x="18%" y="35%" width="0.5%" height="65%" fill="#1a2030" />

        {/* Light cluster housing */}
        <rect x="16.5%" y="32%" width="3.5%" height="3%" rx="3" fill="#1e2840" />

        {/* Light bulbs on left pole */}
        {[17, 18.2, 19.3].map((x, i) => (
          <g key={i}>
            <circle cx={`${x}%`} cy="33%" r="0.6%" fill="white" opacity="0.95" />
            <circle cx={`${x}%`} cy="33%" r="1.2%" fill="rgba(255,230,120,0.5)" />
            <circle cx={`${x}%`} cy="33%" r="2.5%" fill="rgba(255,210,80,0.2)" />
          </g>
        ))}

        {/* Left halo glow */}
        <ellipse cx="18.5%" cy="33%" rx="8%" ry="5%" fill="rgba(255,220,80,0.18)" />
        <ellipse cx="18.5%" cy="33%" rx="4%" ry="2.5%" fill="rgba(255,235,140,0.25)" />

        {/* Left wide beam */}
        <defs>
          <linearGradient id="leftBeam1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,220,80,0.35)" />
            <stop offset="40%" stopColor="rgba(255,210,60,0.12)" />
            <stop offset="100%" stopColor="rgba(255,200,40,0.03)" />
          </linearGradient>
          <linearGradient id="leftBeam2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,240,160,0.55)" />
            <stop offset="30%" stopColor="rgba(255,220,100,0.2)" />
            <stop offset="100%" stopColor="rgba(255,200,60,0.0)" />
          </linearGradient>
          <linearGradient id="rightBeam1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,220,80,0.35)" />
            <stop offset="40%" stopColor="rgba(255,210,60,0.12)" />
            <stop offset="100%" stopColor="rgba(255,200,40,0.03)" />
          </linearGradient>
          <linearGradient id="rightBeam2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,240,160,0.55)" />
            <stop offset="30%" stopColor="rgba(255,220,100,0.2)" />
            <stop offset="100%" stopColor="rgba(255,200,60,0.0)" />
          </linearGradient>
          <filter id="haze">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="softBeam">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Left beam — wide cone (hazy) */}
        <polygon
          points="18.5%,33% 5%,100% 75%,100%"
          fill="url(#leftBeam1)"
          filter="url(#haze)"
          style={{ animation: "beamPulse 7s ease-in-out infinite" }}
        />
        {/* Left beam — bright core */}
        <polygon
          points="18.5%,33% 12%,100% 55%,100%"
          fill="url(#leftBeam2)"
          filter="url(#softBeam)"
          style={{ animation: "beamPulse 7s ease-in-out infinite 0.5s" }}
        />

        {/* ── RIGHT POLE ── */}
        {/* Pole */}
        <rect x="81.5%" y="35%" width="0.5%" height="65%" fill="#1a2030" />

        {/* Light cluster housing */}
        <rect x="80%" y="32%" width="3.5%" height="3%" rx="3" fill="#1e2840" />

        {/* Light bulbs on right pole */}
        {[80.7, 81.8, 83].map((x, i) => (
          <g key={i}>
            <circle cx={`${x}%`} cy="33%" r="0.6%" fill="white" opacity="0.95" />
            <circle cx={`${x}%`} cy="33%" r="1.2%" fill="rgba(255,230,120,0.5)" />
            <circle cx={`${x}%`} cy="33%" r="2.5%" fill="rgba(255,210,80,0.2)" />
          </g>
        ))}

        {/* Right halo glow */}
        <ellipse cx="81.5%" cy="33%" rx="8%" ry="5%" fill="rgba(255,220,80,0.18)" />
        <ellipse cx="81.5%" cy="33%" rx="4%" ry="2.5%" fill="rgba(255,235,140,0.25)" />

        {/* Right beam — wide cone (hazy) */}
        <polygon
          points="81.5%,33% 25%,100% 95%,100%"
          fill="url(#rightBeam1)"
          filter="url(#haze)"
          style={{ animation: "beamPulse 7s ease-in-out infinite 1s" }}
        />
        {/* Right beam — bright core */}
        <polygon
          points="81.5%,33% 45%,100% 88%,100%"
          fill="url(#rightBeam2)"
          filter="url(#softBeam)"
          style={{ animation: "beamPulse 7s ease-in-out infinite 1.5s" }}
        />

        {/* Mist/atmosphere in beam area */}
        <ellipse cx="50%" cy="75%" rx="45%" ry="15%" fill="rgba(200,220,255,0.04)" filter="url(#haze)" />
        <ellipse cx="50%" cy="85%" rx="50%" ry="10%" fill="rgba(200,220,255,0.03)" filter="url(#haze)" />

      </svg>

      {/* Green grass glow at bottom */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: "35%",
        background: "radial-gradient(ellipse 90% 80% at 50% 100%, rgba(30,110,40,0.45) 0%, rgba(15,60,20,0.2) 50%, transparent 100%)"
      }} />

      {/* Overall atmosphere haze */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,210,80,0.04) 0%, transparent 70%)"
      }} />

      {/* Grain */}
      <div className="absolute inset-0" style={{
        opacity: 0.35,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
        backgroundSize: "180px 180px"
      }} />

      <style>{`
        @keyframes beamPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
