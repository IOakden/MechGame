import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  layer: number; // 0 = far, 1 = medium, 2 = near, 3 = foreground (max zoom out)
}

const StarField: React.FC<{ pan: { x: number; y: number }; zoom: number }> = ({ pan, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);

  // Generate stars on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Generate stars with better layer distribution
    const stars: Star[] = [];
    
    // Layer 0: Far background stars (slowest movement)
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * window.innerWidth * 4 - window.innerWidth * 2,
        y: Math.random() * window.innerHeight * 4 - window.innerHeight * 2,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.6 + 0.1,
        layer: 0,
      });
    }
    
    // Layer 1: Medium distance stars
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * window.innerWidth * 3 - window.innerWidth * 1.5,
        y: Math.random() * window.innerHeight * 3 - window.innerHeight * 1.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        layer: 1,
      });
    }
    
    // Layer 2: Near foreground stars (fastest movement)
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * window.innerWidth * 2 - window.innerWidth,
        y: Math.random() * window.innerHeight * 2 - window.innerHeight,
        size: Math.random() * 2.5 + 0.8,
        opacity: Math.random() * 1 + 0.3,
        layer: 2,
      });
    }
    
    // Layer 3: Foreground stars (only visible at max zoom out)
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * window.innerWidth * 1.5 - window.innerWidth * 0.75,
        y: Math.random() * window.innerHeight * 1.5 - window.innerHeight * 0.75,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 1.2 + 0.4,
        layer: 3,
      });
    }

    starsRef.current = stars;
  }, []);

  // Draw stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stars = starsRef.current;
    if (!stars.length) return;

    // Draw stars with parallax effect
    stars.forEach(star => {
      // More pronounced parallax effect with different speeds per layer
      // Further back = slower movement, closer to camera = faster movement
      let parallaxFactor: number;
      switch (star.layer) {
        case 0: // Far background - slowest movement (furthest from camera)
          parallaxFactor = 0.05;
          break;
        case 1: // Medium distance - moderate speed
          parallaxFactor = 0.2;
          break;
        case 2: // Near foreground - fast movement
          parallaxFactor = 0.6;
          break;
        case 3: // Foreground layer (max zoom out) - fastest movement (closest to camera)
          parallaxFactor = 1.0;
          break;
        default:
          parallaxFactor = 0.4;
      }
      
      const adjustedX = star.x - (pan.x * parallaxFactor);
      const adjustedY = star.y - (pan.y * parallaxFactor);

      // Only draw if star is visible
      if (adjustedX >= -50 && adjustedX <= canvas.width + 50 && 
          adjustedY >= -50 && adjustedY <= canvas.height + 50) {
        
        // For foreground layer (layer 3), only show when maximally zoomed out
        if (star.layer === 3 && zoom > 0.3) {
          return;
        }
        
        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = '#ffffff';
        
        // Create star glow effect
        const gradient = ctx.createRadialGradient(
          adjustedX, adjustedY, 0,
          adjustedX, adjustedY, star.size * 3
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw star core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    });
  }, [pan.x, pan.y, zoom]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default StarField; 