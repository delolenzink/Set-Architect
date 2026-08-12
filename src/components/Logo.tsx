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
            x="12"
            y="12"
            width="488"
            height="488"
            rx="112"
            fill="#0c0d10"
            stroke="#1c1e26"
            strokeWidth="4"
          />
        )}

        {/* Outer Stylized 'A' Chevron */}
        <path
          d="M 256 102 L 380 350 H 336 L 256 184 L 176 350 H 132 L 256 102 Z"
          fill="url(#logoAGradient)"
        />

        {/* Interior Equalizer Soundwave Spectrum Bars */}
        {/* Bar 1 (Leftmost Cyan) */}
        <rect x="180" y="285" width="12" height="45" rx="6" fill="#00f0ff" />
        
        {/* Bar 2 (Deep Cyan) */}
        <rect x="200" y="252" width="12" height="78" rx="6" fill="#00d8ff" />
        
        {/* Bar 3 (Light Sky Blue) */}
        <rect x="220" y="218" width="12" height="112" rx="6" fill="#0284c7" />
        
        {/* Bar 4 (Royal Electric Blue - Center Peak 1) */}
        <rect x="240" y="178" width="12" height="152" rx="6" fill="#2563eb" />
        
        {/* Bar 5 (Indigo Blue - Center Peak 2) */}
        <rect x="260" y="182" width="12" height="148" rx="6" fill="#4f46e5" />
        
        {/* Bar 6 (Deep Violet) */}
        <rect x="280" y="222" width="12" height="108" rx="6" fill="#7c3aed" />
        
        {/* Bar 7 (Vibrant Purple) */}
        <rect x="300" y="258" width="12" height="72" rx="6" fill="#a855f7" />

        {/* Bar 8 (Rightmost Magenta Pink) */}
        <rect x="320" y="285" width="12" height="45" rx="6" fill="#d946ef" />
      </svg>
    </div>
  );
};
