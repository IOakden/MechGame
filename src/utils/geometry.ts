// Convex hull (Graham scan)
export function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
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

// Offset hull points outward from centroid
export function expandPolygon(points: { x: number; y: number }[], amount: number): { x: number; y: number }[] {
  if (points.length < 3) return points;
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

// Catmull-Rom spline to SVG path
export function catmullRom2bezier(points: { x: number; y: number }[], closed = true): string {
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

// Expand a polyline into a ribbon (thick line) polygon
export function expandPolyline(points: { x: number; y: number }[], width: number): { x: number; y: number }[] {
  if (points.length < 2) return points;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    // Get direction vector
    let dx = 0, dy = 0;
    if (i === 0) {
      dx = points[i + 1].x - p.x;
      dy = points[i + 1].y - p.y;
    } else if (i === points.length - 1) {
      dx = p.x - points[i - 1].x;
      dy = p.y - points[i - 1].y;
    } else {
      dx = points[i + 1].x - points[i - 1].x;
      dy = points[i + 1].y - points[i - 1].y;
    }
    // Perpendicular vector
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    left.push({ x: p.x + px * width / 2, y: p.y + py * width / 2 });
    right.push({ x: p.x - px * width / 2, y: p.y - py * width / 2 });
  }
  return left.concat(right.reverse());
}

// Expand a polyline into a ribbon (thick line) polygon with rounded caps
export function expandPolylineWithCaps(points: { x: number; y: number }[], width: number, samplesPerSegment: number = 8, capSegments: number = 8): { x: number; y: number }[] {
  if (points.length < 2) return points;
  // Smooth the centerline
  const centerline = sampleCatmullRom(points, samplesPerSegment);
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  // Compute offset points
  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i];
    // Tangent direction
    let dx = 0, dy = 0;
    if (i === 0) {
      dx = centerline[i + 1].x - p.x;
      dy = centerline[i + 1].y - p.y;
    } else if (i === centerline.length - 1) {
      dx = p.x - centerline[i - 1].x;
      dy = p.y - centerline[i - 1].y;
    } else {
      dx = centerline[i + 1].x - centerline[i - 1].x;
      dy = centerline[i + 1].y - centerline[i - 1].y;
    }
    // Perpendicular
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    left.push({ x: p.x + px * width / 2, y: p.y + py * width / 2 });
    right.push({ x: p.x - px * width / 2, y: p.y - py * width / 2 });
  }
  // End cap (at last point)
  const cap = [];
  const n = centerline.length;
  {
    const p = centerline[n - 1];
    const dx = p.x - centerline[n - 2].x;
    const dy = p.y - centerline[n - 2].y;
    const angle0 = Math.atan2(-dy, -dx);
    // Start at last left, end at last right
    for (let i = 0; i <= capSegments; i++) {
      const theta = angle0 + Math.PI * (i / capSegments);
      cap.push({ x: p.x + Math.cos(theta) * width / 2, y: p.y + Math.sin(theta) * width / 2 });
    }
    // Replace the last left/right with the cap endpoints
    left[left.length - 1] = cap[0];
    right[right.length - 1] = cap[cap.length - 1];
  }
  // Start cap (at first point)
  const startCap = [];
  {
    const p = centerline[0];
    const dx = centerline[1].x - p.x;
    const dy = centerline[1].y - p.y;
    const angle0 = Math.atan2(-dy, -dx);
    // Start at first right, end at first left
    for (let i = 0; i <= capSegments; i++) {
      const theta = angle0 - Math.PI + Math.PI * (i / capSegments);
      startCap.push({ x: p.x + Math.cos(theta) * width / 2, y: p.y + Math.sin(theta) * width / 2 });
    }
    // Replace the first right/left with the cap endpoints
    right[0] = startCap[0];
    left[0] = startCap[startCap.length - 1];
  }
  // Combine: left, end cap (excluding endpoints), right (reversed), start cap (excluding endpoints)
  return [
    ...left,
    ...cap.slice(1, -1),
    ...right.reverse(),
    ...startCap.slice(1, -1)
  ];
}

// Sample a Catmull-Rom spline through points, returning an array of points
export function sampleCatmullRom(points: { x: number; y: number }[], samplesPerSegment: number = 8): { x: number; y: number }[] {
  if (points.length < 2) return points;
  const result: { x: number; y: number }[] = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < n ? i + 2 : n - 1];
    for (let j = 0; j < samplesPerSegment; j++) {
      const t = j / samplesPerSegment;
      const tt = t * t;
      const ttt = tt * t;
      // Catmull-Rom to Cubic Hermite
      const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * tt + (-p0.x + 3*p1.x - 3*p2.x + p3.x) * ttt);
      const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * tt + (-p0.y + 3*p1.y - 3*p2.y + p3.y) * ttt);
      result.push({ x, y });
    }
  }
  // Always include the last point
  result.push(points[n - 1]);
  return result;
} 