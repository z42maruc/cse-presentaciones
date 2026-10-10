/* Simuladores de la Práctica 2 · El diodo semiconductor y el diodo Zener */
(function () {
  const CSE = window.CSE, C = CSE.col;
  const NVT = 1.8 * 0.02585;
  // Dispositivos: Vg = tensión a la que circula 1 mA en directa
  const DISP = {
    si: { n: 'Silicio (1N4007)', Vg: 0.6, Vgam: 0.7 },
    ge: { n: 'Germanio', Vg: 0.22, Vgam: 0.3 },
    ledr: { n: 'LED rojo', Vg: 1.72, Vgam: 1.8, col: '#e23b3b' },
    leda: { n: 'LED azul', Vg: 2.85, Vgam: 3.0, col: '#3b6be2' },
    zener: { n: 'Zener 5V1', Vg: 0.6, Vgam: 0.7, VZ: 5.1 }
  };
  // corriente (A) del dispositivo para una tensión V (ánodo - cátodo)
  CSE.Idiodo = (V, tipo) => {
    const d = DISP[tipo] || DISP.si; const Is = 1e-3 / Math.exp(d.Vg / NVT);
    let I = Is * (Math.exp(Math.min(60, V / NVT)) - 1);
    if (d.VZ) I -= 1e-3 * Math.exp(Math.min(60, (-V - d.VZ) / 0.035));
    return I;
  };
  // punto de trabajo de fuente + resistencia + dispositivo
  CSE.puntoDiodo = (Vin, R, tipo) => { const V = CSE.biseccion(v => CSE.Idiodo(v, tipo) - (Vin - v) / R, -30, 5); return { VD: V, ID: (Vin - V) / R, VR: Vin - V }; };
  const fmtI = I => Math.abs(I) >= 1e-3 ? CSE.num(I * 1e3, 2) + ' mA' : Math.abs(I) >= 1e-6 ? CSE.num(I * 1e6, 1) + ' µA' : Math.abs(I) >= 1e-9 ? CSE.num(I * 1e9, 1) + ' nA' : '≈ 0';

  // símbolos SVG (diodo vertical con el ánodo arriba, entre y0 e y0+60)
  const simbolo = (tipo, x, y0) => {
    const d = DISP[tipo], col = d.col || '#22223a';
    let s = `<path d="M${x} ${y0} v10 M${x - 22} ${y0 + 10} h44 l-22 32 z" fill="${d.col ? d.col + '33' : '#fff'}" stroke="${col}" stroke-width="3.5" stroke-linejoin="round"/>`;
    if (tipo === 'zener') s += `<path d="M${x - 28} ${y0 + 36} l6 6 h44 l6 6" fill="none" stroke="${col}" stroke-width="3.5"/>`;
    else s += `<path d="M${x - 22} ${y0 + 42} h44" stroke="${col}" stroke-width="3.5"/>`;
    s += `<path d="M${x} ${y0 + 42} v18" stroke="#22223a" stroke-width="3.5"/>`;
    if (d.col) s += `<path d="M${x + 28} ${y0 + 14} l16 -12 m-6 0 h6 v6 M${x + 30} ${y0 + 28} l16 -12 m-6 0 h6 v6" fill="none" stroke="${col}" stroke-width="2.5"/>`;
    return s;
  };

  /* =====================================================================
     1. CURVA CARACTERÍSTICA INTERACTIVA, ZONAS Y MODELOS
     ===================================================================== */
  CSE.registrar('diodo-curva', (root) => {
    const S = { tipo: 'si', V: 0.65, modelo: 'real', res: false };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const segT = CSE.seg(Object.entries(DISP).map(([k, d]) => [k, d.n]), S.tipo, v => { S.tipo = v; draw(); });
    c1.append(CSE.el('<label>Componente</label>'), segT);
    const c2 = CSE.el('<div class="ctl"></div>');
    const sV = CSE.el('<input type="range" min="-7" max="3.5" step="0.01" value="0.65">'); sV.style.width = '420px';
    sV.addEventListener('input', () => { S.V = +sV.value; draw(); });
    const segM = CSE.seg([['real', 'Curva real'], ['ideal', 'Modelo ideal'], ['umbral', 'Con Vγ'], ['rho', 'Vγ + resistencia']], S.modelo, v => { S.modelo = v; draw(); });
    const bR = CSE.el('<button class="btn sm sec" aria-pressed="false">Comparar con R = 100 Ω</button>');
    bR.addEventListener('click', () => { S.res = !S.res; bR.setAttribute('aria-pressed', S.res); draw(); });
    c2.append(CSE.el('<label>Tensión V<sub>D</sub></label>'), sV, CSE.el('<span class="val vv"></span>'));
    const c3 = CSE.el('<div class="ctl"></div>'); c3.append(CSE.el('<label>Superponer</label>'), segM, bR);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1fr 380px;gap:16px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cv = CSE.canvas(a, 1040, 470, { label: 'Curva característica tensión-corriente' });
    root.append(c1, c2, c3, g);
    const ZONAS = {
      1: ['Zona 1 · directa, por debajo de Vγ', 'Apenas circula corriente (µA). El diodo todavía <b>no conduce</b>.', '#fff6e6'],
      2: ['Zona 2 · directa, conducción', 'El diodo <b>conduce</b>: la corriente crece muchísimo y la tensión casi no cambia (≈ Vγ).', '#e6f7f2'],
      3: ['Zona 3 · inversa', 'El diodo <b>bloquea</b>: sólo circula la diminuta corriente inversa (nA). Es un interruptor abierto.', '#eef0fb'],
      4: ['Zona 4 · ruptura (Zener)', 'La corriente inversa crece de golpe con la tensión fija en <b>−V<sub>Z</sub></b>. En un Zener es su zona de trabajo; en un 1N4007 lo destruiría (a unos −1000 V).', '#fdeef0']
    };
    function draw() {
      const d = DISP[S.tipo];
      const vmin = -7, vmax = d.Vgam > 2 ? 4 : 3.5; sV.max = vmax; if (S.V > vmax) S.V = vmax;
      root.querySelector('.vv').textContent = CSE.num(S.V, 2) + ' V';
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 70, x1 = W - 20, y0 = 20, y1 = H - 40;
      const fx = CSE.linMap(vmin, vmax, x0, x1), fy = CSE.linMap(-30, 30, y1, y0);
      // bandas de zonas
      const banda = (va, vb, col) => { ctx.fillStyle = col; ctx.fillRect(fx(va), y0, fx(vb) - fx(va), y1 - y0); };
      if (d.VZ) banda(vmin, -d.VZ, 'rgba(210,60,75,.07)');
      banda(d.VZ ? -d.VZ : vmin, 0, 'rgba(76,92,197,.06)'); banda(0, d.Vgam, 'rgba(217,139,0,.07)'); banda(d.Vgam, vmax, 'rgba(0,178,153,.08)');
      for (let v = Math.ceil(vmin); v <= vmax; v++) { ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(fx(v), y0); ctx.lineTo(fx(v), y1); ctx.stroke(); CSE.label(ctx, v + ' V', fx(v), y1 + 22, { align: 'center', color: C.gris, font: '16px "Source Sans 3"' }); }
      CSE.gridY(ctx, fy, [-30, -20, -10, 0, 10, 20, 30], x0, x1, v => v + ' mA', { zero: true });
      CSE.line(ctx, [[fx(0), y0], [fx(0), y1]], '#b4bbe0', 1.5);
      CSE.label(ctx, 'ID (mA)', fx(0) + 8, y0 + 16, { color: C.azul, font: '800 16px Archivo' });
      CSE.label(ctx, 'VD (V)', x1, fy(0) - 10, { align: 'right', color: C.azul, font: '800 16px Archivo' });
      CSE.label(ctx, 'INVERSA', fx(vmin) + 10, y1 - 12, { color: C.azul2, font: '800 15px Archivo' });
      CSE.label(ctx, 'DIRECTA', x1 - 10, y1 - 12, { align: 'right', color: C.teal, font: '800 15px Archivo' });
      // resistencia de comparación
      if (S.res) { CSE.line(ctx, [[fx(-3), fy(-30)], [fx(3), fy(30)]], C.naranja, 2.5, [8, 5]); CSE.label(ctx, 'Resistencia: recta I = V/R', fx(-2.6), fy(-20), { color: C.naranja, font: '800 15px Archivo', bg: 'rgba(255,255,255,.9)' }); }
      // modelo
      const modelo = [];
      if (S.modelo !== 'real') {
        const vz = d.VZ ? -d.VZ : null;
        const off = S.modelo === 'ideal' ? 0 : d.Vgam;
        if (vz !== null && S.modelo !== 'ideal') modelo.push([fx(vz), fy(-30)], [fx(vz), fy(0)]); else modelo.push([fx(vmin), fy(0)]);
        modelo.push([fx(off), fy(0)]);
        if (S.modelo === 'rho') modelo.push([fx(off + 0.3), fy(30)]); else modelo.push([fx(off), fy(30)]);
        CSE.line(ctx, modelo, C.naranja, 3.5, [10, 6]);
      }
      // curva real
      const pts = []; for (let x = x0; x <= x1; x += 1) { const v = fx.inv(x); const I = CSE.Idiodo(v, S.tipo) * 1e3; if (I > 32 || I < -32) continue; pts.push([x, fy(I)]); }
      CSE.line(ctx, pts, d.col || C.indigo, 4);
      // punto
      const I = CSE.Idiodo(S.V, S.tipo); const Im = Math.max(-31, Math.min(31, I * 1e3));
      ctx.fillStyle = C.indigo; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx(S.V), fy(Im), 9, 0, 7); ctx.fill(); ctx.stroke();
      CSE.line(ctx, [[fx(S.V), fy(0)], [fx(S.V), fy(Im)]], C.indigo, 1.5, [4, 4]);
      if (d.VZ) CSE.label(ctx, '−VZ = −' + CSE.num(d.VZ) + ' V', fx(-d.VZ), y0 + 18, { align: 'center', color: C.bad, font: '800 15px Archivo', bg: 'rgba(255,255,255,.9)' });
      CSE.label(ctx, 'Vγ ≈ ' + CSE.num(d.Vgam) + ' V', fx(d.Vgam) + 6, y0 + 40, { color: C.teal, font: '800 15px Archivo', bg: 'rgba(255,255,255,.9)' });
      // panel
      const z = S.V >= d.Vgam ? 2 : S.V >= 0 ? 1 : (d.VZ && S.V <= -d.VZ + 0.05) ? 4 : 3;
      const [tz, dz, cz] = ZONAS[z];
      b.innerHTML = `<div class="kpi" style="width:100%;box-sizing:border-box"><span class="k">Punto de la curva</span><span class="v">V<sub>D</sub> = ${CSE.num(S.V, 2)} V · I<sub>D</sub> = ${fmtI(I)}</span></div>
        <div class="msg" style="background:${cz};margin-top:10px"><b>${tz}</b><br>${dz}</div>
        <div class="msg info" style="margin-top:10px">${S.modelo === 'real' ? 'Ecuación de Shockley: I = I<sub>o</sub>·(e<sup>V/ηV<sub>T</sub></sup> − 1), con V<sub>T</sub> ≈ 25,8 mV.' : S.modelo === 'ideal' ? '<b>Ideal</b>: cortocircuito en directa, circuito abierto en inversa. Útil si las tensiones son mucho mayores que 0,7 V.' : S.modelo === 'umbral' ? '<b>Con tensión umbral</b>: fuente de ' + CSE.num(d.Vgam) + ' V en conducción. Es el modelo de la práctica.' : '<b>Con resistencia</b>: V<sub>D</sub> = Vγ + ρ·I<sub>D</sub>. Para corrientes altas o cálculos precisos.'}</div>`;
    }
    draw();
  });

  /* =====================================================================
     2. CIRCUITO DE MEDIDA PUNTO A PUNTO: fuente + R + diodo
     ===================================================================== */
  CSE.registrar('diodo-circuito', (root, ds) => {
    const S = { tipo: ds.tipo || 'si', Vin: 5, R: 1000, tabla: [], off: 0 };
    const LISTA = { si: [-10, -5, -2, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 3, 5, 10], zener: [-10, -5.5, -5.3, -5, -4.8, -4, -1, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 1, 3, 5], ledr: [-5, 0.5, 1, 1.5, 1.8, 2, 2.5, 3, 5, 10] };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const segT = CSE.seg([['si', 'Diodo 1N4007'], ['zener', 'Zener 5V1'], ['ledr', 'LED rojo']], S.tipo, v => { S.tipo = v; S.tabla = []; draw(); });
    const sV = CSE.el('<input type="range" min="-10" max="10" step="0.1" value="5">'); sV.style.width = '300px';
    sV.addEventListener('input', () => { S.Vin = +sV.value; draw(); });
    const selR = CSE.select([470, 1000, 1500, 2200, 3300], S.R, v => { S.R = v; S.tabla = []; draw(); }, CSE.fmtR);
    c1.append(segT, CSE.el('<label>V<sub>entrada</sub></label>'), sV, CSE.el('<span class="val vin"></span>'), CSE.el('<label>R</label>'), selR);
    const g = CSE.el('<div style="display:grid;grid-template-columns:520px 1fr 330px;gap:14px;align-items:start"></div>');
    const a = CSE.el('<div class="svg"></div>'), b = document.createElement('div'), c = document.createElement('div'); g.append(a, b, c);
    const cv = CSE.canvas(b, 640, 470, { label: 'Recta de carga y punto de trabajo' });
    c.innerHTML = `<label>Tabla del cuaderno</label><div class="ctl" style="margin:4px 0"><button class="btn sm verde anota">Anotar medida</button><button class="btn sm sec todo">Rellenar todo</button><button class="btn sm sec borra">Borrar</button></div>
      <div style="max-height:330px;overflow:auto"><table><thead><tr><th>V<sub>e</sub></th><th>V<sub>D</sub></th><th>V<sub>R</sub></th><th>I<sub>D</sub> (mA)</th></tr></thead><tbody></tbody></table></div>`;
    root.append(c1, g);
    const lees = r => ({ Vin: r, ...CSE.puntoDiodo(r, S.R, S.tipo) });
    c.querySelector('.anota').addEventListener('click', () => { S.tabla.push(lees(S.Vin)); draw(); });
    c.querySelector('.todo').addEventListener('click', () => { S.tabla = (LISTA[S.tipo] || LISTA.si).map(lees); draw(); });
    c.querySelector('.borra').addEventListener('click', () => { S.tabla = []; draw(); });
    a.innerHTML = `<svg viewBox="0 0 520 380" style="width:100%"><style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 20px 'Source Sans 3',sans-serif;fill:#22223a}.b{font:800 22px Archivo,sans-serif}</style>
      <path id="lazo" d="M80 144 V60 H440 V300 H80 Z" fill="none"/>
      <circle cx="80" cy="180" r="36" class="w"/><text x="80" y="172" text-anchor="middle" class="b sg1" fill="#280091">+</text><text x="80" y="208" text-anchor="middle" class="b sg2" fill="#280091">−</text>
      <path d="M80 144 V60 H200 M300 60 H440 V150 M440 210 V300 H80 V216" class="w"/>
      <path d="M200 60 h14 l6 -12 l10 24 l10 -24 l10 24 l10 -24 l6 12 h14" class="w"/>
      <g class="sim-d"></g><g class="pts"></g>
      <text x="20" y="250" class="t vin-t"></text><text x="250" y="30" class="t vr-t" text-anchor="middle"></text><text x="410" y="185" class="t vd-t" text-anchor="end"></text>
      <text x="250" y="105" class="t" text-anchor="middle" fill="#6b6f86">R</text><text x="250" y="345" class="t id-t" text-anchor="middle" fill="#009e91"></text></svg>`;
    const lazo = a.querySelector('#lazo'), L = lazo.getTotalLength(), gp = a.querySelector('.pts');
    gp.innerHTML = Array.from({ length: 16 }, () => '<circle r="6" fill="#00b299"/>').join('');
    const dots = [...gp.children];
    function draw() {
      const p = CSE.puntoDiodo(S.Vin, S.R, S.tipo); S.p = p;
      root.querySelector('.vin').textContent = CSE.num(S.Vin, 1) + ' V';
      a.querySelector('.sim-d').innerHTML = simbolo(S.tipo, 440, 150);
      a.querySelector('.sg1').textContent = S.Vin >= 0 ? '+' : '−'; a.querySelector('.sg2').textContent = S.Vin >= 0 ? '−' : '+';
      a.querySelector('.vin-t').textContent = 'Ve = ' + CSE.num(S.Vin, 1) + ' V';
      a.querySelector('.vr-t').textContent = 'VR = ' + CSE.num(p.VR, 2) + ' V';
      a.querySelector('.vd-t').textContent = 'VD = ' + CSE.num(p.VD, 2) + ' V';
      a.querySelector('.id-t').textContent = 'ID = ' + fmtI(p.ID);
      // recta de carga
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 64, x1 = W - 14, y0 = 20, y1 = H - 40;
      const raw = 10 / S.R * 1e3 * 1.1, pasoI = raw > 20 ? 5 : raw > 8 ? 2 : 1, Imax = Math.ceil(raw / pasoI) * pasoI;
      const fx = CSE.linMap(-10.5, 10.5, x0, x1), fy = CSE.linMap(-Imax, Imax, y1, y0);
      for (let v = -10; v <= 10; v += 2) { ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(fx(v), y0); ctx.lineTo(fx(v), y1); ctx.stroke(); CSE.label(ctx, v + '', fx(v), y1 + 22, { align: 'center', color: C.gris, font: '15px "Source Sans 3"' }); }
      const ys = []; for (let i = -Imax; i <= Imax; i += pasoI) ys.push(i);
      CSE.gridY(ctx, fy, ys, x0, x1, v => v + '', { zero: true }); CSE.line(ctx, [[fx(0), y0], [fx(0), y1]], '#b4bbe0', 1.5);
      CSE.label(ctx, 'ID (mA)', fx(0) + 6, y0 + 14, { color: C.azul, font: '800 15px Archivo' }); CSE.label(ctx, 'VD (V)', x1, fy(0) - 8, { align: 'right', color: C.azul, font: '800 15px Archivo' });
      const pts = []; for (let x = x0; x <= x1; x++) { const I = CSE.Idiodo(fx.inv(x), S.tipo) * 1e3; if (Math.abs(I) > Imax) continue; pts.push([x, fy(I)]); }
      CSE.line(ctx, pts, DISP[S.tipo].col || C.indigo, 3.5);
      // recta de carga: I = (Vin - V)/R
      CSE.line(ctx, [[fx(-10.5), fy((S.Vin + 10.5) / S.R * 1e3)], [fx(10.5), fy((S.Vin - 10.5) / S.R * 1e3)]].map(q => [q[0], Math.max(y0, Math.min(y1, q[1]))]), C.naranja, 2.5, [8, 5]);
      CSE.label(ctx, 'Recta de carga', fx(Math.max(-9, Math.min(7, S.Vin - 4))), fy(Math.min(Imax * 0.8, 4 / S.R * 1e3)) - 6, { color: C.naranja, font: '800 15px Archivo', bg: 'rgba(255,255,255,.85)' });
      S.tabla.forEach(r => { ctx.fillStyle = C.verde; ctx.beginPath(); ctx.arc(fx(r.VD), fy(Math.max(-Imax, Math.min(Imax, r.ID * 1e3))), 6, 0, 7); ctx.fill(); });
      ctx.fillStyle = C.indigo; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx(p.VD), fy(Math.max(-Imax, Math.min(Imax, p.ID * 1e3))), 9, 0, 7); ctx.fill(); ctx.stroke();
      CSE.label(ctx, 'Q', fx(p.VD) + 12, fy(p.ID * 1e3) - 10, { color: C.indigo, font: '900 18px Archivo' });
      c.querySelector('tbody').innerHTML = S.tabla.map(r => `<tr><td>${CSE.num(r.Vin, 1)}</td><td>${CSE.num(r.VD, 2)}</td><td>${CSE.num(r.VR, 2)}</td><td>${CSE.num(r.ID * 1e3, 2)}</td></tr>`).join('');
    }
    CSE.animar(root, dt => {
      const I = S.p ? S.p.ID * 1e3 : 0; const v = Math.abs(I) < 0.01 ? 0 : Math.sign(I) * Math.min(260, 40 * Math.sqrt(Math.abs(I)) + 10);
      S.off = (S.off + v * dt + L) % L;
      dots.forEach((d, i) => { const q = lazo.getPointAtLength((S.off + i * L / dots.length) % L); d.setAttribute('cx', q.x); d.setAttribute('cy', q.y); d.style.opacity = v === 0 ? 0.15 : 0.9; });
    });
    draw();
  });

  /* =====================================================================
     3. POLÍMETRO: ¿está bien el diodo? ¿dónde está el ánodo?
     ===================================================================== */
  CSE.registrar('polimetro', (root) => {
    const S = { inv: false, modo: 'diodo', estado: 'bien', misterio: false, oculto: 'bien' };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const segM = CSE.seg([['diodo', 'Modo diodo'], ['ohm', 'Óhmetro (2 kΩ)']], S.modo, v => { S.modo = v; draw(); });
    const bInv = CSE.el('<button class="btn sm verde">⇄ Invertir puntas</button>'); bInv.addEventListener('click', () => { S.inv = !S.inv; draw(); });
    const bMis = CSE.el('<button class="btn sm sec">Diodo misterioso</button>');
    bMis.addEventListener('click', () => { S.misterio = true; S.oculto = ['bien', 'corto', 'abierto'][Math.floor(Math.random() * 3)]; S.inv = false; S.lecturas = {}; res.innerHTML = '<div class="msg info">Mide en los dos sentidos y decide: ¿cómo está este diodo?</div>'; draw(); });
    c1.append(segM, bInv, bMis);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:16px;align-items:center"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const res = CSE.el('<div></div>');
    b.innerHTML = `<div class="dx" style="font-size:19px;margin-bottom:8px">¿Diagnóstico?</div><div class="ctl"><button class="btn sm sec" data-d="bien">Está bien</button><button class="btn sm sec" data-d="corto">En cortocircuito</button><button class="btn sm sec" data-d="abierto">Abierto</button></div>`;
    b.append(res);
    b.querySelectorAll('[data-d]').forEach(bt => bt.addEventListener('click', () => {
      const real = S.misterio ? S.oculto : 'bien'; const ok = bt.dataset.d === real;
      res.innerHTML = `<div class="msg ${ok ? 'ok' : 'bad'}">${ok ? '¡Correcto!' : 'No.'} ${real === 'bien' ? 'Lectura baja en un sentido (0,5-0,7 V) y OL en el otro: diodo bueno. En la lectura baja, la punta roja está en el ánodo.' : real === 'corto' ? 'Lectura casi 0 en los dos sentidos: el diodo está en cortocircuito.' : 'OL en los dos sentidos: el diodo está abierto (no conduce nunca).'}</div>`;
    }));
    root.append(c1, g);
    function draw() {
      const est = S.misterio ? S.oculto : 'bien';
      const directa = !S.inv; // roja en el ánodo
      let lect;
      if (est === 'corto') lect = S.modo === 'diodo' ? '0.003' : '0.001';
      else if (est === 'abierto') lect = 'OL';
      else lect = directa ? (S.modo === 'diodo' ? '0.612' : '0.684') : 'OL';
      const unidad = lect === 'OL' ? '' : S.modo === 'diodo' ? 'V' : 'kΩ';
      const xr = directa ? 200 : 520, xn = directa ? 520 : 200;
      a.innerHTML = `<svg viewBox="0 0 720 420" style="width:100%"><style>.t{font:700 20px 'Source Sans 3',sans-serif;fill:#22223a}</style>
        <rect x="250" y="10" width="220" height="250" rx="20" fill="#f2c94c" stroke="#22223a" stroke-width="3"/>
        <rect x="272" y="32" width="176" height="74" rx="6" fill="#c9d8b6" stroke="#22223a" stroke-width="2"/>
        <text x="436" y="88" text-anchor="end" style="font:700 46px 'Courier New',monospace;fill:#1e2a10">${lect}</text>
        <text x="440" y="102" text-anchor="end" style="font:700 14px 'Source Sans 3';fill:#1e2a10">${unidad}</text>
        <circle cx="360" cy="170" r="44" fill="#2e2873"/><text x="360" y="177" text-anchor="middle" style="font:800 18px Archivo;fill:#fff">${S.modo === 'diodo' ? '→|' : 'Ω'}</text>
        <circle cx="300" cy="240" r="9" fill="#d23c4b"/><circle cx="420" cy="240" r="9" fill="#22223a"/>
        <path d="M300 240 C 300 320, ${xr} 260, ${xr} 330" fill="none" stroke="#d23c4b" stroke-width="6"/>
        <path d="M420 240 C 420 320, ${xn} 260, ${xn} 330" fill="none" stroke="#22223a" stroke-width="6"/>
        <rect x="170" y="340" width="380" height="16" fill="#b9bdc9"/><rect x="270" y="326" width="180" height="44" rx="10" fill="#222"/><rect x="410" y="326" width="18" height="44" fill="#ddd"/>
        <text x="200" y="405" text-anchor="middle" class="t">ánodo</text><text x="520" y="405" text-anchor="middle" class="t">cátodo (franja)</text>
        ${S.misterio ? '<text x="360" y="300" text-anchor="middle" style="font:800 18px Archivo;fill:#7a86d9">?</text>' : ''}
      </svg>`;
      b.querySelector('.dx').innerHTML = `Punta <b style="color:#d23c4b">roja</b> en el <b>${directa ? 'ánodo' : 'cátodo'}</b>: ${directa ? 'polarización directa' : 'polarización inversa'}.<br><span class="muted" style="font-size:16px">${S.misterio ? 'Diodo misterioso: ¿bueno, en corto o abierto?' : 'Diodo en buen estado. Pulsa "Diodo misterioso" para jugar.'}</span>`;
    }
    draw();
  });

  /* =====================================================================
     4. OSCILOSCOPIO EN MODO XY: la curva en la pantalla
     ===================================================================== */
  CSE.registrar('xy-diodo', (root) => {
    const S = { tipo: 'si', A: 10, R: 1000 };
    root.innerHTML = '';
    const ctl = document.createElement('div');
    ctl.append(CSE.el('<div class="ctl"><label style="min-width:90px">Componente</label></div>'));
    ctl.firstChild.append(CSE.seg([['si', '1N4007'], ['zener', 'Zener 5V1']], S.tipo, v => { S.tipo = v; o.draw(); }));
    const fA = CSE.el('<div class="ctl"><label style="min-width:90px">Generador</label></div>');
    fA.append(CSE.select([2, 5, 10], S.A, v => { S.A = v; o.draw(); }, v => v + ' V de amplitud, 50 Hz'));
    ctl.append(fA, CSE.el('<div class="tiny" style="font-size:16px;color:#6b6f86;margin:4px 0 8px">CH1 = V<sub>D</sub> · CH2 = −V<sub>R</sub> (la masa está entre el diodo y la resistencia). R = 1 kΩ.</div>'));
    const memo = new Map();
    const o = CSE.osciloscopio(root, {
      ancho: 640, controles: ctl, conXY: true, conInv: true, conCursores: false,
      inicial: { v1: 2, v2: 2, tdiv: 5e-3 },
      senales: () => {
        const k = S.tipo + S.A; if (!memo.has(k)) { const n = 400, vd = new Float64Array(n + 1), vr = new Float64Array(n + 1); for (let i = 0; i <= n; i++) { const vin = S.A * Math.sin(2 * Math.PI * i / n); const p = CSE.puntoDiodo(vin, S.R, S.tipo); vd[i] = p.VD; vr[i] = p.VR; } memo.set(k, { vd, vr, n }); }
        const m = memo.get(k), T = 0.02, at = (arr, t) => { let u = (t / T) % 1; if (u < 0) u += 1; const x = u * m.n, i = Math.floor(x), f = x - i; return arr[i] * (1 - f) + arr[Math.min(m.n, i + 1)] * f; };
        return { T, ch1: t => at(m.vd, t), ch2: t => -at(m.vr, t) };
      },
      extraMedidas: s => `<div class="msg ${s.xy ? (s.inv2 ? 'ok' : 'bad') : 'info'}" style="margin-top:8px">${!s.xy ? 'Ahora ves V<sub>D</sub> y −V<sub>R</sub> frente al tiempo. Pulsa <b>Modo XY</b>.' : s.inv2 ? '¡Ya está! Eje X: tensión del diodo. Eje Y: corriente (1 div = ' + CSE.num(s.v2 / S.R * 1e3) + ' mA). Esa es la <b>curva característica</b>.' : 'La curva sale <b>al revés</b>: CH2 mide −V<sub>R</sub>. Pulsa <b>Invertir CH2</b>.'}</div>`
    });
    o.draw();
  });

  /* =====================================================================
     5. REGULADOR CON ZENER
     ===================================================================== */
  CSE.registrar('zener-reg', (root) => {
    const S = { Ve: 10, R: 470, RL: 1000 };
    const IZ = V => 1e-3 * Math.exp(Math.min(60, (V - 5.1) / 0.035)); // corriente inversa del Zener para una tensión inversa V
    const sol = (Ve) => { const V = CSE.biseccion(v => (v / S.RL) + IZ(v) - (Ve - v) / S.R, 0, Math.max(0.001, Ve)); return { VL: V, IR: (Ve - V) / S.R, IL: V / S.RL, IZ: (Ve - V) / S.R - V / S.RL }; };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sV = CSE.el('<input type="range" min="0" max="15" step="0.1" value="10">'); sV.style.width = '320px'; sV.addEventListener('input', () => { S.Ve = +sV.value; draw(); });
    c1.append(CSE.el('<label>V<sub>e</sub></label>'), sV, CSE.el('<span class="val ve"></span>'), CSE.el('<label>R</label>'), CSE.select([220, 330, 470, 680, 1000], S.R, v => { S.R = v; draw(); }, CSE.fmtR), CSE.el('<label>Carga R<sub>L</sub></label>'), CSE.select([470, 1000, 2200, 1e9], S.RL, v => { S.RL = v; draw(); }, v => v > 1e8 ? 'sin carga' : CSE.fmtR(v)));
    const g = CSE.el('<div style="display:grid;grid-template-columns:460px 1fr;gap:16px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cv = CSE.canvas(b, 900, 360, { label: 'Tensión en la carga frente a la tensión de entrada' });
    const kp = CSE.el('<div style="margin-top:8px"></div>'); b.append(kp);
    root.append(c1, g);
    function draw() {
      root.querySelector('.ve').textContent = CSE.num(S.Ve, 1) + ' V';
      const s = sol(S.Ve), PZ = 5.1 * Math.max(0, s.IZ), reg = s.IZ > 0.5e-3;
      a.innerHTML = `<svg viewBox="0 0 460 330" style="width:100%"><style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 19px 'Source Sans 3',sans-serif;fill:#22223a}</style>
        <circle cx="60" cy="170" r="32" class="w"/><text x="60" y="164" text-anchor="middle" class="t">+</text><text x="60" y="196" text-anchor="middle" class="t">−</text>
        <path d="M60 138 V60 H130 M210 60 H400 V130 M400 210 V280 H60 V202 M280 60 V120 M280 180 V280" class="w"/>
        <path d="M130 60 h14 l6 -12 l10 24 l10 -24 l10 24 l10 -24 l6 12 h14" class="w"/>
        <path d="M280 180 h-22 l22 -32 l22 32 z" fill="#fff" stroke="#22223a" stroke-width="3.5" stroke-linejoin="round"/><path d="M252 142 l6 6 h44 l6 6" fill="none" stroke="#22223a" stroke-width="3.5"/><path d="M280 148 v-28" class="w"/>
        ${S.RL < 1e8 ? '<path d="M400 130 v14 l-12 6 l24 10 l-24 10 l24 10 l-24 10 l12 6 v14" class="w"/>' : '<path d="M400 130 v20 M400 190 v20" class="w"/><text x="410" y="176" class="t">abierto</text>'}
        <text x="170" y="34" text-anchor="middle" class="t">R · I<tspan dy="5" font-size="14">R</tspan><tspan dy="-5"> = ${CSE.num(s.IR * 1e3, 1)} mA</tspan></text>
        <text x="225" y="240" class="t" text-anchor="end" fill="#280091">I<tspan dy="5" font-size="14">Z</tspan><tspan dy="-5"> = ${CSE.num(s.IZ * 1e3, 1)} mA</tspan></text>
        <text x="330" y="315" class="t" fill="#009e91">V<tspan dy="5" font-size="14">L</tspan><tspan dy="-5"> = ${CSE.num(s.VL, 2)} V</tspan></text>
        <text x="20" y="250" class="t">Ve = ${CSE.num(S.Ve, 1)} V</text></svg>`;
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 60, x1 = W - 16, y0 = 20, y1 = H - 36, fx = CSE.linMap(0, 15, x0, x1), fy = CSE.linMap(0, 7, y1, y0);
      for (let v = 0; v <= 15; v += 3) { ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(fx(v), y0); ctx.lineTo(fx(v), y1); ctx.stroke(); CSE.label(ctx, v + ' V', fx(v), y1 + 22, { align: 'center', color: C.gris, font: '15px "Source Sans 3"' }); }
      CSE.gridY(ctx, fy, [0, 2, 4, 5.1, 6], x0, x1, v => CSE.num(v) + ' V', { zero: true });
      const pts = []; for (let x = x0; x <= x1; x += 3) pts.push([x, fy(sol(fx.inv(x)).VL)]);
      CSE.line(ctx, pts, C.teal, 4);
      CSE.label(ctx, 'VL frente a Ve', x0 + 10, y0 + 18, { color: C.teal, font: '800 16px Archivo' });
      ctx.fillStyle = C.indigo; ctx.beginPath(); ctx.arc(fx(S.Ve), fy(s.VL), 9, 0, 7); ctx.fill();
      kp.innerHTML = `<span class="kpi"><span class="k">I<sub>R</sub> = (V<sub>e</sub> − V<sub>Z</sub>)/R</span><span class="v">${CSE.num(s.IR * 1e3, 1)} mA</span></span><span class="kpi"><span class="k">I<sub>L</sub> = V<sub>Z</sub>/R<sub>L</sub></span><span class="v">${CSE.num(s.IL * 1e3, 1)} mA</span></span><span class="kpi"><span class="k">I<sub>Z</sub> = I<sub>R</sub> − I<sub>L</sub></span><span class="v">${CSE.num(s.IZ * 1e3, 1)} mA</span></span><span class="kpi"><span class="k">P<sub>Z</sub> = V<sub>Z</sub>·I<sub>Z</sub></span><span class="v" style="color:${PZ > 0.5 ? C.bad : C.indigo}">${CSE.num(PZ * 1e3, 0)} mW</span></span>
        <div class="msg ${reg && PZ <= 0.5 ? 'ok' : 'bad'}" style="margin-top:8px">${!reg ? 'La tensión de entrada no basta: el Zener <b>no conduce</b> y la carga recibe menos de 5,1 V (simple divisor de tensión).' : PZ > 0.5 ? '¡Cuidado! El Zener disipa más de 0,5 W: se calentaría y podría destruirse. Aumenta R.' : '<b>Regulando</b>: aunque V<sub>e</sub> cambie, la carga recibe ≈ 5,1 V. El exceso de tensión cae en R.'}</div>`;
    }
    draw();
  });

  /* =====================================================================
     6. CALCULADORA DE LED PARA UN MICROCONTROLADOR
     ===================================================================== */
  CSE.registrar('led-calc', (root) => {
    const COL = { rojo: [1.8, '#e23b3b'], verde: [2.1, '#22b04b'], azul: [3.0, '#3b6be2'], blanco: [3.1, '#f4f0d0'] };
    const S = { Vcc: 5, col: 'rojo', I: 10 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.el('<label>Alimentación</label>'), CSE.seg([['3.3', '3,3 V (ESP32, Raspberry Pi)'], ['5', '5 V (Arduino)']], '5', v => { S.Vcc = +v; draw(); }));
    const c2 = CSE.el('<div class="ctl"></div>');
    c2.append(CSE.el('<label>Color del LED</label>'), CSE.seg(Object.keys(COL).map(k => [k, k[0].toUpperCase() + k.slice(1)]), S.col, v => { S.col = v; draw(); }));
    const sI = CSE.el('<input type="range" min="1" max="25" step="0.5" value="10">'); sI.addEventListener('input', () => { S.I = +sI.value; draw(); });
    c2.append(CSE.el('<label>Corriente deseada</label>'), sI, CSE.el('<span class="val vi"></span>'));
    const g = CSE.el('<div style="display:grid;grid-template-columns:560px 1fr;gap:20px;align-items:center"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    root.append(c1, c2, g);
    function draw() {
      const [VL, col] = COL[S.col]; root.querySelector('.vi').textContent = CSE.num(S.I, 1) + ' mA';
      const Rid = (S.Vcc - VL) / (S.I / 1000), E12 = CSE.Rs.find(r => r >= Rid) || CSE.Rs[CSE.Rs.length - 1];
      const Ireal = Math.max(0, (S.Vcc - VL) / E12 * 1000), P = Math.pow(Ireal / 1000, 2) * E12;
      const brillo = Math.min(1, Ireal / 20);
      a.innerHTML = `<svg viewBox="0 0 420 300" style="width:100%"><style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round}.t{font:700 19px 'Source Sans 3',sans-serif;fill:#22223a}</style>
        <rect x="10" y="40" width="110" height="200" rx="10" fill="#0e5a8a"/><text x="65" y="70" text-anchor="middle" style="font:800 15px Archivo;fill:#fff">GPIO</text><text x="65" y="92" text-anchor="middle" style="font:700 14px 'Source Sans 3';fill:#cfe">${CSE.num(S.Vcc)} V</text>
        <circle cx="120" cy="120" r="7" fill="#f2c94c"/><circle cx="120" cy="220" r="7" fill="#ccc"/><text x="132" y="250" class="t">GND</text>
        <path d="M120 120 H170 M250 120 H300 V150 M300 192 V220 H120" class="w"/><path d="M170 120 h14 l6 -12 l10 24 l10 -24 l10 24 l10 -24 l6 12 h14" class="w"/>
        <circle cx="300" cy="170" r="${30 + 20 * brillo}" fill="${col}" opacity="${0.15 + 0.5 * brillo}"/>
        <path d="M278 150 h44 l-22 32 z" fill="${col}" stroke="#22223a" stroke-width="3"/><path d="M278 182 h44" stroke="#22223a" stroke-width="3.5"/>
        <text x="210" y="96" text-anchor="middle" class="t">${CSE.fmtR(E12)}</text><text x="340" y="176" class="t">${CSE.num(VL)} V</text></svg>`;
      const avisos = [];
      if (Rid <= 0) avisos.push(['bad', 'La alimentación no llega a la tensión del LED: no se encenderá.']);
      if (S.Vcc === 3.3 && Ireal > 12) avisos.push(['bad', 'Un pin de un ESP32 o una Raspberry Pi no debería dar más de unos 12 mA (la Raspberry, mejor menos de 8 mA): usa un transistor (Práctica 5).']);
      if (S.Vcc === 5 && Ireal > 20) avisos.push(['bad', 'Más de 20 mA por pin de un Arduino es demasiado.']);
      b.innerHTML = `<div class="formula" style="font-size:22px">R = (V<sub>cc</sub> − V<sub>LED</sub>) / I = (${CSE.num(S.Vcc)} − ${CSE.num(VL)}) / ${CSE.num(S.I, 1)} mA = <b>${Rid > 0 ? CSE.fmtR(Rid) : '–'}</b></div>
        <div style="margin-top:10px"><span class="kpi"><span class="k">Valor comercial (E12)</span><span class="v">${CSE.fmtR(E12)}</span></span><span class="kpi"><span class="k">Corriente real</span><span class="v">${CSE.num(Ireal, 1)} mA</span></span><span class="kpi"><span class="k">Potencia en R</span><span class="v">${CSE.num(P * 1000, 1)} mW</span></span></div>
        ${avisos.map(([c, t]) => `<div class="msg ${c}">${t}</div>`).join('') || '<div class="msg ok">Se elige el valor comercial inmediatamente <b>superior</b> para no pasar de la corriente deseada. Una resistencia de ¼ W sobra.</div>'}`;
    }
    draw();
  });

  /* =====================================================================
     7. CONMUTACIÓN: tiempo de recuperación inversa
     ===================================================================== */
  CSE.registrar('trr', (root) => {
    const TIPOS = { '1n4007': ['1N4007 (rectificador)', 2e-6], '1n4148': ['1N4148 (señal, rápido)', 4e-9], schottky: ['Schottky', 0.2e-9] };
    const S = { tipo: '1n4007', f: 50e3 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.el('<label>Diodo</label>'), CSE.seg(Object.entries(TIPOS).map(([k, v]) => [k, v[0]]), S.tipo, v => { S.tipo = v; draw(); }));
    const sf = CSE.logSlider(50, 5e6, S.f, v => { S.f = v; draw(); }); sf.style.width = '360px';
    c1.append(CSE.el('<label>Frecuencia</label>'), sf, CSE.el('<span class="val vf"></span>'));
    const cv = CSE.canvas(root, 1400, 330, { label: 'Corriente del diodo al conmutar' });
    const msg = CSE.el('<div class="msg info"></div>');
    root.prepend(c1); root.append(msg);
    function draw() {
      const trr = TIPOS[S.tipo][1], T = 1 / S.f, ts = trr * 0.6, tt = trr * 0.4;
      root.querySelector('.vf').textContent = CSE.fmtF(S.f);
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 60, x1 = W - 14, tx = CSE.linMap(0, 2 * T, x0, x1), ty = CSE.linMap(-1.3, 1.6, H - 30, 20);
      CSE.gridY(ctx, ty, [-1, 0, 1], x0, x1, v => v === 1 ? '+IF' : v === -1 ? '−IR' : '0', { zero: true });
      const I = t => { let u = t % T; if (u < T / 2) return 1; const d = u - T / 2; if (d < ts) return -1; if (d < ts + tt) return -Math.exp(-(d - ts) / (tt / 4 + 1e-15)); return 0; };
      const vin = t => (t % T) < T / 2 ? 1 : -1;
      const pv = [], pi = []; for (let x = x0; x <= x1; x++) { const t = tx.inv(x); pv.push([x, ty(vin(t) * 1.15)]); pi.push([x, ty(I(t))]); }
      CSE.line(ctx, pv, 'rgba(122,134,217,.5)', 2, [6, 4]); CSE.line(ctx, pi, C.teal, 3.5);
      CSE.label(ctx, '- - tensión aplicada', x0 + 10, 40, { color: C.lavanda, font: '800 15px Archivo' }); CSE.label(ctx, '━ corriente del diodo', x0 + 220, 40, { color: C.teal, font: '800 15px Archivo' });
      const frac = trr / (T / 2);
      root.querySelector('.msg').className = 'msg ' + (frac > 0.1 ? 'bad' : frac > 0.01 ? 'info' : 'ok');
      msg.innerHTML = `t<sub>rr</sub> = t<sub>s</sub> + t<sub>t</sub> ≈ <b>${CSE.fmtT(trr)}</b> · semiperiodo ${CSE.fmtT(T / 2)} · el diodo conduce "al revés" durante el <b>${CSE.num(Math.min(100, frac * 100), 1)} %</b> del semiperiodo. ` + (frac > 0.1 ? 'A esta frecuencia este diodo ya <b>no rectifica bien</b>: por eso las fuentes conmutadas de un ordenador usan diodos rápidos o Schottky.' : frac > 0.01 ? 'Empieza a notarse.' : 'Despreciable a esta frecuencia.');
    }
    draw();
  });

  /* =====================================================================
     8. ENTRENA EL EXAMEN (diodo y Zener, enunciados 2021-2026)
     ===================================================================== */
  CSE.registrar('examen-p2', (root) => {
    const D = [['2021 Junio', 470], ['2021 Julio', 3300], ['2022 Junio', 1500], ['2022 Julio / 2023 Sept.', 2200], ['2023 Junio', 2200], ['2024 Jun/Jul/Sept.', 2200], ['2025 Junio', 2200], ['2025 Julio/Sept.', 1000], ['2026 Junio', 1000], ['2026 Julio/Sept.', 2200]];
    const Z = [['2021 Junio', 470], ['2021 Julio', 3300], ['2022 Junio', 1000], ['2023 Junio', 1000], ['2023 Julio', 2200], ['2023 Sept.', 1000], ['2024 Jun/Jul/Sept.', 2200], ['2025 Junio', 2200], ['2025 Julio/Sept.', 1000], ['2026 Junio', 1000], ['2026 Julio/Sept.', 2200]];
    const v = [];
    D.forEach(([n, R]) => v.push({
      nombre: 'Diodo 1N4007 · ' + n,
      enunciado: `<b style="color:#280091">Examen de laboratorio · ${n}</b><br>Circuito de medida punto a punto con un diodo <b>1N4007</b> y R = <b>${CSE.fmtR(R)}</b>. Modelo con tensión umbral Vγ = 0,7 V. Para el esquema XY, CH2 se pone a 2 V/div.`,
      campos: [
        { k: 'i5', t: 'I<sub>D</sub> teórica con V<sub>e</sub> = 5 V (mA)', sol: 4.3 / R * 1e3 },
        { k: 'i10', t: 'I<sub>D</sub> teórica con V<sub>e</sub> = 10 V (mA)', sol: 9.3 / R * 1e3 },
        { k: 'vr', t: 'V<sub>R</sub> con V<sub>e</sub> = −5 V (V)', sol: 0, abs: 0.05 },
        { k: 'rmin', t: 'R<sub>min</sub> con V = 10 V e I<sub>Dmax</sub> = 1 A (Ω)', sol: 9.3 },
        { k: 'esc', t: 'Escala de corriente en XY (mA/div)', sol: 2 / R * 1e3 }
      ],
      solucion: `I<sub>D</sub>(5 V) = (5 − 0,7)/${CSE.fmtR(R)} = <b>${CSE.num(4.3 / R * 1e3, 2)} mA</b> · I<sub>D</sub>(10 V) = <b>${CSE.num(9.3 / R * 1e3, 2)} mA</b> · en inversa el diodo bloquea: V<sub>R</sub> = <b>0 V</b> · R<sub>min</sub> = (10 − 0,7)/1 A = <b>9,3 Ω</b> (disipa 9,3 W) · escala: 2 V/div ÷ ${CSE.fmtR(R)} = <b>${CSE.num(2 / R * 1e3, 2)} mA/div</b>.`
    }));
    Z.forEach(([n, R]) => v.push({
      nombre: 'Zener 5V1 · ' + n,
      enunciado: `<b style="color:#280091">Examen de laboratorio · ${n}</b><br>Circuito de medida con un diodo <b>Zener de 5,1 V</b> y R = <b>${CSE.fmtR(R)}</b>. Vγ = 0,7 V en directa.`,
      campos: [
        { k: 'vd', t: 'V<sub>D</sub> con V<sub>e</sub> = −10 V (V)', sol: -5.1, signo: true },
        { k: 'id', t: '|I<sub>D</sub>| con V<sub>e</sub> = −10 V (mA)', sol: 4.9 / R * 1e3 },
        { k: 'id4', t: '|I<sub>D</sub>| con V<sub>e</sub> = −4 V (mA)', sol: 0, abs: 0.05 },
        { k: 'idd', t: 'I<sub>D</sub> con V<sub>e</sub> = +5 V (mA)', sol: 4.3 / R * 1e3 },
        { k: 'pz', t: 'Potencia en el Zener con V<sub>e</sub> = −10 V (mW)', sol: 5.1 * 4.9 / R * 1e3 }
      ],
      solucion: `Con −10 V el Zener está en ruptura: V<sub>D</sub> = <b>−5,1 V</b> e |I| = (10 − 5,1)/${CSE.fmtR(R)} = <b>${CSE.num(4.9 / R * 1e3, 2)} mA</b> · con −4 V no llega a V<sub>Z</sub>: <b>0 mA</b> · en directa se comporta como un diodo: (5 − 0,7)/R = <b>${CSE.num(4.3 / R * 1e3, 2)} mA</b> · P<sub>Z</sub> = 5,1·I = <b>${CSE.num(5.1 * 4.9 / R * 1e3, 1)} mW</b>.`
    }));
    CSE.entrenador(root, v);
  });
})();

