/* =========================================================================
   Home page intro choreography (GSAP).
   1. white screen with nav + footer; the square image opens from its center
      (clip-path) at the middle of the viewport while the photo scales 1.15 -> 1
   2. the image glides up into its hero-top slot, aligned with the marquee band
   3. the giant marquee wipes up from below (and in from the right) and keeps looping
   4. the two lead lines rise in, the price tag opens from its center
   5. body.intro-done is set; the shell's "Our Selection" button fades in last
   Depends on window.Site (core.js) when present; degrades gracefully without it.
   OWNER: home
   ========================================================================= */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var body = document.body;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var started = false;

  // home.js now owns the pre-hide; replace the inline safety timer with a later one
  if (window.__homeIntroSafety) { clearTimeout(window.__homeIntroSafety); window.__homeIntroSafety = null; }
  var safety = setTimeout(function () { if (!started) reveal(); }, 6000);

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* cubic-bezier(.7,.6,0,1) as a GSAP ease (the site's --standard-easing) */
  function bezierEase(p1x, p1y, p2x, p2y) {
    function a(a1, a2) { return 1 - 3 * a2 + 3 * a1; }
    function b(a1, a2) { return 3 * a2 - 6 * a1; }
    function c(a1) { return 3 * a1; }
    function calc(t, a1, a2) { return ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t; }
    function slope(t, a1, a2) { return 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1); }
    function tForX(x) {
      var t = x;
      for (var i = 0; i < 8; i++) {
        var s = slope(t, p1x, p2x);
        if (Math.abs(s) < 1e-6) break;
        t -= (calc(t, p1x, p2x) - x) / s;
      }
      if (t < 0 || t > 1 || isNaN(t)) { // bisection fallback
        var lo = 0, hi = 1; t = x;
        for (var j = 0; j < 20; j++) { var v = calc(t, p1x, p2x); if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      }
      return t;
    }
    return function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : calc(tForX(x), p1y, p2y); };
  }
  var standardEase = bezierEase(0.7, 0.6, 0, 1);

  /* Final state, no animation (reduced motion, no GSAP, or failure) */
  function reveal() {
    started = true;
    clearTimeout(safety);
    docEl.classList.remove('home-intro-pending');
    finish();
  }

  function finish() {
    body.classList.remove('intro-running');
    if (body.classList.contains('intro-done')) return;
    body.classList.add('intro-done');
    try { document.dispatchEvent(new CustomEvent('home:intro-done')); } catch (e) { /* old browsers */ }
  }

  /* Fallback marquee: only when core.js did not initialize [data-marquee] */
  function ensureMarquee() {
    var el = $('.hero-top [data-marquee]');
    if (!el || !window.gsap) return;
    // core.js marks handled marquees with .is-marquee and wraps the item in a .marquee__track
    if (el.classList.contains('is-marquee') || el._marquee || el.querySelector('.marquee__track')) return;

    var item = el.querySelector('.marquee__item');
    if (!item) return;
    el.setAttribute('data-marquee-fallback', '');
    var track = document.createElement('div');
    track.className = 'marquee__track';
    item.parentNode.insertBefore(track, item);
    track.appendChild(item);
    var w = item.getBoundingClientRect().width;
    if (!w) return;
    var copies = Math.max(2, Math.ceil((window.innerWidth * 2) / w) + 1);
    for (var i = 1; i < copies; i++) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }
    var speed = parseFloat(el.getAttribute('data-speed')) || 95;
    var dir = parseFloat(el.getAttribute('data-direction')) || -1;
    var from = dir < 0 ? 0 : -w;
    var to = dir < 0 ? -w : 0;
    gsap.fromTo(track, { x: from }, { x: to, duration: w / speed, ease: 'none', repeat: -1 });
  }

  function waitForImage(img, maxMs) {
    return new Promise(function (resolve) {
      if (!img) return resolve();
      var done = false;
      function ok() { if (!done) { done = true; resolve(); } }
      setTimeout(ok, maxMs);
      if (img.complete) {
        if (img.decode) img.decode().then(ok, ok); else ok();
      } else {
        img.addEventListener('load', ok, { once: true });
        img.addEventListener('error', ok, { once: true });
      }
    });
  }

  function init() {
    if (started) return;
    started = true;
    clearTimeout(safety);

    // let core.js finish its own data-attribute setup first
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function () {
      requestAnimationFrame(function () {
        try { ensureMarquee(); } catch (e) { /* non-fatal */ }
      });
    });

    var gsap = window.gsap;
    if (!gsap || reduceMotion) { reveal(); return; }

    var visual = $('.hero-visual');
    var img = $('.hero-visual__img');
    var marquee = $('.hero-top .marquee');
    var lines = $$('.hero-lead__inner');
    var tag = $('.hero-tag');
    if (!visual || !marquee) { reveal(); return; }

    body.classList.add('intro-running');

    // Start states (set before the pre-hide class is removed: no flash)
    var vr = visual.getBoundingClientRect();
    var vh = window.innerHeight || docEl.clientHeight;
    var dy = Math.round(vh / 2 - (vr.top + vr.height / 2));

    gsap.set(visual, { y: dy, clipPath: 'inset(50% 50% 50% 50%)' });
    gsap.set(img, { scale: 1.15 });
    gsap.set(marquee, { y: function () { return marquee.offsetHeight * 1.25; }, x: '6vw', skewY: -1.5, clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set(lines, { yPercent: 120 });
    if (tag) gsap.set(tag, { clipPath: 'inset(0% 50% 0% 50%)', autoAlpha: 0 });

    docEl.classList.remove('home-intro-pending');

    waitForImage(img, 1500).then(function () {
      var tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: function () {
          gsap.set([visual, marquee], { clearProps: 'transform,clipPath' });
          gsap.set(img, { clearProps: 'transform' });
          gsap.set(lines, { clearProps: 'transform' });
          if (tag) gsap.set(tag, { clearProps: 'clipPath,opacity,visibility' });
          finish();
        }
      });

      // (fromTo with explicit 4-value insets: the browser normalizes inline insets to shorthand)
      // 1. image opens from its center at the viewport middle
      tl.fromTo(visual, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: standardEase }, 0.1)
        .to(img, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.1)
      // 2. glide up into the hero-top slot
        .to(visual, { y: 0, duration: 1.25, ease: standardEase }, 1.0)
      // 3. marquee wipes up from below (and drifts in from the right)
        .fromTo(marquee, { clipPath: 'inset(0% 0% 100% 0%)' }, { y: 0, x: 0, skewY: 0, clipPath: 'inset(0% 0% -20% 0%)', duration: 1.6 }, 1.55)
      // 4. lead lines + tag
        .to(lines, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 1.85);
      if (tag) tl.fromTo(tag, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 1.1, ease: 'expo.inOut' }, 2.15);
      // 5. hand over to the shell (Our Selection button) slightly before the tail settles
      tl.call(finish, null, 2.75);
    });
  }

  function boot() {
    try {
      if (window.Site && typeof window.Site.ready === 'function') window.Site.ready(init);
      else init();
    } catch (e) {
      reveal();
    }
  }

  if (window.Site && typeof window.Site.ready === 'function') {
    boot();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
