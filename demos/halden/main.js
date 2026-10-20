gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const $$ = (s) => gsap.utils.toArray(s);

// Smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync
const lenis = reduce ? null : new Lenis({ lerp: 0.1, anchors: true });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

document.fonts.ready.then(() => {
  if (!intro()) pageIn();
  heroParallax();
  mediaParallax();
  revealLines();
  typeOnView();
  slider();
  marques();
  accordions();
  footerType();
  menu();
  fixedControls();
  unmute();
  pageLinks();
});

// Home intro: labels fade in, letters rise one by one, then the overlay slides up.
// Plays once per browser session; later visits get the normal page wipe.
function intro() {
  const el = $('.intro');
  if (!el) return false;
  let seen = false;
  try {
    seen = sessionStorage.getItem('intro-seen') === '1';
    sessionStorage.setItem('intro-seen', '1');
  } catch {}
  if (reduce || seen) {
    el.remove();
    return false;
  }
  gsap.set('.cover', { yPercent: -100 });
  lenis.stop();
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.intro__labels > *', { opacity: 0, duration: 0.6, stagger: 0.15 })
    .from('.intro__mark span', { yPercent: 110, duration: 1.4, stagger: 0.09 }, '-=0.2')
    .to(el, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.35')
    .add(() => {
      el.remove();
      lenis.start();
    })
    .add(revealTitle(), '-=0.6');
  return true;
}

// Every other page load: the black cover wipes up, then the title rises in
function pageIn() {
  const tl = gsap.timeline();
  tl.to('.cover', { yPercent: -100, duration: reduce ? 0 : 1, ease: 'expo.inOut' });
  if (!reduce) tl.add(revealTitle(), '-=0.5');
}

function revealTitle() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const title = $('.hero__title, .page-hero__title');
  if (title) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    tl.from(split.lines, { yPercent: 100, duration: 1.2, stagger: 0.1 });
  }
  const rest = $$('.site-header > *, .hero__blurb, .hero__foot > *, .page-hero > .label, .page-hero__arrow');
  if (rest.length) tl.from(rest, { opacity: 0, duration: 0.8, stagger: 0.05 }, title ? '-=0.9' : 0);
  return tl;
}

// Clicking a page link drops the cover back down before navigating
function pageLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href$=".html"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    e.preventDefault();
    gsap.fromTo('.cover', { yPercent: 100 }, {
      yPercent: 0,
      duration: reduce ? 0 : 0.8,
      ease: 'expo.inOut',
      onComplete: () => { location.href = a.href; },
    });
  });
  // Coming back with the browser's back button restores the page with the cover down
  addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set('.cover', { yPercent: -100 });
  });
}

function heroParallax() {
  if (reduce || !$('.hero')) return;
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__media', { yPercent: 12, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__content', { yPercent: -30, ease: 'none', scrollTrigger: { ...st } });
}

// Full-bleed images drift slightly slower than the page
function mediaParallax() {
  if (reduce) return;
  $$('.media').forEach((m) => {
    gsap.fromTo(m.querySelector('.media__img'), { yPercent: -8 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

// Large paragraphs: lines slide up out of a mask as they scroll into view
function revealLines() {
  if (reduce) return;
  $$('.reveal-lines').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 100,
        duration: 1.2,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      }),
    });
  });
}

