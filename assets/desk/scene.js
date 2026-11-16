/* ==========================================================
   Workspace scene — a dark, warm, photographic home office.

   Walnut desk on black steel loop legs, hardwood floor, painted
   plaster wall, floor-to-ceiling linen curtains, a glass-sided
   gaming PC with RGB fans, a padded ergonomic chair, a desk lamp,
   a floating shelf with LED strip, plants and a live clock.

   Everything is procedural (no model downloads): PBR textures are
   generated once on a canvas (albedo + roughness + bump), lighting
   is a mix of area lights, a window light and a desk-lamp spot, and
   soft contact shadows stand in for ambient occlusion (the monitor
   needs an alpha canvas, so no post-processing pass is used).

   Units: centimetres, desk-top surface at y = 0.
   ========================================================== */

export function buildWorkspace({ THREE, RoundedBoxGeometry, scene, renderer, low, onChange }) {
  const FLOOR = -74;
  const WALL_Z = -40;
  const WALL_X = 125;
  const ANISO = Math.min(low ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
  const TAU = Math.PI * 2;

  scene.background = new THREE.Color(0x060403);
  scene.fog = null;
  renderer.toneMappingExposure = 1.15;

  /* ================= Helpers ================= */
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const finish = (t, { repeat = [1, 1], srgb = true, wrap = true } = {}) => {
    if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = ANISO;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const tex = (w, h, draw, opts) => { const c = mkCanvas(w, h); draw(c.getContext('2d'), w, h); return finish(new THREE.CanvasTexture(c), opts); };
  // Per-pixel texture: fn(x, y, out) fills out = [r, g, b, a] (0-255).
  const pixTex = (w, h, fn, opts) => {
    const c = mkCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data, o = [0, 0, 0, 255];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      o[3] = 255; fn(x, y, o);
      const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3];
    }
    g.putImageData(im, 0, 0);
    return finish(new THREE.CanvasTexture(c), opts);
  };
  const cloneTex = (t, repeat) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(repeat[0], repeat[1]); return c; };

  const shadowy = (m, cast = true, receive = true) => { m.castShadow = cast; m.receiveShadow = receive; return m; };
  const rbox = (w, h, d, r, mat, seg = 3) => {
    const rr = Math.min(r, Math.min(w, h, d) / 2 - 0.01);
    return shadowy(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, rr), mat));
  };
  const add = (parent, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
  const planeUV = (geo, w, h, tile) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile); return geo; };

  // Cylinder between two points (arms, stalks, cables).
  const UP = new THREE.Vector3(0, 1, 0);
  const tube = (a, b, r, mat, seg = 14) => {
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    const m = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat));
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  };

  /* ================= Noise ================= */
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s | 0, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  // Value noise; optional integer lattice period (px, py) makes it tileable.
  const vn = (x, y, s = 0, px = 0, py = 0) => {
    let xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    let x1 = xi + 1, y1 = yi + 1;
    if (px) { xi = ((xi % px) + px) % px; x1 = ((x1 % px) + px) % px; }
    if (py) { yi = ((yi % py) + py) % py; y1 = ((y1 % py) + py) % py; }
    const a = hash(xi, yi, s), b = hash(x1, yi, s), c = hash(xi, y1, s), d = hash(x1, y1, s);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, oct, s = 0, px = 0, py = 0) => {
    let t = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { t += a * vn(x * f, y * f, s + i * 17, px * f, py * f); n += a; f *= 2; a *= 0.5; }
    return t / n;
  };

  /* ================= Wood (albedo + roughness + bump) =================
     Flat-sawn grain: growth rings from a warped distance field, long
     fibre streaks, open pores and slow tone drift. */
  const WALNUT = { dark: [30, 17, 10], mid: [86, 51, 28], light: [146, 94, 54] };
  const makeWood = ({ w, h, seed: sd = 1, rings = 8, warp = 3, pal = WALNUT }) => {
    const mapC = mkCanvas(w, h), roughC = mkCanvas(w, h), bumpC = mkCanvas(w, h);
    const mg = mapC.getContext('2d'), rg = roughC.getContext('2d'), bg = bumpC.getContext('2d');
    const mi = mg.createImageData(w, h), ri = rg.createImageData(w, h), bi = bg.createImageData(w, h);
    const S = 8, cw = Math.ceil(w / S) + 2, ch = Math.ceil(h / S) + 2;
    const fld = new Float32Array(cw * ch), tn = new Float32Array(cw * ch);
    for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
      const nx = (cx * S) / w, ny = (cy * S) / h;
      fld[cy * cw + cx] = ny * rings + (fbm(nx * 2.4, ny * 2.2, 3, sd) - 0.5) * warp * 2 + (fbm(nx * 0.8 + 9, ny * 1.4, 2, sd + 3) - 0.5) * warp * 1.6;
      tn[cy * cw + cx] = fbm(nx * 1.6 + 3, ny * 1.2, 3, sd + 8);
    }
    const samp = (arr, x, y) => {
      const fx = x / S, fy = y / S, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, i = iy * cw + ix;
      return arr[i] * (1 - tx) * (1 - ty) + arr[i + 1] * tx * (1 - ty) + arr[i + cw] * (1 - tx) * ty + arr[i + cw + 1] * tx * ty;
    };
    const md = mi.data, rd = ri.data, bd = bi.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dd = samp(fld, x, y), f = dd - Math.floor(dd);
      const rr = Math.pow(f < 0.78 ? f / 0.78 : (1 - f) / 0.22, 0.8);
      const st1 = vn(x * 0.01, y * 0.55, sd + 21), st2 = vn(x * 0.045, y * 1.7, sd + 22);
      const pr = vn(x * 0.11, y * 0.85, sd + 23);
      const pore = pr > 0.8 ? Math.min(1, (pr - 0.8) / 0.16) : 0;
      const tone = samp(tn, x, y);
      const t = clamp(0.12 + rr * 0.42 + (st1 - 0.5) * 0.34 + (st2 - 0.5) * 0.16 + (tone - 0.5) * 0.35, 0, 1);
      const c = t < 0.5 ? mix3(pal.dark, pal.mid, t * 2) : mix3(pal.mid, pal.light, (t - 0.5) * 2);
      const shift = tone - 0.5, pk = 1 - pore * 0.45, i = (y * w + x) * 4;
      md[i] = c[0] * (1 + shift * 0.22) * pk; md[i + 1] = c[1] * pk; md[i + 2] = c[2] * (1 - shift * 0.3) * pk; md[i + 3] = 255;
      const rv = (0.46 + st2 * 0.1 + pore * 0.3 + (1 - rr) * 0.04) * 255;
      rd[i] = rd[i + 1] = rd[i + 2] = rv; rd[i + 3] = 255;
      const bv = clamp(0.55 + (rr - 0.5) * 0.16 + (st1 - 0.5) * 0.3 + (st2 - 0.5) * 0.15 - pore * 0.55, 0, 1) * 255;
      bd[i] = bd[i + 1] = bd[i + 2] = bv; bd[i + 3] = 255;
    }
    mg.putImageData(mi, 0, 0); rg.putImageData(ri, 0, 0); bg.putImageData(bi, 0, 0);
    return {
      map: finish(new THREE.CanvasTexture(mapC)),
      rough: finish(new THREE.CanvasTexture(roughC), { srgb: false }),
      bump: finish(new THREE.CanvasTexture(bumpC), { srgb: false })
    };
  };
  const deskWood = makeWood({ w: 1536, h: 576, seed: 3, rings: 9 });
  const shelfWood = makeWood({ w: 1024, h: 256, seed: 11, rings: 5 });
  const cabWood = makeWood({ w: 384, h: 384, seed: 17, rings: 4 });

  /* ================= Hardwood floor (tileable, 120 cm) ================= */
  const floorSet = (() => {
    const w = 1024, h = 1024, rows = 8, rh = h / rows;
    const mapC = mkCanvas(w, h), roughC = mkCanvas(w, h), bumpC = mkCanvas(w, h);
    const mg = mapC.getContext('2d'), rg = roughC.getContext('2d'), bg = bumpC.getContext('2d');
    const mi = mg.createImageData(w, h), ri = rg.createImageData(w, h), bi = bg.createImageData(w, h);
    const layout = [];
    for (let r = 0; r < rows; r++) {
      const cuts = []; let acc = 0;
      while (acc < w) { const len = Math.floor(w * (0.36 + rand() * 0.5)); cuts.push(Math.min(len, w - acc)); acc += len; }
      const starts = []; acc = 0; cuts.forEach((c) => { starts.push(acc); acc += c; });
      layout.push({ off: Math.floor(rand() * w), cuts, starts });
    }
    const pal = { dark: [32, 19, 12], mid: [76, 46, 27], light: [118, 76, 44] };
    const md = mi.data, rd = ri.data, bd = bi.data;
    for (let y = 0; y < h; y++) {
      const r = Math.floor(y / rh), L = layout[r], yl = y - r * rh, dyj = Math.min(yl, rh - yl);
      for (let x = 0; x < w; x++) {
        const xx = (x - L.off + w) % w;
        let k = L.cuts.length - 1; while (L.starts[k] > xx) k--;
        const xl = xx - L.starts[k], dxj = Math.min(xl, L.cuts[k] - xl);
        const s = r * 13 + k * 7 + 3, tp = hash(r, k, 99);
        const ringF = (yl / rh) * 2.4 + vn(x / 128, y / 32, s, 8, 32) * 2.4;
        const f = ringF - Math.floor(ringF);
        const rr = Math.pow(f < 0.75 ? f / 0.75 : (1 - f) / 0.25, 0.85);
        const st = vn(x / 64, y / 2, s + 1, 16, 512), pr = vn(x / 8, y / 4, s + 2, 128, 256);
        const pore = pr > 0.78 ? (pr - 0.78) / 0.22 : 0;
        const t = clamp(0.1 + rr * 0.4 + (st - 0.5) * 0.3 + (tp - 0.5) * 0.55, 0, 1);
        const c = t < 0.5 ? mix3(pal.dark, pal.mid, t * 2) : mix3(pal.mid, pal.light, (t - 0.5) * 2);
        const edge = Math.min(dyj, dxj);
        const gap = edge < 1.6 ? 0.12 : edge < 3.2 ? 0.55 + (edge - 1.6) * 0.28 : 1;
        const pk = (1 - pore * 0.4) * gap, i = (y * w + x) * 4;
        md[i] = c[0] * pk; md[i + 1] = c[1] * pk; md[i + 2] = c[2] * pk; md[i + 3] = 255;
        const rv = (edge < 1.6 ? 1 : 0.42 + st * 0.1 + pore * 0.3) * 255;
        rd[i] = rd[i + 1] = rd[i + 2] = rv; rd[i + 3] = 255;
        const bv = (edge < 1.6 ? 0.05 : edge < 3.2 ? 0.05 + (edge - 1.6) * 0.3 : clamp(0.55 + (st - 0.5) * 0.25 + (rr - 0.5) * 0.1 - pore * 0.4, 0, 1)) * 255;
        bd[i] = bd[i + 1] = bd[i + 2] = bv; bd[i + 3] = 255;
      }
    }
    mg.putImageData(mi, 0, 0); rg.putImageData(ri, 0, 0); bg.putImageData(bi, 0, 0);
    return {
      map: finish(new THREE.CanvasTexture(mapC)),
      rough: finish(new THREE.CanvasTexture(roughC), { srgb: false }),
      bump: finish(new THREE.CanvasTexture(bumpC), { srgb: false })
    };
  })();

  /* ================= Plaster wall, leather, linen, felt ================= */
  const plasterMap = pixTex(512, 512, (x, y, o) => {
    const n = fbm(x / 64, y / 64, 4, 3, 8, 8), fine = vn(x / 4, y / 4, 5, 128, 128);
    const v = (0.84 + (n - 0.5) * 0.34 + (fine - 0.5) * 0.1) * 255;
    o[0] = v; o[1] = v * 0.985; o[2] = v * 0.97;
  });
  const plasterBump = pixTex(512, 512, (x, y, o) => {
    const v = (0.5 + (fbm(x / 32, y / 32, 3, 9, 16, 16) - 0.5) * 0.5 + (vn(x / 4, y / 4, 6, 128, 128) - 0.5) * 0.12) * 255;
    o[0] = o[1] = o[2] = v;
  }, { srgb: false });
  const leatherBump = pixTex(256, 256, (x, y, o) => {
    const v = (0.5 + (vn(x / 4, y / 4, 31, 64, 64) - 0.5) * 0.7 + (vn(x / 2, y / 2, 32, 128, 128) - 0.5) * 0.3) * 255;
    o[0] = o[1] = o[2] = v;
  }, { srgb: false });
  const linenBump = pixTex(256, 256, (x, y, o) => {
    const v = (0.5 + (vn(x / 2, y / 32, 41, 128, 8) - 0.5) * 0.55 + (vn(x / 32, y / 2, 42, 8, 128) - 0.5) * 0.45) * 255;
    o[0] = o[1] = o[2] = v;
  }, { srgb: false });
  const feltBump = pixTex(128, 128, (x, y, o) => {
    const v = (0.5 + Math.sin((x * Math.PI) / 2) * 0.2 * Math.sin((y * Math.PI) / 2) + (vn(x / 2, y / 2, 51, 64, 64) - 0.5) * 0.4) * 255;
    o[0] = o[1] = o[2] = v;
  }, { srgb: false });
  // Chair backrest: dark leather with a stitched centre panel.
  const stitchMap = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#1b1b1e'; g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, 'rgba(255,255,255,.05)'); grad.addColorStop(1, 'rgba(0,0,0,.1)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,120,128,.55)'; g.lineWidth = 2; g.setLineDash([9, 6]);
    [0.30, 0.70].forEach((p) => { g.beginPath(); g.moveTo(w * p, h * 0.06); g.lineTo(w * p, h * 0.94); g.stroke(); });
    g.beginPath(); g.roundRect(w * 0.06, h * 0.05, w * 0.88, h * 0.9, 40); g.stroke();
  }, { wrap: false });

  /* ================= Glow / shadow sprites ================= */
  const glowTex = tex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.4)');
    gr.addColorStop(0.7, 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, { wrap: false });
  const shadowTex = pixTex(128, 128, (x, y, o) => {
    const u = ((x + 0.5) / 128) * 2 - 1, v = ((y + 0.5) / 128) * 2 - 1;
    const d = Math.min(1, Math.hypot(Math.max(Math.abs(u) - 0.5, 0), Math.max(Math.abs(v) - 0.5, 0)) / 0.5);
    o[0] = o[1] = o[2] = 0; o[3] = Math.round(Math.pow(1 - d, 2.2) * 255);
  }, { wrap: false, srgb: false });
  const rampTex = pixTex(4, 64, (x, y, o) => { o[0] = o[1] = o[2] = 0; o[3] = Math.round(Math.pow(y / 63, 1.6) * 255); }, { wrap: false, srgb: false });

  const unitPlane = new THREE.PlaneGeometry(1, 1);
  const blobMats = new Map();
  const blobMat = (map, o) => {
    const key = `${map.id}:${o.toFixed(2)}`;
    if (!blobMats.has(key)) blobMats.set(key, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, opacity: o, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    return blobMats.get(key);
  };
  // Soft contact shadow lying on a horizontal surface (stands in for ambient occlusion).
  const blob = (parent, x, y, z, w, d, o = 0.5, ry = 0) => {
    const m = new THREE.Mesh(unitPlane, blobMat(shadowTex, o));
    m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, ry, 0); m.scale.set(w, d, 1);
    m.position.set(x, y, z); m.renderOrder = 1; parent.add(m); return m;
  };
  const glowMat = (color, opacity) => new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const ledMat = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });

  /* ================= Environment (reflections) =================
     A small dark room with a warm window, a warm shelf strip and a cool
     monitor panel — gives glass, varnish and metal something believable
     to reflect without brightening the room. */
  {
    const env = new THREE.Scene();
    const emit = (c, k, side) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side });
    env.add(new THREE.Mesh(new THREE.BoxGeometry(700, 360, 700), emit(0x0d0907, 1, THREE.BackSide)));
    const panel = (w, h, c, k, x, y, z, ry = 0, rx = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), emit(c, k, THREE.DoubleSide));
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m);
    };
    panel(200, 260, 0xffb066, 4.5, 340, 20, 60, -Math.PI / 2);          // window, +x
    panel(240, 6, 0xffb673, 8, 0, 70, -340);                              // shelf strip, back wall
    panel(180, 70, 0x4a8dff, 2, 0, -10, -340);                            // monitor / backlight
    panel(400, 400, 0xffd6a8, 0.3, 0, 175, 0, 0, Math.PI / 2);           // ceiling bounce
    panel(300, 160, 0xd9d2ca, 1.1, -30, 40, 340, Math.PI);               // soft front fill
    panel(60, 60, 0xffb26b, 2.5, -340, 20, 20, Math.PI / 2);             // floor lamp, -x
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.02, 1, 2000).texture;
    pm.dispose();
  }

  /* ================= Materials ================= */
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);
  const M = {
    walnut: phys({ map: deskWood.map, roughnessMap: deskWood.rough, bumpMap: deskWood.bump, bumpScale: 0.8, roughness: 1, clearcoat: 0.3, clearcoatRoughness: 0.38, envMapIntensity: 1.0 }),
    shelf: phys({ map: shelfWood.map, roughnessMap: shelfWood.rough, bumpMap: shelfWood.bump, bumpScale: 1.2, roughness: 1, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.9 }),
    cabinet: std({ map: cabWood.map, roughnessMap: cabWood.rough, bumpMap: cabWood.bump, bumpScale: 1, roughness: 1, envMapIntensity: 0.7 }),
    floor: phys({ map: floorSet.map, roughnessMap: floorSet.rough, bumpMap: floorSet.bump, bumpScale: 1.6, roughness: 1, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.8 }),
    wall: std({ color: 0x70635c, map: plasterMap, bumpMap: plasterBump, bumpScale: 1.2, roughness: 0.94, envMapIntensity: 0.12 }),
    trim: std({ color: 0x3a302a, roughness: 0.55, envMapIntensity: 0.3 }),
    steel: std({ color: 0x0f1012, metalness: 0.55, roughness: 0.42, envMapIntensity: 0.7 }),
    graphite: std({ color: 0x25272b, metalness: 0.85, roughness: 0.34, envMapIntensity: 0.9 }),
    brass: std({ color: 0xb48a4c, metalness: 1, roughness: 0.3, envMapIntensity: 1.0 }),
    bezel: phys({ color: 0x050506, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.6 }),
    plastic: std({ color: 0x16171a, roughness: 0.58, envMapIntensity: 0.45 }),
    nylon: std({ color: 0x0f1012, roughness: 0.6, envMapIntensity: 0.4 }),
    felt: std({ color: 0x1a1b1e, roughness: 1, bumpMap: cloneTex(feltBump, [28, 11]), bumpScale: 1.6, envMapIntensity: 0.1 }),
    rug: std({ color: 0x2a2a2c, roughness: 1, bumpMap: cloneTex(feltBump, [60, 30]), bumpScale: 2, envMapIntensity: 0.1 }),
    grille: std({ color: 0x131315, roughness: 1, bumpMap: cloneTex(feltBump, [6, 8]), bumpScale: 1.5 }),
    ceramic: phys({ color: 0xeeebe4, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 0.9 }),
    ceramicGrey: phys({ color: 0xb9b5ad, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.6 }),
    coffee: phys({ color: 0x170a04, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1 }),
    cork: std({ color: 0x8e6a45, roughness: 0.95, bumpMap: cloneTex(leatherBump, [3, 3]), bumpScale: 1.5 }),
    soil: std({ color: 0x20140d, roughness: 1 }),
    leather: phys({ color: 0x151517, roughness: 0.5, bumpMap: cloneTex(leatherBump, [5, 5]), bumpScale: 0.35, clearcoat: 0.45, clearcoatRoughness: 0.35, envMapIntensity: 1.3 }),
    pcMetal: std({ color: 0x0d0e10, metalness: 0.45, roughness: 0.42, envMapIntensity: 0.9 }),
    board: std({ color: 0x15171c, roughness: 0.55, metalness: 0.35 }),
    phone: std({ color: 0x9a9da3, metalness: 0.9, roughness: 0.32, envMapIntensity: 1 }),
    phoneGlass: phys({ color: 0x050607, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2 }),
    curtain: phys({ color: 0x867a6b, vertexColors: true, roughness: 0.92, bumpMap: cloneTex(linenBump, [10, 24]), bumpScale: 0.5, sheen: 0.5, sheenColor: new THREE.Color(0xffd9a8), sheenRoughness: 0.85, side: THREE.DoubleSide, emissive: 0xffb36e, emissiveIntensity: 0.15, envMapIntensity: 0.3 })
  };
  M.curtain.onBeforeCompile = (s) => {
    // Light behind the fabric: modulate the glow by the fold shading so ridges glow, valleys stay deep.
    s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor * vColor;');
  };
  M.curtain.customProgramCacheKey = () => 'curtain-glow';

  // Tempered glass: a faint smoke tint plus an additive, fresnel-correct reflection layer.
  const glassTint = new THREE.MeshBasicMaterial({ color: 0x05080c, transparent: true, opacity: 0.2, depthWrite: false });
  const glassRefl = phys({ color: 0x000000, roughness: 0.03, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 2.2 });

  /* ================= Room ================= */
  const room = new THREE.Group(); scene.add(room);
  const floor = shadowy(new THREE.Mesh(planeUV(new THREE.PlaneGeometry(960, 960), 960, 960, 120), M.floor), false, true);
  floor.rotation.x = -Math.PI / 2; add(room, floor, -200, FLOOR, 200);

  const wallPiece = (w, h, x, y, z, ry, cast = false) => {
    const m = shadowy(new THREE.Mesh(planeUV(new THREE.PlaneGeometry(w, h), w, h, 110), M.wall), cast, true);
    m.rotation.y = ry; add(room, m, x, y, z); return m;
  };
  wallPiece(1100, 420, WALL_X - 550, FLOOR + 210, WALL_Z, 0);

  // Right wall with a window opening (z 20 → 115, y -32 → 150). It casts shadow so the
  // window light lands on the floor and chair as a real, soft-edged shape.
  const winZ0 = 20, winZ1 = 115, winY0 = -32, winY1 = 150;
  const rightPiece = (z0, z1, y0, y1) => wallPiece(z1 - z0, y1 - y0, WALL_X, (y0 + y1) / 2, (z0 + z1) / 2, -Math.PI / 2, true);
  rightPiece(WALL_Z, winZ0, FLOOR, FLOOR + 420);
  rightPiece(winZ1, 420, FLOOR, FLOOR + 420);
  rightPiece(winZ0, winZ1, FLOOR, winY0);
  rightPiece(winZ0, winZ1, winY1, FLOOR + 420);
  const daylight = new THREE.Mesh(new THREE.PlaneGeometry(winZ1 - winZ0, winY1 - winY0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9c4a).multiplyScalar(1.0), toneMapped: false }));
  daylight.rotation.y = -Math.PI / 2; add(room, daylight, WALL_X + 6, (winY0 + winY1) / 2, (winZ0 + winZ1) / 2);
  [winZ0, winZ1].forEach((z) => add(room, rbox(8, winY1 - winY0 + 6, 4, 0.3, M.trim, 1), WALL_X + 2, (winY0 + winY1) / 2, z));
  [winY0, winY1].forEach((y) => add(room, rbox(8, 4, winZ1 - winZ0 + 4, 0.3, M.trim, 1), WALL_X + 2, y, (winZ0 + winZ1) / 2));
  add(room, rbox(14, 2.5, winZ1 - winZ0 + 12, 0.6, M.trim, 2), WALL_X - 3, winY0 - 1, (winZ0 + winZ1) / 2).castShadow = false;

  // Baseboards (dark, satin) and floor-to-wall shading.
  add(room, rbox(1100, 9, 1.6, 0.4, M.trim, 1), WALL_X - 550, FLOOR + 4.5, WALL_Z + 0.8);
  add(room, rbox(1.6, 9, 460, 0.4, M.trim, 1), WALL_X - 0.8, FLOOR + 4.5, WALL_Z + 230);
  {
    const ao = new THREE.Mesh(unitPlane, blobMat(rampTex, 0.5));
    ao.scale.set(1100, 46, 1); ao.position.set(WALL_X - 550, FLOOR + 23, WALL_Z + 0.3); ao.renderOrder = 1; room.add(ao);
    const ao2 = new THREE.Mesh(unitPlane, blobMat(rampTex, 0.45));
    ao2.scale.set(460, 46, 1); ao2.rotation.y = -Math.PI / 2; ao2.position.set(WALL_X - 0.3, FLOOR + 23, WALL_Z + 230); ao2.renderOrder = 1; room.add(ao2);
  }

  /* ---------- Curtain: pleated linen, floor to ceiling ---------- */
  const curtW = 116, curtH = 300, curtZ = 66;
  const curtGeo = new THREE.PlaneGeometry(curtW, curtH, 220, 48);
  {
    const p = curtGeo.attributes.position, col = new Float32Array(p.count * 3);
    const k = TAU / 12.5;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), t = y / curtH + 0.5;               // t: 0 hem → 1 heading
      const amp = 3.4 * (1 + (1 - t) * 0.4) * (0.35 + 0.65 * smoothstep(1, 0.8, t));
      const fold = Math.sin(x * k + Math.sin(y * 0.018) * 0.6) * 0.62 + Math.sin(x * k * 2.3 + 1.1) * 0.26 + Math.sin(x * k * 0.45 + 0.4) * 0.18;
      p.setZ(i, amp * fold);
      p.setX(i, x + Math.sin(y * 0.021 + x * 0.05) * 0.7);
      const ridge = clamp(0.5 + 0.5 * fold, 0, 1);
      let shade = lerp(0.3, 1, Math.pow(ridge, 1.1));
      shade *= 0.78 + 0.62 * smoothstep(0.45, 1, x / curtW + 0.5);            // brighter towards the window side
      if (t > 0.94) shade *= 0.8;                                              // heading band
      if (t < 0.025) shade *= 0.7;                                             // hem
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = shade;
    }
    curtGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    curtGeo.computeVertexNormals();
  }
  function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  const curtain = shadowy(new THREE.Mesh(curtGeo, M.curtain), false, true);
  curtain.rotation.y = -Math.PI / 2;
  add(room, curtain, WALL_X - 21, FLOOR + curtH / 2 + 0.3, curtZ);
  {
    const rodY = FLOOR + curtH + 5;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 168, 16), M.steel);
    rod.rotation.x = Math.PI / 2; add(room, rod, WALL_X - 21, rodY, curtZ);
    [-1, 1].forEach((s) => {
      add(room, new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12), M.brass), WALL_X - 21, rodY, curtZ + s * 84);
      add(room, rbox(20, 1.4, 1.4, 0.4, M.steel, 1), WALL_X - 11, rodY, curtZ + s * 40);
    });
    const ringGeo = new THREE.TorusGeometry(1.7, 0.3, 8, 20);
    for (let i = 0; i < 18; i++) {
      const r = new THREE.Mesh(ringGeo, M.steel);
      r.rotation.y = Math.PI / 2; add(room, r, WALL_X - 21, rodY - 0.4, curtZ - curtW / 2 + 3 + (i * (curtW - 6)) / 17);
    }
  }

  const RUG_TOP = FLOOR + 0.93;
  // Rug under the chair: dark wool.
  const rug = add(room, rbox(170, 0.9, 88, 0.4, M.rug, 1), 18, FLOOR + 0.45, 58);
  rug.castShadow = false;

  /* ================= Desk ================= */
  const DESK_W = 184, DESK_D = 70, TOP_T = 4.4;
  const desk = new THREE.Group(); scene.add(desk);
  add(desk, rbox(DESK_W, TOP_T, DESK_D, 1.8, M.walnut, 5), 0, -TOP_T / 2, 0);

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
  // Shadow under the desk, around the legs, and the dark pocket beneath the top.
  blob(room, 0, RUG_TOP, 0, 230, 120, 0.55);
  [-80, 80].forEach((x) => blob(room, x, RUG_TOP, 0, 20, 78, 0.5));

  /* ================= Wall shelf, LED strip, plants, clock ================= */
  const SHELF_Y = 92;
  add(scene, rbox(112, 3.6, 21, 1.1, M.shelf, 4), 0, SHELF_Y, WALL_Z + 10.5);
  // Warm LED strip under the shelf (2700 K), with a diffuser lip.
  const shelfLed = add(scene, new THREE.Mesh(new THREE.BoxGeometry(104, 0.5, 1.2), ledMat(new THREE.Color(0xffbd7a).multiplyScalar(1.5))), 0, SHELF_Y - 1.95, WALL_Z + 4);
  const shelfGlow = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(110, 9), glowMat(0xff9a45, 0.22)), 0, SHELF_Y - 5, WALL_Z + 0.4);

  // Leaf geometry: pointed blade, folded on the midrib, drooping at the tip. Lies along +z.
  const makeLeaf = ({ len, wid, fold = 0.2, droop = 0.35, seg = 12, across = 4 }) => {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= seg; i++) {
      const u = i / seg, half = (wid / 2) * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.85);
      for (let j = -across; j <= across; j++) {
        const v = j / across, x = v * half;
        pos.push(x, Math.abs(x) * fold - droop * u * u * len, u * len);
        uv.push(v * 0.5 + 0.5, u);
      }
    }
    const row = across * 2 + 1;
    for (let i = 0; i < seg; i++) for (let j = 0; j < row - 1; j++) {
      const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  const leafTex = tex(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, '#2c5a1c'); gr.addColorStop(0.6, '#3f7a26'); gr.addColorStop(1, '#4f8f2f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(190,225,140,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(170,215,120,.32)';
    for (let i = 0; i < 16; i++) { const y = h - (i + 0.5) * (h / 16); g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w * 0.28, y - 14, 4, y - 40); g.moveTo(w / 2, y); g.quadraticCurveTo(w * 0.72, y - 14, w - 4, y - 40); g.stroke(); }
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${rand() < 0.5 ? '10,40,6' : '120,170,70'},${0.04 + rand() * 0.07})`; g.fillRect(rand() * w, rand() * h, 2 + rand() * 6, 1 + rand() * 3); }
  }, { wrap: false });
  const leafMat = std({ map: leafTex, color: 0xffffff, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x0e3a06, emissiveIntensity: 0.25, envMapIntensity: 0.5 });
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  // A bush of leaves on short stalks; returns the group.
  const bush = (parent, { n, len, wid, pitch, stalk, y = 0, spread = 1, scale = [0.8, 1.15], hue = 0.28, droop = 0.35, cast = true, lum = [0.78, 1] }) => {
    const geo = makeLeaf({ len, wid, droop });
    const im = new THREE.InstancedMesh(geo, leafMat, n);
    im.castShadow = cast; im.receiveShadow = true;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU * 1.618 + rand() * 0.5, r = rand();
      const pt = pitch[0] + (pitch[1] - pitch[0]) * r;
      dummy.position.set(Math.cos(a) * stalk * 0.35, y + rand() * 1.2, Math.sin(a) * stalk * 0.35);
      dummy.rotation.set(-pt, -a + Math.PI / 2, 0, 'YXZ');
      dummy.scale.setScalar(scale[0] + rand() * (scale[1] - scale[0]) * spread);
      dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
      im.setColorAt(i, tint.setHSL(hue + (rand() - 0.5) * 0.05, 0.35 + rand() * 0.25, lum[0] + rand() * (lum[1] - lum[0])));
    }
    parent.add(im); return im;
  };
  const shelfPlant = (x, potMat, seedShift) => {
    const g = new THREE.Group(); g.position.set(x, SHELF_Y + 1.8, WALL_Z + 11); scene.add(g);
    const pts = [[0.01, 0], [3.4, 0], [4.4, 1.2], [5.0, 4], [5.2, 7.2], [4.8, 7.6], [4.4, 6.8], [0.01, 6.8]].map(([a, b]) => new THREE.Vector2(a, b));
    g.add(shadowy(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), potMat)));
    add(g, new THREE.Mesh(new THREE.CircleGeometry(4.5, 24), M.soil), 0, 6.9, 0).rotation.x = -Math.PI / 2;
    seed += seedShift;
    bush(g, { n: 16, len: 11, wid: 3.2, pitch: [0.35, 1.15], stalk: 4, y: 7.2, droop: 0.4, hue: 0.28 });
    bush(g, { n: 7, len: 7, wid: 2.4, pitch: [1.0, 1.35], stalk: 2, y: 7.4, droop: 0.2, hue: 0.26 });
    blob(g, 0, 0.03, 0, 15, 15, 0.45);
  };
  shelfPlant(-44, M.ceramic, 3); shelfPlant(44, M.ceramicGrey, 11);

  // Digital clock with a canvas face, redrawn from the real time.
  const clockCanvas = document.createElement('canvas');
  clockCanvas.width = 512; clockCanvas.height = 192;
  const cg = clockCanvas.getContext('2d');
  const clockTex = new THREE.CanvasTexture(clockCanvas);
  clockTex.colorSpace = THREE.SRGBColorSpace;
  clockTex.anisotropy = ANISO;
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
  add(clock, new THREE.Mesh(new THREE.PlaneGeometry(21.4, 8.6), new THREE.MeshBasicMaterial({ color: 0x000000 })), 0, 5, 3.0);
  blob(clock, 0, 0.03, 0, 28, 12, 0.5);
  setInterval(() => { if (drawClock()) onChange(); }, 1000);

  /* ---------- Wall poster ---------- */
  const posterTex = tex(512, 690, () => {}, { wrap: false });
  const drawPoster = () => {
    const c = posterTex.image, g = c.getContext('2d');
    g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, 512, 690);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.strokeRect(22, 22, 468, 646);
    g.fillStyle = '#a9a7a3'; g.textBaseline = 'alphabetic';
    ['DREAM', 'CODE', 'BUILD', 'REPEAT_'].forEach((t, i) => {
      g.save(); g.translate(58, 190 + i * 128); g.scale(0.74, 1);
      g.font = '800 124px "Inter Tight", "Arial Narrow", Impact, sans-serif'; g.fillText(t, 0, 0); g.restore();
    });
    posterTex.needsUpdate = true;
  };
  drawPoster();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawPoster(); onChange(); });
  {
    const poster = new THREE.Group(); poster.position.set(-98, 74, WALL_Z + 1.3); scene.add(poster);
    add(poster, rbox(34, 45.6, 2.2, 0.5, M.plastic, 2), 0, 0, 0);
    add(poster, new THREE.Mesh(new THREE.PlaneGeometry(31, 42), new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.6, envMapIntensity: 0.4 })), 0, 0, 1.15);
    add(poster, new THREE.Mesh(new THREE.PlaneGeometry(31, 42), new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.05, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 1.2 })), 0, 0, 1.2);
  }

  /* ================= Monitor riser ================= */
  const RISER_Y = 11.5;
  add(scene, rbox(100, 2.4, 26, 0.9, M.shelf, 4), 0, RISER_Y - 1.2, -21);
  [-44, 44].forEach((x) => {
    add(scene, rbox(2.4, RISER_Y - 2.4, 2.4, 0.4, M.steel, 1), x, (RISER_Y - 2.4) / 2, -11);
    add(scene, rbox(2.4, RISER_Y - 2.4, 2.4, 0.4, M.steel, 1), x, (RISER_Y - 2.4) / 2, -31);
    add(scene, rbox(2.4, 1.6, 22, 0.4, M.steel, 1), x, RISER_Y - 3.2, -21);
  });
  // Warm strip under the riser, throwing a soft pool onto the desk.
  add(scene, new THREE.Mesh(new THREE.BoxGeometry(92, 0.4, 0.8), ledMat(new THREE.Color(0xffb36b).multiplyScalar(1.2))), 0, RISER_Y - 2.55, -10.5);
  blob(desk, 0, 0.03, -21, 104, 34, 0.55);

  /* ================= Monitor ================= */
  const SCREEN_W = 72, SCREEN_H = 40.5;
  const MON_Z = -22;
  const SCREEN_CY = 41;
  const monitor = new THREE.Group(); monitor.position.set(0, 0, MON_Z); scene.add(monitor);

  // Low-profile slab foot, hinge and neck.
  add(monitor, rbox(40, 1.1, 20, 0.5, M.graphite, 3), 0, RISER_Y + 0.55, -2);
  add(monitor, rbox(5.4, SCREEN_CY - 6 - RISER_Y, 1.8, 0.7, M.graphite, 3), 0, (SCREEN_CY - 6 + RISER_Y) / 2, -4.2).rotation.x = -0.04;
  add(monitor, rbox(16, 7, 2.4, 1.0, M.graphite, 3), 0, SCREEN_CY - 2, -3.2);
  blob(scene, 0, RISER_Y + 0.05, MON_Z - 2, 52, 30, 0.55);

  // Thin bezels: the panel is only a little larger than the visible screen.
  const padTop = 0.55, padBot = 1.5, padSide = 0.55;
  const panelW = SCREEN_W + padSide * 2, panelH = SCREEN_H + padTop + padBot;
  const panelCY = SCREEN_CY + (padTop - padBot) / 2;
  const panel = add(monitor, rbox(panelW, panelH, 1.1, 0.5, M.bezel, 4), 0, panelCY, 0);
  add(monitor, rbox(panelW - 1.2, panelH - 1.2, 1.8, 0.8, M.plastic, 3), 0, panelCY, -1.1);
  add(monitor, rbox(46, 25, 2.8, 1.8, M.plastic, 3), 0, panelCY + 1, -2.4);
  const led = add(monitor, new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0 })), padSide + SCREEN_W / 2 - 3, SCREEN_CY - SCREEN_H / 2 - padBot / 2, 0.57);

  // Monitor light bar clipped on top.
  const barY = panelCY + panelH / 2 + 1.2;
  const bar = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 48, 24), M.graphite));
  bar.rotation.z = Math.PI / 2; add(monitor, bar, 0, barY, 1.4);
  const barGlow = add(monitor, new THREE.Mesh(new THREE.PlaneGeometry(44, 0.6), ledMat(new THREE.Color(0xffe0b8).multiplyScalar(1.2))), 0, barY - 0.9, 1.95);
  barGlow.rotation.x = Math.PI / 2 + 0.5;
  add(monitor, rbox(4.6, 3.2, 4.2, 0.4, M.graphite, 2), 0, barY - 0.7, -0.3);

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

  /* ================= Speakers ================= */
  const speaker = (x, rotY) => {
    const g = new THREE.Group(); g.position.set(x, 0, -20); g.rotation.y = rotY; scene.add(g);
    add(g, rbox(14, 22, 15, 1.2, M.cabinet, 3), 0, 11, 0);
    add(g, rbox(12.4, 20.4, 0.6, 0.25, M.grille, 2), 0, 11, 7.4);
    add(g, new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.35, 10, 36), M.nylon), 0, 8, 7.8);
    add(g, new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.25, 8, 24), M.nylon), 0, 17, 7.8);
    blob(g, 0, 0.04, 0, 22, 24, 0.55);
  };
  speaker(-64, 0.22);
  speaker(56, -0.2);

  /* ================= Desk mat, keyboard, mouse, phone, mug ================= */
  const mat = add(scene, rbox(84, 0.32, 32, 0.15, M.felt, 2), -6, 0.16, 11);
  mat.castShadow = false;
  {
    // Stitched border
    const stitch = tex(512, 192, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(150,150,158,.5)'; g.lineWidth = 2; g.setLineDash([8, 5]);
      g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 18); g.stroke();
    }, { wrap: false });
    const m = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({ map: stitch, transparent: true, depthWrite: false, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.scale.set(82.2, 30.2, 1); m.position.set(-6, 0.34, 11); m.renderOrder = 2; scene.add(m);
    blob(desk, -6, 0.03, 12, 92, 40, 0.5);
  }

  const U = 1.9;
  const kb = new THREE.Group(); kb.position.set(4, 0.32, 11); kb.rotation.y = -0.02; scene.add(kb);
  add(kb, rbox(16 * U + 1.8, 1.6, 6 * U + 1.6, 0.6, M.graphite, 3), 0, 0.8, 0);
  add(kb, rbox(16 * U + 0.4, 0.5, 6 * U + 0.2, 0.2, M.plastic, 1), 0, 1.5, 0);
  const kbGlow = add(kb, new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({ color: 0xfff1de, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })), 0, 1.78, 0);
  kbGlow.rotation.x = -Math.PI / 2; kbGlow.scale.set(16 * U, 6 * U, 1);
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
  // Keycap: rounded, tapered towards the top (like a real PBT cap).
  const keyGeo = new RoundedBoxGeometry(1, 0.85, 1, 2, 0.14);
  {
    const p = keyGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 - 0.17 * ((p.getY(i) + 0.425) / 0.85); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  }
  const keyMat = std({ roughness: 0.58, metalness: 0, envMapIntensity: 0.55 });
  const keys = shadowy(new THREE.InstancedMesh(keyGeo, keyMat, keyList.length));
  const keyIndex = new Map();
  const col = new THREE.Color();
  const KC = { base: 0xd9d5cb, mod: 0x8d8f94, acc: 0xd9692a };
  keyList.forEach((k, i) => { keyIndex.set(k.code, i); keys.setColorAt(i, col.setHex(KC[k.kind] || KC.base)); });
  const keyPress = new Float32Array(keyList.length);
  const kd = new THREE.Object3D();
  const layoutKey = (i) => {
    const k = keyList[i];
    kd.position.set(k.x, 2.0 - keyPress[i] * 0.4, k.z);
    kd.scale.set(k.w * U - 0.3, 1, U - 0.3);
    kd.updateMatrix();
    keys.setMatrixAt(i, kd.matrix);
  };
  keyList.forEach((_, i) => layoutKey(i));
  kb.add(keys);

  // Mouse: ergonomic matte shell with a split button line and a rubber scroll wheel.
  const MOUSE_HOME = new THREE.Vector3(30, 0.32, 13);
  const mouseGroup = new THREE.Group(); mouseGroup.position.copy(MOUSE_HOME); scene.add(mouseGroup);
  const mouseGeo = new THREE.SphereGeometry(1, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2);
  {
    const p = mouseGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const front = Math.max(0, z), back = Math.max(0, -z);
      y *= 1 - front * 0.34 + back * 0.12; x *= 1 - front * 0.16 - back * 0.04 + Math.max(0, y) * 0.04;
      p.setXYZ(i, x * 3.1, y * 3.3, z * 5.7);
    }
    mouseGeo.computeVertexNormals();
  }
  mouseGroup.add(shadowy(new THREE.Mesh(mouseGeo, phys({ color: 0x1b1c1f, roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.5, envMapIntensity: 0.6 }))));
  add(mouseGroup, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 3.4), M.nylon), 0, 2.22, 2.6);
  const wheel = add(mouseGroup, new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.34, 20), M.graphite), 0, 2.62, 1.9);
  wheel.rotation.z = Math.PI / 2;
  const mouseShadow = blob(scene, MOUSE_HOME.x, 0.4, MOUSE_HOME.z, 9, 14, 0.5);
  mouseShadow.userData.follow = true;

  // Phone, face up: titanium frame, glass, notch-free display.
  const phone = new THREE.Group(); phone.position.set(-38, 0.32, 12); phone.rotation.y = 0.35; scene.add(phone);
  {
    const rr = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); return s; };
    const bodyGeo = new THREE.ExtrudeGeometry(rr(7.4, 15.2, 1.2), { depth: 0.55, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 3, curveSegments: 14 });
    bodyGeo.rotateX(-Math.PI / 2);
    add(phone, shadowy(new THREE.Mesh(bodyGeo, M.phone)), 0, 0.05, 0);
    const screenGeo = new THREE.ShapeGeometry(rr(6.9, 14.7, 0.95), 14); screenGeo.rotateX(-Math.PI / 2);
    add(phone, new THREE.Mesh(screenGeo, M.phoneGlass), 0, 0.78, 0);
    const island = add(phone, new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), M.nylon), 0, 0.785, -6.1); island.rotation.x = -Math.PI / 2;
    blob(phone, 0, 0.02, 0, 10.5, 18.5, 0.55);
  }

  // Mug on a cork coaster.
  const mug = new THREE.Group(); mug.position.set(-58, 0, 6); mug.rotation.y = 0.9; scene.add(mug);
  add(mug, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 0.5, 40), M.cork)), 0, 0.25, 0);
  {
    const pts = [new THREE.Vector2(0.01, 0.5), new THREE.Vector2(3.5, 0.5), new THREE.Vector2(3.9, 0.7), new THREE.Vector2(4.1, 1.4)];
    for (let i = 1; i <= 8; i++) pts.push(new THREE.Vector2(4.1 + i * 0.04, 1.4 + i * 1.02));
    pts.push(new THREE.Vector2(4.5, 9.8), new THREE.Vector2(4.35, 10.1), new THREE.Vector2(3.95, 10.1), new THREE.Vector2(3.8, 9.8), new THREE.Vector2(3.65, 1.8), new THREE.Vector2(0.01, 1.8));
    mug.add(shadowy(new THREE.Mesh(new THREE.LatheGeometry(pts, 56), M.ceramic)));
    const curve = new THREE.CatmullRomCurve3([[3.9, 8.4, 0], [6.9, 8.4, 0], [8.1, 6.4, 0], [6.9, 3.2, 0], [4.1, 2.6, 0]].map((a) => new THREE.Vector3(...a)));
    mug.add(shadowy(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.62, 12), M.ceramic)));
    add(mug, new THREE.Mesh(new THREE.CircleGeometry(3.7, 40), M.coffee), 0, 8.9, 0).rotation.x = -Math.PI / 2;
    blob(mug, 0, 0.02, 0, 16, 16, 0.5);
  }

  /* ================= Desk lamp (premium articulated, matte black + brass) ================= */
  const lampMat = std({ color: 0x0c0c0e, metalness: 0.7, roughness: 0.48, envMapIntensity: 0.9 });
  const lamp = new THREE.Group(); lamp.position.set(-84, 0, -22); scene.add(lamp);
  const lampBase = new THREE.Mesh(new THREE.LatheGeometry([[0.01, 0], [7.4, 0], [7.8, 0.3], [7.8, 1.3], [6.8, 1.9], [0.01, 1.9]].map(([a, b]) => new THREE.Vector2(a, b)), 48), lampMat);
  lamp.add(shadowy(lampBase));
  const J0 = new THREE.Vector3(0, 2.2, 0), J1 = new THREE.Vector3(0, 12, 0), J2 = new THREE.Vector3(12, 46, 7), J3 = new THREE.Vector3(30, 44, 19);
  lamp.add(tube(J0, J1, 0.9, lampMat));
  [J1, J2, J3].forEach((j) => add(lamp, shadowy(new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 14), M.brass)), j.x, j.y, j.z));
  lamp.add(tube(J1, J2, 0.55, lampMat), tube(J1.clone().add(new THREE.Vector3(0.9, 0, 0.9)), J2.clone().add(new THREE.Vector3(0.9, 0, 0.9)), 0.35, M.brass, 8));
  lamp.add(tube(J2, J3, 0.55, lampMat));
  // Head: matte black conical shade with a glowing LED disc inside, tilted onto the desk.
  const lampHead = new THREE.Group(); lampHead.position.copy(J3); lamp.add(lampHead);
  const LAMP_TARGET = new THREE.Vector3(6, 0.5, 42);                        // beam aim, relative to the lamp base
  {
    const dir = LAMP_TARGET.clone().sub(J3).normalize();                                    // head's -Y axis follows the beam
    lampHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    const prof = (arr) => arr.map(([a, b]) => new THREE.Vector2(a, b));
    const shade = shadowy(new THREE.Mesh(new THREE.LatheGeometry(prof([[0.01, 5], [1.6, 4.9], [2.6, 4.2], [7.4, -3.6], [7.7, -4.2], [7.2, -4.2], [6.9, -3.5], [2.2, 3.7], [0.01, 4.2]]), 56), lampMat));
    shade.material = lampMat.clone(); shade.material.side = THREE.DoubleSide;
    lampHead.add(shade);
    const liner = new THREE.Mesh(new THREE.LatheGeometry(prof([[2.2, 3.7], [6.9, -3.5]]), 56), std({ color: 0xe9cfa6, roughness: 0.5, emissive: 0xff9c4a, emissiveIntensity: 0.6, side: THREE.DoubleSide }));
    lampHead.add(liner);
    add(lampHead, new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), ledMat(new THREE.Color(0xffd29a).multiplyScalar(2.4))), 0, 3.05, 0).rotation.x = Math.PI / 2;
    add(lampHead, new THREE.Mesh(new THREE.TorusGeometry(7.3, 0.28, 8, 56), M.brass), 0, -4.15, 0).rotation.x = Math.PI / 2;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa24d, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    halo.scale.set(26, 26, 1); lampHead.add(halo); halo.position.set(0, -2.5, 0);
  }
  blob(lamp, 0, 0.04, 0, 22, 22, 0.6);

  // Spot light: 2700 K, soft cone, real shadows.
  const lampLight = new THREE.SpotLight(0xffb36b, 15000, 0, 0.66, 0.9, 2);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(low ? 512 : 1024, low ? 512 : 1024);
  lampLight.shadow.camera.near = 6; lampLight.shadow.camera.far = 160;
  lampLight.shadow.bias = -0.0006; lampLight.shadow.normalBias = 0.03;
  lampLight.position.copy(J3).add(new THREE.Vector3(0, -1, 0));
  lamp.add(lampLight); lamp.add(lampLight.target);
  lampLight.target.position.copy(LAMP_TARGET);

  /* ================= Gaming PC (black chassis, tempered glass, RGB fans) ================= */
  const pc = new THREE.Group(); pc.position.set(76, 0, -14); pc.rotation.y = -0.06; scene.add(pc);
  const PW = 22, PH = 47, PD = 42;
  const BLADE_BLUE = 0x4f9bff;

  // One fan blade (swept, pitched); nine of them merged into a single geometry.
  const mergeGeos = (geos) => {
    const pos = [], nor = [];
    geos.forEach((g) => { for (const v of g.attributes.position.array) pos.push(v); for (const v of g.attributes.normal.array) nor.push(v); });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    return out;
  };
  const bladeGeo = (() => {
    const N = 11, r0 = 1.75, r1 = 5.45, sweep = 0.85, steps = 12;
    const at = (r, off) => { const t = (r - r0) / (r1 - r0), th = sweep * Math.pow(t, 1.25) + off; return new THREE.Vector2(Math.cos(th) * r, Math.sin(th) * r); };
    const half = (r) => 0.075 + 0.2 * Math.pow((r - r0) / (r1 - r0), 0.9);   // half-angle: slim at the hub, wider at the tip
    const pts = [];
    for (let i = 0; i <= steps; i++) { const r = r0 + ((r1 - r0) * i) / steps; pts.push(at(r, half(r))); }
    for (let i = steps; i >= 0; i--) { const r = r0 + ((r1 - r0) * i) / steps; pts.push(at(r, -half(r))); }
    const base = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.09, bevelEnabled: false });
    const list = [];
    for (let i = 0; i < N; i++) { const g = base.clone(); g.rotateX(0.42); g.rotateZ((i / N) * TAU); list.push(g); }
    return mergeGeos(list);
  })();
  const fanFrameGeo = (() => {
    const s = new THREE.Shape(), h = 6.1, r = 1.1;
    s.moveTo(-h + r, -h); s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r); s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h); s.lineTo(-h + r, h); s.quadraticCurveTo(-h, h, -h, h - r); s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
    const hole = new THREE.Path(); hole.absarc(0, 0, 5.75, 0, TAU, true); s.holes.push(hole);
    return new THREE.ExtrudeGeometry(s, { depth: 1.3, bevelEnabled: false, curveSegments: 40 });
  })();
  const fanRingGeo = new THREE.TorusGeometry(5.6, 0.2, 8, 56);
  const fanRingGeo2 = new THREE.TorusGeometry(2.3, 0.1, 8, 40);
  const fanHubGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.9, 24);
  const bladeMat = std({ color: 0x14161a, roughness: 0.38, metalness: 0.2, emissive: BLADE_BLUE, emissiveIntensity: 0.3, side: THREE.DoubleSide });
  const ringMat = ledMat(new THREE.Color(0x77b5ff).multiplyScalar(1.7));
  const fanGlowMat = glowMat(0x3c8dff, 0.3);
  const fan = (parent, x, y, z, scale = 1, rotX = 0, rotY = 0) => {
    const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.set(rotX, rotY, 0); f.scale.setScalar(scale); parent.add(f);
    add(f, new THREE.Mesh(fanFrameGeo, M.nylon), 0, 0, -0.65);
    const b = add(f, new THREE.Mesh(bladeGeo, bladeMat), 0, 0, 0); b.rotation.z = rand() * TAU;
    add(f, new THREE.Mesh(fanRingGeo, ringMat), 0, 0, 0.35);
    add(f, new THREE.Mesh(fanRingGeo2, ringMat), 0, 0, 0.3);
    add(f, new THREE.Mesh(fanHubGeo, M.board), 0, 0, 0).rotation.x = Math.PI / 2;
    add(f, new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), ringMat), 0, 0, 0.47);
    add(f, new THREE.Mesh(unitPlane, fanGlowMat), 0, 0, -0.2).scale.set(15, 15, 1);
    return f;
  };

  // Chassis: black painted steel with a tempered glass front and side.
  add(pc, rbox(PW, 2, PD, 0.6, M.pcMetal, 2), 0, 1, 0);
  add(pc, rbox(0.9, PH, PD, 0.4, M.pcMetal, 2), PW / 2 - 0.45, PH / 2, 0);
  add(pc, rbox(PW, PH, 0.9, 0.4, M.pcMetal, 2), 0, PH / 2, -PD / 2 + 0.45);
  [[-PW / 2 + 0.6, PD / 2 - 0.6], [-PW / 2 + 0.6, -PD / 2 + 0.6]].forEach(([x, z]) => add(pc, rbox(1.4, PH, 1.4, 0.4, M.pcMetal, 2), x, PH / 2, z));
  add(pc, rbox(1.4, 1.4, PD, 0.4, M.pcMetal, 2), -PW / 2 + 0.6, PH - 0.7, 0);
  add(pc, rbox(PW, 3, 1.4, 0.4, M.pcMetal, 2), 0, PH - 1.5, PD / 2 - 0.7);
  add(pc, rbox(PW, 3, 1.4, 0.4, M.pcMetal, 2), 0, 3.5, PD / 2 - 0.7);
  [-1, 1].forEach((s) => add(pc, rbox(2.2, PH, 1.4, 0.4, M.pcMetal, 2), s * (PW / 2 - 1.1), PH / 2, PD / 2 - 0.7));
  [[-8, -17], [8, -17], [-8, 17], [8, 17]].forEach(([x, z]) => add(pc, rbox(2.4, 1, 2.4, 0.4, M.nylon, 1), x, -0.4, z));
  // Three intake fans behind the front glass
  [10.5, 23.5, 36.5].forEach((y) => fan(pc, 0, y, PD / 2 - 2.8));
  // Top: perforated panel with two exhaust fans
  const perfTex = tex(64, 64, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 16 + 8 + (y % 2) * 8, y * 16 + 8, 5.6, 0, TAU); g.fill(); }
  }, { repeat: [10, 18], srgb: false });
  const perf = std({ color: 0x15161a, metalness: 0.3, roughness: 0.6, alphaMap: perfTex, alphaTest: 0.5, side: THREE.DoubleSide });
  add(pc, new THREE.Mesh(new THREE.PlaneGeometry(PW - 1.6, PD - 1.6), perf), 0, PH - 0.1, 0).rotation.x = -Math.PI / 2;
  [-9, 9].forEach((z) => fan(pc, -1, PH - 2.8, z, 1, -Math.PI / 2));

  // Interior: motherboard, memory, GPU, CPU cooler, PSU shroud
  const boardTex = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#0e1014'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(90,120,170,.22)'; g.lineWidth = 1.4;
    for (let i = 0; i < 90; i++) { let x = rand() * w, y = rand() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { if (rand() < 0.5) x += (rand() - 0.5) * 120; else y += (rand() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
    const blockG = (x, y, bw, bh) => { const gr = g.createLinearGradient(x, y, x, y + bh); gr.addColorStop(0, '#2b2f37'); gr.addColorStop(1, '#14161b'); g.fillStyle = gr; g.fillRect(x, y, bw, bh); g.strokeStyle = 'rgba(255,255,255,.08)'; g.strokeRect(x + 1, y + 1, bw - 2, bh - 2); };
    blockG(20, 20, 130, 110); blockG(20, 140, 90, 70); blockG(160, 20, 70, 330);
    g.fillStyle = '#1b1e24'; g.beginPath(); g.arc(300, 150, 52, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(130,150,190,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(300, 150, 52, 0, TAU); g.stroke();
    for (let i = 0; i < 4; i++) { g.fillStyle = '#0a0b0e'; g.fillRect(360 + i * 28, 40, 14, 300); }
    g.fillStyle = '#1a1d23'; g.fillRect(20, 380, 470, 18); g.fillRect(20, 430, 470, 18);
  }, { wrap: false });
  const boardMat = std({ map: boardTex, roughness: 0.5, metalness: 0.35, envMapIntensity: 0.6 });
  add(pc, rbox(0.6, 32, 34, 0.2, boardMat, 1), PW / 2 - 1.4, 28, -2);
  const gpu = add(pc, rbox(9.5, 4.6, 30, 0.6, M.graphite, 2), 4.5, 18, 1);
  add(gpu, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 24), ledMat(new THREE.Color(0xb9d6ff).multiplyScalar(1.1))), -4.85, 1.2, 0);
  // CPU cooler: fin stack + fan
  const cooler = add(pc, rbox(7, 9, 9, 0.8, M.graphite, 2), 6, 33, -6);
  for (let i = 0; i < 7; i++) add(cooler, new THREE.Mesh(new THREE.BoxGeometry(0.1, 8.4, 8.4), M.pcMetal), -3.55 + i * 0.01, 0, 0);
  fan(pc, 2.0, 33, -6, 0.55, 0, -Math.PI / 2);
  // Memory with a soft light bar
  for (let i = 0; i < 4; i++) {
    const ram = add(pc, rbox(0.7, 5, 11, 0.2, M.board, 1), 8.55, 34, 4.2 + i * 1.5);
    add(ram, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 10.4), ledMat(new THREE.Color(0xa7cbff).multiplyScalar(0.9))), -0.38, 2.5, 0);
  }
  add(pc, rbox(PW - 2, 9, PD - 2.5, 0.6, M.pcMetal, 2), 0, 6.5, 0.3);
  add(pc, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, PD - 8), ledMat(new THREE.Color(0x77b5ff).multiplyScalar(0.7))), -PW / 2 + 2.2, 11.4, -1);
  // Cables
  [[7.5, 8, -4, 7.5, 24, -4], [8.2, 8, -9, 8.2, 22, -9]].forEach(([x0, y0, z0, x1, y1, z1]) => pc.add(tube(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1), 0.3, M.nylon, 8)));
  // Tempered glass: front and left side (tint + fresnel reflection)
  const glassPane = (w, h, x, y, z, ry) => {
    const t = add(pc, new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassTint), x, y, z); t.rotation.y = ry; t.renderOrder = 3;
    const r = add(pc, new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassRefl), x, y, z); r.rotation.y = ry; r.renderOrder = 4;
    return r;
  };
  glassPane(PW - 4.2, PH - 6, 0, PH / 2 + 0.75, PD / 2 - 0.2, 0);
  glassPane(PD - 1.6, PH - 2.6, -PW / 2 + 0.2, PH / 2 + 0.6, 0, -Math.PI / 2);
  const pcLight = new THREE.PointLight(0x4a90ff, low ? 0 : 2000, 100, 2);
  add(pc, pcLight, -3, 26, 6);
  blob(scene, 76, 0.04, -14, 30, 50, 0.55);

  /* ================= Office chair (black leather, padded) ================= */
  const chair = new THREE.Group(); chair.position.set(34, FLOOR, 62); chair.rotation.y = -0.45; scene.add(chair); chair.updateMatrixWorld(true);
  // Five-star base with casters
  const armGeo = new RoundedBoxGeometry(30, 2.6, 4.2, 2, 1.0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3;
    const arm = add(chair, shadowy(new THREE.Mesh(armGeo, M.nylon)), Math.cos(a) * 15, 7.5, Math.sin(a) * 15);
    arm.rotation.y = -a; arm.rotation.z = -0.03;
    const cx = Math.cos(a) * 29.5, cz = Math.sin(a) * 29.5;
    add(chair, rbox(2.6, 3.4, 2.6, 0.6, M.nylon, 1), cx, 5.2, cz);
    const wh = add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 2.2, 22), M.nylon)), cx + 1.2 * Math.cos(a + 1.5), 2.6, cz + 1.2 * Math.sin(a + 1.5));
    wh.rotation.set(0, -a, Math.PI / 2);
    const wp = chair.localToWorld(new THREE.Vector3(cx, 0, cz));
    blob(room, wp.x, RUG_TOP, wp.z, 9, 9, 0.5);
  }
  blob(room, 34, RUG_TOP, 62, 78, 78, 0.35);
  add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 5, 28), M.nylon)), 0, 8, 0);
  add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 11, 24), M.nylon)), 0, 15, 0);
  add(chair, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 20, 20), M.graphite)), 0, 28, 0);
  add(chair, rbox(22, 4, 24, 1.2, M.nylon, 2), 0, 40, 0);
  // Seat: thick leather cushion
  add(chair, rbox(52, 9, 50, 4, M.leather, 5), 0, 46.5, -2);
  add(chair, rbox(46, 1, 44, 0.4, M.nylon, 1), 0, 41.5, -2);
  // 4D armrests with padded tops
  [-1, 1].forEach((s) => {
    add(chair, rbox(9, 2.6, 5, 0.9, M.nylon, 2), s * 24, 42, 4);
    add(chair, rbox(3.4, 22, 4.6, 1, M.nylon, 2), s * 28, 54, 4);
    add(chair, rbox(8, 3.8, 27, 1.6, M.leather, 4), s * 28, 66.5, 1);
    add(chair, new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4.8, 14), M.brass), s * 28, 62, 4).rotation.z = Math.PI / 2;
  });
  // Spine + recline mechanism
  const spine = add(chair, rbox(7, 44, 3.4, 1.2, M.nylon, 2), 0, 63, 28);
  spine.rotation.x = 0.16;
  add(chair, rbox(16, 7, 10, 1.6, M.nylon, 2), 0, 44, 16);
  // Backrest: bent, padded leather shell with a stitched panel (tilted back slightly)
  const softBox = (w, h, d, r, sx, sy, sz, bend) => {
    const g = new THREE.BoxGeometry(w, h, d, sx, sy, sz);
    const p = g.attributes.position, n = g.attributes.normal;
    const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, v = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); q.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
      v.sub(q).normalize(); n.setXYZ(i, v.x, v.y, v.z);
      p.setXYZ(i, q.x + v.x * r, q.y + v.y * r, q.z + v.z * r);
    }
    if (bend) for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), dz = bend.dz(x);
      p.setZ(i, p.getZ(i) + dz);
      const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i), slope = bend.slope(x);
      const l = Math.hypot(nx - slope * nz, ny, nz) || 1;
      n.setXYZ(i, (nx - slope * nz) / l, ny / l, nz / l);
    }
    return g;
  };
  const back = new THREE.Group(); back.position.set(0, 82, 28); back.rotation.x = 0.12; chair.add(back);
  const BW = 48, BH = 58;
  const bend = { dz: (x) => -0.011 * x * x, slope: (x) => -0.022 * x };
  const backMat = M.leather.clone(); backMat.map = stitchMap; backMat.color = new THREE.Color(0xffffff);
  back.add(shadowy(new THREE.Mesh(softBox(BW, BH, 9, 4.2, 40, 44, 6, bend), backMat)));
  // Rear shell: satin black plastic backing the cushion (what you see from behind)
  const shell = shadowy(new THREE.Mesh(softBox(BW - 8, BH - 10, 3, 1.4, 28, 32, 3, { dz: (x) => -0.011 * x * x + 5.6, slope: (x) => -0.022 * x }), M.leather));
  back.add(shell);
  // Headrest on two posts
  [-5, 5].forEach((x) => add(chair, rbox(1.6, 8, 1.8, 0.5, M.nylon, 1), x, 113, 31));
  const head = add(chair, rbox(30, 12, 7, 3, M.leather, 4), 0, 120, 31);
  head.rotation.x = 0.1;

  /* ================= Floor lamp + large plant (left foreground) ================= */
  {
    const fl = new THREE.Group(); fl.position.set(-130, FLOOR, -28); scene.add(fl);
    add(fl, new THREE.Mesh(new THREE.CylinderGeometry(9, 10, 1.6, 36), lampMat), 0, 0.8, 0);
    fl.add(tube(new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0, 146, 0), 0.4, lampMat));
    add(fl, new THREE.Mesh(new THREE.SphereGeometry(4.6, 32, 24), phys({ color: 0xffe9cc, roughness: 0.35, emissive: 0xffa95a, emissiveIntensity: 1.05, clearcoat: 0.6 })), 0, 150, 0);
    const lampHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa24d, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    lampHalo.scale.set(34, 34, 1); fl.add(lampHalo); lampHalo.position.set(0, 150, 0);
    const floorLampLight = new THREE.PointLight(0xffa860, low ? 0 : 2400, 260, 2);
    add(fl, floorLampLight, 4, 148, 6);
    blob(room, -142, FLOOR + 0.1, -26, 34, 34, 0.45);
  }
  {
    const pg = new THREE.Group(); pg.position.set(-112, FLOOR, 2); scene.add(pg);
    const pts = [[0.01, 0], [12, 0], [15, 3], [17, 20], [17.6, 34], [16.2, 36], [15, 33], [0.01, 33]].map(([a, b]) => new THREE.Vector2(a, b));
    pg.add(shadowy(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), M.ceramicGrey)));
    add(pg, new THREE.Mesh(new THREE.CircleGeometry(15.2, 28), M.soil), 0, 33.5, 0).rotation.x = -Math.PI / 2;
    seed += 5;
    bush(pg, { n: 26, len: 46, wid: 14, pitch: [0.55, 1.3], stalk: 12, y: 34, droop: 0.3, hue: 0.3, scale: [0.75, 1.15], lum: [0.5, 0.72] });
    bush(pg, { n: 12, len: 28, wid: 10, pitch: [0.2, 0.7], stalk: 8, y: 34, droop: 0.2, hue: 0.28, scale: [0.7, 1.1], lum: [0.5, 0.72] });
    blob(room, -120, FLOOR + 0.1, 4, 50, 50, 0.5);
  }

  /* ================= Lights ================= */
  // Dim warm ambient so nothing is ever pure black.
  scene.add(new THREE.HemisphereLight(0xffd9b8, 0x24170f, 0.85));
  // Window light: low, warm, shadow-casting so the window shape reaches the room.
  const winLight = new THREE.DirectionalLight(0xffb067, 18);
  winLight.position.set(WALL_X + 420, 140, 80); winLight.target.position.set(WALL_X - 80, FLOOR + 20, 62);
  winLight.castShadow = true;
  winLight.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(winLight.shadow.camera, { left: -520, right: 520, top: 380, bottom: -380, near: 40, far: 1500 });
  winLight.shadow.bias = -0.0004; winLight.shadow.normalBias = 0.08;
  scene.add(winLight, winLight.target);

  // Shelf LED: warm strip washing the wall below the shelf.
  const shelfLight = new THREE.RectAreaLight(0xffb06a, 20, 104, 2.4);
  shelfLight.position.set(0, SHELF_Y - 2, WALL_Z + 3.5); shelfLight.lookAt(0, SHELF_Y - 60, WALL_Z - 1.5);
  scene.add(shelfLight);
  // Warm strip under the riser: lights the desk top and the wall just behind it.
  const riserLight = new THREE.RectAreaLight(0xffb06a, 7, 92, 1.6);
  riserLight.position.set(0, RISER_Y - 2.6, -10); riserLight.lookAt(0, -12, 4);
  scene.add(riserLight);
  if (!low) {
    // Cool backlight behind the monitor: a soft blue halo on the wall, never saturated.
    const blueA = new THREE.RectAreaLight(0x4a86ff, 2.4, 92, 48);
    blueA.position.set(2, 44, -30); blueA.lookAt(2, 44, WALL_Z - 10); scene.add(blueA);
    const blueB = new THREE.RectAreaLight(0x4a86ff, 2.6, 150, 3);
    blueB.position.set(0, -4, -33); blueB.lookAt(0, -48, WALL_Z); scene.add(blueB);
  }
  const screenLight = new THREE.RectAreaLight(0xd8e4ff, 0, SCREEN_W, SCREEN_H);
  screenLight.position.set(0, SCREEN_CY, MON_Z + SCREEN_Z + 0.5);
  screenLight.lookAt(0, SCREEN_CY - 6, 200);
  scene.add(screenLight);
  const barLight = new THREE.RectAreaLight(0xffe6c8, 0, 44, 1.2);
  barLight.position.set(0, barY - 1, MON_Z + 2.2);
  barLight.lookAt(0, 0, 18);
  scene.add(barLight);

  /* ================= Power-up ================= */
  const setPower = (p) => {
    screenLight.intensity = p * 2.6;
    barLight.intensity = 1.5 + p * 4.5;
    lampLight.intensity = 3500 + p * 11500;
    led.material.opacity = p * 0.8;
  };

  // Shadow maps are static unless something that casts moves (mouse, keys): the render loop asks.
  const followMouse = (x, z) => { mouseShadow.position.set(x, 0.4, z + 1); };

  return {
    SCREEN_W, SCREEN_H, SCREEN_CY, SCREEN_Z, MON_Z,
    monitor, hole, panel, glassMat, led,
    keys, keyIndex, keyPress, layoutKey,
    mouseGroup, MOUSE_HOME,
    screenLight, barLight, setPower, followMouse
  };
}
