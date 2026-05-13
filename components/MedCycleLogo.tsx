import React from 'react';

interface MedCycleLogoProps {
  size?: number;
  className?: string;
}

export default function MedCycleLogo({ size = 40, className = '' }: MedCycleLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ── Outer blue arc arrow (top-left, clockwise) ── */}
      <path
        d="M 50 8 A 42 42 0 0 1 88 38"
        stroke="#1a6bb5"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Blue arrowhead (top-right) */}
      <polygon
        points="90,28 95,42 80,38"
        fill="#1a6bb5"
      />

      {/* ── Outer green arc arrow (bottom-right, clockwise) ── */}
      <path
        d="M 88 62 A 42 42 0 0 1 12 62"
        stroke="#3aaa35"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Green arrowhead (bottom-left) */}
      <polygon
        points="10,72 5,58 20,62"
        fill="#3aaa35"
      />

      {/* ── Left blue arc (completing circle top-left) ── */}
      <path
        d="M 12 38 A 42 42 0 0 1 50 8"
        stroke="#1a6bb5"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Left hand (blue) ── */}
      <g transform="translate(26, 44)">
        {/* Palm */}
        <ellipse cx="11" cy="18" rx="9" ry="7" fill="#1a6bb5" opacity="0.9" />
        {/* Fingers */}
        <rect x="4" y="6" width="3.5" height="13" rx="1.8" fill="#1a6bb5" opacity="0.9" />
        <rect x="8" y="4" width="3.5" height="15" rx="1.8" fill="#1a6bb5" opacity="0.9" />
        <rect x="12" y="4" width="3.5" height="15" rx="1.8" fill="#1a6bb5" opacity="0.9" />
        <rect x="16" y="6" width="3.5" height="13" rx="1.8" fill="#1a6bb5" opacity="0.9" />
        {/* Thumb */}
        <ellipse cx="2.5" cy="14" rx="2.5" ry="4" fill="#1a6bb5" opacity="0.9" />
      </g>

      {/* ── Right hand (green) ── */}
      <g transform="translate(46, 44)" style={{ transform: 'translate(46px, 44px) scaleX(-1)', transformOrigin: '12px 0' }}>
        {/* Palm */}
        <ellipse cx="11" cy="18" rx="9" ry="7" fill="#3aaa35" opacity="0.9" />
        {/* Fingers */}
        <rect x="4" y="6" width="3.5" height="13" rx="1.8" fill="#3aaa35" opacity="0.9" />
        <rect x="8" y="4" width="3.5" height="15" rx="1.8" fill="#3aaa35" opacity="0.9" />
        <rect x="12" y="4" width="3.5" height="15" rx="1.8" fill="#3aaa35" opacity="0.9" />
        <rect x="16" y="6" width="3.5" height="13" rx="1.8" fill="#3aaa35" opacity="0.9" />
        {/* Thumb */}
        <ellipse cx="21.5" cy="14" rx="2.5" ry="4" fill="#3aaa35" opacity="0.9" />
      </g>

      {/* ── Medical cross (centre) ── */}
      <rect x="44" y="32" width="12" height="22" rx="2.5" fill="#1a6bb5" />
      <rect x="38" y="38" width="24" height="10" rx="2.5" fill="#1a6bb5" />
      {/* Green overlay cross highlight */}
      <rect x="46" y="34" width="8" height="18" rx="2" fill="#3aaa35" opacity="0.5" />
      <rect x="40" y="40" width="20" height="6" rx="2" fill="#3aaa35" opacity="0.5" />

      {/* ── Small icon: stethoscope (left inner) ── */}
      <g transform="translate(18, 34)" opacity="0.85">
        <circle cx="4" cy="4" r="3.5" stroke="#1a6bb5" strokeWidth="1.5" fill="none" />
        <path d="M4 7.5 Q4 13 9 13" stroke="#1a6bb5" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="9" cy="13" r="2" fill="#1a6bb5" />
      </g>

      {/* ── Small icon: wheelchair (left inner bottom) ── */}
      <g transform="translate(20, 54)" opacity="0.85">
        <circle cx="4" cy="2" r="2" fill="#1a6bb5" />
        <path d="M4 4 L4 10 L9 10" stroke="#1a6bb5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="14" r="2.5" stroke="#1a6bb5" strokeWidth="1.5" fill="none" />
        <circle cx="10" cy="14" r="2.5" stroke="#1a6bb5" strokeWidth="1.5" fill="none" />
      </g>

      {/* ── Small icon: pills (right inner) ── */}
      <g transform="translate(64, 34)" opacity="0.85">
        <rect x="0" y="0" width="12" height="6" rx="3" fill="#3aaa35" />
        <rect x="6" y="0" width="6" height="6" rx="3" fill="#1a6bb5" />
        <rect x="0" y="8" width="12" height="6" rx="3" fill="#3aaa35" opacity="0.7" />
      </g>

      {/* ── Small icon: hospital bed (right inner bottom) ── */}
      <g transform="translate(62, 54)" opacity="0.85">
        <rect x="0" y="4" width="16" height="6" rx="1" fill="#3aaa35" />
        <rect x="0" y="2" width="6" height="8" rx="1" fill="#3aaa35" opacity="0.6" />
        <circle cx="3" cy="1" r="2" fill="#3aaa35" />
        <rect x="1" y="10" width="2" height="4" rx="1" fill="#3aaa35" />
        <rect x="13" y="10" width="2" height="4" rx="1" fill="#3aaa35" />
        {/* small cross on bed */}
        <rect x="8" y="5" width="4" height="1.5" rx="0.5" fill="white" />
        <rect x="9.25" y="4" width="1.5" height="4" rx="0.5" fill="white" />
      </g>

      {/* ── Bottom icons: heart (left of bottom arrow) ── */}
      <g transform="translate(34, 78)" opacity="0.9">
        <path d="M6 2 C6 0 4 -1 2.5 1 C1 -1 -1 0 -1 2 C-1 4 6 9 6 9 C6 9 13 4 13 2 C13 0 11 -1 9.5 1 C8 -1 6 0 6 2Z"
          fill="#1a6bb5" />
      </g>

      {/* ── Bottom icons: recycle (right of bottom arrow) ── */}
      <g transform="translate(52, 77)" opacity="0.9">
        <path d="M7 1 L9.5 5 L4.5 5 Z" fill="#3aaa35" />
        <path d="M11 6 L9 10 L13 10 Z" fill="#3aaa35" transform="rotate(120 10 8)" />
        <path d="M3 6 L1 10 L5 10 Z" fill="#3aaa35" transform="rotate(240 5 8)" />
        <circle cx="7" cy="7" r="2.5" fill="none" stroke="#3aaa35" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
