import { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { WebsiteCanvas } from './WebsiteCanvas';
declare global { interface Window { __WEBSITE_BUILDER__?: { api: string; projectApi?:string; origin: string; defaultDirectory: string } } }

function DotCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 0, height = 0, frame = 0, last = 0;
    let strength = 0, target = 0;
    let x = -1000, y = -1000;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const draw = (time: number) => {
      frame = 0;
      const dt = Math.min(time - last || 16, 64);
      last = time;
      strength = reduced.matches ? target : strength + (target - strength) * (1 - Math.exp(-dt / 85));
      if (Math.abs(target - strength) < 0.002) strength = target;
      ctx.clearRect(0, 0, width, height);
      const spacing = 10, radius = 190;
      for (let py = 0; py < height; py += spacing) {
        for (let px = 14; px < width; px += spacing) {
          const distance = Math.hypot(px - x, py - y) / radius;
          const falloff = Math.max(0, 1 - distance);
          const alpha = 0.19 + 0.66 * strength * falloff * falloff * (3 - 2 * falloff);
          ctx.fillStyle = `rgba(25, 30, 30, ${alpha})`;
          ctx.beginPath(); ctx.arc(px, py, 0.85, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (strength !== target) frame = requestAnimationFrame(draw);
    };
    const invalidate = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); invalidate();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      x = event.clientX - rect.left; y = event.clientY - rect.top;
      target = 1; invalidate();
    };
    const leave = () => { target = 0; invalidate(); };
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    resize();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
    };
  }, []);
  return <div className="dot-background" aria-hidden="true"><canvas ref={ref} /></div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><WebsiteCanvas background={<DotCanvas />} /></StrictMode>);
