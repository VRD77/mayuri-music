// STEP 4 - Custom cursor
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  dot.style.left = e.clientX + 'px';
  dot.style.top = e.clientY + 'px';
  ring.style.left = e.clientX + 'px';
  ring.style.top = e.clientY + 'px';
});
document.addEventListener('mouseenter', () => { dot.style.opacity='1'; ring.style.opacity='1'; });
document.addEventListener('mouseleave', () => { dot.style.opacity='0'; ring.style.opacity='0'; });

// MODIFICATION 1 & STEP 12 - Light rays parameters updated
const raysWrap = document.getElementById('rays');
raysWrap.style.cssText = 'position:absolute;width:1000px;height:1000px;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:2;';
for (let i = 0; i < 12; i++) {
  const ray = document.createElement('div');
  const len = 300 + Math.random() * 180; // lengths 300px to 480px
  const angle = i * 30 + Math.random() * 10;
  const opacity = 0.12 + Math.random() * 0.22;
  const delay = Math.random() * 3;
  ray.style.cssText = `
    position:absolute; bottom:50%; left:50%;
    width:1px; height:${len}px;
    background:linear-gradient(to top, rgba(210,160,40,0.55), rgba(210,160,40,0));
    transform-origin:bottom center;
    transform:translateX(-50%) rotate(${angle}deg);
    opacity:${opacity};
    animation:rayPulse ${3 + Math.random()*2}s ${delay}s ease-in-out infinite alternate;
  `;
  raysWrap.appendChild(ray);
}

// STEP 13 - Drag-to-spin chakra with momentum
const chakra = document.getElementById('chakra');
const glowOuter = document.querySelector('.glow-outer');
const glowInner = document.querySelector('.glow-inner');
let angle = 0, velocity = 0, dragging = false;
let lastA = 0, lastT = 0, raf;

function getAngle(e) {
  const r = chakra.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  const p = e.touches ? e.touches[0] : e;
  return Math.atan2(p.clientY - cy, p.clientX - cx) * 180 / Math.PI;
}
function applyRot() {
  chakra.style.transform = `rotate(${angle}deg)`;
}
function idleSpin() {
  angle += 0.15;
  applyRot();
  raf = requestAnimationFrame(idleSpin);
}
function freewheel() {
  if (Math.abs(velocity) < 0.15) { idleSpin(); return; }
  velocity *= 0.972;
  angle += velocity;
  applyRot();
  const speed = Math.abs(velocity);
  const boost = Math.min(speed * 0.4, 0.6);
  if (glowOuter && glowInner) {
      glowOuter.style.transform = `scale(${1 + boost})`;
      glowInner.style.transform = `scale(${1 + boost * 1.3})`;
  }
  raf = requestAnimationFrame(freewheel);
}
chakra.addEventListener('mousedown', e => {
  dragging = true;
  cancelAnimationFrame(raf);
  lastA = getAngle(e);
  lastT = performance.now();
  velocity = 0;
  e.preventDefault();
});
chakra.addEventListener('touchstart', e => {
  dragging = true;
  cancelAnimationFrame(raf);
  lastA = getAngle(e);
  lastT = performance.now();
  velocity = 0;
  e.preventDefault();
}, { passive:false });
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  const a = getAngle(e), now = performance.now();
  let d = a - lastA;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  const dt = Math.max(1, now - lastT);
  velocity = d / dt * 14;
  angle += d; applyRot();
  lastA = a; lastT = now;
});
window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  freewheel();
});
window.addEventListener('touchend', () => {
  if (!dragging) return;
  dragging = false;
  freewheel();
});
idleSpin();

// MODIFICATION 2 - Replace entirely Dust system with orbital physics
const hero = document.querySelector('.hero');
const PARTICLE_COUNT = 38;
const particles = [];
const mouse = { x: window.innerWidth/2, y: window.innerHeight/2 };

// Override mouse tracking to expose it globally to the particle render logic
document.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

