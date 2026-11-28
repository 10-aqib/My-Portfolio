/* ==========================================================
   Project data — shared by the portfolio page (portfolio.js)
   and the static SEO build (scripts/build-seo.mjs). Nothing
   invented: copy comes from the CV, each repository README,
   or the live client sites.
   ========================================================== */
(function (root) {
  'use strict';
  const GH = 'https://github.com/10-aqib';
  const PROJECTS = [
    {
      slug: '1tap', name: '1Tap', kind: 'Real-time web app', featured: true,
      mobile: 'assets/projects/mobile-1tap.webp', mh: 1147, desktop: 'assets/projects/1tap.jpg', dw: 800, dh: 502,
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
      mobile: 'assets/projects/mobile-beef-burger.webp', mh: 4155, desktop: 'assets/projects/beef-burger.jpg', dw: 800, dh: 502,
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
      mobile: 'assets/projects/mobile-space-cleaner.webp', mh: 1038, desktop: 'assets/projects/space-cleaner.jpg', dw: 800, dh: 500,
      summary: 'Finds duplicate, unused and heavy files and shows where your disk space went.',
      body: [
        'Space Cleaner scans for duplicate, unused and large files so you can clear what you don’t need in a tap.',
        'Disk usage is drawn as interactive D3 maps, long file lists stay smooth with a virtualized list, and a keyboard command palette keeps everything one shortcut away.'
      ],
      highlights: ['Detects duplicate, unused and heavy files', 'Interactive D3 storage maps', 'Virtualized file list for large folders', 'Keyboard command palette'],
      role: 'Designed and built end to end',
      stack: ['React', 'TypeScript', 'Vite', 'D3.js', 'TanStack Virtual', 'Zustand', 'Tauri'],
      live: 'https://space-cleaner.vercel.app', repos: [{ label: 'Source', url: `${GH}/Cleaner` }]
    },
    /* Client products, delivered solo (design → build → launch). Copy taken from the live sites. */
    {
      slug: 'cafe-and-co', name: 'Cafe & Co', kind: 'Restaurant & café website', client: true,
      mobile: 'assets/projects/mobile-cafe-and-co.webp', mh: 1002, desktop: 'assets/projects/cafe-and-co.jpg', dw: 800, dh: 502,
      summary: 'The website for Cafe & Co., a restaurant and café on East Canal Road, Rahim Yar Khan.',
      body: [
        'Cafe & Co. serves steaks, pasta, pizza, BBQ and karahi alongside a full coffee bar. The site brings all of it online: specials, drinks and coffee menus with prices, set deals for the table, opening hours and a book-a-table call to action.',
        'It also introduces the chefs and runs a news & blog section the owners update themselves. I delivered it as a solo developer, from layout and content through to launch.'
      ],
      highlights: ['Specials, drinks and coffee menus with prices', 'Deals menu and book-a-table calls to action', 'Chef profiles and opening hours', 'News & blog the owners manage themselves'],
      role: 'Solo developer — design, build and launch',
      stack: ['WordPress', 'WooCommerce', 'Elementor'],
      live: 'https://cafeandco.pk', repos: []
    },
    {
      slug: 'royal-stones', name: 'Royal Stones', kind: 'Gemstone e-commerce store', client: true,
      mobile: 'assets/projects/mobile-royal-stones.webp', mh: 3200, desktop: 'assets/projects/royal-stones.jpg', dw: 800, dh: 502,
      summary: 'An online store for natural, certified gemstones and 925 silver jewellery, with a companion Android app.',
      body: [
        'Royal Stones sells natural gemstones — turquoise (feroza), ruby (yaqoot), blue sapphire (neelam) and more — plus 925 silver rings, bracelets, chains and beads, shipping worldwide.',
        'Shoppers browse by category, sort each collection by price, add to cart, sign in and track their orders. The store is matched by an Android app on Google Play. I designed, built and launched it as a solo developer.'
      ],
      highlights: ['Category browsing with sort-by-price per collection', 'Cart, customer login and order tracking', 'Bilingual product names (English / Urdu)', 'Companion Android app on Google Play'],
      role: 'Solo developer — design, build and launch',
      stack: ['React', 'Vite', 'Firebase', 'Vercel', 'Android'],
      live: 'https://www.royalstonepk.com', repos: []
    },
    {
      slug: 'whites-castle', name: 'Whites Castle', kind: 'Pizza ordering platform', client: true,
      mobile: 'assets/projects/mobile-whites-castle.webp', mh: 1100, desktop: 'assets/projects/whites-castle.jpg', dw: 800, dh: 502,
      summary: 'Online ordering for Whites Castle, a pizza restaurant — delivery or pick-up, straight from the menu.',
      body: [
        'Customers choose delivery or pick-up, set their location with one tap or by city and area, then order from a full menu: wraps, fried items, deals, special, traditional and square pizzas, pasta, desserts and drinks.',
        'Menu search, a cart, customer accounts, branch details and opening hours complete it. Built with Next.js and deployed on Vercel — delivered solo, end to end.'
      ],
      highlights: ['Delivery or pick-up with location detection', 'Full categorised menu with deals and search', 'Cart and customer accounts', 'Next.js, prerendered for fast loads'],
      role: 'Solo developer — design, build and launch',
      stack: ['Next.js', 'React', 'Vercel'],
      live: 'https://whitescastle.com', repos: []
    },
    {
      slug: 'skillbridge', name: 'SkillBridge', kind: 'Web + Flutter platform', status: 'In development',
      cover: 'Skill Bridge',
      summary: 'Connects people with reliable local skilled workers and service providers.',
      body: [
        'SkillBridge is a mobile platform that connects customers with local skilled workers and mentors for everyday services.',
        'The Flutter app is built on Firebase (Auth, Firestore, Storage and Cloud Messaging) with Riverpod for state. A companion Next.js website, backed by Supabase, introduces the product. It isn’t publicly deployed yet, so it’s shared here as a case study with its source code.'
      ],
      highlights: ['Cross-platform Flutter mobile app', 'Firebase back end', 'Companion Next.js landing site'],
      role: 'Designed and built the app and site',
      stack: ['Flutter', 'Dart', 'Firebase', 'Riverpod', 'Next.js', 'Supabase'],
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
        'One of the projects I delivered for local businesses in Islamabad. The client’s source code isn’t public; the GitHub repository holds project notes only.'
      ],
      highlights: ['Online store for a local business', 'Responsive design for phones and desktops'],
      role: 'Client project',
      stack: ['E-commerce', 'Responsive design'],
      live: null, repos: [{ label: 'Project notes', url: `${GH}/Infinity-Basket-Mart` }]
    }
  ];

  if (typeof module === 'object' && module.exports) module.exports = PROJECTS;
  else root.PROJECTS = PROJECTS;
})(typeof window !== 'undefined' ? window : globalThis);
