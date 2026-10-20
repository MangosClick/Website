// Shared header/footer + interactions for the Palmview Dentistry demo.
const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm16 5h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1v3l-4-3h-5a1 1 0 0 1-1-1v-1h6a3 3 0 0 0 3-3V8ZM6 7v1.5h8V7H6Zm0 3v1.5h6V10H6Z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  sedation: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c-5 0-7 4-7 9 0 4 2 7 3 11 1 5 2 12 5 12s3-5 4-9c.5-2 2-3 4-3s3.5 1 4 3c1 4 1 9 4 9s4-7 5-12c.5-2 1-4 2-6"/><path d="M12 8c3 0 5 2 9 2"/><path d="m28 4 4 4m-2-6 2 2 6 6 8 8-4 4-8-8-6-6Z"/></svg>',
  aligner: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="4" y="10" width="40" height="12" rx="5"/><rect x="4" y="26" width="40" height="12" rx="5"/><path d="M11 10v12m8-12v12m10-12v12m8-12v12M11 26v12m8-12v12m10-12v12m8-12v12"/></svg>',
  implant: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h20c2 0 3 2 3 4 0 4-3 6-3 8H14c0-2-3-4-3-8 0-2 1-4 3-4Z"/><path d="M12 18h24M15 23h18m-16 5h14m-12 5h10m-8 5h6l-3 6-3-6"/></svg>',
  cosmetic: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="14" r="8"/><path d="M16 12c4 0 8-3 9-6m-9 31c0-6 3-10 8-10s8 4 8 10M8 44c0-6 3-10 8-12m24 12c0-6-3-10-8-12"/><circle cx="34" cy="38" r="6"/><path d="M32 37c1-1 3-1 4 0"/></svg>',
};

const SOCIAL = {
  facebook: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-1.6 19.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 12 2Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z"/></svg>',
  google: '<svg viewBox="0 0 24 24"><path d="M8 11v2.4h4c-.2 1-1.2 3-4 3a4.4 4.4 0 0 1 0-8.8c1.4 0 2.3.6 2.8 1.1l1.9-1.8A6.7 6.7 0 0 0 8 5a7 7 0 1 0 0 14c4 0 6.7-2.8 6.7-6.8l-.1-1.2H8Zm16 0h-2V9h-2v2h-2v2h2v2h2v-2h2"/></svg>',
  twitter: '<svg viewBox="0 0 24 24"><path d="M23 5a9 9 0 0 1-2.6.7A4.5 4.5 0 0 0 22.4 3a9 9 0 0 1-2.9 1.1 4.5 4.5 0 0 0-7.7 4.1A12.8 12.8 0 0 1 2.5 3.5a4.5 4.5 0 0 0 1.4 6 4.5 4.5 0 0 1-2-.6 4.5 4.5 0 0 0 3.6 4.5 4.5 4.5 0 0 1-2 .1 4.5 4.5 0 0 0 4.2 3.1A9 9 0 0 1 1 18.4 12.8 12.8 0 0 0 8 20.5c8.3 0 12.8-6.9 12.8-12.8v-.6A9 9 0 0 0 23 5Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM18.4 6.8a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0ZM21.9 8c0-1.7-.5-3.2-1.7-4.4C19 2.5 17.5 2 15.8 2 14 2 10 2 8.2 2 6.5 2 5 2.5 3.8 3.7 2.6 4.9 2.1 6.4 2.1 8 2 9.9 2 14 2.1 15.8c0 1.7.5 3.2 1.7 4.4 1.2 1.2 2.7 1.7 4.4 1.7 1.8.1 5.8.1 7.6 0 1.7 0 3.2-.5 4.4-1.7 1.2-1.2 1.7-2.7 1.7-4.4.1-1.8.1-5.9 0-7.8Zm-2.3 9.8a3.2 3.2 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.8.4s-4.5.1-5.8-.4a3.2 3.2 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.8s-.1-4.5.4-5.8a3.2 3.2 0 0 1 1.8-1.8C7.5 3.9 10.5 4 12 4s4.5-.1 5.8.4a3.2 3.2 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.8s.1 4.5-.4 5.8Z"/></svg>',
};

const BOOK = 'contact.html#form';
const LOGO = '<span class="brand"><span class="brand-top">PALMVIEW</span><span class="brand-script">Dentistry</span><span class="brand-tag">Restorative · Cosmetic · Implants</span></span>';
const page = document.body.dataset.page;

