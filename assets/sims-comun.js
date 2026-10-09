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
  CSE.fmtV = v => Math.abs(v) >= 1 || v === 0 ? CSE.sig(v) + ' V' : CSE.sig(v * 1e3) + ' mV';
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
