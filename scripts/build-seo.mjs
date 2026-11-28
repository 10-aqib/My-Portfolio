/* ==========================================================
   Static SEO build
   Generates a crawlable, shareable page for every project
   (projects/<slug>.html) and a fresh sitemap.xml, from the same
   data the portfolio uses (assets/portfolio/projects.js).

   Run after changing a project:   node scripts/build-seo.mjs
   ========================================================== */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const PROJECTS = require(join(ROOT, 'assets/portfolio/projects.js'));

const SITE = 'https://aqibkhn.space';
const PERSON_ID = `${SITE}/#person`;
const TODAY = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const host = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

const SYMBOLS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="star" viewBox="0 0 24 24"><path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0z" fill="currentColor"/></symbol>
  <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="arrow-ne" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="github" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></symbol>
</defs></svg>`;

function page(p, i) {
  const url = `${SITE}/projects/${p.slug}`;
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const who = p.client ? 'built solo by Muhammad Aqib' : 'by Muhammad Aqib';
  const title = `${p.name} — ${p.kind} ${p.client ? 'built' : ''} by Muhammad Aqib`.replace(/\s+/g, ' ');
  const description = clip(`${p.summary} ${p.client ? 'Designed, built and launched solo by' : 'A project by'} Muhammad Aqib, web & mobile developer in Islamabad.`, 158);
  const image = p.desktop ? `${SITE}/${p.desktop}` : `${SITE}/assets/og-image.jpg`;
  const status = p.live ? 'Live' : p.status;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${url}#work`,
        name: p.name,
        headline: `${p.name} — ${p.kind}`,
        description: p.summary,
        url,
        image,
        genre: p.kind,
        keywords: p.stack.join(', '),
        creator: { '@id': PERSON_ID },
        author: { '@id': PERSON_ID },
        ...(p.live ? { sameAs: p.live } : {}),
        ...(p.repos.length ? { isBasedOn: p.repos.map((r) => r.url) } : {})
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Muhammad Aqib', item: `${SITE}/portfolio` },
          { '@type': 'ListItem', position: 2, name: p.client ? 'Client work' : 'Projects', item: `${SITE}/portfolio#${p.client ? 'clients' : 'work'}` },
          { '@type': 'ListItem', position: 3, name: p.name, item: url }
        ]
      },
      { '@type': 'Person', '@id': PERSON_ID, name: 'Muhammad Aqib', url: `${SITE}/portfolio` }
    ]
  };

  const links = [
    p.live ? `<a class="btn btn-dark" href="${p.live}" target="_blank" rel="noopener">Visit live site ${icon('arrow-ne')}</a>` : '',
    ...p.repos.map((r) => `<a class="btn btn-line" href="${r.url}" target="_blank" rel="noopener">${icon('github')}${esc(r.label)}</a>`)
  ].join('\n          ');

  const media = p.desktop
    ? `<div class="p-media">
        <figure class="p-desktop" style="margin:0"><div class="bar"><i></i><i></i><i></i><span>${esc(host(p.live))}</span></div><img src="../${p.desktop}" width="${p.dw}" height="${p.dh}" alt="${esc(p.name)} website on desktop" fetchpriority="high"></figure>
        <div class="p-mobile"><i class="notch" aria-hidden="true"></i><img src="../${p.mobile}" srcset="../${p.mobile.replace('.webp', '-300.webp')} 300w, ../${p.mobile} 480w" sizes="220px" width="480" height="${p.mh}" alt="${esc(p.name)} on a phone" loading="lazy" decoding="async"></div>
      </div>`
    : `<div class="p-cover" aria-hidden="true"><b>${esc(p.cover)}</b><span>${esc(p.kind)}</span></div>`;

  return `<!DOCTYPE html>
<!-- Generated by scripts/build-seo.mjs from assets/portfolio/projects.js — edit the data, then re-run the build. -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="Muhammad Aqib">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#0E0E0E">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Muhammad Aqib">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:alt" content="${esc(p.name)} — ${esc(p.kind)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image}">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="icon" href="../favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="../apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@500;600&family=Inter:wght@400;500;600&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@500;600&family=Inter:wght@400;500;600&display=swap"></noscript>
  <link rel="stylesheet" href="../assets/portfolio/portfolio.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  ${SYMBOLS}
  <main class="sheet-inner">
    <a class="sheet-back" href="../portfolio#${p.client ? 'clients' : 'work'}"><svg aria-hidden="true" style="transform:scaleX(-1)"><use href="#arrow"/></svg>Back to the portfolio</a>
    <article>
      <div class="p-head">
        <div>
          <p class="kicker">${esc(p.kind)} · ${esc(status)}${p.client ? ' · Client work' : ''}</p>
          <h1 style="font: 400 clamp(52px, 7vw, 96px)/.95 var(--display); text-transform: uppercase; color: var(--ink);">${esc(p.name)}</h1>
          <p class="lede">${esc(p.summary)}</p>
        </div>
        <div class="p-links">
          ${links}
        </div>
      </div>
      ${media}
      <div class="p-grid">
        <div>
          <h2 class="kicker" style="font-size:13px">Overview</h2>
          ${p.body.map((b) => `<p>${esc(b)}</p>`).join('\n          ')}
          <ul class="p-hl">${p.highlights.map((h) => `<li>${icon('star')}${esc(h)}</li>`).join('')}</ul>
        </div>
        <aside class="p-meta">
          <dl>
            <div><dt>Developer</dt><dd><a href="../portfolio">Muhammad Aqib</a></dd></div>
            <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
            <div><dt>Category</dt><dd>${esc(p.kind)}</dd></div>
            <div><dt>Status</dt><dd>${esc(status)}</dd></div>
            ${p.live ? `<div><dt>Website</dt><dd><a href="${p.live}" target="_blank" rel="noopener">${esc(host(p.live))} ↗</a></dd></div>` : ''}
            ${p.repos.map((r) => `<div><dt>${esc(r.label)}</dt><dd><a href="${r.url}" target="_blank" rel="noopener">GitHub ↗</a></dd></div>`).join('\n            ')}
          </dl>
          <div><h2 class="kicker" style="font-size:13px">Built with</h2><ul class="tags">${p.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        </aside>
      </div>
    </article>
    <nav class="p-pager" aria-label="More projects">
      <a href="${prev.slug}"><small>← Previous</small><b>${esc(prev.name)}</b></a>
      <a href="${next.slug}"><small>Next →</small><b>${esc(next.name)}</b></a>
    </nav>
    <p style="margin-top:48px; text-align:center"><a class="btn-work btn-work--sm" href="../portfolio#contact">Let's work together</a></p>
    <p class="copy" style="text-align:center">${esc(p.name)} — ${esc(p.kind)} ${esc(who)}, web &amp; mobile application developer in Islamabad, Pakistan.</p>
  </main>
</body>
</html>
`;
}

