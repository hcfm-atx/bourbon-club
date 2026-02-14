export function PourLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width="60"
        height="80"
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Glass outline */}
        <path
          d="M15 20 L15 70 Q15 75 20 75 L40 75 Q45 75 45 70 L45 20 L15 20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-muted-foreground/40"
        />

        {/* Base */}
        <rect
          x="10"
          y="75"
          width="40"
          height="3"
          rx="1"
          className="fill-muted-foreground/40"
        />

        {/* Liquid fill - animated */}
        <defs>
          <clipPath id="glassClip">
            <path d="M15 20 L15 70 Q15 75 20 75 L40 75 Q45 75 45 70 L45 20 L15 20 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#glassClip)">
          <rect
            x="15"
            y="20"
            width="30"
            height="55"
            className="fill-amber-600 liquid-fill"
            style={{
              transformOrigin: "center bottom",
            }}
          />

          {/* Highlight/shimmer effect */}
          <ellipse
            cx="25"
            cy="45"
            rx="8"
            ry="3"
            className="fill-amber-400/40"
            style={{
              animation: "shimmer 2s ease-in-out infinite alternate",
            }}
          />
        </g>
      </svg>

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
