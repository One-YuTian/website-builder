import { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { ProjectManager } from './ProjectManager';
declare global { interface Window { __WEBSITE_BUILDER__?: { api: string; projectApi?:string; managerApi?:string; resourceApi?:string; origin: string; defaultDirectory: string } } }

function DotCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 0, height = 0, frame = 0, last = 0;
    let strength = 0, target = 0;
    let x = -1000, y = -1000;
    const base=document.createElement('canvas');
    const baseContext=base.getContext('2d')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const draw = (time: number) => {
      frame = 0;
      const dt = Math.min(time - last || 16, 64);
      last = time;
      strength = reduced.matches ? target : strength + (target - strength) * (1 - Math.exp(-dt / 85));
      if (Math.abs(target - strength) < 0.002) strength = target;
      ctx.clearRect(0, 0, width, height);
      if(base.width&&base.height)ctx.drawImage(base,0,0,base.width,base.height,0,0,width,height);
      const spacing = 10, radius = 190;
      for (let py = Math.max(0,Math.ceil((y-radius)/spacing)*spacing); strength>0&&py < Math.min(height,y+radius); py += spacing) {
        for (let px = 14+Math.max(0,Math.ceil((x-radius-14)/spacing))*spacing; px < Math.min(width,x+radius); px += spacing) {
          const distance = Math.hypot(px - x, py - y) / radius;
          const falloff = Math.max(0, 1 - distance);
          if(!falloff)continue;
          const alpha = 0.66 / (1-0.19) * strength * falloff * falloff * (3 - 2 * falloff);
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
      base.width=canvas.width;base.height=canvas.height;baseContext.setTransform(dpr,0,0,dpr,0,0);
      baseContext.fillStyle='rgba(25,30,30,.19)';baseContext.beginPath();
      for(let py=0;py<height;py+=10)for(let px=14;px<width;px+=10){baseContext.moveTo(px+.85,py);baseContext.arc(px,py,.85,0,Math.PI*2);}
      baseContext.fill();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); invalidate();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom){leave();return;}
      x = event.clientX - rect.left; y = event.clientY - rect.top;
      target = 1; invalidate();
    };
    const leave = () => { target = 0; invalidate(); };
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    resize();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
    };
  }, []);
  return <div className="dot-background" aria-hidden="true"><canvas ref={ref} /></div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><ProjectManager background={<DotCanvas />} /></StrictMode>);