const NAV = [
  { label: 'Home', href: 'index.html', key: 'home' },
  { label: 'About', href: 'about.html', key: 'about', sub: [['Meet Our Doctor', 'meet-our-doctor.html'], ['Office Tour', 'about.html'], ['Testimonials', 'index.html#reviews'], ['Patient Portal', BOOK]] },
  { label: 'Services', href: 'services.html', key: 'services', sub: [['General Dentistry', 'services.html'], ['Cosmetic Dentistry', 'services.html'], ['Preventative Dentistry', 'services.html'], ['Restorative Dentistry', 'services.html'], ['Pediatric Dentistry', 'services.html'], ['Sedation Dentistry', 'services.html'], ['Dental Technology', 'services.html']] },
  { label: 'New Patients', href: BOOK, key: 'new', sub: [['Appointments', BOOK], ['Insurance', 'contact.html'], ['Initial Visit', 'contact.html'], ['Financial Options', 'contact.html']] },
  { label: 'Online Forms', href: BOOK, key: 'forms', sub: [['New Patient Forms', BOOK], ['Existing Patients', BOOK]] },
  { label: 'Contact', href: 'contact.html', key: 'contact' },
];

function renderHeader() {
  const active = page === 'doctor' ? 'about' : page;
  const items = NAV.map(n => `
    <li><a href="${n.href}" class="${n.key === active ? 'is-active' : ''}">${n.label}</a>
      ${n.sub ? `<ul class="dropdown">${n.sub.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>` : ''}
    </li>`).join('');
  document.getElementById('site-header').outerHTML = `
  <header class="site-header" id="header">
    <div class="header-inner">
      <a href="index.html" class="logo" aria-label="Palmview Dentistry home">${LOGO}</a>
      <ul class="nav" id="nav">${items}</ul>
      <a class="header-cta" href="tel:+13105550142">${ICONS.chat}<span><small>Book Appointment</small><strong>(310) 555-0142</strong></span></a>
      <button class="menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false">${ICONS.menu}</button>
    </div>
  </header>`;
}

const SERVICE_STRIP = [
  ['sedation', 'Sedation Dentistry', 'Relax through your visit with calm, closely monitored sedation options.'],
  ['aligner', 'Invisalign', 'Straighten your teeth discreetly with custom clear aligners.'],
  ['implant', 'Dental Implants', 'Dr. Marsh and Dr. Reyes plan and place implants as one team.'],
  ['cosmetic', 'Cosmetic Dentistry', 'Veneers, bonding and whitening tailored to your face and style.'],
];

function renderFooter() {
  const strip = SERVICE_STRIP.map(([ic, t, d], i) => `
    <a class="card reveal reveal-d${i}" href="services.html"><div class="ico">${ICONS[ic]}</div><h3>${t}</h3><p>${d}</p><span class="arrow">→</span></a>`).join('');
  document.getElementById('site-footer').outerHTML = `
  <section class="section bg-lavender"><div class="wrap cards">${strip}</div></section>
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        ${LOGO}
        <div class="socials">
          <a href="#" aria-label="Facebook" target="_blank" rel="noopener">${SOCIAL.facebook}</a>
          <a href="#" aria-label="YouTube" target="_blank" rel="noopener">${SOCIAL.youtube}</a>
          <a href="#" aria-label="Google" target="_blank" rel="noopener">${SOCIAL.google}</a>
          <a href="#" aria-label="Twitter" target="_blank" rel="noopener">${SOCIAL.twitter}</a>
          <a href="#" aria-label="Instagram" target="_blank" rel="noopener">${SOCIAL.instagram}</a>
        </div>
      </div>
      <div class="footer-cols">
        <div><h4>Contact</h4><ul class="footer-contact">
          <li><svg viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.5-.2-3.6-.6a1 1 0 0 0-1 .2l-2.2 2.2a15 15 0 0 1-6.6-6.6l2.2-2.2a1 1 0 0 0 .3-1A11 11 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1Z"/></svg><a href="tel:+13105550142">(310) 555-0142</a></li>
          <li><svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg><a href="mailto:hello@palmviewdentistry.com">hello@palmviewdentistry.com</a></li>
          <li><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg><a href="https://maps.google.com/?q=1520+Wilshire+Blvd+Santa+Monica+CA+90403" target="_blank" rel="noopener">1520 Wilshire Blvd., Suite 300,<br>Santa Monica, CA 90403</a></li>
        </ul></div>
        <div><h4>Services</h4><ul>
          ${['General', 'Cosmetic', 'Preventive', 'Restorative', 'Pediatric', 'Sedation'].map(s => `<li><a href="services.html">${s} Dentistry</a></li>`).join('')}
          <li><a href="services.html">Dental Technology</a></li>
        </ul></div>
        <div><h4>Meet Us</h4><ul>
          <li><a href="meet-our-doctor.html">Meet Our Doctor</a></li><li><a href="about.html">Office Tour</a></li>
          <li><a href="index.html#reviews">Testimonials</a></li><li><a href="${BOOK}">Patient Portal</a></li>
        </ul></div>
        <div><h4>Hours</h4><ul>
          ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => `<li>${d}: 8am – 6pm</li>`).join('')}
          <li>Saturday: 9am – 2pm</li><li>Sunday: Closed</li>
        </ul></div>
      </div>
      <div class="footer-bottom">
        <p>© Copyright ${new Date().getFullYear()} Palmview Dentistry, All Rights Reserved. Palmview Dentistry in Santa Monica offers expert care in restorative and cosmetic dentistry, including state-of-the-art dental implants. Also serving Venice, Westwood, Pacific Palisades, and surrounding areas.</p>
        <p>Palmview Dentistry is a fictional practice created for demonstration purposes. Please do not submit personal or health information through the forms on this site.</p>
      </div>
    </div>
  </footer>
  <a class="float-book" href="${BOOK}">Book Online</a>
  <div class="modal" id="modal" aria-hidden="true"><button class="modal-close" aria-label="Close video">×</button><div class="modal-inner"></div></div>`;
}

renderHeader();
renderFooter();

// Header turns solid once the page scrolls.
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 60);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const toggle = document.getElementById('menu-toggle');
toggle.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  toggle.setAttribute('aria-expanded', open);
});

