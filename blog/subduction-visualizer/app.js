'use strict';
/* Subduction visualizer -- the matrix and the selected run.

   The matrix (#mos) is the chooser.  It shows one WebP per keyframe of the whole 9 x 9 matrix,
   drawn at twice the 780 px column, and clicking a tile selects that run.
   The detail (#dgl, WebGL 2) shows the selected run at the full width of the matrix, redrawn
   grain by grain from the run's own positions: a disc per grain with an antialiased edge, the
   mantle as a flat fill up to its free surface.  It follows the time slider, interpolating
   positions and colors between the 50 keyframes.  While the run's data loads, the detail shows
   the matrix image of that tile, scaled up, as a placeholder (#dmos).
   The lithosphere is colored by von Mises strain on the manifest's color map (imola).  A tile is the model window x = 15..255,
   y = 30..190, mirrored so the piston is on the left; tiles are 240 x 160 model units with a
   6-unit gap.  The page always opens at the lowest mantle drag and the final step. */
(async function () {
  const DATA = 'data/';
  const FIELD = 'vm';
  const $ = id => document.getElementById(id);
  const man = await (await fetch(DATA + 'manifest.json', { cache: 'no-cache' })).json();
  const V = man.version ? '?v=' + man.version : '';     // this build's version, on every data URL

  const TW = 240, TH = 160, GAP = man.gap;
  const MW = 9 * TW + 8 * GAP, MH = 9 * TH + 8 * GAP;
  const WX1 = man.window.x[1], WY1 = man.window.y[1];
  const K = man.keyframes.step.length, N = man.n_grains, Q = man.q;
  const ENV_LO = man.env.lo, NB = man.env.hi - man.env.lo;
  const PRE = man.grid.order, ECS = man.grid.ec, TSS = man.grid.ts;
  const MAX_RUNS = 12;             // runs kept decoded (and on the GPU)
  const MAX_BMP = 14;              // decoded matrix frames kept
  const MANTLE = [0xCC / 255, 0x23 / 255, 0x3B / 255];
  const ACCENT = '#003399';
  const LUT = new Uint8Array((man.lut || man.imola).match(/../g).map(h => parseInt(h, 16)));    // 256 x RGB, the color map (imola)
  // viscosity of each drag at 10 cm/yr, for a 15 km thick plate: eta = mu* x stress unit x step time
  const ETA_LABEL = { m4: '2 × 10¹⁸ Pa s', m5: '2 × 10¹⁹ Pa s', m6: '2 × 10²⁰ Pa s' };

  // ------------------------------------------------------------------ state
  // every load starts at the lowest mantle drag (the first in the manifest order), the final step and
  // the E = 10^6, sigma_c = 10^6 run
  const st = { pre: PRE[0], t: K - 1, sel: { row: 4, col: 8 }, playing: false, dpr: 1, m: { W: 0, H: 0, s: 1 }, d: { W: 0, H: 0, s: 1 } };
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);

  // ------------------------------------------------------------------ fetching
  async function fetchBytes(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ': ' + r.status);
    const b = new Uint8Array(await r.arrayBuffer());
    if (b[0] === 0x1f && b[1] === 0x8b) {         // served as a file, not with Content-Encoding
      const ds = new DecompressionStream('gzip');
      return new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(ds)).arrayBuffer());
    }
    return b;
  }
  const canInflate = 'DecompressionStream' in window;
  const grains = canInflate ? await fetchBytes(DATA + 'grains.bin.gz' + V) : null;
  const RAD = new Float32Array(N);
  if (grains) for (let i = 0; i < N; i++) RAD[i] = man.radii[grains[i]];

  // ------------------------------------------------------------------ picker, slider, play
  const picker = $('picker').querySelector('.grp');
  function mosaicURL(p, k) { return `${DATA}${p}/mosaic_${FIELD}/${String(k).padStart(2, '0')}.webp${V}`; }
  for (const p of PRE) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.pre = p;
    b.textContent = ETA_LABEL[p];                  // the viscosity only; mu* itself is the model's parameter
    b.addEventListener('click', () => setPre(p));
    picker.appendChild(b);
  }
  function syncButtons() { for (const b of picker.children) b.setAttribute('aria-pressed', String(b.dataset.pre === st.pre)); }

  const slider = $('time');
  slider.max = String(K - 1);
  slider.addEventListener('input', () => { stopPlay(); setT(parseFloat(slider.value)); });
  function readout() {
    const k0 = Math.floor(st.t), k1 = Math.min(K - 1, k0 + 1), f = st.t - k0;
    const lerp = a => a[k0] + (a[k1] - a[k0]) * f;
    const step = Math.round(lerp(man.keyframes.step));
    $('tread').textContent = `step ${step.toLocaleString('en-US')} out of 7,250`;
  }
  const playBtn = $('play');
  let playLast = 0;
  function stopPlay() { st.playing = false; playBtn.textContent = 'Play'; playBtn.setAttribute('aria-label', 'Play the time evolution'); }
  playBtn.addEventListener('click', () => {
    if (st.playing) { stopPlay(); return; }
    if (st.t >= K - 1 - 1e-6) setT(0);
    st.playing = true; playBtn.textContent = 'Pause'; playBtn.setAttribute('aria-label', 'Pause');
    playLast = performance.now();
    requestAnimationFrame(playTick);
  });
  function playTick(now) {
    if (!st.playing) return;
    const dt = Math.min(0.1, (now - playLast) / 1000); playLast = now;
    const t = st.t + dt * 5;                        // 5 keyframes per second: 10 s for the run
    if (t >= K - 1) { setT(K - 1); stopPlay(); return; }
    setT(t);
    requestAnimationFrame(playTick);
  }

  // ------------------------------------------------------------------ color bar
  function drawColorbar() {
    const cb = $('cbar'), w = Math.max(1, Math.round(cb.clientWidth * st.dpr));
    cb.width = w; cb.height = 1;
    const x = cb.getContext('2d'), img = x.createImageData(w, 1);
    for (let i = 0; i < w; i++) {
      const k = Math.min(255, Math.floor(i / w * 256)) * 3;
      img.data.set([LUT[k], LUT[k + 1], LUT[k + 2], 255], i * 4);
    }
    x.putImageData(img, 0, 0);
    const [lo, hi] = man.fields[FIELD].log10;
    const ticks = $('cbarTicks'); ticks.innerHTML = '';
    for (let e = lo; e <= hi; e++) {
      const s = document.createElement('span');
      s.style.left = ((e - lo) / (hi - lo) * 100) + '%';
      s.textContent = (100 * 10 ** e).toString().replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') + '%';
      ticks.appendChild(s);
    }
    $('cbarLabel').textContent = 'von Mises strain, log scale';
  }

  // ------------------------------------------------------------------ matrix frames
  const blobs = new Map();          // `${pre}/${k}` -> Blob | Promise
  const bmps = new Map();           // same key -> ImageBitmap (LRU by insertion order)
  const decoding = new Map();
  function key(p, k) { return `${p}/${k}`; }
  function getBlob(p, k) {
    const kk = key(p, k);
    if (blobs.has(kk)) return blobs.get(kk);
    const pr = fetch(mosaicURL(p, k)).then(r => r.blob()).then(b => { blobs.set(kk, b); return b; });
    blobs.set(kk, pr);
    return pr;
  }
  function getBitmap(p, k) {
    const kk = key(p, k);
    if (bmps.has(kk)) { const b = bmps.get(kk); bmps.delete(kk); bmps.set(kk, b); return b; }
    if (!decoding.has(kk)) {
      decoding.set(kk, Promise.resolve(getBlob(p, k)).then(b => createImageBitmap(b)).then(bm => {
        bmps.set(kk, bm); decoding.delete(kk);
        while (bmps.size > MAX_BMP) { const [old, ob] = bmps.entries().next().value; ob.close && ob.close(); bmps.delete(old); }
        dirty();
      }).catch(() => decoding.delete(kk)));
    }
    return null;
  }
  function nearestBitmap(p, k) {
    const b = getBitmap(p, k);
    if (b) return b;
    for (let d = 1; d < K; d++) for (const kk of [k - d, k + d]) {
      if (kk < 0 || kk >= K) continue;
      const x = bmps.get(key(p, kk)); if (x) return x;
    }
    return null;
  }
  let prefetchGen = 0;
  async function prefetchFrames() {
    const gen = ++prefetchGen, p = st.pre;
    const order = [K - 1, 0], c = Math.round(st.t);
    for (let d = 0; d < K; d++) for (const k of [c - d, c + d]) if (k >= 0 && k < K && !order.includes(k)) order.push(k);
    let i = 0;
    const worker = async () => {
      while (i < order.length && gen === prefetchGen) {
        const k = order[i++];
        try { await getBlob(p, k); } catch (e) { /* retried on demand */ }
        if (gen === prefetchGen) status();
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }
  function framesLoaded(p) {
    let n = 0; for (let k = 0; k < K; k++) if (blobs.get(key(p, k)) instanceof Blob) n++;
    return n;
  }

  // ------------------------------------------------------------------ run data
  const runs = new Map();           // tag -> {pos, env, field, gl:{...}, last}
  const pending = new Map();        // `${tag}/${what}` -> Promise
  function tagOf(p, row, col) { return `${p}_ec${ECS[row]}_ts${TSS[col]}`; }
  function selTag() { return tagOf(st.pre, st.sel.row, st.sel.col); }
  function loadPart(tag, what) {
    const pk = tag + '/' + what;
    if (pending.has(pk)) return pending.get(pk);
    const r0 = runs.get(tag);
    if (r0 && (what === 'pos' ? r0.pos : r0.field)) return Promise.resolve();
    const p = tag.split('_')[0];
    const pr = fetchBytes(`${DATA}${p}/${tag}_${what}.bin.gz${V}`).then(b => {
      let r = runs.get(tag); if (!r) { r = { gl: {}, last: performance.now() }; runs.set(tag, r); }
      if (what === 'pos') decodePos(r, b); else decodeField(r, b);
      evict(); dirty();
    }).catch(e => { console.warn(e); }).finally(() => { pending.delete(pk); status(); });
    pending.set(pk, pr);
    return pr;
  }
  function decodePos(r, b) {
    const M = K * N * 2, lo = b.subarray(0, M), hi = b.subarray(M, 2 * M);
    const pos = new Float32Array(M), acc = new Int32Array(N * 2);
    for (let k = 0; k < K; k++) {
      const o = k * N * 2;
      for (let j = 0; j < N * 2; j++) {
        let v = lo[o + j] | (hi[o + j] << 8); if (v & 0x8000) v -= 0x10000;
        acc[j] += v; pos[o + j] = acc[j] / Q;
      }
    }
    const eb = b.slice(2 * M), ev = new Int16Array(eb.buffer, eb.byteOffset, K * NB);
    const env = new Float32Array(K * NB), ea = new Int32Array(NB);
    for (let k = 0; k < K; k++) for (let i = 0; i < NB; i++) { ea[i] += ev[k * NB + i]; env[k * NB + i] = ea[i] / Q; }
    r.pos = pos; r.env = env;
    if (gl) {
      r.gl.pos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, r.gl.pos); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      r.gl.env = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, r.gl.env); gl.bufferData(gl.ARRAY_BUFFER, env, gl.STATIC_DRAW);
    }
  }
  function decodeField(r, d) {
    const a = new Uint8Array(K * N);
    a.set(d.subarray(0, N));
    for (let k = 1; k < K; k++) for (let j = 0; j < N; j++) a[k * N + j] = (a[(k - 1) * N + j] + d[k * N + j]) & 255;
    r.field = a;
    if (gl) { r.gl.field = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, r.gl.field); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); }
  }
  function evict() {
    if (runs.size <= MAX_RUNS) return;
    const keep = selTag();
    const cand = [...runs.entries()].filter(([t]) => t !== keep).sort((a, b) => a[1].last - b[1].last);
    while (runs.size > MAX_RUNS && cand.length) {
      const [t, r] = cand.shift();
      if (gl) for (const b of [r.gl.pos, r.gl.env, r.gl.field]) if (b) gl.deleteBuffer(b);
      runs.delete(t);
    }
  }
  function ready(tag) { const r = runs.get(tag); return !!(r && r.pos && r.field); }
  function loadSelected() {
    if (!canInflate) return;
    const tag = selTag();
    loadPart(tag, 'pos'); loadPart(tag, FIELD);
  }

  // ------------------------------------------------------------------ WebGL (the detail)
  const glc = $('dgl');
  const gl = canInflate ? glc.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false }) : null;
  if (!canInflate) $('nogl').textContent = 'This browser cannot decompress the run data, so the open run shows the matrix image only.';
  else if (!gl) $('nogl').textContent = 'WebGL 2 is not available in this browser, so the open run shows the matrix image only.';
  const G = gl ? setupGL() : null;
  function setupGL() {
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = (vs, fs) => {
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
      const a = {}, m = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < m; i++) { const nm = gl.getActiveAttrib(p, i).name; if (nm.startsWith('gl_')) continue; const l = gl.getAttribLocation(p, nm); if (l >= 0) a[nm] = l; }
      return { p, u, a };
    };
    const grain = prog(`#version 300 es
      in vec2 a_corner; in vec2 a_p0; in vec2 a_p1; in float a_v0; in float a_v1; in float a_r;
      uniform float u_f; uniform vec4 u_view; uniform float u_enl; uniform float u_ppu; uniform vec2 u_win;
      out vec2 v_uv; out float v_val; out float v_rpx;
      void main() {
        vec2 p = mix(a_p0, a_p1, u_f);
        vec2 m = vec2(u_win.x - p.x, u_win.y - p.y);
        float r = a_r * u_enl;
        gl_Position = vec4((m + a_corner * r) * u_view.xy + u_view.zw, 0.0, 1.0);
        v_uv = a_corner; v_val = mix(a_v0, a_v1, u_f); v_rpx = r * u_ppu;
      }`, `#version 300 es
      precision highp float;
      in vec2 v_uv; in float v_val; in float v_rpx; uniform sampler2D u_lut; out vec4 o;
      void main() {
        float a = clamp((1.0 - length(v_uv)) * v_rpx + 0.5, 0.0, 1.0);
        if (a <= 0.0) discard;
        vec3 c = texelFetch(u_lut, ivec2(int(clamp(v_val + 0.5, 0.0, 255.0)), 0), 0).rgb;
        o = vec4(c * a, a);
      }`);
    const mantle = prog(`#version 300 es
      in vec2 a_c; in float a_e00; in float a_e01; in float a_e10; in float a_e11;
      uniform float u_f; uniform vec4 u_view; uniform vec2 u_win; uniform float u_x0;
      void main() {
        float x = u_x0 + float(gl_InstanceID) + a_c.x;
        float e = mix(mix(a_e00, a_e01, a_c.x), mix(a_e10, a_e11, a_c.x), u_f);
        float y = a_c.y < 0.5 ? e : -2000.0;
        vec2 m = vec2(u_win.x - x, u_win.y - y);
        gl_Position = vec4(m * u_view.xy + u_view.zw, 0.0, 1.0);
      }`, `#version 300 es
      precision mediump float; uniform vec3 u_col; out vec4 o; void main() { o = vec4(u_col, 1.0); }`);
    const buf = data => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; };
    const corner = buf(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
    const quad = buf(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]));
    const rad = buf(RAD);
    const lut = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lut);
    const rgba = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) rgba.set([LUT[3 * i], LUT[3 * i + 1], LUT[3 * i + 2], 255], 4 * i);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
      gl.texParameteri(gl.TEXTURE_2D, k, v);
    const vao = gl.createVertexArray();
    return { grain, mantle, corner, quad, rad, lut, vao };
  }
  function attr(loc, b, size, type, offset, divisor) {
    if (loc === undefined || loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type, false, 0, offset); gl.vertexAttribDivisor(loc, divisor);
  }
  function drawRunGL(tag, k0, k1, f) {
    const r = runs.get(tag); r.last = performance.now();
    const d = st.dpr, s = st.d.s;
    const view = new Float32Array([s * d * 2 / glc.width, -s * d * 2 / glc.height, -1, 1]);
    // mantle: trapezoids between the centers of consecutive 1-unit bins of its free surface
    const M = G.mantle; gl.useProgram(M.p);
    attr(M.a.a_c, G.quad, 2, gl.FLOAT, 0, 0);
    attr(M.a.a_e00, r.gl.env, 1, gl.FLOAT, (k0 * NB) * 4, 1);
    attr(M.a.a_e01, r.gl.env, 1, gl.FLOAT, (k0 * NB + 1) * 4, 1);
    attr(M.a.a_e10, r.gl.env, 1, gl.FLOAT, (k1 * NB) * 4, 1);
    attr(M.a.a_e11, r.gl.env, 1, gl.FLOAT, (k1 * NB + 1) * 4, 1);
    gl.uniform1f(M.u.u_f, f); gl.uniform4fv(M.u.u_view, view);
    gl.uniform2f(M.u.u_win, WX1, WY1); gl.uniform1f(M.u.u_x0, ENV_LO + 0.5); gl.uniform3fv(M.u.u_col, MANTLE);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, NB - 1);
    for (const l of Object.values(M.a)) gl.vertexAttribDivisor(l, 0);
    // grains, two passes: an underlay 1.6x the radius closes every void of the packing, then the
    // grains themselves at 1.15-1.5x (larger when a grain is only a pixel or two across)
    const P = G.grain; gl.useProgram(P.p);
    attr(P.a.a_corner, G.corner, 2, gl.FLOAT, 0, 0);
    attr(P.a.a_p0, r.gl.pos, 2, gl.FLOAT, k0 * N * 8, 1);
    attr(P.a.a_p1, r.gl.pos, 2, gl.FLOAT, k1 * N * 8, 1);
    attr(P.a.a_v0, r.gl.field, 1, gl.UNSIGNED_BYTE, k0 * N, 1);
    attr(P.a.a_v1, r.gl.field, 1, gl.UNSIGNED_BYTE, k1 * N, 1);
    attr(P.a.a_r, G.rad, 1, gl.FLOAT, 0, 1);
    const ppu = s * d, enl = 1.15 + 0.35 * Math.min(1, 0.7 / ppu);
    gl.uniform1f(P.u.u_f, f); gl.uniform4fv(P.u.u_view, view);
    gl.uniform1f(P.u.u_ppu, ppu); gl.uniform2f(P.u.u_win, WX1, WY1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G.lut); gl.uniform1i(P.u.u_lut, 0);
    gl.uniform1f(P.u.u_enl, Math.max(1.6, enl)); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N);
    gl.uniform1f(P.u.u_enl, enl); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N);
    for (const l of Object.values(P.a)) gl.vertexAttribDivisor(l, 0);
  }

  // ------------------------------------------------------------------ layout
  const stage = $('stage'), mos = $('mos'), mctx = mos.getContext('2d');
  const dstage = $('dstage'), dmos = $('dmos'), dctx = dmos.getContext('2d');
  function layout() {
    st.dpr = Math.min(3, window.devicePixelRatio || 1);
    const viewer = $('viewer');
    const W = Math.max(200, Math.floor(viewer.clientWidth - parseFloat(getComputedStyle(viewer).paddingLeft) - 2));
    st.m.W = W; st.m.H = Math.round(W * MH / MW); st.m.s = W / MW;
    // the boxes are border-box (the site's rule), so each is its content plus the 1 px border: the matrix
    // and the run then span the text column exactly, and the canvases inside are not clipped
    stage.style.width = (W + 2) + 'px'; stage.style.height = (st.m.H + 2) + 'px';
    mos.width = Math.round(W * st.dpr); mos.height = Math.round(st.m.H * st.dpr);
    mos.style.width = W + 'px'; mos.style.height = st.m.H + 'px';
    // the detail: same width as the matrix, the tile's 3:2 aspect
    st.d.W = W; st.d.H = Math.round(W * TH / TW); st.d.s = W / TW;
    dstage.style.width = (W + 2) + 'px'; dstage.style.height = (st.d.H + 2) + 'px';
    for (const c of [dmos, glc]) { c.width = Math.round(W * st.dpr); c.height = Math.round(st.d.H * st.dpr); c.style.width = W + 'px'; c.style.height = st.d.H + 'px'; }
    drawColorbar(); labels(); dirty();
  }
  function labels() {
    const cl = $('colLabels'), rl = $('rowLabels');
    if (!cl.children.length) {
      for (const t of TSS) { const s = document.createElement('span'); s.textContent = (t / 100).toFixed(2); cl.appendChild(s); }
      for (const e of ECS) { const s = document.createElement('span'); s.textContent = (e / 100).toFixed(2); rl.appendChild(s); }
    }
    for (let j = 0; j < 9; j++) cl.children[j].style.left = ((j * (TW + GAP) + TW / 2) * st.m.s + 1) + 'px';
    for (let i = 0; i < 9; i++) rl.children[i].style.top = ((i * (TH + GAP) + TH / 2) * st.m.s + 1) + 'px';
  }

  // ------------------------------------------------------------------ render
  let raf = 0;
  function dirty() { if (!raf) raf = requestAnimationFrame(render); }
  function render() {
    raf = 0;
    const dp = st.dpr, k = Math.round(st.t), s = st.m.s;
    // matrix: the nearest keyframe's image, with the selected run outlined
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, mos.width, mos.height);
    const bm = nearestBitmap(st.pre, k);
    mctx.setTransform(dp * s, 0, 0, dp * s, 0, 0);
    if (bm) { mctx.imageSmoothingEnabled = true; mctx.imageSmoothingQuality = 'high'; mctx.drawImage(bm, 0, 0, MW, MH); }
    const x0 = st.sel.col * (TW + GAP), y0 = st.sel.row * (TH + GAP);
    mctx.setTransform(dp, 0, 0, dp, 0, 0);
    mctx.lineWidth = 2; mctx.strokeStyle = ACCENT;
    mctx.strokeRect(x0 * s - 1, y0 * s - 1, TW * s + 2, TH * s + 2);
    // detail
    const tag = selTag(), vec = !!G && ready(tag);
    dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.fillStyle = '#fff'; dctx.fillRect(0, 0, dmos.width, dmos.height);
    if (!vec && bm) {                                // placeholder: the matrix image of this tile, scaled up
      const bx = bm.width / MW, by = bm.height / MH;
      dctx.setTransform(dp * st.d.s, 0, 0, dp * st.d.s, 0, 0);
      dctx.imageSmoothingEnabled = true; dctx.imageSmoothingQuality = 'high';
      dctx.drawImage(bm, x0 * bx, y0 * by, TW * bx, TH * by, 0, 0, TW, TH);
    }
    if (G) {
      gl.viewport(0, 0, glc.width, glc.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(G.vao);
      if (vec) {
        const k0 = Math.floor(st.t), k1 = Math.min(K - 1, k0 + 1);
        drawRunGL(tag, k0, k1, st.t - k0);
      }
    }
    status();
  }
  function status() {
    const n = framesLoaded(st.pre);
    $('status').textContent = n < K ? `frames ${n}/${K}` : '';
    $('dstatus').textContent = (G && !ready(selTag())) ? 'loading this run…' : '';
  }
  function values(row, col, sep) {                  // the run's parameters, named, nothing else
    return [`bond stiffness E = 10<sup>${(ECS[row] / 100).toFixed(2)}</sup>`,
            `bond strength σ<sub>c</sub> = 10<sup>${(TSS[col] / 100).toFixed(2)}</sup>`,
            `mantle drag = ${ETA_LABEL[st.pre]}`].join(sep);
  }
  function title() { $('dtitle').innerHTML = values(st.sel.row, st.sel.col, ' · '); }

  // ------------------------------------------------------------------ setters
  function setT(t) { st.t = Math.min(K - 1, Math.max(0, t)); slider.value = String(st.t); readout(); dirty(); }
  function setPre(p) { if (p === st.pre) return; st.pre = p; syncButtons(); prefetchFrames(); select(st.sel.row, st.sel.col, true); }
  function select(row, col, force) {
    if (!force && row === st.sel.row && col === st.sel.col) return;
    st.sel = { row, col };
    title(); loadSelected(); dirty();
  }

  // ------------------------------------------------------------------ matrix interaction
  function mlocal(e) { const r = stage.getBoundingClientRect(); return [e.clientX - r.left - 1, e.clientY - r.top - 1]; }
  function tileAt(px, py) {
    const mx = px / st.m.s, my = py / st.m.s;
    const col = Math.floor(mx / (TW + GAP)), row = Math.floor(my / (TH + GAP));
    if (col < 0 || col > 8 || row < 0 || row > 8) return null;
    if (mx - col * (TW + GAP) > TW || my - row * (TH + GAP) > TH) return null;
    return { row, col };
  }
  stage.addEventListener('click', e => { const t = tileAt(...mlocal(e)); if (t) select(t.row, t.col); });
  stage.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') showTip(mlocal(e)); });
  stage.addEventListener('pointerleave', hideTip);
  stage.addEventListener('keydown', e => {
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
    if (!d) return;
    e.preventDefault();
    select(Math.min(8, Math.max(0, st.sel.row + d[0])), Math.min(8, Math.max(0, st.sel.col + d[1])));
  });
  const tip = $('tip');
  function hideTip() { tip.style.display = 'none'; }
  function showTip(p) {
    const t = tileAt(p[0], p[1]);
    if (!t) { hideTip(); return; }
    tip.innerHTML = values(t.row, t.col, '<br>');
    tip.style.display = 'block';
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(st.m.W - w - 4, p[0] + 14) + 'px';
    tip.style.top = (p[1] + 16 + h > st.m.H ? p[1] - h - 10 : p[1] + 16) + 'px';
  }

  // ------------------------------------------------------------------ start
  syncButtons(); readout(); slider.value = String(st.t);
  layout(); title(); loadSelected(); dirty();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
  prefetchFrames();
})().catch(e => {
  console.error(e);
  const el = document.getElementById('status'); if (el) el.textContent = 'failed to load: ' + e.message;
});
