/* Utilidades comunes de los simuladores CSE (canvas, ejes logarítmicos, formatos, circuitos RC) */
(function () {
  const CSE = window.CSE = window.CSE || {};
  CSE.col = {
    indigo: '#280091', azul: '#445ba6', azul2: '#4c5cc5', lavanda: '#7a86d9', verde: '#00b299', teal: '#009e91',
    cian: '#3fcfd5', cianClaro: '#9fe3e6', tinta: '#22223a', gris: '#6b6f86', linea: '#dfe3f3', suave: '#f4f6fd',
    ok: '#00a383', warn: '#d98b00', bad: '#d23c4b', naranja: '#e0701b', ch1: '#f2c94c', ch2: '#3fcfd5'
  };
  const C = CSE.col;

  // ---------- formatos en español ----------
  CSE.num = (x, d = 2) => {
    if (!isFinite(x)) return '–';
    return x.toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  };
  CSE.sig = (x, s = 3) => { if (!isFinite(x) || x === 0) return CSE.num(x); const d = Math.max(0, s - 1 - Math.floor(Math.log10(Math.abs(x)))); return CSE.num(+x.toFixed(Math.min(d, 6)), Math.min(d, 6)); };
  CSE.fmtF = f => f >= 1e6 ? CSE.sig(f / 1e6) + ' MHz' : f >= 1e3 ? CSE.sig(f / 1e3) + ' kHz' : CSE.sig(f) + ' Hz';
  CSE.fmtR = r => r >= 1e6 ? CSE.sig(r / 1e6) + ' MΩ' : r >= 1e3 ? CSE.sig(r / 1e3) + ' kΩ' : CSE.sig(r) + ' Ω';
  CSE.fmtC = c => c >= 1e-6 ? CSE.sig(c * 1e6) + ' µF' : c >= 1e-9 ? CSE.sig(c * 1e9) + ' nF' : CSE.sig(c * 1e12) + ' pF';
  CSE.fmtT = t => t >= 1 ? CSE.sig(t) + ' s' : t >= 1e-3 ? CSE.sig(t * 1e3) + ' ms' : CSE.sig(t * 1e6) + ' µs';
  CSE.fmtV = v => Math.abs(v) < 5e-4 ? '0 V' : Math.abs(v) >= 1 ? CSE.sig(v) + ' V' : CSE.sig(v * 1e3) + ' mV';
  CSE.dB = g => 20 * Math.log10(g);

  // ---------- valores normalizados ----------
  CSE.Cs = [1e-9, 2.2e-9, 4.7e-9, 10e-9, 22e-9, 33e-9, 47e-9, 100e-9, 150e-9, 220e-9, 470e-9, 1e-6, 2.2e-6, 4.7e-6, 10e-6];
  CSE.E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  CSE.Rs = []; [1e2, 1e3, 1e4, 1e5].forEach(d => CSE.E12.forEach(m => CSE.Rs.push(Math.round(m * d)))); CSE.Rs.push(1e6);
  CSE.secuencia125 = (min, max) => { const o = []; for (let e = -9; e <= 3; e++) [1, 2, 5].forEach(m => { const v = m * Math.pow(10, e); if (v >= min * 0.999 && v <= max * 1.001) o.push(+v.toPrecision(3)); }); return o; };

  // ---------- canvas nítido ----------
  CSE.canvas = (parent, W, H, opts = {}) => {
    const cv = document.createElement('canvas');
    const k = opts.scale || 2;
    cv.width = W * k; cv.height = H * k; cv.style.aspectRatio = W + ' / ' + H;
    if (opts.maxWidth) cv.style.maxWidth = opts.maxWidth + 'px';
    if (opts.label) { cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', opts.label); }
    parent.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(k, k);
    return { cv, ctx, W, H };
  };
  CSE.pos = (cv, e, W, H) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };

  // ---------- ejes ----------
  CSE.logMap = (fmin, fmax, x0, x1) => {
    const a = Math.log10(fmin), b = Math.log10(fmax);
    const fx = f => x0 + (Math.log10(f) - a) / (b - a) * (x1 - x0);
    fx.inv = x => Math.pow(10, a + (x - x0) / (x1 - x0) * (b - a));
    return fx;
  };
  CSE.linMap = (v0, v1, p0, p1) => { const f = v => p0 + (v - v0) / (v1 - v0) * (p1 - p0); f.inv = p => v0 + (p - p0) / (p1 - p0) * (v1 - v0); return f; };

  CSE.gridLog = (ctx, fx, fmin, fmax, y0, y1, opts = {}) => {
    ctx.save();
    ctx.font = (opts.font || '16px "Source Sans 3", sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let d = Math.floor(Math.log10(fmin)); d <= Math.ceil(Math.log10(fmax)); d++) {
      for (let m = 1; m <= 9; m++) {
        const f = m * Math.pow(10, d); if (f < fmin * 0.999 || f > fmax * 1.001) continue;
        const x = fx(f);
        ctx.strokeStyle = m === 1 ? '#c3c9e6' : '#eceef8'; ctx.lineWidth = m === 1 ? 1.4 : 1;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
        if (m === 1 && !opts.noLabels) { ctx.fillStyle = C.gris; ctx.fillText(CSE.fmtF(f), x, y1 + 5); }
      }
    }
    ctx.restore();
  };
  CSE.gridY = (ctx, fy, vals, x0, x1, fmt, opts = {}) => {
    ctx.save(); ctx.font = '16px "Source Sans 3", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    vals.forEach(v => {
      const y = fy(v); ctx.strokeStyle = v === 0 && opts.zero ? '#b4bbe0' : '#eceef8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.fillStyle = C.gris; ctx.fillText(fmt(v), x0 - 6, y);
    });
    ctx.restore();
  };
  CSE.label = (ctx, txt, x, y, opts = {}) => {
    ctx.save(); ctx.font = opts.font || '700 17px "Source Sans 3", sans-serif'; ctx.fillStyle = opts.color || C.tinta;
    ctx.textAlign = opts.align || 'left'; ctx.textBaseline = opts.base || 'alphabetic';
    if (opts.bg) { const w = ctx.measureText(txt).width; const ax = opts.align === 'center' ? x - w / 2 : opts.align === 'right' ? x - w : x; ctx.fillStyle = opts.bg; ctx.fillRect(ax - 4, y - 15, w + 8, 20); ctx.fillStyle = opts.color || C.tinta; }
    ctx.fillText(txt, x, y); ctx.restore();
  };
  CSE.line = (ctx, pts, color, w = 2, dash) => {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
  };

  // ---------- circuitos RC ----------
  // tipo: 'lp' (integrador, paso bajo), 'hp' (diferenciador, paso alto)
  CSE.rc = (tipo, f, fo) => {
    const x = f / fo;
    if (tipo === 'lp') return { mag: 1 / Math.sqrt(1 + x * x), fase: -Math.atan(x) * 180 / Math.PI };
    return { mag: 1 / Math.sqrt(1 + 1 / (x * x)), fase: Math.atan(1 / x) * 180 / Math.PI };
  };
  CSE.onda = (tipo, u) => { // u: fase normalizada 0..1, salida -1..1
    u = u - Math.floor(u);
    if (tipo === 'cuadrada') return u < 0.5 ? 1 : -1;
    if (tipo === 'triangular') return u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4;
    if (tipo === 'sierra') return 2 * u - 1;
    return Math.sin(2 * Math.PI * u);
  };
  // Simulación temporal de un RC de primer orden en régimen permanente; devuelve un periodo muestreado
  CSE.simRC = (tipo, onda, f, A, tau, N = 2000, offset = 0) => {
    const T = 1 / f;
    let dt = T / N, sub = 1;
    if (dt > tau / 20) { sub = Math.ceil(dt / (tau / 20)); }
    const h = dt / sub, k = 1 - Math.exp(-h / tau);
    const periodos = Math.min(400, Math.ceil(12 * tau / T) + 2);
    let vc = 0; const vin = new Float32Array(N), vout = new Float32Array(N);
    for (let p = 0; p < periodos; p++) {
      for (let i = 0; i < N; i++) {
        for (let s = 0; s < sub; s++) { const u = (i + (s + 0.5) / sub) / N; vc += (offset + A * CSE.onda(onda, u) - vc) * k; }
        if (p === periodos - 1) { const vi = offset + A * CSE.onda(onda, (i + 1) / N); vin[i] = vi; vout[i] = tipo === 'lp' ? vc : vi - vc; }
      }
    }
    return { T, vin, vout, at(arr, t) { let u = (t / T) % 1; if (u < 0) u += 1; const x = u * N; const i = Math.floor(x) % N, j = (i + 1) % N, fr = x - Math.floor(x); return arr[i] * (1 - fr) + arr[j] * fr; } };
  };

  // ---------- controles ----------
  CSE.el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  CSE.seg = (opciones, valor, onChange) => {
    const d = document.createElement('div'); d.className = 'seg'; d.setAttribute('role', 'group');
    opciones.forEach(([v, t]) => {
      const b = document.createElement('button'); b.textContent = t; b.dataset.v = v; b.setAttribute('aria-pressed', v === valor);
      if (v === valor) b.classList.add('on');
      b.addEventListener('click', () => { d.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); onChange(v); });
      d.appendChild(b);
    });
    d.set = v => d.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x.dataset.v === v); x.setAttribute('aria-pressed', x.dataset.v === v); });
    return d;
  };
  CSE.select = (opts, valor, onChange, fmt) => {
    const s = document.createElement('select');
    opts.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = fmt ? fmt(v) : v; if (Math.abs(v - valor) < 1e-15 * Math.max(1, Math.abs(v)) || v === valor) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', () => onChange(+s.value)); return s;
  };
  // deslizador logarítmico
  CSE.logSlider = (min, max, valor, onInput) => {
    const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 1000; s.step = 1;
    const a = Math.log10(min), b = Math.log10(max);
    s.get = () => Math.pow(10, a + (b - a) * s.value / 1000);
    s.set = v => { s.value = Math.round(1000 * (Math.log10(v) - a) / (b - a)); };
    s.set(valor); s.addEventListener('input', () => onInput(s.get())); return s;
  };

  // ---------- resolver f(x) = 0 por bisección (f creciente) ----------
  CSE.biseccion = (f, a, b, n = 80) => { for (let i = 0; i < n; i++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; } return (a + b) / 2; };

  // ---------- osciloscopio genérico reutilizable ----------
  // cfg.senales() -> { T, ch1: t => V, ch2: t => V, n1, n2 (nombres) }
  CSE.osciloscopio = (cont, cfg) => {
    const S = Object.assign({ v1: 1, v2: 1, tdiv: 1e-3, xy: false, inv2: false, ac1: false, ac2: false, cur: false, c1: 1, c2: 3, sel: null }, cfg.inicial || {});
    const VD = CSE.secuencia125(0.001, 20), TD = CSE.secuencia125(1e-6, 0.05);
    const fmtVd = v => v >= 1 ? CSE.num(v) + ' V' : CSE.num(v * 1000) + ' mV';
    const fmtTd = t => t >= 1e-3 ? CSE.num(t * 1e3) + ' ms' : CSE.num(t * 1e6) + ' µs';
    const g = CSE.el(`<div style="display:grid;grid-template-columns:${cfg.ancho || 700}px 1fr;gap:18px;align-items:start"></div>`);
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b); cont.append(g);
    const sc = CSE.canvas(a, 820, 660, { label: 'Pantalla del osciloscopio' });
    sc.cv.style.background = '#0b1030'; sc.cv.style.borderRadius = '10px';
    if (cfg.controles) b.append(cfg.controles);
    const fila = (lab, ...els) => { const d = CSE.el('<div class="ctl"></div>'); if (lab) d.append(CSE.el(`<label style="min-width:90px">${lab}</label>`)); d.append(...els); return d; };
    const s1 = CSE.select(VD, S.v1, v => { S.v1 = v; draw(); }, v => 'CH1 ' + fmtVd(v) + '/div');
    const s2 = CSE.select(VD, S.v2, v => { S.v2 = v; draw(); }, v => 'CH2 ' + fmtVd(v) + '/div');
    const st = CSE.select(TD, S.tdiv, v => { S.tdiv = v; draw(); }, v => fmtTd(v) + '/div');
    const bAuto = CSE.el('<button class="btn sm verde">AUTOSET</button>');
    const tog = (txt, k) => { const bt = CSE.el(`<button class="btn sm sec" aria-pressed="${S[k]}">${txt}</button>`); bt.addEventListener('click', () => { S[k] = !S[k]; bt.setAttribute('aria-pressed', S[k]); draw(); }); return bt; };
    if (cfg.sinAutoset) bAuto.style.display = 'none';
    const filas = [cfg.soloCH1 ? fila('Escalas', s1) : fila('Escalas', s1, s2), fila('', st, bAuto)];
    const extra = [];
    if (cfg.conXY) extra.push(tog('Modo XY', 'xy'));
    if (cfg.conInv) extra.push(tog('Invertir CH2', 'inv2'));
    if (cfg.conAC) { extra.push(tog('CH1 en AC', 'ac1')); if (!cfg.soloCH1) extra.push(tog('CH2 en AC', 'ac2')); }
    if (cfg.conCursores !== false) extra.push(tog('Cursores', 'cur'));
    if (extra.length) filas.push(fila('Modos', ...extra));
    const meds = CSE.el('<div style="margin-top:6px"></div>');
    b.append(...filas, meds);
    let sen = null;
    const muestras = (fn, T, ac) => { const n = 600, arr = new Float64Array(n); let s = 0; for (let i = 0; i < n; i++) { arr[i] = fn(i / n * T); s += arr[i]; } const m = s / n; if (ac) for (let i = 0; i < n; i++) arr[i] -= m; return arr; };
    const stats = arr => { let mn = 1e9, mx = -1e9, s = 0, q = 0; arr.forEach(v => { mn = Math.min(mn, v); mx = Math.max(mx, v); s += v; q += v * v; }); return { mn, mx, pp: mx - mn, med: s / arr.length, rms: Math.sqrt(q / arr.length) }; };
    function autoset() {
      sen = cfg.senales(); const A = stats(muestras(sen.ch1, sen.T, S.ac1)), B = stats(muestras(sen.ch2, sen.T, S.ac2));
      const pick = (lst, x) => lst.find(v => v >= x) || lst[lst.length - 1];
      S.v1 = pick(VD, Math.max(Math.abs(A.mx), Math.abs(A.mn)) / 3.6); S.v2 = pick(VD, Math.max(Math.abs(B.mx), Math.abs(B.mn)) / 3.6); S.tdiv = pick(TD, 2.2 * sen.T / 10);
      s1.value = S.v1; s2.value = S.v2; st.value = S.tdiv; draw();
    }
    bAuto.addEventListener('click', autoset);
    const X0 = 10, Y0 = 10, DIV = 80, cx = X0 + 5 * DIV, cy = Y0 + 4 * DIV;
    function draw() {
      sen = cfg.senales();
      const { ctx, W, H } = sc; ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(159,227,230,.18)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(X0 + i * DIV, Y0); ctx.lineTo(X0 + i * DIV, Y0 + 8 * DIV); ctx.stroke(); }
      for (let j = 0; j <= 8; j++) { ctx.beginPath(); ctx.moveTo(X0, Y0 + j * DIV); ctx.lineTo(X0 + 10 * DIV, Y0 + j * DIV); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(159,227,230,.35)';
      for (let i = 0; i <= 50; i++) { const x = X0 + i * DIV / 5; ctx.beginPath(); ctx.moveTo(x, cy - 4); ctx.lineTo(x, cy + 4); ctx.stroke(); }
      for (let j = 0; j <= 40; j++) { const y = Y0 + j * DIV / 5; ctx.beginPath(); ctx.moveTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.stroke(); }
      const A = muestras(sen.ch1, sen.T, S.ac1), B = muestras(sen.ch2, sen.T, S.ac2);
      const mA = S.ac1 ? stats(muestras(sen.ch1, sen.T, false)).med : 0, mB = S.ac2 ? stats(muestras(sen.ch2, sen.T, false)).med : 0;
      const f1 = t => sen.ch1(t) - mA, f2 = t => (S.inv2 ? -1 : 1) * (sen.ch2(t) - mB);
      const clampY = y => Math.max(Y0 - 2, Math.min(Y0 + 8 * DIV + 2, y)), clampX = x => Math.max(X0 - 2, Math.min(X0 + 10 * DIV + 2, x));
      const linea = (pts, col) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore(); };
      if (S.xy) {
        const pts = []; for (let i = 0; i <= 800; i++) { const t = i / 800 * sen.T; pts.push([clampX(cx + f1(t) / S.v1 * DIV), clampY(cy - f2(t) / S.v2 * DIV)]); }
        linea(pts, '#7dff9a');
        ctx.fillStyle = '#fff'; ctx.font = '700 17px "Source Sans 3"'; ctx.fillText('MODO XY · X = CH1 (' + fmtVd(S.v1) + '/div) · Y = CH2' + (S.inv2 ? ' invertido' : '') + ' (' + fmtVd(S.v2) + '/div)', X0 + 8, Y0 + 8 * DIV - 12);
      } else {
        const tr = (fn, vd, col) => { const pts = []; for (let px = 0; px <= 10 * DIV; px++) { const t = (px / DIV - 1) * S.tdiv; let u = t % sen.T; if (u < 0) u += sen.T; pts.push([X0 + px, clampY(cy - fn(u) / vd * DIV)]); } linea(pts, col); };
        tr(f1, S.v1, C.ch1); if (!cfg.soloCH1) tr(f2, S.v2, C.ch2);
        const yl = Y0 + 8 * DIV - 12; ctx.font = '700 17px "Source Sans 3"';
        ctx.fillStyle = C.ch1; ctx.fillText('CH1 ' + fmtVd(S.v1) + '/div' + (S.ac1 ? ' AC' : ''), X0 + 8, yl);
        if (!cfg.soloCH1) { ctx.fillStyle = C.ch2; ctx.fillText('CH2 ' + fmtVd(S.v2) + '/div' + (S.ac2 ? ' AC' : '') + (S.inv2 ? ' INV' : ''), X0 + 170, yl); }
        ctx.fillStyle = '#fff'; ctx.fillText('M ' + fmtTd(S.tdiv) + '/div', X0 + 350, yl);
        ctx.fillStyle = C.ch1; ctx.font = '800 16px Archivo'; ctx.fillText('1▶', X0 - 2, cy - 2);
        if (S.cur) {
          [S.c1, S.c2].forEach((c, i) => { const x = X0 + c * DIV; ctx.save(); ctx.strokeStyle = '#ff9f6b'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y0 + 8 * DIV); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#ff9f6b'; ctx.font = '800 16px Archivo'; ctx.fillText(i ? 'b' : 'a', x + 4, Y0 + 18); });
          const dt = Math.abs(S.c2 - S.c1) * S.tdiv; ctx.fillStyle = '#ff9f6b'; ctx.font = '700 17px "Source Sans 3"'; ctx.fillText('Δt = ' + CSE.fmtT(dt) + '  1/Δt = ' + CSE.fmtF(1 / dt), X0 + 520, Y0 + 24);
        }
      }
      const a1 = stats(A), b1 = stats(B.map(v => (S.inv2 ? -v : v)));
      const kp = (k, v, col) => `<span class="kpi"><span class="k">${k}</span><span class="v" style="${col ? 'color:' + col : ''}">${v}</span></span>`;
      if (cfg.compacto) meds.innerHTML = `<div>${kp('CH1 Vpp', CSE.fmtV(a1.pp), '#b58b00')}${kp('CH2 Vpp', CSE.fmtV(b1.pp), '#0a8a92')}</div>` + (cfg.extraMedidas ? cfg.extraMedidas(S) : ''); else
      meds.innerHTML = `<div>${kp('CH1 Vmáx', CSE.fmtV(a1.mx), '#b58b00')}${kp('CH1 Vpp', CSE.fmtV(a1.pp), '#b58b00')}${kp('CH1 Vmed', CSE.fmtV(a1.med), '#b58b00')}</div>` +
        (cfg.soloCH1 ? '' : `<div style="margin-top:6px">${kp('CH2 Vmáx', CSE.fmtV(b1.mx), '#0a8a92')}${kp('CH2 Vpp', CSE.fmtV(b1.pp), '#0a8a92')}${kp('CH2 Vmed', CSE.fmtV(b1.med), '#0a8a92')}${kp('CH2 Vrms', CSE.fmtV(b1.rms), '#0a8a92')}</div>`) +
        (cfg.extraMedidas ? cfg.extraMedidas(S) : '');
      if (cfg.onDraw) cfg.onDraw(S);
    }
    sc.cv.addEventListener('pointerdown', e => { if (!S.cur || S.xy) return; const p = CSE.pos(sc.cv, e, sc.W, sc.H); const d = (p.x - X0) / DIV; S.sel = Math.abs(d - S.c1) < Math.abs(d - S.c2) ? 'c1' : 'c2'; S[S.sel] = Math.max(0, Math.min(10, d)); sc.cv.setPointerCapture(e.pointerId); draw(); });
    sc.cv.addEventListener('pointermove', e => { if (!S.sel) return; const p = CSE.pos(sc.cv, e, sc.W, sc.H); S[S.sel] = Math.max(0, Math.min(10, (p.x - X0) / DIV)); draw(); });
    sc.cv.addEventListener('pointerup', () => S.sel = null);
    return { draw, autoset, S };
  };

  // ---------- entrenador de examen genérico ----------
  // variantes: [{ nombre, enunciado, campos: [{ k, t, sol, tol (relativa, p. ej. 0.03) | abs, nota? }], solucion: html }]
  CSE.entrenador = (root, variantes) => {
    let cur = 0;
    root.innerHTML = `<div class="ctl"><label>Convocatoria</label><select class="sel"></select><button class="btn sm verde azar">Enunciado al azar</button></div>
      <div class="card enun" style="font-size:20px;border-top-color:#00b299;margin:8px 0"></div>
      <table><thead><tr><th>Apartado</th><th>Tu respuesta</th><th>Comprobación</th></tr></thead><tbody></tbody></table>
      <div class="ctl" style="margin-top:8px"><button class="btn sm verde chk">Comprobar</button><button class="btn sm sec sol">Ver solución</button></div><div class="res"></div>`;
    const sel = root.querySelector('.sel'), tb = root.querySelector('tbody');
    variantes.forEach((v, i) => { const o = document.createElement('option'); o.value = i; o.textContent = v.nombre; sel.appendChild(o); });
    const num = s => parseFloat(String(s).replace(',', '.'));
    function carga(i) {
      cur = i; sel.value = i; const v = variantes[i];
      root.querySelector('.enun').innerHTML = v.enunciado;
      tb.innerHTML = v.campos.map(c => `<tr><td>${c.t}</td><td><input class="cell" style="width:120px" data-k="${c.k}" inputmode="decimal"></td><td class="ck" data-k="${c.k}"></td></tr>`).join('');
      root.querySelector('.res').innerHTML = '';
    }
    root.querySelector('.chk').addEventListener('click', () => {
      const v = variantes[cur]; let ok = 0;
      v.campos.forEach(c => {
        const inp = tb.querySelector(`input[data-k="${c.k}"]`), ck = tb.querySelector(`.ck[data-k="${c.k}"]`), x = num(inp.value);
        if (!isFinite(x)) { ck.innerHTML = ''; return; }
        const bien = c.abs !== undefined ? Math.abs(x - c.sol) <= c.abs : Math.abs(x - c.sol) <= Math.abs(c.sol) * (c.tol || 0.03);
        let nota = ''; if (!bien && c.signo && Math.abs(x + c.sol) <= Math.abs(c.sol) * (c.tol || 0.03)) nota = ' (¡revisa el signo!)';
        if (bien) ok++; ck.innerHTML = `<span class="pill ${bien ? 'ok' : 'bad'}">${bien ? 'Bien' : 'Revisa'}</span>${nota}`;
      });
      root.querySelector('.res').innerHTML = `<div class="msg ${ok === v.campos.length ? 'ok' : 'info'}">${ok} de ${v.campos.length} apartados correctos.${ok === v.campos.length ? ' ¡Listo para el examen!' : ''}</div>`;
    });
    root.querySelector('.sol').addEventListener('click', () => { root.querySelector('.res').innerHTML = `<div class="msg ok"><b>Solución.</b> ${variantes[cur].solucion}</div>`; });
    sel.addEventListener('change', () => carga(+sel.value));
    root.querySelector('.azar').addEventListener('click', () => carga(Math.floor(Math.random() * variantes.length)));
    carga(variantes.length - 1);
  };

  // ---------- reloj de animación sólo mientras la diapositiva está visible ----------
  CSE.animar = (root, paso) => {
    let id = null, last = 0;
    const visible = () => { const s = root.closest('section'); return s && s.classList.contains('present'); };
    const loop = ts => { const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts; if (visible()) paso(dt); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop); return () => cancelAnimationFrame(id);
  };

  // registro de simuladores: se montan cuando el DOM está listo
  CSE.sims = CSE.sims || {};
  CSE.registrar = (nombre, fn) => { CSE.sims[nombre] = fn; };
  CSE.montarTodo = () => document.querySelectorAll('[data-sim]').forEach(el => {
    if (el.dataset.montado) return; const fn = CSE.sims[el.dataset.sim]; if (!fn) return;
    el.dataset.montado = 1; el.classList.add('sim');
    try { fn(el, el.dataset); } catch (e) { console.error('Simulador', el.dataset.sim, e); el.innerHTML = '<p>Error al cargar el simulador.</p>'; }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(CSE.montarTodo, 0)); else setTimeout(CSE.montarTodo, 0);
})();
