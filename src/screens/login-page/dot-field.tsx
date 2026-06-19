"use client";

import { memo, useEffect, useId, useRef } from "react";

const TWO_PI = Math.PI * 2;

type Dot = {
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type MouseState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
};

type DotFieldProps = {
  className?: string;
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
};

export const DotField = memo(function DotField({
  className,
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 430,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 62,
  glowRadius = 170,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(255, 250, 240, 0.32)",
  gradientTo = "rgba(188, 210, 193, 0.22)",
  glowColor = "rgba(255, 250, 240, 0.12)",
}: DotFieldProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<MouseState>({
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    speed: 0,
  });
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const engagementRef = useRef(0);
  const glowOpacityRef = useRef(0);
  const animationFrameRef = useRef(0);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowId = useId().replace(/:/g, "");

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    if (!wrapper || !canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const buildDots = (w: number, h: number) => {
      const step = dotRadius + dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const nextDots: Dot[] = [];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          nextDots.push({ ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay });
        }
      }

      dotsRef.current = nextDots;
    };

    const doResize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = rect.width;
      const h = rect.height;

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };
      buildDots(w, h);
    };

    const resize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(doResize, 100);
    };

    const moveCursorAway = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      mouseRef.current.prevX = -9999;
      mouseRef.current.prevY = -9999;
      mouseRef.current.speed = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) {
        moveCursorAway();
        return;
      }

      mouseRef.current.x = event.pageX - sizeRef.current.offsetX;
      mouseRef.current.y = event.pageY - sizeRef.current.offsetY;
    };

    const updateMouseSpeed = () => {
      const mouse = mouseRef.current;
      const dx = mouse.prevX - mouse.x;
      const dy = mouse.prevY - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (distance - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    };

    const speedInterval = window.setInterval(updateMouseSpeed, 20);
    let frame = 0;

    const draw = () => {
      frame += 1;
      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const { w, h } = sizeRef.current;
      const time = frame * 0.02;
      const targetEngagement = Math.min(mouse.speed / 5, 1);

      engagementRef.current += (targetEngagement - engagementRef.current) * 0.06;
      if (engagementRef.current < 0.001) engagementRef.current = 0;
      glowOpacityRef.current +=
        (engagementRef.current - glowOpacityRef.current) * 0.08;

      if (glow) {
        glow.setAttribute("cx", String(mouse.x));
        glow.setAttribute("cy", String(mouse.y));
        glow.style.opacity = String(glowOpacityRef.current);
      }

      context.clearRect(0, 0, w, h);

      const gradient = context.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, gradientFrom);
      gradient.addColorStop(1, gradientTo);
      context.fillStyle = gradient;
      context.beginPath();

      const cursorRadiusSquared = cursorRadius * cursorRadius;
      const drawRadius = dotRadius / 2;

      for (let index = 0; index < dots.length; index += 1) {
        const dot = dots[index];
        const dx = mouse.x - dot.ax;
        const dy = mouse.y - dot.ay;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < cursorRadiusSquared && engagementRef.current > 0.01) {
          const distance = Math.sqrt(distanceSquared);
          const angle = Math.atan2(dy, dx);

          if (bulgeOnly) {
            const t = 1 - distance / cursorRadius;
            const push = t * t * bulgeStrength * engagementRef.current;
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
          } else {
            const move = (500 / Math.max(distance, 1)) * (mouse.speed * cursorForce);
            dot.vx += Math.cos(angle) * -move;
            dot.vy += Math.sin(angle) * -move;
          }
        } else if (bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1;
          dot.sy += (dot.ay - dot.sy) * 0.1;
        }

        if (!bulgeOnly) {
          dot.vx *= 0.9;
          dot.vy *= 0.9;
          dot.x = dot.ax + dot.vx;
          dot.y = dot.ay + dot.vy;
          dot.sx += (dot.x - dot.sx) * 0.1;
          dot.sy += (dot.y - dot.sy) * 0.1;
        }

        let drawX = dot.sx;
        let drawY = dot.sy;
        if (waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + time) * waveAmplitude;
          drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * waveAmplitude * 0.5;
        }

        if (sparkle) {
          const hash = ((index * 2654435761) ^ (frame >> 3)) >>> 0;
          const sparkleRadius = hash % 100 < 3 ? drawRadius * 1.8 : drawRadius;
          context.moveTo(drawX + sparkleRadius, drawY);
          context.arc(drawX, drawY, sparkleRadius, 0, TWO_PI);
        } else {
          context.moveTo(drawX + drawRadius, drawY);
          context.arc(drawX, drawY, drawRadius, 0, TWO_PI);
        }
      }

      context.fill();
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    doResize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.clearInterval(speedInterval);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [
    bulgeOnly,
    bulgeStrength,
    cursorForce,
    cursorRadius,
    dotRadius,
    dotSpacing,
    glowId,
    gradientFrom,
    gradientTo,
    sparkle,
    waveAmplitude,
  ]);

  return (
    <div ref={wrapperRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <svg className="pointer-events-none absolute inset-0 size-full">
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill={`url(#${glowId})`}
          style={{ opacity: 0, willChange: "opacity" }}
        />
      </svg>
    </div>
  );
});
