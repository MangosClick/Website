// Mango chat bubble. Talks to /api/chat; history lives in sessionStorage so the
// conversation carries over when the bot takes the visitor to another page.
(() => {
  const KEY = 'mangos-chat';
  const GREETING = "Hey there! 👋 I'm Mango, the MANGOS helper. Thinking about a website for your business? Ask me anything: what we build, how long it takes, or I can show you our demo sites.";
  const SUGGESTIONS = ['Show me your demo sites 👀', 'How long does a website take?', 'Will I own my site?', "I'd like a call back"];
  const phone = matchMedia('(max-width: 560px)');
  // Idle nudges beside the bubble, picked by page
  const TIPS = {
    home: ['Need any help? 👋', 'Want to see our demo sites?', 'Curious how long a website takes?', 'Got a business? Ask me how a site could help 🥭'],
    websites: ['Like one of these? Ask me about it 🙂', 'Want a site like this for your business?', 'Need help picking a demo to try?'],
    automation: ['Curious what we could automate for you?', 'Want to be first in line? Ask me 👋'],
    about: ['Any questions about us? Just ask 🙂', 'Want to know how we work?'],
    contact: ['Not sure what to pick? I can help 🙂', 'Got a question before you send?'],
  };
  const IDLE_MS = 6000;
  const WHATSAPP = 'https://wa.me/919061185683?text=' + encodeURIComponent('Hi MANGOS! I have a question about a website.');
  const WA_ICON = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>';

  // Bot text: **key facts** become orange tags; emails and phone numbers become links
  const LINKABLE = /([\w.+-]+@[\w-]+\.[\w.]+)|(\+91[\s-]?\d{5}[\s-]?\d{5})/g;
  const linkify = (parent, text) => {
    let last = 0;
    for (const m of text.matchAll(LINKABLE)) {
      parent.append(text.slice(last, m.index));
      const a = document.createElement('a');
      a.className = 'mchat__inline';
      a.href = m[1] ? 'mailto:' + m[1] : 'tel:' + m[2].replace(/[\s-]/g, '');
      a.textContent = m[0];
      parent.appendChild(a);
      last = m.index + m[0].length;
    }
    parent.append(text.slice(last));
  };
  const richText = (parent, text) => {
    text.split(/\*\*(.+?)\*\*/g).forEach((part, i) => {
      if (i % 2) {
        const mark = document.createElement('mark');
        mark.className = 'mchat__hl';
        linkify(mark, part);
        parent.appendChild(mark);
      } else linkify(parent, part.replace(/\*\*/g, ''));
    });
  };

  let state = { open: false, msgs: [], tipsOff: false };
  try { state = { ...state, ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; } catch (e) { /* storage blocked: start fresh */ }
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* not critical */ } };

  const root = document.createElement('div');
  root.className = 'mchat';
  root.innerHTML = `
<section class="mchat__panel" id="mchatPanel" role="dialog" aria-label="Chat with MANGOS" aria-hidden="true">
  <header class="mchat__head">
    <span class="mchat__avatar" aria-hidden="true"><i class="mchat__mango"></i></span>
    <div class="mchat__title"><p>Mango</p><span class="mono mono--9"><span class="dot-live"></span>MANGOS helper · here to help</span></div>
    <button class="mchat__close" type="button" aria-label="Close chat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg></button>
  </header>
  <div class="mchat__log" aria-live="polite" data-lenis-prevent></div>
  <div class="mchat__chips"></div>
  <form class="mchat__form" autocomplete="off">
    <input class="mchat__input" name="q" maxlength="500" placeholder="Ask me anything about your website…" aria-label="Your message" required>
    <button class="mchat__send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  </form>
  <p class="mchat__note mono mono--9">AI assistant · can make mistakes · <a href="/contact.html">talk to a person</a></p>
</section>
<div class="mchat__tip" aria-live="polite">
  <button class="mchat__tip-text" type="button"></button>
  <button class="mchat__tip-x" type="button" aria-label="Hide tips"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>
</div>
<button class="mchat__fab" type="button" aria-label="Chat with MANGOS" aria-expanded="false" aria-controls="mchatPanel">
  <i class="mchat__mango" aria-hidden="true"></i>
  <svg class="mchat__x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
</button>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const panel = $('.mchat__panel'), fab = $('.mchat__fab'), log = $('.mchat__log');
  const chips = $('.mchat__chips'), form = $('.mchat__form'), input = $('.mchat__input');
  let busy = false;

  const herePage = () => location.pathname.split('/').pop() || 'index.html';

  // Same page: glide to the section (main.js handles #anchors). Other page: load it.
  const goTo = (href) => {
    const [pageName, hash] = href.split('#');
    // Already on this page, or the section is here too (FAQ, services and the
    // enquiry form appear on several pages): glide to it instead of leaving.
    if (pageName === herePage() || (hash && document.getElementById(hash))) {
      if (phone.matches) setOpen(false);
      const a = document.createElement('a');
      a.href = '#' + (hash || 'top');
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      state.open = !phone.matches;
      save();
      location.href = '/' + href;
    }
  };

  const bubble = (m) => {
    const el = document.createElement('div');
    el.className = 'mchat__msg mchat__msg--' + (m.role === 'user' ? 'user' : 'bot');
    const p = document.createElement('p');
    if (m.role === 'user') p.textContent = m.content;
    else richText(p, m.content);
    el.appendChild(p);
    if (m.role !== 'user' && /whats\s?app/i.test(m.content)) {
      const wa = document.createElement('a');
      wa.className = 'mchat__link mchat__link--wa';
      wa.href = WHATSAPP;
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.innerHTML = '<span class="mono mono--w">WhatsApp us</span><span class="mchat__circ">' + WA_ICON + '</span>';
      el.appendChild(wa);
    }
    if (m.link) {
      const a = document.createElement('a');
      a.className = 'mchat__link mchat__link--go';
      a.href = '/' + m.link.href;
      a.innerHTML = '<span class="mono mono--w"></span><span class="mchat__circ"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      a.firstChild.textContent = m.link.label;
      a.addEventListener('click', (e) => { e.preventDefault(); goTo(m.link.href); });
      el.appendChild(a);
    }
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  };

  const render = () => {
    log.innerHTML = '';
    bubble({ role: 'assistant', content: GREETING });
    state.msgs.forEach(bubble);
    chips.innerHTML = '';
    chips.hidden = state.msgs.length > 0;
    SUGGESTIONS.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mchat__chip mono';
      b.textContent = s;
      b.addEventListener('click', () => send(s));
      chips.appendChild(b);
    });
  };

  const setOpen = (open) => {
    state.open = open;
    save();
    root.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    fab.setAttribute('aria-expanded', String(open));
    fab.setAttribute('aria-label', open ? 'Close chat' : 'Chat with MANGOS');
    if (open && !phone.matches) setTimeout(() => input.focus({ preventScroll: true }), 250);
    if (open) hideTip();
  };

  // Idle tips: after IDLE_MS of no input, show a tip, then rotate every IDLE_MS
  // while the visitor stays idle. Stops for the session once they chat or close it.
  const tip = $('.mchat__tip'), tipText = $('.mchat__tip-text');
  const tips = TIPS[document.body.dataset.page] || TIPS.home;
  let tipIdx = 0, idleTimer = 0, rotateTimer = 0;
  const tipsAllowed = () => !state.tipsOff && !state.open && !state.msgs.length;
  function hideTip() {
    clearInterval(rotateTimer);
    root.classList.remove('has-tip');
  }
  function showTip() {
    if (!tipsAllowed()) return;
    if (document.documentElement.classList.contains('is-loading')) return resetIdle(); // wait out the intro loader
    clearInterval(rotateTimer);
    tipText.textContent = tips[tipIdx % tips.length];
    root.classList.add('has-tip');
    rotateTimer = setInterval(() => {
      tipIdx++;
      tip.classList.add('is-swapping');
      setTimeout(() => { tipText.textContent = tips[tipIdx % tips.length]; tip.classList.remove('is-swapping'); }, 200);
    }, IDLE_MS);
  }
  const resetIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(showTip, IDLE_MS); };
  const onActive = (e) => {
    if (e.target instanceof Node && tip.contains(e.target)) return;
    if (root.classList.contains('has-tip')) { hideTip(); tipIdx++; }
    resetIdle();
  };
  ['scroll', 'wheel', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, onActive, { passive: true }));
  // Moving the mouse (e.g. towards the tip) delays the next tip but doesn't hide one
  addEventListener('pointermove', () => { if (!root.classList.contains('has-tip')) resetIdle(); }, { passive: true });
  tipText.addEventListener('click', () => setOpen(true));
  $('.mchat__tip-x').addEventListener('click', () => { state.tipsOff = true; save(); hideTip(); });
  resetIdle();

  async function send(text) {
    text = text.trim().slice(0, 500);
    if (!text || busy) return;
    busy = true;
    chips.hidden = true;
    input.value = '';
    const msg = { role: 'user', content: text };
    state.msgs.push(msg);
    save();
    bubble(msg);
    const typing = document.createElement('div');
    typing.className = 'mchat__msg mchat__msg--bot mchat__typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    let data;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.msgs.slice(-12).map(({ role, content }) => ({ role, content })) }),
      });
      data = await res.json();
      if (!data.reply) throw new Error();
    } catch (e) {
      data = { reply: "Give me a second to reconnect! 🙂 Meanwhile the team is happy to help: **WhatsApp us** on +91 9061185683 or try me again in a moment.", link: null };
    }
    typing.remove();
    const reply = { role: 'assistant', content: data.reply, link: data.link || null };
    state.msgs.push(reply);
    save();
    bubble(reply);
    busy = false;
    // The answer lives on the site: take them there, after time to read the reply
    // (longer on phones, where the panel closes). Skip it if they've started typing.
    if (data.link) {
      const chip = log.lastElementChild.querySelector('.mchat__link--go .mono');
      const wait = phone.matches ? Math.min(4000, 1500 + data.reply.length * 20) : 1500;
      setTimeout(() => {
        if (input.value.trim()) return;
        if (chip) chip.textContent = 'Taking you there…';
        setTimeout(() => goTo(data.link.href), 600);
      }, wait);
    }
  }

  fab.addEventListener('click', () => setOpen(!state.open));
  $('.mchat__close').addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.open) { setOpen(false); fab.focus(); } });

  render();
  setOpen(state.open);
})();
