/* ==========================================================
   Muhammad Aqib — portfolio assistant
   A self-contained conversational assistant that runs entirely
   in the browser (no external AI service, no API keys).

   How it understands questions
   - Normalises text (case, punctuation, contractions), expands
     synonyms and light-stems words ("projects" → "project").
   - Scores every intent in the knowledge base with weighted
     keywords + phrases, with typo tolerance (edit distance).
   - Tracks context: "tell me more", "what's it built with",
     "is it live" refer to the last project or topic.
   - Answers two-part questions ("email and github?").
   - Falls back gracefully with relevant suggestions.

   Everything it says comes from the verified profile below
   (portfolio, CV, GitHub READMEs). It never invents facts.
   ========================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = !document.documentElement.classList.contains('anim');
  const P = () => window.__portfolio || {};

  /* ----------------------------------------------------------
     Profile (verified facts only)
     ---------------------------------------------------------- */
  const ME = {
    name: 'Muhammad Aqib',
    first: 'Aqib',
    role: 'Web & Mobile Application Developer',
    city: 'Islamabad, Pakistan',
    email: 'aqibk1051@gmail.com',
    phone: '+92 336 3620708',
    tel: '+923363620708',
    github: 'https://github.com/10-aqib',
    linkedin: 'https://www.linkedin.com/in/aqib10',
    instagram: 'https://www.instagram.com/aqibkhn._',
    cv: 'assets/aqib-cv.pdf'
  };
  const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  const act = (attrs, label) => `<button type="button" class="ai-act" ${attrs}>${label}</button>`;
  const actions = {
    projects: act('data-ai-go="#work"', 'See my work'),
    contact: act('data-ai-contact', 'Open contact form'),
    cv: `<a class="ai-act" href="${ME.cv}" download="Muhammad-Aqib-CV.pdf">Download CV</a>`,
    cvView: `<a class="ai-act" href="${ME.cv}" target="_blank" rel="noopener">View CV</a>`,
    story: act('data-ai-go="#story"', 'Experience & education'),
    services: act('data-ai-go="#services"', 'Services')
  };
  const project = (slug) => act(`data-open="${slug}"`, 'Open case study');

  /* Projects mirror portfolio.js data, with extra aliases for matching. */
  const PROJECTS = [
    { slug: '1tap', name: '1Tap', alias: ['1tap', 'one tap', 'onetap', 'tap', 'file sharing', 'share files', 'room code', 'qr'],
      what: 'a real-time web app for moving text, links and files between devices — no account or signup. You join a shared room on the same Wi-Fi, or pair privately with a room code or QR code.',
      stack: ['React', 'TypeScript', 'Supabase Realtime', 'TanStack Router', 'Tailwind CSS'], live: 'https://1tap-theta.vercel.app', repo: 'https://github.com/10-aqib/1Tap',
      more: 'Presence and sync run on Supabase Realtime, so devices see each other join and leave the room as it happens.' },
    { slug: 'beef-burger-patties', name: 'Beef Burger Patties', alias: ['beef', 'burger', 'patties', 'restaurant', 'food', 'ordering', 'bbp'],
      what: 'a cinematic burger-restaurant website with online ordering for customers in Pakistan — a topping-by-topping burger builder, kitchen notes, a cart, deals and branch discovery.',
      stack: ['React', 'TypeScript', 'GSAP', 'Framer Motion', 'Zustand', 'Supabase'], live: 'https://beef-burger-patties.vercel.app', repo: 'https://github.com/10-aqib/Beef-Burger-Patties',
      more: 'Animation is handled with GSAP and Framer Motion, app state with Zustand, and the back end with Supabase.' },
    { slug: 'space-cleaner', name: 'Space Cleaner', alias: ['space cleaner', 'cleaner', 'storage', 'disk', 'duplicate', 'files cleaner'],
      what: 'a storage tool that finds duplicate, unused and heavy files and shows where your disk space went, using interactive D3 maps.',
      stack: ['React', 'TypeScript', 'Vite', 'D3.js', 'TanStack Virtual', 'Zustand', 'Tauri'], live: 'https://space-cleaner.vercel.app', repo: 'https://github.com/10-aqib/Cleaner',
      more: 'Long file lists stay smooth with a virtualized list, and a keyboard command palette keeps everything one shortcut away.' },
    { slug: 'skillbridge', name: 'SkillBridge', alias: ['skillbridge', 'skill bridge', 'skilled workers', 'local services', 'mentors', 'final year'],
      what: 'a platform connecting customers with reliable local skilled workers and service providers — a Flutter mobile app on Firebase, plus a companion Next.js website backed by Supabase.',
      stack: ['Flutter', 'Dart', 'Firebase', 'Riverpod', 'Next.js', 'Supabase'], live: null, repo: 'https://github.com/10-aqib/SkillBridge-',
      more: 'It isn’t publicly deployed yet, so it’s shared as a case study with its source code (the Flutter app and the website are separate repositories).' },
    { slug: 'pixelmint', name: 'PixelMint', alias: ['pixelmint', 'pixel mint', 'image compressor', 'compress images', 'resize images', 'image tool'],
      what: 'an image tool that compresses, resizes and converts images entirely in the browser — images are never uploaded to a server.',
      stack: ['Next.js', 'React', 'TypeScript'], live: null, repo: 'https://github.com/10-aqib/PixelMint',
      more: 'You can set a maximum file size in KB or MB, resize to exact dimensions, and export to JPG, PNG or WebP with a preview and output-size report.' },
    { slug: 'text-to-speech', name: 'Speech ⇄ Text', alias: ['speech', 'text to speech', 'tts', 'speech to text', 'stt', 'voice'],
      what: 'a Flutter app that converts speech to text in real time and reads typed text aloud.',
      stack: ['Flutter', 'Dart', 'speech_to_text', 'flutter_tts'], live: null, repo: 'https://github.com/10-aqib/TEXT-TO-SPEECH-',
      more: 'It was built as a software engineering project to show speech recognition and text-to-speech working together in Flutter (English, en-US).' },
    { slug: 'infinity-basket-mart', name: 'Infinity Basket Mart', alias: ['infinity', 'basket', 'mart', 'grocery', 'ecommerce store', 'online store', 'f-8', 'f8'],
      what: 'an e-commerce website built for Infinity Basket, a local mart in F-8, Islamabad — one of his client projects.',
      stack: ['E-commerce', 'Responsive design'], live: null, repo: 'https://github.com/10-aqib/Infinity-Basket-Mart',
      more: 'It gives the mart’s customers a digital shopping experience and is one of the 5+ projects he has delivered for local businesses. The client’s code isn’t public — the GitHub repository only holds project notes.' },
    { slug: 'cafe-and-co', name: 'Cafe & Co', alias: ['cafe and co', 'cafe & co', 'cafe', 'café', 'coffee', 'rahim yar khan', 'ryk', 'cafeandco'],
      what: 'the website for Cafe & Co., a restaurant and café in Rahim Yar Khan — specials, drinks and coffee menus with prices, deals, opening hours, chef profiles, a blog and a book-a-table call to action. He delivered it as a solo developer.',
      stack: ['WordPress', 'WooCommerce', 'Elementor'], live: 'https://cafeandco.pk', repo: null,
      more: 'He handled it end to end on his own — layout, content structure, build and launch — and the owners now update the news & blog section themselves.' },
    { slug: 'royal-stones', name: 'Royal Stones', alias: ['royal stones', 'royal stone', 'royalstone', 'gemstone', 'gemstones', 'gems', 'jewellery', 'jewelry', 'silver rings', 'rings'],
      what: 'an e-commerce store for natural, certified gemstones and 925 silver jewellery that ships worldwide, with a companion Android app on Google Play. He built it solo.',
      stack: ['React', 'Vite', 'Firebase', 'Vercel', 'Android'], live: 'https://www.royalstonepk.com', repo: null,
      more: 'Shoppers browse categories like turquoise, ruby and blue sapphire, sort each collection by price, add to cart, sign in and track their orders.' },
    { slug: 'whites-castle', name: 'Whites Castle', alias: ['whites castle', 'white castle', 'whites', 'castle', 'pizza', 'pizzeria'],
      what: 'an online ordering platform for Whites Castle, a pizza restaurant — delivery or pick-up with location detection, a full categorised menu with deals, search, cart and customer accounts. He delivered it as a solo developer.',
      stack: ['Next.js', 'React', 'Vercel'], live: 'https://whitescastle.com', repo: null,
      more: 'It’s built with Next.js and prerendered on Vercel, so the menu loads fast even on mobile data.' }
  ];
  const projectBy = (slug) => PROJECTS.find((p) => p.slug === slug);
  const projectCard = (p) => `<strong>${esc(p.name)}</strong> is ${p.what}<div class="ai-acts">${project(p.slug)}${p.live ? ext(p.live, 'Live site ↗') : ''}${p.repo ? ext(p.repo, 'GitHub ↗') : ''}</div>`;

  /* ----------------------------------------------------------
     Language helpers
     ---------------------------------------------------------- */
  const CONTRACTIONS = { "what's": 'what is', "who's": 'who is', "where's": 'where is', "how's": 'how is', "it's": 'it is', "he's": 'he is', "i'm": 'i am', "you're": 'you are', "can't": 'cannot', "don't": 'do not', "doesn't": 'does not', "isn't": 'is not', "won't": 'will not' };
  const SYN = {
    hi: 'hello', hey: 'hello', salam: 'hello', assalam: 'hello', aoa: 'hello', yo: 'hello', hiya: 'hello', greetings: 'hello',
    resume: 'cv', curriculum: 'cv', vitae: 'cv', biodata: 'cv',
    college: 'university', uni: 'university', school: 'university', degree: 'education', studies: 'education', study: 'education', student: 'education', studying: 'education', academic: 'education', qualification: 'education', bachelor: 'education', bachelors: 'education', bs: 'education', semester: 'education',
    job: 'work', jobs: 'work', career: 'experience', employment: 'experience', employer: 'experience', company: 'experience', worked: 'experience', working: 'experience', internship: 'intern', interned: 'intern', trainee: 'intern',
    app: 'project', apps: 'project', application: 'project', applications: 'project', portfolio: 'project', built: 'project', build: 'project', made: 'project', creations: 'project', demos: 'project', demo: 'project',
    tech: 'skill', technologies: 'skill', technology: 'skill', stack: 'skill', tools: 'skill', tool: 'skill', languages: 'skill', frameworks: 'skill', framework: 'skill', expertise: 'skill', abilities: 'skill', proficient: 'skill', know: 'skill',
    mail: 'email', gmail: 'email', 'e-mail': 'email', whatsapp: 'phone', number: 'phone', mobile_number: 'phone', call: 'phone', reach: 'contact', touch: 'contact', message: 'contact', dm: 'contact',
    hire: 'hire', hiring: 'hire', recruit: 'hire', employ: 'hire',
    freelancing: 'freelance', freelancer: 'freelance', gig: 'freelance', remote: 'availability', available: 'availability', open: 'availability', onsite: 'availability',
    cost: 'price', rate: 'price', rates: 'price', charge: 'price', budget: 'price', fee: 'price', fees: 'price', pricing: 'price', quote: 'price',
    location: 'location', live: 'live', based: 'location', from: 'from', city: 'location', country: 'location', pakistan: 'location', islamabad: 'location',
    flutter: 'flutter', dart: 'flutter', firebase: 'firebase', firestore: 'firebase', reactjs: 'react', nextjs: 'nextjs', node: 'nodejs', nodejs: 'nodejs', express: 'nodejs', supabase: 'supabase', postgres: 'database', postgresql: 'database', sql: 'database', databases: 'database', db: 'database',
    ai: 'ai', chatbot: 'ai', gpt: 'ai', llm: 'ai', automation: 'ai', automate: 'ai', webhooks: 'ai',
    thanks: 'thank', thx: 'thank', ty: 'thank', appreciate: 'thank',
    bye: 'bye', goodbye: 'bye', cya: 'bye',
    linkedin: 'linkedin', github: 'github', git: 'github', repo: 'github', repos: 'github', repository: 'github', source: 'github', code: 'github', insta: 'instagram', instagram: 'instagram', social: 'social', socials: 'social',
    services: 'service', offer: 'service', offering: 'service', provide: 'service', specialise: 'service', specialize: 'service', specialty: 'service',
    award: 'achievement', awards: 'achievement', achievements: 'achievement', competition: 'achievement', prize: 'achievement', won: 'achievement', recognition: 'achievement',
    meta: 'ads', facebook: 'ads', marketing: 'ads', advertising: 'ads', campaigns: 'ads',
    appointment: 'appointment', booking: 'appointment', bookings: 'appointment',
    website: 'web', websites: 'web', site: 'web', sites: 'web', frontend: 'web', 'front-end': 'web',
    backend: 'backend', 'back-end': 'backend', server: 'backend', api: 'backend', apis: 'backend', rest: 'backend', cloud: 'backend',
    ui: 'design', ux: 'design', designer: 'design', designing: 'design', figma: 'design',
    time: 'time', timezone: 'time', clock: 'time', hour: 'time',
    speak: 'language', urdu: 'language', english: 'language', spoken: 'language'
  };
  const STOP = new Set('a an the is are was were be been am do does did of to in on for with at by it its this that these those me my your his he him you i we our can could would should will please tell show give about any some what which who whom whose where when how why there their they them has have had just also really very much more much and or but if so as into than then'.split(' '));
  const stem = (w) => {
    if (w.length <= 4) return w;
    return w.replace(/(ings|ing|ers|er|ies|es|s|ed|ly)$/u, (m) => (m === 'ies' ? 'y' : ''));
  };
  const normalise = (text) => {
    let t = ` ${text.toLowerCase()} `
      .replace(/[‘’]/g, "'")
      .replace(/next\.js/g, 'nextjs').replace(/node\.js/g, 'nodejs').replace(/react\.js/g, 'react').replace(/d3\.js/g, 'd3');
    Object.entries(CONTRACTIONS).forEach(([k, v]) => { t = t.split(k).join(v); });
    return t.replace(/[^a-z0-9+#\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
  };
  const tokens = (text) => normalise(text).split(' ').filter(Boolean).map((w) => SYN[w] || w).map((w) => SYN[stem(w)] || stem(w));
  const lev = (a, b) => {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return dp[a.length][b.length];
  };
  const fuzzyHas = (toks, kw) => {
    if (toks.includes(kw)) return 1;
    if (kw.length < 5) return 0;
    const tol = kw.length >= 8 ? 2 : 1;
    return toks.some((t) => t.length >= 4 && lev(t, kw) <= tol) ? 0.8 : 0;
  };

  /* ----------------------------------------------------------
     Knowledge base — intents
     keys: weighted keywords (already in normalised/synonym form)
     phrases: raw substrings that strongly signal the intent
     ---------------------------------------------------------- */
  const now = () => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' }).format(new Date()); } catch (e) { return ''; } };
  const INTENTS = [
    { id: 'greet', keys: { hello: 3, morning: 1, evening: 1 }, phrases: ['good morning', 'good evening', 'assalam'],
      a: () => `Hi! 👋 I'm ${ME.first}'s assistant. I know his projects, skills, experience, education and how to reach him — ask me anything.`,
      chips: ['What does he do?', 'Show me his projects', 'Is he available?'] },
    { id: 'who', keys: { who: 2, introduce: 3, yourself: 1, summary: 2, overview: 2, bio: 3, background: 2, profile: 2 }, phrases: ['who is', 'about him', 'tell me about', 'what does he do', 'who are you', 'introduce', 'what do you do'],
      a: () => `<strong>${ME.name}</strong> is a ${ME.role.toLowerCase()} based in ${ME.city}. He builds Flutter apps on Firebase, React and Next.js sites with real-time sync, and websites for local businesses. He's a BS Information Technology student at Bahria University and a Software & Digital Solutions Intern at Altaf Developers.<div class="ai-acts">${actions.projects}${actions.story}</div>`,
      more: () => `Since June 2024 he has delivered more than five digital projects for businesses in Islamabad — working directly with owners to understand what they need, then building it and keeping it running. He likes useful things that feel effortless, and the details that make them feel finished.`,
      chips: ['What are his skills?', 'Where did he intern?', 'Download his CV'] },
    { id: 'bot', keys: { bot: 3, ai: 1, human: 2, real: 1, assistant: 2, trained: 2 }, phrases: ['are you a bot', 'are you human', 'are you ai', 'are you real', 'who made you', 'how do you work', 'chatgpt'],
      a: () => `I'm a small assistant built into this portfolio and trained on ${ME.first}'s own profile — his CV, projects and experience. I run right here in your browser, so I can only answer questions about him. For anything else, ${act('data-ai-contact', 'message him directly')}.` },
    { id: 'projects', keys: { project: 3, work: 2, showcase: 2, example: 2, sample: 2, case: 1, best: 1, featured: 2, live: 1 }, phrases: ['what has he built', 'his work', 'show me', 'projects', 'portfolio'],
      a: () => `Three of his projects are live right now:<ul class="ai-list"><li>${act('data-open="1tap"', '1Tap')} — real-time file &amp; text sharing</li><li>${act('data-open="beef-burger-patties"', 'Beef Burger Patties')} — restaurant ordering app</li><li>${act('data-open="space-cleaner"', 'Space Cleaner')} — storage cleanup tool</li></ul>Client products he delivered solo, end to end:<ul class="ai-list"><li>${act('data-open="cafe-and-co"', 'Cafe &amp; Co')} — restaurant &amp; café website</li><li>${act('data-open="royal-stones"', 'Royal Stones')} — gemstone e-commerce store + Android app</li><li>${act('data-open="whites-castle"', 'Whites Castle')} — pizza ordering platform</li></ul>Plus ${act('data-open="skillbridge"', 'SkillBridge')} (Flutter + Next.js, in development), ${act('data-open="pixelmint"', 'PixelMint')}, ${act('data-open="text-to-speech"', 'Speech ⇄ Text')} and ${act('data-open="infinity-basket-mart"', 'Infinity Basket Mart')} (client e-commerce).<div class="ai-acts">${actions.projects}</div>`,
      chips: ['Tell me about 1Tap', 'What is SkillBridge?', 'Which use Flutter?'] },
    { id: 'skills', keys: { skill: 3, good: 1, expert: 1, use: 1, work: 0.5, flutter: 1, react: 1, nextjs: 1, firebase: 1 }, phrases: ['tech stack', 'what technologies', 'what languages', 'what can he do', 'good at'],
      a: () => `<strong>Mobile:</strong> Flutter &amp; Dart, cross-platform apps, mobile UI/UX.<br><strong>Web:</strong> React, Next.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, GSAP, Framer Motion.<br><strong>Back end &amp; data:</strong> Firebase (Auth, Firestore, Storage), Supabase, Node.js, Express, REST APIs, SQL/PostgreSQL.<br><strong>AI &amp; automation:</strong> AI API &amp; AI chat integration, prompt engineering, webhooks, business process automation.<br><strong>Tools:</strong> Git, GitHub, VS Code, Android Studio, Postman, Vercel, Firebase Console.<div class="ai-acts">${actions.services}</div>`,
      chips: ['Does he know Flutter?', 'Can he build a backend?', 'What about AI?'] },
    { id: 'flutter', keys: { flutter: 4, mobile: 2, android: 2, ios: 2, 'cross-platform': 2, cross: 1, platform: 1 }, phrases: ['mobile app', 'android app', 'ios app'],
      a: () => `Yes — mobile is a core skill. He builds cross-platform apps with <strong>Flutter</strong> and <strong>Dart</strong>, using <strong>Firebase</strong> (Auth, Firestore, Storage) for the back end. Examples: ${act('data-open="skillbridge"', 'SkillBridge')} and the ${act('data-open="text-to-speech"', 'Speech ⇄ Text')} app.`,
      chips: ['What is SkillBridge?', 'Web skills?'] },
    { id: 'web', keys: { web: 3, react: 3, nextjs: 3, typescript: 2, javascript: 2, html: 1, css: 1, tailwind: 1, responsive: 1, landing: 1 }, phrases: ['web development', 'build a website', 'make a website'],
      a: () => `Web is his other core skill: <strong>React</strong>, <strong>Next.js</strong> and <strong>TypeScript</strong>, with Tailwind CSS and motion via GSAP / Framer Motion, deployed on Vercel. Live examples: ${act('data-open="1tap"', '1Tap')}, ${act('data-open="beef-burger-patties"', 'Beef Burger Patties')} and ${act('data-open="space-cleaner"', 'Space Cleaner')}. He also builds business websites and e-commerce for local clients.`,
      chips: ['Can he build a backend?', 'How do I hire him?'] },
    { id: 'backend', keys: { backend: 3, nodejs: 3, supabase: 3, firebase: 2, database: 3, auth: 2, realtime: 2 }, phrases: ['full stack', 'full-stack', 'server side'],
      a: () => `Yes — he works full-stack. Back ends with <strong>Firebase</strong> (Auth, Firestore, Storage), <strong>Supabase</strong> (including Realtime), <strong>Node.js</strong> &amp; Express, REST APIs and SQL/PostgreSQL, plus webhooks and automation. ${act('data-open="1tap"', '1Tap')} runs live presence and sync on Supabase Realtime.`,
      chips: ['What about AI?', 'Show me his projects'] },
    { id: 'ai', keys: { ai: 4, integration: 1, prompt: 2, automation: 2, chat: 1, openai: 2 }, phrases: ['artificial intelligence', 'machine learning', 'ai integration'],
      a: () => `He works with <strong>AI API integration</strong>, <strong>AI chat integration</strong>, prompt engineering, webhooks and business process automation — connecting AI features and automated workflows into apps and business tools.`,
      chips: ['What services does he offer?', 'How do I contact him?'] },
    { id: 'design', keys: { design: 3, interface: 2, animation: 2, motion: 2 }, phrases: ['ui/ux', 'ui ux', 'user interface'],
      a: () => `He handles UI/UX implementation: mobile UI/UX, responsive interfaces that hold up on small phones, and motion with purpose (GSAP, Framer Motion). He cares about the small details — loading states, layout, feel.` },
    { id: 'services', keys: { service: 4, help: 1, do: 1, need: 1, solution: 2, business: 1 }, phrases: ['what services', 'what can he do for', 'can he help', 'what do you offer', 'what does he offer'],
      a: () => `He can help with:<ul class="ai-list"><li>Websites &amp; web apps (React, Next.js)</li><li>Cross-platform mobile apps (Flutter + Firebase)</li><li>Full-stack features — databases, auth, APIs</li><li>E-commerce stores &amp; business websites</li><li>Appointment / booking systems</li><li>AI integrations &amp; automation</li><li>Website maintenance and Meta Ads support</li></ul><div class="ai-acts">${actions.services}${actions.contact}</div>`,
      chips: ['Is he available for freelance?', 'How much does he charge?'] },
    { id: 'experience', keys: { experience: 4, intern: 2, work: 1, history: 2, years: 2, long: 1, since: 1, senior: 1 }, phrases: ['work experience', 'how long', 'how many years', 'where has he worked', 'where does he work'],
      a: () => `<ul class="ai-list"><li><strong>Software &amp; Digital Solutions Intern</strong> — Altaf Developers · May 2026 – present</li><li><strong>Digital Solutions Developer</strong> — freelance for local businesses · June 2024 – present (5+ projects delivered solo, including Cafe &amp; Co, Royal Stones and Whites Castle)</li><li><strong>Web &amp; Mobile Developer</strong> — independent &amp; project work · since January 2023</li></ul><div class="ai-acts">${actions.story}${actions.cv}</div>`,
      more: () => `At Altaf Developers he maintains and optimises client websites, builds client-focused digital solutions, designed a client appointment management system, and manages and supports Meta Ads campaigns. As a freelancer he works directly with business owners on their requirements and keeps their sites running after launch.`,
      chips: ['Tell me more', 'What is Altaf Developers work?', 'Education?'] },
    { id: 'intern', keys: { intern: 4, altaf: 5, developers: 1, ads: 2, appointment: 2, maintenance: 2 }, phrases: ['altaf developers', 'meta ads', 'appointment system'],
      a: () => `He's a <strong>Software &amp; Digital Solutions Intern at Altaf Developers</strong> (since May 2026). His work there: website maintenance and optimisation, client-focused digital solutions, designing a client <strong>appointment management system</strong>, and managing <strong>Meta Ads</strong> campaigns to grow clients' reach. He was recognised for his contribution to client projects during the internship.`,
      chips: ['Other experience?', 'Education?'] },
    { id: 'education', keys: { education: 4, university: 4, bahria: 5, information: 1, it: 1, graduate: 3, graduation: 3, gpa: 1, cgpa: 1, course: 2, coursework: 2 }, phrases: ['where did he study', 'what is he studying', 'which university', 'when does he graduate'],
      a: () => `He's studying a <strong>BS in Information Technology</strong> at <strong>Bahria University, Main Campus E-8, Islamabad</strong> (January 2023 – January 2027, expected). Coursework spans software engineering, databases, networks, IT project management and system &amp; network administration.<div class="ai-acts">${actions.story}</div>`,
      chips: ['Any achievements?', 'Work experience?'] },
    { id: 'achievement', keys: { achievement: 4, proud: 2, certificate: 2, certification: 2, recognised: 2 }, phrases: ['any awards'],
      a: () => `<ul class="ai-list"><li>Delivered ${act('data-open="cafe-and-co"', 'Cafe &amp; Co')}, ${act('data-open="royal-stones"', 'Royal Stones')} and ${act('data-open="whites-castle"', 'Whites Castle')} for clients as a solo developer — all live today.</li><li>Recognised for contributing to client projects and delivering digital solutions during his internship.</li><li>5+ digital projects delivered for local businesses in Islamabad.</li></ul>` },
    { id: 'contact', keys: { contact: 4, email: 3, phone: 3, talk: 2, connect: 2, get: 0.5 }, phrases: ['get in touch', 'how can i reach', 'how do i contact', 'email address', 'phone number', 'whatsapp'],
      a: () => `<ul class="ai-list"><li>Email: <a href="mailto:${ME.email}">${ME.email}</a></li><li>Phone / WhatsApp: <a href="tel:${ME.tel}">${ME.phone}</a></li><li>${ext(ME.linkedin, 'LinkedIn')} · ${ext(ME.github, 'GitHub')} · ${ext(ME.instagram, 'Instagram')}</li></ul><div class="ai-acts">${actions.contact}</div>`,
      chips: ['Is he available?', 'Download his CV'] },
    { id: 'social', keys: { social: 4, linkedin: 4, github: 4, instagram: 4, profile: 1 }, phrases: [],
      a: () => `${ext(ME.linkedin, 'LinkedIn ↗')} · ${ext(ME.github, 'GitHub ↗')} (${'10-aqib'}) · ${ext(ME.instagram, 'Instagram ↗')}` },
    { id: 'hire', keys: { hire: 4, availability: 3, freelance: 4, opportunity: 2, role: 1, position: 2, vacancy: 2, team: 1, join: 2, collaborate: 3, together: 2 }, phrases: ['is he available', 'can i hire', 'open to work', 'looking for work', 'work with him', 'take on'],
      a: () => `Yes — he's open to <strong>freelance projects</strong> and to <strong>remote, hybrid or on-site</strong> roles. The quickest way is the contact form or an email with what you're building and your timeline.<div class="ai-acts">${actions.contact}<a class="ai-act" href="mailto:${ME.email}?subject=Freelance%20project%20inquiry">Email him</a></div>`,
      chips: ['What services does he offer?', 'How much does he charge?'] },
    { id: 'why', pw: 8, keys: { choose: 3, strength: 3, strengths: 3, different: 2, unique: 2, stand: 1 }, phrases: ['why should i hire', 'why should we hire', 'why hire', 'what makes him', 'why him', 'why should i work with'],
      a: () => `A few reasons: he ships real, live products (${act('data-open="1tap"', '1Tap')}, ${act('data-open="beef-burger-patties"', 'Beef Burger Patties')}, ${act('data-open="space-cleaner"', 'Space Cleaner')}); he covers both <strong>mobile (Flutter)</strong> and <strong>web (React/Next.js)</strong> plus the back end; he has delivered 5+ projects for real businesses and works directly with clients on their requirements; and he cares about finish — motion, responsiveness and the small details.` },
    { id: 'price', keys: { price: 4, much: 1, paid: 2, salary: 3, expected: 1 }, phrases: ['how much', 'what does he charge', 'hourly'],
      a: () => `He doesn't list fixed prices — it depends on scope and timeline. Send a short brief (what you need, deadline, budget range) and he'll reply with a quote.<div class="ai-acts">${actions.contact}</div>` },
    { id: 'cv', keys: { cv: 5, download: 2, pdf: 2 }, phrases: ['download cv', 'see his cv', 'his resume'],
      a: () => `Here's his CV (PDF, two pages):<div class="ai-acts">${actions.cv}${actions.cvView}</div>` },
    { id: 'location', keys: { location: 4, from: 2, where: 1, timezone: 2, live: 0.5 }, phrases: ['where is he', 'where does he live', 'where is he from', 'where is he based'],
      a: () => `He's based in <strong>${ME.city}</strong> (UTC+5) and works with clients remotely too. It's ${now()} there right now.` },
    { id: 'time', keys: { time: 4 }, phrases: ['what time'],
      a: () => `It's <strong>${now()}</strong> in Islamabad (UTC+5) right now.` },
    { id: 'language', keys: { language: 3 }, phrases: ['what languages does he speak', 'does he speak'],
      a: () => `He speaks <strong>Urdu</strong> and <strong>English</strong>. (Programming languages: Dart, JavaScript, TypeScript, HTML5, CSS3 and SQL.)` },
    { id: 'site', keys: { site: 1, made: 1, threejs: 3, three: 2, desk: 3, gsap: 2 }, phrases: ['this website', 'this site', 'how was this', 'this portfolio', '3d desk'],
      a: () => `He built this portfolio by hand — plain HTML, CSS and JavaScript with GSAP for motion. The home page is an interactive 3D desk made with Three.js, with this site running live on the monitor.` },
    { id: 'thanks', keys: { thank: 4, great: 1, awesome: 1, cool: 1, nice: 1, helpful: 2 }, phrases: ['thank you'],
      a: () => `You're welcome! Anything else you'd like to know about ${ME.first}?`, chips: ['How do I contact him?', 'Show me his projects'] },
    { id: 'bye', keys: { bye: 4, later: 1 }, phrases: ['see you', 'talk later'],
      a: () => `Thanks for stopping by! If you'd like to work together, ${act('data-ai-contact', 'send him a message')}. 👋` },
    { id: 'personal', keys: { age: 4, old: 3, born: 3, birthday: 3, married: 4, wife: 4, girlfriend: 4, religion: 4, salary: 1, address: 3, height: 3, family: 3 }, phrases: ['how old'],
      a: () => `That's personal, so it isn't something I share. I can tell you about his work, skills, projects, education and how to reach him.` }
  ];

  /* Question-type modifiers used with project context */
  const ASPECTS = [
    { id: 'stack', keys: ['skill', 'made', 'use', 'build', 'project', 'language', 'built'], phrases: ['built with', 'made with', 'tech', 'stack', 'what does it use', 'written in'] },
    { id: 'link', keys: ['live', 'link', 'url', 'visit', 'deploy', 'deployed', 'try', 'web'], phrases: ['is it live', 'can i try', 'where can i see', 'link'] },
    { id: 'repo', keys: ['github', 'source', 'code', 'open'], phrases: ['source code', 'github'] },
    { id: 'more', keys: ['more', 'detail', 'details', 'elaborate', 'explain', 'feature', 'features', 'how'], phrases: ['tell me more', 'more about', 'how does it work', 'what does it do'] }
  ];

  /* ----------------------------------------------------------
     Brain
     ---------------------------------------------------------- */
  const ctx = { topic: null, project: null, lastIntent: null };

  const findProjects = (raw) => {
    const n = ` ${normalise(raw)} `;
    const toks = n.trim().split(' ');
    const hits = [];
    PROJECTS.forEach((p) => {
      const ok = p.alias.some((a) => (a.includes(' ') ? n.includes(` ${a} `) || n.includes(a) : toks.includes(a) || (a.length >= 6 && toks.some((t) => t.length >= 5 && lev(t, a) <= 1))));
      if (ok) hits.push(p);
    });
    return hits;
  };
  const aspectOf = (raw) => {
    const n = normalise(raw);
    const toks = tokens(raw);
    let best = null, bs = 0;
    ASPECTS.forEach((a) => {
      let s = a.phrases.filter((ph) => n.includes(ph)).length * 2;
      s += a.keys.filter((k) => toks.includes(k) || n.split(' ').includes(k)).length;
      if (s > bs) { bs = s; best = a.id; }
    });
    return bs ? best : null;
  };
  const scoreIntents = (raw) => {
    const n = normalise(raw);
    const toks = tokens(raw).filter((t) => !STOP.has(t));
    return INTENTS.map((it) => {
      let s = 0;
      Object.entries(it.keys).forEach(([k, w]) => { s += w * fuzzyHas(toks, k); });
      (it.phrases || []).forEach((ph) => { if (n.includes(ph)) s += it.pw || 3.5; });
      return { it, s };
    }).sort((a, b) => b.s - a.s);
  };
  const isMore = (raw) => /^(and\s+)?(tell me more|more|go on|continue|elaborate|explain more|details?|more details|anything else\??|what else)\W*$/i.test(raw.trim());
  const isYes = (raw) => /^(yes|yeah|yep|sure|ok(ay)?|please|go ahead)\W*$/i.test(raw.trim());

  const answerProject = (p, aspect) => {
    ctx.project = p; ctx.topic = { more: () => `${p.more}<div class="ai-acts">${project(p.slug)}</div>` };
    if (aspect === 'stack') return { html: `<strong>${esc(p.name)}</strong> is built with ${p.stack.map((t) => `<strong>${esc(t)}</strong>`).join(', ')}.<div class="ai-acts">${project(p.slug)}</div>`, chips: ['Is it live?', 'Source code?', 'Tell me more'] };
    if (aspect === 'link') return { html: p.live ? `Yes — ${esc(p.name)} is live: ${ext(p.live, p.live.replace('https://', '') + ' ↗')}` : `${esc(p.name)} isn't publicly deployed, but the source is on ${ext(p.repo, 'GitHub ↗')}.`, chips: ['What is it built with?', 'Tell me more'] };
    if (aspect === 'repo' && !p.repo) return { html: `${esc(p.name)} is client work, so its source code is private. You can see it live at ${ext(p.live, p.live.replace('https://', '') + ' ↗')}.`, chips: ['Other projects?'] };
    if (aspect === 'repo') return { html: `Source for ${esc(p.name)}: ${ext(p.repo, p.repo.replace('https://', '') + ' ↗')}${p.slug === 'skillbridge' ? ` (website: ${ext('https://github.com/10-aqib/skillBridge-Website', 'skillBridge-Website ↗')})` : ''}`, chips: ['Is it live?', 'Other projects?'] };
    if (aspect === 'more') return { html: `${p.more}<div class="ai-acts">${project(p.slug)}</div>`, chips: ['What is it built with?', 'Other projects?'] };
    return { html: projectCard(p), chips: ['What is it built with?', p.live ? 'Is it live?' : 'Source code?', 'Tell me more'] };
  };

  // Which projects use a technology?
  const TECH = ['flutter', 'react', 'nextjs', 'typescript', 'supabase', 'firebase', 'gsap', 'zustand', 'd3', 'tailwind', 'vite', 'dart'];
  const techLabel = { nextjs: 'Next.js', d3: 'D3.js', gsap: 'GSAP', typescript: 'TypeScript', supabase: 'Supabase', firebase: 'Firebase', flutter: 'Flutter', react: 'React', zustand: 'Zustand', tailwind: 'Tailwind CSS', vite: 'Vite', dart: 'Dart' };
  const techQuery = (raw) => {
    const n = normalise(raw);
    if (!/\b(which|what|any|show|list)\b/.test(n) || !/\b(project|projects|apps?|built|use|uses|using|made)\b/.test(n)) return null;
    const t = TECH.find((x) => n.split(' ').includes(x) || n.includes(x));
    if (!t) return null;
    const label = techLabel[t];
    const used = PROJECTS.filter((p) => p.stack.some((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').includes(label.toLowerCase().replace(/[^a-z0-9]/g, ''))));
    if (!used.length) return { html: `None of the projects on this site list ${label}, though it may appear in his other repositories on ${ext(ME.github, 'GitHub')}.` };
    return { html: `Projects built with <strong>${label}</strong>: ${used.map((p) => act(`data-open="${p.slug}"`, esc(p.name))).join(', ')}.` };
  };

  const reply = (raw) => {
    const text = raw.trim();
    if (!text) return null;

    // Follow-ups that depend on context
    if ((isMore(text) || (isYes(text) && ctx.topic)) && ctx.topic && ctx.topic.more) {
      return { html: ctx.topic.more(), chips: ['Show me his projects', 'How do I contact him?'] };
    }
    const tq = techQuery(text);
    if (tq) return tq;

    const projs = findProjects(text);
    const aspect = aspectOf(text);
    if (projs.length === 1) return answerProject(projs[0], aspect);
    if (projs.length > 1) {
      ctx.project = null;
      return { html: projs.map((p) => projectCard(p)).join('<hr class="ai-hr">') };
    }
    // "is it live?", "what's it built with?" → last project
    if (ctx.project && aspect && /\b(it|its|this|that|the app|the project|the site)\b/i.test(text)) return answerProject(ctx.project, aspect);

    const ranked = scoreIntents(text);
    const top = ranked[0];
    if (!top || top.s < 2.2) {
      const near = ranked.filter((r) => r.s > 0.6).slice(0, 3).map((r) => r.it);
      ctx.topic = null;
      return {
        html: `I'm not sure I caught that. I can answer questions about ${ME.first}'s projects, skills, experience, education, availability and contact details.${near.length ? ' Did you mean one of these?' : ''}`,
        chips: near.length ? near.map((it) => (it.chips && it.chips[0]) || it.id) : ['What does he do?', 'Show me his projects', 'How do I contact him?'],
        miss: true
      };
    }
    // Two-part questions: answer the second intent too when it's clearly asked.
    const second = ranked[1];
    const parts = [top.it];
    if (second && second.s >= 3 && second.s >= top.s * 0.7 && / and |&|,|\balso\b/.test(` ${text.toLowerCase()} `) && second.it.id !== 'greet') parts.push(second.it);

    ctx.lastIntent = top.it.id;
    ctx.topic = top.it.more ? { more: top.it.more } : null;
    ctx.project = null;
    return { html: parts.map((it) => it.a()).join('<hr class="ai-hr">'), chips: top.it.chips };
  };

  /* ----------------------------------------------------------
     UI
     ---------------------------------------------------------- */
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0z" fill="currentColor"/></svg>';
  const root = document.createElement('div');
  root.className = 'ai';
  root.innerHTML = `
    <button class="ai-launch" type="button" aria-expanded="false" aria-controls="aiPanel" aria-label="Ask about me — open the chat assistant">
      <span class="ai-launch-star">${STAR}</span><span class="ai-launch-label">Ask about me</span>
    </button>
    <section class="ai-panel" id="aiPanel" role="dialog" aria-modal="false" aria-labelledby="aiTitle" hidden>
      <header class="ai-head">
        <span class="ai-avatar"><img src="assets/avatar-96.webp" alt="" width="40" height="40" loading="lazy" decoding="async"><i class="ai-online" aria-hidden="true"></i></span>
        <div class="ai-id"><h2 id="aiTitle">Muhammad's assistant</h2><p>Trained on his CV &amp; projects · replies instantly</p></div>
        <button class="ai-icon" type="button" data-ai-reset aria-label="Start a new conversation" title="New conversation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button class="ai-icon" type="button" data-ai-close aria-label="Close assistant"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>
      </header>
      <div class="ai-log" role="log" aria-live="polite" data-lenis-prevent></div>
      <div class="ai-chips" data-lenis-prevent></div>
      <form class="ai-form" autocomplete="off">
        <label class="sr-only" for="aiInput">Ask a question about Muhammad Aqib</label>
        <input id="aiInput" type="text" placeholder="Ask about projects, skills, experience…" maxlength="300" enterkeyhint="send">
        <button type="submit" aria-label="Send">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const launch = $('.ai-launch', root);
  const panel = $('.ai-panel', root);
  const log = $('.ai-log', root);
  const chipsEl = $('.ai-chips', root);
  const form = $('.ai-form', root);
  const input = $('#aiInput', root);
  let open = false;
  let busy = false;
  const STORE = 'ai-chat-v1';

  const time = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const scrollLog = () => { log.scrollTop = log.scrollHeight; };
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify([...log.querySelectorAll('.ai-msg')].map((m) => ({ who: m.dataset.who, html: m.querySelector('.ai-bubble').innerHTML })))); } catch (e) { /* ignore */ } };

  const addMsg = (who, html, { animate = true } = {}) => {
    const m = document.createElement('div');
    m.className = `ai-msg ai-${who}`;
    m.dataset.who = who;
    m.innerHTML = `<div class="ai-bubble">${html}</div><span class="ai-time">${time()}</span>`;
    log.appendChild(m);
    if (animate && window.gsap && !reduce) gsap.fromTo(m, { autoAlpha: 0, y: 14, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', transformOrigin: who === 'me' ? '100% 100%' : '0% 100%' });
    scrollLog();
    return m;
  };
  const setChips = (list) => {
    chipsEl.innerHTML = '';
    (list || []).slice(0, 4).forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ai-chip';
      b.textContent = c;
      b.addEventListener('click', () => ask(c));
      chipsEl.appendChild(b);
      if (window.gsap && !reduce) gsap.fromTo(b, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35, delay: 0.05 * i, ease: 'power2.out' });
    });
  };
  const typing = () => {
    const t = document.createElement('div');
    t.className = 'ai-msg ai-bot ai-typing';
    t.innerHTML = '<div class="ai-bubble" aria-label="Typing"><i></i><i></i><i></i></div>';
    log.appendChild(t);
    scrollLog();
    return t;
  };
  // Reveal the answer word-by-word, keeping its HTML intact.
  const stream = (bubble, html) => new Promise((resolve) => {
    if (reduce) { bubble.innerHTML = html; resolve(); return; }
    bubble.innerHTML = html;
    const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
    const words = [];
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      if (!n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const s = document.createElement('span');
        s.className = 'ai-w';
        s.textContent = part;
        words.push(s);
        frag.appendChild(s);
      });
      n.replaceWith(frag);
    });
    const blocks = [...bubble.querySelectorAll('.ai-acts')];
    if (window.gsap && words.length) {
      if (blocks.length) gsap.set(blocks, { autoAlpha: 0, y: 6 });
      gsap.fromTo(words, { opacity: 0 }, {
        opacity: 1, duration: 0.18, ease: 'none', stagger: Math.min(0.03, 1.4 / words.length),
        onUpdate: scrollLog,
        onComplete: () => {
          if (!blocks.length) { scrollLog(); resolve(); return; }
          gsap.to(blocks, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', onComplete: () => { scrollLog(); resolve(); } });
        }
      });
      // Safety net if frames are throttled (background tab): never leave the chat locked.
      setTimeout(resolve, 4000);
    } else resolve();
  });

  async function ask(question) {
    const q = String(question || '').trim().slice(0, 300);
    if (!q || busy) return;
    busy = true;
    addMsg('me', esc(q));
    chipsEl.innerHTML = '';
    input.value = '';
    const res = reply(q) || { html: '…' };
    const t = typing();
    const plain = res.html.replace(/<[^>]+>/g, '');
    await new Promise((r) => setTimeout(r, reduce ? 0 : Math.min(1100, 380 + plain.length * 3)));
    t.remove();
    const m = addMsg('bot', '');
    await stream(m.querySelector('.ai-bubble'), res.html);
    setChips(res.chips || ['Show me his projects', 'What are his skills?', 'How do I contact him?']);
    save();
    busy = false;
    if (open && matchMedia('(hover: hover)').matches) input.focus({ preventScroll: true });
  }

  const greet = () => {
    if (log.children.length) return;
    let restored = false;
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) || '[]');
      if (saved.length) { saved.forEach((m) => addMsg(m.who, m.html, { animate: false })); restored = true; }
    } catch (e) { /* ignore */ }
    if (!restored) {
      const m = addMsg('bot', '');
      stream(m.querySelector('.ai-bubble'), `Hi! 👋 I'm <strong>Muhammad Aqib's</strong> assistant — trained on his CV, projects and experience. What would you like to know?`);
    }
    setChips(['What does he do?', 'Show me his projects', 'Is he available for work?', 'How do I contact him?']);
  };

  const setOpen = (v) => {
    open = v;
    launch.setAttribute('aria-expanded', String(v));
    root.classList.toggle('is-open', v);
    if (v) {
      panel.hidden = false;
      greet();
      if (window.gsap && !reduce) {
        gsap.fromTo(panel, { autoAlpha: 0, y: 26, scale: 0.94, transformOrigin: '100% 100%' }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' });
      }
      setTimeout(() => { input.focus({ preventScroll: true }); scrollLog(); }, 60);
    } else if (window.gsap && !reduce) {
      gsap.to(panel, { autoAlpha: 0, y: 18, scale: 0.96, duration: 0.28, ease: 'power2.in', onComplete: () => { if (!open) panel.hidden = true; } });
      launch.focus({ preventScroll: true });
    } else {
      panel.hidden = true;
      launch.focus({ preventScroll: true });
    }
  };

  launch.addEventListener('click', () => setOpen(!open));
  $('[data-ai-close]', root).addEventListener('click', () => setOpen(false));
  $('[data-ai-reset]', root).addEventListener('click', () => {
    log.innerHTML = '';
    ctx.topic = null; ctx.project = null;
    try { sessionStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    greet();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });

  // Actions inside answers
  root.addEventListener('click', (e) => {
    const go = e.target.closest('[data-ai-go]');
    if (go) { if (matchMedia('(max-width: 760px)').matches) setOpen(false); P().goTo && P().goTo(go.dataset.aiGo); return; }
    if (e.target.closest('[data-ai-contact]')) { setOpen(false); P().openContact && P().openContact(); return; }
    // [data-open] buttons are handled by portfolio.js (opens the case study); step the chat aside
    if (e.target.closest('[data-open]')) setOpen(false);
  });

  // Esc closes the chat before anything else handles it.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { e.stopImmediatePropagation(); setOpen(false); }
  }, true);

  // Gentle attention cue after a while (once per session)
  try {
    if (!sessionStorage.getItem('ai-nudged') && window.gsap && !reduce) {
      setTimeout(() => {
        if (open) return;
        root.classList.add('nudge');
        gsap.fromTo(launch, { y: 0 }, { y: -6, duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 3 });
        setTimeout(() => root.classList.remove('nudge'), 5000);
        sessionStorage.setItem('ai-nudged', '1');
      }, 9000);
    }
  } catch (e) { /* ignore */ }

  // Expose for testing in the console: __assistant.reply('…')
  window.__assistant = { reply, open: () => setOpen(true) };
})();
