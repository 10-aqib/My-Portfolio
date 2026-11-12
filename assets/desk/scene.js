/* ==========================================================
   Workspace scene — a realistic corner study:
   wood floor, taupe walls, window + curtain, oak desk on black
   loop legs, monitor riser, monitor, speakers, glass-side PC,
   mesh office chair, wall shelf with plants and a live clock,
   blue LED backlighting. Everything is procedural (no model
   downloads). Units: centimetres, desk-top surface at y = 0.
   ========================================================== */

export function buildWorkspace({ THREE, RoundedBoxGeometry, scene, renderer, low, onChange }) {
  const FLOOR = -74;
  const WALL_Z = -40;
  const WALL_X = 125;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  scene.background = new THREE.Color(0x0d0907);
  scene.fog = null;

  /* ---------------- Helpers ---------------- */
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tex = (w, h, draw, { repeat = [1, 1], srgb = true } = {}) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = Math.min(8, maxAniso);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const shadowy = (m, cast = true, receive = true) => { m.castShadow = cast; m.receiveShadow = receive; return m; };
  const rbox = (w, h, d, r, mat, seg = 3) => {
    const rr = Math.min(r, Math.min(w, h, d) / 2 - 0.01);
    return shadowy(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, rr), mat));
  };
  const add = (parent, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };

  /* ---------------- Textures ---------------- */
  const grain = (g, w, h, base, light, dark, lines, wobble) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < lines; i++) {
      const y = rand() * h;
      const amp = 1 + rand() * wobble;
      const f = 0.002 + rand() * 0.007;
      const ph = rand() * 9;
      g.strokeStyle = rand() < 0.55 ? `rgba(${dark},${0.05 + rand() * 0.22})` : `rgba(${light},${0.04 + rand() * 0.14})`;
      g.lineWidth = 0.6 + rand() * 2.4;
      g.beginPath();
      for (let x = 0; x <= w; x += 12) g.lineTo(x, y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.7 + 1) * amp * 0.3);
      g.stroke();
    }
    // A couple of knots
    for (let k = 0; k < 3; k++) {
      const x = rand() * w, y = rand() * h, r = 6 + rand() * 10;
      const gr = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
      gr.addColorStop(0, `rgba(${dark},.45)`); gr.addColorStop(1, `rgba(${dark},0)`);
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 2.6, r, 0, 0, Math.PI * 2); g.fill();
    }
  };
  const oakMap = tex(2048, 1024, (g, w, h) => {
    grain(g, w, h, '#a8642f', '214,150,92', '92,46,16', 900, 7);
    const v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(255,200,140,.05)'); v.addColorStop(1, 'rgba(60,25,5,.10)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  });
  const oakRough = tex(512, 256, (g, w, h) => {
    g.fillStyle = '#7d7d7d'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      g.strokeStyle = `rgba(${rand() < 0.5 ? '30,30,30' : '210,210,210'},${0.05 + rand() * 0.12})`;
      g.lineWidth = 0.5 + rand() * 1.4;
      const y = rand() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + rand() * 5 - 2.5, w * .7, y + rand() * 5 - 2.5, w, y); g.stroke();
    }
  }, { srgb: false });
  const darkOakMap = tex(1024, 512, (g, w, h) => grain(g, w, h, '#6b3f22', '160,104,60', '40,18,6', 500, 5));

  // Floor: random-length planks, 15 cm wide, mapped to a 120 cm square.
  const floorMap = tex(2048, 2048, (g, w, h) => {
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 600;
      while (x < w) {
        const len = 500 + rand() * 900;
        const tone = rand();
        const base = `rgb(${Math.round(104 + tone * 40)},${Math.round(50 + tone * 22)},${Math.round(28 + tone * 12)})`;
        g.save();
        g.beginPath(); g.rect(x, r * rh, len, rh); g.clip();
        g.fillStyle = base; g.fillRect(x, r * rh, len, rh);
        for (let i = 0; i < 70; i++) {
          const y = r * rh + rand() * rh;
          g.strokeStyle = rand() < 0.6 ? `rgba(40,14,4,${0.08 + rand() * 0.2})` : `rgba(190,120,70,${0.05 + rand() * 0.12})`;
          g.lineWidth = 0.6 + rand() * 2;
          g.beginPath();
          const ph = rand() * 9, f = 0.004 + rand() * 0.006, a = 1 + rand() * 4;
          for (let xx = x; xx <= x + len; xx += 14) g.lineTo(xx, y + Math.sin(xx * f + ph) * a);
          g.stroke();
        }
        g.restore();
        g.fillStyle = 'rgba(20,8,2,.85)';
        g.fillRect(x, r * rh, 3, rh);
        x += len;
      }
      g.fillStyle = 'rgba(20,8,2,.9)'; g.fillRect(0, r * rh, w, 3);
    }
  }, { repeat: [8, 8] });
  const floorRough = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) { g.fillStyle = '#d0d0d0'; g.fillRect(0, r * 64, w, 2); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${rand() < .5 ? '0,0,0' : '255,255,255'},${rand() * 0.08})`; g.fillRect(rand() * w, rand() * h, 40 + rand() * 120, 1 + rand() * 2); }
  }, { repeat: [8, 8], srgb: false });

  const noise = (base, spread, size, rep) => tex(size, size, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = base + (rand() - 0.5) * spread;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { repeat: [rep, rep], srgb: false });

  const glowTex = tex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(255,255,255,.45)');
    gr.addColorStop(0.7, 'rgba(255,255,255,.1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  glowTex.wrapS = glowTex.wrapT = THREE.ClampToEdgeWrapping;

  // Perforated mesh (white = solid) for the PC panels.
  const perfTex = tex(64, 64, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#000';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      g.beginPath(); g.arc(x * 16 + 8 + (y % 2) * 8, y * 16 + 8, 5.6, 0, Math.PI * 2); g.fill();
    }
  }, { repeat: [10, 18], srgb: false });

  // Chair mesh weave (white = strands).
  const weaveTex = tex(64, 64, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 3;
    for (let i = 0; i <= 64; i += 8) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
    }
  }, { repeat: [14, 16], srgb: false });

  /* ---------------- Materials ---------------- */
  const M = {
    oak: new THREE.MeshPhysicalMaterial({ map: oakMap, roughnessMap: oakRough, roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.45, envMapIntensity: 0.45 }),
    darkOak: new THREE.MeshStandardMaterial({ map: darkOakMap, roughness: 0.55, envMapIntensity: 0.4 }),
    floor: new THREE.MeshPhysicalMaterial({ map: floorMap, roughnessMap: floorRough, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.3, envMapIntensity: 0.35 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x5c4c45, roughness: 0.95, roughnessMap: noise(235, 30, 256, 10), envMapIntensity: 0.12 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xece8e1, roughness: 0.55 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.55, roughness: 0.42, envMapIntensity: 0.6 }),
    graphite: new THREE.MeshStandardMaterial({ color: 0x2a2b2f, metalness: 0.75, roughness: 0.35, envMapIntensity: 0.7 }),
    bezel: new THREE.MeshPhysicalMaterial({ color: 0x060607, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 0.7 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.55, envMapIntensity: 0.4 }),
    felt: new THREE.MeshStandardMaterial({ color: 0x1d1e21, roughness: 1, roughnessMap: noise(230, 40, 256, 6), envMapIntensity: 0.15 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0x262629, roughness: 0.95, roughnessMap: noise(220, 50, 128, 10), envMapIntensity: 0.15 }),
    grille: new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 1, roughnessMap: noise(220, 60, 128, 6) }),
    rug: new THREE.MeshStandardMaterial({ color: 0x2b3240, roughness: 1, map: noise(200, 90, 256, 6) }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xf1eee8, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    coffee: new THREE.MeshStandardMaterial({ color: 0x1c0d05, roughness: 0.12 }),
    cork: new THREE.MeshStandardMaterial({ color: 0xa87a4c, roughness: 0.95, roughnessMap: noise(220, 80, 64, 2) }),
    soil: new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x5d8f2e, roughness: 0.6, side: THREE.DoubleSide }),
    caseWhite: new THREE.MeshStandardMaterial({ color: 0xe8e8eb, roughness: 0.35, metalness: 0.15, envMapIntensity: 0.6 }),
    perf: new THREE.MeshStandardMaterial({ color: 0x17181b, metalness: 0.2, roughness: 0.7, alphaMap: perfTex, alphaTest: 0.5, side: THREE.DoubleSide }),
    pcGlass: new THREE.MeshPhysicalMaterial({ color: 0xbfd8ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.2, depthWrite: false }),
    board: new THREE.MeshStandardMaterial({ color: 0x1a1c21, roughness: 0.6, metalness: 0.3 }),
    phone: new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 0.85, roughness: 0.3 }),
    phoneGlass: new THREE.MeshPhysicalMaterial({ color: 0x0a0b0d, roughness: 0.08, clearcoat: 1 }),
    curtain: new THREE.MeshStandardMaterial({ color: 0xe6ddcf, roughness: 0.92, side: THREE.DoubleSide, emissive: 0xf3dcb8, emissiveIntensity: 0.28 }),
    mesh: new THREE.MeshStandardMaterial({ color: 0x232427, roughness: 0.8, alphaMap: weaveTex, alphaTest: 0.35, side: THREE.DoubleSide })
  };
  const glow = (color, opacity) => new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const ledMat = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const BLUE = 0x2f7dff;

  /* ---------------- Room ---------------- */
  const room = new THREE.Group(); scene.add(room);
  const floor = shadowy(new THREE.Mesh(new THREE.PlaneGeometry(960, 960), M.floor), false, true);
  floor.rotation.x = -Math.PI / 2; add(room, floor, -200, FLOOR, 200);

  const backWall = shadowy(new THREE.Mesh(new THREE.PlaneGeometry(820, 420), M.wall), false, true);
  add(room, backWall, WALL_X - 410, FLOOR + 210, WALL_Z);

  // Right wall with a window opening (z 20 → 115, y -32 → 150).
  const winZ0 = 20, winZ1 = 115, winY0 = -32, winY1 = 150;
  const rightPiece = (z0, z1, y0, y1) => {
    const m = shadowy(new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), M.wall), false, true);
    m.rotation.y = -Math.PI / 2;
    add(room, m, WALL_X, (y0 + y1) / 2, (z0 + z1) / 2);
  };
  rightPiece(WALL_Z, winZ0, FLOOR, FLOOR + 420);
  rightPiece(winZ1, 420, FLOOR, FLOOR + 420);
  rightPiece(winZ0, winZ1, FLOOR, winY0);
  rightPiece(winZ0, winZ1, winY1, FLOOR + 420);
  const daylight = new THREE.Mesh(new THREE.PlaneGeometry(winZ1 - winZ0, winY1 - winY0), new THREE.MeshBasicMaterial({ color: 0xfff1dc, toneMapped: false }));
  daylight.rotation.y = -Math.PI / 2; add(room, daylight, WALL_X + 6, (winY0 + winY1) / 2, (winZ0 + winZ1) / 2);
  [[winZ0, winY0, winZ0, winY1], [winZ1, winY0, winZ1, winY1]].forEach(([z, y0, , y1]) => add(room, rbox(8, y1 - y0 + 6, 4, 0.3, M.trim, 1), WALL_X + 2, (y0 + y1) / 2, z));
  [winY0, winY1].forEach((y) => add(room, rbox(8, 4, winZ1 - winZ0 + 4, 0.3, M.trim, 1), WALL_X + 2, y, (winZ0 + winZ1) / 2));
  const sill = add(room, rbox(14, 2.5, winZ1 - winZ0 + 12, 0.6, M.trim, 2), WALL_X - 3, winY0 - 1, (winZ0 + winZ1) / 2);
  sill.castShadow = false;

  // Baseboards
  add(room, rbox(820, 9, 1.6, 0.4, M.trim, 1), WALL_X - 410, FLOOR + 4.5, WALL_Z + 0.8);
  add(room, rbox(1.6, 9, 460, 0.4, M.trim, 1), WALL_X - 0.8, FLOOR + 4.5, WALL_Z + 230);

  // Curtain: soft folds hanging in front of the window, lit from behind.
  const curtW = 92, curtH = 248;
  const curtGeo = new THREE.PlaneGeometry(curtW, curtH, 120, 24);
  {
    const p = curtGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const flare = 1 + (0.5 - y / curtH) * 0.35;
      p.setZ(i, (Math.sin(x * 0.42) * 2.6 + Math.sin(x * 0.17 + 1.3) * 1.4) * flare);
    }
    curtGeo.computeVertexNormals();
  }
  const curtain = shadowy(new THREE.Mesh(curtGeo, M.curtain), false, true);
  curtain.rotation.y = -Math.PI / 2;
  add(room, curtain, WALL_X - 9, FLOOR + curtH / 2 + 1.5, 62);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 150, 16), M.graphite);
  rod.rotation.x = Math.PI / 2; add(room, rod, WALL_X - 9, FLOOR + curtH + 4, 62);

  // Warm sun patch on the floor.
  const sunTex = tex(256, 128, (g, w, h) => {
    g.filter = 'blur(10px)';
    g.fillStyle = '#fff'; g.fillRect(28, 26, w - 56, h - 52);
  });
  sunTex.wrapS = sunTex.wrapT = THREE.ClampToEdgeWrapping;
  const sunPatch = new THREE.Mesh(new THREE.PlaneGeometry(150, 52), new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffa54d, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sunPatch.rotation.set(-Math.PI / 2, 0, 0.32); add(room, sunPatch, 40, FLOOR + 0.25, 130);

  // Rug under the chair.
  const rug = add(room, rbox(170, 0.8, 88, 0.35, M.rug, 1), 18, FLOOR + 0.4, 58);
  rug.castShadow = false;

  /* ---------------- Desk ---------------- */
  const DESK_W = 184, DESK_D = 70, TOP_T = 5;
  const desk = new THREE.Group(); scene.add(desk);
  add(desk, rbox(DESK_W, TOP_T, DESK_D, 2.2, M.oak, 5), 0, -TOP_T / 2, 0);

  // Black loop legs: a rounded-rectangle ring with a square section.
  const loopGeo = (() => {
    const w = 64, h = -FLOOR - TOP_T, t = 5, r = 7;
    const rr = (s, x, y, W, H, R) => {
      s.moveTo(x + R, y); s.lineTo(x + W - R, y); s.quadraticCurveTo(x + W, y, x + W, y + R);
      s.lineTo(x + W, y + H - R); s.quadraticCurveTo(x + W, y + H, x + W - R, y + H);
      s.lineTo(x + R, y + H); s.quadraticCurveTo(x, y + H, x, y + H - R);
      s.lineTo(x, y + R); s.quadraticCurveTo(x, y, x + R, y);
    };
    const shape = new THREE.Shape(); rr(shape, -w / 2, 0, w, h, r);
    const hole = new THREE.Path(); rr(hole, -w / 2 + t, t, w - 2 * t, h - 2 * t, 2.5);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.5, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0, -t / 2);
    g.rotateY(Math.PI / 2);
    return g;
  })();
  [-80, 80].forEach((x) => add(desk, shadowy(new THREE.Mesh(loopGeo, M.steel)), x, FLOOR, 0));
  add(desk, rbox(156, 4, 4, 0.6, M.steel, 2), 0, -TOP_T - 2.5, -26);

  /* ---------------- Blue LED backlighting ---------------- */
  const leds = new THREE.Group(); scene.add(leds);
  const strip = (w, x, y, z) => add(leds, new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 0.8), ledMat(0x6aa8ff)), x, y, z);
  strip(170, 0, -TOP_T - 0.4, -32);
  const wallGlow = (x, y, w, h, o) => add(leds, new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow(BLUE, o)), x, y, WALL_Z + 0.3 + rand() * 0.2);
  wallGlow(0, -30, 280, 100, 1.0);
  wallGlow(0, 22, 250, 120, 0.85);
  wallGlow(0, 76, 170, 50, 0.85);
  wallGlow(78, 30, 90, 90, 0.45);
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(240, 70), glow(BLUE, 0.6));
  floorGlow.rotation.x = -Math.PI / 2; add(leds, floorGlow, 0, FLOOR + 0.3, -20);
  const deskGlow = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), glow(BLUE, 0.25));
  deskGlow.rotation.x = -Math.PI / 2; add(leds, deskGlow, 0, 0.05, -30);

  /* ---------------- Wall shelf, plants, clock ---------------- */
  const SHELF_Y = 92;
  add(scene, rbox(112, 3.6, 21, 1.2, M.oak, 4), 0, SHELF_Y, WALL_Z + 10.5);
  strip(104, 0, SHELF_Y - 2.1, WALL_Z + 3);

  const plant = (x) => {
    const g = new THREE.Group(); g.position.set(x, SHELF_Y + 1.8, WALL_Z + 11); scene.add(g);
    const pts = [new THREE.Vector2(0.01, 0), new THREE.Vector2(3.2, 0), new THREE.Vector2(4.4, 1.2), new THREE.Vector2(5.2, 4), new THREE.Vector2(5.4, 7.6), new THREE.Vector2(4.9, 7.8), new THREE.Vector2(4.6, 6.6), new THREE.Vector2(0.01, 6.6)];
    g.add(shadowy(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), M.ceramic)));
    add(g, new THREE.Mesh(new THREE.CircleGeometry(4.7, 24), M.soil), 0, 6.8, 0).rotation.x = -Math.PI / 2;
    const leafGeo = new THREE.SphereGeometry(1, 16, 8);
    leafGeo.scale(1.1, 0.16, 3.4); leafGeo.translate(0, 0, 3.2);
    for (let i = 0; i < 9; i++) {
      const lf = shadowy(new THREE.Mesh(leafGeo, M.leaf));
      lf.position.set(0, 7.4 + rand() * 1.2, 0);
      lf.rotation.set(-0.5 - rand() * 0.55, (i / 9) * Math.PI * 2 + rand() * 0.4, 0, 'YXZ');
      const s = 0.75 + rand() * 0.35; lf.scale.setScalar(s);
      g.add(lf);
    }
  };
  plant(-44); plant(44);

  // Digital clock with a canvas face, redrawn from the real time.
  const clockCanvas = document.createElement('canvas');
  clockCanvas.width = 512; clockCanvas.height = 192;
  const cg = clockCanvas.getContext('2d');
  const clockTex = new THREE.CanvasTexture(clockCanvas);
  clockTex.colorSpace = THREE.SRGBColorSpace;
  clockTex.anisotropy = Math.min(8, maxAniso);
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  const drawDigit = (d, x, y, w, h, t) => {
    const on = SEG[d] || '';
    const segs = {
      a: [x + t * 0.6, y, w - t * 1.2, t], d: [x + t * 0.6, y + h - t, w - t * 1.2, t], g: [x + t * 0.6, y + h / 2 - t / 2, w - t * 1.2, t],
      f: [x, y + t * 0.6, t, h / 2 - t * 0.9], b: [x + w - t, y + t * 0.6, t, h / 2 - t * 0.9],
      e: [x, y + h / 2 + t * 0.3, t, h / 2 - t * 0.9], c: [x + w - t, y + h / 2 + t * 0.3, t, h / 2 - t * 0.9]
    };
    Object.entries(segs).forEach(([k, [sx, sy, sw, sh]]) => {
      const lit = on.includes(k);
      cg.fillStyle = lit ? '#f4f7ff' : 'rgba(255,255,255,0.05)';
      cg.shadowColor = lit ? 'rgba(200,220,255,0.9)' : 'transparent';
      cg.shadowBlur = lit ? 14 : 0;
      cg.beginPath(); cg.roundRect(sx, sy, sw, sh, t / 2); cg.fill();
    });
  };
  let lastClock = '';
  const drawClock = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const colon = now.getSeconds() % 2 === 0;
    const sig = hh + mm + colon;
    if (sig === lastClock) return false;
    lastClock = sig;
    cg.shadowBlur = 0;
    cg.fillStyle = '#050506'; cg.fillRect(0, 0, 512, 192);
    const w = 82, h = 138, t = 15, y = 27;
    [hh[0], hh[1]].forEach((d, i) => drawDigit(+d, 40 + i * 104, y, w, h, t));
    [mm[0], mm[1]].forEach((d, i) => drawDigit(+d, 286 + i * 104, y, w, h, t));
    cg.fillStyle = colon ? '#f4f7ff' : 'rgba(255,255,255,0.06)';
    cg.shadowColor = colon ? 'rgba(200,220,255,0.9)' : 'transparent'; cg.shadowBlur = colon ? 12 : 0;
    cg.beginPath(); cg.roundRect(245, 64, 18, 18, 4); cg.fill();
    cg.beginPath(); cg.roundRect(245, 112, 18, 18, 4); cg.fill();
    clockTex.needsUpdate = true;
    return true;
  };
  drawClock();
  const clock = new THREE.Group(); clock.position.set(0, SHELF_Y + 1.8, WALL_Z + 11); clock.rotation.y = 0.05; scene.add(clock);
  add(clock, rbox(23, 10, 6, 1.4, M.plastic, 3), 0, 5, 0);
  add(clock, new THREE.Mesh(new THREE.PlaneGeometry(20.5, 7.7), new THREE.MeshBasicMaterial({ map: clockTex, toneMapped: false })), 0, 5, 3.02);
  setInterval(() => { if (drawClock()) onChange(); }, 1000);

  /* ---------------- Monitor riser ---------------- */
  const RISER_Y = 11.5;
  add(scene, rbox(100, 2.6, 26, 1, M.oak, 4), 0, RISER_Y - 1.3, -21);
  [-44, 44].forEach((x) => {
    add(scene, rbox(2.4, RISER_Y - 2.6, 2.4, 0.4, M.steel, 1), x, (RISER_Y - 2.6) / 2, -11);
    add(scene, rbox(2.4, RISER_Y - 2.6, 2.4, 0.4, M.steel, 1), x, (RISER_Y - 2.6) / 2, -31);
    add(scene, rbox(2.4, 1.6, 22, 0.4, M.steel, 1), x, RISER_Y - 3.4, -21);
  });
  strip(92, 0, RISER_Y - 2.9, -33);

  /* ---------------- Monitor ---------------- */
  const SCREEN_W = 72, SCREEN_H = 40.5;
  const MON_Z = -22;
  const SCREEN_CY = 41;
  const monitor = new THREE.Group(); monitor.position.set(0, 0, MON_Z); scene.add(monitor);

  // V-shaped stand
  add(monitor, rbox(11, 1.2, 9, 0.5, M.graphite, 2), 0, RISER_Y + 0.6, -3.5);
  [-1, 1].forEach((s) => {
    const foot = add(monitor, rbox(26, 0.9, 3.4, 0.4, M.graphite, 2), s * 11.5, RISER_Y + 0.45, 1);
    foot.rotation.y = -s * 0.41;
  });
  const neck = add(monitor, rbox(7, SCREEN_CY - 4 - RISER_Y, 2.4, 0.9, M.graphite, 3), 0, (SCREEN_CY - 4 + RISER_Y) / 2, -4.6);
  neck.rotation.x = -0.05;
  add(monitor, rbox(14, 6, 3, 1.2, M.graphite, 3), 0, SCREEN_CY - 2, -3.6);

  const padTop = 0.9, padBot = 1.9, padSide = 0.9;
  const panelW = SCREEN_W + padSide * 2, panelH = SCREEN_H + padTop + padBot;
  const panelCY = SCREEN_CY + (padTop - padBot) / 2;
  const panel = add(monitor, rbox(panelW, panelH, 1.1, 0.6, M.bezel, 4), 0, panelCY, 0);
  add(monitor, rbox(panelW - 1.4, panelH - 1.4, 1.8, 0.8, M.plastic, 3), 0, panelCY, -1.2);
  add(monitor, rbox(44, 24, 2.6, 1.6, M.plastic, 3), 0, panelCY + 1, -2.5);
  const led = add(monitor, new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0 })), padSide + SCREEN_W / 2 - 3, SCREEN_CY - SCREEN_H / 2 - padBot / 2, 0.57);

  // Light bar
  const barY = panelCY + panelH / 2 + 1.25;
  const bar = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 48, 24), M.graphite));
  bar.rotation.z = Math.PI / 2; add(monitor, bar, 0, barY, 1.6);
  const barGlow = add(monitor, new THREE.Mesh(new THREE.PlaneGeometry(44, 0.6), ledMat(0xfff1dc)), 0, barY - 0.95, 2.1);
  barGlow.rotation.x = Math.PI / 2 + 0.5;
  add(monitor, rbox(5, 3.4, 4.4, 0.4, M.graphite, 2), 0, barY - 0.7, -0.3);

  // Screen hole: writes transparent pixels so the CSS3D iframe shows through.
  const SCREEN_Z = 0.56;
  const hole = add(monitor, new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
    new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: false, blending: THREE.NoBlending, toneMapped: false })
  ), 0, SCREEN_CY, SCREEN_Z);

  const glassMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uCam: { value: new THREE.Vector3() }, uFade: { value: 1 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vUv; varying vec3 vW; uniform vec3 uCam; uniform float uFade;
      void main(){
        vec3 v = normalize(vW - uCam);
        float d = vUv.x * 0.62 + vUv.y * 0.78 - 0.95 + v.x * 0.9 - v.y * 0.5;
        float band = exp(-d * d * 22.0) * 0.06 + exp(-(d + 0.32) * (d + 0.32) * 60.0) * 0.03;
        float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float edge = (1.0 - smoothstep(0.0, 0.02, e)) * 0.04;
        gl_FragColor = vec4(1.0, 1.0, 1.0, (band + edge) * uFade);
      }`
  });
  const glass = add(monitor, new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), glassMat), 0, SCREEN_CY, SCREEN_Z + 0.04);
  glass.renderOrder = 2;

  /* ---------------- Speakers ---------------- */
  const speaker = (x, rotY) => {
    const g = new THREE.Group(); g.position.set(x, 0, -20); g.rotation.y = rotY; scene.add(g);
    add(g, rbox(14, 22, 15, 1.2, M.darkOak, 3), 0, 11, 0);
    add(g, rbox(12.4, 20.4, 0.6, 0.25, M.grille, 2), 0, 11, 7.4);
  };
  speaker(-64, 0.22);
  speaker(56, -0.2);

  /* ---------------- Mat, keyboard, mouse, phone, mug ---------------- */
  const mat = add(scene, rbox(84, 0.3, 32, 0.15, M.felt, 2), -6, 0.15, 11);
  mat.castShadow = false;

  const U = 1.9;
  const kb = new THREE.Group(); kb.position.set(4, 0.3, 11); kb.rotation.y = -0.02; scene.add(kb);
  add(kb, rbox(16 * U + 1.8, 1.6, 6 * U + 1.6, 0.6, M.plastic, 3), 0, 0.8, 0);
  const rows = [
    [['Escape', 1, 'acc'], ...['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((k) => [k, 1, 'mod']), ['PrintScreen', 1, 'mod'], ['Delete', 1, 'mod'], ['Home', 1, 'mod']],
    [['Backquote', 1], ...'1234567890'.split('').map((d) => [`Digit${d}`, 1]), ['Minus', 1], ['Equal', 1], ['Backspace', 2, 'mod'], ['PageUp', 1, 'mod']],
    [['Tab', 1.5, 'mod'], ...'QWERTYUIOP'.split('').map((c) => [`Key${c}`, 1]), ['BracketLeft', 1], ['BracketRight', 1], ['Backslash', 1.5, 'mod'], ['PageDown', 1, 'mod']],
    [['CapsLock', 1.75, 'mod'], ...'ASDFGHJKL'.split('').map((c) => [`Key${c}`, 1]), ['Semicolon', 1], ['Quote', 1], ['Enter', 2.25, 'acc'], ['End', 1, 'mod']],
    [['ShiftLeft', 2.25, 'mod'], ...'ZXCVBNM'.split('').map((c) => [`Key${c}`, 1]), ['Comma', 1], ['Period', 1], ['Slash', 1], ['ShiftRight', 1.75, 'mod'], ['ArrowUp', 1, 'mod'], ['Insert', 1, 'mod']],
    [['ControlLeft', 1.25, 'mod'], ['MetaLeft', 1.25, 'mod'], ['AltLeft', 1.25, 'mod'], ['Space', 6.25, 'acc'], ['AltRight', 1, 'mod'], ['Fn', 1, 'mod'], ['ControlRight', 1, 'mod'], ['ArrowLeft', 1, 'mod'], ['ArrowDown', 1, 'mod'], ['ArrowRight', 1, 'mod']]
  ];
  const keyList = [];
  rows.forEach((row, r) => {
    let x = -8 * U;
    row.forEach(([code, w, kind]) => { keyList.push({ code, w, kind, x: x + (w * U) / 2, z: (r - 2.5) * U }); x += w * U; });
  });
  const keyMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, envMapIntensity: 0.5 });
  const keys = shadowy(new THREE.InstancedMesh(new RoundedBoxGeometry(1, 0.85, 1, 2, 0.16), keyMat, keyList.length));
  const keyIndex = new Map();
  const col = new THREE.Color();
  const KC = { base: 0xe9e6de, mod: 0x9b9da2, acc: 0xe0702b };
  keyList.forEach((k, i) => { keyIndex.set(k.code, i); keys.setColorAt(i, col.setHex(KC[k.kind] || KC.base)); });
  const keyPress = new Float32Array(keyList.length);
  const dummy = new THREE.Object3D();
  const layoutKey = (i) => {
    const k = keyList[i];
    dummy.position.set(k.x, 1.95 - keyPress[i] * 0.4, k.z);
    dummy.scale.set(k.w * U - 0.28, 1, U - 0.28);
    dummy.updateMatrix();
    keys.setMatrixAt(i, dummy.matrix);
  };
  keyList.forEach((_, i) => layoutKey(i));
  kb.add(keys);

  const MOUSE_HOME = new THREE.Vector3(30, 0.3, 13);
  const mouseGroup = new THREE.Group(); mouseGroup.position.copy(MOUSE_HOME); scene.add(mouseGroup);
  const mouseGeo = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  {
    const p = mouseGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const front = Math.max(0, z);
      y *= 1 - front * 0.32; x *= 1 - front * 0.12;
      p.setXYZ(i, x * 3.1, y * 3.3, z * 5.7);
    }
    mouseGeo.computeVertexNormals();
  }
  mouseGroup.add(shadowy(new THREE.Mesh(mouseGeo, new THREE.MeshPhysicalMaterial({ color: 0x1b1c1f, roughness: 0.4, clearcoat: 0.4 }))));
  const wheel = add(mouseGroup, new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 20), M.graphite), 0, 2.62, 1.9);
  wheel.rotation.z = Math.PI / 2;

  const phone = new THREE.Group(); phone.position.set(-38, 0.3, 12); phone.rotation.y = 0.35; scene.add(phone);
  add(phone, rbox(7.5, 0.8, 15.4, 0.7, M.phone, 3), 0, 0.4, 0);
  add(phone, rbox(7.1, 0.1, 15, 0.6, M.phoneGlass, 2), 0, 0.82, 0);
  const cam = add(phone, rbox(3.4, 0.3, 3.4, 0.6, M.phone, 2), 1.6, 0.95, -5.2);
  cam.castShadow = false;

  const mug = new THREE.Group(); mug.position.set(-58, 0, 6); mug.rotation.y = 0.9; scene.add(mug);
  add(mug, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.5, 40), M.cork)), 0, 0.25, 0);
  const mugPts = [new THREE.Vector2(0.01, 0.5), new THREE.Vector2(3.9, 0.5)];
  for (let i = 0; i <= 10; i++) mugPts.push(new THREE.Vector2(4.1, 0.5 + i * 0.95));
  mugPts.push(new THREE.Vector2(3.75, 10.2), new THREE.Vector2(3.7, 1.6), new THREE.Vector2(0.01, 1.6));
  mug.add(shadowy(new THREE.Mesh(new THREE.LatheGeometry(mugPts, 48), M.ceramic)));
  const handle = add(mug, shadowy(new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.5, 16, 32, Math.PI * 1.15), M.ceramic)), 4.1, 5.6, 0);
  handle.rotation.z = -Math.PI * 0.575;
  add(mug, new THREE.Mesh(new THREE.CircleGeometry(3.7, 40), M.coffee), 0, 9.1, 0).rotation.x = -Math.PI / 2;

  /* ---------------- Gaming PC ---------------- */
  const pc = new THREE.Group(); pc.position.set(76, 0, -14); pc.rotation.y = -0.06; scene.add(pc);
  const PW = 22, PH = 47, PD = 42;
  const fanBlades = tex(256, 256, (g, w, h) => {
    g.translate(w / 2, h / 2);
    for (let i = 0; i < 9; i++) {
      g.rotate((Math.PI * 2) / 9);
      g.fillStyle = 'rgba(160,205,255,0.55)';
      g.beginPath(); g.moveTo(14, -6); g.quadraticCurveTo(80, -40, 118, -8); g.quadraticCurveTo(80, 8, 14, 8); g.fill();
    }
  });
  fanBlades.wrapS = fanBlades.wrapT = THREE.ClampToEdgeWrapping;
  const bladeMat = new THREE.MeshBasicMaterial({ map: fanBlades, transparent: true, depthWrite: false, toneMapped: false });
  const ringMat = ledMat(0x5cb6ff);
  const fan = (parent, x, y, z, r, rotX = 0, rotY = 0) => {
    const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.set(rotX, rotY, 0); parent.add(f);
    add(f, new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 10, 48), ringMat));
    add(f, new THREE.Mesh(new THREE.CircleGeometry(r - 0.5, 40), bladeMat), 0, 0, 0.05).rotation.z = rand() * 6;
    add(f, new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), M.board), 0, 0, 0.1);
    add(f, new THREE.Mesh(new THREE.PlaneGeometry(r * 4, r * 4), glow(BLUE, 0.35)), 0, 0, -0.2);
    return f;
  };
  // Shell
  add(pc, rbox(PW, 2, PD, 0.6, M.caseWhite, 2), 0, 1, 0);
  add(pc, rbox(0.9, PH, PD, 0.4, M.caseWhite, 2), PW / 2 - 0.45, PH / 2, 0);
  add(pc, rbox(PW, PH, 0.9, 0.4, M.caseWhite, 2), 0, PH / 2, -PD / 2 + 0.45);
  [[-PW / 2 + 0.6, PD / 2 - 0.6], [-PW / 2 + 0.6, -PD / 2 + 0.6]].forEach(([x, z]) => add(pc, rbox(1.4, PH, 1.4, 0.4, M.caseWhite, 2), x, PH / 2, z));
  add(pc, rbox(1.4, 1.4, PD, 0.4, M.caseWhite, 2), -PW / 2 + 0.6, PH - 0.7, 0);
  // Front: white frame + perforated mesh with three intake fans behind it
  add(pc, rbox(PW, 3, 1.4, 0.4, M.caseWhite, 2), 0, PH - 1.5, PD / 2 - 0.7);
  add(pc, rbox(PW, 3, 1.4, 0.4, M.caseWhite, 2), 0, 3.5, PD / 2 - 0.7);
  [-1, 1].forEach((s) => add(pc, rbox(2.2, PH, 1.4, 0.4, M.caseWhite, 2), s * (PW / 2 - 1.1), PH / 2, PD / 2 - 0.7));
  add(pc, new THREE.Mesh(new THREE.PlaneGeometry(PW - 4.2, PH - 6), M.pcGlass), 0, PH / 2 + 0.75, PD / 2 - 0.2).renderOrder = 3;
  [10.5, 23.5, 36.5].forEach((y) => fan(pc, 0, y, PD / 2 - 2.6, 6));
  // Top: mesh with two exhaust fans
  const topMesh = add(pc, new THREE.Mesh(new THREE.PlaneGeometry(PW - 1.6, PD - 1.6), M.perf), 0, PH - 0.1, 0);
  topMesh.rotation.x = -Math.PI / 2;
  [-9, 9].forEach((z) => fan(pc, -1, PH - 2.4, z, 6, -Math.PI / 2));
  // Interior
  add(pc, rbox(0.6, 32, 34, 0.2, M.board, 1), PW / 2 - 1.4, 28, -2);
  const gpu = add(pc, rbox(9.5, 4.6, 30, 0.6, M.graphite, 2), 4.5, 18, 1);
  add(gpu, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 26), ledMat(0x7dff6a)), -4.85, 1.4, 0);
  add(gpu, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 26), ledMat(0x7dff6a)), -4.85, -1.4, 0);
  add(pc, rbox(7, 9, 9, 0.8, M.graphite, 2), 6, 33, -6);
  fan(pc, 2.4, 33, -6, 3.4, 0, -Math.PI / 2);
  for (let i = 0; i < 4; i++) add(pc, rbox(0.7, 5, 11, 0.2, M.board, 1), 8.6 - i * 1.1 + 2.5, 34, 4.5).material = M.board;
  add(pc, rbox(PW - 2, 9, PD - 2.5, 0.6, M.caseWhite, 2), 0, 6.5, 0.3);
  add(pc, new THREE.Mesh(new THREE.PlaneGeometry(PD - 4, PH - 12), new THREE.MeshBasicMaterial({ color: 0x2a6cff, toneMapped: false, transparent: true, opacity: 0.85 })), PW / 2 - 1.75, 28, -2).rotation.y = -Math.PI / 2;
  // Tempered glass side
  const glassSide = add(pc, new THREE.Mesh(new THREE.PlaneGeometry(PD - 1.6, PH - 2.6), M.pcGlass), -PW / 2 + 0.2, PH / 2 + 0.6, 0);
  glassSide.rotation.y = -Math.PI / 2;
  glassSide.renderOrder = 3;
  const pcLight = new THREE.PointLight(0x3c8dff, low ? 0 : 2600, 90, 2);
  add(pc, pcLight, -2, 26, 4);

  /* ---------------- Office chair ---------------- */
  const chair = new THREE.Group(); chair.position.set(34, FLOOR, 62); chair.rotation.y = -0.45; scene.add(chair);
  // Five-star base with casters
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const arm = add(chair, rbox(30, 3, 4.6, 1, M.plastic, 2), Math.cos(a) * 15, 7.5, Math.sin(a) * 15);
    arm.rotation.y = -a; arm.rotation.z = 0;
    const cx = Math.cos(a) * 29.5, cz = Math.sin(a) * 29.5;
    add(chair, rbox(2.4, 3.4, 2.4, 0.5, M.plastic, 1), cx, 5.2, cz);
    const wh = add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 2.4, 20), M.plastic)), cx + 1.2 * Math.cos(a + 1.5), 2.6, cz + 1.2 * Math.sin(a + 1.5));
    wh.rotation.set(0, -a, Math.PI / 2);
  }
  add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 5, 24), M.plastic)), 0, 8, 0);
  add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 11, 20), M.plastic)), 0, 15, 0);
  add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 20, 16), M.graphite)), 0, 28, 0);
  add(chair, rbox(20, 4, 22, 1, M.plastic, 2), 0, 40, 0);
  // Seat
  add(chair, rbox(52, 8, 50, 3.6, M.fabric, 4), 0, 46, -2);
  // Armrests
  [-1, 1].forEach((s) => {
    add(chair, rbox(9, 2.6, 5, 0.8, M.plastic, 2), s * 23, 42, 4);
    add(chair, rbox(3.6, 22, 5, 1, M.plastic, 2), s * 28, 54, 4);
    add(chair, rbox(7.5, 3, 27, 1.3, M.fabric, 3), s * 28, 66, 1);
  });
  // Spine
  const spine = add(chair, rbox(6, 44, 3.2, 1.2, M.plastic, 2), 0, 62, 27);
  spine.rotation.x = 0.16;
  // Backrest: curved mesh in a rounded frame
  const back = new THREE.Group(); back.position.set(0, 82, 28); back.rotation.x = 0.12; chair.add(back);
  const BW = 48, BH = 56, bend = (x) => -0.011 * x * x;
  const backGeo = new THREE.PlaneGeometry(BW - 2, BH - 2, 24, 12);
  {
    const p = backGeo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, bend(p.getX(i)) + Math.sin((p.getY(i) / BH) * Math.PI) * -1.2);
    backGeo.computeVertexNormals();
  }
  back.add(shadowy(new THREE.Mesh(backGeo, M.mesh)));
  const framePts = [];
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const x = (BW / 2) * Math.sign(c) * Math.pow(Math.abs(c), 0.28);
    const y = (BH / 2) * Math.sign(s) * Math.pow(Math.abs(s), 0.28);
    framePts.push(new THREE.Vector3(x, y, bend(x)));
  }
  back.add(shadowy(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(framePts, true), 160, 1.5, 8, true), M.plastic)));
  const lumbarPts = [];
  for (let i = 0; i <= 12; i++) { const x = -20 + (i / 12) * 40; lumbarPts.push(new THREE.Vector3(x, -12 + Math.sin((i / 12) * Math.PI) * 1.5, bend(x) + 1.6)); }
  back.add(shadowy(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lumbarPts), 40, 2.2, 10), M.plastic)));
  // Headrest
  add(chair, rbox(3, 10, 2.2, 0.6, M.plastic, 1), 0, 112, 31);
  const head = add(chair, rbox(30, 12, 6, 2.6, M.fabric, 3), 0, 119, 31);
  head.rotation.x = 0.1;

  /* ---------------- Lights ---------------- */
  scene.add(new THREE.HemisphereLight(0xffe1c6, 0x3b2418, 0.45));
  const sun = new THREE.DirectionalLight(0xffb36b, 1.7);
  sun.position.set(520, 170, 70); sun.target.position.set(0, -30, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 170, bottom: -170, near: 150, far: 900 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06;
  scene.add(sun, sun.target);
  const fill = new THREE.SpotLight(0xffd6b0, 0.9, 0, 0.75, 1, 0);
  fill.position.set(-140, 260, 220); fill.target.position.set(10, 0, -10);
  scene.add(fill, fill.target);
  if (!low) {
    const blueA = new THREE.RectAreaLight(BLUE, 24, 150, 3);
    blueA.position.set(0, -6, -33); blueA.lookAt(0, -50, WALL_Z); scene.add(blueA);
    const blueB = new THREE.RectAreaLight(BLUE, 20, 90, 3);
    blueB.position.set(0, RISER_Y - 3, -33); blueB.lookAt(0, 40, WALL_Z); scene.add(blueB);
    const blueC = new THREE.RectAreaLight(BLUE, 18, 100, 3);
    blueC.position.set(0, SHELF_Y - 2.5, -33); blueC.lookAt(0, 50, WALL_Z); scene.add(blueC);
  }
  const screenLight = new THREE.RectAreaLight(0xd8e4ff, 0, SCREEN_W, SCREEN_H);
  screenLight.position.set(0, SCREEN_CY, MON_Z + SCREEN_Z + 0.5);
  screenLight.lookAt(0, SCREEN_CY - 6, 200);
  scene.add(screenLight);
  const barLight = new THREE.RectAreaLight(0xffe6c8, 0, 44, 1.2);
  barLight.position.set(0, barY - 1, MON_Z + 2.2);
  barLight.lookAt(0, 0, 18);
  scene.add(barLight);

  return {
    SCREEN_W, SCREEN_H, SCREEN_CY, SCREEN_Z, MON_Z,
    monitor, hole, panel, glassMat, led,
    keys, keyIndex, keyPress, layoutKey,
    mouseGroup, MOUSE_HOME,
    screenLight, barLight
  };
}
