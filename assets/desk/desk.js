/* ==========================================================
   Muhammad Aqib — 3D desk
   WebGL draws the workstation; the monitor's screen is a real
   <iframe> (portfolio.html) placed with CSS3DRenderer underneath
   the canvas. A transparent "hole" mesh punches through the
   WebGL image so the live page shows exactly where the screen is,
   while the bezel can still occlude it from any angle.
   Units: centimetres.
   ========================================================== */

const $ = (s) => document.querySelector(s);
const body = document.body;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

/* ---------------- Loader ---------------- */
const loader = $('#loader');
const loaderNum = $('#loaderNum');
const loaderStep = $('#loaderStep');
const loaderBar = $('#loaderBar');
let shown = 0;
let target = 0;
const t0 = performance.now();
const setProgress = (p, label) => { target = Math.max(target, p); if (label) loaderStep.textContent = label; };
(function tickLoader() {
  shown += (target - shown) * 0.12;
  if (target - shown < 0.002) shown = target;
  loaderNum.textContent = String(Math.round(shown * 100)).padStart(2, '0');
  loaderBar.parentElement.style.setProperty('--p', shown.toFixed(3));
  if (shown < 1) requestAnimationFrame(tickLoader);
})();

const fail = (err) => {
  console.error('[desk] falling back to 2D portfolio:', err);
  loader.classList.add('done');
  $('#fail').hidden = false;
  setTimeout(() => location.replace('portfolio'), 4000);
};

boot().catch(fail);

