# Portfolio technical audit — aqibkhn.space

Date: 12 November 2026 · Scope: the deployed site (`index.html` 3D desk + `portfolio.html`), which is identical to this repository's `main` branch (commit `ac2c3ec`).

All numbers below were **measured**, not estimated: Lighthouse 12.2.1 (headless Chrome, default mobile emulation = Moto G Power + 4× CPU throttle + slow 4G, and the desktop preset), plus scripted Chrome DevTools Protocol tests with real wheel/keyboard input. Lighthouse varies run to run, so several runs were taken and medians reported.

---

## 1. Reconnaissance

- **Stack:** static site, no build step and no `package.json`. Plain HTML/CSS/JS; GSAP 3.12.5 + ScrollTrigger and Lenis 1.1.18 from CDNs; Three.js r160 (3D desk only); Google Fonts. Deployed on **Vercel** (confirmed via response headers). Contact form → FormSubmit. Chat assistant → client-side only (no API keys anywhere in the code).
- **Pages:** `/` (3D desk; phones/no-WebGL are redirected to the portfolio), `/portfolio.html` (also embedded in the desk's monitor), `/classic.html` (old site, kept).
- **Not present in this codebase or on the live site** (searched all files and the deployed HTML): React/Next.js/Framer Motion, iframe project previews, a device simulator, "Lock Page Scroll", theme controls, and the claims "2+ Years Building", "verified uptime" and "100 MB" uploads. The audit items that refer to them did not apply. The older Vercel URL linked from the GitHub repository returns an empty page.

## 2. Issues found and fixed

### Critical — scrolling froze
| Problem | Cause | Fix |
|---|---|---|
| Mouse-wheel scrolling did **nothing for the first several seconds**, then lurched (the reported "UI sticks when scrolling"). Trace: Lenis' target climbed to 5,290 px while `window.scrollY` stayed at **0**. | `html { scroll-behavior: smooth }` fought Lenis' per-frame `scrollTo`. The override class `has-lenis` was **stripped by Lenis itself** (it removes any class containing "lenis"), so the fix never applied. | Native smooth scrolling now only applies when Lenis isn't running; added Lenis' required `scroll-behavior: auto` rule; renamed the class to `ls-on`. Verified: page position now tracks every wheel notch. |

### Performance
| Problem (measured) | Fix |
|---|---|
| One **2,039 ms** main-thread task at startup (`portfolio.js`) | Startup now yields to the browser between phases; worst task now **620 ms** |
| ~250 elements had animation start-states written at load (per-element style recalculation) | Each section prepares its own states lazily — in idle time after load, or when it comes within 1.5 screens — hidden by CSS until then |
| ~60 ScrollTriggers created only for one-shot reveals (each measures layout and re-measures on every refresh) | Replaced with shared `IntersectionObserver`s; ScrollTrigger kept only for scrubbed effects |
| SVG path lengths measured for every illustration at load | Measured only when the section is revealed |
| Text "decode" effect rewrote text every frame (style + layout + text shaping) | Throttled to ~22 updates/s and layout-contained while running |
| A full blurred copy of the hero (image + SVG + blur filter) laid out at load for the closing section | Inserted only when that section approaches |
| Marquee wrote its skew every frame | Writes only on change; pauses off-screen (already) |
| Tilt effect called `getBoundingClientRect()` on every pointer move | Measured once per hover |
| Permanent `will-change` on 100+ split letters and three 4,000 px-tall screenshots | Removed (GSAP promotes layers only while animating) |
| Curtain waited for web fonts before even appearing; hero waited indefinitely for fonts | Curtain shows immediately; fonts wait capped at 0.9 s; portrait reveal starts earlier (same choreography, tighter) |
| Render-blocking Google Fonts; unused Oswald 400/700; full Great Vibes font for two words | Non-blocking font CSS; Oswald trimmed to 500/600; Great Vibes subset to "Hello, I'm" only |
| Oversized images: phone screenshots 480 px shown at ~260 px; 600 px avatar shown at 40 px; portrait 998 px on phones; screenshots without dimensions | `srcset`/`sizes` with new 300 px screenshots and a 560 px portrait; 96 px avatar (19 KB → 1 KB); explicit `width`/`height` everywhere |
| Local dev server served uncompressed text and `no-cache` (made local Lighthouse look worse than production) | gzip added (`portfolio.js` 50 KB → 15 KB on the wire); production Vercel already compresses |

### Accessibility, SEO, best practices
- Chat launcher had **no accessible name** on phones (label hidden) → `aria-label` added.
- **Missing favicon** caused a console 404 on every page → SVG + PNG favicons and an Apple touch icon.
- Added `robots.txt`, `sitemap.xml`, Twitter/X card tags and Person structured data on `portfolio.html`; more descriptive hero image alt text.
- Text below 11 px on tablets/phones ("Live" tags, chat timestamps, project labels at 1024 px) → minimum 11 px.

### Security / hygiene
- **Dev server path traversal:** `/../` could read files outside the project → blocked (verified 403). File names with spaces now resolve.
- Unused files publicly downloadable from the live site — five Lighthouse JSON dumps (3.2 MB), `Untitled-1.txt`, a duplicate CV, the source WhatsApp photo, an unused cutout → excluded from deployment via **`.vercelignore`** (nothing deleted from the repository).

### Content accuracy (verified against each project's repository)
| Project | Finding | Action |
|---|---|---|
| Beef Burger Patties | `package.json`: React + Vite, GSAP, Framer Motion, Zustand, Supabase — no Next.js | Site was already correct |
| 1Tap | React, TypeScript, Supabase, TanStack Router, Tailwind | Correct. The site makes no upload-size claim |
| Space Cleaner | Also ships a **Tauri** desktop build | Added Tauri to its stack |
| SkillBridge | Flutter app uses **Firebase** (Auth, Firestore, Storage, Messaging) + Riverpod; the website is Next.js + **Supabase**. Website deployment `website-seven-sand-21.vercel.app` returns **404** | Described both accurately; no live link is shown (none exists) |
| Infinity Basket Mart | Repository contains **only a README** | Link relabelled "Project notes" and the description says the client's code isn't public (was labelled "Source") |
| Speech ⇄ Text, PixelMint | Dependencies match the site | No change |

The chat assistant's knowledge base was updated with the same corrections.

## 3. Results — baseline vs final

### Lighthouse — `portfolio.html`
| | Mobile before | Mobile after (median of 3) | Desktop before | Desktop after (2 runs) |
|---|---|---|---|---|
| Performance | 46 | **58** (47–59) | 87 | **91–92** |
| Accessibility | 94 | **100** | 100 | **100** |
| Best Practices | 96 | **100** | 96 | **100** |
| SEO | 100 | **100** | 100 | **100** |
| First Contentful Paint | 3.6 s | 1.8–2.0 s | 1.3 s | 0.8 s |
| Largest Contentful Paint | 4.7 s | 4.0 s | 1.4 s | 1.2 s |
| Total Blocking Time | 1,290 ms | 1,200 ms | 10 ms | 70–110 ms |
| Cumulative Layout Shift | 0.006 | 0–0.001 | 0.016 | 0.004–0.023 |

Note: the "before" runs were served without compression by the local server; "after" runs include gzip, as production does.

**Follow-up (approved): phones skip the opening curtain and show the hero photo from the first paint** (it still rises into place; the rest of the intro is unchanged; desktop and the 3D monitor keep the curtain/loader). Mobile, 3 runs: Performance **69** median (56 / 69 / 70), LCP **2.9 s** median (2.4–3.7 s, was 4.0 s), Speed Index 3.6–4.1 s (was 5.0–7.3 s), TBT 1.2–1.5 s, CLS 0–0.011. Accessibility, Best Practices and SEO stay at 100.

### Scrolling (1440×900, 70 real wheel notches down + 20 up, headless Chrome)
| | Before | After (2 runs) |
|---|---|---|
| Page actually scrolled | **No** — stuck at the top for ~6 s, ended at 1,177 px | Yes — ends at 2,916 px (the correct position) |
| Average frame rate | 57.7 fps (page wasn't moving) | **58.8–59.5 fps** while scrolling the whole page |
| 95th-percentile frame | 16.8 ms | **16.8 ms** |
| Frames > 33 ms | 9 | 2–7 |
| Worst frame | 117 ms | 50–80 ms |

### Responsive (11 viewports, 1920×1080 → 360×800)
No horizontal overflow at any size before or after. Sub-11 px text: 3 elements at 1024–360 px before → 0 at phone sizes after. Screenshots were reviewed at 360, 768 and 1024 px.

### Functional tests (scripted, real browser) — all passed, 0 console errors
Contact form: empty submission, invalid email, network failure (genuine error + direct email link, no fake success), double-submit sends once (button disabled, "Sending…"). Contact and project sheets: open, Esc closes, scrolling released after closing, project pager. Menu: opens, link reaches the section, closes. Assistant: opens, answers, ignores empty input, Esc closes. External links: 22/23 return 200; LinkedIn returns 999 (blocks automated checks — not verifiable by script).

A **real** contact-form submission was not sent (it would email your inbox) — please send one test message yourself after deploying.

## 4. Remaining issues (honest)

1. **Mobile Lighthouse performance is 69, not 90.** After skipping the curtain on phones, LCP is close to target (2.9 s median vs ≤ 2.5 s). What remains is **Total Blocking Time (~1.2–1.5 s)**: GSAP's hero intro (split-letter and decode animations) and ScrollTrigger setup running on a 4×-throttled CPU. Further gains would mean a lighter intro on phones (fewer per-letter animations) — a design trade-off, not changed.
2. **3D desk (`/`) scores 55 on desktop Lighthouse**, but headless Chrome renders WebGL in software (SwiftShader), which inflates blocking time; it was not measured on a real GPU. Phones never load it (they're redirected).
3. LinkedIn link couldn't be verified automatically.
4. `classic.html` (old site) still uses the name "Aqib Khan" and its old chatbot; it was left unchanged. The audit brief mentions "Aqib Khan" branding; the current site uses **Muhammad Aqib** as you requested earlier.

## 5. Files

**Modified:** `assets/portfolio/portfolio.js`, `assets/portfolio/portfolio.css`, `assets/portfolio/assistant.js`, `assets/portfolio/assistant.css`, `portfolio.html`, `index.html`, `server.js`.
**Added:** `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `robots.txt`, `sitemap.xml`, `.vercelignore`, `assets/portrait-560.webp`, `assets/avatar-96.webp`, `assets/projects/mobile-{1tap,beef-burger,space-cleaner}-300.webp`, this report.
**Dependencies:** none added or removed.

## 6. Deploying

Commit and push to `main`; Vercel redeploys automatically and respects `.vercelignore`. After deploying: open the site on a phone and a laptop, scroll top to bottom, and send one real contact-form message.
