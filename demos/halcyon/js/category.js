/* =========================================================================
   category.js: category pages (also loaded on About for the shared sections).
   1. Hero scroll-grow: the square hero image sticks to the viewport and grows
      into a full-bleed cover while the hero copy scrolls away (scrubbed).
   2. Intro lines (gallery intro, CTA) draw downwards on enter.
   3. Projects slider: diagonal track, drag/swipe with inertia, arrows, keyboard.
   4. Next teaser: the image lifts into a fixed layer, fills the screen, then
      hands over to the next page.
   Depends on core.js (window.Site) + GSAP/ScrollTrigger; degrades without them.
   ========================================================================= */
(function () {
  "use strict";

  var w = window, d = document;
  var Site = w.Site || {};
  var gsap = w.gsap, ST = w.ScrollTrigger;
  var reduced = !!Site.reducedMotion || !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------------------------------------------------------------------
     1. Hero scroll-grow
     --------------------------------------------------------------------- */
  function heroGrow() {
    if (!d.body.classList.contains("category-page")) return;
    var stage = $(".category-hero-scroll-stage");
    if (!stage || !gsap || !ST || reduced) return;
    var sticky = $(".category-hero-cover__sticky", stage);
    var visual = $(".category-hero-cover .hero-visual", stage);
    var img = visual && $("img", visual);
    var slot = $(".hero-visual-slot", stage);
    if (!sticky || !visual || !slot) return;
    var fades = $$(".category-hero .marquee, .category-hero .hero-content", stage);
    var chrome = $$(".category-hero .site-nav, .category-hero .site-footer", stage);

    var cs = getComputedStyle(d.body);
    var scale = parseFloat(cs.getPropertyValue("--cat-grow-scale")) || 2;
    var GROW = 110 * scale, HOLD = 5;   // timeline units = svh of scroll

    // start rect, in the sticky container's coordinates at progress 0
    // (the container then sits at the stage top, so stage-relative == container-relative)
    function start() {
      var s = slot.getBoundingClientRect(), st = stage.getBoundingClientRect();
      return { left: s.left - st.left, top: s.top - st.top, width: s.width, height: s.height };
    }

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: stage, start: "top top", end: "bottom bottom",
        scrub: true, invalidateOnRefresh: true
      }
    });
    tl.fromTo(visual, {
      left: function () { return start().left; },
      top: function () { return start().top; },
      width: function () { return start().width; },
      height: function () { return start().height; }
    }, {
      left: 0, top: 0,
      width: function () { return sticky.clientWidth; },
      height: function () { return sticky.clientHeight; },
      ease: "power1.inOut", duration: GROW
    }, 0);
    if (img) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: GROW, ease: "power1.out" }, 0);
    if (fades.length) tl.to(fades, { opacity: 0, duration: GROW * 0.28, ease: "power1.in" }, 0);
    if (chrome.length) tl.to(chrome, { opacity: 0, duration: GROW * 0.2 }, GROW * 0.1);
    tl.to({}, { duration: HOLD });
  }

  /* ---------------------------------------------------------------------
     2. Vertical intro lines draw down on enter
     --------------------------------------------------------------------- */
  function introLines() {
    var lines = $$(".category-gallery-intro__line, .category-cta__line, [data-draw-line]");
    if (!gsap || !ST || reduced) return;
    lines.forEach(function (line) {
      gsap.fromTo(line, { scaleY: 0 }, {
        scaleY: 1, duration: 1.4, ease: "expo.out",
        scrollTrigger: { trigger: line, start: "top 88%", once: true }
      });
    });
  }

  /* ---------------------------------------------------------------------
     3. Projects slider
     --------------------------------------------------------------------- */
  function slider(root) {
    var vp = $(".projects-slider-viewport", root);
    var track = $(".projects-slider-track", root);
    var items = $$(".projects-slider-item", root);
    var prev = $(".projects-slider-prev", root), next = $(".projects-slider-next", root);
    if (!vp || !track || !items.length) return;

    var x = 0, target = 0, min = 0, dragging = false, moved = false;
    var startX = 0, startT = 0, lastX = 0, lastT = 0, vel = 0, pid = null;
    var smooth = reduced ? 1 : 0.14;
    // diagonal path: each slide is lifted in proportion to its distance from the
    // viewport centre (same look as a rotated track, without resampling the images)
    var slope = 0, padL = 0, geo = [];

    function measure() {
      var pad = parseFloat(getComputedStyle(vp).paddingLeft) || 0;
      var visible = vp.clientWidth - pad * 2;
      padL = pad;
      slope = Math.tan((parseFloat(getComputedStyle(root).getPropertyValue("--slider-angle")) || 0) * Math.PI / 180);
      geo = items.map(function (it) { return it.offsetLeft + it.offsetWidth / 2; });
      min = Math.min(0, -(track.offsetWidth - visible)); // offsetWidth ignores transformed children
      target = clamp(target, min, 0);
      if (reduced) x = target;
      update();
      render();
    }
    function snaps() {
      var out = items.map(function (it) { return clamp(-it.offsetLeft, min, 0); });
      return out.filter(function (v, i) { return out.indexOf(v) === i; });
    }
    function go(dir) {
      var s = snaps(), t = target;
      if (dir > 0) { for (var i = 0; i < s.length; i++) if (s[i] < t - 4) { target = s[i]; break; } }
      else { for (var j = s.length - 1; j >= 0; j--) if (s[j] > t + 4) { target = s[j]; break; } }
      if (reduced) x = target;
      update(); kick();
    }
    function update() {
      if (prev) prev.disabled = target >= -1;
      if (next) next.disabled = target <= min + 1;
    }
    function render() {
      x += (target - x) * smooth;
      if (Math.abs(target - x) < 0.05) x = target;
      track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      var mid = vp.clientWidth / 2;
      for (var i = 0; i < items.length; i++) {
        var y = -((geo[i] || 0) + x + padL - mid) * slope;
        items[i].style.transform = "translate3d(0," + y.toFixed(2) + "px,0)";
      }
      return x !== target;
    }
    var running = false;
    function tick() { if (!render() && !dragging) { running = false; if (gsap) gsap.ticker.remove(tick); } }
    function kick() {
      if (!gsap) { x = target; render(); return; }
      if (running) return;
      running = true; gsap.ticker.add(tick);
    }

    // pointer drag
    vp.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (e.target.closest && e.target.closest(".projects-slider-nav")) return;
      dragging = true; moved = false; pid = e.pointerId;
      startX = lastX = e.clientX; startT = target; lastT = performance.now(); vel = 0;
      kick();
    });
    w.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pid) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true; vp.classList.add("is-dragging");
        try { vp.setPointerCapture(pid); } catch (err) {}
      }
      if (!moved) return;
      var t = startT + dx * 1.15;
      if (t > 0) t = t * 0.35; else if (t < min) t = min + (t - min) * 0.35; // rubber band
      target = t;
      var now = performance.now(), dt = Math.max(1, now - lastT);
      vel = vel * 0.6 + ((e.clientX - lastX) / dt) * 0.4;
      lastX = e.clientX; lastT = now;
      if (reduced) x = target;
    }, { passive: true });
    function end(e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      vp.classList.remove("is-dragging");
      if (moved) target = clamp(target + vel * 320, min, 0);
      if (reduced) x = target;
      update(); kick();
    }
    w.addEventListener("pointerup", end);
    w.addEventListener("pointercancel", end);
    vp.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    vp.addEventListener("dragstart", function (e) { e.preventDefault(); });

    // horizontal wheel / trackpad
    vp.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      target = clamp(target - e.deltaX, min, 0);
      if (reduced) x = target;
      update(); kick();
    }, { passive: false });

    // arrows + keyboard
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    vp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });

    var rT;
    w.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(function () { measure(); kick(); }, 150); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(measure);
    w.addEventListener("load", measure);
    measure();
    render();

    // entrance: slides drift in from the right
    if (gsap && ST && !reduced) {
      gsap.from($$(".projects-slider-item > *", root), {
        x: function () { return w.innerWidth * 0.18; }, opacity: 0,
        duration: 1.6, stagger: 0.05, ease: "expo.out",
        scrollTrigger: { trigger: root, start: "top 85%", once: true }
      });
    }
  }

  /* ---------------------------------------------------------------------
     4. Next teaser hand-over
     --------------------------------------------------------------------- */
  function nextTeaser(sec) {
    var link = $(".category-next__content", sec);
    var img = $("img", sec);
    if (!link) return;
    var busy = false;
    link.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = link.getAttribute("href") || sec.getAttribute("data-next-href");
      if (!href) return;
      e.preventDefault();
      if (busy) return;
      busy = true;
      var go = function () { w.location.href = href; };
      if (!gsap || reduced || !img) { go(); return; }

      if (Site.stopScroll) Site.stopScroll();
      var r = sec.getBoundingClientRect();
      var color = sec.getAttribute("data-next-color") || "#111";
      var flight = d.createElement("div");
      flight.className = "category-next-flight";
      flight.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      var fi = d.createElement("img");
      fi.src = img.currentSrc || img.src; fi.alt = "";
      var tint = d.createElement("div");
      tint.style.cssText = "position:absolute;inset:0;opacity:0;background:" + color;
      flight.appendChild(fi); flight.appendChild(tint);
      d.body.appendChild(flight);
      d.documentElement.classList.add("shell-actions-hidden");

      var tl = gsap.timeline({ onComplete: go });
      tl.to($$(".category-next__label, .category-next__title, .category-next__desc", sec), { opacity: 0, y: -16, duration: 0.45, stagger: 0.04, ease: "power2.in" }, 0)
        .to(flight, { left: 0, top: 0, width: w.innerWidth, height: w.innerHeight, duration: 1.05, ease: Site.standardEase || "expo.inOut" }, 0.1)
        .to(tint, { opacity: 1, duration: 0.45, ease: "none" }, 0.85);
      setTimeout(go, 2600); // safety
    });
    // restore when coming back through the bfcache
    w.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      busy = false;
      $$(".category-next-flight").forEach(function (n) { n.remove(); });
      d.documentElement.classList.remove("shell-actions-hidden");
      if (gsap) gsap.set($$(".category-next__label, .category-next__title, .category-next__desc", sec), { clearProps: "opacity,transform" });
      if (Site.startScroll) Site.startScroll();
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  function init() {
    heroGrow();
    introLines();
    $$(".projects-slider").forEach(slider);
    $$(".category-next").forEach(nextTeaser);
    if (ST) ST.refresh();
  }
  if (Site.ready) Site.ready(init);
  else if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init);
  else init();
})();
