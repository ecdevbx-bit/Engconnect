'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { ToastDetail } from '../../lib/toast';
import { DragGhostDetail } from '../../lib/effects';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const HOVER_SELECTOR = 'button,a,.tile,.quote-card,.fpill,.pia-card,.why-fcard';

type GhostState = {
  visible: boolean;
  text: string;
  x: number;
  y: number;
};

type Particle = {
  style: CSSProperties;
  animation: Keyframe[];
  options: KeyframeAnimationOptions;
};

export default function UiChromeClient() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [toast, setToast] = useState<ToastDetail | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const [ghost, setGhost] = useState<GhostState>({ visible: false, text: '', x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const next = { x: e.clientX, y: e.clientY };
      mouseRef.current = next;
      setMouse(next);
    };

    const onOver = (e: Event) => {
      setHovered(Boolean((e.target as HTMLElement | null)?.closest(HOVER_SELECTOR)));
    };

    const onOut = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!related?.closest(HOVER_SELECTOR)) setHovered(false);
    };

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      setToast(detail);
      setVisible(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), 2800);
    };

    const onGhost = (e: Event) => {
      const detail = (e as CustomEvent<DragGhostDetail>).detail;
      setGhost((prev) => {
        if (detail.type === 'hide') return { ...prev, visible: false };
        if (detail.type === 'show') {
          return { visible: true, text: detail.text, x: detail.x, y: detail.y };
        }
        return { ...prev, x: detail.x, y: detail.y };
      });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    window.addEventListener('englishconnection:toast', onToast as EventListener);
    window.addEventListener('englishconnection:drag-ghost', onGhost as EventListener);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('englishconnection:toast', onToast as EventListener);
      window.removeEventListener('englishconnection:drag-ghost', onGhost as EventListener);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const animate = () => {
      setTrail((prev) => ({
        x: prev.x + (mouseRef.current.x - prev.x) * 0.14,
        y: prev.y + (mouseRef.current.y - prev.y) * 0.14,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal,.reveal-left,.reveal-right'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const spawnParticles = (items: Particle[]) => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion) return;

      items.forEach((item) => {
        const el = document.createElement('div');
        el.className = 'particle';
        Object.assign(el.style, item.style);
        root.appendChild(el);
        const animation = el.animate(item.animation, item.options);
        animation.onfinish = () => el.remove();
      });
    };

    const onBurst = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      const cols = ['#b79fff', '#ab8eff', '#00e3fd', '#ff6c95', '#c8b4ff'];
      const items: Particle[] = Array.from({ length: 12 }, (_, i) => {
        const size = 5 + Math.random() * 7;
        const angle = (i / 12) * Math.PI * 2;
        const distance = 35 + Math.random() * 45;

        return {
          style: {
            left: `${x}px`,
            top: `${y}px`,
            width: `${size}px`,
            height: `${size}px`,
            background: cols[i % cols.length],
          },
          animation: [
            { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) scale(0)`,
              opacity: 0,
            },
          ],
          options: {
            duration: 600 + Math.random() * 300,
            easing: 'cubic-bezier(.23,1,.32,1)',
            fill: 'forwards',
          },
        };
      });

      spawnParticles(items);
    };

    const onConfetti = () => {
      const cols = ['#b79fff', '#ab8eff', '#00e3fd', '#ff6c95', '#c8b4ff', '#ecedf6'];
      const items: Particle[] = Array.from({ length: 70 }, (_, i) => {
        const size = 6 + Math.random() * 8;

        return {
          style: {
            left: `${Math.random() * 100}vw`,
            top: '-14px',
            width: `${size}px`,
            height: `${size}px`,
            background: cols[i % cols.length],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          },
          animation: [
            { transform: 'translateY(0) rotate(0)', opacity: 1 },
            {
              transform: `translateY(${90 + Math.random() * 30}vh) rotate(${Math.random() * 720}deg)`,
              opacity: 0,
            },
          ],
          options: {
            duration: 2000 + Math.random() * 1500,
            delay: Math.random() * 600,
            easing: 'linear',
            fill: 'forwards',
          },
        };
      });

      spawnParticles(items);
    };

    window.addEventListener('englishconnection:burst', onBurst as EventListener);
    window.addEventListener('englishconnection:confetti', onConfetti as EventListener);

    return () => {
      window.removeEventListener('englishconnection:burst', onBurst as EventListener);
      window.removeEventListener('englishconnection:confetti', onConfetti as EventListener);
    };
  }, [prefersReducedMotion]);

  const curStyle = useMemo(() => ({ left: mouse.x, top: mouse.y }), [mouse]);
  const trailStyle = useMemo(
    () => ({ left: prefersReducedMotion ? mouse.x : trail.x, top: prefersReducedMotion ? mouse.y : trail.y }),
    [mouse, prefersReducedMotion, trail],
  );
  const ghostStyle = useMemo(
    () => ({
      display: ghost.visible ? 'block' : 'none',
      left: ghost.x,
      top: ghost.y,
    }),
    [ghost],
  );

  return (
    <div ref={rootRef} aria-hidden="true">
      {!prefersReducedMotion && <div id="cur" className={hovered ? 'big' : ''} style={curStyle} />}
      {!prefersReducedMotion && <div id="cur-trail" style={trailStyle} />}
      <div id="drag-ghost" style={ghostStyle}>{ghost.text}</div>
      <div
        className={`toast ${visible ? 'show' : ''}`}
        id="toast"
        role={toast?.type === 'error' ? 'alert' : 'status'}
        aria-live={toast?.type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        data-type={toast?.type ?? 'error'}
      >
        <div className="toast-t" id="t-t">{toast?.title ?? ''}</div>
        <div className="toast-b" id="t-b">{toast?.body ?? ''}</div>
      </div>
    </div>
  );
}
