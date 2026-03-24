'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

const PARTICLE_COUNT = 38;
const colors = ['#ffe566','#ffd700','#ffcc33','#fff0a0','#ffe8b0','#ffc94a'];

function HeroClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const heroRef = useRef<HTMLDivElement>(null);
  const chakraRef = useRef<HTMLImageElement>(null);
  const glowOuterRef = useRef<HTMLDivElement>(null);
  const glowInnerRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  const [isHovering, setIsHovering] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  
  // Custom cursor & mouse tracking
  useEffect(() => {
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (cursorDotRef.current && cursorRingRef.current) {
        cursorDotRef.current.style.left = e.clientX + 'px';
        cursorDotRef.current.style.top = e.clientY + 'px';
        cursorRingRef.current.style.left = e.clientX + 'px';
        cursorRingRef.current.style.top = e.clientY + 'px';
      }
    };
    const showCursor = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1';
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '1';
    };
    const hideCursor = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '0';
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', showCursor);
    document.addEventListener('mouseleave', hideCursor);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', showCursor);
      document.removeEventListener('mouseleave', hideCursor);
    };
  }, []);

  // Embers static generation
  const embers = useMemo(() => Array.from({ length: 10 }).map((_, i) => {
    const size = 1 + Math.random() * 2;
    return {
      id: i,
      size,
      top: 10 + Math.random() * 80,
      left: 10 + Math.random() * 80,
      opacity: 0.08 + Math.random() * 0.15,
      dur: 12 + Math.random() * 10,
      delay: Math.random() * 8,
      dx1: Math.random() * 30 - 15,
      dy1: -(20 + Math.random() * 30),
      dx2: Math.random() * 20 - 10,
      dy2: Math.random() * 20 - 10
    };
  }), []);

  // Rays static generation
  const rays = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    len: 300 + Math.random() * 180,
    angle: i * 30 + Math.random() * 10,
    opacity: 0.12 + Math.random() * 0.22,
    delay: Math.random() * 3,
    dur: 3 + Math.random() * 2,
  })), []);

  // Chakra Spin Physics
  useEffect(() => {
    if (!mounted) return;
    const chakra = chakraRef.current;
    if (!chakra) return;
    
    let angle = 0, velocity = 0, dragging = false;
    let lastA = 0, lastT = 0, rafId: number;

    const getAngle = (e: MouseEvent | TouchEvent) => {
      const r = chakra.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const p = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      return Math.atan2(p.clientY - cy, p.clientX - cx) * 180 / Math.PI;
    };
    
    const applyRot = () => {
      chakra.style.transform = `rotate(${angle}deg)`;
    };
    
    const idleSpin = () => {
      angle += 0.15;
      applyRot();
      rafId = requestAnimationFrame(idleSpin);
    };
    
    const freewheel = () => {
      if (Math.abs(velocity) < 0.15) { idleSpin(); return; }
      velocity *= 0.972;
      angle += velocity;
      applyRot();
      const speed = Math.abs(velocity);
      const boost = Math.min(speed * 0.4, 0.6);
      if (glowOuterRef.current && glowInnerRef.current) {
        glowOuterRef.current.style.transform = `scale(${1 + boost})`;
        glowInnerRef.current.style.transform = `scale(${1 + boost * 1.3})`;
      }
      rafId = requestAnimationFrame(freewheel);
    };

    const handleDown = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      cancelAnimationFrame(rafId);
      lastA = getAngle(e);
      lastT = performance.now();
      velocity = 0;
      if (e.cancelable) e.preventDefault();
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const a = getAngle(e), now = performance.now();
      let d = a - lastA;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      const dt = Math.max(1, now - lastT);
      velocity = d / dt * 14;
      angle += d; applyRot();
      lastA = a; lastT = now;
    };

    const handleUp = () => {
      if (!dragging) return;
      dragging = false;
      freewheel();
    };

    chakra.addEventListener('mousedown', handleDown as EventListener);
    chakra.addEventListener('touchstart', handleDown as EventListener, { passive: false });
    window.addEventListener('mousemove', handleMove as EventListener);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove as EventListener);
    window.addEventListener('touchend', handleUp);

    idleSpin();

    return () => {
      cancelAnimationFrame(rafId);
      chakra.removeEventListener('mousedown', handleDown as EventListener);
      chakra.removeEventListener('touchstart', handleDown as EventListener);
      window.removeEventListener('mousemove', handleMove as EventListener);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove as EventListener);
      window.removeEventListener('touchend', handleUp);
    };
  }, [mounted]);

  // Dust Particle Physics Engine
  const particlesRef = useRef(Array.from({ length: PARTICLE_COUNT }).map(() => ({
    el: null as HTMLDivElement | null,
    size: 1.8 + Math.random() * 4.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    baseOpacity: 0.18 + Math.random() * 0.32,
    angle: Math.random() * Math.PI * 2,
    orbitRadius: 180 + Math.random() * 320,
    speed: (0.0003 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
    floatAmp: 6 + Math.random() * 14,
    floatSpeed: 0.0008 + Math.random() * 0.0012,
    floatOffset: Math.random() * Math.PI * 2,
    x: 0, y: 0, vx: 0, vy: 0, hovered: false
  })));

  useEffect(() => {
    if (!mounted) return;
    let rafId: number;
    let lastTime = performance.now();

    // Init logical center coordinate to avoid jumping frame data
    const initCx = window.innerWidth / 2;
    const initCy = window.innerHeight / 2;
    particlesRef.current.forEach(p => {
      p.x = initCx + Math.cos(p.angle) * p.orbitRadius;
      p.y = initCy + Math.sin(p.angle) * p.orbitRadius;
    });

    const animateDust = (now: number) => {
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;

      if (!heroRef.current) {
        rafId = requestAnimationFrame(animateDust);
        return;
      }
      
      const hr = heroRef.current.getBoundingClientRect();
      const cx = hr.left + hr.width / 2;
      const cy = hr.top + hr.height / 2;

      particlesRef.current.forEach((p, i) => {
        if (!p.el) return;
        
        if (p.hovered) {
          p.el.style.transform = `translate(${p.x - hr.left - p.size/2}px, ${p.y - hr.top - p.size/2}px) scale(3.5)`;
          return;
        }

        p.angle += p.speed * dt;
        const targetX = cx + Math.cos(p.angle) * p.orbitRadius + Math.sin(now * p.floatSpeed + p.floatOffset) * p.floatAmp;
        const targetY = cy + Math.sin(p.angle) * p.orbitRadius + Math.cos(now * p.floatSpeed + p.floatOffset) * p.floatAmp;

        const mdx = mouseRef.current.x - p.x;
        const mdy = mouseRef.current.y - p.y;
        const mdist = Math.sqrt(mdx*mdx + mdy*mdy);

        if (mdist < 100) {
          const force = (100 - mdist) / 100;
          const repelX = -(mdx / mdist) * force * 1.8;
          const repelY = -(mdy / mdist) * force * 1.8;
          p.vx += repelX * 0.12;
          p.vy += repelY * 0.12;
          const glowBoost = force * 0.75;
          p.el.style.opacity = String(Math.min(1, p.baseOpacity + glowBoost));
          p.el.style.boxShadow = `0 0 ${p.size*(2+force*8)}px ${p.color}, 0 0 ${p.size*(4+force*16)}px ${p.color}aa`;
        } else {
          p.el.style.opacity = String(p.baseOpacity + 0.08 * Math.sin(now * 0.001 + i));
          p.el.style.boxShadow = `0 0 ${p.size*2}px ${p.color}, 0 0 ${p.size*4}px ${p.color}77`;
        }

        p.vx += (targetX - p.x) * 0.018;
        p.vy += (targetY - p.y) * 0.018;
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.x += p.vx;
        p.y += p.vy;

        const px = p.x - hr.left - p.size/2;
        const py = p.y - hr.top - p.size/2;
        p.el.style.transform = `translate(${px}px, ${py}px)`;
      });

      rafId = requestAnimationFrame(animateDust);
    };

    rafId = requestAnimationFrame(animateDust);
    return () => cancelAnimationFrame(rafId);
  }, [mounted]);

  return (
    <>
      <div className="vignette"></div>

      {/* Cursors */}
      <div id="cursor-dot" ref={cursorDotRef}></div>
      <div id="cursor-ring" ref={cursorRingRef} style={isHovering ? { borderColor: 'rgba(232,201,122,0.8)' } : {}}></div>

      {/* Ambient Embers */}
      {mounted && embers.map(e => (
        <div 
          key={e.id}
          className="ember"
          style={{
            position: 'absolute',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1,
            width: e.size, height: e.size,
            background: '#d4a830',
            boxShadow: `0 0 ${e.size*3}px #d4a830, 0 0 ${e.size*7}px #c8881022`,
            top: `${e.top}%`, left: `${e.left}%`,
            opacity: e.opacity,
            animation: `emberDrift ${e.dur}s ${e.delay}s ease-in-out infinite alternate`,
            '--dx1': `${e.dx1}px`, '--dy1': `${e.dy1}px`,
            '--dx2': `${e.dx2}px`, '--dy2': `${e.dy2}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Zari Panels */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="zari zari-left" src="/Assests/zari.png" alt="Zari" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="zari zari-right" src="/Assests/zari.png" alt="Zari" />

      {/* Navbar */}
      <nav className="navbar">
        <span className="brand">
          Mayuri Music
        </span>
        <ul className="nav-links">
          {['Home','Our Band','Sounds','Events','Media','Contact'].map(link => (
            <li key={link}>
              <a href="#">{link}</a>
            </li>
          ))}
        </ul>
        <button className="book-btn">Book Now</button>
      </nav>

      {/* Hero Section */}
      <section className="hero" ref={heroRef} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        
        <div className="chakra-wrap">
          <div className="glow-outer" ref={glowOuterRef}></div>
          <div className="glow-inner" ref={glowInnerRef}></div>
          
          <div id="rays" style={{ position: 'absolute', width: '1000px', height: '1000px', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 2 }}>
            {mounted && rays.map(r => (
              <div 
                key={r.id}
                style={{
                  position: 'absolute',
                  bottom: '50%',
                  left: '50%',
                  width: '1px',
                  height: r.len,
                  background: 'linear-gradient(to top, rgba(210,160,40,0.55), rgba(210,160,40,0))',
                  transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${r.angle}deg)`,
                  opacity: r.opacity,
                  animation: `rayPulse ${r.dur}s ${r.delay}s ease-in-out infinite alternate`
                }}
              />
            ))}
          </div>
          
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img id="chakra" ref={chakraRef} src="/Assests/chakra.png" alt="chakra" draggable="false" />
        </div>

        {/* Dust Particles */}
        {mounted && particlesRef.current.map((p, i) => (
          <div
            key={i}
            ref={el => { p.el = el; }}
            className="dust-particle"
            style={{
              width: p.size, height: p.size, background: p.color,
              boxShadow: `0 0 ${p.size*2}px ${p.color}, 0 0 ${p.size*4}px ${p.color}77`,
              opacity: p.baseOpacity, transform: 'translate(0px,0px)', top: 0, left: 0
            }}
            onMouseEnter={() => {
              p.hovered = true;
              if (p.el) {
                p.el.style.boxShadow = `0 0 ${p.size*10}px ${p.color}, 0 0 ${p.size*20}px ${p.color}cc, 0 0 ${p.size*36}px ${p.color}66`;
                p.el.style.opacity = '1';
              }
              if (cursorRingRef.current) {
                cursorRingRef.current.style.width = '56px';
                cursorRingRef.current.style.height = '56px';
                cursorRingRef.current.style.borderColor = `${p.color}cc`;
              }
            }}
            onMouseLeave={() => {
              p.hovered = false;
              if (p.el) {
                p.el.style.opacity = String(p.baseOpacity);
                p.el.style.boxShadow = `0 0 ${p.size*2}px ${p.color}, 0 0 ${p.size*4}px ${p.color}77`;
              }
              if (cursorRingRef.current) {
                cursorRingRef.current.style.width = '36px';
                cursorRingRef.current.style.height = '36px';
                cursorRingRef.current.style.borderColor = 'rgba(232,201,122,0.5)';
              }
            }}
          />
        ))}

        <div className="hero-text">
          <h1 className="hero-headline">
            Where Music Meets Moments
          </h1>
          <p className="hero-sub">
            Curating Exquisite Melodies For Your Unforgettable Day
          </p>
          <a href="#" className="hero-cta">
            Explore Our Legacy ↗
          </a>
        </div>

      </section>
    </>
  );
}

export default function Home() {
  return <HeroClient />;
}