// Text that types in letter by letter when it scrolls into view
function typeOnView() {
  if (reduce) return;
  $$('.type-on-view').forEach((el) => {
    const split = SplitText.create(el, { type: 'words,chars' });
    gsap.from(split.chars, {
      opacity: 0,
      duration: 0.01,
      stagger: 0.012,
      delay: Number(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

// Full-bleed slider with a "next image" preview that follows the cursor
function slider() {
  const root = $('.slider');
  if (!root) return;
  const slides = [...root.querySelectorAll('.slide')];
  const cursor = $('.cursor');
  const thumb = cursor.querySelector('.cursor__thumb');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'expo.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'expo.out' });
  let current = 0;
  let busy = false;

  const setThumb = () => {
    const next = slides[(current + 1) % slides.length];
    thumb.style.setProperty('--bg', next.style.getPropertyValue('--bg'));
  };

  root.addEventListener('pointerenter', (e) => {
    gsap.set(cursor, { x: e.clientX, y: e.clientY });
    gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'expo.out' });
  });
  root.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
  root.addEventListener('pointerleave', () => {
    gsap.to(cursor, { autoAlpha: 0, scale: 0.8, duration: 0.3 });
  });
  root.addEventListener('click', next);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      next();
    }
  });

  function next() {
    if (busy) return;
    busy = true;
    const prev = slides[current];
    current = (current + 1) % slides.length;
    const incoming = slides[current];
    incoming.classList.add('is-next');
    gsap.fromTo(incoming,
      { clipPath: 'inset(0% 0% 0% 100%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.1,
        ease: 'expo.inOut',
        onComplete() {
          prev.classList.remove('is-active');
          incoming.classList.replace('is-next', 'is-active');
          gsap.set(incoming, { clearProps: 'clipPath' });
          setThumb();
          busy = false;
        },
      });
  }

  gsap.set(cursor, { scale: 0.8 });
  setThumb();
}

// Marques: the name at screen centre turns black and the sticky image swaps to match
function marques() {
  const items = $$('.marques__list li');
  if (!items.length) return;
  const frames = $$('.marques__frame');
  const setActive = (n) => {
    items.forEach((li, k) => li.classList.toggle('is-active', k === n));
    frames.forEach((f, k) => f.classList.toggle('is-active', k === n));
  };
  items.forEach((li, n) => {
    ScrollTrigger.create({
      trigger: li,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && setActive(n),
    });
  });
  setActive(0);
}

function accordions() {
  $$('.accordion__item').forEach((item) => {
    const btn = item.querySelector('button');
    const panel = item.querySelector('.accordion__panel');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open);
      gsap.to(panel, {
        height: open ? 'auto' : 0,
        duration: reduce ? 0 : 0.6,
        ease: 'expo.out',
        onComplete: () => ScrollTrigger.refresh(),
      });
    });
  });
}

// Footer text types in letter by letter once most of the footer is uncovered.
// The footer is sticky, so the trigger is the end of <main> sliding away.
function footerType() {
  if (reduce) return;
  const split = SplitText.create('.footer .type', { type: 'words,chars' });
  gsap.from(split.chars, {
    opacity: 0,
    duration: 0.01,
    stagger: 0.012,
    scrollTrigger: { trigger: 'main', start: 'bottom 40%' },
  });
}

function menu() {
  const btn = $('.burger');
  const panel = $('.menu');
  const links = panel.querySelectorAll('.menu__links a');
  let open = false;

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    .fromTo(panel,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
    .from(links, { yPercent: 100, duration: 1, stagger: 0.06 }, '-=0.4')
    .from('.menu__foot > *', { opacity: 0, duration: 0.6, stagger: 0.05 }, '<');

  const toggle = (state = !open) => {
    open = state;
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.setAttribute('aria-hidden', !open);
    panel.inert = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) {
      tl.timeScale(1).play();
      lenis?.stop();
    } else {
      tl.timeScale(1.6).reverse();
      lenis?.start();
    }
  };

  btn.addEventListener('click', () => toggle());
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) toggle(false);
  });
}

// The "Contact" pill appears once the top section has scrolled away
function fixedControls() {
  const ctrl = $('.fixed-ctrl');
  ScrollTrigger.create({
    trigger: '.hero, .page-hero',
    start: 'bottom top',
    onEnter: () => ctrl.classList.add('is-scrolled'),
    onLeaveBack: () => ctrl.classList.remove('is-scrolled'),
  });
}

function unmute() {
  const btn = $('.unmute');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.textContent = btn.textContent === 'Unmute' ? 'Mute' : 'Unmute';
  });
}
