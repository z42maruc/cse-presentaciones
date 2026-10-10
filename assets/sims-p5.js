/* Simuladores de la Práctica 5 · Transistor bipolar II (polarización) */
(function () {
  const CSE = window.CSE, C = CSE.col;
  const svgW = `<style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 18px 'Source Sans 3',sans-serif;fill:#22223a}.b{font:800 19px Archivo,sans-serif}</style>`;
  const resV = (x, y, h, txt, col) => `<path d="M${x} ${y} v${(h - 60) / 2} l-12 5 l24 10 l-24 10 l24 10 l-24 10 l24 10 l-12 5 v${(h - 60) / 2}" class="w"/><text x="${x + 18}" y="${y + h / 2 + 6}" class="t" fill="${col || '#22223a'}">${txt}</text>`;
  const resH = (x, y, w, txt) => `<path d="M${x} ${y} h${(w - 60) / 2} l5 -12 l10 24 l10 -24 l10 24 l10 -24 l10 24 l5 -12 h${(w - 60) / 2}" class="w"/><text x="${x + w / 2}" y="${y - 18}" text-anchor="middle" class="t">${txt}</text>`;
  const npn = (bx, by) => `<circle cx="${bx + 18}" cy="${by}" r="34" fill="#f4f6fd" stroke="#22223a" stroke-width="2.5"/><path d="M${bx} ${by - 22} V${by + 22}" stroke="#22223a" stroke-width="5"/><path d="M${bx} ${by - 10} L${bx + 35} ${by - 30} V${by - 50} M${bx} ${by + 10} L${bx + 35} ${by + 30} V${by + 50}" class="w"/><path d="M${bx + 35} ${by + 30} l-13 -2 l6 -9 z" fill="#22223a"/>`;

  const MONT = {
    fija: { n: 'Polarización fija', R: { RB: 220e3, RC: 820 } },
    emisor: { n: 'Fija con R. de emisor', R: { RB: 180e3, RC: 820, RE: 220 } },
    colector: { n: 'Realimentación de colector', R: { RB: 100e3, RC: 820 } },
    divisor: { n: 'Divisor de tensión', R: { R1: 18e3, R2: 4.7e3, RC: 820, RE: 220 } }
  };
  CSE.MONT_POL = MONT;
  // punto Q de cada montaje
  CSE.polQ = (m, beta, VBE = 0.7, R = MONT[m].R, VCC = 15) => {
    let IB, IC, VE = 0, VC, VCE, sat = false; const RE = R.RE || 0;
    if (m === 'fija') IB = (VCC - VBE) / R.RB;
    else if (m === 'emisor') IB = (VCC - VBE) / (R.RB + (beta + 1) * RE);
    else if (m === 'colector') IB = (VCC - VBE) / (R.RB + (beta + 1) * R.RC);
    else { const VBB = VCC * R.R2 / (R.R1 + R.R2), RBB = R.R1 * R.R2 / (R.R1 + R.R2); IB = (VBB - VBE) / (RBB + (beta + 1) * RE); }
    IB = Math.max(0, IB); IC = beta * IB; VE = (IC + IB) * RE;
    VC = m === 'colector' ? VCC - (IC + IB) * R.RC : VCC - IC * R.RC; VCE = VC - VE;
    if (VCE < 0.2) { sat = true; IC = (VCC - 0.2) / (R.RC + RE); VE = IC * RE; VCE = 0.2; VC = VE + 0.2; }
    return { IB, IC, VE, VC, VCE, sat, RL: R.RC + RE };
  };
  const fI = I => I >= 1e-3 ? CSE.num(I * 1e3, 2) + ' mA' : CSE.num(I * 1e6, 1) + ' µA';

  function esquema(m, R, Q) {
    const kq = '' && Q ? `<text x="400" y="132" class="t" fill="#009e91">V<tspan dy="5" font-size="13">C</tspan><tspan dy="-5"> = ${CSE.num(Q.VC, 2)} V</tspan></text><text x="400" y="320" class="t" fill="#4c5cc5">${R.RE ? 'V<tspan dy="5" font-size="13">E</tspan><tspan dy="-5"> = ' + CSE.num(Q.VE, 2) + ' V</tspan>' : ''}</text><text x="400" y="80" class="t" fill="#280091">I<tspan dy="5" font-size="13">C</tspan><tspan dy="-5"> = ${CSE.num(Q.IC * 1e3, 2)} mA</tspan></text>` : '';
    let s = `<svg viewBox="0 0 560 400" style="width:100%">${svgW}<path d="M120 40 H360" class="w"/><text x="240" y="28" text-anchor="middle" class="b" fill="#280091">V<tspan dy="5" font-size="13">CC</tspan><tspan dy="-5"> = 15 V</tspan></text>
      <path d="M360 40 V50" class="w"/>${resV(360, 50, 90, 'R<tspan dy="5" font-size="13">C</tspan><tspan dy="-5"> ' + CSE.fmtR(R.RC) + '</tspan>')}<path d="M360 140 V150 L360 170" class="w"/><circle cx="360" cy="150" r="5" fill="#22223a"/>
      ${npn(325, 200)}<path d="M120 370 H420 M270 370 v12 M256 382 h28 M262 390 h16" class="w"/>`;
    s += R.RE ? `<path d="M360 250 V265" class="w"/>${resV(360, 265, 90, 'R<tspan dy="5" font-size="13">E</tspan><tspan dy="-5"> ' + CSE.fmtR(R.RE) + '</tspan>')}<path d="M360 355 V370" class="w"/>` : `<path d="M360 250 V370" class="w"/>`;
    if (m === 'fija' || m === 'emisor') s += `<path d="M180 40 V60" class="w"/>${resV(180, 60, 110, 'R<tspan dy="5" font-size="13">B</tspan><tspan dy="-5"> ' + CSE.fmtR(R.RB) + '</tspan>')}<path d="M180 170 V200 H305" class="w"/>`;
    if (m === 'colector') s += `<path d="M360 150 H300 M200 150 H180 V200 H305" class="w"/>${resH(200, 150, 100, 'R<tspan dy="5" font-size="13">B</tspan><tspan dy="-5"> ' + CSE.fmtR(R.RB) + '</tspan>')}`;
    if (m === 'divisor') s += `<path d="M180 40 V50" class="w"/>${resV(180, 50, 100, 'R<tspan dy="5" font-size="13">1</tspan><tspan dy="-5"> ' + CSE.fmtR(R.R1) + '</tspan>')}<path d="M180 150 V250 M180 200 H305" class="w"/><circle cx="180" cy="200" r="5" fill="#22223a"/>${resV(180, 250, 100, 'R<tspan dy="5" font-size="13">2</tspan><tspan dy="-5"> ' + CSE.fmtR(R.R2) + '</tspan>')}<path d="M180 350 V370" class="w"/>`;
    return s + kq + '</svg>';
  }

  /* =====================================================================
     1. LOS CUATRO MONTAJES: estabilidad frente a β y temperatura
     ===================================================================== */
  CSE.registrar('polarizacion', (root) => {
    const S = { m: 'fija', beta0: 145, beta: 145, T: 25 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.seg(Object.entries(MONT).map(([k, v]) => [k, v.n]), S.m, v => { S.m = v; draw(); }));
    const c2 = CSE.el('<div class="ctl"></div>');
    const sB = CSE.el('<input type="range" min="50" max="400" step="5" value="145">'); sB.addEventListener('input', () => { S.beta0 = +sB.value; draw(); });
    const sT = CSE.el('<input type="range" min="0" max="100" step="1" value="25">'); sT.addEventListener('input', () => { S.T = +sT.value; draw(); });
    const bX = CSE.el('<button class="btn sm verde">Cambiar el transistor (otra β)</button>'); bX.addEventListener('click', () => { S.beta0 = Math.round(80 + Math.random() * 240); sB.value = S.beta0; draw(); });
    const bR = CSE.el('<button class="btn sm sec">β = 145, 25 °C</button>'); bR.addEventListener('click', () => { S.beta0 = 145; S.T = 25; sB.value = 145; sT.value = 25; draw(); });
    c2.append(CSE.el('<label>β del transistor</label>'), sB, CSE.el('<span class="val vb"></span>'), CSE.el('<label>Temperatura</label>'), sT, CSE.el('<span class="val vt"></span>'), bX, bR);
    const g = CSE.el('<div style="display:grid;grid-template-columns:390px 1fr 1fr;gap:12px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'), c = document.createElement('div'); g.append(a, b, c);
    const cr = CSE.canvas(b, 560, 340, { label: 'Recta de carga y punto Q' }), ce = CSE.canvas(c, 560, 340, { label: 'Corriente de colector frente a β para los cuatro montajes' });
    const tabla = CSE.el('<div style="margin-top:6px"></div>');
    root.append(c1, c2, g, tabla);
    function draw() {
      S.beta = S.beta0 * (1 + 0.007 * (S.T - 25)); const VBE = 0.7 - 0.002 * (S.T - 25);
      root.querySelector('.vb').textContent = S.beta0; root.querySelector('.vt').textContent = S.T + ' °C';
      const R = MONT[S.m].R, Q = CSE.polQ(S.m, S.beta, VBE);
      a.innerHTML = esquema(S.m, R, Q) + `<div style="font-size:16px"><span class="kpi"><span class="k">I<sub>C</sub></span><span class="v">${CSE.num(Q.IC * 1e3, 2)} mA</span></span><span class="kpi"><span class="k">V<sub>C</sub></span><span class="v">${CSE.num(Q.VC, 2)} V</span></span><span class="kpi"><span class="k">V<sub>CE</sub></span><span class="v">${CSE.num(Q.VCE, 2)} V</span></span></div>`;
      // recta de carga
      const { ctx, W, H } = cr; ctx.clearRect(0, 0, W, H);
      const x0 = 60, x1 = W - 14, y0 = 18, y1 = H - 40, RL = Q.RL, Is = 15 / RL * 1e3;
      const fx = CSE.linMap(0, 16, x0, x1), fy = CSE.linMap(0, Is * 1.2, y1, y0);
      for (let v = 0; v <= 15; v += 3) { ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(fx(v), y0); ctx.lineTo(fx(v), y1); ctx.stroke(); CSE.label(ctx, v + ' V', fx(v), y1 + 22, { align: 'center', color: C.gris, font: '15px "Source Sans 3"' }); }
      CSE.gridY(ctx, fy, [0, 5, 10, 15, 20].filter(v => v <= Is * 1.2), x0, x1, v => v + ' mA', { zero: true });
      CSE.line(ctx, [[fx(0), fy(Is)], [fx(15), fy(0)]], C.naranja, 3.5);
      ctx.fillStyle = 'rgba(0,178,153,.12)'; ctx.fillRect(fx(5), y0, fx(10) - fx(5), y1 - y0); CSE.label(ctx, 'zona buena (≈ VCC/2)', fx(7.5), y0 + 18, { align: 'center', color: C.teal, font: '800 14px Archivo' });
      const Q0 = CSE.polQ(S.m, 145, 0.7);
      ctx.fillStyle = 'rgba(122,134,217,.6)'; ctx.beginPath(); ctx.arc(fx(Q0.VCE), fy(Q0.IC * 1e3), 8, 0, 7); ctx.fill(); CSE.label(ctx, 'Q de diseño', fx(Q0.VCE) + 10, fy(Q0.IC * 1e3) + 24, { color: C.lavanda, font: '800 14px Archivo' });
      ctx.fillStyle = Q.sat ? C.bad : C.indigo; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx(Q.VCE), fy(Q.IC * 1e3), 11, 0, 7); ctx.fill(); ctx.stroke();
      CSE.label(ctx, Q.sat ? 'Q ¡SATURADO!' : 'Q actual', fx(Q.VCE) + 14, fy(Q.IC * 1e3) - 12, { color: Q.sat ? C.bad : C.indigo, font: '900 17px Archivo', bg: 'rgba(255,255,255,.85)' });
      CSE.label(ctx, 'IC', x0 + 4, y0 + 12, { color: C.azul, font: '800 15px Archivo' }); CSE.label(ctx, 'VCE', x1, y1 - 8, { align: 'right', color: C.azul, font: '800 15px Archivo' });
      // estabilidad
      { const { ctx, W, H } = ce; ctx.clearRect(0, 0, W, H);
        const x0 = 56, x1 = W - 14, y0 = 30, y1 = H - 40, fx = CSE.linMap(50, 400, x0, x1), fy = CSE.linMap(0, 20, y1, y0);
        for (let bb = 50; bb <= 400; bb += 50) { ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(fx(bb), y0); ctx.lineTo(fx(bb), y1); ctx.stroke(); CSE.label(ctx, bb + '', fx(bb), y1 + 22, { align: 'center', color: C.gris, font: '15px "Source Sans 3"' }); }
        CSE.gridY(ctx, fy, [0, 5, 10, 15, 20], x0, x1, v => v + ' mA', { zero: true });
        CSE.label(ctx, 'IC frente a β (25 °C)', x0, 18, { color: C.azul, font: '800 15px Archivo' }); CSE.label(ctx, 'β', x1, y1 - 8, { align: 'right', color: C.azul, font: '800 15px Archivo' });
        const cols = { fija: C.bad, emisor: C.naranja, colector: C.azul2, divisor: C.teal };
        const nom = { fija: 'Fija', emisor: 'R. emisor', colector: 'R. colector', divisor: 'Divisor' };
        Object.keys(MONT).forEach(k => { const p = []; for (let x = x0; x <= x1; x += 3) p.push([x, fy(CSE.polQ(k, fx.inv(x)).IC * 1e3)]); CSE.line(ctx, p, cols[k], k === S.m ? 5 : 2.5); });
        const ys = Object.keys(MONT).map(k => [k, fy(CSE.polQ(k, 400).IC * 1e3) - 8]).sort((u, v) => u[1] - v[1]);
        for (let i = 1; i < ys.length; i++) if (ys[i][1] - ys[i - 1][1] < 18) ys[i][1] = ys[i - 1][1] + 18;
        ys.forEach(([k, y]) => CSE.label(ctx, nom[k], x1 - 4, y, { align: 'right', color: cols[k], font: '800 15px Archivo', bg: 'rgba(255,255,255,.8)' }));
        CSE.line(ctx, [[fx(S.beta0), y0], [fx(S.beta0), y1]], C.indigo, 2, [4, 4]);
      }
      tabla.innerHTML = `<table style="font-size:16px"><thead><tr><th>Montaje</th><th>I<sub>C</sub> con β = 145, 25 °C</th><th>I<sub>C</sub> ahora (β = ${CSE.num(S.beta, 0)}, ${S.T} °C)</th><th>Variación</th><th>V<sub>CE</sub> ahora</th></tr></thead><tbody>${Object.keys(MONT).map(k => { const q0 = CSE.polQ(k, 145, 0.7), q = CSE.polQ(k, S.beta, VBE), d = (q.IC - q0.IC) / q0.IC * 100; return `<tr style="${k === S.m ? 'outline:3px solid #00b299' : ''}"><td><b>${MONT[k].n}</b></td><td>${CSE.num(q0.IC * 1e3, 2)} mA</td><td>${CSE.num(q.IC * 1e3, 2)} mA${q.sat ? ' <span class="pill bad">saturado</span>' : ''}</td><td style="color:${Math.abs(d) > 20 ? C.bad : Math.abs(d) > 8 ? C.warn : C.ok};font-weight:800">${d >= 0 ? '+' : ''}${CSE.num(d, 0)} %</td><td>${CSE.num(q.VCE, 2)} V</td></tr>`; }).join('')}</tbody></table>`;
    }
    draw();
  });

  /* =====================================================================
     2. ¿POR QUÉ IMPORTA EL PUNTO Q? Amplificar sin recortar
     ===================================================================== */
  CSE.registrar('amplificador-q', (root) => {
    const S = { vdc: 1.9, A: 0.35, VCC: 15, RC: 1000, RB: 20000, beta: 125, fase: 0 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sQ = CSE.el('<input type="range" min="0.8" max="3.3" step="0.01" value="1.9">'); sQ.style.width = '300px'; sQ.addEventListener('input', () => { S.vdc = +sQ.value; });
    const sA = CSE.el('<input type="range" min="0" max="1.2" step="0.01" value="0.35">'); sA.addEventListener('input', () => { S.A = +sA.value; });
    c1.append(CSE.el('<label>Polarización (V<sub>BB</sub> continua)</label>'), sQ, CSE.el('<span class="val v1"></span>'), CSE.el('<label>Amplitud de la señal</label>'), sA, CSE.el('<span class="val v2"></span>'));
    [['Q centrado', 1.9], ['Cerca de saturación', 2.95], ['Cerca de corte', 1.0]].forEach(([t, v]) => { const b = CSE.el(`<button class="btn sm sec">${t}</button>`); b.addEventListener('click', () => { S.vdc = v; sQ.value = v; }); c1.append(b); });
    const g = CSE.el('<div style="display:grid;grid-template-columns:1fr 1.25fr;gap:14px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cr = CSE.canvas(a, 640, 430, { label: 'Excursión sobre la recta de carga' }), ct = CSE.canvas(b, 820, 430, { label: 'Salida VCE frente al tiempo' });
    const msg = CSE.el('<div class="msg info"></div>');
    root.append(c1, g, msg);
    let last = '';
    CSE.animar(root, dt => {
      S.fase = (S.fase + dt / 3) % 1;
      root.querySelector('.v1').textContent = CSE.num(S.vdc, 2) + ' V'; root.querySelector('.v2').textContent = CSE.num(S.A * 1000, 0) + ' mV';
      const Q = CSE.qBJT(S.vdc, S.RB, S.VCC, S.RC, S.beta);
      const m = CSE.qBJT(S.vdc + S.A * Math.sin(2 * Math.PI * S.fase), S.RB, S.VCC, S.RC, S.beta);
      CSE.dibujaSalida(cr, { VCC: S.VCC, RL: S.RC, beta: S.beta, Q: m });
      // excursión
      const n = 120, pts = []; let clipS = false, clipC = false;
      for (let i = 0; i <= n; i++) { const q = CSE.qBJT(S.vdc + S.A * Math.sin(2 * Math.PI * i / n), S.RB, S.VCC, S.RC, S.beta); pts.push(q); if (q.zona === 'saturacion' || q.VCE < 0.35) clipS = true; if (q.zona === 'corte') clipC = true; }
      { const { ctx, W, H } = ct; ctx.clearRect(0, 0, W, H);
        const x0 = 56, x1 = W - 14, y0 = 20, y1 = H - 36, tx = CSE.linMap(0, 2, x0, x1), ty = CSE.linMap(0, 16, y1, y0);
        CSE.gridY(ctx, ty, [0, 5, 7.5, 10, 15], x0, x1, v => CSE.num(v) + ' V', { zero: true });
        const pv = [], pi = []; for (let x = x0; x <= x1; x++) { const u = tx.inv(x) % 1; const q = pts[Math.round(u * n)]; pv.push([x, ty(q.VCE)]); pi.push([x, ty(Q.VCE - (S.beta * S.A / S.RB) * S.RC * Math.sin(2 * Math.PI * u))]); }
        CSE.line(ctx, pi, 'rgba(122,134,217,.6)', 2, [6, 5]); CSE.line(ctx, pv, C.naranja, 3.5);
        CSE.line(ctx, [[x0, ty(Q.VCE)], [x1, ty(Q.VCE)]], C.indigo, 1.5, [3, 4]);
        CSE.label(ctx, '━ VCE real', x0 + 6, y0 + 16, { color: C.naranja, font: '800 15px Archivo' }); CSE.label(ctx, '- - sin recorte (ideal)', x0 + 140, y0 + 16, { color: C.lavanda, font: '800 15px Archivo' });
        const xc = tx(S.fase); CSE.line(ctx, [[xc, y0], [xc, y1]], C.indigo, 1.5);
      }
      const t = clipS && clipC ? 'La señal es demasiado grande: se <b>recorta por arriba y por abajo</b>.' : clipS ? 'Q está demasiado cerca de <b>saturación</b>: los valles de V<sub>CE</sub> se recortan en ≈ 0,2 V.' : clipC ? 'Q está demasiado cerca de <b>corte</b>: los picos de V<sub>CE</sub> se recortan en V<sub>CC</sub>.' : `Q en V<sub>CE</sub> = ${CSE.num(Q.VCE, 1)} V: la salida es una copia <b>ampliada e invertida</b> de la entrada. Para la máxima excursión, Q en el centro (≈ V<sub>CC</sub>/2).`;
      const cls = clipS || clipC ? 'bad' : 'ok';
      if (t + cls !== last) { msg.className = 'msg ' + cls; msg.innerHTML = t; last = t + cls; }
    });
  });

  /* =====================================================================
     3. DISEÑA LA POLARIZACIÓN PARA UN PUNTO Q
     ===================================================================== */
  CSE.registrar('diseno-pol', (root) => {
    const S = { VCC: 15, VC: 7, IC: 9.75, beta: 145 };
    root.innerHTML = '<div class="ctl c1"></div><div class="res"></div>';
    const c1 = root.querySelector('.c1');
    [['VCC', 'V<sub>CC</sub> (V)'], ['VC', 'V<sub>C</sub> (V)'], ['IC', 'I<sub>C</sub> (mA)'], ['beta', 'β']].forEach(([k, l]) => { const i = CSE.el(`<input type="number" step="any" value="${S[k]}" style="width:90px">`); i.addEventListener('input', () => { const v = parseFloat(i.value); if (isFinite(v) && v > 0) { S[k] = v; draw(); } }); c1.append(CSE.el(`<label>${l}</label>`), i); });
    const E12 = r => { let best = CSE.Rs[0]; CSE.Rs.forEach(x => { if (Math.abs(Math.log(x / r)) < Math.abs(Math.log(best / r))) best = x; }); return best; };
    function draw() {
      const IC = S.IC / 1000, IB = IC / S.beta, IE = IC + IB;
      const RC = (S.VCC - S.VC) / IC, RE = RC / 4;
      const d = {
        fija: { RC, RB: (S.VCC - 0.7) / IB },
        emisor: { RC, RE, RB: (S.VCC - (0.7 + IE * RE)) / IB },
        colector: { RC: (S.VCC - S.VC) / (IC + IB), RB: (S.VC - 0.7) / IB },
        divisor: { RC, RE, R2: (0.7 + IC * RE) / (9 * IB), R1: (S.VCC - (0.7 + IC * RE)) / (10 * IB) }
      };
      const fila = (k) => { const R = d[k], N = {}; Object.keys(R).forEach(x => N[x] = E12(R[x])); const q = CSE.polQ(k, S.beta, 0.7, N, S.VCC);
        const cel = x => R[x] ? `${CSE.fmtR(R[x])} → <b>${CSE.fmtR(N[x])}</b>` : '–';
        return `<tr><td><b>${MONT[k].n}</b></td><td>${cel('RC')}</td><td>${cel('RB')}</td><td>${cel('RE')}</td><td>${cel('R1')}</td><td>${cel('R2')}</td><td>${CSE.num(q.IC * 1e3, 2)} mA · V<sub>C</sub> ${CSE.num(q.VC, 2)} V</td></tr>`; };
      root.querySelector('.res').innerHTML = `<table style="margin-top:8px"><thead><tr><th>Montaje</th><th>R<sub>C</sub></th><th>R<sub>B</sub></th><th>R<sub>E</sub></th><th>R<sub>1</sub></th><th>R<sub>2</sub></th><th>Q con valores comerciales</th></tr></thead><tbody>${Object.keys(MONT).map(fila).join('')}</tbody></table>
        <div class="msg info" style="margin-top:8px">I<sub>B</sub> = I<sub>C</sub>/β = <b>${CSE.num(IB * 1e6, 1)} µA</b>. Cálculo → <b>valor comercial E12</b> más próximo; después se recalcula el punto Q real. Con los datos de la práctica salen justo las resistencias del material: 820 Ω, 220 kΩ, 180 kΩ, 220 Ω, 100 kΩ, 18 kΩ y 4,7 kΩ.</div>`;
    }
    draw();
  });

  /* =====================================================================
     4. ENTRENA EL EXAMEN (polarización)
     ===================================================================== */
  CSE.registrar('examen-p5', (root) => {
    const casos = [
      ['emisor', '2021 Junio (examen 2) / 2022 Julio', 20, { RB: 560e3, RC: 3900, RE: 1000 }, 125],
      ['emisor', '2021 Junio (examen 5)', 20, { RB: 560e3, RC: 1800, RE: 470 }, 125],
      ['divisor', 'Propuesta N6 (divisor de tensión)', 12, { R1: 18e3, R2: 4.7e3, RC: 1000, RE: 220 }, 125],
      ['divisor', 'Material de la práctica', 15, MONT.divisor.R, 145],
      ['fija', 'Material de la práctica', 15, MONT.fija.R, 145],
      ['colector', 'Material de la práctica', 15, MONT.colector.R, 145]
    ];
    CSE.entrenador(root, casos.map(([m, n, VCC, R, beta]) => {
      const q = CSE.polQ(m, beta, 0.7, R, VCC);
      const datos = Object.entries(R).map(([k, v]) => `${k.replace(/^R(.*)$/, 'R<sub>$1</sub>')} = <b>${CSE.fmtR(v)}</b>`).join(', ');
      return {
        nombre: MONT[m].n + ' · ' + n,
        enunciado: `<b style="color:#280091">${n}</b><br>${MONT[m].n} con V<sub>CC</sub> = <b>${VCC} V</b>, ${datos}, β = ${beta}, V<sub>BE</sub> = 0,7 V. Calcula el punto de trabajo.`,
        campos: [{ k: 'ib', t: 'I<sub>B</sub> (µA)', sol: q.IB * 1e6 }, { k: 'ic', t: 'I<sub>C</sub> (mA)', sol: q.IC * 1e3 }, { k: 've', t: 'V<sub>E</sub> (V)', sol: q.VE, abs: R.RE ? undefined : 0.02 }, { k: 'vc', t: 'V<sub>C</sub> (V)', sol: q.VC }, { k: 'vce', t: 'V<sub>CE</sub> (V)', sol: q.VCE }],
        solucion: (m === 'fija' ? `I<sub>B</sub> = (V<sub>CC</sub> − 0,7)/R<sub>B</sub>` : m === 'emisor' ? `I<sub>B</sub> = (V<sub>CC</sub> − 0,7)/(R<sub>B</sub> + (β+1)R<sub>E</sub>)` : m === 'colector' ? `I<sub>B</sub> = (V<sub>CC</sub> − 0,7)/(R<sub>B</sub> + (β+1)R<sub>C</sub>)` : `Thévenin: V<sub>BB</sub> = V<sub>CC</sub>·R<sub>2</sub>/(R<sub>1</sub>+R<sub>2</sub>) = ${CSE.num(VCC * R.R2 / (R.R1 + R.R2), 2)} V, R<sub>BB</sub> = R<sub>1</sub>‖R<sub>2</sub> = ${CSE.fmtR(R.R1 * R.R2 / (R.R1 + R.R2))}; I<sub>B</sub> = (V<sub>BB</sub> − 0,7)/(R<sub>BB</sub> + (β+1)R<sub>E</sub>)`) +
          ` = <b>${CSE.num(q.IB * 1e6, 1)} µA</b> · I<sub>C</sub> = β·I<sub>B</sub> = <b>${CSE.num(q.IC * 1e3, 2)} mA</b> · V<sub>E</sub> = <b>${CSE.num(q.VE, 2)} V</b> · V<sub>C</sub> = <b>${CSE.num(q.VC, 2)} V</b> · V<sub>CE</sub> = <b>${CSE.num(q.VCE, 2)} V</b>${q.sat ? ' (¡saturado!)' : ''}.`
      };
    }));
  });
})();
