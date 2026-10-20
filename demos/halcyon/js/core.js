/* =========================================================================
   core.js: shared motion runtime (window.Site)
   OWNER: shell agent. Page agents consume this API; do not edit.

   Public API
     Site.ready(fn)        run fn after fonts are loaded AND shell.js has injected
                           its markup (immediately if already ready)
     Site.init(root)       scan root (default document) for data-split / data-marquee /
                           data-parallax / data-reveal / data-clip-reveal. Idempotent.
     Site.refresh()        ScrollTrigger.refresh()
     Site.lenis            Lenis instance (null on home, reduced motion, or if Lenis failed)
     Site.ease             "expo.out"
     Site.isTouch          true on touch / coarse-pointer devices
     Site.reducedMotion    prefers-reduced-motion: reduce
     Site.page / Site.theme   body[data-page] / body[data-theme]
   Extras (optional)
     Site.split(el)              (re)split el into lines, returns the .split-line__inner nodes
     Site.revealSplit(el, opts)  reveal a split element now (opts: delay, duration, stagger)
     data-split="manual"         split but never auto-reveal (call Site.revealSplit yourself)
     data-split-delay="0.2"      delay for the auto reveal
     Site.scrollTo(target, opts) Lenis-aware scrollTo
     Site.stopScroll() / Site.startScroll()
   ========================================================================= */
