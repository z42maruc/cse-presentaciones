/* Simuladores de la Práctica 1 · Filtros pasivos RC */
(function () {
  const CSE = window.CSE, C = CSE.col;

  /* =====================================================================
     1. LABORATORIO DE FILTROS: ¿qué señales pasan y cuáles no?
     ===================================================================== */
  CSE.registrar('filterlab', (root) => {
    const S = {
      tipo: 'lp', R: 56000, Cap: 10e-9, f1: 30, f2: 10000, reto: 'libre', play: null,
      comps: [
        { f: 50, A: 1, n: 'Zumbido red', on: true },
        { f: 150, A: 1, n: 'Voz grave', on: true },
        { f: 440, A: 1, n: 'Nota La', on: false },
        { f: 1000, A: 1, n: 'Tono 1 kHz', on: true },
        { f: 5000, A: 1, n: 'Pitido', on: false },
        { f: 12000, A: 1, n: 'Agudo', on: true },
        { f: 2000, A: 1, n: 'Tu señal', on: false, libre: true }
      ]
    };
    const RETOS = {
      libre: { t: 'Exploración libre' },
      r1: { t: 'Reto 1 · Quita el pitido agudo', tipo: 'lp', on: [3, 5], d: 'Conserva el tono de 1 kHz (≥ −3 dB) y atenúa el agudo de 12 kHz al menos 10 dB.',
        c: [[3, '≥', -3], [5, '≤', -10]] },
      r2: { t: 'Reto 2 · Quita el zumbido de la red', tipo: 'hp', on: [0, 2], d: 'Atenúa los 50 Hz al menos 6 dB sin bajar de −3 dB la nota La (440 Hz).',
        c: [[0, '≤', -6], [2, '≥', -3]] },
      r3: { t: 'Reto 3 · ¿Imposible?', tipo: 'hp', on: [0, 1], d: 'Atenúa los 50 Hz al menos 20 dB y deja la voz de 150 Hz por encima de −3 dB.',
        c: [[0, '≤', -20], [1, '≥', -3]], pista: 'Entre 50 Hz y 150 Hz no hay ni media década. Un filtro RC (primer orden) sólo cae 20 dB por década: ¡no le da tiempo! Haría falta un filtro de orden superior (más pendiente), como los filtros activos de la Práctica 6.' },
      r4: { t: 'Reto 4 · Paso banda: aísla la nota La', tipo: 'bp', on: [0, 2, 4], d: 'Con un paso alto y un paso bajo en cascada: 440 Hz ≥ −3 dB, 50 Hz y 5 kHz ≤ −10 dB.',
        c: [[2, '≥', -3], [0, '≤', -10], [4, '≤', -10]] }
    };
    const fo = () => 1 / (2 * Math.PI * S.R * S.Cap);
    const G = f => {
      if (S.tipo === 'bp') { const a = CSE.rc('hp', f, S.f1), b = CSE.rc('lp', f, S.f2); return { mag: a.mag * b.mag, fase: a.fase + b.fase }; }
      return CSE.rc(S.tipo, f, fo());
    };

    root.innerHTML = '';
    const top = CSE.el('<div class="ctl"></div>');
    const segTipo = CSE.seg([['lp', 'Paso bajo (integrador)'], ['hp', 'Paso alto (diferenciador)'], ['bp', 'Paso banda (ampliación)']], S.tipo, v => { S.tipo = v; sync(); });
    top.append(segTipo);
    const rcBox = CSE.el('<span class="ctl" style="margin:0"></span>');
    const sR = CSE.logSlider(1000, 1e6, S.R, v => { S.R = v; vR.textContent = CSE.fmtR(v); draw(); });
    const vR = CSE.el(`<span class="val">${CSE.fmtR(S.R)}</span>`);
    const selC = CSE.select(CSE.Cs, S.Cap, v => { S.Cap = v; draw(); }, CSE.fmtC);
    rcBox.append(CSE.el('<label>R</label>'), sR, vR, CSE.el('<label>C</label>'), selC);
    const bpBox = CSE.el('<span class="ctl" style="margin:0"></span>');
    const s1 = CSE.logSlider(10, 50000, S.f1, v => { S.f1 = v; v1.textContent = CSE.fmtF(v); draw(); });
    const v1 = CSE.el(`<span class="val">${CSE.fmtF(S.f1)}</span>`);
    const s2 = CSE.logSlider(10, 50000, S.f2, v => { S.f2 = v; v2.textContent = CSE.fmtF(v); draw(); });
    const v2 = CSE.el(`<span class="val">${CSE.fmtF(S.f2)}</span>`);
    bpBox.append(CSE.el('<label>f<sub>c1</sub> (paso alto)</label>'), s1, v1, CSE.el('<label>f<sub>c2</sub> (paso bajo)</label>'), s2, v2);
    const kFo = CSE.el('<span class="kpi"><span class="k">f<sub>o</sub> = 1/(2πRC)</span><span class="v">–</span></span>');
    const bPre = CSE.el('<button class="btn sm sec">56 kΩ · 10 nF (práctica)</button>');
    bPre.addEventListener('click', () => { S.R = 56000; S.Cap = 10e-9; sR.set(S.R); vR.textContent = CSE.fmtR(S.R); selC.value = S.Cap; draw(); });
    top.append(rcBox, bpBox, kFo, bPre);

    const chips = CSE.el('<div class="ctl" style="margin:4px 0"><label>Señales de entrada:</label></div>');
    const fLibre = CSE.logSlider(10, 50000, 2000, v => { S.comps[6].f = v; S.comps[6].n = 'Tu señal'; pintaChips(); draw(); });
    fLibre.style.width = '150px';
    function pintaChips() {
      chips.querySelectorAll('.chip').forEach(c => c.remove());
      S.comps.forEach((c, i) => {
        const b = CSE.el(`<button class="chip ${c.on ? 'on' : ''}" aria-pressed="${c.on}"><span class="dot"></span>${c.n} · ${CSE.fmtF(c.f)}</button>`);
        if (c.on) b.style.background = C.azul2;
        b.addEventListener('click', () => { c.on = !c.on; pintaChips(); draw(); actualizaAudio(); });
        chips.insertBefore(b, fLibre);
      });
    }
    chips.append(fLibre);

    const grid = CSE.el('<div style="display:grid;grid-template-columns:1fr 360px;gap:16px;align-items:start"></div>');
    const izq = document.createElement('div'), der = document.createElement('div');
    grid.append(izq, der);
    const esp = CSE.canvas(izq, 1060, 270, { label: 'Espectro de entrada y salida del filtro' });
    const tie = CSE.canvas(izq, 1060, 170, { label: 'Señales de entrada y salida en el tiempo' });
    tie.cv.style.marginTop = '8px';

    // panel derecho: retos y audio
    const selReto = document.createElement('select');
    Object.entries(RETOS).forEach(([k, r]) => { const o = document.createElement('option'); o.value = k; o.textContent = r.t; selReto.appendChild(o); });
    selReto.style.width = '100%';
    const retoBox = CSE.el('<div class="reto"></div>');
    const audio = CSE.el(`<div style="margin-top:12px"><label>Escúchalo</label><div class="ctl">
      <button class="btn sm sec" data-a="in">▶ Entrada</button><button class="btn sm verde" data-a="out">▶ Salida filtrada</button><button class="btn sm sec" data-a="stop">■</button></div>
      <div class="tiny muted" style="font-size:16px">Los 50 Hz apenas se oyen en altavoces pequeños: ¡ellos mismos filtran los graves!</div></div>`);
    const leyenda = CSE.el(`<div style="margin-top:12px;font-size:18px;line-height:1.6">
      <span class="pill ok">PASA</span> |G| ≥ 0,707 (≥ −3 dB)<br><span class="pill warn">ATENUADA</span> entre −3 y −20 dB<br><span class="pill bad">BLOQUEADA</span> < −20 dB (menos de 1/10)</div>`);
    der.append(CSE.el('<label>Modo</label>'), selReto, retoBox, audio, leyenda);
    root.append(top, chips, grid);

    selReto.addEventListener('change', () => {
      S.reto = selReto.value; const r = RETOS[S.reto];
      if (r.tipo) { S.tipo = r.tipo; segTipo.set(r.tipo); S.comps.forEach((c, i) => c.on = r.on.includes(i)); pintaChips(); }
      sync();
    });

    function sync() { rcBox.style.display = S.tipo === 'bp' ? 'none' : ''; bpBox.style.display = S.tipo === 'bp' ? '' : 'none'; kFo.style.display = S.tipo === 'bp' ? 'none' : ''; bPre.style.display = kFo.style.display; draw(); actualizaAudio(); }

    function veredicto(g) { return g >= 0.7071 ? ['ok', 'PASA', C.ok] : g >= 0.1 ? ['warn', 'ATENUADA', C.warn] : ['bad', 'BLOQUEADA', C.bad]; }

    function draw() {
      kFo.querySelector('.v').textContent = CSE.fmtF(fo());
      // --- espectro ---
      const { ctx, W, H } = esp; ctx.clearRect(0, 0, W, H);
      const x0 = 60, x1 = W - 20, y0 = 26, y1 = H - 30, fmin = 10, fmax = 1e5;
      const fx = CSE.logMap(fmin, fmax, x0, x1), fy = CSE.linMap(0, 1.32, y1, y0);
      // zona de paso
      ctx.save(); ctx.fillStyle = 'rgba(0,178,153,.08)';
      let inside = false, xs = 0;
      for (let x = x0; x <= x1; x += 2) { const g = G(fx.inv(x)).mag >= 0.7071; if (g && !inside) { inside = true; xs = x; } if ((!g || x + 2 > x1) && inside) { inside = false; ctx.fillRect(xs, y0, x - xs, y1 - y0); } }
      ctx.restore();
      CSE.gridLog(ctx, fx, fmin, fmax, y0, y1);
      CSE.gridY(ctx, fy, [0, 0.25, 0.5, 0.707, 1], x0, x1, v => v === 0.707 ? '0,707' : CSE.num(v), { zero: true });
      CSE.label(ctx, 'Amplitud (V) y |G|', x0, 16, { color: C.gris, font: '700 16px "Source Sans 3"' });
      CSE.label(ctx, 'Frecuencia (eje logarítmico)', x1, 16, { color: C.gris, align: 'right', font: '700 16px "Source Sans 3"' });
      // curva |G|
      const pts = []; for (let x = x0; x <= x1; x += 2) pts.push([x, fy(G(fx.inv(x)).mag)]);
      CSE.line(ctx, pts, C.indigo, 3);
      // frecuencias de corte
      const cortes = S.tipo === 'bp' ? [S.f1, S.f2] : [fo()];
      cortes.forEach(fc => { if (fc < fmin || fc > fmax) return; const x = fx(fc); CSE.line(ctx, [[x, y0], [x, y1]], C.indigo, 1.5, [5, 5]); CSE.label(ctx, 'fc ' + CSE.fmtF(fc), x + 4, y1 - 8, { color: C.indigo, bg: 'rgba(255,255,255,.85)' }); });
      // barras
      S.comps.filter(c => c.on).forEach(c => {
        const x = fx(c.f), g = G(c.f).mag, [, txt, col] = veredicto(g);
        ctx.fillStyle = 'rgba(122,134,217,.25)'; ctx.strokeStyle = C.lavanda; ctx.lineWidth = 2;
        ctx.fillRect(x - 9, fy(c.A), 18, y1 - fy(c.A)); ctx.strokeRect(x - 9, fy(c.A), 18, y1 - fy(c.A));
        ctx.fillStyle = col; ctx.fillRect(x - 5, fy(c.A * g), 10, y1 - fy(c.A * g));
        CSE.label(ctx, txt, x, fy(1.24), { align: 'center', color: col, font: '800 15px Archivo' });
        CSE.label(ctx, CSE.num(CSE.dB(g), 1) + ' dB', x, fy(Math.max(c.A * g, 0.06)) - 6, { align: 'center', color: C.tinta, font: '700 15px "Source Sans 3"', bg: 'rgba(255,255,255,.85)' });
      });
      // --- tiempo ---
      const t = tie; t.ctx.clearRect(0, 0, t.W, t.H);
      const on = S.comps.filter(c => c.on);
      const fminOn = on.length ? Math.min(...on.map(c => c.f)) : 100;
      const Tw = Math.min(0.1, Math.max(0.002, 2 / fminOn));
      const amp = Math.max(1, on.reduce((a, c) => a + c.A, 0));
      const tx = CSE.linMap(0, Tw, x0, x1), ty = CSE.linMap(-amp, amp, t.H - 26, 14);
      CSE.gridY(t.ctx, ty, [-amp, 0, amp], x0, x1, v => CSE.num(v, 1) + ' V', { zero: true });
      for (let k = 0; k <= 10; k++) { const x = x0 + k * (x1 - x0) / 10; t.ctx.strokeStyle = '#eceef8'; t.ctx.beginPath(); t.ctx.moveTo(x, 14); t.ctx.lineTo(x, t.H - 26); t.ctx.stroke(); }
      CSE.label(t.ctx, CSE.fmtT(Tw / 10) + '/div', x1, t.H - 8, { align: 'right', color: C.gris, font: '700 16px "Source Sans 3"' });
      const pin = [], pout = [];
      for (let x = x0; x <= x1; x += 1) {
        const tt = tx.inv(x); let a = 0, b = 0;
        on.forEach(c => { const g = G(c.f); a += c.A * Math.sin(2 * Math.PI * c.f * tt); b += c.A * g.mag * Math.sin(2 * Math.PI * c.f * tt + g.fase * Math.PI / 180); });
        pin.push([x, ty(a)]); pout.push([x, ty(b)]);
      }
      CSE.line(t.ctx, pin, 'rgba(122,134,217,.75)', 2);
      CSE.line(t.ctx, pout, C.teal, 3);
      CSE.label(t.ctx, '━ Entrada', x0 + 6, 28, { color: C.lavanda, font: '800 17px Archivo' });
      CSE.label(t.ctx, '━ Salida', x0 + 130, 28, { color: C.teal, font: '800 17px Archivo' });
      // --- reto ---
      const r = RETOS[S.reto];
      if (!r.c) { retoBox.innerHTML = '<div style="font-size:19px">Activa y desactiva señales, cambia R y C o el tipo de filtro y observa qué componentes atraviesan el circuito. Prueba la <b>onda que tú elijas</b> con el deslizador de "Tu señal".</div>'; return; }
      const okAll = r.c.every(([i, op, v]) => { const d = CSE.dB(G(S.comps[i].f).mag); return op === '≥' ? d >= v : d <= v; });
      retoBox.innerHTML = `<div style="font-size:19px;margin-bottom:6px">${r.d}</div>` + r.c.map(([i, op, v]) => {
        const d = CSE.dB(G(S.comps[i].f).mag), ok = op === '≥' ? d >= v : d <= v;
        return `<span class="cond ${ok ? 'ok' : ''}">${CSE.fmtF(S.comps[i].f)}: ${CSE.num(d, 1)} dB (objetivo ${op} ${v} dB)</span>`;
      }).join('') + (okAll ? '<div class="msg ok">¡Conseguido! Anota los valores de R y C (o de las f<sub>c</sub>).</div>' : '') +
        (r.pista ? '<details style="margin-top:6px;font-size:18px"><summary style="cursor:pointer;font-weight:700;color:#445ba6">¿No lo consigues? Pista</summary>' + r.pista + '</details>' : '');
    }

    // --- audio con WebAudio ---
    let actx = null, nodos = [];
    function para() { nodos.forEach(n => { try { n.o.stop(); } catch (e) {} }); nodos = []; S.play = null; }
    function suena(modo) {
      para(); actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume();
      const on = S.comps.filter(c => c.on); const master = actx.createGain(); master.gain.value = 0.18 / Math.max(1, on.length); master.connect(actx.destination);
      on.forEach(c => { const o = actx.createOscillator(); o.frequency.value = c.f; const g = actx.createGain(); g.gain.value = modo === 'out' ? G(c.f).mag : 1; o.connect(g); g.connect(master); o.start(); nodos.push({ o, g, c }); });
      S.play = modo;
    }
    function actualizaAudio() { if (S.play) suena(S.play); }
    audio.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const a = b.dataset.a; if (a === 'stop') para(); else suena(a); }));
    const rv = () => { if (window.Reveal) window.Reveal.on('slidechanged', para); }; if (window.Reveal && window.Reveal.on) rv(); else document.addEventListener('cse:ready', rv);
    [sR, selC, s1, s2].forEach(x => x.addEventListener('input', actualizaAudio));

    pintaChips(); sync();
  });

  /* =====================================================================
     2. DUALIDAD TIEMPO-FRECUENCIA: construir una onda sumando armónicos
     ===================================================================== */
  CSE.registrar('fourier', (root) => {
    const S = { onda: 'cuadrada', N: 5, f0: 100, filtro: false, fc: 300 };
    const coef = (n) => { // amplitud y fase (rad) del armónico n (A = 1)
      if (S.onda === 'cuadrada') return n % 2 ? 4 / (Math.PI * n) : 0;
      if (S.onda === 'triangular') return n % 2 ? 8 / (Math.PI * Math.PI * n * n) * (((n - 1) / 2) % 2 ? -1 : 1) : 0;
      return 2 / (Math.PI * n) * (n % 2 ? 1 : -1); // sierra
    };
    root.innerHTML = '';
    const ctl = CSE.el('<div class="ctl"></div>');
    ctl.append(CSE.seg([['cuadrada', 'Cuadrada'], ['triangular', 'Triangular'], ['sierra', 'Diente de sierra']], S.onda, v => { S.onda = v; draw(); }));
    const sN = CSE.el('<input type="range" min="1" max="40" value="5">'); const vN = CSE.el('<span class="val"></span>');
    sN.addEventListener('input', () => { S.N = +sN.value; draw(); });
    ctl.append(CSE.el('<label>Armónicos sumados</label>'), sN, vN);
    const ctl2 = CSE.el('<div class="ctl"></div>');
    const chk = CSE.el('<button class="btn sm sec" aria-pressed="false">Pasar por un paso bajo RC</button>');
    chk.addEventListener('click', () => { S.filtro = !S.filtro; chk.setAttribute('aria-pressed', S.filtro); draw(); });
    const sFc = CSE.logSlider(30, 10000, S.fc, v => { S.fc = v; draw(); }); const vFc = CSE.el('<span class="val"></span>');
    ctl2.append(chk, CSE.el('<label>f<sub>c</sub></label>'), sFc, vFc);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.25fr 1fr;gap:14px"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const ct = CSE.canvas(a, 760, 380, { label: 'Señal en el dominio del tiempo' });
    const cf = CSE.canvas(b, 600, 380, { label: 'Espectro de la señal' });
    root.append(ctl, ctl2, g);
    function draw() {
      vN.textContent = S.N; vFc.textContent = CSE.fmtF(S.fc); sFc.disabled = !S.filtro;
      const harm = []; for (let n = 1; n <= S.N; n++) { const A = coef(n); if (A === 0) continue; const f = n * S.f0; const gg = S.filtro ? CSE.rc('lp', f, S.fc) : { mag: 1, fase: 0 }; harm.push({ n, f, A, mag: gg.mag, ph: gg.fase * Math.PI / 180 }); }
      // tiempo
      let { ctx, W, H } = ct; ctx.clearRect(0, 0, W, H);
      const x0 = 56, x1 = W - 14, tx = CSE.linMap(0, 2 / S.f0, x0, x1), ty = CSE.linMap(-1.5, 1.5, H - 30, 20);
      CSE.gridY(ctx, ty, [-1, 0, 1], x0, x1, v => CSE.num(v) + ' V', { zero: true });
      CSE.label(ctx, 'Dominio del TIEMPO (lo que ve el osciloscopio)', x0, 14, { color: C.azul, font: '800 17px Archivo' });
      const ideal = [], suma = [];
      for (let x = x0; x <= x1; x++) { const t = tx.inv(x); ideal.push([x, ty(CSE.onda(S.onda, t * S.f0 + (S.onda === 'sierra' ? 0.5 : 0)))]); let s = 0; harm.forEach(h => s += h.A * h.mag * Math.sin(2 * Math.PI * h.f * t + h.ph)); suma.push([x, ty(s)]); }
      if (S.onda === 'triangular') { ideal.length = 0; for (let x = x0; x <= x1; x++) { const t = tx.inv(x); let s = 0; for (let n = 1; n < 400; n += 2) s += coef(n) * Math.sin(2 * Math.PI * n * S.f0 * t); ideal.push([x, ty(s)]); } }
      CSE.line(ctx, ideal, 'rgba(122,134,217,.6)', 2, [6, 5]);
      CSE.line(ctx, suma, S.filtro ? C.teal : C.indigo, 3);
      CSE.label(ctx, '2 periodos · T = ' + CSE.fmtT(1 / S.f0), x1, H - 8, { align: 'right', color: C.gris, font: '700 16px "Source Sans 3"' });
      // frecuencia
      ({ ctx, W, H } = cf); ctx.clearRect(0, 0, W, H);
      const fx = CSE.linMap(0, 41 * S.f0, 50, W - 14), fy = CSE.linMap(0, 1.4, H - 30, 20);
      CSE.gridY(ctx, fy, [0, 0.5, 1], 50, W - 14, v => CSE.num(v), { zero: true });
      CSE.label(ctx, 'Dominio de la FRECUENCIA (espectro)', 50, 14, { color: C.azul, font: '800 17px Archivo' });
      for (let n = 1; n <= 40; n++) { const A = Math.abs(coef(n)); if (!A) continue; const x = fx(n * S.f0); ctx.fillStyle = n <= S.N ? 'rgba(122,134,217,.35)' : '#f0f1f8'; ctx.fillRect(x - 4, fy(A), 8, fy(0) - fy(A)); }
      harm.forEach(h => { const x = fx(h.f); ctx.fillStyle = S.filtro ? C.teal : C.indigo; ctx.fillRect(x - 3, fy(Math.abs(h.A) * h.mag), 6, fy(0) - fy(Math.abs(h.A) * h.mag)); });
      [1, 10, 20, 30, 40].forEach(n => CSE.label(ctx, CSE.fmtF(n * S.f0), fx(n * S.f0), H - 10, { align: 'center', color: C.gris, font: '15px "Source Sans 3"' }));
      if (S.filtro) { const pts = []; for (let x = 50; x <= W - 14; x += 2) pts.push([x, fy(CSE.rc('lp', Math.max(1, fx.inv(x)), S.fc).mag)]); CSE.line(ctx, pts, C.naranja, 2.5, [6, 4]); CSE.label(ctx, '|G| del filtro', W - 20, fy(0.95) - 30, { align: 'right', color: C.naranja, font: '800 16px Archivo' }); }
    }
    draw();
  });

  /* =====================================================================
     3. EL CONDENSADOR "CAMBIA DE PERSONALIDAD" CON LA FRECUENCIA
     ===================================================================== */
  CSE.registrar('impedancia', (root) => {
    const S = { R: 56000, Cap: 10e-9, f: 284 };
    root.innerHTML = '';
    const ctl = CSE.el('<div class="ctl"></div>');
    const sf = CSE.logSlider(10, 100000, S.f, v => { S.f = v; draw(); });
    sf.style.width = '420px';
    const vf = CSE.el('<span class="val"></span>');
    ctl.append(CSE.el('<label>Frecuencia de la señal</label>'), sf, vf);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:16px;align-items:center"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cv = CSE.canvas(a, 760, 380, { label: 'Impedancia del condensador frente a la frecuencia' });
    const cb = CSE.canvas(b, 520, 380, { label: 'Reparto de tensiones entre R y C' });
    const msg = CSE.el('<div class="msg info"></div>');
    root.append(ctl, g, msg);
    function draw() {
      const fo = 1 / (2 * Math.PI * S.R * S.Cap), Zc = 1 / (2 * Math.PI * S.f * S.Cap);
      vf.textContent = CSE.fmtF(S.f);
      let { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 70, x1 = W - 16, y0 = 24, y1 = H - 30;
      const fx = CSE.logMap(10, 1e5, x0, x1); const ly = CSE.linMap(Math.log10(1e2), Math.log10(1e7), y1, y0); const fy = z => ly(Math.log10(Math.min(1e7, Math.max(1e2, z))));
      CSE.gridLog(ctx, fx, 10, 1e5, y0, y1);
      [1e2, 1e3, 1e4, 1e5, 1e6, 1e7].forEach(z => { const y = fy(z); ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); CSE.label(ctx, CSE.fmtR(z), x0 - 6, y + 4, { align: 'right', color: C.gris, font: '16px "Source Sans 3"' }); });
      const pts = []; for (let x = x0; x <= x1; x += 2) pts.push([x, fy(1 / (2 * Math.PI * fx.inv(x) * S.Cap))]);
      CSE.line(ctx, pts, C.indigo, 3);
      CSE.line(ctx, [[x0, fy(S.R)], [x1, fy(S.R)]], C.naranja, 2.5);
      CSE.label(ctx, '|Z_C| = 1/(2πfC)', x0 + 10, y0 + 30, { color: C.indigo, font: '800 18px Archivo' });
      CSE.label(ctx, 'R = ' + CSE.fmtR(S.R), x1 - 4, fy(S.R) - 8, { align: 'right', color: C.naranja, font: '800 18px Archivo' });
      const xfo = fx(fo); CSE.line(ctx, [[xfo, y0], [xfo, y1]], C.verde, 1.5, [5, 5]); CSE.label(ctx, 'fo: |Z_C| = R', xfo + 5, y1 - 8, { color: C.teal, font: '800 16px Archivo' });
      const x = fx(S.f), y = fy(Zc); ctx.fillStyle = C.indigo; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill();
      CSE.label(ctx, CSE.fmtR(Zc), x + 12, y - 10, { color: C.indigo, font: '800 19px Archivo', bg: 'rgba(255,255,255,.9)' });
      // reparto de tensiones (módulos)
      ({ ctx, W, H } = cb); ctx.clearRect(0, 0, W, H);
      const Z = Math.hypot(S.R, Zc), VR = S.R / Z, VC = Zc / Z;
      const bars = [['V en R (salida del diferenciador)', VR, C.naranja], ['V en C (salida del integrador)', VC, C.indigo]];
      CSE.label(ctx, 'Con 1 V de entrada, ¿dónde cae la tensión?', 10, 24, { color: C.azul, font: '800 19px Archivo' });
      bars.forEach(([t, v, c], i) => { const yy = 70 + i * 140; CSE.label(ctx, t, 10, yy, { color: C.tinta, font: '700 18px "Source Sans 3"' }); ctx.fillStyle = C.suave; ctx.fillRect(10, yy + 12, W - 20, 54); ctx.fillStyle = c; ctx.fillRect(10, yy + 12, (W - 20) * v, 54); CSE.label(ctx, CSE.num(v, 3) + ' V · ' + CSE.num(CSE.dB(v), 1) + ' dB', 20, yy + 47, { color: v > 0.35 ? '#fff' : C.tinta, font: '800 23px Archivo' }); });
      const r = S.f / fo;
      msg.innerHTML = r < 0.3 ? `<b>Frecuencia baja:</b> |Z<sub>C</sub>| ≫ R, el condensador se comporta casi como un <b>circuito abierto</b>. Casi toda la tensión cae en C: el integrador (paso bajo) deja pasar la señal y el diferenciador la bloquea.`
        : r > 3 ? `<b>Frecuencia alta:</b> |Z<sub>C</sub>| ≪ R, el condensador se comporta casi como un <b>cortocircuito</b>. Casi toda la tensión cae en R: el diferenciador (paso alto) deja pasar la señal y el integrador la bloquea.`
        : `<b>Cerca de la frecuencia de corte</b> (f<sub>o</sub> = ${CSE.fmtF(fo)}): |Z<sub>C</sub>| ≈ R y la tensión se reparte. En f = f<sub>o</sub> cada salida vale 0,707 V (−3 dB).`;
    }
    draw();
  });

  /* =====================================================================
     4. DIAGRAMA DE BODE INTERACTIVO + TUS MEDIDAS
     ===================================================================== */
  CSE.registrar('bode', (root, ds) => {
    const S = { tipo: ds.tipo || 'lp', R: 56000, Cap: 10e-9, asint: true, hover: null, drag: false, med: [] };
    const fo = () => 1 / (2 * Math.PI * S.R * S.Cap);
    root.innerHTML = '';
    const ctl = CSE.el('<div class="ctl"></div>');
    const segT = CSE.seg([['lp', 'Integrador (paso bajo)'], ['hp', 'Diferenciador (paso alto)']], S.tipo, v => { S.tipo = v; draw(); tabla(); });
    const sR = CSE.logSlider(1000, 1e6, S.R, v => { S.R = v; draw(); tabla(); }); const vR = CSE.el('<span class="val"></span>');
    const selC = CSE.select(CSE.Cs, S.Cap, v => { S.Cap = v; draw(); tabla(); }, CSE.fmtC);
    const kfo = CSE.el('<span class="kpi"><span class="k">fo teórica</span><span class="v"></span></span>');
    const bA = CSE.el('<button class="btn sm sec" aria-pressed="true">Asíntotas</button>');
    bA.addEventListener('click', () => { S.asint = !S.asint; bA.setAttribute('aria-pressed', S.asint); draw(); });
    ctl.append(segT, CSE.el('<label>R</label>'), sR, vR, CSE.el('<label>C</label>'), selC, kfo, bA);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1fr 480px;gap:14px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cv = CSE.canvas(a, 1000, 480, { label: 'Diagrama de Bode de módulo y fase' });
    const lect = CSE.el('<div class="msg info" style="margin-top:6px">Pasa el ratón por la gráfica para leer valores. Arrastra la línea discontinua de f<sub>o</sub> para cambiar R.</div>');
    a.append(lect);
    b.innerHTML = `<label>Tus medidas del laboratorio</label>
      <div style="font-size:17px;color:#6b6f86;margin-bottom:4px">Escribe f, Ve, Vs (misma magnitud: amplitud o Vpp) y Δt. Se calculan G, dB y φ y se dibujan en naranja.</div>
      <table><thead><tr><th>f (Hz)</th><th>Ve</th><th>Vs</th><th>Δt (ms)</th><th>dB</th><th>φ (°)</th></tr></thead><tbody></tbody></table>
      <div class="ctl"><button class="btn sm sec b-ej">Cargar ejemplo</button><button class="btn sm sec b-cl">Limpiar</button></div>
      <div class="res"></div>`;
    root.append(ctl, g);
    const tb = b.querySelector('tbody');
    for (let i = 0; i < 7; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = ['f', 've', 'vs', 'dt'].map(k => `<td><input class="cell" data-k="${k}" inputmode="decimal"></td>`).join('') + '<td class="db"></td><td class="ph"></td>';
      tb.appendChild(tr);
    }
    tb.addEventListener('input', () => { tabla(); draw(); });
    const val = x => { const v = parseFloat(String(x).replace(',', '.')); return isFinite(v) ? v : NaN; };
    b.querySelector('.b-cl').addEventListener('click', () => { tb.querySelectorAll('input').forEach(i => i.value = ''); tabla(); draw(); });
    b.querySelector('.b-ej').addEventListener('click', () => {
      const f0 = fo() * (1 + (Math.random() - .5) * .14); const fs = [0.1, 0.3, 0.55, 1, 2, 5, 10].map(k => Math.round(fo() * k));
      [...tb.rows].forEach((tr, i) => {
        const f = fs[i], r = CSE.rc(S.tipo, f, f0), ve = 1;
        const vs = Math.max(0.001, r.mag * (1 + (Math.random() - .5) * .06));
        const dt = Math.abs(r.fase) / 360 / f * 1000 * (1 + (Math.random() - .5) * .08);
        const ins = tr.querySelectorAll('input'); ins[0].value = f; ins[1].value = CSE.num(ve, 2); ins[2].value = CSE.num(vs, 3); ins[3].value = CSE.num(dt, 3);
      });
      tabla(); draw();
    });
    function tabla() {
      S.med = [];
      [...tb.rows].forEach(tr => {
        const ins = tr.querySelectorAll('input'); const f = val(ins[0].value), ve = val(ins[1].value), vs = val(ins[2].value), dt = val(ins[3].value);
        const db = ve > 0 && vs > 0 ? CSE.dB(vs / ve) : NaN; const ph = f > 0 && dt >= 0 ? (S.tipo === 'lp' ? -1 : 1) * 360 * dt / 1000 * f : NaN;
        tr.querySelector('.db').textContent = isFinite(db) ? CSE.num(db, 1) : ''; tr.querySelector('.ph').textContent = isFinite(ph) ? CSE.num(ph, 0) : '';
        if (f > 0 && isFinite(db)) S.med.push({ f, db, ph });
      });
      const res = b.querySelector('.res');
      if (S.med.length < 3) { res.innerHTML = ''; return; }
      const m = [...S.med].sort((p, q) => p.f - q.f); const ref = Math.max(...m.map(p => p.db)); const obj = ref - 3; let fe = null;
      for (let i = 0; i < m.length - 1; i++) { const p = m[i], q = m[i + 1]; if ((p.db - obj) * (q.db - obj) <= 0 && p.db !== q.db) { const u = (obj - p.db) / (q.db - p.db); fe = Math.pow(10, Math.log10(p.f) + u * (Math.log10(q.f) - Math.log10(p.f))); break; } }
      if (!fe) { res.innerHTML = '<div class="msg bad">Con estas medidas no se cruza la línea de −3 dB: añade puntos a ambos lados de f<sub>o</sub>.</div>'; return; }
      const err = Math.abs(fe - fo()) / fo() * 100;
      res.innerHTML = `<div class="msg ${err < 15 ? 'ok' : 'bad'}">f<sub>o</sub> experimental ≈ <b>${CSE.fmtF(fe)}</b> (cruce de ${CSE.num(obj, 1)} dB, interpolando en escala log) · teórica ${CSE.fmtF(fo())} · error <b>${CSE.num(err, 1)} %</b>${err < 15 ? ' (razonable con tolerancias de ±5 % y ±10 %)' : ' (revisa las medidas)'}</div>`;
      S.fe = fe;
    }
    const L = { x0: 70, x1: 955, m0: 28, m1: 250, p0: 292, p1: 448, fmin: 10, fmax: 1e5 };
    const fx = CSE.logMap(L.fmin, L.fmax, L.x0, L.x1), my = CSE.linMap(-50, 5, L.m1, L.m0), py = CSE.linMap(-100, 100, L.p1, L.p0);
    function draw() {
      vR.textContent = CSE.fmtR(S.R); kfo.querySelector('.v').textContent = CSE.fmtF(fo());
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H); const F = fo();
      CSE.gridLog(ctx, fx, L.fmin, L.fmax, L.m0, L.m1, { noLabels: true }); CSE.gridLog(ctx, fx, L.fmin, L.fmax, L.p0, L.p1);
      CSE.gridY(ctx, my, [-50, -40, -30, -20, -10, 0], L.x0, L.x1, v => v + ' dB', { zero: true });
      CSE.gridY(ctx, py, [-90, -45, 0, 45, 90], L.x0, L.x1, v => v + '°', { zero: true });
      CSE.label(ctx, 'MÓDULO  20·log|G|', L.x0 + 6, L.m0 - 10, { color: C.azul, font: '800 17px Archivo' });
      CSE.label(ctx, 'FASE  φ', L.x0 + 6, L.p0 - 10, { color: C.azul, font: '800 17px Archivo' });
      const pm = [], pp = [];
      for (let x = L.x0; x <= L.x1; x += 2) { const r = CSE.rc(S.tipo, fx.inv(x), F); pm.push([x, my(Math.max(-50, CSE.dB(r.mag)))]); pp.push([x, py(r.fase)]); }
      if (S.asint) {
        const xa = fx(F), lp = S.tipo === 'lp';
        const am = []; for (let x = L.x0; x <= L.x1; x += 4) { const f = fx.inv(x); const d = lp ? (f < F ? 0 : -20 * Math.log10(f / F)) : (f > F ? 0 : -20 * Math.log10(F / f)); am.push([x, my(Math.max(-50, d))]); }
        CSE.line(ctx, am, C.naranja, 2, [8, 5]);
        const ap = []; for (let x = L.x0; x <= L.x1; x += 4) { const f = fx.inv(x); let d = f < F / 10 ? 0 : f > 10 * F ? -90 : -45 - 45 * Math.log10(f / F); if (!lp) d += 90; ap.push([x, py(d)]); }
        CSE.line(ctx, ap, C.naranja, 2, [8, 5]);
        CSE.label(ctx, lp ? '−20 dB/década' : '+20 dB/década', lp ? fx(F * 25) : fx(F / 25), my(-13), { align: 'center', color: C.naranja, font: '800 17px Archivo', bg: 'rgba(255,255,255,.9)' });
      }
      CSE.line(ctx, pm, C.indigo, 3.5); CSE.line(ctx, pp, C.teal, 3.5);
      const x = fx(F); CSE.line(ctx, [[x, L.m0], [x, L.p1]], C.indigo, 2, [5, 5]);
      ctx.fillStyle = C.indigo; ctx.beginPath(); ctx.arc(x, my(-3), 7, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, py(S.tipo === 'lp' ? -45 : 45), 7, 0, 7); ctx.fill();
      CSE.label(ctx, 'fo = ' + CSE.fmtF(F) + ' (−3 dB, ' + (S.tipo === 'lp' ? '−45°' : '+45°') + ')', x + 10, my(-3) + 22, { color: C.indigo, font: '800 17px Archivo', bg: 'rgba(255,255,255,.9)' });
      S.med.forEach(p => { if (p.f < L.fmin || p.f > L.fmax) return; ctx.fillStyle = C.naranja; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fx(p.f), my(Math.max(-50, p.db)), 7, 0, 7); ctx.fill(); ctx.stroke(); if (isFinite(p.ph)) { ctx.beginPath(); ctx.arc(fx(p.f), py(p.ph), 7, 0, 7); ctx.fill(); ctx.stroke(); } });
      if (S.hover) {
        const f = fx.inv(S.hover), r = CSE.rc(S.tipo, f, F);
        CSE.line(ctx, [[S.hover, L.m0], [S.hover, L.p1]], 'rgba(34,34,58,.35)', 1);
        lect.innerHTML = `f = <b>${CSE.fmtF(f)}</b> · |G| = <b>${CSE.num(r.mag, 3)}</b> · <b>${CSE.num(CSE.dB(r.mag), 1)} dB</b> · φ = <b>${CSE.num(r.fase, 1)}°</b> · (f/fo = ${CSE.num(f / F, 2)})`;
      }
    }
    cv.cv.addEventListener('pointermove', e => {
      const p = CSE.pos(cv.cv, e, cv.W, cv.H); if (p.x < L.x0 || p.x > L.x1) return;
      if (S.drag) { const F = fx.inv(p.x); S.R = Math.min(1e6, Math.max(1000, 1 / (2 * Math.PI * F * S.Cap))); sR.set(S.R); tabla(); }
      S.hover = p.x; cv.cv.style.cursor = Math.abs(p.x - fx(fo())) < 12 ? 'ew-resize' : 'crosshair'; draw();
    });
    cv.cv.addEventListener('pointerdown', e => { const p = CSE.pos(cv.cv, e, cv.W, cv.H); if (Math.abs(p.x - fx(fo())) < 14) { S.drag = true; cv.cv.setPointerCapture(e.pointerId); } });
    cv.cv.addEventListener('pointerup', () => S.drag = false);
    cv.cv.addEventListener('pointerleave', () => { S.hover = null; draw(); });
    draw();
  });
})();
