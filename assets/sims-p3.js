/* Simuladores de la Práctica 3 · El diodo como rectificador */
(function () {
  const CSE = window.CSE, C = CSE.col;
  const TIPOS = { media: 'Media onda (1 diodo)', toma: 'Onda completa, toma intermedia (2 diodos)', puente: 'Puente de Graetz (4 diodos)' };

  // simulación en régimen permanente: devuelve un periodo de vs, vout, vd, conducción
  CSE.simRect = (o) => {
    const { tipo, Vp, f, R, Cap, vg } = o; const T = 1 / f, N = 1200, dt = T / N, rd = 1.5;
    const nd = tipo === 'puente' ? 2 : 1;
    let v = Cap ? Math.max(0, Vp - nd * vg) : 0;
    const periodos = Cap ? Math.min(60, 4 + Math.ceil(3 * R * Cap / T)) : 1;
    const out = { T, vs: new Float32Array(N), vo: new Float32Array(N), vd: new Float32Array(N), cond: new Int8Array(N) };
    for (let p = 0; p < periodos; p++) {
      for (let i = 0; i < N; i++) {
        const t = (i + 0.5) * dt, vs = Vp * Math.sin(2 * Math.PI * t / T);
        const vr = tipo === 'media' ? vs : Math.abs(vs);
        let id = 0;
        if (Cap) {
          for (let k = 0; k < 4; k++) { id = Math.max(0, (vr - nd * vg - v) / rd); v += (id - v / R) * (dt / 4) / Cap; }
        } else { v = Math.max(0, vr - nd * vg) * R / (R + rd); id = v / R; }
        if (p === periodos - 1) {
          out.vs[i] = vs; out.vo[i] = v; out.cond[i] = id > 1e-6 ? (vs >= 0 ? 1 : -1) : 0;
          out.vd[i] = tipo === 'puente' ? 0 : vs - v;
        }
      }
    }
    // tensión en el diodo D1 del puente: conduce en el semiciclo positivo; en el negativo soporta ≈ −(|vs| − vγ)
    if (tipo === 'puente') for (let i = 0; i < N; i++) { const vs = out.vs[i], vo = out.vo[i], c = out.cond[i]; out.vd[i] = c === 1 ? vg : c === -1 ? -(vo + vg) : (vs - vo) / 2; }
    let s = 0, q = 0, mn = 1e9, mx = -1e9; out.vo.forEach(x => { s += x; q += x * x; mn = Math.min(mn, x); mx = Math.max(mx, x); });
    out.med = s / N; out.rms = Math.sqrt(q / N); out.rizo = mx - mn; out.max = mx;
    out.at = (arr, t) => { let u = (t / T) % 1; if (u < 0) u += 1; return arr[Math.min(N - 1, Math.floor(u * N))]; };
    return out;
  };

  const svgW = `<style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 19px 'Source Sans 3',sans-serif;fill:#22223a}.b{font:800 20px Archivo,sans-serif}</style>`;
  // diodo en cualquier orientación: de (x1,y1) [ánodo] a (x2,y2) [cátodo]
  const diodoSVG = (x1, y1, x2, y2, on, id) => {
    const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, L = Math.hypot(x2 - x1, y2 - y1), m = L / 2;
    const col = on ? '#00b299' : '#22223a', fill = on ? '#bff0e6' : '#fff';
    return `<g transform="translate(${x1} ${y1}) rotate(${ang})"><path d="M0 0 H${m - 16} M${m + 16} 0 H${L}" stroke="#22223a" stroke-width="3.5"/>
      <path d="M${m - 16} -16 L${m + 16} 0 L${m - 16} 16 Z" fill="${fill}" stroke="${col}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${m + 16} -16 V16" stroke="${col}" stroke-width="4"/>
      ${on ? `<circle cx="${m}" cy="0" r="26" fill="#00b299" opacity=".18"/>` : ''}</g>${id ? `<text x="${(x1 + x2) / 2 + 10}" y="${(y1 + y2) / 2 - 18}" class="t" fill="${col}">${id}</text>` : ''}`;
  };
  const resSVG = (x, y1, y2, txt) => `<path d="M${x} ${y1} V${(y1 + y2) / 2 - 36} l-12 6 l24 10 l-24 10 l24 10 l-24 10 l24 10 l-24 10 l12 6 V${y2}" class="w"/><text x="${x + 20}" y="${(y1 + y2) / 2 + 6}" class="t">${txt}</text>`;
  const capSVG = (x, y1, y2) => `<path d="M${x} ${y1} V${(y1 + y2) / 2 - 7} M${x - 22} ${(y1 + y2) / 2 - 7} h44 M${x - 22} ${(y1 + y2) / 2 + 7} h44 M${x} ${(y1 + y2) / 2 + 7} V${y2}" class="w"/><text x="${x - 30}" y="${(y1 + y2) / 2 - 14}" class="t" fill="#d23c4b">+</text>`;

  /* =====================================================================
     1. RECTIFICADOR: media onda, toma intermedia y puente, con filtro
     ===================================================================== */
  CSE.registrar('rectificador', (root, ds) => {
    const S = { tipo: ds.tipo || 'media', Vp: 10, f: 100, R: 1000, Cap: 0, vg: 0.7, ver: 'vo', fase: 0, play: true };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const segT = CSE.seg(Object.entries(TIPOS).map(([k, v]) => [k, v]), S.tipo, v => { S.tipo = v; calc(); });
    c1.append(segT);
    const c2 = CSE.el('<div class="ctl"></div>');
    const sV = CSE.el('<input type="range" min="2" max="20" step="0.5" value="10">'); sV.addEventListener('input', () => { S.Vp = +sV.value; calc(); });
    c2.append(CSE.el('<label>V<sub>p</sub></label>'), sV, CSE.el('<span class="val vp"></span>'),
      CSE.el('<label>f</label>'), CSE.select([50, 100], S.f, v => { S.f = v; calc(); }, v => v + ' Hz'),
      CSE.el('<label>R</label>'), CSE.select([47, 220, 470, 1000, 2200], S.R, v => { S.R = v; calc(); }, CSE.fmtR),
      CSE.el('<label>Condensador</label>'), CSE.select([0, 10e-6, 47e-6, 100e-6, 470e-6, 1000e-6], S.Cap, v => { S.Cap = v; calc(); }, v => v ? CSE.fmtC(v) : 'sin filtro'),
      CSE.el('<label>Diodo</label>'), CSE.seg([['0.7', 'Vγ = 0,7 V'], ['0', 'Ideal']], '0.7', v => { S.vg = +v; calc(); }));
    const g = CSE.el('<div style="display:grid;grid-template-columns:470px 1fr;gap:16px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const c3 = CSE.el('<div class="ctl" style="margin:0 0 4px"></div>');
    const segV = CSE.seg([['vo', 'Ver tensión en la carga'], ['vd', 'Ver tensión en el diodo D1']], 'vo', v => { S.ver = v; });
    const bP = CSE.el('<button class="btn sm sec">⏸ Pausa</button>'); bP.addEventListener('click', () => { S.play = !S.play; bP.textContent = S.play ? '⏸ Pausa' : '▶ Animar'; });
    c3.append(segV, bP); b.append(c3);
    const cv = CSE.canvas(b, 980, 360, { label: 'Tensiones del rectificador frente al tiempo' });
    const kp = CSE.el('<div style="margin-top:6px"></div>'); b.append(kp);
    root.append(c1, c2, g);
    let sim = null;
    function calc() { root.querySelector('.vp').textContent = CSE.num(S.Vp, 1) + ' V'; sim = CSE.simRect({ tipo: S.tipo, Vp: S.Vp, f: S.f, R: S.R, Cap: S.Cap, vg: S.vg }); kpis(); }
    function kpis() {
      const s = sim, Kf = s.rms / s.med, Kr = Math.sqrt(Math.max(0, Kf * Kf - 1));
      const nd = S.tipo === 'puente' ? 2 : 1, Vm = S.Vp - nd * S.vg;
      const teoMed = S.tipo === 'media' ? Vm / Math.PI : 2 * Vm / Math.PI, teoRms = S.tipo === 'media' ? Vm / 2 : Vm / Math.SQRT2;
      const PIV = S.tipo === 'media' ? S.Vp : S.tipo === 'toma' ? 2 * S.Vp : S.Vp;
      const k = (t, v, c) => `<span class="kpi"><span class="k">${t}</span><span class="v" style="${c ? 'color:' + c : ''}">${v}</span></span>`;
      kp.innerHTML = `<div>${k('V<sub>med</sub> (DC)', CSE.num(s.med, 2) + ' V')}${k('V<sub>rms</sub>', CSE.num(s.rms, 2) + ' V')}${k('K<sub>f</sub> = V<sub>rms</sub>/V<sub>med</sub>', CSE.num(Kf, 2))}${k('K<sub>r</sub>', CSE.num(Kr, 2))}${k('Rizado V<sub>r</sub> (pp)', CSE.num(s.rizo, 2) + ' V')}${k('P en R = V<sub>rms</sub>²/R', s.rms * s.rms / S.R >= 1 ? CSE.num(s.rms * s.rms / S.R, 2) + ' W' : CSE.num(s.rms * s.rms / S.R * 1e3, 0) + ' mW', s.rms * s.rms / S.R > 0.25 ? C.bad : '')}</div>
        <div class="msg info" style="margin-top:6px">${S.Cap ? `Con condensador: V<sub>r</sub> ≈ I<sub>med</sub>/(${S.tipo === 'media' ? '' : '2·'}f·C) = ${CSE.num(s.med / S.R / ((S.tipo === 'media' ? 1 : 2) * S.f * S.Cap), 2)} V. Cuanto mayor es C, menor es el rizado. Los diodos sólo conducen cerca de los picos.` : `Teórico (sin filtro): V<sub>med</sub> = ${S.tipo === 'media' ? 'V<sub>max</sub>/π' : '2·V<sub>max</sub>/π'} = <b>${CSE.num(teoMed, 2)} V</b> · V<sub>rms</sub> = ${S.tipo === 'media' ? 'V<sub>max</sub>/2' : 'V<sub>max</sub>/√2'} = <b>${CSE.num(teoRms, 2)} V</b> con V<sub>max</sub> = ${CSE.num(Vm, 2)} V${nd === 2 ? ' (dos diodos en serie: 2·Vγ)' : ''}.`} Tensión inversa de pico por diodo ≈ <b>${CSE.num(PIV, 1)} V</b>.${s.rms * s.rms / S.R > 0.25 ? ' <b style="color:#d23c4b">¡Una resistencia de ¼ W se quemaría!</b>' : ''}</div>`;
    }
    function draw() {
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 60, x1 = W - 14, T = sim.T, tx = CSE.linMap(0, 2 * T, x0, x1);
      const vmax = Math.ceil(S.Vp / 5) * 5 + (S.tipo === 'toma' && S.ver === 'vd' ? S.Vp : 0); const ty = CSE.linMap(-vmax, vmax, H - 28, 16);
      CSE.gridY(ctx, ty, [-vmax, -vmax / 2, 0, vmax / 2, vmax], x0, x1, v => CSE.num(v) + ' V', { zero: true });
      for (let k = 0; k <= 10; k++) { const x = x0 + k * (x1 - x0) / 10; ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(x, 16); ctx.lineTo(x, H - 28); ctx.stroke(); }
      const pi = [], po = []; for (let x = x0; x <= x1; x++) { const t = tx.inv(x); pi.push([x, ty(sim.at(sim.vs, t))]); po.push([x, ty(sim.at(S.ver === 'vo' ? sim.vo : sim.vd, t))]); }
      CSE.line(ctx, pi, 'rgba(122,134,217,.7)', 2, [7, 5]); CSE.line(ctx, po, S.ver === 'vo' ? C.teal : C.naranja, 3.5);
      if (S.ver === 'vo') { CSE.line(ctx, [[x0, ty(sim.med)], [x1, ty(sim.med)]], C.indigo, 2, [3, 4]); CSE.label(ctx, 'Vmed = ' + CSE.num(sim.med, 2) + ' V', x1 - 6, ty(sim.med) - 8, { align: 'right', color: C.indigo, font: '800 16px Archivo', bg: 'rgba(255,255,255,.85)' }); }
      CSE.label(ctx, '- - entrada vs', x0 + 8, 34, { color: C.lavanda, font: '800 16px Archivo' });
      CSE.label(ctx, S.ver === 'vo' ? '━ tensión en la carga' : '━ tensión en el diodo D1', x0 + 170, 34, { color: S.ver === 'vo' ? C.teal : C.naranja, font: '800 16px Archivo' });
      CSE.label(ctx, CSE.fmtT(2 * T / 10) + '/div', x1, H - 6, { align: 'right', color: C.gris, font: '700 15px "Source Sans 3"' });
      const t = S.fase * 2 * T, xc = tx(t); CSE.line(ctx, [[xc, 16], [xc, H - 28]], C.indigo, 2);
      // circuito
      const vs = sim.at(sim.vs, t), cond = sim.at(sim.cond, t), pos = vs >= 0;
      let svg = `<svg viewBox="0 0 470 330" style="width:100%">${svgW}`;
      svg += `<circle cx="60" cy="165" r="34" class="w"/><path d="M36 165 q12 -20 24 0 t24 0" class="w"/><text x="20" y="225" class="t">v<tspan dy="5" font-size="14">s</tspan></text><text x="30" y="120" class="b" fill="#280091">${pos ? '+' : '−'}</text><text x="30" y="225" dx="40" class="b" fill="#280091">${pos ? '−' : '+'}</text>`;
      if (S.tipo === 'media') {
        svg += `<path d="M60 131 V60 H150 M230 60 H360 V110 M360 220 V280 H60 V199" class="w"/>` + diodoSVG(150, 60, 230, 60, cond !== 0, 'D1') + resSVG(360, 110, 220, 'R');
        if (S.Cap) svg += `<path d="M360 80 H430 V140 M430 190 V280 H360" class="w"/>` + capSVG(430, 140, 190);
      } else if (S.tipo === 'toma') {
        svg += `<path d="M60 131 V40 H120 M60 199 V290 H120 M120 40 V290" class="w"/><path d="M140 40 V290" stroke="#22223a" stroke-width="2" stroke-dasharray="4 4"/><path d="M160 40 V290" class="w"/><path d="M160 165 H330" class="w"/><text x="165" y="158" class="t" style="font-size:15px">toma</text>
          <path d="M160 40 H200 M280 40 H360 V110 M160 290 H200 M280 290 H360 V40 M360 220 V165" class="w"/>` + diodoSVG(200, 40, 280, 40, cond === 1, 'D1') + diodoSVG(200, 290, 280, 290, cond === -1, 'D2') + resSVG(360, 110, 220, 'R') + `<path d="M330 165 H360" class="w"/>`;
      } else {
        // puente: nodos A (izq), B (der), P (arriba, +), N (abajo, −)
        svg += `<path d="M60 131 V60 H120 V165 M60 199 V290 H300 V165" class="w"/>` +
          diodoSVG(120, 165, 210, 85, cond === 1, 'D1') + diodoSVG(300, 165, 210, 85, cond === -1, 'D2') + diodoSVG(210, 245, 120, 165, cond === -1, 'D3') + diodoSVG(210, 245, 300, 165, cond === 1, 'D4') +
          `<path d="M210 85 V40 H400 V110 M400 220 V300 H230 V245 H210" class="w"/>` + resSVG(400, 110, 220, 'R') +
          `<circle cx="120" cy="165" r="5" fill="#22223a"/><circle cx="300" cy="165" r="5" fill="#22223a"/><text x="196" y="36" class="b" fill="#d23c4b">+</text><text x="240" y="316" class="b" fill="#280091">−</text>`;
        if (S.Cap) svg += `<path d="M400 60 H450 V140 M450 190 V300 H400" class="w"/>` + capSVG(450, 140, 190);
      }
      svg += `<text x="235" y="326" text-anchor="middle" class="t" fill="${cond ? '#009e91' : '#6b6f86'}">${cond ? 'Conducen: ' + (S.tipo === 'media' ? 'D1' : S.tipo === 'toma' ? (cond === 1 ? 'D1' : 'D2') : (cond === 1 ? 'D1 y D4' : 'D2 y D3')) : (S.Cap ? 'Ningún diodo conduce: el condensador alimenta la carga' : 'Ningún diodo conduce')}</text></svg>`;
      a.innerHTML = svg;
    }
    CSE.animar(root, dt => { if (S.play) S.fase = (S.fase + dt / 4) % 1; draw(); });
    calc();
  });

  /* =====================================================================
     2. CONSTRUYE LA FUENTE DE ALIMENTACIÓN, BLOQUE A BLOQUE
     ===================================================================== */
  CSE.registrar('fuente-bloques', (root) => {
    const B = [['trafo', 'Transformador', '230 V → 12 V'], ['rect', 'Rectificador', 'puente de Graetz'], ['filtro', 'Filtro', 'condensador'], ['reg', 'Regulador', '7805 → 5 V']];
    const S = { trafo: true, rect: true, filtro: false, reg: false };
    root.innerHTML = '<div class="bloques" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"></div><div class="cvx"></div><div class="msg info m"></div>';
    const bl = root.querySelector('.bloques');
    const caja = (t, s, extra) => `<div style="padding:10px 14px;border-radius:10px;text-align:center;min-width:150px;${extra}"><b style="font:800 18px Archivo">${t}</b><br><span style="font-size:15px">${s}</span></div>`;
    function pinta() {
      bl.innerHTML = caja('Red eléctrica', '230 V · 50 Hz', 'background:#fdeef0;border:2px solid #f3b9c0') + B.map(([k, t, s]) => `<span style="font:900 24px Archivo;color:#7a86d9">→</span><button class="btn ${S[k] ? '' : 'sec'}" data-k="${k}" style="flex-direction:column;min-width:160px;padding:8px 12px"><span>${t}</span><span style="font:600 14px 'Source Sans 3'">${s}</span></button>`).join('') + `<span style="font:900 24px Archivo;color:#7a86d9">→</span>` + caja('Ordenador', 'necesita 5 V DC', 'background:#e6f7f2;border:2px solid #9fdccd');
      bl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { S[b.dataset.k] = !S[b.dataset.k]; pinta(); draw(); }));
    }
    const cv = CSE.canvas(root.querySelector('.cvx'), 1400, 300, { label: 'Tensión a la salida de los bloques activos' });
    function v(t) {
      const w = 2 * Math.PI * 50 * t; let x = (S.trafo ? 12 * Math.SQRT2 : 325) * Math.sin(w);
      if (S.rect) x = Math.max(0, Math.abs(x) - 1.4);
      if (S.rect && S.filtro) { const Vp = (S.trafo ? 12 * Math.SQRT2 : 325) - 1.4; const u = (t * 100) % 1; x = Math.max(Math.abs((S.trafo ? 12 * Math.SQRT2 : 325) * Math.sin(w)) - 1.4, Vp * (1 - 0.12 * u)); }
      if (S.reg) { if (!S.rect) x = Math.max(0, Math.min(5, x)); else x = Math.min(5, x); if (S.rect && S.filtro) x = 5; }
      return x;
    }
    function draw() {
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const vmax = S.trafo ? 20 : 340; const x0 = 70, x1 = W - 14, tx = CSE.linMap(0, 0.04, x0, x1), ty = CSE.linMap(-vmax, vmax, H - 24, 14);
      CSE.gridY(ctx, ty, [-vmax, -vmax / 2, 0, vmax / 2, vmax], x0, x1, q => CSE.num(q) + ' V', { zero: true });
      if (vmax === 20) CSE.line(ctx, [[x0, ty(5)], [x1, ty(5)]], C.verde, 1.5, [4, 4]);
      const p = []; for (let x = x0; x <= x1; x++) p.push([x, ty(v(tx.inv(x)))]); CSE.line(ctx, p, C.indigo, 3.5);
      const ok = S.trafo && S.rect && S.filtro && S.reg;
      const mm = root.querySelector('.m'); mm.className = 'm msg ' + (ok ? 'ok' : 'info');
      mm.innerHTML = !S.trafo ? 'Sin transformador llegan <b>325 V de pico</b>: ¡demasiado para cualquier circuito digital!' : !S.rect ? 'Alterna de 12 V eficaces: cambia de signo, el ordenador no puede usarla. Falta <b>rectificar</b>.' : !S.filtro ? 'Ya tiene un solo sentido, pero <b>pulsa</b> mucho (rizado enorme). Falta el <b>filtro</b>.' : !S.reg ? 'Casi continua, con un pequeño rizado y unos 15 V. El <b>regulador</b> la deja en 5 V exactos.' : '<b>¡Fuente completa!</b> 5 V continuos y estables. En esta práctica estudiamos el bloque <b>rectificador</b> y el <b>filtro</b>.';
    }
    pinta(); draw();
  });

  /* =====================================================================
     3. ¿QUÉ MIDE EL POLÍMETRO? Valor medio, eficaz real y lectura en AC
     ===================================================================== */
  CSE.registrar('polimetro-rect', (root) => {
    const S = { forma: 'media', Vp: 10 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.seg([['seno', 'Senoidal'], ['media', 'Media onda'], ['completa', 'Onda completa']], S.forma, v => { S.forma = v; draw(); }));
    const g = CSE.el('<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:16px;align-items:center"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cv = CSE.canvas(a, 640, 300, { label: 'Forma de onda' }), cb = CSE.canvas(b, 760, 300, { label: 'Comparación de lecturas' });
    const msg = CSE.el('<div class="msg info"></div>');
    root.append(c1, g, msg);
    const fn = t => { const s = S.Vp * Math.sin(2 * Math.PI * t); return S.forma === 'seno' ? s : S.forma === 'media' ? Math.max(0, s) : Math.abs(s); };
    function draw() {
      const n = 2000; let s = 0, q = 0; const xs = []; for (let i = 0; i < n; i++) { const x = fn(i / n); xs.push(x); s += x; q += x * x; }
      const med = s / n, rms = Math.sqrt(q / n), acrms = Math.sqrt(Math.max(0, rms * rms - med * med));
      let m = 0; xs.forEach(x => m += Math.abs(x - med)); const lecturaAC = 1.111 * m / n;
      let { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const tx = CSE.linMap(0, 2, 50, W - 10), ty = CSE.linMap(-11, 11, H - 14, 14);
      CSE.gridY(ctx, ty, [-10, 0, 10], 50, W - 10, v => v + ' V', { zero: true });
      const p = []; for (let x = 50; x <= W - 10; x++) p.push([x, ty(fn(tx.inv(x)))]); CSE.line(ctx, p, C.indigo, 3.5);
      CSE.line(ctx, [[50, ty(med)], [W - 10, ty(med)]], C.verde, 2, [5, 4]); CSE.label(ctx, 'valor medio', W - 14, ty(med) - 8, { align: 'right', color: C.teal, font: '800 15px Archivo' });
      ({ ctx, W, H } = cb); ctx.clearRect(0, 0, W, H);
      const barras = [['Vmed (polímetro en DC)', med, C.verde], ['Vrms real (osciloscopio MEASURE)', rms, C.indigo], ['Polímetro en AC (no "True RMS")', lecturaAC, C.naranja], ['Polímetro "True RMS" en AC', acrms, C.lavanda]];
      const fx = CSE.linMap(0, 8, 300, W - 60);
      barras.forEach(([t, v, c], i) => { const y = 20 + i * 70; CSE.label(ctx, t, 290, y + 30, { align: 'right', font: '700 17px "Source Sans 3"' }); ctx.fillStyle = c; ctx.fillRect(300, y + 8, fx(v) - 300, 40); CSE.label(ctx, CSE.num(v, 2) + ' V', fx(v) + 8, y + 34, { color: c, font: '800 19px Archivo' }); });
      msg.innerHTML = S.forma === 'seno' ? 'Con una senoidal pura todo cuadra: el polímetro en AC da el eficaz (7,07 V) y en DC da 0.' : 'Con una señal rectificada, el polímetro en <b>AC</b> quita la continua y además supone que la señal es senoidal (multiplica por 1,11): su lectura <b>no es el eficaz real</b>. Mide V<sub>med</sub> con el polímetro en <b>DC</b> y V<sub>rms</sub> con el <b>MEASURE</b> del osciloscopio. Un "True RMS" en AC da sólo la parte alterna: V<sub>rms</sub>² = V<sub>med</sub>² + V<sub>AC</sub>².';
    }
    draw();
  });

  /* =====================================================================
     4. ¿DÓNDE PONGO LA MASA DE LA SONDA EN EL PUENTE?
     ===================================================================== */
  CSE.registrar('puente-masas', (root) => {
    const S = { masa: null, aislada: false };
    root.innerHTML = '<div class="ctl"><button class="btn sm sec ais" aria-pressed="false">Fuente aislada (transformador)</button><span style="font-size:18px">Pulsa un nodo del puente para conectar ahí la pinza de masa del osciloscopio.</span></div><div class="g" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center"><div class="a"></div><div class="b"></div></div>';
    root.querySelector('.ais').addEventListener('click', e => { S.aislada = !S.aislada; e.target.setAttribute('aria-pressed', S.aislada); draw(); });
    const N = { A: [150, 190, 'A', 118, 182, 'end'], B: [430, 190, 'B', 462, 182, 'start'], P: [290, 60, '+', 262, 52, 'end'], M: [290, 320, '−', 262, 340, 'end'] };
    function draw() {
      const m = S.masa; let corto = null;
      if (m && !S.aislada) corto = m === 'B' ? 'gen' : m === 'P' ? 'D1' : m === 'M' ? 'D3' : null;
      const on = id => corto === id;
      let svg = `<svg viewBox="0 0 600 410" style="width:100%">${svgW}<circle cx="60" cy="190" r="32" class="w"/><path d="M38 190 q11 -18 22 0 t22 0" class="w"/><path d="M60 158 V120 H150 V190 M60 222 V370 H430 V190" class="w"/>
        <path d="M60 222 V240 M44 240 h32 M50 248 h20 M56 256 h8" class="w" style="display:${S.aislada ? 'none' : 'inline'}"/>` +
        diodoSVG(150, 190, 290, 60, false, 'D1') + diodoSVG(430, 190, 290, 60, false, 'D2') + diodoSVG(290, 320, 150, 190, false, 'D3') + diodoSVG(290, 320, 430, 190, false, 'D4') +
        `<path d="M290 60 V20 H560 V150 M560 230 V350 H290 V320" class="w"/>` + resSVG(560, 150, 230, 'R');
      if (corto) { const [x, y] = N[m]; svg += `<path d="M${x} ${y} L${corto === 'gen' ? 60 : 150} ${corto === 'gen' ? 222 : 190}" stroke="#d23c4b" stroke-width="7" stroke-dasharray="10 6"/>`; }
      Object.entries(N).forEach(([k, [x, y, t, tx, ty, an]]) => { svg += `<circle cx="${x}" cy="${y}" r="16" fill="${m === k ? (corto ? '#d23c4b' : '#00b299') : '#fff'}" stroke="#280091" stroke-width="3" style="cursor:pointer" data-n="${k}"/><text x="${tx}" y="${ty}" text-anchor="${an}" class="b" fill="#280091">${t}</text>`; }); svg += '<text x="300" y="395" text-anchor="middle" class="t" fill="#6b6f86">A = masa del generador (unida a tierra por el enchufe)</text>';
      root.querySelector('.a').innerHTML = svg + '</svg>';
      root.querySelectorAll('[data-n]').forEach(c => c.addEventListener('click', () => { S.masa = c.dataset.n; draw(); }));
      root.querySelector('.b').innerHTML = !m ? '<div class="msg info">Las masas del generador y del osciloscopio están unidas a través del enchufe (tierra). Elige dónde pondrías la pinza.</div>'
        : S.aislada ? '<div class="msg ok">Con la fuente <b>aislada</b> (transformador) el puente no tiene ningún punto unido a tierra: puedes poner la masa en <b>−</b> y medir la carga con CH1 en <b>+</b>.</div>'
        : m === 'A' ? '<div class="msg ok"><b>Correcto</b>: es el mismo punto que la masa del generador. Pero la carga no tiene un extremo en A: para verla usa dos sondas (CH1 en +, CH2 en −) y el canal matemático <b>CH1 − CH2</b>.</div>'
        : m === 'B' ? '<div class="msg bad"><b>¡Cortocircuitas el generador!</b> B queda unido a su masa a través de tierra.</div>'
        : `<div class="msg bad"><b>¡Cortocircuitas ${corto}!</b> Ese nodo queda unido a la masa del generador (A) a través de tierra, puenteando el diodo. La forma de onda saldrá mal y puedes dañar componentes.</div>`;
    }
    draw();
  });

  /* =====================================================================
     5. CALCULA EL CONDENSADOR DEL FILTRO
     ===================================================================== */
  CSE.registrar('calc-c', (root) => {
    const S = { I: 100, f: 50, Vr: 1, onda: 2 };
    root.innerHTML = '<div class="ctl c1"></div><div class="res"></div>';
    const c1 = root.querySelector('.c1');
    const sl = (min, max, step, v, k, lab, u) => { const s = CSE.el(`<input type="range" min="${min}" max="${max}" step="${step}" value="${v}">`); const val = CSE.el(`<span class="val">${CSE.num(v)} ${u}</span>`); s.addEventListener('input', () => { S[k] = +s.value; val.textContent = CSE.num(S[k]) + ' ' + u; draw(); }); c1.append(CSE.el(`<label>${lab}</label>`), s, val); };
    sl(10, 2000, 10, S.I, 'I', 'Corriente de la carga', 'mA'); sl(0.1, 3, 0.1, S.Vr, 'Vr', 'Rizado máximo', 'V');
    c1.append(CSE.seg([['2', 'Onda completa'], ['1', 'Media onda']], '2', v => { S.onda = +v; draw(); }), CSE.select([50, 60], 50, v => { S.f = v; draw(); }, v => v + ' Hz'));
    function draw() {
      const Cn = S.I / 1000 / (S.onda * S.f * S.Vr); const com = [10e-6, 22e-6, 47e-6, 100e-6, 220e-6, 470e-6, 1000e-6, 2200e-6, 4700e-6, 10000e-6].find(c => c >= Cn) || 10000e-6;
      root.querySelector('.res').innerHTML = `<div class="formula" style="font-size:24px">C = I<sub>med</sub> / (${S.onda === 2 ? '2·' : ''}f·V<sub>r</sub>) = ${CSE.num(S.I)} mA / (${S.onda === 2 ? '2·' : ''}${S.f} Hz · ${CSE.num(S.Vr)} V) = <b>${CSE.fmtC(Cn)}</b></div>
        <div style="margin-top:8px"><span class="kpi"><span class="k">Valor comercial</span><span class="v">${CSE.fmtC(com)}</span></span><span class="kpi"><span class="k">Rizado real</span><span class="v">${CSE.num(S.I / 1000 / (S.onda * S.f * com), 2)} V</span></span></div>
        <div class="msg info">Un portátil que consume 3 A necesitaría condensadores enormes a 50 Hz. Por eso las fuentes modernas son <b>conmutadas</b>: trabajan a cientos de kHz y el condensador puede ser mucho más pequeño.</div>`;
    }
    draw();
  });

  /* =====================================================================
     6. ENTRENA EL EXAMEN (rectificador 2022-2026)
     ===================================================================== */
  CSE.registrar('examen-p3', (root) => {
    const L = [['2022 Junio', 4, 50, 1500, 'rizado', 'media'], ['2022 Jul / 2023 Sep / 2024 Jul', 10, 100, 2200, 'forma', 'media'], ['2022 Sep / 2023 Jul', 6, 50, 2200, 'rizado', 'media'], ['2024 Sept. (A)', 8, 50, 2200, 'forma', 'media'],
      ['2024 Sept. (B)', 8, 50, 1000, null, 'media'], ['2025 Junio', 6, 50, 2200, 'rizado', 'media'], ['2025 Julio/Sept.', 10, 50, 2200, 'forma', 'media'], ['2026 Junio', 10, 50, 1000, null, 'media'], ['2026 Julio/Sept.', 10, 100, 1000, null, 'media'], ['2026 Julio (onda completa)', 12, 50, 1000, null, 'puente']];
    CSE.entrenador(root, L.map(([n, Vpp, f, R, fac, tipo]) => {
      const Vp = Vpp / 2, nd = tipo === 'puente' ? 2 : 1, Vm = Vp - nd * 0.7, med = tipo === 'media' ? Vm / Math.PI : 2 * Vm / Math.PI, rms = tipo === 'media' ? Vm / 2 : Vm / Math.SQRT2, P = rms * rms / R * 1e3;
      const campos = [{ k: 'vm', t: 'V<sub>max</sub> en la carga (V)', sol: Vm }, { k: 'med', t: 'V<sub>med</sub> teórica (V)', sol: med }, { k: 'rms', t: 'V<sub>rms</sub> teórica (V)', sol: rms }, { k: 'p', t: 'Potencia en R (mW)', sol: P }];
      if (fac === 'forma' || tipo === 'puente') campos.push({ k: 'kf', t: 'Factor de forma K<sub>f</sub>', sol: rms / med });
      if (fac === 'rizado') campos.push({ k: 'kr', t: 'Factor de rizado K<sub>r</sub>', sol: Math.sqrt(Math.pow(rms / med, 2) - 1) });
      campos.push({ k: 'td', t: 'Time/div para ver 2 periodos (ms)', sol: 2 / f / 10 * 1e3, tol: 0.6 });
      return {
        nombre: (tipo === 'puente' ? 'Onda completa · ' : 'Media onda · ') + n,
        enunciado: `<b style="color:#280091">Examen de laboratorio · ${n}</b><br>Rectificador de <b>${tipo === 'puente' ? 'onda completa en puente' : 'media onda'}</b> alimentado con <b>${Vpp} Vpp</b> y <b>${f} Hz</b>, con R = <b>${CSE.fmtR(R)}</b>. Usa el modelo de diodo con Vγ = 0,7 V.`,
        campos, solucion: `V<sub>p</sub> = ${CSE.num(Vp)} V → V<sub>max</sub> = ${CSE.num(Vp)} − ${nd === 2 ? '1,4' : '0,7'} = <b>${CSE.num(Vm, 2)} V</b> · V<sub>med</sub> = ${tipo === 'media' ? 'V<sub>max</sub>/π' : '2V<sub>max</sub>/π'} = <b>${CSE.num(med, 2)} V</b> · V<sub>rms</sub> = ${tipo === 'media' ? 'V<sub>max</sub>/2' : 'V<sub>max</sub>/√2'} = <b>${CSE.num(rms, 2)} V</b> · P = V<sub>rms</sub>²/R = <b>${CSE.num(P, 1)} mW</b> · K<sub>f</sub> = ${CSE.num(rms / med, 2)}, K<sub>r</sub> = ${CSE.num(Math.sqrt(Math.pow(rms / med, 2) - 1), 2)} · T = ${CSE.num(1000 / f)} ms: unos ${CSE.num(2 / f / 10 * 1e3)} ms/div (o el valor de la escala más próximo).`
      };
    }));
  });
})();