/* Unión PN animada */
(function () {
  const CSE = window.CSE, C = CSE.col;
  CSE.registrar('union-pn', (root) => {
    const S = { V: 0 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sV = CSE.el('<input type="range" min="-5" max="0.8" step="0.01" value="0">'); sV.style.width = '420px';
    sV.addEventListener('input', () => { S.V = +sV.value; });
    c1.append(CSE.el('<label>Tensión aplicada V<sub>A</sub> − V<sub>K</sub></label>'), sV, CSE.el('<span class="val vv"></span>'));
    [['Inversa −5 V', -5], ['0 V', 0], ['Directa 0,75 V', 0.75]].forEach(([t, v]) => { const b = CSE.el(`<button class="btn sm sec">${t}</button>`); b.addEventListener('click', () => { S.V = v; sV.value = v; }); c1.append(b); });
    const cv = CSE.canvas(root, 1400, 380, { label: 'Unión PN con portadores' });
    const msg = CSE.el('<div class="msg info"></div>');
    root.prepend(c1); root.append(msg);
    const W = 1400, x0 = 120, x1 = 1280, xm = (x0 + x1) / 2, yT = 50, yB = 250;
    const part = []; for (let i = 0; i < 70; i++) part.push({ t: 'h', x: x0 + Math.random() * (xm - x0), y: yT + 10 + Math.random() * (yB - yT - 20) }); for (let i = 0; i < 70; i++) part.push({ t: 'e', x: xm + Math.random() * (x1 - xm), y: yT + 10 + Math.random() * (yB - yT - 20) });
    let ultimoTxt = '';
    CSE.animar(root, dt => {
      const V = S.V; root.querySelector('.vv').textContent = CSE.num(V, 2) + ' V';
      const w = 30 + 90 * Math.sqrt(Math.max(0.02, (0.75 - Math.min(V, 0.73)) / 0.75)) * (V < 0 ? 1 : 1);
      const I = CSE.Idiodo(V, 'si'); const v = I > 1e-5 ? Math.min(260, 40 + 30 * Math.log10(I / 1e-5)) : 0;
      const { ctx } = cv; ctx.clearRect(0, 0, W, 380);
      ctx.fillStyle = '#fde9ec'; ctx.fillRect(x0, yT, xm - x0, yB - yT); ctx.fillStyle = '#e6ebfb'; ctx.fillRect(xm, yT, x1 - xm, yB - yT);
      ctx.fillStyle = 'rgba(122,134,217,.25)'; ctx.fillRect(xm - w / 2, yT, w, yB - yT);
      ctx.strokeStyle = '#22223a'; ctx.lineWidth = 3; ctx.strokeRect(x0, yT, x1 - x0, yB - yT);
      CSE.label(ctx, 'zona de deplexión', xm, yB + 26, { align: 'center', color: C.azul2, font: '800 17px Archivo' });
      part.forEach(p => {
        const izq = xm - w / 2, der = xm + w / 2;
        if (v > 0) { p.x += (p.t === 'h' ? 1 : -1) * v * dt * (0.6 + Math.random() * 0.8); if (p.t === 'h' && p.x > xm + 40) { p.x = x0 + 6; } if (p.t === 'e' && p.x < xm - 40) { p.x = x1 - 6; } }
        else { p.x += (Math.random() - .5) * 30 * dt; if (p.t === 'h') p.x = Math.max(x0 + 8, Math.min(izq - 8, p.x)); else p.x = Math.max(der + 8, Math.min(x1 - 8, p.x)); }
        p.y = Math.max(yT + 10, Math.min(yB - 10, p.y + (Math.random() - .5) * 20 * dt));
        ctx.fillStyle = p.t === 'h' ? '#d23c4b' : '#3b5bdb'; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '900 13px Archivo'; ctx.textAlign = 'center'; ctx.fillText(p.t === 'h' ? '+' : '−', p.x, p.y + 4.5); ctx.textAlign = 'left';
      });
      CSE.label(ctx, 'P  (ánodo)', x0 + 14, yT - 10, { color: '#a3263a', font: '900 24px Archivo' }); CSE.label(ctx, '(cátodo)  N', x1 - 14, yT - 10, { align: 'right', color: '#283e9e', font: '900 24px Archivo' });
      // circuito exterior
      CSE.line(ctx, [[x0, 145], [60, 145], [60, 330], [640, 330]], '#22223a', 3); CSE.line(ctx, [[x1, 145], [1340, 145], [1340, 330], [760, 330]], '#22223a', 3);
      ctx.strokeStyle = '#22223a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(640, 305); ctx.lineTo(640, 355); ctx.moveTo(670, 315); ctx.lineTo(670, 345); ctx.stroke();
      const pos = V >= 0 ? 'izq' : 'der';
      CSE.label(ctx, pos === 'izq' ? '+' : '−', 620, 320, { color: C.indigo, font: '900 22px Archivo' }); CSE.label(ctx, pos === 'izq' ? '−' : '+', 682, 320, { color: C.indigo, font: '900 22px Archivo' });
      CSE.line(ctx, [[670, 330], [760, 330]], '#22223a', 3);
      CSE.label(ctx, (Math.abs(I) < 1e-6 ? 'I ' : 'I = ') + (Math.abs(I) >= 1e-3 ? CSE.num(I * 1e3, 1) + ' mA' : Math.abs(I) >= 1e-6 ? CSE.num(I * 1e6, 1) + ' µA' : '≈ 0 (nA)'), 900, 320, { color: v > 0 ? C.teal : C.gris, font: '800 20px Archivo' });
      const txt = V >= 0.6 ? '<b>Polarización directa</b>: la barrera se estrecha y, superada la tensión umbral, huecos y electrones cruzan la unión: <b>circula corriente</b>.' : V >= 0 ? 'Sin tensión suficiente la zona de deplexión actúa como <b>barrera</b>: casi no hay corriente.' : '<b>Polarización inversa</b>: la barrera se <b>ensancha</b> y sólo circula una corriente diminuta, la corriente inversa de saturación.';
      if (txt !== ultimoTxt) { msg.innerHTML = txt; ultimoTxt = txt; }
    });
  });
})();
