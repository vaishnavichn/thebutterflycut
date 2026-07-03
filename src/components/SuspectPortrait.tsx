import React from 'react';

interface SuspectPortraitProps {
  suspectId: string;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SuspectPortrait({
  suspectId,
  isActive = false,
  size = 'md',
  className = ''
}: SuspectPortraitProps) {
  const normalizedId = suspectId.toLowerCase();

  // Color theme based on suspect and active state
  let glowColor = 'rgba(255, 176, 0, 0.4)'; // Amber (default)
  let outlineColor = '#FFB000';
  let fillColor = '#141414';

  if (normalizedId === 'curator') {
    glowColor = isActive ? 'rgba(168, 85, 247, 0.6)' : 'rgba(168, 85, 247, 0.2)'; // Purple
    outlineColor = isActive ? '#a855f7' : '#7030a0';
  } else if (normalizedId === 'cleaner') {
    glowColor = isActive ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.2)'; // Blue
    outlineColor = isActive ? '#3b82f6' : '#1d4ed8';
  } else if (normalizedId === 'nanny') {
    glowColor = isActive ? 'rgba(236, 72, 153, 0.6)' : 'rgba(236, 72, 153, 0.2)'; // Pink
    outlineColor = isActive ? '#ec4899' : '#be185d';
  } else if (normalizedId === 'security') {
    glowColor = isActive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.2)'; // Red
    outlineColor = isActive ? '#ef4444' : '#b91c1c';
  }

  // Size dimensions
  const dims = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };

  // Render different SVGs for each suspect profile
  const renderSVG = () => {
    switch (normalizedId) {
      case 'curator': // Eleanor Voss: elegant bun, refined neckline, pearls
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <filter id="glow-curator" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Background */}
            <circle cx="50" cy="50" r="46" fill={fillColor} stroke={outlineColor} strokeWidth="2" style={{ filter: isActive ? 'url(#glow-curator)' : 'none' }} />
            {/* Elegant Silhouette */}
            <path
              d="M 50 25 C 44 25 38 29 38 38 C 38 48 45 52 45 58 C 45 65 30 75 25 82 L 75 82 C 70 75 55 65 55 58 C 55 52 62 48 62 38 C 62 29 56 25 50 25 Z"
              fill="#1e1b29"
              stroke={outlineColor}
              strokeWidth="1.5"
            />
            {/* Hair Bun */}
            <circle cx="50" cy="20" r="7" fill="#1e1b29" stroke={outlineColor} strokeWidth="1" />
            {/* Glasses */}
            <path d="M 42 38 Q 46 36 50 38 Q 54 36 58 38" fill="none" stroke={outlineColor} strokeWidth="1" />
            {/* Pearl Necklace */}
            <path d="M 44 60 Q 50 63 56 60" fill="none" stroke={outlineColor} strokeWidth="1.5" strokeDasharray="2,2" />
          </svg>
        );

      case 'cleaner': // Rosa Delgado: visor/cap, active posture, hair ponytail
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <filter id="glow-cleaner" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="46" fill={fillColor} stroke={outlineColor} strokeWidth="2" style={{ filter: isActive ? 'url(#glow-cleaner)' : 'none' }} />
            {/* Ponytail Hair background */}
            <path d="M 34 38 Q 24 45 30 52 Q 35 48 36 41 Z" fill="#182235" stroke={outlineColor} strokeWidth="1" />
            {/* Silhouette */}
            <path
              d="M 50 28 C 44 28 38 32 38 40 C 38 50 45 54 45 60 C 45 66 32 75 27 82 L 73 82 C 68 75 55 66 55 60 C 55 54 62 50 62 40 C 62 32 56 28 50 28 Z"
              fill="#182235"
              stroke={outlineColor}
              strokeWidth="1.5"
            />
            {/* Cap/Visor */}
            <path d="M 37 36 Q 50 31 63 36 L 68 40 L 32 40 Z" fill="#182235" stroke={outlineColor} strokeWidth="1.5" />
          </svg>
        );

      case 'nanny': // Priya Kapoor: flowing locks, warm posture, elegant headband
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <filter id="glow-nanny" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="46" fill={fillColor} stroke={outlineColor} strokeWidth="2" style={{ filter: isActive ? 'url(#glow-nanny)' : 'none' }} />
            {/* Flowing hair background */}
            <path d="M 34 35 C 32 48 34 62 36 70 C 38 72 62 72 64 70 C 66 62 68 48 66 35 Z" fill="#2d1c24" stroke={outlineColor} strokeWidth="1" />
            {/* Silhouette */}
            <path
              d="M 50 26 C 45 26 40 30 40 38 C 40 46 45 50 45 57 C 45 64 32 74 27 82 L 73 82 C 68 74 55 64 55 57 C 55 50 60 46 60 38 C 60 30 55 26 50 26 Z"
              fill="#2d1c24"
              stroke={outlineColor}
              strokeWidth="1.5"
            />
            {/* Headband */}
            <path d="M 41 31 Q 50 28 59 31" fill="none" stroke={outlineColor} strokeWidth="2.5" />
          </svg>
        );

      case 'security': // Marcus Reyes: military cap, broad shoulders, earpiece wire
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <filter id="glow-security" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="46" fill={fillColor} stroke={outlineColor} strokeWidth="2" style={{ filter: isActive ? 'url(#glow-security)' : 'none' }} />
            {/* Authoritative block silhouette */}
            <path
              d="M 50 26 C 44 26 40 30 40 38 C 40 45 44 48 44 54 C 44 60 26 68 20 82 L 80 82 C 74 68 56 60 56 54 C 56 48 60 45 60 38 C 60 30 56 26 50 26 Z"
              fill="#2d1414"
              stroke={outlineColor}
              strokeWidth="1.5"
            />
            {/* Officer Visor Cap */}
            <path d="M 37 30 L 63 30 L 61 35 L 39 35 Z" fill="#150a0a" stroke={outlineColor} strokeWidth="1" />
            <path d="M 35 34 Q 50 34 65 34" fill="none" stroke={outlineColor} strokeWidth="2" />
            {/* Tactical Collar */}
            <path d="M 44 58 L 50 63 L 56 58" fill="none" stroke={outlineColor} strokeWidth="1.5" />
            {/* Earpiece Coil Wire */}
            <path d="M 60 44 Q 63 48 60 52 Q 57 56 60 60" fill="none" stroke={outlineColor} strokeWidth="1" strokeDasharray="1,1" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill={fillColor} stroke={outlineColor} strokeWidth="2" />
            <path d="M 50 25 A 15 15 0 1 0 50 55 A 15 15 0 1 0 50 25 Z M 25 80 A 25 25 0 0 1 75 80" fill="none" stroke={outlineColor} strokeWidth="2" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative inline-block ${dims[size]} select-none transition-all duration-300 ${className}`}
      style={{
        boxShadow: isActive ? `0 0 15px ${glowColor}` : 'none',
        borderRadius: '50%'
      }}
    >
      {renderSVG()}
    </div>
  );
}