// Hero slider.
const slides = [...document.querySelectorAll('.hero-slide')];
if (slides.length) {
  const dots = document.querySelector('.hero-dots');
  let current = 0, timer;
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Slide ${i + 1}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dots.appendChild(b);
  });
  const go = i => {
    slides[current].classList.remove('is-active');
    dots.children[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots.children[current].classList.add('is-active');
  };
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(current + 1), 6000); };
  go(0);
  restart();
}

// Scroll reveal + count-up.
const countUp = el => {
  const end = +el.dataset.count;
  const start = end > 1000 ? end - 40 : 0;
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / 1600, 1);
    el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in');
  if (e.target.dataset.count) countUp(e.target);
  io.unobserve(e.target);
}), { threshold: 0.15 });
document.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el));

// Reviews carousel.
const track = document.querySelector('.reviews-track');
if (track) {
  let idx = 0;
  const step = dir => {
    const cards = track.children;
    const perView = Math.round(track.parentElement.offsetWidth / cards[0].offsetWidth);
    const max = cards.length - perView;
    idx = idx + dir > max ? 0 : idx + dir < 0 ? max : idx + dir;
    track.style.transform = `translateX(${-idx * (cards[0].offsetWidth + 20)}px)`;
  };
  document.querySelector('[data-rev="prev"]').addEventListener('click', () => step(-1));
  document.querySelector('[data-rev="next"]').addEventListener('click', () => step(1));
  setInterval(() => step(1), 7000);
}

// Video modal.
const modal = document.getElementById('modal');
const closeModal = () => { modal.classList.remove('is-open'); modal.querySelector('.modal-inner').innerHTML = ''; };
// Demo: no real video yet, so the modal shows a placeholder slot.
document.querySelectorAll('.play').forEach(btn => btn.addEventListener('click', () => {
  modal.querySelector('.modal-inner').innerHTML = '<div class="video-placeholder"><span>▶</span><p>Office tour video goes here</p></div>';
  modal.classList.add('is-open');
}));
modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('modal-close')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Demo forms: no backend, just confirm.
document.querySelectorAll('form.form').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault();
  f.querySelector('.form-note').textContent = 'Thank you! This is a demo form, so nothing was sent.';
  f.reset();
}));
