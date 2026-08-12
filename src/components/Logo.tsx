import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  showBackground?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  showBackground = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          {/* Main 'A' Frame Gradient */}
          <linearGradient id="logoAGradient" x1="0%" y1="100%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="30%" stopColor="#3b82f6" />
            <stop offset="70%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>

          {/* Equalizer Spectrum Gradient */}
          <linearGradient id="logoEqGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="25%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="75%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Squircle */}
        {showBackground && (
          <rect
            x="8"
            y="8"
            width="496"
            height="496"
            rx="120"
            fill="#0d0e12"
            stroke="#1e2029"
            strokeWidth="4"
          />
        )}

        {/* Outer 'A' Chevron Frame */}
        <path
          d="M 256 100 L 378 350 H 338 L 256 182 L 174 350 H 134 L 256 100 Z"
          fill="url(#logoAGradient)"
        />

        {/* Outer Legs Accent */}
        <path
          d="M 256 100 L 134 350 H 174 L 256 182 L 338 350 H 378 L 256 100 Z"
          fill="url(#logoAGradient)"
        />

        {/* Interior Equalizer Soundwave Spectrum Bars */}
        {/* Bar 1 (Leftmost) */}
        <rect x="180" y="285" width="12" height="40" rx="6" fill="#00f0ff" />
        
        {/* Bar 2 */}
        <rect x="200" y="255" width="12" height="70" rx="6" fill="#00d8ff" />
        
        {/* Bar 3 */}
        <rect x="220" y="225" width="12" height="100" rx="6" fill="#38bdf8" />
        
        {/* Bar 4 (Center Highest) */}
        <rect x="240" y="185" width="12" height="140" rx="6" fill="#3b82f6" />
        
        {/* Bar 5 */}
        <rect x="260" y="210" width="12" height="115" rx="6" fill="#6366f1" />
        
        {/* Bar 6 */}
        <rect x="280" y="240" width="12" height="85" rx="6" fill="#a855f7" />
        
        {/* Bar 7 */}
        <rect x="300" y="265" width="12" height="60" rx="6" fill="#c084fc" />

        {/* Bar 8 (Rightmost) */}
        <rect x="320" y="285" width="12" height="40" rx="6" fill="#e879f9" />
      </svg>
    </div>
  );
};
