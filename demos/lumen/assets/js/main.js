// Shared chrome (header, drawer, footer) + motion for the LUMEN 8 demo.
(function () {
  const page = document.body.dataset.page || 'home';
  const nav = [
    ['home', 'index.html', 'Home'],
    ['services', 'services.html', 'Services'],
    ['about', 'about.html', 'About'],
    ['contact', 'contact.html', 'Contact'],
  ];
  const burger = '<button class="burger" type="button" aria-label="Open menu" data-open-menu><span></span></button>';
  // Typeset logo: wordmark + spaced subline.
  const brand = '<b class="mark">Lumen 8</b><span>Dentistry</span>';

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="site-header">
      <a class="logo brand" href="index.html" aria-label="LUMEN 8 home">${brand}</a>
      ${burger}
    </header>
    <div class="sticky-bar" aria-hidden="true">
      <a class="logo brand" href="index.html" tabindex="-1"><b class="mark">Lumen 8</b></a>
      ${burger}
    </div>
    <div class="drawer-overlay" data-close-menu></div>
    <aside class="drawer" aria-label="Menu">
      <button class="close" type="button" aria-label="Close menu" data-close-menu>&#x2715;</button>
      <a class="btn" href="contact.html#appointment">Book an appointment</a>
      <nav>${nav.map(([k, href, label]) => `<a href="${href}"${k === page ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    </aside>`);

  const footer = document.querySelector('[data-footer]');
  if (footer) footer.outerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <div class="cols">
          <a class="logo brand" href="index.html">${brand}</a>
          <div>
            <h4>Opening hours</h4>
            <p>Monday – Thursday<br><b>7:00 am – 7:00 pm</b></p>
            <p>Friday<br><b>7:00 am – 1:00 pm</b></p>
          </div>
          <div>
            <h4>Phone hours</h4>
            <p>Monday – Thursday:<br><b>7:00 – 11:00 am</b><br><b>2:00 – 5:00 pm</b></p>
            <p>Friday:<br><b>7:00 am – 1:00 pm</b></p>
          </div>
          <div>
            <h4>Address</h4>
            <p>Lindenstraße 8<br>84028 Landshut, Germany</p>
            <p><a href="tel:+4987143080">+49 871 43080</a><br><a href="mailto:hello@lumen8-dental.de">hello@lumen8-dental.de</a></p>
            <a class="ig" href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg></a>
          </div>
        </div>
        <p class="copy">© ${new Date().getFullYear()} LUMEN 8 | <a href="#">Legal notice</a> | <a href="#">Privacy policy</a></p>
      </div>
    </footer>`;

  // Menu
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-menu]')) setMenu(true);
    else if (e.target.closest('[data-close-menu]')) setMenu(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Sticky bar after the first screen
  const bar = document.querySelector('.sticky-bar');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    bar.classList.toggle('show', scrollY > 420);
    if (reduce) return;
    const vh = innerHeight;
    for (const el of parallax) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const k = parseFloat(el.dataset.parallax) || 0.08;
      const y = (r.top + r.height / 2 - vh / 2) * -k;
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Scroll reveal
  const io = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Hero: circle drifts toward the pointer
  const hero = document.querySelector('.hero');
  const circle = hero && hero.querySelector('.circle');
  if (circle && !reduce && matchMedia('(pointer: fine)').matches) {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const step = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      circle.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(step) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left - r.width / 2) * 0.12;
      ty = (e.clientY - r.top - r.height / 2) * 0.12;
      if (!raf) raf = requestAnimationFrame(step);
    });
    hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(step); });
  }

  // Demo form: no backend, just confirm locally
  const form = document.querySelector('form.form');
  if (form) {
    const consent = form.querySelector('#consent');
    const submit = form.querySelector('button[type=submit]');
    consent.addEventListener('change', () => { submit.disabled = !consent.checked; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.classList.add('sent');
      form.reset();
      submit.disabled = true;
    });
  }
})();
