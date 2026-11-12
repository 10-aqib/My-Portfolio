(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  // Motion is always on: many Windows setups report "reduce motion" by default,
  // which previously switched every animation off.
  const reduced = false;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- Smooth scroll (Lenis, optional) ---------- */
  let lenis = null;
  if (!reduced && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  const lockScroll = (on) => {
    document.body.classList.toggle('is-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  };

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const loaderNum = $('#loaderNum');
  const hero = $('#top');
  let started = false;
  const startHero = () => {
    if (started) return;
    started = true;
    hero.classList.add('hero-ready');
  };
  const runLoader = () => {
    if (!loader || reduced) {
      if (loader) loader.remove();
      startHero();
      return;
    }
    lockScroll(true);
    const dur = 1500;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      loaderNum.textContent = String(Math.round(eased * 100)).padStart(2, '0');
      if (p < 1) requestAnimationFrame(tick);
      else {
        loader.classList.add('done');
        lockScroll(false);
        setTimeout(startHero, 350);
        setTimeout(() => loader.remove(), 1200);
      }
    };
    requestAnimationFrame(tick);
    // Safety net: never leave the loader up if animation frames are throttled.
    setTimeout(() => {
      if (!document.body.contains(loader)) return;
      loaderNum.textContent = '100';
      loader.classList.add('done');
      lockScroll(false);
      startHero();
      setTimeout(() => loader.remove(), 1200);
    }, dur + 1500);
  };
  runLoader();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal], [data-reveal-line]');
  const stagger = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    const n = stagger.get(parent) || 0;
    stagger.set(parent, n + 1);
    if (n) el.style.setProperty('--d', `${Math.min(n, 5) * 0.08}s`);
  });
  if ('IntersectionObserver' in window && !reduced) {
    // Masked line spans are clipped by their wrapper, so observe the wrapper instead.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target._reveal || e.target;
        el.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => {
      if (el.hasAttribute('data-reveal-line')) {
        const wrap = el.closest('.line');
        const idx = $$('.line', wrap.parentElement).indexOf(wrap);
        el.style.setProperty('--d', `${idx * 0.12}s`);
        wrap._reveal = el;
        io.observe(wrap);
      } else io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Scroll-scrubbed words ---------- */
  const scrub = $('#scrub');
  let words = [];
  if (scrub) {
    const text = scrub.textContent.trim();
    scrub.setAttribute('aria-label', text);
    scrub.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    words = $$('.w', scrub);
  }

  /* ---------- Scroll-driven effects ---------- */
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = window.innerHeight;
      if (words.length) {
        const r = scrub.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const upto = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < upto));
      }
      if (!reduced && window.innerWidth > 1024 && window.scrollY < vh * 1.5) {
        parallaxEls.forEach((el) => {
          const k = parseFloat(el.dataset.parallax) || 0;
          el.style.translate = `0 ${(window.scrollY * k * 100) / 100}px`;
        });
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Nav: sliding pill + active section ---------- */
  const pillNav = $('#pillNav');
  const ind = $('.pill-ind', pillNav);
  const navLinks = $$('a', pillNav);
  const moveInd = (link) => {
    if (!link) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    ind.style.width = `${link.offsetWidth}px`;
    ind.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  let activeLink = null;
  const setActive = (id) => {
    activeLink = navLinks.find((a) => a.dataset.nav === id) || null;
    navLinks.forEach((a) => a.classList.toggle('active', a === activeLink));
    moveInd(activeLink);
  };
  navLinks.forEach((a) => {
    a.addEventListener('mouseenter', () => { moveInd(a); navLinks.forEach((x) => x.classList.toggle('active', x === a)); });
  });
  pillNav.addEventListener('mouseleave', () => {
    navLinks.forEach((a) => a.classList.toggle('active', a === activeLink));
    moveInd(activeLink);
  });
  window.addEventListener('resize', () => moveInd(activeLink));
  if ('IntersectionObserver' in window) {
    const ids = ['work', 'about', 'experience', 'contact'];
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach((id) => { const s = document.getElementById(id); if (s) secObs.observe(s); });
    const clear = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(null); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'statement'].forEach((id) => { const s = document.getElementById(id); if (s) clear.observe(s); });
  }

  /* ---------- Header colour over lime sections ---------- */
  if ('IntersectionObserver' in window) {
    const over = new Set();
    const limeObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? over.add(e.target) : over.delete(e.target)));
      $('#header').classList.toggle('on-lime', over.size > 0);
    }, { rootMargin: '0px 0px -94% 0px' });
    $$('#statement, #contact').forEach((s) => limeObs.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const header = $('#header');
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.toggle('menu-open', open);
    lockScroll(open);
  };
  menuBtn.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { setMenu(false); closeChat(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 860) setMenu(false); });

  /* ---------- Anchor links ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const wasOpen = mobileMenu.classList.contains('open');
      if (wasOpen) setMenu(false);
      setTimeout(() => scrollToTarget(target), wasOpen ? 350 : 0);
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Accordion ---------- */
  $$('.acc-item').forEach((item) => {
    const btn = $('.acc-head', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('open');
      $$('.acc-item').forEach((i) => {
        i.classList.remove('open');
        $('.acc-head', i).setAttribute('aria-expanded', 'false');
      });
      if (open) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Cursor bubble on project cards ---------- */
  const cursor = $('#cursor');
  if (cursor && finePointer && !reduced) {
    const label = $('span', cursor);
    let x = -200, y = -200, cx = x, cy = y;
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('show'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('show'));
    });
  }

  /* ---------- Misc ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
  const top = $('[data-top]');
  if (top) top.addEventListener('click', () => { if (lenis) lenis.scrollTo(0, { duration: 1.4 }); });

  /* ===================================================
     Assistant (semantic keyword matcher, no external API)
     =================================================== */
  const EMAIL = 'aqibk1051@gmail.com';
  const PHONE = '+92 336 3620708';
  const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  const welcome = `Hey! 👋 I'm Aqib's assistant.<br><br>Ask me about his projects, skills, experience or how to get in touch.`;

  const intents = [
    { keys: ['burger', 'beef', 'food', 'restaurant', 'patties'],
      ans: `<strong>Beef Burger Patties</strong> is an online food-ordering web app with a burger customizer, cart and checkout flow, and branch discovery across Pakistan.<br><br>• ${ext('https://beef-burger-patties.vercel.app', 'Live site')}<br>• ${ext('https://github.com/10-aqib/Beef-Burger-Patties', 'Source on GitHub')}` },
    { keys: ['1tap', 'share', 'file', 'transfer', 'p2p', 'room'],
      ans: `<strong>1Tap</strong> shares text, links and files between devices with no account — join a shared Wi-Fi room or pair privately. It runs on Supabase Realtime.<br><br>• ${ext('https://1tap-theta.vercel.app', 'Live site')}<br>• ${ext('https://github.com/10-aqib/1Tap', 'Source on GitHub')}` },
    { keys: ['cleaner', 'space', 'disk', 'storage', 'duplicate'],
      ans: `<strong>Space Cleaner</strong> finds duplicate, unused and heavy files and shows storage as interactive D3 maps.<br><br>• ${ext('https://space-cleaner.vercel.app', 'Live site')}<br>• ${ext('https://github.com/10-aqib/Cleaner', 'Source on GitHub')}` },
    { keys: ['skillbridge', 'mentor', 'worker', 'employment'],
      ans: `<strong>SkillBridge</strong> connects people with local skilled workers and mentors. It has a Next.js web app and a Flutter mobile app. It isn't publicly deployed right now, so the source is on GitHub:<br><br>• ${ext('https://github.com/10-aqib/skillBridge-Website', 'Web app source')}<br>• ${ext('https://github.com/10-aqib/SkillBridge-', 'Flutter app source')}` },
    { keys: ['health', 'healthsync'],
      ans: `<strong>HealthSync</strong> is a Flutter and Dart mobile concept built around Firebase (Auth, Firestore, Storage).` },
    { keys: ['project', 'work', 'built', 'portfolio', 'featured', 'demo', 'app'],
      ans: `Four featured projects:<br><br>1. ${ext('https://1tap-theta.vercel.app', '1Tap')} — real-time sharing (live)<br>2. ${ext('https://beef-burger-patties.vercel.app', 'Beef Burger Patties')} — food ordering (live)<br>3. ${ext('https://space-cleaner.vercel.app', 'Space Cleaner')} — storage tool (live)<br>4. SkillBridge — Flutter + Next.js platform (source on ${ext('https://github.com/10-aqib/SkillBridge-', 'GitHub')})` },
    { keys: ['skill', 'tech', 'stack', 'language', 'framework', 'frontend', 'backend', 'react', 'node'],
      ans: `Mostly <strong>Flutter</strong>, <strong>Dart</strong> and <strong>Firebase</strong> for mobile, and <strong>JavaScript</strong>, <strong>TypeScript</strong>, <strong>React</strong>, <strong>Next.js</strong>, <strong>Node.js</strong>, <strong>Supabase</strong>, HTML and CSS for web — with Git and GitHub for workflow.` },
    { keys: ['mobile', 'flutter', 'dart', 'ios', 'android', 'firebase'],
      ans: `Aqib builds mobile apps with <strong>Flutter</strong> and <strong>Dart</strong>, using <strong>Firebase</strong> (Auth, Firestore, Storage) for the back end.` },
    { keys: ['altaf', 'intern', 'internship', 'meta', 'ads', 'client', 'appointment', 'business'],
      ans: `Aqib interned at <strong>Altaf Developers</strong>, where he worked on website maintenance and digital solutions for clients, built an appointment system for a client and got exposure to Meta Ads. He has also delivered websites to local businesses in Islamabad.` },
    { keys: ['education', 'degree', 'university', 'college', 'study', 'bahria'],
      ans: `Aqib is studying <strong>BS Information Technology</strong> at Bahria University, Islamabad (2023–2027).` },
    { keys: ['experience', 'job', 'career', 'hire', 'available', 'availability'],
      ans: `Aqib has been building web and mobile projects since 2023 and is open to work — remote, hybrid or on-site. See the Experience section above, or ${ext('assets/aqib-cv.pdf', 'download his CV')}.` },
    { keys: ['contact', 'email', 'phone', 'reach', 'whatsapp', 'linkedin', 'github'],
      ans: `• Email: <a href="mailto:${EMAIL}">${EMAIL}</a><br>• WhatsApp / phone: <a href="tel:+923363620708">${PHONE}</a><br>• ${ext('https://github.com/10-aqib', 'GitHub')} · ${ext('https://www.linkedin.com/in/aqib10', 'LinkedIn')}` },
    { keys: ['hi', 'hello', 'hey'], ans: welcome }
  ];

  const chatToggle = $('#chatToggle');
  const chatPanel = $('#chatPanel');
  const chatMessages = $('#chatMessages');
  const chatInput = $('#chatInput');
  const chatChips = $('#chatChips');
  let chatOpen = false;

  const appendMsg = (html, sender) => {
    const div = document.createElement('div');
    div.className = `chat-msg msg-${sender}`;
    div.innerHTML = `${html}<span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };
  const answer = (q) => {
    const query = q.toLowerCase();
    const words = query.split(/[^a-z0-9+]+/);
    const hit = intents.find((i) => i.keys.some((k) => (k.length <= 3 ? words.includes(k) : query.includes(k))));
    const res = hit ? hit.ans : `I don't have that in my notes. Email Aqib at <a href="mailto:${EMAIL}">${EMAIL}</a> or WhatsApp <a href="tel:+923363620708">${PHONE}</a>.`;
    setTimeout(() => appendMsg(res, 'bot'), 350);
  };
  const initChat = () => {
    if (chatMessages.children.length) return;
    appendMsg(welcome, 'bot');
    chatChips.innerHTML = '';
    ['Projects', '1Tap', 'SkillBridge', 'Tech stack', 'Experience', 'Contact'].forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s;
      b.addEventListener('click', () => { appendMsg(s, 'user'); answer(s); });
      chatChips.appendChild(b);
    });
  };
  const setChat = (open) => {
    chatOpen = open;
    chatPanel.classList.toggle('open', open);
    chatPanel.setAttribute('aria-hidden', String(!open));
    chatToggle.setAttribute('aria-expanded', String(open));
    if (open) { initChat(); setTimeout(() => chatInput.focus({ preventScroll: true }), 300); }
  };
  function closeChat() { if (chatOpen) setChat(false); }
  chatToggle.addEventListener('click', () => setChat(!chatOpen));
  $('#chatClose').addEventListener('click', () => setChat(false));
  $('#chatClear').addEventListener('click', () => { chatMessages.innerHTML = ''; initChat(); });
  const send = () => {
    const v = chatInput.value.trim();
    if (!v) return;
    appendMsg(v.replace(/</g, '&lt;'), 'user');
    chatInput.value = '';
    answer(v);
  };
  $('#chatSend').addEventListener('click', send);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });

  /* ===================================================
     Contact form (delivers via FormSubmit to the same inbox)
     =================================================== */
  const form = $('#contactForm');
  const status = $('#formStatus');
  if (form) {
    const btn = $('button[type="submit"]', form);
    const say = (msg, err) => { status.textContent = msg; status.classList.toggle('err', !!err); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#formName').value.trim();
      const email = $('#formEmail').value.trim();
      const message = $('#formMessage').value.trim();
      if (!name || !email || !message) return say('Please fill in all three fields.', true);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Please enter a valid email address.', true);
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>Sending…</span>';
      say('');
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name, email, message, _subject: `New portfolio message from ${name}` })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        say(`Thanks ${name} — your note is in the air. Aqib will reply soon.`);
        form.reset();
      } catch (err) {
        console.error('Contact form error:', err);
        say(`Couldn't send right now. Please email ${EMAIL} directly.`, true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = label;
      }
    });
  }
})();
