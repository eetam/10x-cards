"use client";

/**
 * Beautiful SVG illustration for dashboard hero section
 * Represents learning, flashcards, and AI-powered education
 */
export function DashboardIllustration() {
  return (
    <div className="relative w-full max-w-xs mx-auto mb-3">
      <style>
        {`
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes gentle-rotate {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-gentle-pulse {
          animation: gentle-pulse 3s ease-in-out infinite;
          transform-origin: center center;
          transform-box: fill-box;
        }
        .animate-gentle-rotate {
          animation: gentle-rotate 4s ease-in-out infinite;
          transform-origin: center center;
          transform-box: fill-box;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}
      </style>
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl overflow-visible"
        style={{ overflow: "visible" }}
      >
        {/* Background gradient circles - positioned to not overlap with cards */}
        <circle cx="320" cy="150" r="100" fill="url(#gradient1)" opacity="0.1" className="animate-pulse" />
        <circle cx="80" cy="200" r="70" fill="url(#gradient2)" opacity="0.15" className="animate-pulse" />

        {/* Flashcard stack */}
        <g transform="translate(120, 90)" className="animate-gentle-pulse">
          {/* Card 3 (back) */}
          <rect
            x="20"
            y="20"
            width="140"
            height="100"
            rx="16"
            fill="#9333ea"
            opacity="0.3"
            transform="rotate(-5 90 70)"
          />
          {/* Card 2 (middle) */}
          <rect
            x="10"
            y="10"
            width="140"
            height="100"
            rx="16"
            fill="#2563eb"
            opacity="0.5"
            transform="rotate(2 80 60)"
          />
          {/* Card 1 (front) */}
          <rect x="0" y="0" width="140" height="100" rx="16" fill="url(#cardGradient)" className="drop-shadow-lg" />

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

        {/* Floating sparkles */}
        <g>
          <circle cx="80" cy="60" r="3" fill="#F59E0B" opacity="0.6" className="animate-sparkle" />
          <circle
            cx="320"
            cy="180"
            r="4"
            fill="#9333ea"
            opacity="0.5"
            className="animate-sparkle"
            style={{ animationDelay: "0.5s" }}
          />
          <circle
            cx="150"
            cy="220"
            r="2.5"
            fill="#ec4899"
            opacity="0.7"
            className="animate-sparkle"
            style={{ animationDelay: "1s" }}
          />
          <circle
            cx="280"
            cy="70"
            r="3.5"
            fill="#2563eb"
            opacity="0.6"
            className="animate-sparkle"
            style={{ animationDelay: "1.5s" }}
          />
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
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="bookGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
