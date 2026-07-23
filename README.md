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

🚀 Running Locally

This is a static site — no build step required.

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
