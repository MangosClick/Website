/* =========================================================================
   contact.js: Contact page.
   - Custom dropdowns (listbox pattern, full keyboard support)
   - Investors / Partnership tabs with a sliding underline
   - Client-side validation with inline errors
   - Simulated submit -> animated thank-you state (no network requests)
   - Click-to-copy email channel
   ========================================================================= */
(function () {
  "use strict";

  var w = window, d = document;
  var Site = w.Site || {};
  var gsap = w.gsap;
  var reduced = !!Site.reducedMotion || !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  var root = $("[data-contact-form]");
  if (!root) return;

  /* ---------------------------------------------------------------------
     Custom select
     --------------------------------------------------------------------- */
  var CARET = '<svg class="select__caret" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 3.5 5 6.8l3.5-3.3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
  var openSelect = null;

  function buildSelect(el, idx) {
    var name = el.getAttribute("data-name");
    var label = el.getAttribute("data-label") || name;
    var opts = (el.getAttribute("data-options") || "").split("|");
    var required = el.hasAttribute("data-required");
    var uid = "sel-" + idx;
    el.innerHTML =
      '<input type="hidden" name="' + esc(name) + '" value="">' +
      '<button type="button" class="field__input select__trigger" id="' + uid + '-btn" aria-haspopup="listbox" aria-expanded="false"' +
      ' aria-labelledby="' + uid + '-lbl ' + uid + '-btn" aria-controls="' + uid + '-list" aria-describedby="' + uid + '-err"' +
      (required ? ' aria-required="true"' : "") + '><span class="select__value"></span>' + CARET + "</button>" +
      '<span class="field__label" id="' + uid + '-lbl">' + esc(label) + "</span>" +
      '<ul class="select__list" id="' + uid + '-list" role="listbox" tabindex="-1" aria-labelledby="' + uid + '-lbl">' +
      opts.map(function (o, i) {
        return '<li class="select__option" role="option" id="' + uid + "-o" + i + '" aria-selected="false" data-value="' + esc(o) + '">' + esc(o) + "</li>";
      }).join("") + "</ul>" +
      '<p class="field__error" id="' + uid + '-err"></p>';

    var input = $("input", el), btn = $(".select__trigger", el), list = $(".select__list", el);
    var valueEl = $(".select__value", el), options = $$(".select__option", el);
    var active = -1, typed = "", typedT;

    function setActive(i, scroll) {
      if (active > -1 && options[active]) options[active].classList.remove("is-active");
      active = Math.max(0, Math.min(options.length - 1, i));
      var o = options[active];
      o.classList.add("is-active");
      list.setAttribute("aria-activedescendant", o.id);
      if (scroll !== false) {
        var top = o.offsetTop, bottom = top + o.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    }
    function choose(i) {
      var o = options[i];
      if (!o) return;
      options.forEach(function (x) { x.setAttribute("aria-selected", x === o ? "true" : "false"); });
      input.value = o.getAttribute("data-value");
      valueEl.textContent = o.textContent;
      el.classList.add("is-filled");
      el.dispatchEvent(new CustomEvent("select:change", { bubbles: true }));
    }
    function open() {
      if (openSelect && openSelect !== api) openSelect.close(false);
      openSelect = api;
      el.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      var sel = options.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; });
      setActive(sel > -1 ? sel : 0);
      list.focus({ preventScroll: true });
    }
    function close(focusBtn) {
      if (!el.classList.contains("is-open")) return;
      el.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      list.removeAttribute("aria-activedescendant");
      if (openSelect === api) openSelect = null;
      if (focusBtn !== false) btn.focus({ preventScroll: true });
    }
    function typeahead(ch) {
      clearTimeout(typedT);
      typed += ch.toLowerCase();
      typedT = setTimeout(function () { typed = ""; }, 600);
      var start = typed.length === 1 ? active + 1 : active;
      for (var k = 0; k < options.length; k++) {
        var i = (start + k) % options.length;
        if (options[i].textContent.toLowerCase().indexOf(typed) === 0) { setActive(i); return true; }
      }
      return false;
    }

    btn.addEventListener("click", function () { el.classList.contains("is-open") ? close() : open(); });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      else if (e.key.length === 1 && /\S/.test(e.key)) { open(); typeahead(e.key); }
    });
    list.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); setActive(active + 1); break;
        case "ArrowUp": e.preventDefault(); setActive(active - 1); break;
        case "Home": e.preventDefault(); setActive(0); break;
        case "End": e.preventDefault(); setActive(options.length - 1); break;
        case "Enter": case " ": e.preventDefault(); choose(active); close(); break;
        case "Escape": e.preventDefault(); e.stopPropagation(); close(); break;
        case "Tab": choose(active); close(false); break;
        default:
          if (e.key.length === 1 && /\S/.test(e.key)) { e.preventDefault(); typeahead(e.key); }
      }
    });
    options.forEach(function (o, i) {
      o.addEventListener("mousemove", function () { if (active !== i) setActive(i, false); });
      o.addEventListener("click", function () { choose(i); close(); });
    });
    // keep the page from scrolling (Lenis) while the list scrolls
    list.setAttribute("data-lenis-prevent", "");

    var api = {
      el: el, input: input, btn: btn, close: close, required: required,
      reset: function () {
        input.value = ""; valueEl.textContent = ""; el.classList.remove("is-filled");
        options.forEach(function (x) { x.setAttribute("aria-selected", "false"); });
      }
    };
    el._select = api;
    return api;
  }

  var selects = $$("[data-select]", root).map(buildSelect);
  d.addEventListener("pointerdown", function (e) {
    if (openSelect && !openSelect.el.contains(e.target)) openSelect.close(false);
  });
  // Escape inside an open list must not reach the shell's global handler first
  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openSelect) { e.stopPropagation(); openSelect.close(); }
  }, true);

  /* ---------------------------------------------------------------------
     Tabs
     --------------------------------------------------------------------- */
  var tablist = $(".contact-form-tabs", root);
  var tabs = $$(".contact-form-tabs__tab", root);
  var forms = $$(".contact-page-form", root);
  var current = "investors";
  tablist.setAttribute("data-active", current);

  function showTab(name, focus) {
    if (name === current) return;
    var from = $('[data-form="' + current + '"]', root), to = $('[data-form="' + name + '"]', root);
    current = name;
    tablist.setAttribute("data-active", name);
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-tab") === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.setAttribute("tabindex", on ? "0" : "-1");
      if (on && focus) t.focus();
    });
    if (openSelect) openSelect.close(false);
    var swap = function () {
      from.hidden = true; from.classList.remove("is-active");
      to.hidden = false; to.classList.add("is-active");
      if (gsap && !reduced) gsap.fromTo(to.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.035, ease: "expo.out", clearProps: "opacity,transform" });
      if (Site.refresh) Site.refresh();
    };
    if (gsap && !reduced) gsap.to(from, { opacity: 0, y: -8, duration: 0.25, ease: "power2.in", onComplete: function () { gsap.set(from, { clearProps: "opacity,transform" }); swap(); } });
    else swap();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showTab(t.getAttribute("data-tab")); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        showTab(n.getAttribute("data-tab"), true);
      }
    });
  });

  /* ---------------------------------------------------------------------
     Validation
     --------------------------------------------------------------------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var URL_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;
  var MSG = {
    fullname: "Please tell us your name.",
    email: "Please enter your email address.",
    emailBad: "That email address doesn’t look quite right.",
    phone: "Please enter a phone number.",
    phoneBad: "Use digits, spaces, + or -, at least 6 digits.",
    company: "Please enter your company name.",
    urlBad: "Please enter a valid web address.",
    select: "Please choose an option.",
    consent: "Please accept to continue."
  };

  function fieldOf(node) { return node.closest(".field"); }
  function setError(field, msg, control) {
    var err = field && $(".field__error", field);
    if (!field) return;
    field.classList.toggle("is-invalid", !!msg);
    if (err) {
      if (!err.id) err.id = "err-" + Math.random().toString(36).slice(2, 8);
      err.textContent = msg || "";
    }
    if (control) {
      control.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) control.setAttribute("aria-describedby", err.id);
    }
  }

  function checkInput(inp) {
    var v = inp.value.trim(), msg = "";
    if (inp.required && !v) msg = MSG[inp.name] || (inp.type === "email" ? MSG.email : "This field is required.");
    else if (v && inp.type === "email" && !EMAIL.test(v)) msg = MSG.emailBad;
    else if (v && inp.getAttribute("data-validate") === "phone" && (!/^[+\d][\d\s().-]*$/.test(v) || v.replace(/\D/g, "").length < 6)) msg = MSG.phoneBad;
    else if (v && inp.getAttribute("data-validate") === "url" && !URL_RE.test(v)) msg = MSG.urlBad;
    setError(fieldOf(inp), msg, inp);
    return !msg;
  }
  function checkSelect(api) {
    var msg = api.required && !api.input.value ? MSG.select : "";
    setError(api.el, msg, api.btn);
    return !msg;
  }
  function checkConsent(form) {
    var box = $('input[name="consent"]', form);
    var wrap = $(".lead-form__consents", form);
    var ok = box.checked;
    wrap.classList.toggle("is-invalid", !ok);
    var err = $(".field__error", wrap);
    if (!err.id) err.id = form.id + "-consent-err";
    err.textContent = ok ? "" : MSG.consent;
    box.setAttribute("aria-invalid", ok ? "false" : "true");
    box.setAttribute("aria-describedby", err.id);
    return ok;
  }
  function validate(form) {
    var first = null, ok = true;
    $$("input.field__input, textarea.field__input", form).forEach(function (inp) {
      if (!checkInput(inp)) { ok = false; first = first || inp; }
    });
    $$("[data-select]", form).forEach(function (el) {
      if (!checkSelect(el._select)) { ok = false; first = first || el._select.btn; }
    });
    if (!checkConsent(form)) { ok = false; first = first || $('input[name="consent"]', form); }
    return { ok: ok, first: first };
  }

  forms.forEach(function (form) {
    // live re-validation once the user has tried to submit
    form.addEventListener("input", function (e) {
      if (!form.classList.contains("was-submitted")) return;
      if (e.target.matches(".field__input")) checkInput(e.target);
    });
    form.addEventListener("focusout", function (e) {
      if (!form.classList.contains("was-submitted")) return;
      if (e.target.matches("input.field__input, textarea.field__input")) checkInput(e.target);
    });
    form.addEventListener("select:change", function (e) {
      if (form.classList.contains("was-submitted")) checkSelect(e.target._select);
    });
    form.addEventListener("change", function (e) {
      if (e.target.name === "consent" && form.classList.contains("was-submitted")) checkConsent(form);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("was-submitted");
      var res = validate(form);
      if (!res.ok) {
        if (res.first) res.first.focus({ preventScroll: false });
        var btn0 = $(".send-btn", form);
        if (gsap && !reduced) gsap.to(btn0, { keyframes: [{ x: -6, duration: 0.1 }, { x: 5, duration: 0.1 }, { x: -3, duration: 0.1 }, { x: 0, duration: 0.1 }], ease: "power1.inOut" });
        return;
      }
      // simulated send: no network request is made
      var btn = $(".send-btn", form), label = $(".send-btn__label", btn);
      btn.classList.add("is-busy");
      btn.setAttribute("aria-disabled", "true");
      label.textContent = "Sending…";
      setTimeout(function () { showThanks(form); }, reduced ? 50 : 900);
    });
  });

  /* ---------------------------------------------------------------------
     Thank-you state
     --------------------------------------------------------------------- */
  var thanks = $(".contact-thanks", root);
  var panels = $(".contact-form-panels", root);

  function showThanks(form) {
    var hideTargets = [tablist, panels];
    var reveal = function () {
      hideTargets.forEach(function (n) { n.hidden = true; });
      thanks.hidden = false;
      // reflow so the icon's stroke transition runs
      void thanks.offsetWidth;
      thanks.classList.add("is-visible");
      thanks.focus({ preventScroll: true });
      if (gsap && !reduced) gsap.fromTo($$(".contact-thanks__title, .contact-thanks__text, .contact-thanks__again", thanks),
        { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out", delay: 0.25, clearProps: "opacity,transform" });
      if (Site.refresh) Site.refresh();
    };
    if (gsap && !reduced) gsap.to(hideTargets, { opacity: 0, y: -16, duration: 0.45, stagger: 0.05, ease: "power2.in", onComplete: function () { gsap.set(hideTargets, { clearProps: "opacity,transform" }); reveal(); } });
    else reveal();
    form._sent = true;
  }

  $(".contact-thanks__again", thanks).addEventListener("click", function () {
    forms.forEach(function (form) {
      form.reset();
      form.classList.remove("was-submitted");
      $$(".field.is-invalid", form).forEach(function (f) { f.classList.remove("is-invalid"); });
      $$(".lead-form__consents", form).forEach(function (f) { f.classList.remove("is-invalid"); });
      $$("[aria-invalid]", form).forEach(function (n) { n.setAttribute("aria-invalid", "false"); });
      var btn = $(".send-btn", form);
      btn.classList.remove("is-busy"); btn.removeAttribute("aria-disabled");
      $(".send-btn__label", btn).textContent = "Send";
    });
    selects.forEach(function (s) { s.reset(); });
    thanks.classList.remove("is-visible");
    thanks.hidden = true;
    tablist.hidden = false; panels.hidden = false;
    if (gsap && !reduced) gsap.fromTo([tablist, panels], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "expo.out", clearProps: "opacity,transform" });
    var first = $(".contact-page-form.is-active .field__input", root);
    if (first) first.focus({ preventScroll: true });
  });

  /* ---------------------------------------------------------------------
     Click-to-copy email
     --------------------------------------------------------------------- */
  $$("[data-copy]").forEach(function (a) {
    var t;
    a.addEventListener("click", function (e) {
      if (!navigator.clipboard || !w.isSecureContext) return; // fall back to the mailto link
      e.preventDefault();
      navigator.clipboard.writeText(a.getAttribute("data-copy")).then(function () {
        a.classList.add("is-copied");
        clearTimeout(t);
        t = setTimeout(function () { a.classList.remove("is-copied"); }, 1800);
      }, function () { w.location.href = a.href; });
    });
  });

  /* ---------------------------------------------------------------------
     Entrance
     --------------------------------------------------------------------- */
  function enter() {
    if (!gsap || reduced) return;
    gsap.from([tablist].concat($$(".contact-page-form.is-active > *", root)), {
      opacity: 0, y: 22, duration: 1.1, stagger: 0.045, ease: "expo.out", delay: 0.25, clearProps: "opacity,transform"
    });
  }
  if (Site.ready) Site.ready(enter); else enter();
})();
