(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Background photos: [data-img] loads as it nears the screen, [data-img-late]
  // (extra hero slides) once the page has loaded, so the first screen comes in first
  const setImg = (el, url) => el.style.setProperty('--img', `url('${url}')`);
  const lazy = $$('[data-img]');
  if ('IntersectionObserver' in window) {
    const imgIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      setImg(e.target, e.target.dataset.img);
      imgIO.unobserve(e.target);
    }), { rootMargin: '800px 0px' });
    lazy.forEach((el) => imgIO.observe(el));
  } else lazy.forEach((el) => setImg(el, el.dataset.img));
  const late = () => $$('[data-img-late]').forEach((el) => setImg(el, el.dataset.imgLate));
  document.readyState === 'complete' ? late() : addEventListener('load', late, { once: true });

  // Scroll progress line in the header
  const bar = $('#progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Smooth "rolling" scroll. lerp 0.1 matches the reference: one wheel tick
  // glides out over ~0.8s with an exponential ease-out.
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // In-page anchors glide too, stopping below the fixed header
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -51 });
    });
  }

  // Menu dropdown
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  if (menu && menuBtn) {
    const setMenu = (open) => {
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('[data-close], a')) setMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  // Live clock labels
  const clocks = $$('[data-clock]');
  const tick = () => {
    const d = new Date();
    const txt = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ', ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    clocks.forEach((c) => (c.textContent = txt));
  };
  if (clocks.length) { tick(); setInterval(tick, 30000); }

  // Rotating highlighted word in the home hero
  const swap = $('#swap');
  if (swap) {
    const words = ['get found', 'win trust', 'book calls', 'make sales'];
    let wi = 0;
    const measure = (txt) => {
      const probe = document.createElement('span');
      probe.textContent = txt;
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      swap.appendChild(probe);
      const w = probe.offsetWidth;
      probe.remove();
      return w;
    };
    const padX = () => { const cs = getComputedStyle(swap); return parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight); };
    const fit = () => (swap.style.width = measure(words[wi]) + padX() + 'px');
    document.fonts ? document.fonts.ready.then(fit) : fit();
    addEventListener('resize', fit);
    if (!reduced) setInterval(() => {
      wi = (wi + 1) % words.length;
      const old = swap.firstElementChild;
      const next = document.createElement('span');
      next.textContent = words[wi];
      next.className = 'inn';
      next.style.cssText = 'position:absolute;left:' + getComputedStyle(swap).paddingLeft;
      old.classList.add('out');
      swap.appendChild(next);
      fit();
      setTimeout(() => { old.remove(); next.className = ''; next.style.cssText = ''; }, 460);
    }, 2600);
  }

  // Hero background slides + dots
  const slides = $$('.hero__slide'), dots = $$('.hero__dots button');
  if (slides.length) {
    let si = 0, timer;
    const show = (i) => {
      si = i;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show((si + 1) % slides.length), 6000); };
    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); auto(); }));
    auto();
  }

  // Tick meters
  $$('.meter').forEach((m) => { m.innerHTML = '<i></i>'.repeat(+m.dataset.ticks || 24); });
  const fillMeter = (m) => {
    const ticks = $$('i', m), on = Math.round(ticks.length * parseFloat(m.dataset.fill));
    ticks.forEach((t, k) => setTimeout(() => k < on && t.classList.add('on'), reduced ? 0 : k * 40));
  };

  // Count-up numbers
  const countUp = (el) => {
    const end = +el.dataset.count, dur = reduced ? 0 : 1400, t0 = performance.now();
    const step = (t) => {
      const p = dur ? Math.min(1, (t - t0) / dur) : 1;
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Reveal on scroll (also triggers counters and meters inside)
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      $$('[data-count]', el).forEach(countUp);
      $$('.meter', el).forEach(fillMeter);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  // While the loading screen runs, hold reveals so the hero animates in as it clears
  const isLoading = document.documentElement.classList.contains('is-loading');
  const startReveals = () => $$('.reveal').forEach((el) => io.observe(el));
  if (isLoading) addEventListener('tbd:loaded', startReveals, { once: true });
  else startReveals();

  // FAQ: one open at a time
  const qas = $$('.qa');
  qas.forEach((qa) => {
    const toggle = () => {
      const open = !qa.classList.contains('open');
      qas.forEach((o) => { o.classList.remove('open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); });
      if (open) { qa.classList.add('open'); $('.qa__q', qa).setAttribute('aria-expanded', 'true'); }
    };
    $('.qa__q', qa).addEventListener('click', toggle);
    $('.qa__i', qa).addEventListener('click', toggle);
  });

  // Pre-pick "What do you need?": contact.html?need=automation, or any form on the automation page.
  // Links to the contact page from the automation page carry the choice along.
  const onAutomation = document.body.dataset.page === 'automation';
  const wantNeed = new URLSearchParams(location.search).get('need') || (onAutomation ? 'automation' : '');
  if (wantNeed) $$('select[name="need"]').forEach((sel) => {
    const opt = [...sel.options].find((o) => o.value === wantNeed);
    if (opt) opt.selected = opt.defaultSelected = true;
  });
  if (onAutomation) {
    const tag = (a) => { if (a.pathname.endsWith('/contact.html') && !a.search) a.search = '?need=automation'; };
    $$('a[href]').forEach(tag);
    // Links added later (e.g. the chat panel) get tagged as they are clicked
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href]'); if (a) tag(a); }, true);
  }

  // Custom dropdowns: the native <select> stays (hidden) as the form value;
  // a styled button + listbox replaces the plain OS popup
  const dds = [];
  const closeAll = (except) => dds.forEach((d) => d !== except && d.close());
  $$('.field select').forEach((sel) => {
    const field = sel.closest('.field');
    const label = $('.field__l .mono', field)?.textContent.trim() || sel.name;
    const id = 'dd-' + sel.name;
    const box = document.createElement('div');
    box.className = 'dd';
    box.innerHTML = `<button type="button" class="dd__btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}" aria-label="${label}"><span class="dd__val"></span></button>` +
      `<ul class="dd__list" id="${id}" role="listbox" aria-label="${label}">` + [...sel.options].map((o, k) => `<li role="option" data-i="${k}">${o.textContent}</li>`).join('') + '</ul>';
    sel.after(box);
    sel.classList.add('dd__native');
    sel.tabIndex = -1;
    const btn = $('.dd__btn', box), val = $('.dd__val', box), items = $$('li', box);
    let active = 0;
    const sync = () => {
      val.textContent = sel.options[sel.selectedIndex].textContent;
      items.forEach((li, k) => li.setAttribute('aria-selected', String(k === sel.selectedIndex)));
    };
    const highlight = (k) => { active = (k + items.length) % items.length; items.forEach((li, i) => li.classList.toggle('is-active', i === active)); };
    const d = {
      open() { closeAll(d); box.classList.add('open'); field.classList.add('dd-open'); btn.setAttribute('aria-expanded', 'true'); highlight(sel.selectedIndex); },
      close() { box.classList.remove('open'); field.classList.remove('dd-open'); btn.setAttribute('aria-expanded', 'false'); },
    };
    dds.push(d);
    const pick = (k) => { sel.selectedIndex = k; sel.dispatchEvent(new Event('change', { bubbles: true })); sync(); d.close(); btn.focus(); };
    btn.addEventListener('click', (e) => { e.preventDefault(); box.classList.contains('open') ? d.close() : d.open(); });
    // preventDefault stops the wrapping <label> from forwarding the click to the hidden select
    $('.dd__list', box).addEventListener('click', (e) => { e.preventDefault(); const li = e.target.closest('li'); if (li) pick(+li.dataset.i); });
    items.forEach((li, k) => li.addEventListener('mouseenter', () => highlight(k)));
    btn.addEventListener('keydown', (e) => {
      const isOpen = box.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen) d.open(); else highlight(active + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape' && isOpen) { e.preventDefault(); d.close(); }
      else if (e.key === 'Tab') d.close();
    });
    sel.form?.addEventListener('reset', () => setTimeout(sync));
    sync();
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.dd')) closeAll(); });

  // Contact heading greets whoever is typing: "Say hello." -> "Hello, Priya."
  const greet = $('[data-greet]');
  const greetIn = greet && $('input[name="name"]', greet.closest('section'));
  if (greetIn) {
    const base = greet.textContent;
    greetIn.addEventListener('input', () => {
      const first = greetIn.value.trim().split(/\s+/)[0].slice(0, 18);
      if (!first) { greet.textContent = base; return; }
      const hl = document.createElement('span');
      hl.className = 'hl';
      hl.textContent = first;
      greet.replaceChildren('Hello, ', hl, '.');
    });
  }

  // Forms (front-end only: validate, then swap the fields for a thank-you panel)
  $$('[data-form]').forEach((form) => {
    const msg = $('.form__ok', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('input[required]', form).forEach((inp) => {
        const bad = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value));
        inp.closest('.field').classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      if (msg) {
        const first = (form.elements.namedItem('name')?.value || '').trim().split(/\s+/)[0];
        const slot = $('[data-ok-name]', msg);
        if (slot) slot.textContent = first ? ', ' + first : '';
        const need = form.elements.namedItem('need');
        const needSlot = $('[data-ok-need]', msg);
        if (need && needSlot) needSlot.textContent = need.options[need.selectedIndex].dataset.ok || 'your request';
        form.classList.add('is-sent');
        msg.hidden = false;
        msg.focus({ preventScroll: true });
      }
      form.reset();
    });
    $('[data-ok-again]', form)?.addEventListener('click', () => {
      form.classList.remove('is-sent');
      msg.hidden = true;
      $('input', form)?.focus();
    });
  });

  // Scramble on hover: letters flicker through mixed-script glyphs, then
  // settle back to the real text from left to right (~320ms in total).
  const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユラリルレロワン木水火土金日月山川田人口目0123456789#%&*+=?<>[]{}/|~^';
  const DURATION = 320, STEP = 90, HOLD = 0.35;
  const rand = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const setupScramble = (el) => {
    if (el._fx) return;
    // Old roll markup had two copies of the label; keep one
    const kids = [...el.children];
    const text = (kids.length === 2 && kids[0].textContent === kids[1].textContent ? kids[0].textContent : el.textContent).trim();
    if (!text) return;
    // Layers live in an inner wrapper so the element keeps its own padding/layout
    const wrap = document.createElement('span');
    wrap.className = 'scr';
    const mk = (cls, hidden) => {
      const sp = document.createElement('span');
      sp.className = cls; sp.textContent = text;
      if (hidden) sp.setAttribute('aria-hidden', 'true');
      wrap.appendChild(sp);
      return sp;
    };
    mk('scr__size', true);
    el._fx = mk('scr__fx', true);
    mk('sr-only', false);
    el._text = text;
    el.textContent = '';
    el.appendChild(wrap);
    el.setAttribute('data-scr', '');
  };
  const runScramble = (el) => {
    const text = el._text, fx = el._fx, n = text.length;
    cancelAnimationFrame(el._raf);
    const t0 = performance.now();
    let step = -1, glyphs = [];
    const frame = (now) => {
      const t = now - t0;
      const s = Math.floor(t / STEP);
      if (s !== step) { step = s; glyphs = [...text].map((c) => (c === ' ' ? ' ' : rand())); }
      const start = DURATION * HOLD;
      let out = '';
      for (let i = 0; i < n; i++) {
        const settleAt = start + ((DURATION - start) * (i + 1)) / n;
        out += t >= settleAt ? text[i] : glyphs[i];
      }
      fx.textContent = out;
      if (t < DURATION) el._raf = requestAnimationFrame(frame);
      else fx.textContent = text;
    };
    el._raf = requestAnimationFrame(frame);
  };
  // Loading screen: label scrambles in, counter eases 000→100%, label scrambles
  // to the tagline near the end, then the cover breaks into tiles that drop away
  // in a diagonal wave. Runs once per session (flag set in each page's <head>).
  if (isLoading) {
    const root = document.documentElement;
    const COUNT_MS = 2300, HOLD_MS = 450, COLS = 10;
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = '<div class="loader__tiles"></div><div class="loader__box"><div class="loader__row"><span class="loader__label"></span><span class="loader__pct mono">000%</span></div><div class="loader__bar"><i class="loader__fill"></i><i class="loader__glow"></i></div></div>';
    document.body.appendChild(loader);
    root.classList.add('loader-mounted');
    lenis?.stop();

    // Tile grid sized to the viewport: square-ish tiles, 10 across
    const tiles = $('.loader__tiles', loader);
    const rows = Math.ceil(innerHeight / (innerWidth / COLS));
    tiles.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    tiles.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) {
      const t = document.createElement('i');
      t.style.setProperty('--d', `${c * 45 + r * 30}ms`);
      tiles.appendChild(t);
    }
    const lastDelay = (COLS - 1) * 45 + (rows - 1) * 30 + 420;

    const label = $('.loader__label', loader), pct = $('.loader__pct', loader);
    const fill = $('.loader__fill', loader), glow = $('.loader__glow', loader);
    // Glyphs settle left to right into `to` over `dur` ms
    const scrambleTo = (to, dur) => {
      const t0 = performance.now();
      let step = -1, glyphs = [];
      const frame = (now) => {
        const t = now - t0, s = Math.floor(t / STEP);
        if (s !== step) { step = s; glyphs = [...to].map((ch) => (ch === ' ' ? ' ' : rand())); }
        let out = '';
        for (let i = 0; i < to.length; i++) out += t >= dur * HOLD + (dur * (1 - HOLD) * (i + 1)) / to.length ? to[i] : glyphs[i];
        label.textContent = out;
        if (t < dur) requestAnimationFrame(frame); else label.textContent = to;
      };
      requestAnimationFrame(frame);
    };
    scrambleTo('MANGOS', 420);

    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    let swapped = false;
    const t0 = performance.now();
    const count = (now) => {
      const p = Math.min(1, (now - t0) / COUNT_MS);
      const v = Math.round(ease(p) * 100);
      pct.textContent = String(v).padStart(3, '0') + '%';
      fill.style.width = v + '%';
      glow.style.left = v + '%';
      if (!swapped && v >= 77) { swapped = true; scrambleTo('Websites that work.', 480); }
      if (p < 1) requestAnimationFrame(count);
      else setTimeout(exit, HOLD_MS);
    };
    requestAnimationFrame(count);

    function exit() {
      loader.classList.add('is-out');
      dispatchEvent(new Event('tbd:loaded'));
      setTimeout(() => {
        loader.remove();
        root.classList.remove('is-loading', 'loader-mounted');
        lenis?.start();
        try { sessionStorage.setItem('tbd-loaded', '1'); } catch (e) { /* storage blocked: loader just replays */ }
      }, lastDelay + 50);
    }
  }

  if (!reduced) {
    const targets =$$('.nav__links a, .nav__pill, .menu__links a, .btn__label, .tag, .case__name');
    targets.forEach(setupScramble);
    // Hovering the link, button or card runs every scramble label inside it
    const triggers = new Set(targets.map((el) => el.closest('a, button, .case') || el));
    triggers.forEach((tr) => tr.addEventListener('mouseenter', () => {
      const inner = tr._fx ? [tr] : $$('[data-scr]', tr);
      inner.forEach(runScramble);
    }));
  }

})();
