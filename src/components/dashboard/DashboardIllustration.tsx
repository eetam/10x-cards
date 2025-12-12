"use client";

/**
 * Beautiful SVG illustration for dashboard hero section
 * Represents learning, flashcards, and AI-powered education
 */
export function DashboardIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto mb-8">
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
      >
        {/* Background gradient circles */}
        <circle cx="200" cy="150" r="120" fill="url(#gradient1)" opacity="0.1" />
        <circle cx="220" cy="130" r="80" fill="url(#gradient2)" opacity="0.15" />

        {/* Flashcard stack */}
        <g transform="translate(120, 80)">
          {/* Card 3 (back) */}
          <rect
            x="20"
            y="20"
            width="140"
            height="100"
            rx="8"
            fill="#8B5CF6"
            opacity="0.3"
            transform="rotate(-5 90 70)"
          />
          {/* Card 2 (middle) */}
          <rect
            x="10"
            y="10"
            width="140"
            height="100"
            rx="8"
            fill="#6366F1"
            opacity="0.5"
            transform="rotate(2 80 60)"
          />
          {/* Card 1 (front) */}
          <rect x="0" y="0" width="140" height="100" rx="8" fill="url(#cardGradient)" className="drop-shadow-lg" />

          {/* Card content lines */}
          <rect x="15" y="20" width="80" height="6" rx="3" fill="white" opacity="0.9" />
          <rect x="15" y="35" width="110" height="4" rx="2" fill="white" opacity="0.7" />
          <rect x="15" y="45" width="95" height="4" rx="2" fill="white" opacity="0.7" />

          {/* AI sparkle icon on card */}
          <g transform="translate(100, 65)">
            <circle cx="0" cy="0" r="12" fill="white" opacity="0.2" />
            <path d="M-6 0 L-2 -2 L0 -6 L2 -2 L6 0 L2 2 L0 6 L-2 2 Z" fill="#F59E0B" className="animate-pulse" />
          </g>
        </g>

        {/* Brain icon */}
        <g transform="translate(300, 100)">
          <circle cx="0" cy="0" r="30" fill="url(#brainGradient)" opacity="0.2" />
          <path
            d="M-15,-10 Q-20,-15 -15,-20 Q-10,-22 -5,-20 Q0,-25 5,-20 Q10,-22 15,-20 Q20,-15 15,-10 Q18,-5 15,0 Q20,5 15,10 Q10,12 5,10 Q0,15 -5,10 Q-10,12 -15,10 Q-20,5 -15,0 Q-18,-5 -15,-10 Z"
            fill="#EC4899"
            opacity="0.8"
          />
          <circle cx="-5" cy="-5" r="2" fill="white" opacity="0.6" />
          <circle cx="5" cy="5" r="2" fill="white" opacity="0.6" />
        </g>

        {/* Floating sparkles */}
        <g className="animate-pulse" style={{ animationDuration: "2s" }}>
          <circle cx="80" cy="60" r="3" fill="#F59E0B" opacity="0.6" />
          <circle cx="320" cy="180" r="4" fill="#8B5CF6" opacity="0.5" />
          <circle cx="150" cy="220" r="2.5" fill="#EC4899" opacity="0.7" />
          <circle cx="280" cy="70" r="3.5" fill="#3B82F6" opacity="0.6" />
        </g>

        {/* Book icon */}
        <g transform="translate(60, 180)">
          <rect x="0" y="0" width="40" height="50" rx="4" fill="url(#bookGradient)" opacity="0.9" />
          <rect x="19" y="0" width="2" height="50" fill="white" opacity="0.3" />
          <rect x="5" y="15" width="12" height="2" rx="1" fill="white" opacity="0.6" />
          <rect x="5" y="22" width="10" height="2" rx="1" fill="white" opacity="0.6" />
          <rect x="23" y="15" width="12" height="2" rx="1" fill="white" opacity="0.6" />
          <rect x="23" y="22" width="10" height="2" rx="1" fill="white" opacity="0.6" />
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="bookGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
