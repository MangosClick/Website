// Shared page sections. Each <div data-part="name"></div> is replaced with the
// matching template below, synchronously, before main.js wires up behaviour.
(() => {
  const px = '<svg><use href="#px"/></svg>';
  const pic = (seed, w, h, gray = true) => `https://picsum.photos/seed/${seed}/${w}/${h}${gray ? '?grayscale' : ''}`;
  const btn = (href, label, extra = '') =>
    `<a href="${href}" class="btn ${extra}"><span class="btn__label"><span>${label}</span><span>${label}</span></span><span class="btn__sq">${px}</span></a>`;
  const brand = (cls = '') => `<span class="brand ${cls}"><svg class="brand__mark"><use href="#logo"/></svg><span class="brand__word">MANGOS</span></span>`;
  const kicker = (label) => `<div class="kicker">${px}<span class="mono">${label}</span></div>`;
  const page = document.body.dataset.page || '';
  const cur = (name) => (page === name ? ' aria-current="page"' : '');
  // Placeholder contact details: replace before publishing
  const MAIL = 'hello@mangos.click', PHONE = '+91 9061185683', TEL = 'tel:+919061185683';

  const sprite = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="px" viewBox="0 0 9 9"><path fill="currentColor" d="M0 0h3v3H0zM3 3h3v3H3zM6 3h3v3H6zM0 6h3v3H0z"/></symbol>
  <mask id="mangoMask"><image href="assets/img/mangos-mark-white.png" width="548" height="601"/></mask>
  <symbol id="logo" viewBox="0 0 548 601"><rect width="548" height="601" fill="currentColor" mask="url(#mangoMask)"/></symbol>
  <symbol id="chev" viewBox="0 0 12 12"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="star" viewBox="0 0 12 12"><path fill="currentColor" d="m6 .8 1.6 3.4 3.7.4-2.8 2.5.8 3.7L6 9 2.7 10.8l.8-3.7L.7 4.6l3.7-.4z"/></symbol>
  <symbol id="menuico" viewBox="0 0 10 10"><path fill="currentColor" d="M0 0h3v3H0zM7 0h3v3H7zM3.5 3.5h3v3h-3z"/></symbol>
  <symbol id="ico-wa" viewBox="0 0 24 24"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></symbol>
  <symbol id="ico-phone" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>
</defs></svg>`;

  const parts = {
    header: () => `
<header class="nav" id="top">
  <span class="nav__progress" id="progress"></span>
  <a href="index.html" aria-label="MANGOS home">${brand()}</a>
  <span class="sep"></span>
  <span class="mono mono--9">Website and Automation studio</span>
  <nav class="nav__links">
    <a href="index.html"${cur('home')}><span>Home</span><span>Home</span></a>
    <a href="websites.html"${cur('websites')}><span>Websites</span><span>Websites</span></a>
    <a href="automation.html" data-soon${cur('automation')}><span>Automation</span><span>Automation</span></a>
    <a href="about.html"${cur('about')}><span>About</span><span>About</span></a>
  </nav>
  <a href="contact.html" class="nav__pill"${cur('contact')}>Get a call back</a>
  <button class="nav__menu" id="menuBtn" aria-expanded="false" aria-controls="menu"><svg class="nav__menu-ico"><use href="#menuico"/></svg><span class="mono">Menu</span></button>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <div class="menu__scrim" data-close></div>
  <div class="menu__panel">
    <div class="menu__head"><span class="mono mono--9">Menu · 2026</span><span class="mono mono--9" data-clock>—</span></div>
    <div>
      <nav class="menu__links">
        <a href="index.html"><span>home</span><span>home</span></a>
        <a href="websites.html"><span>websites</span><span>websites</span></a>
        <a href="automation.html" data-soon><span>automation</span><span>automation</span></a>
        <a href="about.html"><span>about</span><span>about</span></a>
        <a href="contact.html"><span>contact</span><span>contact</span></a>
      </nav>
      <div class="menu__legal p11"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a></div>
    </div>
    <div class="menu__side"></div>
    <div class="menu__foot">
      <div><a class="mono" href="${TEL}">${PHONE}</a><a class="menu__mail" href="mailto:${MAIL}">${MAIL}</a></div>
      <div>
        <div class="menu__status"><span class="dot-live"></span><p class="p14">Two build slots open<small>Booking new sites this month</small></p></div>
        <a href="contact.html" class="link-arrow" style="margin-top:16px"><span class="mono">Get a</span><span class="mono mono--w">call back</span><span class="circ">${px}</span></a>
      </div>
    </div>
    <p class="menu__copy">© 2026 MANGOS.</p>
  </div>
</div>`,

    services: () => {
      const rows = [
        ['Business websites.', 'Custom-designed sites of five to fifteen pages that explain what you do, show your work and turn visitors into calls, bookings and WhatsApp chats.', ['Custom design', 'Mobile first', 'Fast', 'Easy to edit']],
        ['Starter sites.', 'A clean one-to-five page site for shops, tutors and single-service businesses going online for the first time. Live in about two weeks.', ['1–5 pages', 'Contact form', 'Maps', 'WhatsApp chat']],
        ['Redesigns.', 'Your current site, rebuilt to look like the business you are today, with clearer words and pages that load fast on any phone.', ['Fresh look', 'Better copy', 'Faster', 'Same domain']],
        ['Get found locally.', 'On-page SEO, your Google Business Profile and analytics: the setup jobs that help nearby customers find you.', ['SEO basics', 'Google profile', 'Analytics']],
        ['Landing pages.', 'One focused page for a launch, an offer or an ad campaign, built to turn clicks into enquiries.', ['One page', 'Fast', 'Ad-ready', 'Clear call to action']],
      ];
      return `
<section class="services" id="services">
  <div class="split services__head">
    <div class="r">
      <h2 class="h2 reveal">What we build.</h2>
      <p class="lead reveal">One small team from the first call to launch day. You get a site that looks right, loads fast and brings in enquiries.</p>
      <div class="reveal">${btn('contact.html', 'Get a call back')}</div>
    </div>
  </div>
  ${rows.map(([t, d, tags], i) => `
  <article class="svc"><div class="svc__inner">
    <div class="svc__num">/0${i + 1}<span class="dotgrid"></span></div>
    <div>
      <h3 class="h3">${t}</h3>
      <p class="p13">${d}</p>
      <div class="tags">${tags.map((x) => `<span class="chip">${x}</span>`).join('')}</div>
    </div>
  </div></article>`).join('')}
</section>`;
    },

    faq: () => {
      const qs = [
        ['How long does a website take?', 'A starter site is usually live in about two weeks. A larger business site takes three to five. You get a date in writing before we begin.'],
        ['What do I need to give you?', "Your logo if you have one, a few photos and a rough idea of what you sell. We help write the words, so you don't need finished copy."],
        ['Will I own the website?', 'Yes. The domain, the code and the content are yours. If you ever leave, you take all of it with you.'],
        ['Can I update it myself?', 'Business sites come with a simple editor for text and images, so everyday changes are yours to make. Bigger changes are quoted per job.'],
        ['Do you handle hosting and the domain?', 'Yes. We set both up in your name, or work with what you already have, so you always stay in control.'],
        ['Will my site show up on Google?', 'Every site ships with the basics done right: fast pages, clean headings, page titles and your Google Business Profile. Ranking takes time, but you start on solid ground.'],
      ];
      return `
<section class="faq" id="faq">
  ${kicker('FAQ')}
  <h2 class="h2c reveal">Before you book.</h2>
  <div class="faq__list reveal">
    ${qs.map(([q, a], i) => `
    <div class="qa${i === 0 ? ' open' : ''}">
      <button class="qa__q" aria-expanded="${i === 0}"><span>${q}</span><span class="qa__a"><p>${a}</p></span></button>
      <span class="qa__i" aria-hidden="true"><svg><use href="#chev"/></svg></span>
    </div>`).join('')}
  </div>
</section>
<section class="skip">
  <h2 class="h40 reveal">Rather just ask us?</h2>
  <span class="vline"></span>
  <p class="mono reveal">Talk straight to the person building it.</p>
  <div class="reveal">${btn('contact.html', 'Send a question', 'btn--c')}</div>
</section>`;
    },

    cta: () => `
<section class="cta">
  <div class="cta__img img" data-img="${pic('tbd-cta', 1800, 1100)}"></div><span class="grain"></span>
  ${brand('reveal')}
  <p class="mono reveal">Still without a proper website?</p>
  <h2 class="h2c reveal">Bring us your business. We'll bring it online.</h2>
  <span class="vline"></span>
  <p class="lead reveal">Tell us what you sell and who buys it. On the first call we'll suggest the right site, a timeline and a fixed price, in plain words.</p>
  <div class="cta__pair reveal"><span class="cta__face img" data-img="${pic('tbd-portrait', 300, 300)}"></span><span class="cta__plus"></span><span class="cta__you mono mono--w">You</span></div>
  <a href="contact.html" class="link-arrow reveal"><span class="mono">Get a</span><span class="mono mono--w">call back</span><span class="circ">${px}</span></a>
</section>`,

    project: () => `
<section class="project" id="contact">
  <div class="frame frame--soft">
    <div class="rail"><div class="rail__top"><span class="barcode barcode--v"></span><span class="vtext" data-clock>—</span></div></div>
    <form class="project__body" data-form novalidate>
      <h2 class="h2 reveal">Start a project.</h2>
      <div class="fields">
        <label class="field"><span class="field__l">${px}<span class="mono mono--w">Name</span></span><input name="name" placeholder="Priya Sharma" required /></label>
        <label class="field"><span class="field__l">${px}<span class="mono mono--w">Email</span></span><input name="email" type="email" placeholder="you@business.com" required /></label>
        <label class="field field--full"><span class="field__l">${px}<span class="mono mono--w">What do you need?</span></span><select name="need"><option data-ok="your new website">A new website</option><option data-ok="the redesign of your current site">A redesign of my current site</option><option data-ok="your landing page">A landing page</option><option value="automation" data-ok="your custom automation build">Custom automation builds</option><option data-ok="what you need">Not sure yet</option></select><svg class="field__chev"><use href="#chev"/></svg></label>
        <label class="field field--full"><span class="field__l">${px}<span class="mono mono--w">Anything else</span></span><textarea name="msg" rows="3" placeholder="Your business, your current site if you have one, anything that helps."></textarea></label>
      </div>
      <div class="form__foot"><button class="btn" type="submit"><span class="btn__label"><span>Send request</span><span>Send request</span></span><span class="btn__sq">${px}</span></button><p class="p11">By sending this you accept our<br/><a class="mono--w" href="terms.html">Terms</a> and <a class="mono--w" href="privacy.html">Privacy Policy</a>.</p></div>
      <div class="form__ok" role="status" tabindex="-1" hidden>
        <span class="form__tick"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19.5 7"/></svg></span>
        <p class="mono">Request sent</p>
        <p class="h3">Thanks<span data-ok-name></span>.</p>
        <p class="p14 muted">We'll contact you soon regarding <span class="form__need" data-ok-need>your request</span>. Need us sooner? Call <a href="${TEL}">${PHONE}</a>.</p>
        <button type="button" class="link-arrow" data-ok-again><span class="mono">Send</span><span class="mono mono--w">another request</span><span class="circ">${px}</span></button>
      </div>
    </form>
  </div>
</section>`,

    footer: (el) => `
<footer class="footer ${el.dataset.variant === 'gap' ? 'footer--gap' : 'footer--join'}">
  <div class="footer__img img" data-img="${pic('tbd-hero-a', 1000, 700)}">
    <span class="grain"></span><span class="footer__dots"></span>
    <div class="footer__brand">${brand()}<span class="sep"></span><span class="mono mono--9 mono--w">Website and Automation studio</span></div>
  </div>
  <div class="footer__body">
    <a class="footer__mail" href="mailto:${MAIL}">${MAIL}</a>
    <a class="mono mono--11" href="${TEL}">${PHONE}</a>
    <nav class="tags"><a class="tag" href="index.html">Home</a><a class="tag" href="websites.html">Websites</a><a class="tag" href="automation.html">Automation · Soon</a><a class="tag" href="about.html">About</a><a class="tag" href="contact.html">Contact</a></nav>
    <p class="p11 footer__copy">© 2026 MANGOS.<br/>All rights reserved.</p>
    <div class="footer__links p11"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a></div>
  </div>
</footer>`,
  };

  document.body.insertAdjacentHTML('afterbegin', sprite);
  document.querySelectorAll('[data-part]').forEach((el) => {
    const make = parts[el.dataset.part];
    if (make) el.outerHTML = make(el);
  });
  window.tbd = { btn, brand, kicker, pic, px };
})();
