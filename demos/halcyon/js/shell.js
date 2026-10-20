/* =========================================================================
   shell.js: site chrome (nav, footer, fixed actions, selection overlay,
   nav menu, custom scrollbar, page transitions).
   OWNER: shell agent. Depends on core.js (window.Site).

   Public API (Site.shell)
     open/close/toggleSelection(), open/close/toggleMenu()
     hideActions() / showActions()  hide the fixed bottom-right buttons (e.g. during an intro)
     setActionsTheme("light"|"dark"|null)  force the actions theme (null = automatic)
     navigate(href)                 fade the stage out, then go to href
   ========================================================================= */
(function () {
  "use strict";

  var w = window, d = document, html = d.documentElement;
  var Site = (w.Site = w.Site || {});
  Site._hasShell = true; // tells core.js to wait for Site.shellReady()
  var gsap = w.gsap;

  /* ---------- easing: exact cubic-bezier(.7,.6,0,1) ---------- */
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sx(t) { return ((ax * t + bx) * t + cx) * t; }
    function sy(t) { return ((ay * t + by) * t + cy) * t; }
    function dx(t) { return (3 * ax * t + 2 * bx) * t + cx; }
    function solve(x) {
      var t = x, i, x2, d2;
      for (i = 0; i < 8; i++) {
        x2 = sx(t) - x; d2 = dx(t);
        if (Math.abs(x2) < 1e-6) return t;
        if (Math.abs(d2) < 1e-6) break;
        t -= x2 / d2;
      }
      var lo = 0, hi = 1; t = x;
      while (lo < hi) {
        x2 = sx(t);
        if (Math.abs(x2 - x) < 1e-6) return t;
        if (x > x2) lo = t; else hi = t;
        t = (hi - lo) / 2 + lo;
        if (hi - lo < 1e-7) break;
      }
      return t;
    }
    return function (p) { return p <= 0 ? 0 : p >= 1 ? 1 : sy(solve(p)); };
  }
  Site.bezier = bezier;
  var STANDARD = bezier(0.7, 0.6, 0, 1);
  if (w.CustomEase && gsap) {
    try { gsap.registerPlugin(w.CustomEase); STANDARD = w.CustomEase.create("standard", "M0,0 C0.7,0.6 0,1 1,1"); } catch (e) {}
  }
  Site.standardEase = STANDARD;

  var reduced = !!Site.reducedMotion;
  // keyboard vs pointer: only move focus around when the user navigates by keyboard
  var kbd = false;
  document.addEventListener("keydown", function (e) { if (e.key === "Tab" || e.key === "Enter" || e.key === " ") kbd = true; }, true);
  document.addEventListener("pointerdown", function () { kbd = false; }, true);
  var DUR = reduced ? 0.01 : 0.8;

  /* ---------- page context ---------- */
  var body = d.body;
  var page = body.getAttribute("data-page") || "";
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (file.indexOf(".") === -1) file += ".html";

  var CATEGORIES = [
    { key: "home", href: "index.html", title: "Homepage", desc: "Homes in Cyprus,<br>Montenegro &amp; Georgia", color: "var(--brand-navy)", img: "assets/img/sel-home.jpg" },
    { key: "by-the-sea", href: "bythesea.html", title: "By The Sea", desc: "Seafront, marina &amp;<br>coastal residences", color: "var(--category-by-the-sea-color)", img: "assets/img/sel-bythesea.jpg" },
    { key: "evergreen", href: "evergreen.html", title: "Evergreen", desc: "Golf, parkland &amp;<br>forest retreats", color: "var(--category-evergreen-color)", img: "assets/img/sel-evergreen.jpg" },
    { key: "urban-living", href: "urbanliving.html", title: "Urban Living", desc: "City-centre homes &amp;<br>old-town living", color: "var(--category-urban-living-color)", img: "assets/img/sel-urbanliving.jpg" },
    { key: "rare-gems", href: "raregems.html", title: "Rare Gems", desc: "Singular, concept-led<br>signature homes", color: "var(--category-rare-gems-color)", img: "assets/img/sel-raregems.jpg" }
  ];
  var CONTACT = { email: "hello@halcyon.example", whatsapp: "https://wa.me/0000000000" };

  /* ---------- icons (original artwork) ---------- */
  var MARK_SVG =
    '<svg class="halcyon-mark" viewBox="0 0 48 30" aria-hidden="true" focusable="false">' +
    '<path d="M11 19a13 13 0 0 1 26 0" fill="none" stroke="currentColor" stroke-width="3.6"/>' +
    '<path d="M0 22.5h48" stroke="currentColor" stroke-width="3.6"/>' +
    '<path d="M12 28.2h24" stroke="currentColor" stroke-width="3.6"/></svg>';
  var LOGO_SVG =
    '<svg class="logo__svg" viewBox="0 0 328 40" role="img" aria-label="Halcyon">' +
    '<g transform="translate(0 3)"><path d="M11 19a13 13 0 0 1 26 0" fill="none" stroke="currentColor" stroke-width="3.6"/>' +
    '<path d="M0 22.5h48" stroke="currentColor" stroke-width="3.6"/><path d="M12 28.2h24" stroke="currentColor" stroke-width="3.6"/></g>' +
    '<text x="64" y="34" textLength="263" lengthAdjust="spacing" fill="currentColor" ' +
    'style="font-family:var(--wide-font);font-weight:400;font-size:38px">HALCYON</text></svg>';
  var DOTS_SVG = '<svg class="selection-btn__dots" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
    '<rect x="0" y="0" width="4" height="4"/><rect x="8" y="0" width="4" height="4"/>' +
    '<rect x="0" y="8" width="4" height="4"/><rect x="8" y="8" width="4" height="4"/></svg>';
  var CHAT_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 2h12v9H6.5L3 14v-3H2z" fill="currentColor"/>' +
    '<path d="M5 5.5h6M5 8h4" stroke="var(--navy)" stroke-width="1.3"/></svg>';
  var MAIL_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M1.5 3.5h13v9h-13z" fill="currentColor"/>' +
    '<path d="M2 4.2 8 9l6-4.8" fill="none" stroke="var(--navy)" stroke-width="1.3"/></svg>';

  function el(tag, cls, htmlStr) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (htmlStr != null) n.innerHTML = htmlStr;
    return n;
  }
  function rolling(text) {
    var letters = text.split("").map(function (c, i) {
      return '<span class="rolling-text__letter" style="--i:' + i + '">' + (c === " " ? "&nbsp;" : c) + "</span>";
    }).join("");
    return '<span class="rolling-text__block">' + letters + '</span><span class="rolling-text__block" aria-hidden="true">' + letters + "</span>";
  }

  /* =====================================================================
     1-2. Nav + footer
     ===================================================================== */
  function buildNav() {
    d.querySelectorAll("[data-site-nav]").forEach(function (nav) {
      if (nav.getAttribute("data-shell-init")) return;
      nav.setAttribute("data-shell-init", "1");
      nav.classList.add("site-nav");
      nav.setAttribute("aria-label", nav.getAttribute("aria-label") || "Main");
      nav.innerHTML =
        '<a class="about-btn link-underline" href="about.html">About</a>' +
        '<a class="logo" href="index.html" aria-label="Halcyon, home">' + LOGO_SVG + "</a>" +
        '<a class="contact-btn link-underline" href="contact.html">Contact</a>';
      if (file === "about.html") nav.querySelector(".about-btn").classList.add("is-current");
      if (file === "contact.html") nav.querySelector(".contact-btn").classList.add("is-current");
    });
    d.querySelectorAll("[data-site-footer]").forEach(function (f) {
      if (f.getAttribute("data-shell-init")) return;
      f.setAttribute("data-shell-init", "1");
      f.classList.add("site-footer");
      var txt = f.getAttribute("data-footer-text");
      f.innerHTML = '<p class="site-footer__text">' + (txt != null ? txt : "Halcyon&reg; 2026") + "</p>";
    });
  }

  /* =====================================================================
     3. Fixed actions
     ===================================================================== */
  var actions, selBtn, menuBtn;
  function buildActions() {
    actions = el("div", "site-nav__actions");
    actions.innerHTML =
      '<button type="button" class="selection-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="selection-shell">' +
      '<span class="selection-btn__fill" aria-hidden="true"></span>' +
      '<span class="selection-btn__label">Our Selection</span>' + DOTS_SVG + "</button>" +
      '<button type="button" class="menu-btn" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu">' +
      '<span class="menu-btn__line menu-btn__line--1"></span><span class="menu-btn__line menu-btn__line--2"></span></button>';
    body.appendChild(actions);
    selBtn = actions.querySelector(".selection-btn");
    menuBtn = actions.querySelector(".menu-btn");
    selBtn.addEventListener("click", function () { closeMenu(); toggleSelection(); });
    menuBtn.addEventListener("click", function () { toggleMenu(); });
  }

  /* =====================================================================
     4. Selection overlay
     ===================================================================== */
  var sel, selBg, selInner, selCards, selCurrent, stage, selOpen = false, selAnim = null;
  var currentKey = (function () {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].href === file) return CATEGORIES[i].key;
    return "";
  })();

  function buildSelection() {
    stage = d.getElementById("page-stage");
    sel = el("div", "selection-shell");
    sel.id = "selection-shell";
    sel.setAttribute("role", "dialog");
    sel.setAttribute("aria-modal", "true");
    sel.setAttribute("aria-label", "Our selection");
    sel.setAttribute("aria-hidden", "true");

    // Homepage card only replaces the current category (so the row always has 4);
    // on home / about / contact the 4 categories are shown.
    var list = CATEGORIES.filter(function (c) {
      if (c.key === "home") return currentKey && currentKey !== "home";
      return c.key !== currentKey;
    });
    var cardsHTML = list.map(function (c) {
      return '<a class="selection-card" href="' + c.href + '" data-category="' + c.key + '" style="--card-color:' + c.color + '">' +
        '<span class="selection-card__panel">' +
        '<span class="selection-card__symbol">' + MARK_SVG + "</span>" +
        '<span class="selection-card__title"><span class="selection-card__title-text">' + c.title + "</span></span>" +
        '<span class="selection-card__desc">' + c.desc + "</span></span>" +
        '<span class="selection-card__cover" aria-hidden="true"><img src="' + c.img + '" alt="" decoding="async" loading="lazy"></span></a>';
    }).join("");

    sel.innerHTML =
      '<div class="selection-shell__bg"></div>' +
      '<div class="selection-shell__inner"><nav class="selection-cards" aria-label="Collections">' + cardsHTML + "</nav></div>" +
      '<button type="button" class="selection-shell__current" aria-label="Back to the current page"></button>';
    body.appendChild(sel);
    selBg = sel.querySelector(".selection-shell__bg");
    selInner = sel.querySelector(".selection-shell__inner");
    selCards = sel.querySelectorAll(".selection-card");
    selCurrent = sel.querySelector(".selection-shell__current");

    selBg.addEventListener("click", closeSelection);
    selInner.addEventListener("click", function (e) { if (e.target === selInner) closeSelection(); });
    selCurrent.addEventListener("click", closeSelection);
    selCards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        navigate(card.getAttribute("href"), true);
      });
    });
  }

  // Geometry of the mini page: 2 card columns wide, centred, just below the cards row.
  function miniRect() {
    var vw = w.innerWidth, vh = w.innerHeight;
    var nav = sel.querySelector(".selection-cards");
    var gap = parseFloat(getComputedStyle(nav).columnGap) || vw * 0.026;
    var first = selCards[0];
    var colW = first ? first.offsetWidth : vw * 0.2;
    var mobile = vw <= 640;
    var width = mobile ? vw * 0.56 : colW * 2 + gap;
    // cards may be mid-animation (transformed): use layout boxes, not rects
    var cardsH = nav.offsetHeight;
    for (var i = 0; i < selCards.length; i++) cardsH = Math.max(cardsH, selCards[i].offsetHeight);
    var top = selInner.offsetTop + nav.offsetTop + cardsH + gap;
    if (top > vh * 0.86) top = vh * 0.86;
    return { left: (vw - width) / 2, top: top, width: width, scale: width / vw, height: vh * (width / vw) };
  }

  function setInert(on) {
    if (!stage) return;
    if (on) { stage.setAttribute("aria-hidden", "true"); stage.inert = true; }
    else { stage.removeAttribute("aria-hidden"); stage.inert = false; }
  }

  function openSelection() {
    if (selOpen || !stage) return;
    selOpen = true;
    if (selAnim) selAnim.kill();
    Site.stopScroll && Site.stopScroll();
    html.classList.add("selection-open");
    sel.setAttribute("aria-hidden", "false");
    selBtn.setAttribute("aria-expanded", "true");
    setInert(true);

    var vh = w.innerHeight;
    var r = stage.getBoundingClientRect();
    var off = -r.top;
    var m = miniRect();
    stage.classList.add("is-mini");
    stage.style.clipPath = "inset(" + off + "px 0px " + Math.max(0, r.height - off - vh) + "px 0px)";
    selCurrent.style.cssText = "left:" + m.left + "px;top:" + m.top + "px;width:" + m.width + "px;height:" + m.height + "px";

    var target = { x: m.left, y: m.top - r.top * (1 - m.scale), scale: m.scale };
    if (!gsap) {
      stage.style.transformOrigin = "0 0";
      stage.style.transform = "translate(" + target.x + "px," + target.y + "px) scale(" + target.scale + ")";
      return;
    }
    var tl = gsap.timeline();
    selAnim = tl;
    tl.set(stage, { transformOrigin: "0 0" })
      .fromTo(selBg, { opacity: 0 }, { opacity: 1, duration: DUR * 0.6, ease: "none" }, 0)
      .to(stage, { x: target.x, y: target.y, scale: target.scale, duration: DUR, ease: STANDARD }, 0)
      .fromTo(selCards, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: DUR * 1.1, stagger: 0.06, ease: STANDARD }, DUR * 0.12)
      .fromTo(sel.querySelectorAll(".selection-card__symbol"), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: DUR, stagger: 0.06, ease: Site.ease }, DUR * 0.55)
      .fromTo(sel.querySelectorAll(".selection-card__desc"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: DUR, stagger: 0.06, ease: Site.ease }, DUR * 0.6)
      .fromTo(sel.querySelectorAll(".selection-card__title"), { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: DUR, stagger: 0.06, ease: Site.ease }, DUR * 0.6);
    if (kbd) setTimeout(function () { var f = sel.querySelector(".selection-card"); if (f && selOpen) f.focus({ preventScroll: true }); }, 50);
  }

  function closeSelection(instant) {
    if (!selOpen) return;
    selOpen = false;
    if (selAnim) selAnim.kill();
    selBtn.setAttribute("aria-expanded", "false");
    var finish = function () {
      stage.classList.remove("is-mini");
      stage.style.clipPath = "";
      if (gsap) gsap.set(stage, { clearProps: "transform,transformOrigin" });
      else { stage.style.transform = ""; stage.style.transformOrigin = ""; }
      html.classList.remove("selection-open");
      sel.setAttribute("aria-hidden", "true");
      setInert(false);
      Site.startScroll && Site.startScroll();
      selAnim = null;
    };
    if (!gsap || instant === true) { finish(); return; }
    var tl = gsap.timeline({ onComplete: finish });
    selAnim = tl;
    tl.to(selCards, { yPercent: 110, opacity: 0, duration: DUR * 0.8, stagger: { each: 0.04, from: "end" }, ease: STANDARD }, 0)
      .to(stage, { x: 0, y: 0, scale: 1, duration: DUR, ease: STANDARD }, 0.05)
      .to(selBg, { opacity: 0, duration: DUR * 0.5, ease: "none" }, DUR * 0.5);
    if (sel.contains(d.activeElement)) selBtn.focus({ preventScroll: true });
  }
  function toggleSelection() { selOpen ? closeSelection() : openSelection(); }

  /* =====================================================================
     5. Nav menu
     ===================================================================== */
  var menu, menuOpen = false;
  function buildMenu() {
    menu = el("div", "nav-menu");
    menu.id = "nav-menu";
    menu.setAttribute("aria-hidden", "true");
    menu.innerHTML =
      '<div class="nav-menu__dim"></div>' +
      '<div class="nav-menu__panel" role="dialog" aria-modal="true" aria-label="Menu">' +
      '<nav class="nav-menu__links">' +
      ["Home|index.html", "About|about.html", "Contact|contact.html"].map(function (s) {
        var p = s.split("|");
        return '<span class="nav-menu__line"><a class="nav-menu__link rolling-text" data-rolling-text href="' + p[1] + '"' +
          (p[1] === file ? ' aria-current="page"' : "") + ' aria-label="' + p[0] + '">' + rolling(p[0]) + "</a></span>";
      }).join("") +
      "</nav>" +
      '<div class="nav-menu__social">' +
      '<a class="nav-menu__social-link" href="' + CONTACT.whatsapp + '" target="_blank" rel="noopener">' + CHAT_SVG + "<span>WhatsApp</span></a>" +
      '<a class="nav-menu__social-link" href="mailto:' + CONTACT.email + '">' + MAIL_SVG + "<span>Email</span></a>" +
      "</div></div>";
    body.appendChild(menu);
    menu.querySelector(".nav-menu__dim").addEventListener("click", closeMenu);
  }
  function openMenu() {
    if (menuOpen) return;
    if (selOpen) closeSelection(true);
    menuOpen = true;
    html.classList.add("menu-open");
    menu.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close menu");
    if (gsap) {
      gsap.fromTo(menu.querySelectorAll(".nav-menu__link"), { yPercent: 110 }, { yPercent: 0, duration: DUR * 1.25, stagger: 0.07, ease: Site.ease, delay: DUR * 0.25 });
      gsap.fromTo(menu.querySelectorAll(".nav-menu__social-link"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: DUR, stagger: 0.06, ease: Site.ease, delay: DUR * 0.45 });
    }
    if (kbd) setTimeout(function () { var a = menu.querySelector(".nav-menu__link"); if (a && menuOpen) a.focus({ preventScroll: true }); }, 60);
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    html.classList.remove("menu-open");
    menu.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  }
  function toggleMenu() { menuOpen ? closeMenu() : openMenu(); }

  /* =====================================================================
     6. Custom scrollbar
     ===================================================================== */
  var bar, thumb, barOn = false, dragging = false, dragStartY = 0, dragStartScroll = 0, idleT;
  function buildScrollbar() {
    if (page === "home") return;
    bar = el("div", "custom-scrollbar", '<div class="custom-scrollbar__thumb"></div>');
    bar.setAttribute("aria-hidden", "true");
    body.appendChild(bar);
    thumb = bar.firstChild;
    html.classList.add("has-custom-scrollbar");

    thumb.addEventListener("pointerdown", function (e) {
      dragging = true;
      dragStartY = e.clientY;
      dragStartScroll = scrollY();
      thumb.setPointerCapture(e.pointerId);
      bar.classList.add("is-dragging");
      e.preventDefault();
    });
    thumb.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var vh = w.innerHeight, max = maxScroll();
      var th = thumb.offsetHeight;
      var ratio = max / Math.max(1, vh - th);
      var y = Math.min(max, Math.max(0, dragStartScroll + (e.clientY - dragStartY) * ratio));
      if (Site.lenis) Site.lenis.scrollTo(y, { immediate: true, force: true });
      else w.scrollTo(0, y);
    });
    var end = function () { dragging = false; bar.classList.remove("is-dragging"); };
    thumb.addEventListener("pointerup", end);
    thumb.addEventListener("pointercancel", end);
    // click on track: jump
    bar.addEventListener("pointerdown", function (e) {
      if (e.target !== bar) return;
      var p = e.clientY / w.innerHeight;
      Site.scrollTo(p * maxScroll());
    });
  }
  function scrollY() { return Site.lenis ? Site.lenis.scroll : w.pageYOffset; }
  function maxScroll() { return Math.max(0, html.scrollHeight - w.innerHeight); }
  function updateScrollbar() {
    if (!bar) return;
    var vh = w.innerHeight, max = maxScroll();
    var on = max > 8;
    if (on !== barOn) { barOn = on; bar.classList.toggle("is-active", on); }
    if (!on) return;
    var th = Math.max(40, vh * vh / (max + vh));
    var y = (Math.min(max, Math.max(0, scrollY())) / max) * (vh - th);
    thumb.style.height = th + "px";
    thumb.style.transform = "translate3d(0," + y + "px,0)";
    bar.classList.add("is-scrolling");
    clearTimeout(idleT);
    idleT = setTimeout(function () { bar.classList.remove("is-scrolling"); }, 1200);
  }

  /* =====================================================================
     Actions theme (light/dark) based on what is under the buttons
     ===================================================================== */
  var forcedTheme = null, actionsTheme = null;
  function parseRGB(s) {
    var m = s && s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(",").map(parseFloat);
    if (p.length > 3 && p[3] < 0.5) return null;
    return p;
  }
  function themeAt(x, y) {
    // 1. explicit [data-theme] sections inside the stage
    var secs = stage ? stage.querySelectorAll("[data-theme]") : [];
    for (var i = secs.length - 1; i >= 0; i--) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= y && r.bottom >= y && r.left <= x && r.right >= x) return secs[i].getAttribute("data-theme");
    }
    // 2. first screen uses the body theme
    if (stage) {
      var sr = stage.getBoundingClientRect();
      if (y - sr.top < w.innerHeight) return body.getAttribute("data-theme") || "light";
    }
    // 3. sample the background colour under the point
    if (d.elementsFromPoint) {
      var els = d.elementsFromPoint(x, y);
      for (var j = 0; j < els.length; j++) {
        var n = els[j];
        if (actions.contains(n) || (bar && bar.contains(n))) continue;
        if (n.tagName === "IMG" || n.tagName === "VIDEO") return "dark";
        var rgb = parseRGB(getComputedStyle(n).backgroundColor);
        if (rgb) return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) < 140 ? "dark" : "light";
      }
    }
    return "light";
  }
  function updateActionsTheme() {
    if (!actions) return;
    var t = forcedTheme;
    if (!t) {
      var r = menuBtn.getBoundingClientRect();
      t = themeAt(r.left - 4, r.top + r.height / 2);
    }
    if (t !== actionsTheme) {
      actionsTheme = t;
      actions.setAttribute("data-theme", t);
      if (bar) bar.setAttribute("data-theme", t);
    }
  }

  /* =====================================================================
     Page transitions
     ===================================================================== */
  var leaving = false;
  function navigate(href, fromSelection) {
    if (leaving) return;
    leaving = true;
    var go = function () { w.location.href = href; };
    if (!gsap || reduced) { go(); return; }
    var targets = fromSelection ? [stage, selInner, selCurrent] : [stage];
    gsap.to(targets, { opacity: 0, duration: 0.45, ease: "power2.in", onComplete: go });
    if (!fromSelection) gsap.to(actions, { opacity: 0, duration: 0.45, ease: "power2.in" });
    setTimeout(go, 1200); // safety
  }

  function interceptLinks() {
    d.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target && a.target !== "_self" || a.hasAttribute("download") || a.hasAttribute("data-no-transition")) return;
      if (a.closest(".selection-shell")) return;
      var url;
      try { url = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || (url.protocol !== "http:" && url.protocol !== "https:")) return;
      if (url.pathname === location.pathname && url.search === location.search) {
        if (url.hash) { e.preventDefault(); closeMenu(); Site.scrollTo(url.hash); return; }
        if (!menuOpen) return;
      }
      e.preventDefault();
      closeMenu();
      navigate(url.href);
    });
    w.addEventListener("pageshow", function (e) {
      if (e.persisted && gsap) {
        leaving = false;
        gsap.set([stage, actions, selInner, selCurrent], { clearProps: "opacity" });
        closeSelection(true);
        closeMenu();
      }
    });
  }

  function pageEnter() {
    html.classList.add("shell-entered");
    if (!stage || !gsap || reduced) return;
    gsap.fromTo(stage, { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 1, ease: Site.ease,
      onComplete: function () { gsap.set(stage, { clearProps: "transform,opacity" }); onScroll(); }
    });
    gsap.fromTo(actions, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.3, ease: "none", clearProps: "opacity" });
  }

  /* =====================================================================
     Boot
     ===================================================================== */
  function onKey(e) {
    if (e.key === "Escape") {
      if (menuOpen) { var inMenu = menu.contains(d.activeElement); closeMenu(); if (inMenu) menuBtn.focus(); }
      else if (selOpen) closeSelection();
    }
  }

  var rafPending = false;
  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      updateScrollbar();
      updateActionsTheme();
    });
  }

  function boot() {
    stage = d.getElementById("page-stage");
    buildNav();
    buildActions();
    buildSelection();
    buildMenu();
    buildScrollbar();
    interceptLinks();
    d.addEventListener("keydown", onKey);
    w.addEventListener("scroll", onScroll, { passive: true });
    w.addEventListener("resize", function () {
      if (selOpen) closeSelection(true);
      onScroll();
    });
    if ("ResizeObserver" in w) new ResizeObserver(onScroll).observe(body);

    Site.shell = {
      openSelection: openSelection, closeSelection: closeSelection, toggleSelection: toggleSelection,
      openMenu: openMenu, closeMenu: closeMenu, toggleMenu: toggleMenu,
      navigate: function (href) { navigate(href); },
      hideActions: function () { html.classList.add("shell-actions-hidden"); },
      showActions: function () { html.classList.remove("shell-actions-hidden"); },
      setActionsTheme: function (t) { forcedTheme = t || null; actionsTheme = null; updateActionsTheme(); },
      update: onScroll
    };

    updateActionsTheme();
    if (Site.ready) {
      Site.ready(function () {
        if (Site.lenis) Site.lenis.on("scroll", onScroll);
        if (w.ScrollTrigger) w.ScrollTrigger.addEventListener("refresh", onScroll);
        onScroll();
        pageEnter();
      });
    } else {
      html.classList.add("shell-entered");
    }
    if (Site.shellReady) Site.shellReady();
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