async function boot() {
  setProgress(0.08, 'Loading the 3D engine…');
  const [THREE, { CSS3DRenderer, CSS3DObject }, { RoundedBoxGeometry }, { RectAreaLightUniformsLib }, { buildWorkspace }] = await Promise.all([
    import('three'),
    import('three/addons/renderers/CSS3DRenderer.js'),
    import('three/addons/geometries/RoundedBoxGeometry.js'),
    import('three/addons/lights/RectAreaLightUniformsLib.js'),
    import('./scene.js')
  ]);
  setProgress(0.4, 'Building the workstation…');
  await new Promise((r) => setTimeout(r, 0));

  /* ---------------- Quality tier ---------------- */
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  const low = coarse || cores <= 4 || mem <= 4;
  let dpr = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 1.75);

  /* ---------------- Renderers ---------------- */
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('No WebGL context');
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // The room is static: shadow maps are only re-rendered when something that casts moves
  // (see `shadowsDirty`), so scrolling the camera never pays for them.
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x000000, 1);

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(innerWidth, innerHeight);
  $('#cssLayer').appendChild(cssRenderer.domElement);

  const scene = new THREE.Scene();
  const BG = new THREE.Color(0x07080a);
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 260, 640);

  const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 1, 3000);

  RectAreaLightUniformsLib.init();


  /* ---------------- Workspace (scene.js) ---------------- */
  const tBuild = performance.now();
  const ws = buildWorkspace({ THREE, RoundedBoxGeometry, scene, renderer, low, onChange: () => invalidate() });
  const { SCREEN_W, SCREEN_H, SCREEN_CY, SCREEN_Z, MON_Z, monitor, hole, panel, glassMat, led,
    keys, keyIndex, keyPress, layoutKey, mouseGroup, MOUSE_HOME, setPower, followMouse, update: updateFx, steam, fanBlades } = ws;

  const buildMs = Math.round(performance.now() - tBuild);

  /* ---------------- CSS3D screen (the real portfolio) ---------------- */
  const screenEl = document.createElement('div');
  screenEl.className = 'screen';
  const iframe = document.createElement('iframe');
  iframe.title = 'Muhammad Aqib — portfolio';
  iframe.setAttribute('allow', 'clipboard-write');
  const deep = location.hash.indexOf('#/') === 0 ? location.hash : '';
  iframe.src = `portfolio?embed=1${deep}`;
  screenEl.appendChild(iframe);
  const screenObj = new CSS3DObject(screenEl);
  // CSS3DObject forces an inline `pointer-events: auto`, which beats the stylesheet and made the
  // iframe swallow the wheel/hover/click whenever the pointer was over the monitor. Drop it so the
  // CSS applies: inert in the overview (scroll drives the camera), interactive only in focus mode.
  screenEl.style.removeProperty('pointer-events');
  screenObj.position.set(0, SCREEN_CY, SCREEN_Z);
  monitor.add(screenObj);

  // The iframe only starts loading once it is in the document, so put it there now.
  const iframeReady = new Promise((resolve) => {
    let done = false;
    const ok = () => { if (!done) { done = true; resolve(); } };
    iframe.addEventListener('load', ok, { once: true });
    addEventListener('message', (e) => { if (e.origin === location.origin && e.data && e.data.type === 'portfolio:ready') ok(); });
    setTimeout(ok, 6000);
  });
  cssRenderer.render(scene, camera);

  /* ---------------- Camera path ---------------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const SCREEN_WORLD = V(0, SCREEN_CY, MON_Z + SCREEN_Z);
  const INTRO_POS = V(-300, 230, 470);
  const INTRO_TGT = V(10, 10, -10);
  let posCurve, tgtCurve, focusDist = 100, screenPx = 1440;

  const fitFocus = () => {
    const aspect = innerWidth / innerHeight;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fill = 0.85;
    const dH = (SCREEN_H / 2) / (tanH * fill);
    const dW = (SCREEN_W / 2) / (tanH * aspect * 0.88);
    focusDist = Math.max(dH, dW);
    // Size the page so it renders ~1:1 with device pixels when focused (crisp text).
    const projectedW = (SCREEN_W / (2 * focusDist * tanH * aspect)) * innerWidth;
    screenPx = Math.round(THREE.MathUtils.clamp(projectedW, 1180, 1720));
    screenEl.style.width = `${screenPx}px`;
    screenEl.style.height = `${Math.round(screenPx * SCREEN_H / SCREEN_W)}px`;
    screenObj.scale.setScalar(SCREEN_W / screenPx);

    // Pull the wide shots back on narrower windows so the whole desk stays in frame.
    const k = Math.max(1, Math.pow((16 / 9) / aspect, 0.85));
    const away = (p, t) => t.clone().add(p.clone().sub(t).multiplyScalar(k));
    const T0 = V(16, 22, -8), T1 = V(-2, 36, -18);
    const P0 = away(V(-128, 138, 236), T0), P1 = away(V(-62, 60, 118), T1);
    const P2 = SCREEN_WORLD.clone().add(V(0, 0, focusDist));
    const Pm = P1.clone().lerp(P2, 0.55).add(V(-6, 2, 0));
    posCurve = new THREE.CatmullRomCurve3([P0, P1, Pm, P2], false, 'centripetal');
    tgtCurve = new THREE.CatmullRomCurve3([T0, T1, SCREEN_WORLD.clone().lerp(T1, 0.25), SCREEN_WORLD.clone()], false, 'centripetal');
  };
  fitFocus();

  /* ---------------- State ---------------- */
  const state = {
    intro: reduceMotion ? 1 : 0,     // 0 → far away, 1 → on the path
    scroll: 0,                        // smoothed scroll progress (0 → 1)
    power: 0,                         // screen power (light, LED)
    blur: reduceMotion ? 0 : 10
  };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const mouse3d = { x: 0, z: 0, tx: 0, tz: 0, click: 0 };
  let mode = 'overview';
  let dirty = 3;
  let shadowsDirty = true;
  const invalidate = (n = 2) => { dirty = Math.max(dirty, n); };

  // Ambient motion (coffee steam, PC RGB cycle) needs a steady redraw. It is throttled to ~30 fps,
  // paused while the monitor fills the view or the tab is hidden, and off for reduced motion.
  const ambient = !reduceMotion;
  if (!ambient) steam.visible = false;
  let ambientAcc = 0;

  const camPos = new THREE.Vector3();
  const camTgt = new THREE.Vector3();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const updateCamera = () => {
    // Arc-length parameterised so equal scroll = equal camera travel.
    const p = THREE.MathUtils.clamp(state.scroll, 0, 1);
    const pe = p * p * (3 - 2 * p) * 0.35 + p * 0.65;
    posCurve.getPointAt(pe, camPos);
    tgtCurve.getPointAt(pe, camTgt);
    if (state.intro < 1) {
      const t = ease(state.intro);
      camPos.lerpVectors(INTRO_POS, camPos, t);
      camTgt.lerpVectors(INTRO_TGT, camTgt, t);
    }
    // Parallax: strong in the wide shot, gone when you're reading the screen.
    const focusAmt = smooth(0.86, 1, state.scroll);
    const amp = reduceMotion ? 0 : (1 - focusAmt);
    camPos.x += pointer.x * 9 * amp;
    camPos.y += -pointer.y * 5 * amp;
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
    glassMat.uniforms.uCam.value.copy(camPos);
    glassMat.uniforms.uFade.value = 1 - focusAmt * 0.6;
    document.documentElement.style.setProperty('--vig', (1 - focusAmt).toFixed(3));
  };

  /* ---------------- Captions & HUD ---------------- */
  const capIntro = $('#capIntro'), capMid = $('#capMid'), capEnd = $('#capEnd');
  const steps = [...document.querySelectorAll('#progress [data-step]')];
  const progressEl = $('#progress');
  const hudTop = document.querySelector('.hud-top');
  const window01 = (x, a, b, c, d) => Math.min(smooth(a, b, x), 1 - smooth(c, d, x));
  let lastCaps = '';
  const updateHud = () => {
    const s = state.scroll;
    const introVis = state.intro >= 1 ? 1 - smooth(0.06, 0.2, s) : 0;
    const a = introVis, b = window01(s, 0.24, 0.34, 0.5, 0.6), c = window01(s, 0.62, 0.7, 0.8, 0.88);
    const sig = `${a.toFixed(2)}${b.toFixed(2)}${c.toFixed(2)}`;
    if (sig !== lastCaps) {
      lastCaps = sig;
      capIntro.style.opacity = a; capIntro.style.transform = `translateY(${(1 - a) * -20}px)`;
      capIntro.style.visibility = a < 0.01 ? 'hidden' : 'visible';
      capMid.style.opacity = b; capMid.style.transform = `translateY(${(1 - b) * 20}px)`;
      capEnd.style.opacity = c; capEnd.style.transform = `translateY(${(1 - c) * 20}px)`;
    }
    progressEl.style.setProperty('--p', s.toFixed(3));
    hudTop.style.opacity = state.intro >= 1 ? (1 - smooth(0.8, 0.92, s)).toFixed(3) : '0';
    hudTop.style.pointerEvents = s > 0.9 ? 'none' : '';
    const idx = s < 0.22 ? 0 : s < 0.6 ? 1 : 2;
    steps.forEach((el, i) => el.classList.toggle('on', i === idx));
    const next = s > 0.992 && state.intro >= 1 ? 'focus' : 'overview';
    if (next !== mode) setMode(next);
  };

  const setMode = (m) => {
    mode = m;
    body.classList.toggle('mode-focus', m === 'focus');
    screenEl.classList.toggle('is-live', m === 'focus');
    if (m === 'focus') {
      hoverTip.classList.remove('show');
      body.classList.remove('can-click-screen');
      try { iframe.contentWindow.postMessage({ type: 'desk:focus' }, location.origin); } catch (e) { /* ignore */ }
      iframe.focus({ preventScroll: true });
    }
  };

  /* ---------------- Scroll → camera progress ----------------
     Native scroll drives a damped progress value; the render loop
     eases the camera toward it so wheel steps feel continuous. */
  const gsap = window.gsap;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let scrollGoal = 0;
  const readScroll = () => { scrollGoal = THREE.MathUtils.clamp(scrollY / maxScroll(), 0, 1); invalidate(); };
  const bindScroll = () => { addEventListener('scroll', readScroll, { passive: true }); readScroll(); };
  const goTo = (p) => window.scrollTo({ top: p * maxScroll(), behavior: reduceMotion ? 'auto' : 'smooth' });
  const sitDown = () => goTo(1);
  const stepBack = () => goTo(0);

  $('#enterBtn').addEventListener('click', sitDown);
  $('#exitBtn').addEventListener('click', stepBack);

  /* ---------------- Input ---------------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hoverTip = $('#hoverTip');
  let hoverScreen = false;
  const hitMonitor = (cx, cy) => {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([hole, panel], false).length > 0;
  };
  addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    mouse3d.tx = pointer.tx * 4.5; mouse3d.tz = pointer.ty * 3.2;
    if (mode !== 'focus' && state.intro >= 1) {
      hoverScreen = hitMonitor(e.clientX, e.clientY);
      body.classList.toggle('can-click-screen', hoverScreen);
      hoverTip.classList.toggle('show', hoverScreen);
      if (hoverScreen) hoverTip.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -150%)`;
    }
    invalidate();
  }, { passive: true });
  addEventListener('pointerdown', () => { mouse3d.click = 1; invalidate(); }, { passive: true });
  addEventListener('click', (e) => {
    if (mode === 'focus' || state.intro < 1) return;
    if (e.target.closest('a, button')) return;
    if (hitMonitor(e.clientX, e.clientY)) sitDown();
  });
  const press = (code) => {
    const i = keyIndex.get(code);
    if (i === undefined) return;
    keyPress[i] = 1; invalidate();
  };
  addEventListener('keydown', (e) => {
    press(e.code);
    if (e.key === 'Escape' && mode === 'focus') stepBack();
  });
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data.type !== 'string') return;
    const d = e.data;
    if (d.type === 'portfolio:exit') stepBack();
    else if (d.type === 'portfolio:wheel') { if (mode === 'focus' && typeof d.dy === 'number') window.scrollBy(0, d.dy); }
    else if (d.type === 'portfolio:key') press(d.code);
    else if (d.type === 'portfolio:click') { mouse3d.click = 1; invalidate(); }
    else if (d.type === 'portfolio:pointer') { mouse3d.tx = (d.x * 2 - 1) * 4.5; mouse3d.tz = (d.y * 2 - 1) * 3.2; invalidate(); }
  });

  /* ---------------- Resize ---------------- */
  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    cssRenderer.setSize(innerWidth, innerHeight);
    fitFocus();
    invalidate(3);
  };
  addEventListener('resize', onResize);

  /* ---------------- Render loop (on demand) ---------------- */
  let last = performance.now();
  let frames = 0, frameTime = 0, tuned = false;
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); invalidate(); requestAnimationFrame(loop); } });

  const loop = (now) => {
    if (!running) return;
    if (window.__desk && window.__desk.freeze) { requestAnimationFrame(loop); return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (ambient && mode !== 'focus') {
      ambientAcc += dt;
      if (ambientAcc >= 1 / 30) { ambientAcc = 0; invalidate(1); }
    }

    // Ease camera progress toward the scroll position
    const ks = reduceMotion ? 1 : 1 - Math.exp(-dt * 3.2);
    const ds = scrollGoal - state.scroll;
    if (Math.abs(ds) > 1e-4) { state.scroll += ds * ks; invalidate(); } else if (state.scroll !== scrollGoal) { state.scroll = scrollGoal; invalidate(); }

    // Smooth pointer
    const k = 1 - Math.exp(-dt * 4);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    if (Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 1e-4) invalidate();

    // Desk mouse follows the cursor
    const km = 1 - Math.exp(-dt * 10);
    mouse3d.x += (mouse3d.tx - mouse3d.x) * km;
    mouse3d.z += (mouse3d.tz - mouse3d.z) * km;
    mouseGroup.position.set(MOUSE_HOME.x + mouse3d.x, MOUSE_HOME.y - mouse3d.click * 0.12, MOUSE_HOME.z + mouse3d.z);
    mouseGroup.rotation.y = -mouse3d.x * 0.03;
    if (mouse3d.click > 0) { mouse3d.click = Math.max(0, mouse3d.click - dt * 7); invalidate(); }
    if (Math.abs(mouse3d.tx - mouse3d.x) + Math.abs(mouse3d.tz - mouse3d.z) > 1e-3) {
      followMouse(mouseGroup.position.x, mouseGroup.position.z);
      shadowsDirty = true; invalidate();
    }

    // Key presses spring back
    let keysMoving = false;
    for (let i = 0; i < keyPress.length; i++) {
      if (keyPress[i] > 0) {
        keyPress[i] = Math.max(0, keyPress[i] - dt * 6);
        layoutKey(i);
        keysMoving = true;
      }
    }
    if (keysMoving) { keys.instanceMatrix.needsUpdate = true; shadowsDirty = true; invalidate(); }

    if (dirty > 0) {
      dirty--;
      updateCamera();
      updateHud();
      setPower(state.power);
      if (ambient) updateFx(now / 1000);
      if (shadowsDirty) { renderer.shadowMap.needsUpdate = true; shadowsDirty = false; }
      renderer.render(scene, camera);
      cssRenderer.render(scene, camera);

      // Adaptive quality: if the first animated frames are slow, render fewer pixels.
      if (!tuned && state.intro > 0.05) {
        frames++; frameTime += dt;
        if (frames === 45) {
          tuned = true;
          const avg = frameTime / frames;
          if (avg > 0.026 && dpr > 1) {
            dpr = 1;
            renderer.setPixelRatio(dpr);
            renderer.setSize(innerWidth, innerHeight);
          }
        }
      }
    }
    requestAnimationFrame(loop);
  };

  // ?debug: render a given scroll position synchronously (useful when frames are throttled).
  if (/[?&]debug(=|&|$)/.test(location.search)) {
    window.__desk = {
      state, camera, renderer, buildMs, updateFx, steam, fanBlades,
      render: (p) => {
        Object.assign(state, { intro: 1, power: 1, scroll: p, blur: 0 }); scrollGoal = p;
        loader.style.display = 'none'; body.classList.remove('is-loading', 'is-intro');
        $('#stage').classList.remove('is-blurred'); screenEl.classList.add('on'); screenEl.style.animation = 'none'; screenEl.style.opacity = '1';
        setPower(1); renderer.shadowMap.needsUpdate = true;
        updateCamera(); updateHud(); renderer.render(scene, camera); cssRenderer.render(scene, camera);
        return camera.position.toArray().map((v) => +v.toFixed(1));
      },
      look: (pos, tgt) => {
        window.__desk.freeze = true;
        camera.position.set(...pos); camera.lookAt(...tgt);
        renderer.render(scene, camera); cssRenderer.render(scene, camera);
        return 'ok';
      }
    };
  }

  // Warm up: compile shaders before revealing anything.
  updateCamera();
  setPower(0);
  renderer.compile(scene, camera);
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  shadowsDirty = false;
  setProgress(0.7, 'Booting the portfolio…');

  await Promise.all([iframeReady, document.fonts ? document.fonts.ready : Promise.resolve()]);
  setProgress(1, 'Ready.');
  const minShow = 1300 - (performance.now() - t0);
  if (minShow > 0) await new Promise((r) => setTimeout(r, minShow));
  await new Promise((r) => setTimeout(r, 380));

  /* ---------------- Entrance ---------------- */
  window.scrollTo(0, 0);
  body.classList.remove('is-loading');
  body.classList.add('is-intro');
  bindScroll();
  loader.classList.add('done');
  requestAnimationFrame(loop);

  const stage = $('#stage');
  const finishIntro = () => {
    state.intro = 1; state.blur = 0; state.power = 1;
    stage.classList.remove('is-blurred');
    stage.style.removeProperty('--blur');
    stage.style.removeProperty('--bright');
    body.classList.remove('is-intro');
    lastCaps = '';
    invalidate(3);
  };
  const powerOn = () => {
    screenEl.classList.add('on');
    try { iframe.contentWindow.postMessage({ type: 'desk:power' }, location.origin); } catch (e) { /* ignore */ }
  };

  if (reduceMotion || !gsap) {
    powerOn();
    finishIntro();
    return;
  }
  stage.classList.add('is-blurred');
  stage.style.setProperty('--blur', `${state.blur}px`);
  stage.style.setProperty('--bright', '0.4');
  const tl = gsap.timeline({ onUpdate: () => invalidate(), onComplete: finishIntro });
  tl.to(state, { intro: 1, duration: 3.2, ease: 'power3.inOut' }, 0)
    .to(state, {
      blur: 0, duration: 2.4, ease: 'power2.out',
      onUpdate: () => {
        stage.style.setProperty('--blur', `${state.blur.toFixed(2)}px`);
        stage.style.setProperty('--bright', (0.4 + (1 - state.blur / 10) * 0.6).toFixed(3));
      }
    }, 0.2)
    .call(powerOn, null, 1.7)
    .to(state, { power: 1, duration: 1.2, ease: 'power2.out' }, 1.8);
}