// Project pages (drop stale ones first so renamed slugs don't linger)
const outDir = join(ROOT, 'projects');
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) if (f.endsWith('.html')) unlinkSync(join(outDir, f));
PROJECTS.forEach((p, i) => writeFileSync(join(outDir, `${p.slug}.html`), page(p, i)));

// Sitemap (with screenshots as image entries)
const img = (loc, title) => `\n    <image:image><image:loc>${SITE}/${loc}</image:loc><image:title>${esc(title)}</image:title></image:image>`;
const urls = [
  { loc: `${SITE}/portfolio`, priority: '1.0', freq: 'monthly', images: img('assets/portrait.webp', 'Muhammad Aqib, web and mobile application developer') + img('assets/og-image.jpg', 'Muhammad Aqib — Web & Mobile Application Developer') },
  ...PROJECTS.map((p) => ({
    loc: `${SITE}/projects/${p.slug}`,
    priority: p.client || p.featured ? '0.8' : '0.6',
    freq: 'yearly',
    images: p.desktop ? img(p.desktop, `${p.name} — ${p.kind}`) : ''
  }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>${u.images}
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

/* ---------- Structured data + crawlable links injected into the HTML pages ---------- */
const SAME_AS = ['https://github.com/10-aqib', 'https://www.linkedin.com/in/aqib10', 'https://www.instagram.com/aqibkhn._'];
const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Muhammad Aqib',
  alternateName: ['Aqib Khan', 'Aqib'],
  givenName: 'Muhammad',
  familyName: 'Aqib',
  url: `${SITE}/portfolio`,
  image: { '@type': 'ImageObject', url: `${SITE}/assets/profile.jpg`, width: 1024, height: 1024 },
  jobTitle: 'Web and Mobile Application Developer',
  description: 'Web and mobile application developer in Islamabad, Pakistan, building Flutter apps on Firebase, React and Next.js websites, and e-commerce and ordering platforms for local businesses.',
  email: 'mailto:aqibk1051@gmail.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Islamabad', addressRegion: 'Islamabad Capital Territory', addressCountry: 'PK' },
  nationality: { '@type': 'Country', name: 'Pakistan' },
  knowsLanguage: ['en', 'ur'],
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bahria University Islamabad', url: 'https://www.bahria.edu.pk/' },
  affiliation: { '@type': 'Organization', name: 'Altaf Developers' },
  hasOccupation: {
    '@type': 'Occupation',
    name: 'Web and Mobile Application Developer',
    occupationLocation: { '@type': 'City', name: 'Islamabad' },
    skills: 'Flutter, Dart, Firebase, React, Next.js, TypeScript, Node.js, Supabase, UI/UX, E-commerce, AI integration'
  },
  knowsAbout: ['Flutter', 'Dart', 'Firebase', 'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Supabase', 'Tailwind CSS', 'GSAP', 'WordPress', 'WooCommerce', 'E-commerce development', 'Mobile app development', 'Web development', 'UI/UX design', 'AI integration'],
  sameAs: SAME_AS
};
const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Muhammad Aqib', alternateName: 'Muhammad Aqib — Portfolio', inLanguage: 'en', publisher: { '@id': PERSON_ID } },
    { '@type': 'ProfilePage', '@id': `${SITE}/portfolio#page`, url: `${SITE}/portfolio`, name: 'Muhammad Aqib — Web & Mobile App Developer in Islamabad', isPartOf: { '@id': `${SITE}/#website` }, mainEntity: { '@id': PERSON_ID }, primaryImageOfPage: `${SITE}/assets/og-image.jpg`, dateModified: TODAY, inLanguage: 'en' },
    person,
    {
      '@type': 'ItemList',
      '@id': `${SITE}/portfolio#projects`,
      name: 'Projects by Muhammad Aqib',
      itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/projects/${p.slug}`, name: `${p.name} — ${p.kind}` }))
    }
  ]
};

const inject = (file, marker, content) => {
  const path = join(ROOT, file);
  const html = readFileSync(path, 'utf8');
  const start = `<!-- build-seo:${marker}:start -->`;
  const end = `<!-- build-seo:${marker}:end -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error(`${file}: missing ${marker} markers`);
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  writeFileSync(path, html.slice(0, a + start.length) + nl + content.split('\n').join(nl) + nl + '  ' + html.slice(b));
};
inject('portfolio.html', 'jsonld', `  <script type="application/ld+json">${JSON.stringify(graph)}</script>`);
inject('index.html', 'links', PROJECTS.map((p) => `      <li><a href="projects/${p.slug}">${esc(p.name)} — ${esc(p.kind)}</a></li>`).join('\n'));
console.log(`Built ${PROJECTS.length} project pages and sitemap.xml (${urls.length} URLs).`);
