/* The Hospitality Doctor — motion engine (no dependencies, CSP-safe) */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- split headings into words ---------- */
  const splitWords = el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
          w.append(inner); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.tagName !== 'svg') walk(n);
    });
    walk(el);
  };
  $$('.title-1, .large-title').forEach(el => el.classList.add('split'));
  $$('.split').forEach(splitWords);

  /* statement: words light up as you scroll */
  const wordBlocks = $$('[data-words]');
  wordBlocks.forEach(el => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const s = document.createElement('span'); s.className = 'wd'; s.textContent = part; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    el._words = $$('.wd', el);
  });

  /* ---------- staggered lists ---------- */
  const staggerSel = '.rx-list, .hotel-list, .svc, .timeline, .badges, .faq, .contact-list, .stat-group, .footer-grid';
  $$(staggerSel).forEach(list => {
    list.classList.add('stagger');
    [...list.children].forEach((c, i) => c.style.setProperty('--i', i));
  });
  /* sibling reveal delays */
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
  });
  $$('.stat .bar').forEach(b => b.style.setProperty('--p', b.dataset.p));

  /* ---------- in-view triggers ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.split, .stagger, .f-word, .step, .stat').forEach(el => io.observe(el));
  const heroTitle = $('.hero .split');
  if (heroTitle) requestAnimationFrame(() => setTimeout(() => heroTitle.classList.add('in'), 120));

  /* fit the footer wordmark exactly to its container */
  const fw = $('.f-word'), fws = fw && $('span', fw);
  const fit = () => {
    if (!fws) return;
    fws.style.fontSize = '100px';
    const ratio = fw.clientWidth / fws.scrollWidth;
    fws.style.fontSize = `${Math.floor(100 * ratio * 0.995)}px`;
  };
  fit(); addEventListener('resize', fit);
  if (document.fonts) document.fonts.ready.then(fit);

  if (reduce) {
    $$('.split, .stagger, .f-word').forEach(el => el.classList.add('in'));
    wordBlocks.forEach(el => el._words.forEach(w => w.classList.add('on')));
    return;
  }

  /* ---------- scroll-linked effects (single rAF loop) ---------- */
  const bar = $('.scroll-progress span');
  const ring = $('.to-top');
  const stepsWrap = $('.steps-wrap');
  const parallax = $$('[data-parallax]');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    const sp = max > 0 ? scrollY / max : 0;
    if (bar) bar.style.transform = `scaleX(${sp})`;
    if (ring) ring.style.setProperty('--sp', sp.toFixed(3));
    if (stepsWrap) {
      const r = stepsWrap.getBoundingClientRect();
      stepsWrap.style.setProperty('--draw', clamp((vh * .85 - r.top) / (r.height + vh * .2), 0, 1).toFixed(3));
    }
    wordBlocks.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * .9 - r.top) / (vh * .55 + r.height * .5), 0, 1);
      const n = Math.round(p * el._words.length);
      el._words.forEach((w, i) => w.classList.toggle('on', i < n));
    });
    parallax.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const off = ((r.top + r.height / 2) - vh / 2) * -0.08;
      img.style.setProperty('--py', `${off.toFixed(1)}px`);
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  if (ring) ring.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- pointer effects (desktop) ---------- */
  if (fine) {
    const glow = $('.cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, glowRaf = null;
    const glowLoop = () => {
      gx += (tx - gx) * .12; gy += (ty - gy) * .12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      glowRaf = Math.abs(tx - gx) + Math.abs(ty - gy) > .5 ? requestAnimationFrame(glowLoop) : null;
    };
    if (glow) addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; glow.classList.add('on');
      if (!glowRaf) glowRaf = requestAnimationFrame(glowLoop);
    }, { passive: true });

    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', `${(x - .5) * 8}deg`); c.style.setProperty('--rx', `${(.5 - y) * 8}deg`);
        c.style.setProperty('--gx', `${x * 100}%`); c.style.setProperty('--gy', `${y * 100}%`);
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });

    $$('.magnetic').forEach(m => {
      m.addEventListener('pointermove', e => {
        const r = m.getBoundingClientRect();
        m.style.setProperty('--mx', `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px`);
        m.style.setProperty('--my', `${((e.clientY - r.top - r.height / 2) * .32).toFixed(1)}px`);
      });
      m.addEventListener('pointerleave', () => { m.style.setProperty('--mx', '0px'); m.style.setProperty('--my', '0px'); });
    });

    const hero = $('.hero'), media = $('.hero-visual .hero-media'), vitals = $$('.hero .vital');
    if (hero && media) {
      hero.addEventListener('pointermove', e => {
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        media.style.setProperty('--ry', `${x * 10}deg`); media.style.setProperty('--rx', `${-y * 8}deg`);
        vitals.forEach((v, i) => { v.style.translate = `${x * (14 + i * 8)}px ${y * (14 + i * 8)}px`; });
      });
      hero.addEventListener('pointerleave', () => { media.style.setProperty('--rx', '0deg'); media.style.setProperty('--ry', '0deg'); vitals.forEach(v => { v.style.translate = ''; }); });
    }
  }

  /* ---------- gold particle field ---------- */
  const cvs = $('.hero .particles');
  const startParticles = () => {
  if (cvs) {
    const ctx = cvs.getContext('2d');
    let w, h, pts = [], raf = null, visible = true, mx = -999, my = -999;
    const dark = matchMedia('(prefers-color-scheme: dark)');
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cvs.clientWidth; h = cvs.clientHeight;
      cvs.width = w * dpr; cvs.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w * h / 14000, 30, 110));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .4, vx: (Math.random() - .5) * .2, vy: -(Math.random() * .35 + .08), a: Math.random() * .6 + .25, t: Math.random() * 6.28 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const rgb = dark.matches ? '236,195,105' : '150,110,40';
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.t += .02;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 12000) { const f = (12000 - d2) / 12000 * 1.4; p.x += dx / 60 * f; p.y += dy / 60 * f; }
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6; else if (p.x > w + 6) p.x = -6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(${rgb},${(p.a * (.55 + .45 * Math.sin(p.t))).toFixed(3)})`;
        ctx.fill();
      }
      /* constellation lines near the pointer */
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]; if ((a.x - mx) ** 2 + (a.y - my) ** 2 > 40000) continue;
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d < 9000) { ctx.strokeStyle = `rgba(${rgb},${(.25 * (1 - d / 9000)).toFixed(3)})`; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      raf = visible ? requestAnimationFrame(draw) : null;
    };
    size(); draw();
    addEventListener('resize', size);
    cvs.parentElement.addEventListener('pointermove', e => { const r = cvs.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cvs.parentElement.addEventListener('pointerleave', () => { mx = my = -999; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) draw(); }).observe(cvs);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible && !raf) draw(); });
  }
  };
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
  if (document.readyState === 'complete') idle(startParticles); else addEventListener('load', () => idle(startParticles), { once: true });
})();
