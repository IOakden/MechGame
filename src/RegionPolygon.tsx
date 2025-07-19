import React from 'react';
import { convexHull, expandPolygon, catmullRom2bezier } from './utils/geometry';

interface RegionPolygonProps {
  points: { x: number; y: number }[];
  getScreenPos: (x: number, y: number) => { left: number; top: number };
  zoom: number;
  label: string;
  onClick?: () => void;
  labelWorldPos?: { x: number; y: number };
  color?: string;
  renderLabel?: (props: {
    x: number;
    y: number;
    width: number;
    color: string;
    opacity: number;
    fontSize: number;
    label: string;
  }) => React.ReactNode;
}

const RegionPolygon: React.FC<RegionPolygonProps> = ({ points, getScreenPos, zoom, label, onClick, labelWorldPos, color, renderLabel }) => {
  if (points.length < 3) return null;
  // If points.__ribbon is true, render as a thick stroked path
  if ((points as any).__ribbon) {
    // Convert points to screen coordinates
    const screenPoints = points.map((p) => getScreenPos(p.x, p.y));
    const path = catmullRom2bezier(screenPoints.map(p => ({ x: p.left, y: p.top })), false);
    const regionColor = color || '#ffe066';
    return (
      <g>
        <path
          d={path}
          fill="none"
          stroke={regionColor}
          strokeWidth={260 * zoom}
          opacity={0.18}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'blur(2.5px)', cursor: 'pointer', pointerEvents: 'auto' }}
          onClick={onClick}
        />
      </g>
    );
  }
  // Default: expand convex hull
  let polygonPoints = points;
  const hull = convexHull(points);
  const expand = 205.5;
  polygonPoints = expandPolygon(hull, expand);
  const screenRegion = polygonPoints.map((p) => getScreenPos(p.x, p.y));
  const path = catmullRom2bezier(screenRegion.map(p => ({ x: p.left, y: p.top })), true);
  // Label position and width
  let labelX: number, labelY: number;
  if (labelWorldPos) {
    const screen = getScreenPos(labelWorldPos.x, labelWorldPos.y);
    labelX = screen.left;
    labelY = screen.top;
  } else {
    labelX = screenRegion.reduce((sum, p) => sum + p.left, 0) / screenRegion.length;
    labelY = screenRegion.reduce((sum, p) => sum + p.top, 0) / screenRegion.length;
  }
  const minX = Math.min(...screenRegion.map((p) => p.left));
  const maxX = Math.max(...screenRegion.map((p) => p.left));
  const regionWidth = maxX - minX;
  const labelOpacity = zoom <= 0.2 ? 0.7 : zoom >= 0.4 ? 0 : 0.7 * (0.4 - zoom) / 0.2;
  const baseFontSize = 48;
  const regionColor = color || '#ffe066';
  return (
    <>
      <g>
        <path
          className="region-core-worlds"
          d={path}
          fill={regionColor}
          opacity={0.18}
          stroke={regionColor}
          strokeWidth={3}
          style={{ filter: 'blur(2.5px)', cursor: 'pointer', pointerEvents: 'auto' }}
          onClick={onClick}
        />
      </g>
      {renderLabel ? renderLabel({
        x: labelX,
        y: labelY,
        width: regionWidth,
        color: regionColor,
        opacity: labelOpacity,
        fontSize: baseFontSize,
        label,
      }) : (
        <text
          className="region-label-core-worlds"
          x={labelX}
          y={labelY}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontFamily="Aldrich, sans-serif"
          fontWeight={800}
          fontSize={baseFontSize}
          fill={regionColor}
          opacity={labelOpacity}
          style={{ pointerEvents: 'none', textShadow: `0 0 16px #000, 0 0 2px ${regionColor}` }}
          textLength={regionWidth * 0.85}
          lengthAdjust="spacingAndGlyphs"
        >
          {label}
        </text>
      )}
    </>
  );
};

export default RegionPolygon; 