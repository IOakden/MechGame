import React, { useState, useEffect, useRef } from 'react';
import RegionPolygon from './RegionPolygon';
import Star from './Star';
import StarField from './StarField';
import { convexHull, expandPolygon, catmullRom2bezier, expandPolyline, sampleCatmullRom, expandPolylineWithCaps } from './utils/geometry';

const starColors: Record<string, { core: string; mid: string; glow: string }> = {
  'Red Dwarf': { core: '#fffbe6', mid: '#ff7b00', glow: '#ff2d00' },
  'Red Binary': { core: '#fffbe6', mid: '#ff7b00', glow: '#ff2d00' },
  'Red Giant': { core: '#fffbe6', mid: '#ff7b00', glow: '#ff2d00' },
  'Yellow Main': { core: '#fffbe6', mid: '#ffe066', glow: '#ffb700' },
  'Blue Giant': { core: '#e6f7ff', mid: '#66b3ff', glow: '#0099ff' },
  'White Main': { core: '#fff', mid: '#e6e6e6', glow: '#b3b3b3' },
};

type StarSystem = { name: string; type: string };

const StarMap: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const [systems, setSystems] = useState<StarSystem[]>([]);
  const [links, setLinks] = useState<[string, string][]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedStar, setSelectedStar] = useState<StarSystem | null>(null);
  const [regions, setRegions] = useState<{ name: string; systems: string[] }[]>([]);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<any | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionsVisible, setRegionsVisible] = useState(true);

  // Use explicit coordinates for positions if present
  useEffect(() => {
    fetch('/star_systems.json')
      .then((res) => res.json())
      .then((data) => {
        setSystems(data.systems);
        setLinks(data.links);
        setRegions(data.regions || []);
        // Use explicit coordinates if present
        const pos: Record<string, { x: number; y: number }> = {};
        data.systems.forEach((s: any) => {
          if (typeof s.x === 'number' && typeof s.y === 'number') {
            pos[s.name] = { x: s.x, y: s.y };
          }
        });
        setPositions(pos);
      });
  }, []);

  // Load worlds from info.json
  useEffect(() => {
    fetch('/info.json')
      .then(res => res.json())
      .then(data => setWorlds(data.filter((w: any) => w.type === 'World')));
  }, []);

  // Center camera on Sol after positions are loaded
  useEffect(() => {
    // Only center if pan is still at initial value
    if (pan.x === 0 && pan.y === 0 && positions["Sol"]) {
      const sol = positions["Sol"];
      const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      // Calculate pan so that Sol appears at the center of the screen
      const newPan = {
        x: center.x - sol.x * zoom,
        y: center.y - sol.y * zoom,
      };
      setPan(newPan);
    }
    // Only run when positions or zoom changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, zoom]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        // Check if mouse has moved significantly (more than 3 pixels)
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - dragStart.current.x, 2) + 
          Math.pow(e.clientY - dragStart.current.y, 2)
        );
        if (moveDistance > 3) {
          setHasMoved(true);
        }
        
        setPan({
          x: panStart.current.x + (e.clientX - dragStart.current.x),
          y: panStart.current.y + (e.clientY - dragStart.current.y),
        });
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (dragging && (e.button === 0 || e.button === 1 || e.button === 2)) {
        setDragging(false);
        // Reset hasMoved after a short delay to allow for click detection
        setTimeout(() => setHasMoved(false), 100);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const prevZoom = zoom;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      // Zoom in: center on cursor
      newZoom = Math.min(zoom * zoomFactor, 8);
    } else if (e.deltaY > 0) {
      // Zoom out: center on cursor
      newZoom = Math.max(zoom / zoomFactor, 0.2);
    }
    if (newZoom !== prevZoom) {
      const rect = (e.target as HTMLDivElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      // Find world coordinates under cursor before zoom
      const worldX = (mouseX - center.x - pan.x) / prevZoom + center.x;
      const worldY = (mouseY - center.y - pan.y) / prevZoom + center.y;
      // After zoom, keep worldX/worldY under cursor
      const newPanX = mouseX - center.x - (worldX - center.x) * newZoom;
      const newPanY = mouseY - center.y - (worldY - center.y) * newZoom;
      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 1 || e.button === 2) {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    }
    // Add left-click panning for laptop users
    if (e.button === 0) {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    }
  };

  const handleZoomIn = () => {
    const zoomFactor = 1.08;
    const prevZoom = zoom;
    const newZoom = Math.min(zoom * zoomFactor, 8);
    if (newZoom !== prevZoom) {
      const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      // Find world coordinates at screen center before zoom
      const worldX = (center.x - center.x - pan.x) / prevZoom + center.x;
      const worldY = (center.y - center.y - pan.y) / prevZoom + center.y;
      // After zoom, keep worldX/worldY at screen center
      const newPanX = center.x - center.x - (worldX - center.x) * newZoom;
      const newPanY = center.y - center.y - (worldY - center.y) * newZoom;
      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    const zoomFactor = 1.08;
    const prevZoom = zoom;
    const newZoom = Math.max(zoom / zoomFactor, 0.2);
    if (newZoom !== prevZoom) {
      const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      // Find world coordinates at screen center before zoom
      const worldX = (center.x - center.x - pan.x) / prevZoom + center.x;
      const worldY = (center.y - center.y - pan.y) / prevZoom + center.y;
      // After zoom, keep worldX/worldY at screen center
      const newPanX = center.x - center.x - (worldX - center.x) * newZoom;
      const newPanY = center.y - center.y - (worldY - center.y) * newZoom;
      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    }
  };

  const getScreenPos = (x: number, y: number) => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return {
      left: center.x + pan.x + (x - center.x) * zoom,
      top: center.y + pan.y + (y - center.y) * zoom,
    };
  };

  const starSize = 32 * zoom;

  // Utility: Convex hull (Graham scan)
  function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 3) return points;
    const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: { x: number; y: number }[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper: { x: number; y: number }[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  // Utility: Offset hull points outward from centroid
  function expandPolygon(points: { x: number; y: number }[], amount: number): { x: number; y: number }[] {
    if (points.length < 3) return points;
    // Find centroid
    const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return points.map((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      return {
        x: cx + (dx / len) * (len + amount),
        y: cy + (dy / len) * (len + amount),
      };
    });
  }

  // Utility: Catmull-Rom spline to SVG path
  function catmullRom2bezier(points: { x: number; y: number }[], closed = true): string {
    if (points.length < 2) return '';
    const p = points;
    let d = '';
    for (let i = 0; i < p.length; i++) {
      const p0 = p[(i - 1 + p.length) % p.length];
      const p1 = p[i];
      const p2 = p[(i + 1) % p.length];
      const p3 = p[(i + 2) % p.length];
      if (i === 0) d += `M${p1.x},${p1.y}`;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    if (closed) d += 'Z';
    return d;
  }

  // Utility: Expand points outward for a ribbon
  function expandPolyline(points: { x: number; y: number }[], width: number): { x: number; y: number }[] {
    if (points.length < 2) return points;
    const expandedPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const unitX = dx / len;
      const unitY = dy / len;
      expandedPoints.push({ x: p1.x + unitY * width, y: p1.y - unitX * width });
      expandedPoints.push({ x: p2.x + unitY * width, y: p2.y - unitX * width });
    }
    return expandedPoints;
  }

  // --- Region label calculations ---
  let regionLabel = null;
  const starPoints = systems.map((s) => positions[s.name]).filter(Boolean) as { x: number; y: number }[];
  if (starPoints.length >= 3) {
    // Use the outer convex hull for the region
    const regionHull = convexHull(starPoints);
    const cx = regionHull.reduce((sum, p) => sum + p.x, 0) / regionHull.length;
    const cy = regionHull.reduce((sum, p) => sum + p.y, 0) / regionHull.length;
    const expand = 205.5;
    const expandedRegion = regionHull.map((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      return {
        x: cx + (dx / len) * (len + expand),
        y: cy + (dy / len) * (len + expand),
      };
    });
    const screenRegion = expandedRegion.map((p) => getScreenPos(p.x, p.y));
    const labelX = screenRegion.reduce((sum, p) => sum + p.left, 0) / screenRegion.length;
    const labelY = screenRegion.reduce((sum, p) => sum + p.top, 0) / screenRegion.length;
    const minX = Math.min(...screenRegion.map((p) => p.left));
    const maxX = Math.max(...screenRegion.map((p) => p.left));
    const regionWidth = maxX - minX;
    const labelOpacity = zoom <= 0.2 ? 0.7 : zoom >= 0.4 ? 0 : 0.7 * (0.4 - zoom) / 0.35;
    const baseFontSize = 48;
    const labelText = 'Core Worlds';
    regionLabel = (
      <text
        className="region-label-core-worlds"
        x={labelX}
        y={labelY}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="Aldrich, sans-serif"
        fontWeight={800}
        fontSize={baseFontSize}
        fill="#ffe066"
        opacity={labelOpacity}
        style={{ pointerEvents: 'none', textShadow: '0 0 16px #000, 0 0 2px #ffe066' }}
        textLength={regionWidth * 0.85}
        lengthAdjust="spacingAndGlyphs"
      >
        {labelText}
      </text>
    );
  }

  // Optional: region label position overrides (world coordinates)
  const regionLabelPositions: Record<string, { x: number; y: number }> = {
    'Inner Rim': { x: 5050, y: 4600 }, // Move label higher up
    'Outer Rim': { x: 3550, y: 4600 }, // Move label 300 units left of calculated position
  };

  // Precompute region polygon and label data
  const regionPolygonData = regions.map(region => {
    let regionStarPoints = region.systems
      .map(name => positions[name])
      .filter(Boolean) as { x: number; y: number }[];
    let color: string | undefined = undefined;
    if (region.name === 'Core Worlds') color = '#00ff99'; // green
    if (region.name === 'Trade Spine') color = '#4fffff'; // blue for Trade Spine
    if (region.name === 'Outer Rim') color = '#ff6b35'; // orange for Outer Rim
    // Inner Rim uses default (yellow)
    // Compute label position and width
    let labelX: number, labelY: number;
    let regionWidth = 0;
    let labelOpacity = 1;
    let baseFontSize = 48;
    let polygonPoints: { x: number; y: number }[] = [];
    if ((region.name === 'Trade Spine' || region.name === 'Outer Rim') && regionStarPoints.length >= 2) {
      // Use ribbon for Trade Spine and Outer Rim, follow region.systems order
      const smoothLine = sampleCatmullRom(regionStarPoints, 8);
      polygonPoints = expandPolylineWithCaps(smoothLine, 260, 1, 32);
      (polygonPoints as any).__ribbon = true;
    } else if (regionStarPoints.length >= 3) {
      const hull = convexHull(regionStarPoints);
      const cx = hull.reduce((sum, p) => sum + p.x, 0) / hull.length;
      const cy = hull.reduce((sum, p) => sum + p.y, 0) / hull.length;
      const expand = (region.name === 'Inner Rim' || region.name === 'Core Worlds') ? 70 : 205.5;
      polygonPoints = expandPolygon(hull, expand);
    }
    // For label position, use centroid of polygonPoints
    if (polygonPoints.length > 0) {
      const screenRegion = polygonPoints.map((p) => getScreenPos(p.x, p.y));
      labelX = screenRegion.reduce((sum, p) => sum + p.left, 0) / screenRegion.length;
      labelY = screenRegion.reduce((sum, p) => sum + p.top, 0) / screenRegion.length;
      const minX = Math.min(...screenRegion.map((p) => p.left));
      const maxX = Math.max(...screenRegion.map((p) => p.left));
      regionWidth = maxX - minX;
      labelOpacity = zoom <= 0.2 ? 0.7 : zoom >= 0.4 ? 0 : 0.7 * (0.4 - zoom) / 0.2;
    } else {
      labelX = 0; labelY = 0; regionWidth = 0; labelOpacity = 0;
    }
    return {
      region,
      regionStarPoints,
      color,
      labelX,
      labelY,
      regionWidth,
      labelOpacity,
      baseFontSize,
      polygonPoints,
    };
  });

  // Sort regionPolygonData so Core Worlds is last (drawn on top)
  const sortedRegionPolygonData = [...regionPolygonData].sort((a, b) => {
    if (a.region.name === 'Core Worlds') return 1;
    if (b.region.name === 'Core Worlds') return -1;
    return 0;
  });

  // Render region polygons (no label)
  const regionPolygons = sortedRegionPolygonData
    .filter(({ region }) => regionsVisible && (!selectedRegion || region.name === selectedRegion))
    .map(({ region, polygonPoints, color }) => {
      let regionColor = color;
      if (region.name === 'Trade Spine') regionColor = '#4fffff'; // blue for Trade Spine
      if (region.name === 'Outer Rim') regionColor = '#ff6b35'; // orange for Outer Rim
      if (!polygonPoints || polygonPoints.length < 3) return null;
      return (
        <RegionPolygon
          key={region.name}
          points={polygonPoints}
          getScreenPos={getScreenPos}
          zoom={zoom}
          label={region.name}
          onClick={() => {
            if (!hasMoved) {
              setSidebarOpen(true);
              setSelectedStar(null); // region selected
              setSelectedRegion(region.name);
              setSelectedWorld(null); // always clear selectedWorld
            }
          }}
          labelWorldPos={regionLabelPositions[region.name]}
          color={regionColor}
          renderLabel={() => null}
        />
      );
    });

  // Render region labels above all stars
  const regionLabels = sortedRegionPolygonData
    .filter(({ region }) => regionsVisible && (!selectedRegion || region.name === selectedRegion))
    .map(({ region, labelX, labelY, regionWidth, color, labelOpacity, baseFontSize }) => {
      let regionColor = color;
      if (region.name === 'Trade Spine') regionColor = '#4fa3ff';
      if (region.name === 'Outer Rim') regionColor = '#ff8c42';
      // Use label position override if present
      let x = labelX, y = labelY;
      if (regionLabelPositions[region.name]) {
        const screen = getScreenPos(regionLabelPositions[region.name].x, regionLabelPositions[region.name].y);
        x = screen.left;
        y = screen.top;
      }
      return (
        <text
          key={region.name}
          className="region-label-core-worlds"
          x={x}
          y={y}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontFamily="Aldrich, sans-serif"
          fontWeight={800}
          fontSize={baseFontSize}
          fill={regionColor || '#ffe066'}
          opacity={labelOpacity}
          style={{ pointerEvents: 'none', textShadow: `0 0 16px #000, 0 0 2px ${regionColor || '#ffe066'}` }}
          textLength={regionWidth * 0.85}
          lengthAdjust="spacingAndGlyphs"
        >
          {region.name}
        </text>
      );
    });
  // Render stars in horizontal order
  const allStars = systems;

  // Sidebar content logic
  let sidebarTitle = '';
  let sidebarWorlds: any[] = [];
  let sidebarContent: React.ReactNode = null;
  if (sidebarOpen) {
    // Set sidebarWorlds for region or system
    if (selectedStar) {
      sidebarWorlds = worlds.filter(w => w.system === selectedStar.name);
    } else if (selectedRegion) {
      sidebarWorlds = worlds.filter(w => typeof w.region === 'string' && w.region.toLowerCase().includes(selectedRegion.toLowerCase()));
    } else {
      sidebarWorlds = [];
    }
    // Top bar: always at the top, with title and X button
    let topBar = null;
    if (selectedWorld) {
      topBar = (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', marginTop: 0, marginBottom: 8, minHeight: 48 }}>
          <button
            onClick={() => setSelectedWorld(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 28,
              cursor: 'pointer',
              padding: 0,
              height: 48,
              width: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Back to World List"
            type="button"
          >
            &#8592;
          </button>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1, fontFamily: 'Aldrich, sans-serif', flex: 1, textAlign: 'center' }}>{selectedWorld.name}</span>
          <button
            onClick={() => { setSidebarOpen(false); setSelectedWorld(null); setSelectedRegion(null); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 28,
              cursor: 'pointer',
              padding: 0,
              height: 48,
              width: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close Sidebar"
            type="button"
          >
            &times;
          </button>
        </div>
      );
    } else {
      // List view (region or system)
      let title = '';
      if (selectedStar) title = selectedStar.name;
      else if (selectedRegion) title = selectedRegion;
      else title = 'Region';
      topBar = (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', marginTop: 16, marginBottom: 8, minHeight: 48 }}>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1, fontFamily: 'Aldrich, sans-serif', marginLeft: 16 }}>{title}</span>
          <button
            onClick={() => { setSidebarOpen(false); setSelectedWorld(null); setSelectedRegion(null); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 28,
              cursor: 'pointer',
              padding: 0,
              height: 48,
              width: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close Sidebar"
            type="button"
          >
            &times;
          </button>
        </div>
      );
    }
    if (selectedWorld) {
      sidebarContent = (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 32px 0' }}>
          {topBar}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, margin: '24px 0 0 0' }}>
            <img src={selectedWorld.icon} alt={selectedWorld.name} style={{ width: 64, height: 64, objectFit: 'contain', background: '#222', borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', margin: '8px 0 0 0', alignSelf: 'flex-start', fontFamily: 'Lato, sans-serif' }}>{selectedWorld.type}</div>
          {(selectedWorld.system || selectedWorld.region) && (
            <div style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 18, margin: '8px 0 16px 0', alignSelf: 'flex-start', fontFamily: 'Lato, sans-serif', fontSize: 15, fontWeight: 600, color: '#fff', background: 'rgba(40,60,100,0.18)', borderRadius: 6, padding: '6px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>
              <span style={{ color: '#4fa3ff', fontWeight: 700, marginRight: 4 }}>System</span>
              <span style={{ color: '#fff', marginRight: 16 }}>{selectedWorld.system || '-'}</span>
              <span style={{ color: '#4fa3ff', fontWeight: 700, marginRight: 4 }}>Region</span>
              <span style={{ color: '#fff' }}>{selectedWorld.region || '-'}</span>
            </div>
          )}
          <div style={{ background: '#000', color: '#fff', borderRadius: 8, padding: '24px 24px', fontSize: 18, lineHeight: 1.5, width: '100%', boxSizing: 'border-box', marginBottom: 32, fontFamily: 'Lato, sans-serif' }}>{selectedWorld.description}</div>
        </div>
      );
    } else {
      sidebarContent = (
        <>
          {topBar}
          <div style={{ flex: 1, width: '90%', margin: '0 auto', background: '#111', borderRadius: 12, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', padding: 16, boxShadow: '0 2px 12px #0008' }}>
            {sidebarWorlds.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sidebarWorlds.map(w => (
                  <li key={w.name} style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => setSelectedWorld(w)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '12px 24px',
                        cursor: 'pointer',
                        background: '#222',
                        border: 'none',
                        borderRadius: 8,
                        boxShadow: '0 1px 4px #0008',
                        color: '#fff',
                        fontFamily: 'Aldrich, sans-serif',
                        fontWeight: 600,
                        fontSize: 18,
                        transition: 'background 0.18s',
                      }}
                    >
                      <img src={w.icon} alt={w.name} style={{ width: 40, height: 40, objectFit: 'contain', background: '#111', borderRadius: 8 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, fontFamily: 'Aldrich, sans-serif' }}>{w.name}</div>
                        <div style={{ fontSize: 13, opacity: 0.7, textTransform: 'uppercase', fontWeight: 600, marginTop: 2, fontFamily: 'Lato, sans-serif' }}>{w.system}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#888', fontSize: 18, textAlign: 'center', marginTop: 32 }}>
                No worlds found.
              </div>
            )}
          </div>
        </>
      );
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 10,
        userSelect: dragging ? 'none' : undefined,
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* StarField Background */}
      <StarField pan={pan} zoom={zoom} />
      {/* SVG for region polygons and lines */}
      <svg
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 4 }}
      >
        {regionPolygons}
        {/* Lines */}
        {links.map(([a, b], i) => {
          if (!(positions[a] && positions[b])) return null;
          const pa = getScreenPos(positions[a].x, positions[a].y);
          const pb = getScreenPos(positions[b].x, positions[b].y);
          return (
            <line
              key={i}
              x1={pa.left}
              y1={pa.top}
              x2={pb.left}
              y2={pb.top}
              stroke="#ffe066"
              strokeWidth={2}
              opacity={0.18}
            />
          );
        })}
      </svg>
      {/* SVG for region labels (above everything) */}
      {/* (RegionPolygon already renders label) */}
      {/* Stars in horizontal order */}
      <svg
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 20 }}
      >
        {regionLabels}
      </svg>
      {/* Stars in horizontal order */}
      {allStars.map(system => {
        const pos = positions[system.name];
        if (!pos) return null;
        return (
          <Star
            key={system.name}
            system={system}
            pos={getScreenPos(pos.x, pos.y)}
            zoom={zoom}
            selected={!!selectedStar && selectedStar.name === system.name}
            onClick={() => {
              if (!hasMoved) {
                setSidebarOpen(true);
                setSelectedStar(system);
                setSelectedRegion(null);
                setSelectedWorld(null); // always clear selectedWorld
              }
            }}
          />
        );
      })}
      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 480,
          background: 'var(--color-modal-bg)',
          color: 'var(--color-text)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 0,
          boxShadow: '-2px 0 12px rgba(0,0,0,0.12)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(500px)',
          transition: 'transform 0.35s cubic-bezier(.4,1.3,.5,1)',
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          zIndex: 100,
        }}
      >
        {/* Sidebar content */}
        {sidebarOpen && sidebarContent}
      </div>
      {/* Zoom Controls */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          zIndex: 50,
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#ffe066',
            fontSize: 24,
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#ffe066',
            fontSize: 24,
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => setRegionsVisible(!regionsVisible)}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: regionsVisible ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = regionsVisible ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = regionsVisible ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={regionsVisible ? "Hide Regions" : "Show Regions"}
        >
          <img 
            src="/RegionSymbol.svg" 
            alt="Regions" 
            style={{
              width: 24,
              height: 24,
              filter: regionsVisible ? 'brightness(0) saturate(100%) invert(84%) sepia(60%) saturate(250%) hue-rotate(-15deg) brightness(1.0)' : 'brightness(0) saturate(100%) invert(84%) sepia(60%) saturate(250%) hue-rotate(-15deg) brightness(0.3)',
              transition: 'filter 0.2s ease',
            }}
          />
        </button>
      </div>
      {/* Star glow animation style */}
      <style>{`
        @keyframes star-glow {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.3); }
        }
      `}</style>
    </div>
  );
};

export default StarMap;