(function () {
  "use strict";

  var w = window, d = document, html = d.documentElement;
  var Site = (w.Site = w.Site || {});
  var gsap = w.gsap, ST = w.ScrollTrigger;
  var hasGsap = !!gsap;
  if (hasGsap && ST) gsap.registerPlugin(ST);

  var mm = function (q) { return w.matchMedia ? w.matchMedia(q).matches : false; };
  Site.ease = "expo.out";
  Site.isTouch = mm("(hover: none)") || mm("(pointer: coarse)") || ("ontouchstart" in w && navigator.maxTouchPoints > 0);
  Site.reducedMotion = mm("(prefers-reduced-motion: reduce)");
  Site.page = (d.body && d.body.getAttribute("data-page")) || "";
  Site.theme = (d.body && d.body.getAttribute("data-theme")) || "light";
  Site.lenis = null;
  Site.isReady = false;

  html.classList.add("site-js");
  // scroll-driven heroes expect to start at the top (no mid-page restore on reload)
  // (ScrollTrigger keeps its own scroll memory, so clear it through its API)
  try {
    if (!location.hash) {
      if (ST && ST.clearScrollMemory) ST.clearScrollMemory("manual");
      else if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    }
  } catch (e) {}
  if (Site.isTouch) html.classList.add("is-touch");
  if (Site.reducedMotion) html.classList.add("reduced-motion");
  if (!hasGsap) html.classList.add("no-gsap");

  /* ---------------------------------------------------------------------
     Lenis + ScrollTrigger
     --------------------------------------------------------------------- */
  function setupLenis() {
    if (Site.page === "home" || Site.reducedMotion || !w.Lenis) return;
    try {
      var lenis = new w.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      Site.lenis = lenis;
      if (hasGsap) {
        if (ST) lenis.on("scroll", ST.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    } catch (e) {
      Site.lenis = null;
    }
  }
  setupLenis();

  Site.refresh = function () { if (ST) ST.refresh(); };

  Site.scrollTo = function (target, opts) {
    opts = opts || {};
    if (Site.lenis) { Site.lenis.scrollTo(target, opts); return; }
    var y = typeof target === "number" ? target
      : (typeof target === "string" ? d.querySelector(target) : target);
    if (y && typeof y !== "number") y = y.getBoundingClientRect().top + w.pageYOffset + (opts.offset || 0);
    w.scrollTo({ top: y || 0, behavior: opts.immediate || Site.reducedMotion ? "auto" : "smooth" });
  };

  var stopCount = 0;
  Site.stopScroll = function () {
    stopCount++;
    if (Site.lenis) Site.lenis.stop();
    html.classList.add("scroll-locked");
  };
  Site.startScroll = function () {
    stopCount = Math.max(0, stopCount - 1);
    if (stopCount) return;
    if (Site.lenis) Site.lenis.start();
    html.classList.remove("scroll-locked");
  };

  /* ---------------------------------------------------------------------
     Ready gate: fonts + shell
     --------------------------------------------------------------------- */
  var queue = [], fontsDone = false, shellDone = false, domDone = false;

  function flush() {
    if (Site.isReady || !(fontsDone && shellDone && domDone)) return;
    Site.isReady = true;
    html.classList.add("site-ready");
    initAll(d);
    var q = queue; queue = [];
    for (var i = 0; i < q.length; i++) {
      try { q[i](Site); } catch (e) { if (w.console) console.error(e); }
    }
    // reveal load-triggered splits after page callbacks had a chance to adjust
    revealLoadSplits();
    if (ST) requestAnimationFrame(function () { ST.refresh(); });
  }

  Site.ready = function (fn) {
    if (typeof fn !== "function") return;
    if (Site.isReady) { try { fn(Site); } catch (e) { if (w.console) console.error(e); } return; }
    queue.push(fn);
  };

  // Called by shell.js once it has injected nav/footer/overlays.
  Site.shellReady = function () { shellDone = true; flush(); };

  function waitFonts() {
    var done = function () { if (fontsDone) return; fontsDone = true; flush(); };
    setTimeout(done, 3000); // never block forever
    if (!d.fonts || !d.fonts.ready) { done(); return; }
    var loads = [];
    try {
      loads.push(d.fonts.load('400 1em "Figtree"'), d.fonts.load('500 1em "Figtree"'),
        d.fonts.load('300 1em "Fraunces"'), d.fonts.load('400 1em "Unbounded"'));
    } catch (e) {}
    Promise.all(loads).catch(function () {}).then(function () { return d.fonts.ready; })
      .then(done, done);
  }

  function onDom() {
    domDone = true;
    if (!location.hash) { try { w.scrollTo(0, 0); if (Site.lenis) Site.lenis.scrollTo(0, { immediate: true, force: true }); } catch (e) {} }
    // If shell.js isn't on the page, don't wait for it.
    if (!Site._hasShell) shellDone = true;
    waitFonts();
    flush();
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", onDom);
  else setTimeout(onDom, 0);

  w.addEventListener("load", function () { if (ST && Site.isReady) ST.refresh(); });

  /* ---------------------------------------------------------------------
     Init registry (idempotent)
     --------------------------------------------------------------------- */
  var done = { split: new WeakSet(), marquee: new WeakSet(), parallax: new WeakSet(), reveal: new WeakSet(), clip: new WeakSet() };
  var splitEls = [], marquees = [];

  function scan(root, sel) {
    var out = [];
    if (root.matches && root.matches(sel)) out.push(root);
    if (root.querySelectorAll) out.push.apply(out, root.querySelectorAll(sel));
    return out;
  }

  function initAll(root) {
    root = root || d;
    scan(root, "[data-split]").forEach(initSplit);
    scan(root, "[data-marquee]").forEach(initMarquee);
    scan(root, "[data-parallax]").forEach(initParallax);
    scan(root, "[data-reveal]").forEach(initReveal);
    scan(root, "[data-clip-reveal]").forEach(initClip);
  }

  Site.init = function (root) {
    root = root || d;
    if (!Site.isReady) { Site.ready(function () { initAll(root); if (ST) ST.refresh(); }); return; }
    initAll(root);
    if (ST) ST.refresh();
  };

  /* ---------------------------------------------------------------------
     data-split: line splitting
     --------------------------------------------------------------------- */
  var WS = /^\s+$/;

  function collect(node, root, chain, items) {
    var kids = Array.prototype.slice.call(node.childNodes);
    for (var i = 0; i < kids.length; i++) {
      var n = kids[i];
      if (n.nodeType === 3) {
        var parts = n.nodeValue.split(/(\s+)/);
        var frag = d.createDocumentFragment();
        for (var j = 0; j < parts.length; j++) {
          var p = parts[j];
          if (!p) continue;
          if (WS.test(p)) {
            frag.appendChild(d.createTextNode(" "));
            items.push({ space: true, chain: chain });
          } else {
            var s = d.createElement("span");
            s.className = "split-word";
            s.style.display = "inline-block";
            s.textContent = p;
            frag.appendChild(s);
            items.push({ word: p, el: s, chain: chain });
          }
        }
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) {
        if (n.tagName === "BR") { items.push({ br: true }); continue; }
        collect(n, root, chain.concat([n]), items);
      }
    }
  }

  function split(el) {
    if (el._splitHTML == null) el._splitHTML = el.innerHTML;
    else el.innerHTML = el._splitHTML;

    var items = [];
    collect(el, el, [], items);

    // group into lines by vertical position
    var lines = [], cur = null, lastTop = null, lastH = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.br) { cur = null; lastTop = null; continue; }
      if (it.space) { if (cur) cur.push(it); continue; }
      var r = it.el.getBoundingClientRect();
      if (!cur || lastTop === null || r.top - lastTop > Math.max(lastH, r.height) * 0.5) {
        cur = []; lines.push(cur);
      }
      cur.push(it);
      lastTop = r.top; lastH = r.height;
    }

    // rebuild
    el.innerHTML = "";
    var inners = [];
    lines.forEach(function (line) {
      while (line.length && line[line.length - 1].space) line.pop();
      var outer = d.createElement("span");
      outer.className = "split-line";
      var inner = d.createElement("span");
      inner.className = "split-line__inner";
      outer.appendChild(inner);
      var stack = []; // [{orig, clone}]
      line.forEach(function (it) {
        var chain = it.chain, k = 0;
        while (k < stack.length && k < chain.length && stack[k].orig === chain[k]) k++;
        stack.length = k;
        for (; k < chain.length; k++) {
          var c = chain[k].cloneNode(false);
          (stack.length ? stack[stack.length - 1].clone : inner).appendChild(c);
          stack.push({ orig: chain[k], clone: c });
        }
        var parent = stack.length ? stack[stack.length - 1].clone : inner;
        parent.appendChild(d.createTextNode(it.space ? " " : it.word));
      });
      el.appendChild(outer);
      inners.push(inner);
    });
    el.classList.add("is-split");
    el._splitWidth = el.clientWidth;
    return inners;
  }
  Site.split = function (el) { var inners = split(el); if (hasGsap) gsap.set(inners, { yPercent: el._splitRevealed || Site.reducedMotion ? 0 : 110 }); return inners; };

  function revealSplit(el, opts) {
    opts = opts || {};
    if (el._splitRevealed && !opts.force) return;
    el._splitRevealed = true;
    var inners = el.querySelectorAll(".split-line__inner");
    if (!hasGsap || Site.reducedMotion) { inners.forEach(function (n) { n.style.transform = "none"; }); return; }
    var delay = opts.delay != null ? opts.delay : parseFloat(el.getAttribute("data-split-delay")) || 0;
    return gsap.fromTo(inners, { yPercent: 110 }, {
      yPercent: 0, duration: opts.duration || 1.1, stagger: opts.stagger != null ? opts.stagger : 0.08,
      ease: opts.ease || Site.ease, delay: delay, overwrite: true
    });
  }
  Site.revealSplit = revealSplit;

  function initSplit(el) {
    if (done.split.has(el)) return;
    done.split.add(el);
    var mode = el.getAttribute("data-split");
    if (Site.reducedMotion || !hasGsap) { el._splitRevealed = true; el.classList.add("is-split"); return; }
    var inners = split(el);
    gsap.set(inners, { yPercent: 110 });
    splitEls.push(el);
    if (mode === "load" || mode === "manual") return;
    if (ST) {
      ST.create({ trigger: el, start: "top 90%", once: true, onEnter: function () { revealSplit(el); } });
    } else revealSplit(el);
  }

  function revealLoadSplits() {
    splitEls.forEach(function (el) {
      if (el.getAttribute("data-split") === "load") revealSplit(el);
    });
  }

  function resplitAll() {
    splitEls.forEach(function (el) {
      if (!el.isConnected || el.clientWidth === el._splitWidth) return;
      var revealed = !!el._splitRevealed;
      if (revealed) gsap.killTweensOf(el.querySelectorAll(".split-line__inner"));
      var inners = split(el);
      gsap.set(inners, { yPercent: revealed ? 0 : 110 });
    });
  }

  /* ---------------------------------------------------------------------
     data-marquee
     --------------------------------------------------------------------- */
  var scrollBoost = 0, lastScrollY = w.pageYOffset;

  function initMarquee(el) {
    if (done.marquee.has(el)) return;
    var item = el.querySelector(".marquee__item");
    if (!item) return;
    done.marquee.add(el);
    var track = d.createElement("div");
    track.className = "marquee__track";
    item.parentNode.insertBefore(track, item);
    track.appendChild(item);
    var m = {
      el: el, track: track, item: item, x: 0, unit: 0, visible: true,
      speed: parseFloat(el.getAttribute("data-speed")) || 50,
      dir: parseFloat(el.getAttribute("data-direction")) < 0 ? -1 : (el.getAttribute("data-direction") ? 1 : -1),
      velocity: el.hasAttribute("data-scroll-velocity")
    };
    el.classList.add("is-marquee");
    fillMarquee(m);
    if ("IntersectionObserver" in w) {
      new IntersectionObserver(function (es) { m.visible = es[0].isIntersecting; }).observe(el);
    }
    marquees.push(m);
    el._marquee = m;
  }

  function fillMarquee(m) {
    var clones = m.track.querySelectorAll(".marquee__item[data-clone]");
    for (var i = 0; i < clones.length; i++) clones[i].remove();
    m.unit = m.item.getBoundingClientRect().width;
    if (!m.unit) return;
    var need = Math.max(w.innerWidth * 2, m.el.clientWidth + m.unit * 2);
    var count = Math.min(60, Math.ceil(need / m.unit));
    for (var n = 1; n < count; n++) {
      var c = m.item.cloneNode(true);
      c.setAttribute("data-clone", "");
      c.setAttribute("aria-hidden", "true");
      m.track.appendChild(c);
    }
  }

  function tickMarquees(dt) {
    // scroll velocity (px/frame) from Lenis, or native scroll delta
    var v = 0;
    if (Site.lenis) v = Math.abs(Site.lenis.velocity || 0);
    else { var y = w.pageYOffset; v = Math.abs(y - lastScrollY); lastScrollY = y; }
    scrollBoost += (Math.min(v * 0.35, 8) - scrollBoost) * 0.12;
    if (Site.reducedMotion) return;
    for (var i = 0; i < marquees.length; i++) {
      var m = marquees[i];
      if (!m.visible || !m.unit) continue;
      var speed = m.speed * (m.velocity ? 1 + scrollBoost : 1);
      m.x += m.dir * speed * dt;
      // wrap into (-unit, 0]
      m.x = ((m.x % m.unit) - m.unit) % m.unit;
      m.track.style.transform = "translate3d(" + m.x.toFixed(2) + "px,0,0)";
    }
  }

  (function loop() {
    var last = performance.now();
    var step = function () {
      var now = performance.now();
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (marquees.length) tickMarquees(dt);
    };
    if (hasGsap) gsap.ticker.add(step);
    else { var f = function () { step(); requestAnimationFrame(f); }; requestAnimationFrame(f); }
  })();

  /* ---------------------------------------------------------------------
     data-parallax: img travels -10% -> +10% while the wrapper crosses the viewport
     --------------------------------------------------------------------- */
  function initParallax(el) {
    if (done.parallax.has(el)) return;
    var img = el.querySelector(":scope > img") || el.querySelector("img, video");
    if (!img) return;
    done.parallax.add(el);
    if (!hasGsap || !ST || Site.reducedMotion) return;
    // Travel is derived from the image's extra height (base.css makes it 120%),
    // which keeps the image covering the wrapper at both ends.
    var extra = function () { return Math.max(0, img.offsetHeight - el.clientHeight); };
    if (extra() < 4) gsap.set(img, { scale: 1.25 });
    gsap.fromTo(img, {
      y: function () { var e = extra(); return e >= 4 ? -e : -el.clientHeight * 0.1; }
    }, {
      y: function () { var e = extra(); return e >= 4 ? 0 : el.clientHeight * 0.1; },
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
    });
  }

  /* ---------------------------------------------------------------------
     data-reveal: fade up
     --------------------------------------------------------------------- */
  function initReveal(el) {
    if (done.reveal.has(el)) return;
    done.reveal.add(el);
    el.setAttribute("data-reveal-init", "");
    if (!hasGsap || Site.reducedMotion) { el.style.opacity = 1; return; }
    var delay = parseFloat(el.getAttribute("data-reveal-delay")) || 0;
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.2, ease: Site.ease, delay: delay,
      scrollTrigger: ST ? { trigger: el, start: "top 92%", once: true } : undefined
    });
  }

  /* ---------------------------------------------------------------------
     data-clip-reveal: clip from the bottom + slight image zoom
     --------------------------------------------------------------------- */
  function initClip(el) {
    if (done.clip.has(el)) return;
    done.clip.add(el);
    el.setAttribute("data-clip-init", "");
    if (!hasGsap || Site.reducedMotion) { el.style.clipPath = "inset(0% 0% 0% 0%)"; return; }
    var img = el.querySelector("img, video");
    var delay = parseFloat(el.getAttribute("data-reveal-delay")) || 0;
    var tl = gsap.timeline({ paused: true, delay: delay });
    tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: Site.ease }, 0);
    if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.4, ease: Site.ease }, 0);
    if (ST) ST.create({ trigger: el, start: "top 90%", once: true, onEnter: function () { tl.play(); } });
    else tl.play();
  }

  /* ---------------------------------------------------------------------
     Resize
     --------------------------------------------------------------------- */
  var rT, lastW = w.innerWidth;
  w.addEventListener("resize", function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      if (!Site.isReady) return;
      var widthChanged = w.innerWidth !== lastW;
      lastW = w.innerWidth;
      if (widthChanged) {
        if (hasGsap) resplitAll();
        marquees.forEach(fillMarquee);
      }
      if (ST) ST.refresh();
    }, 250);
  });
})();
