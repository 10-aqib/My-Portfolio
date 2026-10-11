const initPortfolio = () => {
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

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
      if (skeleton) skeleton.classList.remove('hidden');
      iframe.src = iframe.dataset.src;
      let loaded = false;
      const onLoaded = () => {
        if (loaded) return;
        loaded = true;
        iframe.classList.add('loaded');
        if (skeleton) skeleton.classList.add('hidden');
        if (poster) poster.classList.add('hidden');
      };
      iframe.onload = onLoaded;
      iframe.onerror = onLoaded;
      // Fallback: hide skeleton after 6s if onload doesn't fire (cross-origin / CSP)
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
      const targetId = btn.dataset.interactTarget;
      const shield = document.getElementById(`shield-${targetId}`);
      const iframe = document.getElementById(`iframe-${targetId}`);
      const lockBtn = document.getElementById(`lock-${targetId}`);
      const card = iframe ? iframe.closest('.project-card') : null;

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
  let modalLoadTimeout = null;

  const openDemoModal = (projectId) => {
    const proj = PROJECTS_CONFIG[projectId];
    if (!proj) return;

    activeProject = proj;
    if (modalUrlDisplay) modalUrlDisplay.textContent = proj.url;
    if (modalExternalLink) modalExternalLink.href = proj.url;

    if (modalLoader) modalLoader.classList.remove('hidden');
    if (modalLoadTimeout) clearTimeout(modalLoadTimeout);

    if (modalIframe) {
      modalIframe.src = proj.url;

      const onIframeLoaded = () => {
        if (modalLoadTimeout) {
          clearTimeout(modalLoadTimeout);
          modalLoadTimeout = null;
        }
        setTimeout(() => {
          if (modalLoader) modalLoader.classList.add('hidden');
        }, 350);
      };

      modalIframe.onload = onIframeLoaded;
      modalIframe.onerror = () => {
        if (modalLoader) modalLoader.classList.add('hidden');
      };

      // 8-second safety timeout so loader spinner never freezes
      modalLoadTimeout = setTimeout(onIframeLoaded, 8000);
    }

    if (demoModal) {
      demoModal.classList.add('active');
      demoModal.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
  };

  const closeDemoModal = () => {
    if (modalLoadTimeout) {
      clearTimeout(modalLoadTimeout);
      modalLoadTimeout = null;
    }
    if (demoModal) {
      demoModal.classList.remove('active');
      demoModal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    setTimeout(() => {
      if (demoModal && !demoModal.classList.contains('active') && modalIframe) {
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

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDemoModal);
  if (modalCloseDot) modalCloseDot.addEventListener('click', closeDemoModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeDemoModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && demoModal && demoModal.classList.contains('active')) {
      closeDemoModal();
    }
  });

  // Viewport Switcher
  viewportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewportBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.viewport;
      if (deviceFrame) deviceFrame.className = `device-frame view-${view}`;
    });
  });

  // Reload iframe
  if (modalReload) {
    modalReload.addEventListener('click', () => {
      if (activeProject && modalIframe) {
        if (modalLoader) modalLoader.classList.remove('hidden');
        if (modalLoadTimeout) clearTimeout(modalLoadTimeout);
        modalIframe.src = activeProject.url;
        modalLoadTimeout = setTimeout(() => {
          if (modalLoader) modalLoader.classList.add('hidden');
        }, 8000);
      }
    });
  }

  // Copy URL with visual indicator
  if (modalCopyUrl) {
    modalCopyUrl.addEventListener('click', () => {
      if (activeProject && modalUrlDisplay) {
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
  }

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
      ans: `<strong>Beef Burger Patties</strong> is a full-featured online food ordering platform.<br><br>• <a href="https://beef-burger-patties.vercel.app" target="_blank" rel="noopener noreferrer">Live Deployment</a><br>• <a href="https://github.com/10-aqib/Beef-Burger-Patties" target="_blank" rel="noopener noreferrer">GitHub Repository</a><br><br>Features interactive burger customization, GSAP animations, cart &amp; checkout flows, and Pakistan branch discovery.`
    },
    {
      keys: ["1tap", "share", "file", "transfer", "p2p"],
      ans: `<strong>1Tap</strong> is a zero-signup cross-device peer-to-peer sharing application.<br><br>• <a href="https://1tap-theta.vercel.app" target="_blank" rel="noopener noreferrer">Live Deployment</a><br>• <a href="https://github.com/10-aqib/1Tap" target="_blank" rel="noopener noreferrer">GitHub Repository</a><br><br>Pairs devices instantly via 6-digit room codes or QR codes to transfer text, links, and files in real-time powered by Supabase Realtime.`
    },
    {
      keys: ["cleaner", "space", "disk", "storage", "duplicate"],
      ans: `<strong>Space Cleaner</strong> is a high-performance disk storage intelligence tool.<br><br>• <a href="https://space-cleaner.vercel.app" target="_blank" rel="noopener noreferrer">Live Deployment</a><br>• <a href="https://github.com/10-aqib/Cleaner" target="_blank" rel="noopener noreferrer">GitHub Repository</a><br><br>Features interactive D3 treemap visualizations, TanStack Virtual tree exploration, and duplicate/heavy file detection.`
    },
    {
      keys: ["skillbridge", "mentor", "worker", "service"],
      ans: `<strong>SkillBridge</strong> connects communities with verified local skilled workers and mentors.<br><br>• <a href="https://website-seven-sand-21.vercel.app" target="_blank" rel="noopener noreferrer">Live Web Deployment</a><br>• <a href="https://github.com/10-aqib/skillBridge-Website" target="_blank" rel="noopener noreferrer">Next.js Web Repo</a><br>• <a href="https://github.com/10-aqib/SkillBridge-" target="_blank" rel="noopener noreferrer">Flutter Mobile Repo</a><br><br>Built with Next.js on the web and paired with a companion Flutter mobile architecture.`
    },
    {
      keys: ["health", "healthsync", "medical", "doctor"],
      ans: `<strong>HealthSync</strong> is a mobile architecture concept built with Flutter and Dart. It features real-time booking flows, authentication, and structured cloud storage powered by the Firebase suite (Auth, Firestore, Cloud Storage).`
    },
    {
      keys: ["project", "work", "built", "portfolio", "featured", "vercel", "demo", "app"],
      ans: `I currently have <strong>4 live production applications deployed on Vercel</strong>:<br><br>1. <a href="https://1tap-theta.vercel.app" target="_blank" rel="noopener noreferrer">1Tap</a> — P2P Realtime Sharing<br>2. <a href="https://space-cleaner.vercel.app" target="_blank" rel="noopener noreferrer">Space Cleaner</a> — Disk Storage Intelligence<br>3. <a href="https://website-seven-sand-21.vercel.app" target="_blank" rel="noopener noreferrer">SkillBridge</a> — Mentorship &amp; Worker Platform<br>4. <a href="https://beef-burger-patties.vercel.app" target="_blank" rel="noopener noreferrer">Beef Burger Patties</a> — Food Ordering &amp; Customizer<br><br>Plus mobile highlight <strong>HealthSync</strong> (Flutter &amp; Firebase). Click <em>Live Demo</em> on any card above to test inside the device simulator!`
    },
    {
      keys: ["skill", "tech", "stack", "language", "framework", "web", "full-stack", "frontend", "backend"],
      ans: `My primary stack includes <strong>React</strong>, <strong>Next.js (App Router)</strong>, <strong>TypeScript</strong>, <strong>Vite</strong>, and <strong>Tailwind CSS</strong> on the frontend, with <strong>Node.js</strong>, <strong>Express</strong>, <strong>Supabase</strong>, and <strong>PostgreSQL</strong> on the backend. For cross-platform mobile, I specialize in <strong>Flutter &amp; Dart</strong> with Firebase.`
    },
    {
      keys: ["mobile", "flutter", "dart", "ios", "android"],
      ans: `I architect mobile applications using <strong>Flutter</strong> and <strong>Dart</strong>. My approach emphasizes reactive state management, SQLite for local caching, clean architecture, and integration with the <strong>Firebase suite</strong> (Auth, Firestore, Storage, Cloud Messaging).`
    },
    {
      keys: ["data", "science", "ml", "machine learning", "python", "ai"],
      ans: `In data science and machine learning, I work with <strong>Python</strong>, <strong>Pandas</strong>, <strong>NumPy</strong>, and <strong>Scikit-learn</strong>. Specializations include transaction fraud detection pipelines with feature encoding, normalization, and classification models like RandomForest.`
    },
    {
      keys: ["creative ai", "prompt", "midjourney", "image", "video", "generation"],
      ans: `I also specialize in <strong>Creative AI and Multimedia Prompt Engineering</strong>, designing prompt architectures for high-fidelity visual generation with optical camera parameters, cinematic color grading, and volumetric lighting.`
    },
    {
      keys: ["education", "degree", "university", "college", "study"],
      ans: `I am currently pursuing a <strong>BS in Information Technology</strong> at Bahria University, Islamabad (2023–2027). Core coursework includes Distributed Systems, Operating Systems, Database Administration, and Network Security.`
    },
    {
      keys: ["experience", "job", "career", "hire"],
      ans: `I have been designing, developing, and shipping full-stack production software independently since 2023. I am actively looking for full-stack, frontend, or mobile engineering opportunities worldwide.`
    },
    {
      keys: ["contact", "email", "phone", "hire", "reach"],
      ans: `You can reach Muhammad Aqib directly via email at <a href="mailto:aqibk1051@gmail.com">aqibk1051@gmail.com</a> or WhatsApp at <a href="tel:+923363620708">+92 336 3620708</a>.`
    },
    {
      keys: ["hi", "hello", "hey", "greet"],
      ans: `Hello! I am Aqib's AI Portfolio Assistant. I'm here to provide technical clarity on his 4 live Vercel deployments, mobile architecture, tech stack, and background. What would you like to know?`
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
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = `chat-msg msg-${sender}`;
    div.innerHTML = text + `<span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const processQuery = (q) => {
    const query = q.toLowerCase();
    let response = `I don't have that specific information in my context. For direct inquiries, feel free to email Aqib at <a href="mailto:aqibk1051@gmail.com">aqibk1051@gmail.com</a> or WhatsApp <a href="tel:+923363620708">+92 336 3620708</a>.`;

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
    if (chatMessages && chatMessages.children.length === 0) {
      appendMsg("Hello! I am Aqib's AI Assistant. I can provide details regarding his 4 live Vercel deployments, mobile architecture, tech stack, and background. How can I assist you?", "bot");
      const suggestions = ["Featured Projects", "1Tap", "Space Cleaner", "Beef Burger Patties", "SkillBridge", "Tech Stack", "Mobile Apps", "Contact"];
      if (chatChips) {
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
    }
  };

  if (chatToggle) {
    chatToggle.onclick = () => {
      chatOpen = !chatOpen;
      if (chatOpen) {
        chatPanel.classList.add('open');
        initChat();
      } else {
        chatPanel.classList.remove('open');
      }
    };
  }

  if (chatClose) {
    chatClose.onclick = () => {
      chatOpen = false;
      if (chatPanel) chatPanel.classList.remove('open');
    };
  }

  if (chatClear) {
    chatClear.onclick = () => {
      if (chatMessages) chatMessages.innerHTML = '';
      initChat();
    };
  }

  const handleSend = () => {
    if (!chatInput) return;
    const val = chatInput.value.trim();
    if (val) {
      appendMsg(val, 'user');
      chatInput.value = '';
      processQuery(val);
    }
  };

  if (chatSend) chatSend.onclick = handleSend;
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    });
  }

  // Real contact form message delivery integration
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const formSubmitBtn = contactForm ? contactForm.querySelector('button[type="submit"]') : null;

  if (contactForm) {
    contactForm.onsubmit = async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('formName');
      const emailInput = document.getElementById('formEmail');
      const messageInput = document.getElementById('formMessage');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !email || !message) {
        if (formStatus) {
          formStatus.style.display = 'block';
          formStatus.style.background = 'rgba(239, 68, 68, 0.12)';
          formStatus.style.border = '1px solid rgba(239, 68, 68, 0.35)';
          formStatus.style.color = '#fca5a5';
          formStatus.textContent = 'Please fill out all fields before submitting.';
        }
        return;
      }

      let originalBtnHtml = '';
      if (formSubmitBtn) {
        originalBtnHtml = formSubmitBtn.innerHTML;
        formSubmitBtn.disabled = true;
        formSubmitBtn.innerHTML = `<span>Sending message...</span>`;
      }

      if (formStatus) {
        formStatus.style.display = 'none';
      }

      try {
        const response = await fetch('https://formsubmit.co/ajax/aqibk1051@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message,
            _subject: `New Portfolio Message from ${name}`
          })
        });

        if (response.ok) {
          if (formStatus) {
            formStatus.style.display = 'block';
            formStatus.style.background = 'rgba(0, 255, 170, 0.12)';
            formStatus.style.border = '1px solid rgba(0, 255, 170, 0.35)';
            formStatus.style.color = 'var(--accent-emerald)';
            formStatus.innerHTML = `<strong>Message sent successfully!</strong> Thank you ${name}, Aqib will get back to you shortly. You can also reach out directly at <a href="mailto:aqibk1051@gmail.com" style="color: #fff; text-decoration: underline;">aqibk1051@gmail.com</a>.`;
          }
          contactForm.reset();
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        if (formStatus) {
          formStatus.style.display = 'block';
          formStatus.style.background = 'rgba(239, 68, 68, 0.12)';
          formStatus.style.border = '1px solid rgba(239, 68, 68, 0.35)';
          formStatus.style.color = '#fca5a5';
          formStatus.innerHTML = `Unable to send message right now. Please email Aqib directly at <a href="mailto:aqibk1051@gmail.com" style="color:#fff; text-decoration:underline;">aqibk1051@gmail.com</a> or WhatsApp <a href="tel:+923363620708" style="color:#fff; text-decoration:underline;">+92 336 3620708</a>.`;
        }
      } finally {
        if (formSubmitBtn) {
          formSubmitBtn.disabled = false;
          formSubmitBtn.innerHTML = originalBtnHtml;
        }
      }
    };
  }

  // Mobile menu button & responsive navigation
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
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

    // Close mobile nav when any link is tapped
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinks.style.display = 'none';
        }
      });
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolio);
} else {
  initPortfolio();
}
