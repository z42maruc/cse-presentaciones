/* Simuladores de la Práctica 0 · Manejo del instrumental de laboratorio */
(function () {
  const CSE = window.CSE, C = CSE.col;
  const svgW = `<style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 18px 'Source Sans 3',sans-serif;fill:#22223a}.b{font:800 19px Archivo,sans-serif}</style>`;
  const fV = v => Math.abs(v) >= 1 ? CSE.num(v, 2) + ' V' : CSE.num(v * 1e3, 0) + ' mV';

  /* =====================================================================
     1. PARÁMETROS DE UNA SEÑAL
     ===================================================================== */
  CSE.registrar('p0-senal', (root) => {
    const S = { Vp: 2, f: 1000, off: 0, fase: 0, forma: 'senoidal' };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.seg([['senoidal', 'Senoidal'], ['cuadrada', 'Cuadrada'], ['triangular', 'Triangular']], S.forma, v => { S.forma = v; draw(); }));
    const sl = (min, max, step, k, lab, fmt) => { const s = CSE.el(`<input type="range" min="${min}" max="${max}" step="${step}" value="${S[k]}">`); s.style.width = '170px'; const v = CSE.el(`<span class="val"></span>`); s.addEventListener('input', () => { S[k] = +s.value; draw(); }); s.fmt = () => v.textContent = fmt(S[k]); c1.append(CSE.el(`<label>${lab}</label>`), s, v); return s; };
    const sls = [sl(0.5, 5, 0.1, 'Vp', 'V<sub>p</sub>', v => CSE.num(v, 1) + ' V'), sl(0, 3, 0.1, 'off', 'Offset', v => CSE.num(v, 1) + ' V'), sl(0, 180, 15, 'fase', 'Fase φ', v => v + '°')];
    const fsel = CSE.select([50, 100, 500, 1000, 2000], S.f, v => { S.f = v; draw(); }, v => CSE.fmtF(v)); c1.append(CSE.el('<label>f</label>'), fsel);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cv = CSE.canvas(a, 900, 440, { label: 'Señal y sus parámetros' });
    root.append(c1, g);
    function draw() {
      sls.forEach(s => s.fmt());
      const T = 1 / S.f, fn = t => S.off + S.Vp * CSE.onda(S.forma, t / T + S.fase / 360);
      const rmsK = S.forma === 'senoidal' ? Math.SQRT1_2 : S.forma === 'cuadrada' ? 1 : 1 / Math.sqrt(3);
      const vrms = Math.sqrt(S.off * S.off + Math.pow(S.Vp * rmsK, 2));
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 70, x1 = W - 20, tx = CSE.linMap(0, 2 * T, x0, x1), ty = CSE.linMap(-6, 9, H - 30, 14);
      CSE.gridY(ctx, ty, [-6, -3, 0, 3, 6, 9], x0, x1, v => v + ' V', { zero: true });
      const p = []; for (let x = x0; x <= x1; x++) p.push([x, ty(fn(tx.inv(x)))]); CSE.line(ctx, p, C.indigo, 4);
      CSE.line(ctx, [[x0, ty(S.off)], [x1, ty(S.off)]], C.verde, 2, [6, 4]); CSE.label(ctx, 'Vmed = offset = ' + CSE.num(S.off, 1) + ' V', x1 - 6, ty(S.off) + 20, { align: 'right', color: C.teal, font: '800 15px Archivo' });
      const xp = tx(T * (0.25 - S.fase / 360 + (S.fase > 90 ? 1 : 0))) ;
      CSE.line(ctx, [[xp, ty(S.off)], [xp, ty(S.off + S.Vp)]], C.naranja, 3); CSE.label(ctx, 'Vp', xp + 8, ty(S.off + S.Vp / 2), { color: C.naranja, font: '800 16px Archivo' });
      const xpp = tx(T * 1.25 - T * S.fase / 360 + (S.fase > 90 ? 0 : 0)); CSE.line(ctx, [[xpp + 40, ty(S.off - S.Vp)], [xpp + 40, ty(S.off + S.Vp)]], C.bad, 3); CSE.label(ctx, 'Vpp', xpp + 48, ty(S.off), { color: C.bad, font: '800 16px Archivo' });
      const yT = ty(-5); CSE.line(ctx, [[tx(0), yT], [tx(T), yT]], C.azul2, 3); CSE.label(ctx, 'T = ' + CSE.fmtT(T), tx(T / 2), yT - 8, { align: 'center', color: C.azul2, font: '800 16px Archivo' });
      b.innerHTML = `<div class="formula" style="font-size:22px">v(t) = ${S.off ? CSE.num(S.off, 1) + ' + ' : ''}${CSE.num(S.Vp, 1)}·${S.forma === 'senoidal' ? 'sen' : S.forma}(2π·${CSE.num(S.f)}·t${S.fase ? ' + ' + S.fase + '°' : ''})</div>
        <table style="margin-top:10px"><tbody>
        <tr><td>Amplitud V<sub>p</sub></td><td><b>${CSE.num(S.Vp, 2)} V</b></td></tr><tr><td>Pico a pico V<sub>pp</sub> = 2·V<sub>p</sub></td><td><b>${CSE.num(2 * S.Vp, 2)} V</b></td></tr>
        <tr><td>Periodo T = 1/f</td><td><b>${CSE.fmtT(T)}</b></td></tr><tr><td>ω = 2πf</td><td><b>${CSE.num(2 * Math.PI * S.f, 0)} rad/s</b></td></tr>
        <tr><td>Valor medio (offset)</td><td><b>${CSE.num(S.off, 2)} V</b></td></tr><tr><td>Valor eficaz V<sub>rms</sub></td><td><b>${CSE.num(vrms, 2)} V</b> ${S.off ? '' : '(' + (S.forma === 'senoidal' ? 'V<sub>p</sub>/√2' : S.forma === 'cuadrada' ? 'V<sub>p</sub>' : 'V<sub>p</sub>/√3') + ')'}</td></tr>
        </tbody></table>`;
    }
    draw();
  });

  /* =====================================================================
     2. PROTOBOARD: ¿qué orificios están conectados?
     ===================================================================== */
  CSE.registrar('p0-protoboard', (root) => {
    const COLS = 30, S = { a: null, b: null };
    root.innerHTML = '<div class="ctl"><span style="font-size:19px">Pulsa dos orificios y te digo si están unidos (mismo nodo). Pulsa <b>Componente mal colocado</b> para ver un error típico.</span><button class="btn sm sec mal">Componente mal colocado</button><button class="btn sm sec bien">Componente bien colocado</button></div><div class="pb"></div><div class="msg info m">Elige el primer orificio.</div>';
    let comp = null;
    root.querySelector('.mal').addEventListener('click', () => { comp = 'mal'; S.a = S.b = null; draw(); root.querySelector('.m').innerHTML = 'Las <b>dos patillas</b> de la resistencia están en la <b>misma columna</b>: en el mismo nodo. La resistencia está <b>cortocircuitada</b> y no hace nada.'; root.querySelector('.m').className = 'msg bad m'; });
    root.querySelector('.bien').addEventListener('click', () => { comp = 'bien'; S.a = S.b = null; draw(); root.querySelector('.m').innerHTML = 'Bien: cada patilla está en una columna distinta, así que la resistencia une dos nodos diferentes.'; root.querySelector('.m').className = 'msg ok m'; });
    // nodo de cada orificio: filas 0-1 carril superior (+, −), 2-6 mitad A, 7-11 mitad B, 12-13 carril inferior
    const nodo = (r, c) => r === 0 ? 'top+' : r === 1 ? 'top-' : r === 12 ? 'bot+' : r === 13 ? 'bot-' : (r < 7 ? 'A' : 'B') + c;
    const pos = (r, c) => { const x = 40 + c * 40, y = r < 2 ? 30 + r * 30 : r < 7 ? 120 + (r - 2) * 30 : r < 12 ? 300 + (r - 7) * 30 : 470 + (r - 12) * 30; return [x, y]; };
    function draw() {
      const nA = S.a ? nodo(...S.a) : null;
      let s = `<svg viewBox="0 0 1260 540" style="width:100%;max-height:540px">${svgW}<rect x="10" y="5" width="1240" height="530" rx="14" fill="#f3f1ea" stroke="#cfcbbd" stroke-width="2"/>
        <rect x="10" y="262" width="1240" height="16" fill="#e2ddcd"/><path d="M30 18 H1230" stroke="#d23c4b" stroke-width="2"/><path d="M30 72 H1230" stroke="#3b5bdb" stroke-width="2"/><path d="M30 458 H1230" stroke="#d23c4b" stroke-width="2"/><path d="M30 512 H1230" stroke="#3b5bdb" stroke-width="2"/>
        <text x="16" y="36" style="font:800 16px Archivo;fill:#d23c4b">+</text><text x="16" y="66" style="font:800 16px Archivo;fill:#3b5bdb">−</text>`;
      for (let r = 0; r < 14; r++) for (let c = 0; c < COLS; c++) {
        const [x, y] = pos(r, c), n = nodo(r, c), sel = (S.a && S.a[0] === r && S.a[1] === c) || (S.b && S.b[0] === r && S.b[1] === c);
        const mismo = nA && n === nA;
        s += `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="3" fill="${sel ? '#280091' : mismo ? '#00b299' : '#4a4a4a'}" data-h="${r},${c}" style="cursor:pointer"/>`;
      }
      if (comp) { const [x1, y1] = pos(3, 10), [x2, y2] = comp === 'mal' ? pos(5, 10) : pos(3, 14); s += `<path d="M${x1} ${y1} ${comp === 'mal' ? `C ${x1 + 60} ${y1}, ${x2 + 60} ${y2}, ${x2} ${y2}` : `L${x2} ${y2}`}" stroke="#9aa0ad" stroke-width="5" fill="none"/><rect x="${comp === 'mal' ? x1 + 30 : (x1 + x2) / 2 - 34}" y="${comp === 'mal' ? (y1 + y2) / 2 - 12 : y1 - 12}" width="${comp === 'mal' ? 26 : 68}" height="${comp === 'mal' ? 26 : 24}" rx="8" fill="#d9c49a" stroke="#8a7445" stroke-width="2"/>`; }
      root.querySelector('.pb').innerHTML = s + '</svg>';
      root.querySelectorAll('[data-h]').forEach(e => e.addEventListener('click', () => {
        const h = e.dataset.h.split(',').map(Number); const m = root.querySelector('.m');
        if (!S.a || S.b) { S.a = h; S.b = null; m.className = 'msg info m'; m.innerHTML = 'En verde, todos los orificios unidos al que has elegido. Ahora elige el segundo.'; }
        else { S.b = h; const ok = nodo(...S.a) === nodo(...S.b); m.className = 'msg ' + (ok ? 'ok' : 'bad') + ' m'; m.innerHTML = ok ? '<b>Conectados</b>: están en el mismo nodo.' : '<b>No conectados</b>: están en nodos distintos.' + (S.a[0] < 7 !== S.b[0] < 7 && S.a[0] > 1 && S.a[0] < 12 && S.b[0] > 1 && S.b[0] < 12 ? ' El canal central separa las dos mitades.' : ''); }
        draw();
      }));
    }
    draw();
  });

  /* =====================================================================
     3. CÓDIGO DE COLORES DE LAS RESISTENCIAS
     ===================================================================== */
  CSE.registrar('p0-resistencia', (root) => {
    const COL = [['Negro', '#111'], ['Marrón', '#7a3f12'], ['Rojo', '#d0202a'], ['Naranja', '#f07b13'], ['Amarillo', '#f2d21b'], ['Verde', '#1f9a3a'], ['Azul', '#1f54c9'], ['Violeta', '#7b2fc0'], ['Gris', '#8a8a8a'], ['Blanco', '#f4f4f4']];
    const MULT = [...COL.map((c, i) => [c[0], c[1], Math.pow(10, i)]).slice(0, 7), ['Oro', '#c9a227', 0.1], ['Plata', '#c0c0c0', 0.01]];
    const TOL = [['Oro', '#c9a227', '±5 %'], ['Plata', '#c0c0c0', '±10 %'], ['Marrón', '#7a3f12', '±1 %'], ['Rojo', '#d0202a', '±2 %']];
    const S = { d1: 5, d2: 6, m: 3, t: 0, reto: null };
    root.innerHTML = '<div class="g" style="display:grid;grid-template-columns:1.1fr 1fr;gap:18px;align-items:start"><div class="a"></div><div class="b"></div></div>';
    const a = root.querySelector('.a'), b = root.querySelector('.b');
    const fila = (lab, arr, k) => `<div class="ctl" style="margin:4px 0"><label style="min-width:110px">${lab}</label>${arr.map((c, i) => `<button title="${c[0]}" data-k="${k}" data-i="${i}" style="all:unset;cursor:pointer;width:30px;height:30px;border-radius:6px;background:${c[1]};box-shadow:${S[k] === i ? '0 0 0 3px #280091, 0 0 0 5px #fff inset' : 'inset 0 0 0 1px #999'}"></button>`).join('')}</div>`;
    function draw() {
      const val = (S.d1 * 10 + S.d2) * MULT[S.m][2];
      const bands = [COL[S.d1][1], COL[S.d2][1], MULT[S.m][1], TOL[S.t][1]];
      a.innerHTML = `<svg viewBox="0 0 640 200" style="width:100%">${svgW}<path d="M20 100 H140 M500 100 H620" stroke="#9aa0ad" stroke-width="8"/>
        <path d="M140 60 Q140 45 170 45 H220 Q235 60 260 60 H380 Q405 60 420 45 H470 Q500 45 500 60 V140 Q500 155 470 155 H420 Q405 140 380 140 H260 Q235 140 220 155 H170 Q140 155 140 140 Z" fill="#e8d3a8" stroke="#8a7445" stroke-width="3"/>
        ${[185, 245, 300, 440].map((x, i) => `<rect x="${x}" y="${i === 0 || i === 3 ? 46 : 60}" width="22" height="${i === 0 || i === 3 ? 108 : 80}" fill="${bands[i]}"/>`).join('')}</svg>
        <div class="kpi" style="width:100%;box-sizing:border-box"><span class="k">Valor</span><span class="v" style="font-size:40px">${CSE.fmtR(val)} ${TOL[S.t][2]}</span></div>
        <div class="msg info" style="margin-top:8px">R = [${S.d1}${S.d2}] × ${MULT[S.m][2] >= 1 ? CSE.num(MULT[S.m][2]) : CSE.num(MULT[S.m][2], 2)} = ${CSE.num(val, 2)} Ω · ¡Ojo! Rojo y naranja, y marrón y rojo, se confunden: si dudas, mide con el óhmetro <b>fuera del circuito</b>.</div>`;
      b.innerHTML = fila('1.ª cifra', COL, 'd1') + fila('2.ª cifra', COL, 'd2') + fila('Multiplicador', MULT, 'm') + fila('Tolerancia', TOL, 't') +
        `<div class="reto" style="margin-top:10px"><b>Reto:</b> ${S.reto ? `pon los colores de <b>${CSE.fmtR(S.reto)}</b>` : 'pulsa "Nuevo reto"'}<div class="ctl"><button class="btn sm verde nr">Nuevo reto</button><span class="rr"></span></div></div>`;
      b.querySelectorAll('[data-k]').forEach(x => x.addEventListener('click', () => { S[x.dataset.k] = +x.dataset.i; draw(); }));
      b.querySelector('.nr').addEventListener('click', () => { const L = [56000, 4700, 220, 1000, 10000, 2200, 330, 820, 100000, 15000, 470, 68000]; S.reto = L[Math.floor(Math.random() * L.length)]; draw(); });
      if (S.reto) b.querySelector('.rr').innerHTML = Math.abs(val - S.reto) < 1e-6 ? '<span class="pill ok">¡Correcto!</span>' : '<span class="pill warn">Aún no</span>';
    }
    draw();
  });

  /* =====================================================================
     4. LA FUENTE DE ALIMENTACIÓN: tensión, límite de corriente, CV y CC
     ===================================================================== */
  CSE.registrar('p0-fuente', (root) => {
    const S = { V: 10, Ilim: 0.1, carga: 1000, on: true };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sV = CSE.el('<input type="range" min="0" max="30" step="0.1" value="10">'); sV.addEventListener('input', () => { S.V = +sV.value; draw(); });
    const sI = CSE.el('<input type="range" min="0" max="1.5" step="0.005" value="0.1">'); sI.addEventListener('input', () => { S.Ilim = +sI.value; draw(); });
    c1.append(CSE.el('<label>VOLTAGE</label>'), sV, CSE.el('<label>CURRENT (límite)</label>'), sI);
    const c2 = CSE.el('<div class="ctl"></div>');
    c2.append(CSE.el('<label>Conectado a</label>'), CSE.seg([['1e12', 'Nada (abierto)'], ['1000', '1 kΩ'], ['220', '220 Ω'], ['0.01', 'Cortocircuito']], '1000', v => { S.carga = +v; draw(); }));
    const g = CSE.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:center"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    root.append(c1, c2, g);
    function draw() {
      const Inec = S.V / S.carga; const cc = Inec > S.Ilim; const I = cc ? S.Ilim : Inec, V = cc ? S.Ilim * S.carga : S.V;
      const dig = (x, d) => x.toFixed(d).padStart(d + 3, ' ').replace('.', ',');
      a.innerHTML = `<svg viewBox="0 0 560 300" style="width:100%">${svgW}<rect x="10" y="10" width="540" height="280" rx="14" fill="#d9dbe2" stroke="#9aa0ad" stroke-width="3"/>
        <rect x="40" y="40" width="210" height="80" rx="6" fill="#0d1a0d"/><text x="235" y="100" text-anchor="end" style="font:700 48px 'Courier New',monospace;fill:#7dff9a">${dig(V, 1)}</text><text x="245" y="138" text-anchor="end" class="t" style="font-size:15px">V</text>
        <rect x="300" y="40" width="210" height="80" rx="6" fill="#0d1a0d"/><text x="495" y="100" text-anchor="end" style="font:700 48px 'Courier New',monospace;fill:#7dff9a">${dig(I, 3)}</text><text x="505" y="138" text-anchor="end" class="t" style="font-size:15px">A</text>
        <circle cx="70" cy="165" r="10" fill="${cc ? '#3a3a3a' : '#7dff9a'}"/><text x="88" y="171" class="b">CV</text><circle cx="160" cy="165" r="10" fill="${cc ? '#ff5a5a' : '#3a3a3a'}"/><text x="178" y="171" class="b">CC</text>
        <circle cx="120" cy="240" r="30" fill="#2e2a2a"/><text x="120" y="290" text-anchor="middle" class="t" style="font-size:14px">VOLTAGE</text><circle cx="250" cy="240" r="30" fill="#2e2a2a"/><text x="250" y="290" text-anchor="middle" class="t" style="font-size:14px">CURRENT</text>
        <circle cx="390" cy="240" r="14" fill="#222"/><circle cx="440" cy="240" r="14" fill="#2b9a44"/><circle cx="490" cy="240" r="14" fill="#d23c4b"/><text x="390" y="200" text-anchor="middle" class="b">−</text><text x="440" y="200" text-anchor="middle" class="t" style="font-size:13px">GND</text><text x="490" y="200" text-anchor="middle" class="b">+</text></svg>`;
      b.innerHTML = `<div class="msg ${cc ? 'bad' : 'ok'}">${cc ? `<b>CC encendido</b>: el circuito pide ${Inec > 100 ? 'muchísima' : CSE.num(Inec * 1e3, 0) + ' mA de'} corriente y la fuente la <b>limita</b> a ${CSE.num(S.Ilim * 1e3, 0)} mA; la tensión cae a ${CSE.num(V, 2)} V. ${S.carga < 1 ? '¡Cortocircuito! Gracias al límite no se quema nada.' : 'Sube el límite o revisa el montaje.'}` : `<b>CV encendido</b>: funciona como fuente de tensión (${CSE.num(S.V, 1)} V) y entrega ${CSE.num(I * 1e3, 1)} mA, por debajo del límite.`}</div>
        <div class="caja idea" style="margin-top:10px"><span class="t">Cómo limitar la corriente (hazlo siempre)</span>1. CURRENT al mínimo y VOLTAGE a la tensión deseada · 2. cortocircuita un momento + y −: se enciende CC · 3. sube CURRENT hasta el límite (p. ej. 100 mA) · 4. quita el cortocircuito: vuelve CV.</div>`;
    }
    draw();
  });

  /* =====================================================================
     5. EL GENERADOR DE FUNCIONES + OSCILOSCOPIO
     ===================================================================== */
  CSE.registrar('p0-generador', (root) => {
    const S = { forma: 'senoidal', f: 1000, Vpp: 2, off: 0, duty: 50, load: 'highz', on: false };
    const ctl = document.createElement('div');
    const fila = (...e) => { const d = CSE.el('<div class="ctl"></div>'); d.append(...e); ctl.append(d); return d; };
    const pant = CSE.el('<div style="background:#1b2a4a;color:#e8eefc;border-radius:8px;padding:8px 12px;font:600 17px \'Courier New\',monospace;margin-bottom:6px"></div>'); ctl.append(pant);
    fila(CSE.seg([['senoidal', 'Sine'], ['cuadrada', 'Square'], ['triangular', 'Ramp'], ['pulso', 'Pulse']], S.forma, v => { S.forma = v; upd(); }));
    const inp = (k, lab, w = 80) => { const i = CSE.el(`<input type="number" step="any" value="${S[k]}" style="width:${w}px">`); i.addEventListener('input', () => { const v = parseFloat(i.value); if (isFinite(v)) { S[k] = v; upd(); } }); return [CSE.el(`<label>${lab}</label>`), i]; };
    fila(...inp('f', 'Frequency (Hz)', 100), ...inp('Vpp', 'Amplitude (Vpp)'));
    fila(...inp('off', 'Offset (V)'), ...inp('duty', 'Duty (%)'));
    const bOn = CSE.el('<button class="btn sm sec">CH1 On</button>'); bOn.addEventListener('click', () => { S.on = !S.on; upd(); });
    fila(CSE.el('<label>Load</label>'), CSE.seg([['highz', 'High Z'], ['50', '50 Ω']], 'highz', v => { S.load = v; upd(); }), bOn);
    const retoBox = CSE.el('<div class="reto"></div>'); ctl.append(retoBox);
    const RETOS = [['Senoidal de 1 V de amplitud y 284 Hz (Práctica 1)', s => s.forma === 'senoidal' && Math.abs(s.f - 284) < 1 && Math.abs(s.Vpp - 2) < 0.01 && s.off === 0 && s.load === 'highz' && s.on],
      ['Triangular de 2 V de amplitud, 250 kHz, sin offset', s => s.forma === 'triangular' && Math.abs(s.f - 250e3) < 1 && Math.abs(s.Vpp - 4) < 0.01 && s.off === 0 && s.load === 'highz' && s.on],
      ['Pulso digital de 0 a 5 V, 1 kHz y ciclo de trabajo del 25 %', s => s.forma === 'pulso' && Math.abs(s.f - 1000) < 1 && Math.abs(s.Vpp - 5) < 0.01 && Math.abs(s.off - 2.5) < 0.01 && s.duty === 25 && s.on]];
    let ri = 0;
    const o = CSE.osciloscopio(root, {
      ancho: 640, controles: ctl, soloCH1: true, conAC: true, conCursores: false, compacto: false, inicial: { v1: 1, tdiv: 0.2e-3 },
      senales: () => {
        const T = 1 / Math.max(1e-3, S.f), k = S.load === '50' ? 2 : 1; // el circuito es de alta impedancia: con "50 Ω" llega el doble
        const f = t => { if (!S.on) return 0; const u = (t / T) % 1; const w = S.forma === 'pulso' ? (u < S.duty / 100 ? 1 : -1) : CSE.onda(S.forma, u); return k * (S.off + S.Vpp / 2 * w); };
        return { T, ch1: f, ch2: () => 0 };
      },
      extraMedidas: () => { const ok = RETOS[ri][1](S); return `<div class="msg ${S.on ? (S.load === '50' ? 'bad' : 'info') : 'bad'}" style="margin-top:6px">${!S.on ? '<b>Línea plana</b>: la salida del generador está desactivada. Pulsa <b>CH1 On</b>.' : S.load === '50' ? 'Carga en <b>50 Ω</b> pero el circuito es de alta impedancia: llega el <b>doble</b> de la amplitud indicada. Elige <b>High Z</b>.' : 'Recuerda: el generador muestra la amplitud en <b>Vpp</b>. "1 V de amplitud" son 2 Vpp.'}</div>` + (ok ? '<div class="msg ok">¡Reto conseguido!</div>' : ''); }
    });
    function upd() {
      bOn.className = 'btn sm ' + (S.on ? 'verde' : 'sec'); bOn.textContent = S.on ? 'CH1 On ✓' : 'CH1 On';
      pant.innerHTML = `${{ senoidal: 'Sine', cuadrada: 'Square', triangular: 'Ramp', pulso: 'Pulse' }[S.forma]} · Freq ${CSE.fmtF(S.f)} · Ampl ${CSE.num(S.Vpp, 3)} Vpp · Offset ${CSE.num(S.off, 2)} V${S.forma === 'pulso' ? ' · Duty ' + S.duty + ' %' : ''}<br>Load ${S.load === 'highz' ? 'High Z' : '50 Ω'} · <span style="color:${S.on ? '#7dff9a' : '#ff8a8a'}">Output ${S.on ? 'On' : 'Off'}</span>`;
      retoBox.innerHTML = `<b>Reto ${ri + 1}/3:</b> ${RETOS[ri][0]} <button class="btn sm sec nx" style="margin-left:6px">Otro reto</button>`;
      retoBox.querySelector('.nx').addEventListener('click', () => { ri = (ri + 1) % RETOS.length; upd(); });
      o.draw();
    }
    upd();
  });

  /* =====================================================================
     6. LEE LA PANTALLA DEL OSCILOSCOPIO
     ===================================================================== */
  CSE.registrar('p0-lectura', (root) => {
    let R;
    const nuevo = () => {
      const vd = [0.1, 0.2, 0.5, 1, 2][Math.floor(Math.random() * 5)], td = [0.1e-3, 0.2e-3, 0.5e-3, 1e-3, 2e-3][Math.floor(Math.random() * 5)];
      const divA = [1, 1.5, 2, 2.5, 3][Math.floor(Math.random() * 5)], divT = [2, 2.5, 4, 5][Math.floor(Math.random() * 4)], offd = [0, 0, 0, 1, -1][Math.floor(Math.random() * 5)];
      R = { vd, td, Vp: divA * vd, T: divT * td, off: offd * vd, forma: ['senoidal', 'cuadrada', 'triangular'][Math.floor(Math.random() * 3)] };
    };
    nuevo();
    root.innerHTML = `<div style="display:grid;grid-template-columns:720px 1fr;gap:18px;align-items:start"><div class="a"></div><div class="b">
      <div class="ctl"><button class="btn sm verde nv">Nueva pantalla</button></div>
      <table><thead><tr><th>Magnitud</th><th>Tu lectura</th><th></th></tr></thead><tbody>
      ${[['vp', 'Amplitud V<sub>p</sub> (V)'], ['vpp', 'V<sub>pp</sub> (V)'], ['t', 'Periodo T (ms)'], ['f', 'Frecuencia f (Hz)'], ['off', 'Offset (V)']].map(([k, t]) => `<tr><td>${t}</td><td><input class="cell" style="width:100px" data-k="${k}" inputmode="decimal"></td><td class="ck" data-k="${k}"></td></tr>`).join('')}
      </tbody></table><div class="ctl"><button class="btn sm verde chk">Comprobar</button><button class="btn sm sec sol">Ver solución</button></div><div class="res"></div>
      <div class="caja idea" style="margin-top:8px"><span class="t">Una sola idea</span><b>Valor = n.º de divisiones × escala</b>. La flecha "1▶" marca el 0 V del canal.</div></div></div>`;
    const cv = CSE.canvas(root.querySelector('.a'), 820, 700, { label: 'Pantalla del osciloscopio para leer' });
    cv.cv.style.background = '#0b1030'; cv.cv.style.borderRadius = '10px';
    const fmtVd = v => v >= 1 ? CSE.num(v) + ' V' : CSE.num(v * 1000) + ' mV', fmtTd = t => t >= 1e-3 ? CSE.num(t * 1e3) + ' ms' : CSE.num(t * 1e6) + ' µs';
    function draw() {
      const { ctx, W } = cv; ctx.clearRect(0, 0, W, 700);
      const X0 = 10, Y0 = 10, D = 80, cy = Y0 + 4 * D;
      ctx.strokeStyle = 'rgba(159,227,230,.22)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(X0 + i * D, Y0); ctx.lineTo(X0 + i * D, Y0 + 8 * D); ctx.stroke(); }
      for (let j = 0; j <= 8; j++) { ctx.beginPath(); ctx.moveTo(X0, Y0 + j * D); ctx.lineTo(X0 + 10 * D, Y0 + j * D); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(159,227,230,.4)'; for (let i = 0; i <= 50; i++) { const x = X0 + i * D / 5; ctx.beginPath(); ctx.moveTo(x, cy - 4); ctx.lineTo(x, cy + 4); ctx.stroke(); } for (let j = 0; j <= 40; j++) { const y = Y0 + j * D / 5; ctx.beginPath(); ctx.moveTo(X0 + 5 * D - 4, y); ctx.lineTo(X0 + 5 * D + 4, y); ctx.stroke(); }
      ctx.save(); ctx.strokeStyle = C.ch1; ctx.lineWidth = 2.6; ctx.shadowColor = C.ch1; ctx.shadowBlur = 6; ctx.beginPath();
      for (let px = 0; px <= 10 * D; px++) { const t = px / D * R.td; const v = R.off + R.Vp * CSE.onda(R.forma, t / R.T); const y = cy - v / R.vd * D; px ? ctx.lineTo(X0 + px, y) : ctx.moveTo(X0 + px, y); } ctx.stroke(); ctx.restore();
      ctx.fillStyle = C.ch1; ctx.font = '800 17px Archivo'; ctx.fillText('1▶', X0 - 2, cy + 6);
      ctx.fillStyle = '#0b1030'; ctx.fillRect(0, Y0 + 8 * D + 4, W, 60);
      ctx.font = '700 22px "Source Sans 3"'; ctx.fillStyle = C.ch1; ctx.fillText('CH1  ' + fmtVd(R.vd), 20, Y0 + 8 * D + 40); ctx.fillStyle = '#fff'; ctx.fillText('M  ' + fmtTd(R.td), 260, Y0 + 8 * D + 40);
    }
    const num = s => parseFloat(String(s).replace(',', '.'));
    const sol = () => ({ vp: R.Vp, vpp: 2 * R.Vp, t: R.T * 1e3, f: 1 / R.T, off: R.off });
    root.querySelector('.chk').addEventListener('click', () => { const s = sol(); let ok = 0; root.querySelectorAll('input[data-k]').forEach(i => { const k = i.dataset.k, x = num(i.value), c = root.querySelector(`.ck[data-k="${k}"]`); if (!isFinite(x)) { c.innerHTML = ''; return; } const b = Math.abs(x - s[k]) <= Math.max(0.03 * Math.abs(s[k]), 0.01); if (b) ok++; c.innerHTML = `<span class="pill ${b ? 'ok' : 'bad'}">${b ? 'Bien' : 'Revisa'}</span>`; }); root.querySelector('.res').innerHTML = `<div class="msg ${ok === 5 ? 'ok' : 'info'}">${ok} de 5.</div>`; });
    root.querySelector('.sol').addEventListener('click', () => { const s = sol(); root.querySelector('.res').innerHTML = `<div class="msg ok">V<sub>p</sub> = ${CSE.num(R.Vp / R.vd, 1)} div × ${fmtVd(R.vd)} = <b>${fV(s.vp)}</b> · V<sub>pp</sub> = <b>${fV(s.vpp)}</b> · T = ${CSE.num(R.T / R.td, 1)} div × ${fmtTd(R.td)} = <b>${CSE.fmtT(R.T)}</b> · f = 1/T = <b>${CSE.fmtF(s.f)}</b> · offset = <b>${fV(s.off)}</b></div>`; });
    root.querySelector('.nv').addEventListener('click', () => { nuevo(); root.querySelectorAll('input[data-k]').forEach(i => i.value = ''); root.querySelectorAll('.ck').forEach(c => c.innerHTML = ''); root.querySelector('.res').innerHTML = ''; draw(); });
    draw();
  });

  /* =====================================================================
     7. ELIGE LAS ESCALAS (sin AUTOSET)
     ===================================================================== */
  CSE.registrar('p0-escalas', (root) => {
    const RETOS = [['Senoidal de 100 mV de amplitud y 1 kHz', 0.1, 1000, 'senoidal'], ['Triangular de 2 V de amplitud y 250 kHz', 2, 250e3, 'triangular'], ['Senoidal de 1 V de amplitud y 284 Hz (Práctica 1)', 1, 284, 'senoidal'], ['Cuadrada de 5 V de amplitud y 50 Hz', 5, 50, 'cuadrada']];
    let ri = 0;
    const ctl = document.createElement('div');
    const box = CSE.el('<div class="reto" style="margin-bottom:8px"></div>'); ctl.append(box);
    const o = CSE.osciloscopio(root, {
      ancho: 660, controles: ctl, soloCH1: true, sinAutoset: true, conCursores: false, inicial: { v1: 5, tdiv: 10e-3 },
      senales: () => { const [, A, f, forma] = RETOS[ri]; return { T: 1 / f, ch1: t => A * CSE.onda(forma, t * f), ch2: () => 0 }; },
      extraMedidas: S => {
        const [, A, f] = RETOS[ri]; const divs = 2 * A / S.v1, per = 10 * S.tdiv * f;
        const okV = divs >= 4 && divs <= 8.1, okT = per >= 1.5 && per <= 5.5;
        return `<div class="reto" style="margin-top:8px"><span class="cond ${okV ? 'ok' : ''}">Vertical: la señal ocupa ${CSE.num(divs, 1)} div (objetivo: entre 4 y 8)</span><span class="cond ${okT ? 'ok' : ''}">Horizontal: se ven ${CSE.num(per, 1)} periodos (objetivo: entre 2 y 5)</span></div>` + (okV && okT ? '<div class="msg ok">¡Escalas bien elegidas! Así las medidas automáticas no salen con "?".</div>' : '');
      }
    });
    function upd() { box.innerHTML = `<b>Reto ${ri + 1}/${RETOS.length}:</b> ajusta V/div y s/div para ver bien: <b>${RETOS[ri][0]}</b>. <button class="btn sm sec nx">Otro reto</button>`; box.querySelector('.nx').addEventListener('click', () => { ri = (ri + 1) % RETOS.length; upd(); }); o.draw(); }
    upd();
  });

  /* =====================================================================
     8. EL DISPARO (TRIGGER): imagen fija o imagen que "baila"
     ===================================================================== */
  CSE.registrar('p0-disparo', (root) => {
    const S = { nivel: 0, pend: 1, t: 0 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sL = CSE.el('<input type="range" min="-3" max="3" step="0.05" value="0">'); sL.style.width = '320px'; sL.addEventListener('input', () => { S.nivel = +sL.value; });
    const b50 = CSE.el('<button class="btn sm verde">SET TO 50%</button>'); b50.addEventListener('click', () => { S.nivel = 0; sL.value = 0; });
    c1.append(CSE.el('<label>LEVEL</label>'), sL, CSE.el('<span class="val vl"></span>'), CSE.seg([['1', 'Pendiente +'], ['-1', 'Pendiente −']], '1', v => { S.pend = +v; }), b50);
    const cv = CSE.canvas(root, 1400, 420, { label: 'Efecto del disparo' }); cv.cv.style.background = '#0b1030';
    const msg = CSE.el('<div class="msg info"></div>');
    root.prepend(c1); root.append(msg);
    let last = '';
    CSE.animar(root, dt => {
      S.t += dt; root.querySelector('.vl').textContent = CSE.num(S.nivel, 2) + ' V';
      const A = 2, { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const ty = CSE.linMap(-3.2, 3.2, H - 10, 10);
      ctx.strokeStyle = 'rgba(159,227,230,.18)'; for (let i = 0; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(i * 100, 0); ctx.lineTo(i * 100, H); ctx.stroke(); } for (let j = 0; j <= 6; j++) { ctx.beginPath(); ctx.moveTo(0, j * 70); ctx.lineTo(W, j * 70); ctx.stroke(); }
      const ok = Math.abs(S.nivel) < A;
      const trazos = ok ? 1 : 6;
      for (let k = 0; k < trazos; k++) {
        let ph; if (ok) { ph = S.pend > 0 ? Math.asin(S.nivel / A) : Math.PI - Math.asin(S.nivel / A); } else ph = (Math.sin(S.t * 7 + k * 2.1) + 1) * Math.PI;
        ctx.save(); ctx.strokeStyle = C.ch1; ctx.globalAlpha = ok ? 1 : 0.55; ctx.lineWidth = 2.5; ctx.shadowColor = C.ch1; ctx.shadowBlur = 5; ctx.beginPath();
        for (let x = 0; x <= W; x += 2) { const y = ty(A * Math.sin(ph + (x - 300) / 140)); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = '#ff9f6b'; ctx.beginPath(); ctx.moveTo(W - 4, ty(S.nivel)); ctx.lineTo(W - 22, ty(S.nivel) - 10); ctx.lineTo(W - 22, ty(S.nivel) + 10); ctx.fill();
      CSE.line(ctx, [[300, 0], [300, H]], 'rgba(255,159,107,.5)', 1, [4, 4]);
      const t = ok ? `<b>Imagen fija</b>: cada barrido empieza cuando la señal cruza ${CSE.num(S.nivel, 2)} V ${S.pend > 0 ? 'subiendo' : 'bajando'}.` : '<b>La imagen "baila"</b>: el nivel de disparo está fuera de la señal (±2 V), cada barrido empieza en un punto distinto. Pulsa <b>SET TO 50%</b>.';
      if (t !== last) { msg.className = 'msg ' + (ok ? 'ok' : 'bad'); msg.innerHTML = t; last = t; }
    });
  });

  /* =====================================================================
     9. EL POLÍMETRO: ¿cómo lo conecto?
     ===================================================================== */
  CSE.registrar('p0-polimetro', (root) => {
    const S = { mag: 'vdc', borne: 'v', con: 'paralelo' };
    root.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:18px;align-items:start"><div class="a"></div><div class="b"></div></div>';
    const b = root.querySelector('.b');
    b.innerHTML = `<div class="ctl"><label style="min-width:150px">Quiero medir</label></div><div class="ctl"><label style="min-width:150px">Punta roja en</label></div><div class="ctl"><label style="min-width:150px">Conexión</label></div><div class="res"></div>`;
    const ctl = b.querySelectorAll('.ctl');
    ctl[0].append(CSE.seg([['vdc', 'Tensión continua'], ['vac', 'Tensión alterna'], ['i', 'Corriente'], ['r', 'Resistencia']], S.mag, v => { S.mag = v; draw(); }));
    ctl[1].append(CSE.seg([['v', 'V/Ω'], ['ma', 'mA'], ['a', '10 A']], S.borne, v => { S.borne = v; draw(); }));
    ctl[2].append(CSE.seg([['paralelo', 'En paralelo'], ['serie', 'En serie'], ['fuera', 'Componente fuera del circuito']], S.con, v => { S.con = v; draw(); }));
    function draw() {
      root.querySelector('.a').innerHTML = `<img src="assets/img/p0/polimetro.jpg" alt="Polímetro digital con sus partes" style="width:100%;border-radius:10px">`;
      let txt, cls;
      const esV = S.mag === 'vdc' || S.mag === 'vac';
      if (esV && S.borne !== 'v') { cls = 'bad'; txt = '<b>¡Fusible fundido!</b> Mides tensión con la punta en el borne de corriente: el polímetro es casi un cortocircuito. Regla de oro: tras medir corriente, devuelve la punta a <b>V/Ω</b>.'; }
      else if (esV && S.con !== 'paralelo') { cls = 'bad'; txt = 'La tensión se mide <b>en paralelo</b>, entre los dos puntos.'; }
      else if (esV) { cls = 'ok'; txt = `Correcto. Selector en <b>${S.mag === 'vdc' ? 'V⎓' : 'V~'}</b>${S.mag === 'vac' ? ' (da el valor eficaz; exacto sólo para senoidales de baja frecuencia)' : ''}.`; }
      else if (S.mag === 'i') { if (S.borne === 'v') { cls = 'bad'; txt = 'Para corriente, la punta roja va al borne <b>mA</b> (o 10 A).'; } else if (S.con !== 'serie') { cls = 'bad'; txt = S.con === 'paralelo' ? '<b>¡Cortocircuito!</b> El amperímetro en paralelo deja pasar toda la corriente y funde el fusible. Va <b>en serie</b>.' : 'La corriente se mide con el circuito funcionando, <b>en serie</b>.'; } else { cls = 'ok'; txt = 'Correcto, pero en las prácticas <b>no abriremos el circuito</b>: mide la tensión en una resistencia y calcula I = V/R.'; } }
      else { if (S.borne !== 'v') { cls = 'bad'; txt = 'Para resistencia, la punta roja va a <b>V/Ω</b>.'; } else if (S.con !== 'fuera') { cls = 'bad'; txt = 'Con el componente en el circuito (y alimentado) la medida es falsa o daña el polímetro: mídelo <b>sin alimentación y fuera del circuito</b>.'; } else { cls = 'ok'; txt = 'Correcto. No toques las dos puntas con los dedos: medirías tu cuerpo en paralelo.'; } }
      b.querySelector('.res').innerHTML = `<div class="msg ${cls}" style="margin-top:10px;font-size:20px">${txt}</div>`;
    }
    draw();
  });
})();
