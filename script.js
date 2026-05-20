// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-answer').style.maxHeight = '0';
    });

    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// Nav background on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.style.borderBottom = '1px solid rgba(0,0,0,0.08)';
    nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
  } else {
    nav.style.borderBottom = 'none';
    nav.style.boxShadow = 'none';
  }
}, { passive: true });

// Draggable currency circles with gravity + stacking collisions
(function () {
  const section  = document.querySelector('.send-money');
  const GRAVITY     = 0.55;
  const BOUNCE      = 0.15;
  const FRICTION    = 0.88;
  const RESTITUTION = 0.15;
  const SLEEP_SPEED = 0.4;
  let dropped = false;
  let loopRunning = false;

  const circles = Array.from(document.querySelectorAll('.flag-circle'));
  const state = new Map(); // circle -> { px, py, vx, vy, dragging, active }

  circles.forEach(c => {
    state.set(c, { px: 0, py: -200, vx: 0, vy: 0, dragging: false, active: false });
    c.style.cursor = 'grab';
    initDrag(c);
  });

  function initDrag(circle) {
    let startX, startY, origLeft, origTop, prevX, prevY;

    function startDrag(clientX, clientY) {
      const s  = state.get(circle);
      const sr = section.getBoundingClientRect();
      const cr = circle.getBoundingClientRect();
      s.px = cr.left - sr.left;
      s.py = cr.top  - sr.top;
      s.vx = 0; s.vy = 0;
      s.dragging = true;

      circle.style.position = 'absolute';
      circle.style.bottom   = 'auto';
      circle.style.margin   = '0';
      circle.style.left     = s.px + 'px';
      circle.style.top      = s.py + 'px';
      circle.style.zIndex   = '30';
      section.appendChild(circle);

      startX = clientX; startY = clientY;
      origLeft = s.px;  origTop = s.py;
      prevX = clientX;  prevY = clientY;
      circle.style.cursor = 'grabbing';
    }

    function onMove(clientX, clientY) {
      const s = state.get(circle);
      if (!s.dragging) return;
      s.vx = clientX - prevX;
      s.vy = clientY - prevY;
      prevX = clientX; prevY = clientY;
      s.px = origLeft + (clientX - startX);
      s.py = origTop  + (clientY - startY);
      circle.style.left = s.px + 'px';
      circle.style.top  = s.py + 'px';
    }

    function endDrag() {
      const s = state.get(circle);
      if (!s.dragging) return;
      s.dragging = false;
      s.active   = true;
      circle.style.cursor = 'grab';
      circle.style.zIndex = '';
      if (!loopRunning) startLoop();
    }

    circle.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', endDrag);
    circle.addEventListener('touchstart', e => startDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    document.addEventListener('touchmove', e => {
      if (!state.get(circle)?.dragging) return;
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  function startLoop() {
    loopRunning = true;
    function loop() {
      const sr     = section.getBoundingClientRect();
      const active = circles.filter(c => { const s = state.get(c); return s.active && !s.dragging; });
      if (active.length === 0) { loopRunning = false; return; }

      active.forEach(c => {
        const s    = state.get(c);
        const size = c.offsetWidth;
        const maxX = sr.width  - size;
        const maxY = sr.height - size;

        // Sleep: if barely moving and on the floor, stop completely
        const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (speed < SLEEP_SPEED && s.py >= maxY - 1) {
          s.vx = 0; s.vy = 0;
          s.py = maxY;
          c.style.left = s.px + 'px';
          c.style.top  = s.py + 'px';
          return;
        }

        s.vy += GRAVITY;
        s.vx *= FRICTION;
        s.px += s.vx;
        s.py += s.vy;

        if (s.py >= maxY) {
          s.py  = maxY;
          s.vy *= -BOUNCE;
          s.vx *= FRICTION;
          // Clamp tiny bounces immediately
          if (Math.abs(s.vy) < 1.2) s.vy = 0;
          if (Math.abs(s.vx) < 0.3) s.vx = 0;
        }
        if (s.py < 0)     { s.py = 0;    s.vy = Math.abs(s.vy) * BOUNCE; }
        if (s.px >= maxX) { s.px = maxX; s.vx *= -BOUNCE; }
        if (s.px < 0)     { s.px = 0;    s.vx *= -BOUNCE; }

        c.style.left = s.px + 'px';
        c.style.top  = s.py + 'px';
      });

      // Circle-circle collision
      const allActive = circles.filter(c => !state.get(c).dragging && state.get(c).active);
      for (let i = 0; i < allActive.length; i++) {
        for (let j = i + 1; j < allActive.length; j++) {
          const a = allActive[i], b = allActive[j];
          const sa = state.get(a), sb = state.get(b);
          const r  = a.offsetWidth / 2;
          const ax = sa.px + r, ay = sa.py + r;
          const bx = sb.px + r, by = sb.py + r;
          const dx = bx - ax, dy = by - ay;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = r * 2;

          if (dist < minDist && dist > 0) {
            // Push apart
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist, ny = dy / dist;
            sa.px -= nx * overlap; sa.py -= ny * overlap;
            sb.px += nx * overlap; sb.py += ny * overlap;

            // Exchange velocity along collision normal
            const relVx = sb.vx - sa.vx, relVy = sb.vy - sa.vy;
            const dot   = relVx * nx + relVy * ny;
            if (dot < 0) {
              const impulse = dot * RESTITUTION;
              sa.vx += impulse * nx; sa.vy += impulse * ny;
              sb.vx -= impulse * nx; sb.vy -= impulse * ny;
              // Damp post-collision velocity to prevent endless jitter
              sa.vx *= 0.92; sa.vy *= 0.92;
              sb.vx *= 0.92; sb.vy *= 0.92;
            }
          }
        }
      }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function dropAll() {
    if (dropped) return;
    dropped = true;
    const sr   = section.getBoundingClientRect();
    const size = 128;

    circles.forEach(circle => {
      const s  = state.get(circle);
      s.px     = Math.random() * (sr.width - size);
      s.py     = 0;
      s.vx     = (Math.random() - 0.5) * 4;
      s.vy     = Math.random() * 2;

      circle.style.position = 'absolute';
      circle.style.bottom   = 'auto';
      circle.style.margin   = '0';
      circle.style.left     = s.px + 'px';
      circle.style.top      = s.py + 'px';
      section.appendChild(circle);

      setTimeout(() => {
        s.active = true;
        if (!loopRunning) startLoop();
      }, Math.random() * 1000);
    });
  }

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { dropAll(); }
  }, { threshold: 0.2 }).observe(section);
})();

// Scroll-reveal: Add → Send → Convert
// Scroll down  → item shows when its centre enters from below (crosses 88% mark)
// Scroll up    → item hides when its centre exits from below (crosses 88% mark again)
const actionItems = document.querySelectorAll('.action-item');
let lastScrollY = window.scrollY;

function updateActionItems() {
  const vh = window.innerHeight;
  const scrollY = window.scrollY;
  const goingDown = scrollY > lastScrollY;
  lastScrollY = scrollY;

  actionItems.forEach(item => {
    const { top, height } = item.getBoundingClientRect();
    const centre = top + height / 2;

    if (goingDown) {
      if (centre > vh * 0.12 && centre < vh * 0.88) {
        item.classList.add('visible');
      } else if (centre < vh * 0.12) {
        item.classList.remove('visible');
      }
    } else {
      if (centre > vh * 0.12 && centre < vh * 0.88) {
        item.classList.add('visible');
      } else if (centre > vh * 0.88) {
        item.classList.remove('visible');
      }
    }
  });
}

window.addEventListener('scroll', updateActionItems, { passive: true });
updateActionItems();

// Animate steps in How it works
const stepItems = document.querySelectorAll('.step-item');
let current = 0;
setInterval(() => {
  stepItems.forEach(s => s.classList.remove('active'));
  current = (current + 1) % stepItems.length;
  stepItems[current].classList.add('active');
}, 2500);
