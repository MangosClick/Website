/* =========================================================================
   about.js: About page.
   1. Hero: the photo drifts and darkens as it scrolls away (scrubbed).
   2. Intro visual: follows its grid slot until it reaches the viewport centre,
      then holds there and grows into a full-bleed cover (sticky + scrub),
      before scrolling away with the page.
   Shared sections (quote, values, CTA line, Next teaser) are handled by
   core.js + category.js.
   ========================================================================= */
(function () {
  "use strict";

  var w = window, d = document;
  var Site = w.Site || {};
  var gsap = w.gsap, ST = w.ScrollTrigger;
  var reduced = !!Site.reducedMotion || !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function $(s, r) { return (r || d).querySelector(s); }

  /* 1. Hero darkening + drift */
  function hero() {
    var sec = $(".about-hero");
    if (!sec || !gsap || !ST || reduced) return;
    var img = $(".about-hero__media img", sec);
    var overlay = $(".about-hero__scroll-overlay", sec);
    var marquee = $(".about-hero .marquee", sec);
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true }
    });
    if (img) tl.fromTo(img, { yPercent: 0, scale: 1.06 }, { yPercent: 18, scale: 1 }, 0);
    if (overlay) tl.fromTo(overlay, { opacity: 0 }, { opacity: 0.82 }, 0);
    if (marquee) tl.to(marquee, { yPercent: -40, opacity: 0.2 }, 0);
  }

  /* 2. Intro visual grow */
  function grow() {
    var stage = $(".about-video-scroll-stage");
    if (!stage || !ST || reduced) return;
    var slot = $(".about-intro__visual-slot", stage);
    var sticky = $(".about-video-layer__sticky", stage);
    var visual = $(".about-intro__visual", stage);
    var img = visual && $("img", visual);
    if (!slot || !sticky || !visual) return;

    var theme = "light";
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; } // quad in-out

    function render() {
      var vw = sticky.clientWidth, vh = sticky.clientHeight;
      var s = slot.getBoundingClientRect();
      var c = sticky.getBoundingClientRect();
      var st = stage.getBoundingClientRect();
      // grow distance: from "slot centred" to the moment the sticky layer would release, minus a short hold
      var startY = s.top + s.height / 2 - vh / 2;          // > 0 while the slot is below centre
      var room = st.bottom - vh - (s.top + s.height / 2 - vh / 2); // scroll left between start and release
      var dist = Math.max(1, (room > 0 ? room : 1) - vh * 0.12);
      var p = startY > 0 ? 0 : Math.min(1, -startY / dist);
      var left, top, width, height;
      if (p >= 1) {
        left = 0; top = 0; width = vw; height = vh;        // locked to the layer: scrolls away with it
      } else {
        var e = ease(p);
        var y0 = startY > 0 ? s.top : vh / 2 - s.height / 2; // follow the slot, then hold it centred
        var vx = s.left + (0 - s.left) * e;
        var vy = y0 + (0 - y0) * e;
        width = s.width + (vw - s.width) * e;
        height = s.height + (vh - s.height) * e;
        left = vx - c.left;
        top = vy - c.top;
      }
      visual.style.left = left.toFixed(1) + "px";
      visual.style.top = top.toFixed(1) + "px";
      visual.style.width = width.toFixed(1) + "px";
      visual.style.height = height.toFixed(1) + "px";
      if (img) img.style.transform = "scale(" + (1.08 - 0.08 * ease(p)).toFixed(4) + ")";
      // the fixed buttons switch to their dark variant once the image covers most of the screen
      var t = p > 0.55 && st.bottom > vh * 0.5 ? "dark" : "light";
      if (t !== theme) {
        theme = t;
        stage.setAttribute("data-theme", t);
        if (Site.shell && Site.shell.update) Site.shell.update();
      }
    }

    stage.classList.add("is-grow-ready");
    ST.create({ trigger: stage, start: "top bottom", end: "bottom top", onUpdate: render, onRefresh: render });
    w.addEventListener("resize", render);
    render();
  }

  function init() { hero(); grow(); if (ST) ST.refresh(); }
  if (Site.ready) Site.ready(init);
  else if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init);
  else init();
})();
