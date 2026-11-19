/* The Hospitality Doctor — interactions & motion (no dependencies) */
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- split headline into words ---------- */
  $$('.split').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    el.classList.add('ready');
  });

  /* ---------- reveal on scroll (staggered) ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
    io.observe(el);
  });

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      countIO.unobserve(el);
      if (reduce) { el.textContent = end + suf; return; }
      const t0 = performance.now(), dur = 1800;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 4)));
        el.textContent = v + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* metric rings */
  const ringIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ringIO.unobserve(e.target); } }), { threshold: .4 });
  $$('.metric').forEach(m => ringIO.observe(m));

  /* ---------- nav: scrolled state, progress, active link ---------- */
  const nav = $('.nav'), bar = $('.progress span');
  const links = $$('.nav-links a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, h = doc.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 30);
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    let cur = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s; });
    links.forEach(a => a.classList.toggle('active', cur && a.getAttribute('href') === '#' + cur.id));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* mobile menu */
  const burger = $('.burger'), menu = $('#mobile-menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open); menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- symptom flip cards (tap / keyboard) ---------- */
  $$('.flip').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true')));

  /* ---------- tabs ---------- */
  const tabs = $$('[role="tab"]'), ink = $('.tab-ink');
  const moveInk = t => { ink.style.width = t.offsetWidth + 'px'; ink.style.transform = `translateX(${t.offsetLeft}px)`; };
  const select = t => {
    tabs.forEach(x => {
      const on = x === t;
      x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
    moveInk(t);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus();
    });
  });
  const initInk = () => moveInk(tabs.find(t => t.getAttribute('aria-selected') === 'true'));
  addEventListener('resize', initInk); document.fonts && document.fonts.ready.then(initInk); initInk();

  /* ---------- pointer effects ---------- */
  if (fine && !reduce) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, { passive: true });

    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', `${(x - .5) * 10}deg`); c.style.setProperty('--rx', `${(.5 - y) * 10}deg`);
        c.style.setProperty('--gx', `${x * 100}%`); c.style.setProperty('--gy', `${y * 100}%`);
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });

    $$('.magnetic').forEach(m => {
      m.addEventListener('pointermove', e => {
        const r = m.getBoundingClientRect();
        m.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * .25}px`);
        m.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * .35}px`);
      });
      m.addEventListener('pointerleave', () => { m.style.setProperty('--mx', '0px'); m.style.setProperty('--my', '0px'); });
    });

    /* hero parallax */
    const hv = $('.hero-visual');
    $('.hero').addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      hv.style.transform = `translate(${x * -14}px, ${y * -14}px)`;
    });
  }

  /* ---------- gold particle field ---------- */
  const cvs = $('.particles');
  if (cvs && !reduce) {
    const ctx = cvs.getContext('2d');
    let w, h, dpr, pts = [], raf, visible = true;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cvs.clientWidth; h = cvs.clientHeight;
      cvs.width = w * dpr; cvs.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, w * h / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .3,
        vx: (Math.random() - .5) * .15, vy: -(Math.random() * .3 + .05), a: Math.random() * .6 + .2, t: Math.random() * 6.28
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.t += .02;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        const a = p.a * (.6 + .4 * Math.sin(p.t));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(232,207,148,${a})`; ctx.shadowColor = 'rgba(232,207,148,.8)'; ctx.shadowBlur = 6; ctx.fill();
      }
      raf = visible ? requestAnimationFrame(draw) : null;
    };
    size(); draw();
    addEventListener('resize', size);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) draw(); }).observe(cvs);
  }

  /* ---------- diagnostic quiz ---------- */
  const form = $('#dx-form');
  if (form) {
    const qs = $$('.dx-q', form), result = $('.dx-result', form), back = $('.dx-back', form);
    const count = $('.dx-count', form), prog = $('.dx-progress span', form);
    const RX = {
      people: { title: 'Your team needs ownership.', meds: [
        ['The Invisible Manager', 'Supervisors who run the shift without you.'],
        ['Comfort Is A Cage', 'Ownership, mindset and confidence.'],
        ['Guest Experience Excellence', 'WOW moments and service recovery.']] },
      process: { title: 'Your hotel needs a system.', meds: [
        ['The Operational Bible', 'SOPs, JDs and checklists.'],
        ['Peak Hour Perfection', 'Task allocation and service flow.'],
        ['New Joiner Integration', 'Faster, consistent onboarding.']] },
      profit: { title: 'Revenue is leaking.', meds: [
        ['Revenue Mastery Bootcamp', 'Upselling, cross-selling and guest spend.'],
        ['Revenue Management Excellence', 'Pricing, distribution and forecasting.'],
        ['MIS & Dashboards', 'Track what matters every day.']] },
      healthy: { title: 'Healthy, with room to grow.', meds: [
        ['Leadership Development', 'Grow the next layer of leaders.'],
        ['Revenue Mastery Bootcamp', 'Turn good service into higher spend.'],
        ['MIS & Dashboards', 'Keep the vitals visible.']] }
    };
    let step = 0;
    const show = n => {
      step = n;
      qs.forEach((q, i) => q.hidden = i !== n);
      back.disabled = n === 0;
      count.textContent = `${Math.min(n + 1, qs.length)} / ${qs.length}`;
      prog.style.width = `${((n + 1) / qs.length) * 100}%`;
    };
    const finish = () => {
      const score = { people: 0, process: 0, profit: 0 };
      qs.forEach(q => { const v = $('input:checked', q); if (v) { const [k, s] = v.value.split(':'); score[k] += +s; } });
      const total = score.people + score.process + score.profit;
      const top = total <= 2 ? 'healthy' : Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
      const rx = RX[top];
      $('.dx-title', form).textContent = rx.title;
      const ul = $('.dx-meds', form); ul.textContent = '';
      rx.meds.forEach(([b, s]) => {
        const li = document.createElement('li'), bb = document.createElement('b'), ss = document.createElement('span');
        bb.textContent = b; ss.textContent = s; li.append(bb, ss); ul.appendChild(li);
      });
      const msg = `Hi Sanchita, I ran the Hospitality Doctor check-up. Result: "${rx.title}" Suggested: ${rx.meds.map(m => m[0]).join(', ')}. I'd like to book the 48-hour diagnosis.`;
      $('.dx-wa', form).href = 'https://wa.me/919920459695?text=' + encodeURIComponent(msg);
      qs.forEach(q => q.hidden = true);
      prog.style.width = '100%';
      result.hidden = false; form.classList.add('done');
    };
    form.addEventListener('change', e => {
      if (!e.target.matches('input[type=radio]')) return;
      setTimeout(() => step < qs.length - 1 ? show(step + 1) : finish(), reduce ? 0 : 280);
    });
    back.addEventListener('click', () => step > 0 && show(step - 1));
    $('.dx-reset', form).addEventListener('click', () => { form.reset(); result.hidden = true; form.classList.remove('done'); show(0); });
    form.addEventListener('submit', e => e.preventDefault());
    show(0);
  }

  /* ---------- FAQ: one open at a time ---------- */
  const dets = $$('.faq details');
  dets.forEach(d => d.addEventListener('toggle', () => { if (d.open) dets.forEach(o => o !== d && (o.open = false)); }));
})();
