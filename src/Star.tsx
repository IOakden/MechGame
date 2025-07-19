import React from 'react';
import type { StarSystem } from './types';

interface StarProps {
  system: StarSystem;
  pos: { left: number; top: number };
  zoom: number;
  selected: boolean;
  onClick: () => void;
}

const starColors: Record<string, { core: string; mid: string; glow: string }> = {
  'Red Dwarf': { core: '#fffbe6', mid: '#ff7b00', glow: '#ff2d00' },
  'Red Binary': { core: '#fffbe6', mid: '#ff7b00', glow: '#ff2d00' },
  'Red Giant': { core: '#fffbe6', mid: '#ff7b00', glow: '#ff2d00' },
  'Yellow Main': { core: '#fffbe6', mid: '#ffe066', glow: '#ffb700' },
  'Blue Giant': { core: '#e6f7ff', mid: '#66b3ff', glow: '#0099ff' },
  'White Main': { core: '#fff', mid: '#e6e6e6', glow: '#b3b3b3' },
};

const Star: React.FC<StarProps> = ({ system, pos, zoom, selected, onClick }) => {
  const color = starColors[system.type] || starColors['Yellow Main'];
  const starSize = 32 * zoom;
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: pos.left - starSize / 2,
        top: pos.top - starSize / 2,
        width: starSize,
        height: starSize,
        borderRadius: '50%',
        background: `radial-gradient(circle at 50% 50%, ${color.core} 0%, ${color.mid} 40%, ${color.glow} 70%, #000 100%)`,
        boxShadow: `0 0 ${24 * zoom}px ${12 * zoom}px ${color.glow}, 0 0 ${48 * zoom}px ${24 * zoom}px ${color.glow}`,
        filter: 'blur(0.2px)',
        animation: `star-glow 2.5s ease-in-out infinite alternate`,
        cursor: 'pointer',
        zIndex: 20,
        border: selected ? `2px solid ${color.mid}` : 'none',
        transition: 'border 0.2s',
      }}
      title={system.name}
    >
      {zoom >= 0.5 && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            transform: 'translate(-50%, 8px)',
            color: color.mid,
            fontWeight: 700,
            fontSize: 18 * zoom,
            textShadow: `0 0 8px #000, 0 0 2px ${color.mid}`,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'Aldrich, sans-serif',
          }}
        >
          {system.name}
        </span>
      )}
    </div>
  );
};

export default Star; 