const colors = ['#ffe566','#ffd700','#ffcc33','#fff0a0','#ffe8b0','#ffc94a'];

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const el = document.createElement('div');
  el.className = 'dust-particle';

  const size = 1.8 + Math.random() * 4.2;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const baseOpacity = 0.18 + Math.random() * 0.32;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const orbitRadius = 180 + Math.random() * 320;
  const startAngle = Math.random() * Math.PI * 2;
  const speed = (0.0003 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1);
  const drift = { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 };
  const floatAmp = 6 + Math.random() * 14;
  const floatSpeed = 0.0008 + Math.random() * 0.0012;
  const floatOffset = Math.random() * Math.PI * 2;

  el.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    border-radius:50%;
    background:${color};
    box-shadow:0 0 ${size*2}px ${color}, 0 0 ${size*4}px ${color}77;
    opacity:${baseOpacity};
    z-index:4;
    pointer-events:all;
    transform:translate(0,0);
    left:0; top:0;
  `;

  if (hero) hero.appendChild(el);

  // Object scoping fix
  const particleObj = {
    el, size, color, baseOpacity,
    angle: startAngle,
    orbitRadius,
    speed,
    drift,
    floatAmp, floatSpeed, floatOffset,
    x: cx + Math.cos(startAngle) * orbitRadius,
    y: cy + Math.sin(startAngle) * orbitRadius,
    vx: 0, vy: 0,
    hovered: false
  };

  particles.push(particleObj);

  el.addEventListener('mouseenter', () => {
    particleObj.hovered = true;
    el.style.boxShadow = `0 0 ${size*10}px ${color}, 0 0 ${size*20}px ${color}cc, 0 0 ${size*36}px ${color}66`;
    el.style.opacity = '1';
    if (typeof ring !== 'undefined' && ring) {
      ring.style.width = '56px'; ring.style.height = '56px';
      ring.style.borderColor = `${color}cc`;
    }
  });
  el.addEventListener('mouseleave', () => {
    particleObj.hovered = false;
    el.style.opacity = String(baseOpacity);
    el.style.boxShadow = `0 0 ${size*2}px ${color}, 0 0 ${size*4}px ${color}77`;
    if (typeof ring !== 'undefined' && ring) {
      ring.style.width = '36px'; ring.style.height = '36px';
      ring.style.borderColor = 'rgba(232,201,122,0.5)';
    }
  });
}

let lastTime = performance.now();

function animateDust(now) {
  const dt = Math.min(now - lastTime, 32);
  lastTime = now;

  const heroEl = document.querySelector('.hero');
  if (!heroEl) {
      requestAnimationFrame(animateDust);
      return;
  }
  
  const hr = heroEl.getBoundingClientRect();
  const cx = hr.left + hr.width / 2;
  const cy = hr.top + hr.height / 2;

  particles.forEach((p, i) => {
    if (p.hovered) {
      p.el.style.transform = `translate(${p.x - hr.left - p.size/2}px, ${p.y - hr.top - p.size/2}px) scale(3.5)`;
      return;
    }

    p.angle += p.speed * dt;

    const targetX = cx + Math.cos(p.angle) * p.orbitRadius + Math.sin(now * p.floatSpeed + p.floatOffset) * p.floatAmp;
    const targetY = cy + Math.sin(p.angle) * p.orbitRadius + Math.cos(now * p.floatSpeed + p.floatOffset) * p.floatAmp;

    const mdx = mouse.x - p.x;
    const mdy = mouse.y - p.y;
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

  requestAnimationFrame(animateDust);
}

requestAnimationFrame(animateDust);


// MODIFICATION 3 - Page-wide ambient life (Embers)
// Inject drifting glowing embers fading via CSS animated variables over long cycles
for (let i = 0; i < 10; i++) {
  const ember = document.createElement('div');
  const size = 1 + Math.random() * 2;
  ember.className = 'ember';
  ember.style.cssText = `
    position:absolute;
    width:${size}px; height:${size}px;
    border-radius:50%;
    background:#d4a830;
    box-shadow:0 0 ${size*3}px #d4a830, 0 0 ${size*7}px #c8881022;
    top:${10 + Math.random()*80}%;
    left:${10 + Math.random()*80}%;
    opacity:${0.08 + Math.random()*0.15};
    z-index:1; pointer-events:none;
    animation:emberDrift ${12+Math.random()*10}s ${Math.random()*8}s ease-in-out infinite alternate;
  `;
  // Using CSS custom properties so the generic CSS keyframe can generate unique drift trajectories!
  ember.style.setProperty('--dx1', `${Math.random()*30-15}px`);
  ember.style.setProperty('--dy1', `-${20+Math.random()*30}px`);
  ember.style.setProperty('--dx2', `${Math.random()*20-10}px`);
  ember.style.setProperty('--dy2', `${Math.random()*20-10}px`);

  if (hero) hero.appendChild(ember);
}
