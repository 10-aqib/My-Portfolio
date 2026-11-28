Muhammad Aqib — Portfolio

A single-page developer portfolio with a live, semantic AI chat assistant trained on my own background — visitors can ask it about my skills, projects, education, or experience instead of digging through the page.


✨ Features
AI chat assistant — a semantic-matching chatbot (no external API) that answers questions about my skills, projects, education, experience, availability, and contact info in first person
Live GitHub stats — pulls my public repo count, followers, and top language directly from the GitHub API
Interactive UI — tilt-on-hover project cards, a mouse-follow light effect, animated particle background, and scroll-based reveal animations
Resume preview — in-page PDF preview modal plus a direct download link
Fully responsive — mobile-first layout with a collapsible nav menu
Zero build step — plain HTML/CSS/JS, deployable anywhere static files are served
🧱 Tech Stack
Layer	Tools
Structure	HTML5, semantic sections, JSON-LD structured data
Styling	Custom CSS (no framework), CSS variables, responsive grid/flex
Interactivity	Vanilla JavaScript (IIFE, no dependencies)
Data	GitHub REST API (live stats)
Chat engine	Custom semantic keyword-scoring intent matcher
📄 Sections
Hero — intro, role, availability status
About — background and quick facts
Skills — Frontend, Backend, Databases, Mobile, Data/ML, DevOps & Tools
Projects — SkillBridge (Final Year Project), Campus Notes & Events App, E-Commerce Web App, and more
Experience — academic and personal project work since Jan 2023
Education — BS Information Technology, Bahria University Islamabad (2023–2027)
Contact — email, phone, GitHub, Instagram, and a contact form
🤖 About the Chat Assistant

The built-in assistant isn't a wrapper around a third-party LLM — it's a lightweight, from-scratch semantic matcher: it normalizes each question, scores it against a set of trained intents (skills, projects, education, experience, availability, contact, and more), and responds in first person as if I'm answering directly. It also handles simple follow-ups like "tell me more."

## 🖥️ 3D desk (index.html)

The home page is an interactive 3D workstation built with Three.js (loaded from a CDN — still no build step).
The monitor shows the real, clickable portfolio (`portfolio.html`) through a CSS3D-positioned iframe; WebGL
draws the desk, keyboard, mouse and lighting around it. Scroll (or click the screen) to sit down; press Esc to step back.

- `index.html` + `assets/desk/` — 3D shell, camera path, loader
- `assets/desk/scene.js` — the room itself, fully procedural (no model downloads): walnut desk and hardwood floor
  with generated PBR textures (albedo + roughness + bump), painted plaster wall, pleated linen curtain, glass-sided
  gaming PC with RGB fans, padded leather chair, articulated desk lamp, shelf with LED strip, plants and a live clock.
  Lighting is warm area lights (shelf, riser), a cool monitor halo, a shadow-casting window light, a desk-lamp spot,
  and a custom dark-room reflection environment. Soft contact shadows stand in for ambient occlusion (the monitor
  needs an alpha canvas, so there is no post-processing pass). Shadow maps are static and only re-rendered when
  the mouse or a key moves. Low-end devices automatically get smaller shadow maps and fewer area/point lights.
- `portfolio.html` + `assets/portfolio/` — the portfolio app shown on the monitor, and the site phones get directly
- `classic.html` — the previous one-page site, kept as-is
- **Ambient motion.** Steam rises from the coffee (GPU particles, no per-frame JS) and the PC's RGB fans, strips and
  inner light glide blue → green → red → blue on a 12 s loop. They redraw at ~30 fps, pause while the monitor fills
  the view or the tab is hidden, and are static (no steam, fixed blue) with `prefers-reduced-motion`.
- **Scroll model (fully bidirectional).** The camera path, captions and HUD are pure functions of one damped scroll
  value, so scrolling up retraces exactly the pose you saw going down. Inside the monitor, section reveals use
  `watch()`/`reveal()` in `portfolio.js`: a reveal plays when its section enters and reverses when it leaves (above
  or below), any number of times; GSAP reverses from the current playhead, so changing direction mid-animation
  adapts instead of restarting. Scrubbed effects (hero depth, progress bar, timeline line) follow scroll directly.
  Intentionally one-time: the boot loader, screen power-on, hero entrance and the assistant's once-per-session nudge.
  In focus mode, wheeling up at the very top of the monitor hands the wheel back to the room so the camera travels
  back out along the same path.
- Add `?2d` to the URL to skip the 3D desk. Run locally with `node server.js` (or `PORT=5180 node server.js`).

🚀 Running Locally

This is a static site. The only build step is for SEO: after editing a project in
`assets/portfolio/projects.js`, run `node scripts/build-seo.mjs` to regenerate the
crawlable project pages (`projects/*.html`), `sitemap.xml`, and the structured data
in `portfolio.html` / `index.html`. Commit the generated files. Run the local server
with `node server.js` (it mirrors Vercel's clean URLs, e.g. `/portfolio`).

bash
git clone https://github.com/10-aqib/<repo-name>.git
cd <repo-name>
# open index.html directly, or serve it locally:
npx serve .

Note: the voice/mic-based features (if enabled) and GitHub API calls require the page to be served over http://localhost or https:// — opening the HTML file directly via file:// will disable them.

📁 Structure
.
├── index.html          # entire site — markup, styles, and scripts
├── assets/
│   ├── <profile-photo>
│   └── Muhammad-Aqib-Resume.pdf
└── README.md
📬 Contact
Email: aqibk1051@gmail.com
Phone: +92 336 3620708
GitHub: github.com/10-aqib
Instagram: @aqibkhn._
