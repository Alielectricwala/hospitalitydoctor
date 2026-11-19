/* The Hospitality Doctor — interactions (no dependencies, CSP-safe: no inline code) */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    cio.unobserve(el);
    if (reduce) return;
    const t0 = performance.now(), dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- nav: hairline on scroll, active section ---------- */
  const nav = $('.nav');
  const links = $$('.nav-links a');
  const targets = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const dock = $('.dock'), book = $('#book'), hero = $('.hero');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    nav.classList.toggle('scrolled', scrollY > 8);
    let cur = null;
    targets.forEach(t => { if (t.getBoundingClientRect().top < innerHeight * .35) cur = t; });
    links.forEach(a => a.classList.toggle('active', !!cur && a.getAttribute('href') === '#' + cur.id));
    if (dock) {
      const past = hero.getBoundingClientRect().bottom < 0;
      const r = book.getBoundingClientRect();
      const atBook = r.top < innerHeight && r.bottom > 0;
      const show = past && !atBook && consentBox.hidden;
      dock.classList.toggle('show', show);
      dock.setAttribute('aria-hidden', String(!show));
      $('a', dock).tabIndex = show ? 0 : -1;
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- menu sheet ---------- */
  const menuBtn = $('.menu-btn'), sheetWrap = $('#menu-sheet');
  const sheet = sheetWrap && $('.sheet', sheetWrap);
  const openSheet = () => {
    sheetWrap.hidden = false; menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    $('a', sheet).focus({ preventScroll: true });
  };
  const closeSheet = (restore = true) => {
    if (sheetWrap.hidden) return;
    const done = () => {
      sheetWrap.hidden = true; sheet.classList.remove('closing'); sheetWrap.classList.remove('closing');
      document.body.style.overflow = ''; menuBtn.setAttribute('aria-expanded', 'false');
      if (restore) menuBtn.focus({ preventScroll: true });
    };
    if (reduce) return done();
    sheet.classList.add('closing'); sheetWrap.classList.add('closing');
    setTimeout(done, 280);
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', openSheet);
    sheetWrap.addEventListener('click', e => {
      if (e.target === sheetWrap) closeSheet();
      if (e.target.closest('a')) closeSheet(false);
    });
    addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
    /* swipe down on grabber/sheet to dismiss */
    let y0 = null;
    sheet.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchend', e => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 60) closeSheet(); y0 = null; });
  }

  /* ---------- segmented control ---------- */
  const tabs = $$('[role="tab"]');
  const thumb = $('.seg-thumb');
  const select = (t, focus) => {
    tabs.forEach((x, i) => {
      const on = x === t;
      x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
      if (on) thumb.style.transform = `translateX(${i * 100}%)`;
    });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  /* ---------- quick check ---------- */
  const dx = $('#dx-form');
  let dxSummary = '';
  if (dx) {
    const qs = $$('.dx-q', dx), result = $('.dx-result', dx), back = $('.dx-back', dx);
    const count = $('.dx-count', dx), bar = $('.meter span', dx);
    const RX = {
      people: ['Your team needs ownership.', [['The Invisible Manager', 'Supervisors who run the shift without you'], ['Comfort Is A Cage', 'Ownership, mindset and confidence'], ['Guest Experience Excellence', 'WOW moments and service recovery']]],
      process: ['Your hotel needs a system.', [['The Operational Bible', 'SOPs, job descriptions and checklists'], ['Peak Hour Perfection', 'Task allocation and service flow'], ['New Joiner Integration', 'Consistent onboarding']]],
      profit: ['Revenue is leaking.', [['Revenue Mastery Bootcamp', 'Upselling, cross-selling and guest spend'], ['Revenue Management Excellence', 'Pricing, distribution and forecasting'], ['MIS & Dashboards', 'Track what matters every day']]],
      healthy: ['Healthy, with room to grow.', [['Leadership Development', 'Grow your next layer of leaders'], ['Revenue Mastery Bootcamp', 'Turn good service into higher spend'], ['MIS & Dashboards', 'Keep the vitals visible']]]
    };
    let step = 0;
    const show = n => {
      step = n; qs.forEach((q, i) => { q.hidden = i !== n; });
      back.disabled = n === 0;
      count.textContent = `${n + 1} of ${qs.length}`;
      bar.style.width = `${((n + 1) / qs.length) * 100}%`;
    };
    const finish = () => {
      const score = { people: 0, process: 0, profit: 0 };
      qs.forEach(q => { const v = $('input:checked', q); if (v) { const [k, s] = v.value.split(':'); score[k] += +s; } });
      const total = score.people + score.process + score.profit;
      const key = total <= 2 ? 'healthy' : Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
      const [title, meds] = RX[key];
      $('.dx-title', dx).textContent = title;
      const ol = $('.dx-meds', dx); ol.textContent = '';
      meds.forEach(([b, s]) => {
        const li = document.createElement('li'), bb = document.createElement('b'), ss = document.createElement('span');
        bb.textContent = b; ss.textContent = s; li.append(bb, ss); ol.append(li);
      });
      qs.forEach(q => { q.hidden = true; });
      result.hidden = false; dx.classList.add('done');
      dxSummary = `Quick check result: ${title} Suggested: ${meds.map(m => m[0]).join(', ')}.`;
      const msg = $('#f-message');
      if (msg && !msg.value.trim()) msg.value = dxSummary + '\n\n';
    };
    dx.addEventListener('change', e => {
      if (!e.target.matches('input[type=radio]')) return;
      setTimeout(() => (step < qs.length - 1 ? show(step + 1) : finish()), reduce ? 0 : 240);
    });
    back.addEventListener('click', () => step > 0 && show(step - 1));
    $('.dx-reset', dx).addEventListener('click', () => { dx.reset(); result.hidden = true; dx.classList.remove('done'); show(0); });
    dx.addEventListener('submit', e => e.preventDefault());
    show(0);
  }

  /* ---------- booking form: validation + spam protection ---------- */
  const form = $('#book-form');
  if (form) {
    const t = $('#f-t'); t.value = String(Date.now());
    const status = $('.form-status', form);
    const rules = {
      name: v => v.trim().length >= 2 || 'Please enter your name.',
      hotel: v => v.trim().length >= 2 || 'Please tell us your hotel or property.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      phone: v => !v.trim() || /^[+0-9 ()-]{7,20}$/.test(v.trim()) || 'Please enter a valid phone number, or leave it blank.',
      message: v => v.trim().length >= 10 || 'Please add a few words (at least 10 characters).'
    };
    const setErr = (name, msg) => {
      const field = form.elements[name], wrap = field.closest('.field'), err = $('#e-' + name);
      if (wrap) wrap.classList.toggle('invalid', !!msg);
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) field.setAttribute('aria-describedby', 'e-' + name); else field.removeAttribute('aria-describedby');
      err.textContent = msg || '';
    };
    const check = name => {
      if (name === 'consent') { const ok = form.elements.consent.checked; setErr('consent', ok ? '' : 'Please accept the Privacy Policy to continue.'); return ok; }
      const r = rules[name](form.elements[name].value); setErr(name, r === true ? '' : r); return r === true;
    };
    Object.keys(rules).forEach(n => {
      form.elements[n].addEventListener('blur', () => { if (form.elements[n].value) check(n); });
      form.elements[n].addEventListener('input', () => { if (form.elements[n].getAttribute('aria-invalid') === 'true') check(n); });
    });
    form.elements.consent.addEventListener('change', () => check('consent'));

    const el = (tag, attrs, text) => { const n = document.createElement(tag); Object.assign(n, attrs); if (text) n.textContent = text; return n; };
    const showError = msg => {
      status.hidden = false; status.className = 'form-status fail'; status.textContent = msg + ' You can also reach us on ';
      status.append(el('a', { href: 'https://wa.me/919920459695', target: '_blank', rel: 'noopener' }, 'WhatsApp'), ' or at ',
        el('a', { href: 'mailto:sanchita@srkhospitality.net' }, 'sanchita@srkhospitality.net'), '.');
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.hidden = true;
      const ok = [...Object.keys(rules), 'consent'].map(check).every(Boolean);
      if (!ok) { const first = $('[aria-invalid="true"]', form); if (first) first.focus(); return; }
      form.classList.add('sending');
      const data = Object.fromEntries(new FormData(form));
      data.consent = form.elements.consent.checked;
      try {
        const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Something went wrong.');
        const tpl = $('#done-tpl');
        form.replaceChildren(tpl.content.cloneNode(true));
        form.setAttribute('tabindex', '-1'); form.focus();
        if (window.va) window.va('event', { name: 'lead_submitted' });
      } catch (err) {
        showError(String(err.message || 'Something went wrong.'));
      } finally {
        form.classList.remove('sending');
      }
    });
  }

  /* ---------- FAQ: one open at a time ---------- */
  const dets = $$('.faq details');
  dets.forEach(d => d.addEventListener('toggle', () => { if (d.open) dets.forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------- consent + analytics (Vercel Web Analytics & Speed Insights) ---------- */
  const KEY = 'thd-consent-v1';
  const consentBox = $('#consent') || { hidden: true };
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch { /* storage blocked */ } }
  };
  const loadAnalytics = () => {
    if (window.__thdAnalytics || !/^https:$/.test(location.protocol)) return;
    window.__thdAnalytics = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    ['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js'].forEach(src => {
      const s = document.createElement('script'); s.src = src; s.defer = true; document.head.appendChild(s);
    });
  };
  const choice = store.get();
  if (choice === 'granted') loadAnalytics();
  else if (!choice && consentBox.nodeType) setTimeout(() => { consentBox.hidden = false; onScroll(); }, 1200);
  $$('[data-consent]').forEach(b => b.addEventListener('click', () => {
    store.set(b.dataset.consent);
    consentBox.hidden = true;
    if (b.dataset.consent === 'granted') loadAnalytics();
    onScroll();
  }));
  $$('[data-cookie-settings]').forEach(b => b.addEventListener('click', () => { consentBox.hidden = false; $('[data-consent="granted"]', consentBox).focus(); }));

  onScroll();
})();
