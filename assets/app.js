      /* ===================================================
         THREE.JS INTERACTIVE BACKGROUND
         =================================================== */
      const initThreeJS = () => {
        const container = document.getElementById('canvas-container');
        if (!container || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1400;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
          posArray[i] = (Math.random() - 0.5) * 100;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
          size: 0.15,
          color: 0x00ffaa,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending
        });

        const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleMesh);

        const sphereGeo = new THREE.IcosahedronGeometry(15, 2);
        const sphereMat = new THREE.MeshBasicMaterial({
          color: 0x7d2ae8,
          wireframe: true,
          transparent: true,
          opacity: 0.14
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        scene.add(sphere);

        let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
          mouseX = (event.clientX - windowHalfX) * 0.0008;
          mouseY = (event.clientY - windowHalfY) * 0.0008;
        });

        const animate = () => {
          requestAnimationFrame(animate);
          targetX = mouseX * 0.5;
          targetY = mouseY * 0.5;

          particleMesh.rotation.y += 0.0008;
          particleMesh.rotation.x += 0.0004;

          sphere.rotation.y += 0.0016;
          sphere.rotation.x += 0.0008;

          scene.rotation.y += 0.04 * (targetX - scene.rotation.y);
          scene.rotation.x += 0.04 * (targetY - scene.rotation.x);

          renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
      };

      initThreeJS();

      /* ===================================================
         GSAP ANIMATIONS & SCROLL REVEALS
         =================================================== */
      if (typeof gsap !== 'undefined') {
        if (typeof ScrollTrigger !== 'undefined') {
          gsap.registerPlugin(ScrollTrigger);
        }

        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
          if (window.scrollY > 40) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        });

        gsap.from(".hero-text-content > *", {
          y: 25,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.15
        });

        gsap.from(".hero-visual", {
          x: 40,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          delay: 0.35
        });

        const revealElements = document.querySelectorAll('.gsap-reveal');
        revealElements.forEach((el) => {
          gsap.from(el, {
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none"
            },
            y: 35,
            opacity: 0,
            duration: 0.75,
            ease: "power3.out"
          });
        });

        const skillCards = document.querySelectorAll('.skill-card');
        skillCards.forEach(card => {
          const bar = card.querySelector('.skill-progress');
          if (bar) {
            const width = bar.getAttribute('data-width');
            gsap.to(bar, {
              scrollTrigger: {
                trigger: card,
                start: "top 88%"
              },
              width: width,
              duration: 1.4,
              ease: "power3.out",
              delay: 0.2
            });
          }
        });
      }

      /* ===================================================
         3D TILT EFFECT FOR CARDS
         =================================================== */
      const tiltElements = document.querySelectorAll('.tilt-element');
      tiltElements.forEach(el => {
        el.addEventListener('mousemove', e => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xPct = (x / rect.width - 0.5) * 12;
          const yPct = (y / rect.height - 0.5) * -12;
          el.style.transform = `perspective(1000px) rotateX(${yPct}deg) rotateY(${xPct}deg) scale3d(1.01, 1.01, 1.01)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        });
      });

      document.getElementById('year').textContent = new Date().getFullYear();

      /* ===================================================
         LIVE PROJECTS DATA & INTERACTIVE PREVIEWS
         =================================================== */
      const PROJECTS_CONFIG = {
        'beef-burger': {
          title: 'Beef Burger Patties',
          url: 'https://beef-burger-patties.vercel.app',
          github: 'https://github.com/10-aqib/Beef-Burger-Patties',
          displayUrl: 'beef-burger-patties.vercel.app',
          desc: 'Cinematic food-focused online ordering platform with interactive burger customization, deals, and Pakistan branch discovery.'
        },
        '1tap': {
          title: '1Tap',
          url: 'https://1tap-theta.vercel.app',
          github: 'https://github.com/10-aqib/1Tap',
          displayUrl: '1tap-theta.vercel.app',
          desc: 'Instant zero-signup cross-device peer-to-peer file, text, and link sharing using Supabase Realtime & QR room pairing.'
        },
        'cleaner': {
          title: 'Space Cleaner',
          url: 'https://space-cleaner.vercel.app',
          github: 'https://github.com/10-aqib/Cleaner',
          displayUrl: 'space-cleaner.vercel.app',
          desc: 'Storage intelligence tool finding duplicate, unused and large files with D3 storage visualizers and one-tap cleanup.'
        },
        'skillbridge': {
          title: 'SkillBridge',
          url: 'https://website-seven-sand-21.vercel.app',
          github: 'https://github.com/10-aqib/skillBridge-Website',
          displayUrl: 'website-seven-sand-21.vercel.app',
          desc: 'Modern Next.js platform connecting communities with verified local skilled workers and mentors with companion Flutter app.'
        }
      };

      // Lazy load in-card preview iframes only when card enters viewport
      // Poster is shown by default; skeleton shows during active load; poster hides on load
      const loadCardIframe = (card) => {
        const iframe = card.querySelector('.preview-iframe');
        const skeleton = card.querySelector('.preview-skeleton');
        const poster = card.querySelector('.preview-poster');
        if (iframe && iframe.dataset.src && !iframe.src) {
          // Show spinner skeleton (poster stays visible beneath it until load completes)
          if (skeleton) skeleton.classList.remove('hidden');
          iframe.src = iframe.dataset.src;
          const onLoaded = () => {
            iframe.classList.add('loaded');
            if (skeleton) skeleton.classList.add('hidden');
            if (poster) poster.classList.add('hidden');
          };
          iframe.onload = onLoaded;
          // Fallback: hide after 6s if onload doesn't fire (CSP/cross-origin)
          setTimeout(onLoaded, 6000);
        }
      };

      const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadCardIframe(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px' });

      document.querySelectorAll('.project-card').forEach(card => {
        cardObserver.observe(card);
      });

      // In-Card Interaction Unlock/Lock Handlers
      document.querySelectorAll('.btn-shield-interact').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Also trigger iframe load on "Interact Inside Card" click (P1: on-demand init)
          const targetId = btn.dataset.interactTarget;
          const shield = document.getElementById(`shield-${targetId}`);
          const iframe = document.getElementById(`iframe-${targetId}`);
          const lockBtn = document.getElementById(`lock-${targetId}`);
          const card = iframe ? iframe.closest('.project-card') : null;

          // Load iframe on demand if not yet loaded
          if (card) loadCardIframe(card);

          if (shield) shield.classList.add('unlocked');
          if (iframe) iframe.classList.add('interactive');
          if (lockBtn) lockBtn.classList.add('visible');
        });
      });

      document.querySelectorAll('.preview-lock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = btn.dataset.lockTarget;
          const shield = document.getElementById(`shield-${targetId}`);
          const iframe = document.getElementById(`iframe-${targetId}`);

          if (shield) shield.classList.remove('unlocked');
          if (iframe) iframe.classList.remove('interactive');
          btn.classList.remove('visible');
        });
      });

      /* ===================================================
         DEVICE SIMULATOR MODAL LOGIC
         =================================================== */
      const demoModal = document.getElementById('demoModal');
      const modalIframe = document.getElementById('modalIframe');
      const modalUrlDisplay = document.getElementById('modalUrlDisplay');
      const modalExternalLink = document.getElementById('modalExternalLink');
      const modalLoader = document.getElementById('modalLoader');
      const deviceFrame = document.getElementById('deviceFrame');
      const modalCloseBtn = document.getElementById('modalCloseBtn');
      const modalCloseDot = document.getElementById('modalCloseDot');
      const modalBackdrop = document.getElementById('modalBackdrop');
      const modalReload = document.getElementById('modalReload');
      const modalCopyUrl = document.getElementById('modalCopyUrl');
      const viewportBtns = document.querySelectorAll('.viewport-btn');

      let activeProject = null;

      const openDemoModal = (projectId) => {
        const proj = PROJECTS_CONFIG[projectId];
        if (!proj) return;

        activeProject = proj;
        modalUrlDisplay.textContent = proj.url;
        modalExternalLink.href = proj.url;

        modalLoader.classList.remove('hidden');
        modalIframe.src = proj.url;

        modalIframe.onload = () => {
          setTimeout(() => {
            modalLoader.classList.add('hidden');
          }, 400);
        };

        demoModal.classList.add('active');
        demoModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      };

      const closeDemoModal = () => {
        demoModal.classList.remove('active');
        demoModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => {
          if (!demoModal.classList.contains('active')) {
            modalIframe.src = '';
          }
        }, 300);
      };

      // Trigger modal from any "Live Demo" or "Device Simulator" button
      document.querySelectorAll('[data-demo-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openDemoModal(btn.dataset.demoTarget);
        });
      });

      modalCloseBtn.addEventListener('click', closeDemoModal);
      modalCloseDot.addEventListener('click', closeDemoModal);
      modalBackdrop.addEventListener('click', closeDemoModal);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && demoModal.classList.contains('active')) {
          closeDemoModal();
        }
      });

      // Viewport Switcher
      viewportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          viewportBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const view = btn.dataset.viewport;
          deviceFrame.className = `device-frame view-${view}`;
        });
      });

      // Reload iframe
      modalReload.addEventListener('click', () => {
        if (activeProject) {
          modalLoader.classList.remove('hidden');
          modalIframe.src = activeProject.url;
        }
      });

      // Copy URL with visual indicator
      modalCopyUrl.addEventListener('click', () => {
        if (activeProject) {
          navigator.clipboard.writeText(activeProject.url).then(() => {
            const originalText = modalUrlDisplay.textContent;
            modalUrlDisplay.textContent = 'Copied to clipboard!';
            modalUrlDisplay.style.color = 'var(--accent-emerald)';
            setTimeout(() => {
              modalUrlDisplay.textContent = originalText;
              modalUrlDisplay.style.color = '#fff';
            }, 1800);
          });
        }
      });

      /* ===================================================
         AI CHATBOT ASSISTANT
         =================================================== */
      const KB = {
        identity: {
          name: "Muhammad Aqib",
          role: "Web and Mobile Engineer",
          email: "aqibk1051@gmail.com",
          phone: "+92 336 3620708",
          location: "Islamabad, Pakistan"
        }
      };

      const intents = [
        {
          keys: ["burger", "beef", "food", "restaurant", "patties"],
          ans: `<strong>Beef Burger Patties</strong> is a creative side venture and digital brand concept. It's essentially an Easter-egg project showcasing UI prototyping, GSAP animations, and AI-driven creative visual direction.`
        },
        {
          keys: ["1tap", "share", "file", "transfer", "p2p"],
          ans: `<strong>1Tap</strong> is a responsive web application built with modern frontend frameworks. It provides seamless peer-to-peer file sharing via Supabase Realtime and is deployed directly on Vercel for zero-latency access.`
        },
        {
          keys: ["cleaner", "space", "disk", "storage", "cloud"],
          ans: `<strong>Space Cloud</strong> (or Space Cleaner) focuses on cloud-hosted infrastructure and serverless deployments. It leverages advanced data visualization and integrates smoothly with tools like Antigravity IDE MCP servers.`
        },
        {
          keys: ["skillbridge", "mentor", "worker", "service"],
          ans: `<strong>SkillBridge</strong> is a production platform deployed on Vercel, focusing on smooth frontend interactivity and robust API integration to connect communities with local skilled workers.`
        },
        {
          keys: ["health", "healthsync", "medical", "doctor"],
          ans: `<strong>HealthSync</strong> is a flagship mobile architecture concept. Built with Flutter, it features real-time booking flows, authentication, and structured cloud storage powered by the Firebase suite.`
        },
        {
          keys: ["project", "work", "built", "portfolio", "featured", "vercel", "demo", "app"],
          ans: `Here are two of his flagship highlights:<br><br>• <strong>1Tap</strong>: A seamless full-stack web deployment utilizing modern frontend frameworks and real-time syncing.<br>• <strong>HealthSync</strong>: A comprehensive mobile architecture leveraging Flutter and Firebase for real-time patient-doctor management.`
        },
        {
          keys: ["skill", "tech", "stack", "language", "framework", "web", "full-stack", "frontend", "backend"],
          ans: `His primary stack revolves around <strong>Next.js (App Router)</strong>, <strong>React</strong>, <strong>Vite</strong>, and <strong>TypeScript</strong> for the frontend, backed by <strong>Node.js</strong> and <strong>Express</strong>. For mobile architecture, he specializes in <strong>Flutter</strong> and <strong>Dart</strong> with reactive local state and Firebase.`
        },
        {
          keys: ["mobile", "flutter", "dart", "ios", "android"],
          ans: `He architects mobile applications using <strong>Flutter</strong> and <strong>Dart</strong>. His approach emphasizes reactive local state management (setState), SQLite for local caching, and seamless integration with the <strong>Firebase suite</strong> (Auth, Firestore, Storage, Messaging).`
        },
        {
          keys: ["data", "science", "ml", "machine learning", "python", "ai"],
          ans: `In the data science realm, he works with <strong>Python</strong>, <strong>Pandas</strong>, and <strong>Scikit-learn</strong> in Google Colab. A notable specialization is his transaction fraud detection pipeline, which utilizes feature encoding, normalization, and classification algorithms like RandomForestClassifier.`
        },
        {
          keys: ["creative ai", "prompt", "midjourney", "image", "video", "generation"],
          ans: `He is highly specialized in <strong>Creative AI and Multimedia Prompt Engineering</strong>. He designs prompt architectures for hyper-realistic image and video generation, leveraging a deep understanding of optical camera parameters (like 85mm prime lenses and f/1.4 apertures), cinematic color grading, and volumetric lighting.`
        },
        {
          keys: ["education", "degree", "university", "college", "study"],
          ans: `He is currently in his senior year (7th Semester) pursuing a <strong>BS in Information Technology</strong> at Bahria University. Core coursework includes Digital Logic Design, Operating Systems & Kernel Internals, Database Administration, and Network Security.`
        },
        {
          keys: ["experience", "job", "career", "hire"],
          ans: `He brings a pragmatic, modern approach to software engineering, with expertise spanning full-stack web deployments, mobile application architecture, and data pipelines. He is accustomed to maintaining GitHub repositories and configuring advanced dev tooling.`
        },
        {
          keys: ["contact", "email", "phone", "hire", "reach"],
          ans: `You can reach Aqib directly via email at <a href="mailto:aqibk1051@gmail.com">aqibk1051@gmail.com</a>. That's the most reliable way to get a prompt response.`
        },
        {
          keys: ["hi", "hello", "hey", "greet"],
          ans: `Hello. I am Aqib's AI Portfolio Assistant. I'm here to provide technical clarity on his projects, architecture, and background. What would you like to know?`
        }
      ];

      const chatToggle = document.getElementById('chatToggle');
      const chatPanel = document.getElementById('chatPanel');
      const chatClose = document.getElementById('chatClose');
      const chatClear = document.getElementById('chatClear');
      const chatMessages = document.getElementById('chatMessages');
      const chatInput = document.getElementById('chatInput');
      const chatSend = document.getElementById('chatSend');
      const chatChips = document.getElementById('chatChips');

      let chatOpen = false;

      const appendMsg = (text, sender) => {
        const div = document.createElement('div');
        div.className = `chat-msg msg-${sender}`;
        div.innerHTML = text + `<span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };

      const processQuery = (q) => {
        const query = q.toLowerCase();
        let response = `I don't have that specific information in my current context. For inquiries outside my scope, please email Aqib directly at <a href="mailto:aqibk1051@gmail.com">aqibk1051@gmail.com</a>.`;

        for (let intent of intents) {
          if (intent.keys.some(k => query.includes(k))) {
            response = intent.ans;
            break;
          }
        }

        setTimeout(() => {
          appendMsg(response, 'bot');
        }, 400);
      };

      const initChat = () => {
        if (chatMessages.children.length === 0) {
          appendMsg("Hello. I am Aqib's AI Portfolio Assistant. I can provide technical details regarding his architecture, deployments, and background. How can I assist you?", "bot");
          const suggestions = ["Featured Projects", "1Tap", "Beef Burger Patties", "Space Cloud", "Tech Stack", "Machine Learning", "Contact"];
          chatChips.innerHTML = '';
          suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.textContent = s;
            btn.onclick = () => {
              appendMsg(s, 'user');
              processQuery(s);
            };
            chatChips.appendChild(btn);
          });
        }
      };

      chatToggle.onclick = () => {
        chatOpen = !chatOpen;
        if (chatOpen) {
          chatPanel.classList.add('open');
          initChat();
        } else {
          chatPanel.classList.remove('open');
        }
      };

      chatClose.onclick = () => {
        chatOpen = false;
        chatPanel.classList.remove('open');
      };

      chatClear.onclick = () => {
        chatMessages.innerHTML = '';
        initChat();
      };

      const handleSend = () => {
        const val = chatInput.value.trim();
        if (val) {
          appendMsg(val, 'user');
          chatInput.value = '';
          processQuery(val);
        }
      };

      chatSend.onclick = handleSend;
      chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

      // Contact form submission
      document.getElementById('contactForm').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('formName').value;
        alert(`Thank you, ${name}! Your message has been received. You can also email directly at aqibk1051@gmail.com.`);
        e.target.reset();
      };

      // Mobile menu button
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
          const navLinks = document.querySelector('.nav-links');
          if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
          } else {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.left = '24px';
            navLinks.style.right = '24px';
            navLinks.style.background = 'rgba(10, 8, 20, 0.96)';
            navLinks.style.border = '1px solid rgba(255,255,255,0.1)';
            navLinks.style.borderRadius = '16px';
            navLinks.style.padding = '20px';
            navLinks.style.gap = '16px';
          }
        });
      }
    });
