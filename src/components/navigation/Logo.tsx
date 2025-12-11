export function Logo() {
  return (
    <a
      href="/"
      className="flex items-center gap-2 group transition-opacity hover:opacity-80"
      aria-label="Powrót do strony głównej"
    >
      <svg
        viewBox="0 0 160 32"
        className="h-8 md:h-10 w-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        {/* Card stack - 3 cards with offset */}
        {/* Back card */}
        <rect
          x="4"
          y="10"
          width="24"
          height="16"
          rx="3"
          fill="url(#logo-gradient)"
          opacity="0.3"
        />

        {/* Middle card */}
        <rect
          x="2"
          y="8"
          width="24"
          height="16"
          rx="3"
          fill="url(#logo-gradient)"
          opacity="0.6"
        />

        {/* Front card */}
        <rect
          x="0"
          y="6"
          width="24"
          height="16"
          rx="3"
          fill="url(#logo-gradient)"
          className="group-hover:brightness-110 transition-all"
        />

        {/* "10x" text on front card */}
        <text
          x="12"
          y="17"
          fontSize="10"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          10x
        </text>

        {/* "Cards" brand text */}
        <text
          x="32"
          y="16"
          fontSize="18"
          fontWeight="600"
          fill="url(#logo-gradient)"
          dominantBaseline="middle"
        >
          Cards
        </text>
      </svg>
    </a>
  );
}
