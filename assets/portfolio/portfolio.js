/* ==========================================================
   Muhammad Aqib — editorial portfolio
   Entrance timeline, scroll reveals, project phones + detail
   sheets, contact form, menu, and a small bridge to the 3D desk
   (when this page is shown inside the monitor).
   ========================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const embedded = root.classList.contains('is-embedded');
  const reduce = !root.classList.contains('anim');
  const EMAIL = 'aqibk1051@gmail.com';
  const GH = 'https://github.com/10-aqib';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  let lenis = null; // smooth-scroll instance (set up in boot when motion is allowed)

  /* ----------------------------------------------------------
     Projects — from the existing portfolio, the CV and each
     repository's README. Nothing invented.
     ---------------------------------------------------------- */
  const PROJECTS = [
    {
      slug: '1tap', name: '1Tap', kind: 'Real-time web app', featured: true,
      mobile: 'assets/projects/mobile-1tap.webp', desktop: 'assets/projects/1tap.jpg',
      summary: 'Move text, links and files between devices — no account, no signup.',
      body: [
        'Join a shared room over the same Wi-Fi, or pair privately with a room code or QR code. Whatever you drop in shows up on the other device a moment later.',
        'Presence and sync run on Supabase Realtime, so devices see each other join and leave the room as it happens.'
      ],
      highlights: ['No account or signup required', 'Pair devices with a room code or a QR code', 'Shared room for devices on the same Wi-Fi', 'Live presence and sync on Supabase Realtime'],
      role: 'Designed and built end to end',
      stack: ['React', 'TypeScript', 'Supabase Realtime', 'TanStack Router', 'Tailwind CSS'],
      live: 'https://1tap-theta.vercel.app', repos: [{ label: 'Source', url: `${GH}/1Tap` }]
    },
    {
      slug: 'beef-burger-patties', name: 'Beef Burger Patties', kind: 'Restaurant ordering app', featured: true,
      mobile: 'assets/projects/mobile-beef-burger.webp', desktop: 'assets/projects/beef-burger.jpg',
      summary: 'A cinematic burger restaurant site with online ordering, built for customers in Pakistan.',
      body: [
        'A food-focused interface with a responsive ordering experience. Customers build a burger topping by topping, add kitchen notes, manage a cart and find branches across Pakistan.',
        'Animation is handled with GSAP and Framer Motion, app state with Zustand, and the back end with Supabase.'
      ],
      highlights: ['Burger customizer, topping by topping', 'Kitchen notes, cart and checkout flow', 'Deals and branch discovery across Pakistan', 'Cinematic, motion-led interface'],
      role: 'Designed and built end to end',
      stack: ['React', 'TypeScript', 'GSAP', 'Framer Motion', 'Zustand', 'Supabase'],
      live: 'https://beef-burger-patties.vercel.app', repos: [{ label: 'Source', url: `${GH}/Beef-Burger-Patties` }]
    },
    {
      slug: 'space-cleaner', name: 'Space Cleaner', kind: 'Storage tool', featured: true,
      mobile: 'assets/projects/mobile-space-cleaner.webp', desktop: 'assets/projects/space-cleaner.jpg',
      summary: 'Finds duplicate, unused and heavy files and shows where your disk space went.',
      body: [
        'Space Cleaner scans for duplicate, unused and large files so you can clear what you don’t need in a tap.',
        'Disk usage is drawn as interactive D3 maps, long file lists stay smooth with a virtualized list, and a keyboard command palette keeps everything one shortcut away.'
      ],
      highlights: ['Detects duplicate, unused and heavy files', 'Interactive D3 storage maps', 'Virtualized file list for large folders', 'Keyboard command palette'],
      role: 'Designed and built end to end',
      stack: ['React', 'TypeScript', 'Vite', 'D3.js', 'TanStack Virtual', 'Zustand'],
      live: 'https://space-cleaner.vercel.app', repos: [{ label: 'Source', url: `${GH}/Cleaner` }]
    },
    {
      slug: 'skillbridge', name: 'SkillBridge', kind: 'Web + Flutter platform', status: 'In development',
      cover: 'Skill Bridge',
      summary: 'Connects people with reliable local skilled workers and service providers.',
      body: [
        'SkillBridge is a mobile platform that connects customers with local skilled workers and mentors for everyday services.',
        'The Flutter app is built on Firebase, with a companion Next.js website that introduces the product. It isn’t publicly deployed yet, so it’s shared here as a case study with its source code.'
      ],
      highlights: ['Cross-platform Flutter mobile app', 'Firebase back end', 'Companion Next.js landing site'],
      role: 'Designed and built the app and site',
      stack: ['Flutter', 'Dart', 'Firebase', 'Next.js', 'TypeScript'],
      live: null, repos: [{ label: 'Flutter app', url: `${GH}/SkillBridge-` }, { label: 'Website', url: `${GH}/skillBridge-Website` }]
    },
    {
      slug: 'pixelmint', name: 'PixelMint', kind: 'Image tool', status: 'Source',
      cover: 'Pixel Mint',
      summary: 'Compress, resize and convert images — entirely in your browser.',
      body: [
        'PixelMint compresses, resizes and converts images with complete privacy: every operation runs locally in the browser, so images are never uploaded to a server.',
        'Set a maximum file size in KB or MB, resize to exact dimensions, and export to JPG, PNG or WebP with a preview and output-size report.'
      ],
      highlights: ['100% browser-local processing', 'Target a maximum file size in KB or MB', 'Resize with optional aspect-ratio lock', 'JPG, PNG and WebP export'],
      role: 'Personal project',
      stack: ['Next.js', 'React', 'TypeScript'],
      live: null, repos: [{ label: 'Source', url: `${GH}/PixelMint` }]
    },
    {
      slug: 'text-to-speech', name: 'Speech ⇄ Text', kind: 'Flutter mobile app', status: 'Source',
      cover: 'Speech Text',
      summary: 'A Flutter app that turns speech into text and text into natural speech.',
      body: [
        'Tap the microphone and speak — the app converts your words to text in real time. Type something and press Speak, and it reads it aloud.',
        'Built as a software engineering project to show speech recognition and text-to-speech working together in Flutter.'
      ],
      highlights: ['Real-time speech-to-text', 'Text-to-speech playback', 'English (en-US) support'],
      role: 'University project',
      stack: ['Flutter', 'Dart', 'speech_to_text', 'flutter_tts'],
      live: null, repos: [{ label: 'Source', url: `${GH}/TEXT-TO-SPEECH-` }]
    },
    {
      slug: 'infinity-basket-mart', name: 'Infinity Basket Mart', kind: 'Client e-commerce site', status: 'Client work',
      cover: 'Infinity Basket',
      summary: 'An e-commerce website for a local mart in F-8, Islamabad.',
      body: [
        'Built for Infinity Basket, a mart in F-8, to give its customers a digital shopping experience.',
        'One of the projects I delivered for local businesses in Islamabad.'
      ],
      highlights: ['Online store for a local business', 'Responsive design for phones and desktops'],
      role: 'Client project',
      stack: ['E-commerce', 'Responsive design'],
      live: null, repos: [{ label: 'Source', url: `${GH}/Infinity-Basket-Mart` }]
    }
  ];

  /* ---------- Work phones ---------- */
  const featured = PROJECTS.filter((p) => p.featured);
  $('#workPhones').innerHTML = featured.map((p) => `
    <div class="work-item" data-r="card">
      <button class="phone work-phone" type="button" data-open="${p.slug}" aria-label="Open ${esc(p.name)} case study">
        <i class="notch" aria-hidden="true"></i>
        <span class="screen"><img src="${p.mobile}" alt="${esc(p.name)} on a phone" loading="lazy" decoding="async"></span>
        <span class="live-dot">Live</span>
        <span class="badge">View project ${icon('arrow')}</span>
      </button>
      <p class="work-label">${esc(p.name)}<small>${esc(p.kind)}</small></p>
    </div>`).join('');

  $('#moreGrid').innerHTML = PROJECTS.filter((p) => !p.featured).map((p) => `
    <button class="more-card" type="button" data-open="${p.slug}" data-r="card">
      <span class="status">${esc(p.status)}</span>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.summary)}</p>
      <span class="more-open">Case study ${icon('arrow')}</span>
    </button>`).join('');

  // Auto-scroll each phone screenshot through its full height.
  const fitScreens = () => {
    $$('.work-phone .screen img').forEach((img) => {
      const box = img.parentElement.getBoundingClientRect();
      const h = img.getBoundingClientRect().height / (parseFloat(getComputedStyle(img).scale) || 1);
      const dist = Math.max(0, h - box.height);
      img.style.setProperty('--dist', `${dist}px`);
      img.style.setProperty('--dur', `${Math.max(6, dist / 40)}s`);
      img.classList.toggle('scrolls', dist > 20);
    });
  };
  $$('.work-phone .screen img').forEach((img) => (img.complete ? fitScreens() : img.addEventListener('load', fitScreens)));
  addEventListener('resize', fitScreens);

  /* ----------------------------------------------------------
     Sheets (project detail + contact)
     ---------------------------------------------------------- */
  let openSheet = null;
  let returnFocus = null;
  const show = (sheet, trigger) => {
    if (openSheet && openSheet !== sheet) openSheet.hidden = true;
    returnFocus = trigger || document.activeElement;
    sheet.hidden = false;
    sheet.scrollTop = 0;
    openSheet = sheet;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    animateSheet(sheet);
    $('[data-close]', sheet).focus({ preventScroll: true });
  };
  function animateSheet(sheet) {
    if (!window.gsap || reduce) return;
    const parts = $$('.sheet-back, .p-head > div > *, .p-links > *, .p-desktop, .p-mobile, .p-cover, .p-grid > div > *, .p-meta > *, .p-pager > *, .contact-grid > div > *, .contact-side > *', sheet);
    gsap.fromTo(sheet, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' });
    gsap.fromTo(parts, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.035, clearProps: 'transform' });
    const mob = $('.p-mobile img', sheet);
    if (mob) {
      gsap.killTweensOf(mob);
      gsap.fromTo(mob, { y: 0 }, { y: () => -Math.max(0, mob.offsetHeight - mob.parentElement.clientHeight), duration: 9, ease: 'sine.inOut', delay: 1, repeat: -1, yoyo: true, repeatDelay: 1 });
    }
  }
  const hide = () => {
    if (!openSheet) return;
    openSheet.hidden = true;
    openSheet = null;
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  };
  $$('[data-close]').forEach((b) => b.addEventListener('click', hide));

  const projectSheet = $('#projectSheet');
  const renderProject = (p) => {
    const i = PROJECTS.indexOf(p);
    const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const links = [
      p.live ? `<a class="btn btn-dark" href="${p.live}" target="_blank" rel="noopener noreferrer">Visit live site ${icon('arrow-ne')}</a>` : '',
      ...p.repos.map((r) => `<a class="btn btn-line" href="${r.url}" target="_blank" rel="noopener noreferrer">${icon('github')}${esc(r.label)}</a>`)
    ].join('');
    const media = p.desktop
      ? `<div class="p-media">
          <figure class="p-desktop" style="margin:0"><div class="bar"><i></i><i></i><i></i><span>${esc(p.live.replace('https://', ''))}</span></div><img src="${p.desktop}" alt="${esc(p.name)} on desktop" loading="lazy"></figure>
          <div class="p-mobile"><i class="notch" aria-hidden="true"></i><img src="${p.mobile}" alt="${esc(p.name)} on a phone" loading="lazy"></div>
        </div>`
      : `<div class="p-cover" aria-hidden="true"><b>${esc(p.cover)}</b><span>${esc(p.kind)}</span></div>`;
    $('#projBody').innerHTML = `
      <div class="p-head">
        <div>
          <p class="kicker">${esc(p.kind)}${p.live ? ' · Live' : p.status ? ` · ${esc(p.status)}` : ''}</p>
          <h2 id="projTitle">${esc(p.name)}</h2>
          <p class="lede">${esc(p.summary)}</p>
        </div>
        <div class="p-links">${links}</div>
      </div>
      ${media}
      <div class="p-grid">
        <div>
          <h3>Overview</h3>
          ${p.body.map((b) => `<p>${esc(b)}</p>`).join('')}
          <ul class="p-hl">${p.highlights.map((h) => `<li>${icon('star')}${esc(h)}</li>`).join('')}</ul>
        </div>
        <aside class="p-meta">
          <dl>
            <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
            <div><dt>Category</dt><dd>${esc(p.kind)}</dd></div>
            <div><dt>Status</dt><dd>${p.live ? 'Live' : esc(p.status)}</dd></div>
            ${p.live ? `<div><dt>Website</dt><dd><a href="${p.live}" target="_blank" rel="noopener noreferrer">${esc(p.live.replace('https://', ''))} ↗</a></dd></div>` : ''}
            ${p.repos.map((r) => `<div><dt>${esc(r.label)}</dt><dd><a href="${r.url}" target="_blank" rel="noopener noreferrer">GitHub ↗</a></dd></div>`).join('')}
          </dl>
          <div><h3>Built with</h3><ul class="tags">${p.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        </aside>
      </div>
      <nav class="p-pager" aria-label="More projects">
        <button type="button" data-goto="${prev.slug}"><small>← Previous</small><b>${esc(prev.name)}</b></button>
        <button type="button" data-goto="${next.slug}"><small>Next →</small><b>${esc(next.name)}</b></button>
      </nav>`;
  };
  const openProject = (slug, trigger) => {
    const p = PROJECTS.find((x) => x.slug === slug);
    if (!p) return;
    renderProject(p);
    if (openSheet === projectSheet) { projectSheet.scrollTop = 0; animateSheet(projectSheet); return; }
    show(projectSheet, trigger);
  };
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) { openProject(o.dataset.open, o); return; }
    const g = e.target.closest('[data-goto]');
    if (g) openProject(g.dataset.goto);
  });

  const contactSheet = $('#contactSheet');
  $('#workBtn').addEventListener('click', (e) => show(contactSheet, e.currentTarget));

  // Small API for the chat assistant (assistant.js).
  window.__portfolio = {
    projects: PROJECTS,
    openProject: (slug) => openProject(slug),
    openContact: () => show(contactSheet),
    goTo: (sel) => {
      const t = document.querySelector(sel);
      if (!t) return;
      if (lenis) lenis.scrollTo(t, { duration: 1.4 }); else t.scrollIntoView({ behavior: 'smooth' });
    },
    isSheetOpen: () => !!openSheet
  };

  /* ---------- Menu ---------- */
  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    $('span', menuBtn).textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    if (open) {
      $('a', menu).focus({ preventScroll: true });
      if (window.gsap && !reduce) {
        gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'power3.inOut' });
        gsap.fromTo($$('ol a', menu), { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, delay: 0.2 });
        gsap.fromTo($$('.menu-foot > *', menu), { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05, delay: 0.35 });
      }
    }
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a[href^="#"]', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Keyboard ---------- */
  document.addEventListener('keydown', (e) => {
    post({ type: 'portfolio:key', code: e.code });
    if (e.key !== 'Escape') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') { e.target.blur(); return; }
    if (openSheet) { hide(); return; }
    if (!menu.hidden) { setMenu(false); menuBtn.focus(); return; }
    if (embedded) post({ type: 'portfolio:exit' });
  });

  /* ----------------------------------------------------------
     Contact form — delivered by FormSubmit to the same inbox
     ---------------------------------------------------------- */
  const toast = $('#toast');
  let toastT;
  const showToast = (m) => { toast.textContent = m; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2200); };
  const form = $('#contactForm');
  const status = $('#formStatus');
  const say = (m, err) => { status.textContent = m; status.classList.toggle('err', !!err); };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#formName').value.trim();
    const email = $('#formEmail').value.trim();
    const message = $('#formMessage').value.trim();
    const topic = new FormData(form).get('topic') || 'General';
    if (!name || !email || !message) return say('Please fill in your name, email and message.', true);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Please enter a valid email address.', true);
    const btn = $('button[type="submit"]', form);
    btn.disabled = true; btn.textContent = 'Sending…'; say('');
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, topic, message, _subject: `Portfolio: ${topic} — ${name}`, _template: 'table' })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      say(`Thanks, ${name} — your message is on its way. I'll reply soon.`);
      form.reset();
    } catch (err) {
      console.warn('Contact form error:', err);
      const mail = `mailto:${EMAIL}?subject=${encodeURIComponent(`${topic} — ${name}`)}&body=${encodeURIComponent(message)}`;
      status.innerHTML = `Couldn't send right now. <a href="${mail}">Email me directly instead</a>.`;
      status.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = 'Send message';
    }
  });
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); showToast('Email address copied'); }
    catch (e) { location.href = `mailto:${b.dataset.copy}`; }
  }));
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Blurred hero behind the closing CTA ---------- */
  const ghost = $('#heroStage').cloneNode(true);
  ghost.removeAttribute('id');
  $$('[id]', ghost).forEach((n) => n.removeAttribute('id'));
  $$('a, button', ghost).forEach((n) => n.setAttribute('tabindex', '-1'));
  $('img', ghost).removeAttribute('fetchpriority');
  $('#ctaBg').appendChild(ghost);

  /* ----------------------------------------------------------
     Bridge to the 3D desk (parent window)
     ---------------------------------------------------------- */
  function post(msg) {
    if (!embedded) return;
    try { window.parent.postMessage(msg, location.origin); } catch (e) { /* ignore */ }
  }
  let powered = !embedded;
  let startIntro = null;
  if (embedded) {
    let px = 0.5, py = 0.5, queued = false;
    addEventListener('pointermove', (e) => {
      px = e.clientX / innerWidth; py = e.clientY / innerHeight;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; post({ type: 'portfolio:pointer', x: px, y: py }); });
    }, { passive: true });
    addEventListener('pointerdown', () => post({ type: 'portfolio:click' }), { passive: true });
    addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data) return;
      if (e.data.type === 'desk:power') { powered = true; if (startIntro) startIntro(); }
      if (e.data.type === 'desk:focus') { if (!powered) { powered = true; if (startIntro) startIntro(); } }
    });
    setTimeout(() => { powered = true; if (startIntro) startIntro(); }, 7000);
  }

  /* ----------------------------------------------------------
     Motion — entrance timeline + scroll reveals (GSAP)
     ---------------------------------------------------------- */
  const boot = () => {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || reduce) { root.classList.remove('anim'); return; }
    if (ST) gsap.registerPlugin(ST);
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const stacked = window.matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)');

    /* ---- helpers ---- */
    // Text decode: characters resolve left-to-right out of random glyphs.
    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*+/';
    function scramble(el, { duration = 0.8, delay = 0 } = {}) {
      if (!el) return;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      if (!nodes.length) return;
      nodes.forEach((n) => { if (n.__final === undefined) n.__final = n.textContent; });
      if (!el.hasAttribute('aria-label') && !el.closest('[aria-hidden="true"]')) el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
      if (el.__scr) el.__scr.kill();
      const total = nodes.reduce((a, n) => a + n.__final.length, 0);
      const st = { p: 0 };
      el.__scr = gsap.to(st, {
        p: 1, duration, delay, ease: 'none',
        onUpdate: () => {
          let idx = 0;
          nodes.forEach((n) => {
            const f = n.__final;
            let out = '';
            for (let i = 0; i < f.length; i++, idx++) {
              const ch = f[i];
              const reveal = idx / total < st.p * 1.15 - 0.15;
              out += reveal || ch === ' ' || ch === '\n' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            n.textContent = out;
          });
        },
        onComplete: () => nodes.forEach((n) => { n.textContent = n.__final; })
      });
    }
    const splitChars = (el) => {
      const text = el.textContent;
      el.setAttribute('aria-label', text.trim());
      el.innerHTML = [...text].map((c) => (c === ' ' ? '<span class="ch sp" aria-hidden="true">&nbsp;</span>' : `<span class="ch" aria-hidden="true">${esc(c)}</span>`)).join('');
      return $$('.ch', el);
    };
    const splitWords = (el) => {
      el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="wd"><span>${esc(w)}</span></span>`).join(' ');
      return $$('.wd > span', el);
    };
    // Titles: mask the text between the two stars into a line of characters.
    const titleChars = (title) => {
      const label = title.textContent.trim();
      const node = [...title.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      if (!node) return { chars: [], stars: [] };
      const wrap = document.createElement('span');
      wrap.className = 'tt';
      wrap.textContent = node.textContent.trim();
      title.replaceChild(wrap, node);
      title.setAttribute('aria-label', label);
      $$('svg', title).forEach((sv) => sv.setAttribute('aria-hidden', 'true'));
      return { chars: splitChars(wrap), stars: $$(':scope > svg:not(.swoosh)', title).map(wrapSvg) };
    };
    // GSAP transforms an inline <svg> as SVG geometry; animate an HTML wrapper instead.
    function wrapSvg(svg) {
      if (svg.parentElement.classList.contains('svgw')) return svg.parentElement;
      const w = document.createElement('span');
      w.className = 'svgw';
      svg.replaceWith(w);
      w.appendChild(svg);
      return w;
    }
    const drawable = (svg) => $$('path, rect, circle, ellipse', svg).filter((el) => el.getAttribute('stroke') && el.getAttribute('stroke') !== 'none');
    const prepDraw = (els) => els.forEach((el) => {
      let len = 300;
      try { len = Math.ceil(el.getTotalLength()) + 2; } catch (e) { /* ignore */ }
      el.style.strokeDasharray = len; el.style.strokeDashoffset = len;
    });
    const titleIn = (title, tl, at = 0) => {
      const { chars, stars } = titleChars(title);
      gsap.set(title, { autoAlpha: 1 });
      tl.fromTo(chars, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 0.8, ease: 'power4.out', stagger: 0.03 }, at)
        .fromTo(stars, { scale: 0, rotate: -180, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(2)', stagger: 0.08 }, at + 0.15);
      const sw = $('.swoosh path', title);
      if (sw) { prepDraw([sw]); tl.to(sw, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, at + 0.35); }
    };
    // 3D tilt + lift that follows the pointer (desktop only).
    const tilt = (el, max = 8) => {
      if (!fine) return;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotationY: x * max, rotationX: -y * max, y: -8, transformPerspective: 900, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotationY: 0, rotationX: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.6)', overwrite: 'auto', clearProps: 'transform' }));
    };
    const onEnter = (trigger, fn, start = 'top 72%') => {
      if (!ST) { fn(); return; }
      ST.create({ trigger, start, once: true, onEnter: fn });
    };

    /* ================= HERO ================= */
    const hs = $('#heroStage');
    const q = (sel) => $$(sel, hs);
    const nameChars = $$('.name span', hs).flatMap((sp) => { const c = splitChars(sp); sp.removeAttribute('aria-label'); return c; });
    const panelNum = $('.panel-1 b', hs);
    const count = { v: 0 };
    gsap.set(q('.word, .portrait, [data-h]'), { visibility: 'visible' });

    // Orbit ring behind the portrait (a nod to the Creative Director template's halo).
    const NS = 'http://www.w3.org/2000/svg';
    const orbit = document.createElementNS(NS, 'svg');
    orbit.setAttribute('class', 'orbit');
    orbit.setAttribute('viewBox', '0 0 500 500');
    orbit.setAttribute('aria-hidden', 'true');
    orbit.innerHTML = '<circle class="orbit-path" cx="250" cy="250" r="236" fill="none"/><circle class="orbit-inner" cx="250" cy="250" r="196" fill="none"/><g class="orbit-spin"><circle cx="250" cy="14" r="6"/><circle class="orbit-acc" cx="486" cy="250" r="4.5"/></g>';
    // Wrapped in an HTML element and spun with a CSS animation, so it runs on the GPU
    // instead of repainting the SVG every frame.
    const orbitWrap = document.createElement('div');
    orbitWrap.className = 'orbit-wrap paused';
    orbitWrap.appendChild(orbit);
    hs.insertBefore(orbitWrap, $('.portrait', hs));
    const orbitPath = $('.orbit-path', orbit);
    orbitPath.style.strokeDasharray = 1600;

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    tl.fromTo(q('.word'), { clipPath: 'inset(0 100% 0 0)', scaleX: 1.08, transformOrigin: '0% 50%' }, { clipPath: 'inset(0 0% 0 0)', scaleX: 1, duration: 1.4, ease: 'power3.inOut' })
      .fromTo(q('.word text'), { fill: '#d8ccbd' }, { fill: '#A99B8D', duration: 1.2, ease: 'power1.out' }, 0.5)
      .fromTo(q('.portrait'), { autoAlpha: 0, y: 70, scale: 0.94, transformOrigin: '50% 100%' }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2 }, '-=0.5')
      .fromTo(q('.hello'), { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' }, { autoAlpha: 1, clipPath: 'inset(-20% -4% -20% 0)', duration: 0.9, ease: 'power2.inOut' }, '-=0.6')
      .set(q('.name'), { autoAlpha: 1 }, '-=0.45')
      .fromTo(nameChars, { yPercent: 110 }, { yPercent: 0, duration: 0.75, ease: 'power4.out', stagger: 0.035 }, '<')
      .fromTo(q('.role'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.45')
      .add(() => scramble(q('.role')[0], { duration: 1.1 }), '<')
      .fromTo(q('[data-h="li"]'), { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.06 }, '-=0.45')
      .add(() => q('[data-h="li"]').forEach((li, i) => scramble(li, { duration: 0.7, delay: i * 0.06 })), '<')
      .fromTo(orbitWrap, { autoAlpha: 0, rotate: -40, scale: 0.85 }, { autoAlpha: 1, rotate: 0, scale: 1, duration: 1.6, ease: 'power3.out' }, 1.2)
      .fromTo(orbitPath, { strokeDashoffset: 1600 }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 1.2)
      .fromTo(q('[data-h="li"] svg').map(wrapSvg), { rotate: -180, scale: 0 }, { rotate: 0, scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.06 }, '<')
      .fromTo(q('.statement'), { autoAlpha: 0, x: 26 }, { autoAlpha: 1, x: 0, duration: 0.65 }, '-=0.6')
      .fromTo(q('.plus'), { rotate: -90, scale: 0.4 }, { rotate: 0, scale: 1, duration: 0.7, ease: 'back.out(2)' }, '<0.1')
      .fromTo(q('.panel'), { autoAlpha: 0, x: 40, clipPath: 'inset(0 0 0 100%)' }, { autoAlpha: 1, x: 0, clipPath: 'inset(-10% -10% -10% 0%)', duration: 0.7, stagger: 0.14, ease: 'power3.inOut', clearProps: 'transform,clipPath' }, '-=0.4')
      .fromTo(count, { v: 0 }, { v: 5, duration: 1, ease: 'power2.out', onUpdate: () => { panelNum.textContent = `${Math.round(count.v)}+`; } }, '<')
      .fromTo(q('.cta'), { autoAlpha: 0, y: 18, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.8)', clearProps: 'transform' }, '-=0.5')
      .add(() => { gsap.to(q('.cta i'), { x: 4, duration: 0.6, ease: 'sine.inOut', repeat: 5, yoyo: true }); });
    tl.timeScale(1.2);
    startIntro = () => {
      startIntro = null;
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
        // Standalone visits open with a short curtain + counter (the 3D desk has its own loader).
        if (embedded) { tl.play(); return; }
        const cur = document.createElement('div');
        cur.className = 'curtain';
        cur.setAttribute('aria-hidden', 'true');
        cur.innerHTML = '<span class="curtain-label">Muhammad Aqib — Portfolio</span><b class="curtain-num">000</b>';
        document.body.appendChild(cur);
        const num = $('.curtain-num', cur);
        const c = { v: 0 };
        gsap.timeline()
          .add(() => scramble($('.curtain-label', cur), { duration: 0.9 }))
          .to(c, { v: 100, duration: 1.05, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(c.v)).padStart(3, '0'); } }, 0)
          .to(cur, { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, 1.15)
          .add(() => tl.play(), 1.35)
          .add(() => cur.remove());
      });
    };
    if (powered) startIntro();

    // Pointer parallax: the giant word and the portrait drift apart slightly.
    if (fine) {
      const wx = gsap.quickTo(q('.word')[0], 'x', { duration: 1.1, ease: 'power3.out' });
      const px = gsap.quickTo(q('.portrait')[0], 'xPercent', { duration: 1.1, ease: 'power3.out' });
      const ix = gsap.quickTo($('.hero-id', hs), 'x', { duration: 1.1, ease: 'power3.out' });
      $('#home').addEventListener('pointermove', (e) => {
        if (stacked.matches) return;
        const nx = e.clientX / innerWidth - 0.5;
        wx(nx * -22); px(nx * 2.4); ix(nx * 8);
      });
    }

    /* ================= SMOOTH SCROLL (Lenis) ================= */
    if (window.Lenis) {
      // lerp-based smoothing stays responsive (duration-based easing felt laggy/stuck).
      lenis = new window.Lenis({ lerp: 0.13, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
      if (ST) lenis.on('scroll', ST.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      root.classList.add('has-lenis');
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a || e.defaultPrevented) return;
        const id = a.getAttribute('href');
        const target = id.length > 1 && document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
      });
    }

    /* ================= CUSTOM CURSOR ================= */
    if (fine) {
      const ring = document.createElement('div');
      ring.className = 'cur-ring';
      ring.innerHTML = '<span>View</span>';
      const dot = document.createElement('div');
      dot.className = 'cur-dot';
      ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
      document.body.append(ring, dot);
      root.classList.add('has-cursor');
      if (!embedded) root.classList.add('hide-native');
      gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
      const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
      const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
      const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
      const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
      addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); root.classList.add('cur-on'); }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => root.classList.remove('cur-on'));
      document.addEventListener('pointerover', (e) => {
        const view = e.target.closest('.work-phone, .more-card');
        const link = e.target.closest('a, button, label, input, textarea, [role="button"]');
        root.classList.toggle('cur-view', !!view);
        root.classList.toggle('cur-link', !view && !!link);
      });
      addEventListener('pointerdown', () => gsap.fromTo(ring, { scale: 0.75 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' }));
    }

    /* ================= DECODE ON HOVER ================= */
    if (fine) {
      document.addEventListener('pointerover', (e) => {
        const el = e.target.closest('.menu ol a, .btn, .cta, .sheet-back, .cta-links a, .link, .menu-btn, .btn-work, .p-pager button');
        if (!el || el.contains(e.relatedTarget)) return;
        scramble(el, { duration: 0.5 });
      });
    }

    /* ================= VELOCITY MARQUEE ================= */
    const mq = document.createElement('div');
    mq.className = 'marquee';
    mq.setAttribute('aria-hidden', 'true');
    const mqItems = ['Web Development', 'Mobile Apps', 'Full-Stack', 'UI / UX', 'E-Commerce', 'AI Integration', 'Flutter', 'React', 'Next.js', 'Firebase'];
    const mqRow = (cls) => `<div class="mq-row ${cls}"><div class="mq-track">${`<span>${mqItems.map((t) => `${esc(t)}<i>✦</i>`).join('')}</span>`.repeat(2)}</div></div>`;
    mq.innerHTML = mqRow('mq-a') + mqRow('mq-b');
    $('#home').after(mq);
    const tracks = $$('.mq-track', mq);
    const tA = gsap.to(tracks[0], { xPercent: -50, duration: 36, ease: 'none', repeat: -1 });
    const tB = gsap.fromTo(tracks[1], { xPercent: -50 }, { xPercent: 0, duration: 42, ease: 'none', repeat: -1 });
    if (ST) {
      gsap.fromTo(mq, { rotate: -2.5 }, { rotate: 1.5, ease: 'none', scrollTrigger: { trigger: mq, start: 'top bottom', end: 'bottom top', scrub: true } });
      // Velocity response: scroll events only store a target; one ticker eases toward it.
      // (Creating tweens on every scroll event was causing jank.)
      const setSkew = tracks.map((t) => gsap.quickSetter(t, 'skewX', 'deg'));
      let target = 0, cur = 0, dir = 1, visible = false;
      ST.create({
        trigger: mq, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => { visible = self.isActive; tA.paused(!visible); tB.paused(!visible); },
        onUpdate: (self) => { target = gsap.utils.clamp(-6, 6, self.getVelocity() / 300); dir = self.direction; }
      });
      gsap.ticker.add(() => {
        if (!visible) return;
        target *= 0.9;
        cur += (target - cur) * 0.12;
        if (Math.abs(cur) < 0.001) cur = 0;
        const ts = dir * (1 + Math.abs(cur));
        tA.timeScale(ts); tB.timeScale(ts);
        const sk = -cur * 1.1;
        setSkew.forEach((s) => s(sk));
      });
    }

    if (!ST) return;

    // Continuous motion only runs while its section is on screen.
    ST.create({ trigger: '#home', start: 'top bottom', end: 'bottom top', onToggle: (s) => orbitWrap.classList.toggle('paused', !s.isActive) });
    ST.create({ trigger: '#work', start: 'top bottom', end: 'bottom top', toggleClass: { targets: '#work', className: 'in-view' } });

    // Small labels decode as they scroll into view.
    $$('.kicker, .when, .work-label small, .status, .cta-small, .facts span, .org, .service li, .more-open').forEach((el) => {
      ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => scramble(el, { duration: 0.9, delay: 0.35 }) });
    });

    // Thin reading-progress bar
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Scroll-out depth: the word lags, the portrait sinks, the copy lifts away.
    const out = () => ({ trigger: '#home', start: 'top top', end: 'bottom top', scrub: true });
    gsap.to(q('.word'), { yPercent: 28, ease: 'none', scrollTrigger: out() });
    gsap.to(q('.portrait'), { yPercent: 10, ease: 'none', scrollTrigger: out() });
    gsap.to($('.hero-id', hs), { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: out() });
    gsap.to($('.hero-list', hs), { y: -30, ease: 'none', scrollTrigger: out() });
    gsap.to($('.statement', hs), { y: -40, ease: 'none', scrollTrigger: out() });

    /* ================= SERVICES / EXPERTISE ================= */
    $$('.cards-sec').forEach((sec) => {
      const title = $('.title', sec);
      const cards = $$('.phone', sec);
      gsap.set(title, { autoAlpha: 0 });
      gsap.set(cards, { autoAlpha: 0, y: 90, rotate: (i) => [-5, 0, 5][i % 3], scale: 0.9 });
      cards.forEach((c) => {
        prepDraw(drawable($('.illus svg', c)));
        gsap.set($$('.illus svg [fill]:not([fill="none"])', c), { autoAlpha: 0 });
        gsap.set($('h3', c), { autoAlpha: 0, y: 14 });
        gsap.set($('.divider', c), { scaleX: 0 });
        gsap.set($$('li', c), { autoAlpha: 0, y: 10 });
        gsap.set($$('.dots b', c), { scale: 0 });
      });
      onEnter(sec, () => {
        const t = gsap.timeline({ defaults: { ease: 'power3.out' } });
        titleIn(title, t, 0);
        t.to(cards, { autoAlpha: 1, y: 0, rotate: 0, scale: 1, duration: 1, ease: 'power4.out', stagger: 0.16, clearProps: 'transform' }, 0.2);
        cards.forEach((c, i) => {
          const at = 0.55 + i * 0.16;
          t.to(drawable($('.illus svg', c)), { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.04 }, at)
            .to($$('.illus svg [fill]:not([fill="none"])', c), { autoAlpha: 1, duration: 0.5, stagger: 0.03 }, at + 0.45)
            .to($('h3', c), { autoAlpha: 1, y: 0, duration: 0.6 }, at + 0.35)
            .to($('.divider', c), { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }, at + 0.5)
            .to($$('li', c), { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.07 }, at + 0.6)
            .to($$('.dots b', c), { scale: 1, duration: 0.35, ease: 'back.out(3)', stagger: 0.08 }, at + 0.85);
        });
      });
      cards.forEach((c) => tilt(c, 10));
    });

    /* ================= WORK ================= */
    const work = $('#work');
    const wTitle = $('.title', work);
    const wItems = $$('.work-item', work);
    gsap.set(wTitle, { autoAlpha: 0 });
    gsap.set(wItems, { autoAlpha: 0 });
    onEnter(work, () => {
      const t = gsap.timeline({ defaults: { ease: 'power3.out' } });
      titleIn(wTitle, t, 0);
      wItems.forEach((it, i) => {
        const ph = $('.work-phone', it);
        const at = 0.25 + i * 0.18;
        t.set(it, { autoAlpha: 1 }, at)
          .fromTo(ph, { y: 120, rotationY: [-25, 0, 25][i % 3], rotationX: 12, transformPerspective: 1000, autoAlpha: 0 }, { y: 0, rotationY: 0, rotationX: 0, autoAlpha: 1, duration: 1.2, ease: 'power4.out', clearProps: 'transform' }, at)
          .fromTo($('.screen', ph), { filter: 'brightness(1.8) saturate(0.4)' }, { filter: 'brightness(1) saturate(1)', duration: 1.3, ease: 'power2.out', clearProps: 'filter' }, at + 0.1)
          .fromTo($('.live-dot', ph), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.5 }, at + 0.8)
          .fromTo($('.work-label', it), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6 }, at + 0.6);
      });
    });
    $$('.work-phone').forEach((p) => tilt(p, 12));

    /* ================= MORE PROJECTS ================= */
    const more = $('.more-sec');
    const mTitle = $('.title', more);
    const mCards = $$('.more-card', more);
    gsap.set(mTitle, { autoAlpha: 0 });
    gsap.set($$('.sec-lede, .more-foot', more), { autoAlpha: 0, y: 16 });
    gsap.set(mCards, { autoAlpha: 0, y: 60, rotationX: -35, transformPerspective: 900, transformOrigin: '50% 100%' });
    onEnter(more, () => {
      const t = gsap.timeline({ defaults: { ease: 'power3.out' } });
      titleIn(mTitle, t, 0);
      t.to($('.sec-lede', more), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.3)
        .to(mCards, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.9, ease: 'power4.out', stagger: 0.1, clearProps: 'transform' }, 0.35)
        .fromTo($$('.status', more), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.5)', stagger: 0.1 }, 0.8)
        .to($('.more-foot', more), { autoAlpha: 1, y: 0, duration: 0.5 }, 1);
    }, 'top 78%');
    mCards.forEach((c) => tilt(c, 7));

    /* ================= STORY ================= */
    const story = $('#story');
    const sTitle = $('.title', story);
    gsap.set(sTitle, { autoAlpha: 0 });
    const leadWords = splitWords($('.about-lead', story));
    const aboutRest = $$('.about > .kicker, .about > p:not(.about-lead), .facts li, .resume-btns > *', story);
    gsap.set(leadWords, { yPercent: 110 });
    gsap.set(aboutRest, { autoAlpha: 0, y: 18 });
    onEnter(story, () => {
      const t = gsap.timeline({ defaults: { ease: 'power3.out' } });
      titleIn(sTitle, t, 0);
      t.to(leadWords, { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.025 }, 0.25)
        .to(aboutRest, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06, clearProps: 'transform' }, 0.5);
    });

    const tline = $('.timeline', story);
    const lineEl = document.createElement('span');
    lineEl.className = 'tl-line';
    lineEl.setAttribute('aria-hidden', 'true');
    tline.prepend(lineEl);
    tline.classList.add('has-line');
    gsap.fromTo(lineEl, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tline, start: 'top 75%', end: 'bottom 55%', scrub: 0.5 } });
    $$('.timeline li', story).forEach((li) => {
      gsap.set(li, { autoAlpha: 0, x: 50 });
      onEnter(li, () => {
        gsap.to(li, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' });
        li.classList.add('dot-in');
      }, 'top 85%');
    });
    const kickers = $$('.timeline-col > .kicker', story);
    gsap.set(kickers, { autoAlpha: 0, x: -16 });
    kickers.forEach((k) => onEnter(k, () => gsap.to(k, { autoAlpha: 1, x: 0, duration: 0.6 }), 'top 88%'));
    const edu = $('.edu', story);
    const badge = $('.edu-badge', story);
    gsap.set(edu, { autoAlpha: 0, y: 30 });
    gsap.set(badge, { scale: 0.6, rotate: -8, autoAlpha: 0 });
    onEnter(edu, () => {
      gsap.to(edu, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' });
      gsap.to(badge, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(2)', delay: 0.35 });
    }, 'top 88%');

    /* ================= CONTACT CTA ================= */
    const cta = $('#contact');
    const ctaBg = $('#ctaBg');
    // Only opacity + scale are scrubbed; animating the blur radius re-rendered the blur every frame.
    gsap.fromTo(ctaBg, { opacity: 0, scale: 1.14 }, { opacity: 0.62, scale: 1.04, ease: 'none', scrollTrigger: { trigger: cta, start: 'top 90%', end: 'top 25%', scrub: true } });
    const bigChars = splitChars($('.cta-big', cta));
    const ctaSmall = $('.cta-small', cta);
    const ctaBtn = $('#workBtn');
    const ctaLinks = $$('.cta-links li', cta);
    gsap.set(ctaSmall, { autoAlpha: 0, letterSpacing: '0.5em' });
    gsap.set(bigChars, { yPercent: 120, autoAlpha: 0 });
    gsap.set(ctaBtn, { autoAlpha: 0, scale: 0.7 });
    gsap.set(ctaLinks, { autoAlpha: 0, y: 14 });
    gsap.set($('.copy', cta), { autoAlpha: 0 });
    onEnter(cta, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to(ctaSmall, { autoAlpha: 1, letterSpacing: '0.14em', duration: 1 }, 0)
        .to(bigChars, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'power4.out', stagger: { each: 0.025, from: 'center' } }, 0.2)
        .to(ctaBtn, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)', clearProps: 'transform' }, 0.75)
        .add(() => ctaBtn.classList.add('shine'), 1.4)
        .to(ctaLinks, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06 }, 1)
        .to($('.copy', cta), { autoAlpha: 1, duration: 0.6 }, 1.4);
    }, 'top 55%');
    // Magnetic button
    if (fine) {
      ctaBtn.addEventListener('pointermove', (e) => {
        const r = ctaBtn.getBoundingClientRect();
        gsap.to(ctaBtn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
      });
      ctaBtn.addEventListener('pointerleave', () => gsap.to(ctaBtn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' }));
    }

    if (document.fonts) document.fonts.ready.then(() => ST.refresh());
    addEventListener('load', () => ST.refresh(), { once: true });
  };

  boot();
  if (document.readyState === 'complete') post({ type: 'portfolio:ready' });
  else addEventListener('load', () => post({ type: 'portfolio:ready' }), { once: true });
})();
