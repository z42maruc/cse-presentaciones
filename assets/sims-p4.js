/* Simuladores de la Práctica 4 · Transistor bipolar I (zonas de trabajo y conmutación) */
(function () {
  const CSE = window.CSE, C = CSE.col;
  // característica de salida: IC(VCE, IB)
  CSE.icBJT = (vce, ib, beta) => beta * ib * (1 + vce / 500) * (1 - Math.exp(-Math.max(0, vce) / 0.07));
  // punto de trabajo del circuito VBB-RB / VCC-RL (emisor a masa)
  CSE.qBJT = (VBB, RB, VCC, RL, beta) => {
    const IB = Math.max(0, (VBB - 0.7) / RB);
    const VCE = IB === 0 ? VCC : CSE.biseccion(v => CSE.icBJT(v, IB, beta) - (VCC - v) / RL, 0, VCC);
    const IC = (VCC - VCE) / RL, ICsat = (VCC - 0.2) / RL;
    const zona = IB === 0 ? 'corte' : beta * IB >= ICsat ? 'saturacion' : 'activa';
    return { IB, IC, VCE, ICsat, zona, PT: VCE * IC, PL: IC * IC * RL };
  };
  const ZN = { corte: ['Corte', '#6b6f86', 'interruptor abierto: I<sub>C</sub> ≈ 0, V<sub>CE</sub> ≈ V<sub>CC</sub>'], activa: ['Activa', '#00a383', 'fuente de corriente: I<sub>C</sub> = β·I<sub>B</sub> (amplifica)'], saturacion: ['Saturación', '#d23c4b', 'interruptor cerrado: V<sub>CE</sub> ≈ 0,2 V, I<sub>C</sub> = I<sub>C,sat</sub>'] };
  CSE.ZONAS_BJT = ZN;
  const fI = I => Math.abs(I) >= 1e-3 ? CSE.num(I * 1e3, 2) + ' mA' : Math.abs(I) >= 1e-6 ? CSE.num(I * 1e6, 1) + ' µA' : '0';
  const svgW = `<style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 19px 'Source Sans 3',sans-serif;fill:#22223a}.b{font:800 20px Archivo,sans-serif}</style>`;
  const resH = (x, y, w = 100) => `<path d="M${x} ${y} h${w * .14} l6 -12 l10 24 l10 -24 l10 24 l10 -24 l6 12 h${w * .14 + (w - 80) * .72}" class="w"/>`;
  const resV = (x, y, h = 90) => `<path d="M${x} ${y} v${(h - 60) / 2} l-12 5 l24 10 l-24 10 l24 10 l-24 10 l24 10 l-12 5 v${(h - 60) / 2}" class="w"/>`;
  const fuente = (x, y, txt, pol = true) => `<circle cx="${x}" cy="${y}" r="28" class="w"/><text x="${x}" y="${y - 6}" text-anchor="middle" class="b" fill="#280091">${pol ? '+' : '−'}</text><text x="${x}" y="${y + 20}" text-anchor="middle" class="b" fill="#280091">${pol ? '−' : '+'}</text><text x="${x + 36}" y="${y + 6}" class="t">${txt}</text>`;
  // transistor npn: base en (bx,by); colector arriba en (bx+35, by-40); emisor abajo en (bx+35, by+40)
  const npn = (bx, by, col = '#22223a', pnp = false) => `<circle cx="${bx + 18}" cy="${by}" r="34" fill="#f4f6fd" stroke="${col}" stroke-width="2.5"/>
    <path d="M${bx - 20} ${by} H${bx}" class="w"/><path d="M${bx} ${by - 22} V${by + 22}" stroke="${col}" stroke-width="5"/>
    <path d="M${bx} ${by - 10} L${bx + 35} ${by - 30} V${by - 50} M${bx} ${by + 10} L${bx + 35} ${by + 30} V${by + 50}" class="w" style="stroke:${col}"/>
    ${pnp ? `<path d="M${bx + 6} ${by + 13} l12 -2 l-5 10 z" fill="${col}"/>` : `<path d="M${bx + 35} ${by + 30} l-13 -2 l6 -9 z" fill="${col}"/>`}
    <text x="${bx - 22}" y="${by - 10}" class="t" style="font-size:16px">B</text><text x="${bx + 44}" y="${by - 34}" class="t" style="font-size:16px">C</text><text x="${bx + 44}" y="${by + 42}" class="t" style="font-size:16px">E</text>`;

  // dibuja la característica de salida, la recta de carga y Q
  CSE.dibujaSalida = (cv, o) => {
    const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
    const { VCC, RL, beta, Q } = o; const ICsat = VCC / RL * 1e3;
    const x0 = 66, x1 = W - 16, y0 = 18, y1 = H - 40;
    const fx = CSE.linMap(0, VCC * 1.08, x0, x1), Imax = ICsat * 1.25, fy = CSE.linMap(0, Imax, y1, y0);
    ctx.fillStyle = 'rgba(210,60,75,.07)'; ctx.fillRect(x0, y0, fx(0.4) - x0, y1 - y0);
    ctx.fillStyle = 'rgba(107,111,134,.10)'; ctx.fillRect(x0, fy(Imax * 0.03), x1 - x0, y1 - fy(Imax * 0.03));
    const pv = VCC > 12 ? 3 : VCC > 6 ? 2 : 1; for (let v = 0; v <= VCC * 1.05; v += pv) { ctx.strokeStyle = '#eceef8'; ctx.beginPath(); ctx.moveTo(fx(v), y0); ctx.lineTo(fx(v), y1); ctx.stroke(); CSE.label(ctx, v + ' V', fx(v), y1 + 22, { align: 'center', color: C.gris, font: '15px "Source Sans 3"' }); }
    const pI = Imax > 40 ? 10 : Imax > 16 ? 5 : Imax > 6 ? 2 : 1; const ys = []; for (let i = 0; i <= Imax; i += pI) ys.push(i);
    CSE.gridY(ctx, fy, ys, x0, x1, v => v + ' mA', { zero: true });
    CSE.label(ctx, 'IC', x0 + 6, y0 + 14, { color: C.azul, font: '800 16px Archivo' }); CSE.label(ctx, 'VCE', x1, y1 - 8, { align: 'right', color: C.azul, font: '800 16px Archivo' });
    // familia de curvas
    const paso = ICsat / 1000 / beta / 6.5; const exp10 = Math.pow(10, Math.floor(Math.log10(paso))); const nice = [1, 2, 2.5, 5, 10].map(m => m * exp10).find(m => m >= paso);
    for (let k = 1; k <= 6; k++) {
      const ib = k * nice, pts = []; for (let x = x0; x <= x1; x += 2) { const ic = CSE.icBJT(fx.inv(x), ib, beta) * 1e3; if (ic > Imax) break; pts.push([x, fy(ic)]); }
      CSE.line(ctx, pts, 'rgba(76,92,197,.45)', 2);
      const ic = CSE.icBJT(VCC, ib, beta) * 1e3; if (ic < Imax * 0.97) CSE.label(ctx, 'IB = ' + (ib >= 1e-3 ? CSE.num(ib * 1e3, 2) + ' mA' : CSE.num(ib * 1e6, 0) + ' µA'), x1 - 4, fy(ic) - 6, { align: 'right', color: C.azul2, font: '700 14px "Source Sans 3"' });
    }
    // curva de I_B del punto Q
    if (Q && Q.IB > 0) { const pts = []; for (let x = x0; x <= x1; x += 2) { const ic = CSE.icBJT(fx.inv(x), Q.IB, beta) * 1e3; if (ic > Imax) break; pts.push([x, fy(ic)]); } CSE.line(ctx, pts, C.teal, 3); }
    // recta de carga
    CSE.line(ctx, [[fx(0), fy(ICsat)], [fx(VCC), fy(0)]], C.naranja, 3.5);
    CSE.label(ctx, 'Recta de carga', fx(VCC * 0.62), fy(ICsat * 0.38) - 12, { color: C.naranja, font: '800 16px Archivo', bg: 'rgba(255,255,255,.85)' });
    CSE.label(ctx, CSE.num(ICsat, 1) + ' mA', fx(0) + 8, fy(ICsat) - 8, { color: C.naranja, font: '800 14px Archivo' });
    CSE.label(ctx, 'SATURACIÓN', fx(0.2), y0 + 30, { color: C.bad, font: '800 13px Archivo' });
    CSE.label(ctx, 'CORTE', x1 - 10, y1 - 26, { align: 'right', color: C.gris, font: '800 13px Archivo' });
    if (o.pmax) { const x = fx(VCC / 2), y = fy(ICsat / 2); ctx.strokeStyle = C.bad; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.stroke(); CSE.label(ctx, 'PT máx', x + 14, y - 10, { color: C.bad, font: '800 14px Archivo' }); }
    if (Q) { const x = fx(Q.VCE), y = fy(Q.IC * 1e3); ctx.fillStyle = ZN[Q.zona][1]; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill(); ctx.stroke(); CSE.label(ctx, 'Q', x + 14, y + 22, { color: C.indigo, font: '900 20px Archivo' }); }
    return { fx, fy };
  };

  /* =====================================================================
     1. PUNTO DE TRABAJO: mallas, recta de carga y zonas
     ===================================================================== */
  CSE.registrar('bjt-q', (root) => {
    const S = { VBB: 1.5, RB: 10000, VCC: 15, RL: 1000, beta: 125, off1: 0, off2: 0 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sV = CSE.el('<input type="range" min="0" max="12" step="0.05" value="1.5">'); sV.addEventListener('input', () => { S.VBB = +sV.value; draw(); });
    c1.append(CSE.el('<label>V<sub>BB</sub></label>'), sV, CSE.el('<span class="val vbb"></span>'));
    [['0,5 V', 0.5], ['1,5 V', 1.5], ['10 V', 10]].forEach(([t, v]) => { const b = CSE.el(`<button class="btn sm sec">${t}</button>`); b.addEventListener('click', () => { S.VBB = v; sV.value = v; draw(); }); c1.append(b); });
    const c2 = CSE.el('<div class="ctl"></div>');
    const sC = CSE.el('<input type="range" min="5" max="20" step="1" value="15">'); sC.style.width = '140px'; sC.addEventListener('input', () => { S.VCC = +sC.value; draw(); });
    const sB = CSE.el('<input type="range" min="50" max="300" step="5" value="125">'); sB.style.width = '140px'; sB.addEventListener('input', () => { S.beta = +sB.value; draw(); });
    c2.append(CSE.el('<label>R<sub>B</sub></label>'), CSE.select([4700, 10000, 15000, 100000, 560000], S.RB, v => { S.RB = v; draw(); }, CSE.fmtR),
      CSE.el('<label>V<sub>CC</sub></label>'), sC, CSE.el('<span class="val vcc"></span>'),
      CSE.el('<label>R<sub>L</sub></label>'), CSE.select([470, 1000, 1800, 2200], S.RL, v => { S.RL = v; draw(); }, CSE.fmtR),
      CSE.el('<label>β</label>'), sB, CSE.el('<span class="val vb"></span>'));
    const g = CSE.el('<div style="display:grid;grid-template-columns:500px 1fr 340px;gap:12px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'), c = document.createElement('div'); g.append(a, b, c);
    a.innerHTML = `<svg viewBox="0 0 560 380" style="width:100%">${svgW}
      <path id="lzB" d="M80 247 V200 H300 L335 230 V330 H80 Z" fill="none"/><path id="lzC" d="M480 162 V40 H335 V330 H480 V218 Z" fill="none"/>
      ${fuente(80, 275, '')}<text x="20" y="282" class="t">V<tspan dy="5" font-size="13">BB</tspan></text>
      <path d="M80 247 V200 H150 M250 200 H280 M80 303 V330 H480 V218 M480 162 V40 H335 V60 M335 150 V170 M335 270 V330" class="w"/>${resH(150, 200)}
      <g class="rl"></g>${resV(335, 60)}<text x="355" y="112" class="t">R<tspan dy="5" font-size="13">L</tspan></text><text x="185" y="185" class="t">R<tspan dy="5" font-size="13">B</tspan></text>
      ${fuente(480, 190, '')}<text x="505" y="160" class="t">V<tspan dy="5" font-size="13">CC</tspan></text>${npn(300, 210)}
      <path d="M220 330 v12 M206 342 h28 M212 350 h16" class="w"/>
      <g class="dB"></g><g class="dC"></g>
      <text x="150" y="245" class="t ib" fill="#4c5cc5"></text><text x="360" y="60" class="t ic" fill="#009e91" dx="40"></text><text x="380" y="250" class="t vce" fill="#280091"></text></svg>`;
    const lzB = a.querySelector('#lzB'), lzC = a.querySelector('#lzC'), LB = lzB.getTotalLength(), LC = lzC.getTotalLength();
    a.querySelector('.dB').innerHTML = Array.from({ length: 14 }, () => '<circle r="3.5" fill="#4c5cc5"/>').join('');
    a.querySelector('.dC').innerHTML = Array.from({ length: 18 }, () => '<circle r="7" fill="#00b299"/>').join('');
    const dB = [...a.querySelector('.dB').children], dC = [...a.querySelector('.dC').children];
    const cv = CSE.canvas(b, 760, 470, { label: 'Característica de salida, recta de carga y punto Q' });
    root.append(c1, c2, g);
    function draw() {
      ['vbb', 'vcc', 'vb'].forEach(k => root.querySelector('.' + k).textContent = k === 'vbb' ? CSE.num(S.VBB, 2) + ' V' : k === 'vcc' ? S.VCC + ' V' : S.beta);
      const Q = S.Q = CSE.qBJT(S.VBB, S.RB, S.VCC, S.RL, S.beta);
      CSE.dibujaSalida(cv, { VCC: S.VCC, RL: S.RL, beta: S.beta, Q, pmax: true });
      a.querySelector('.ib').textContent = 'IB = ' + fI(Q.IB); a.querySelector('.ic').textContent = 'IC = ' + fI(Q.IC); a.querySelector('.vce').textContent = 'VCE = ' + CSE.num(Q.VCE, 2) + ' V';
      a.querySelector('.rl').innerHTML = `<circle cx="335" cy="105" r="40" fill="#00b299" opacity="${0.05 + 0.4 * Q.IC / Q.ICsat}"/>`;
      const z = ZN[Q.zona], b1 = S.VBB < 0.7, b2 = !b1 && S.beta * Q.IB < Q.ICsat;
      c.innerHTML = `<div class="kpi" style="width:100%;border-left:8px solid ${z[1]}"><span class="k">Zona</span><span class="v" style="color:${z[1]}">${z[0]}</span></div>
        <div style="font-size:17px;margin:6px 0 10px">${z[2]}</div>
        <div style="font-size:17px;line-height:1.5">
        <div style="opacity:${1}"><b>1.</b> ¿V<sub>BB</sub> &lt; 0,7 V? <b>${b1 ? 'Sí → corte' : 'No'}</b></div>
        ${b1 ? '' : `<div><b>2.</b> I<sub>B</sub> = (V<sub>BB</sub> − 0,7)/R<sub>B</sub> = <b>${fI(Q.IB)}</b></div>
        <div><b>3.</b> I<sub>C,sat</sub> = (V<sub>CC</sub> − 0,2)/R<sub>L</sub> = <b>${fI(Q.ICsat)}</b></div>
        <div><b>4.</b> β·I<sub>B</sub> = <b>${fI(S.beta * Q.IB)}</b> ${b2 ? '&lt;' : '≥'} I<sub>C,sat</sub> → <b style="color:${z[1]}">${z[0]}</b></div>`}</div>
        <div style="margin-top:8px"><span class="kpi"><span class="k">P<sub>T</sub> = V<sub>CE</sub>·I<sub>C</sub></span><span class="v">${CSE.num(Q.PT * 1e3, 1)} mW</span></span><span class="kpi"><span class="k">P<sub>L</sub> = I<sub>C</sub>²·R<sub>L</sub></span><span class="v">${CSE.num(Q.PL * 1e3, 1)} mW</span></span></div>`;
    }
    CSE.animar(root, dt => {
      if (!S.Q) return; const vb = S.Q.IB > 0 ? Math.min(160, 30 + 40 * Math.log10(1 + S.Q.IB * 1e6 / 10)) : 0, vc = S.Q.IC > 1e-6 ? Math.min(320, 40 + 80 * Math.log10(1 + S.Q.IC * 1e3)) : 0;
      S.off1 = (S.off1 + vb * dt) % LB; S.off2 = (S.off2 + vc * dt) % LC;
      dB.forEach((d, i) => { const p = lzB.getPointAtLength((S.off1 + i * LB / dB.length) % LB); d.setAttribute('cx', p.x); d.setAttribute('cy', p.y); d.style.opacity = vb ? .9 : .12; });
      dC.forEach((d, i) => { const p = lzC.getPointAtLength((S.off2 + i * LC / dC.length) % LC); d.setAttribute('cx', p.x); d.setAttribute('cy', p.y); d.style.opacity = vc ? .85 : .12; });
    });
    draw();
  });

  /* =====================================================================
     2. V_BB SENOIDAL: el transistor recorre la recta de carga
     ===================================================================== */
  CSE.registrar('bjt-seno', (root) => {
    const S = { A: 10, RB: 10000, VCC: 15, RL: 1000, beta: 125, f: 200, fase: 0, play: true };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.el('<label>V<sub>BB</sub> senoidal</label>'), CSE.select([2.5, 5, 10], S.A, v => { S.A = v; calc(); }, v => CSE.num(2 * v) + ' Vpp'),
      CSE.el('<label>R<sub>B</sub></label>'), CSE.select([10000, 12000, 15000, 100000], S.RB, v => { S.RB = v; calc(); }, CSE.fmtR),
      CSE.el('<label>V<sub>CC</sub></label>'), CSE.select([5, 10, 15], S.VCC, v => { S.VCC = v; calc(); }, v => v + ' V'),
      CSE.el('<label>R<sub>L</sub></label>'), CSE.select([1000, 1800], S.RL, v => { S.RL = v; calc(); }, CSE.fmtR));
    const bP = CSE.el('<button class="btn sm sec">⏸ Pausa</button>'); bP.addEventListener('click', () => { S.play = !S.play; bP.textContent = S.play ? '⏸ Pausa' : '▶ Animar'; }); c1.append(bP);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.25fr 1fr;gap:14px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const ct = CSE.canvas(a, 860, 440, { label: 'VBB, VCE e IC frente al tiempo' }), cr = CSE.canvas(b, 640, 440, { label: 'Recorrido sobre la recta de carga' });
    const kp = CSE.el('<div></div>');
    root.append(c1, g, kp);
    let M = null; const N = 400;
    function calc() {
      M = []; for (let i = 0; i < N; i++) { const vbb = S.A * Math.sin(2 * Math.PI * i / N); M.push({ vbb, ...CSE.qBJT(vbb, S.RB, S.VCC, S.RL, S.beta) }); }
      const ICsat = (S.VCC - 0.2) / S.RL, vsat = 0.7 + ICsat / S.beta * S.RB;
      kp.innerHTML = `<span class="kpi"><span class="k">I<sub>C,sat</sub></span><span class="v">${fI(ICsat)}</span></span><span class="kpi"><span class="k">Satura si V<sub>BB</sub> ≥ 0,7 + R<sub>B</sub>·I<sub>C,sat</sub>/β</span><span class="v">${CSE.num(vsat, 2)} V</span></span><span class="kpi"><span class="k">P<sub>T</sub> máx = V<sub>CC</sub>²/(4R<sub>L</sub>)</span><span class="v">${CSE.num(S.VCC * S.VCC / 4 / S.RL * 1e3, 0)} mW</span></span><span class="kpi"><span class="k">en V<sub>CE</sub> =</span><span class="v">${CSE.num(S.VCC / 2, 1)} V</span></span>`;
    }
    function draw() {
      let { ctx, W, H } = ct; ctx.clearRect(0, 0, W, H);
      const x0 = 56, x1 = W - 12, y0 = 40, y1 = H - 60, tx = CSE.linMap(0, 2, x0, x1), vm = Math.max(S.A, S.VCC) * 1.1, ty = CSE.linMap(-vm, vm, y1, y0);
      // bandas de zonas
      for (let x = x0; x < x1; x += 2) { const m = M[Math.floor((tx.inv(x) % 1) * N)]; ctx.fillStyle = m.zona === 'corte' ? '#d9dbe6' : m.zona === 'activa' ? '#9fdccd' : '#f3b9c0'; ctx.fillRect(x, y1 + 10, 2, 16); }
      CSE.label(ctx, 'zonas: gris = corte · verde = activa · rojo = saturación', x0, y1 + 46, { color: C.gris, font: '700 15px "Source Sans 3"' });
      CSE.gridY(ctx, ty, [-10, -5, 0, 5, 10, 15].filter(v => Math.abs(v) <= vm), x0, x1, v => v + ' V', { zero: true });
      const p1 = [], p2 = [], p3 = []; for (let x = x0; x <= x1; x++) { const m = M[Math.floor((tx.inv(x) % 1) * N)]; p1.push([x, ty(m.vbb)]); p2.push([x, ty(m.VCE)]); p3.push([x, ty(m.IC * S.RL)]); }
      CSE.line(ctx, p1, 'rgba(122,134,217,.7)', 2, [6, 5]); CSE.line(ctx, p2, C.naranja, 3.5); CSE.line(ctx, p3, C.teal, 3.5);
      CSE.label(ctx, '- - VBB', x0 + 4, 24, { color: C.lavanda, font: '800 15px Archivo' }); CSE.label(ctx, '━ VCE (CH1)', x0 + 100, 24, { color: C.naranja, font: '800 15px Archivo' }); CSE.label(ctx, '━ VRL = IC·RL (CH2)', x0 + 250, 24, { color: C.teal, font: '800 15px Archivo' });
      const xc = tx(S.fase * 2); CSE.line(ctx, [[xc, y0], [xc, y1 + 26]], C.indigo, 2);
      const m = M[Math.floor(((S.fase * 2) % 1) * N)];
      const r = CSE.dibujaSalida(cr, { VCC: S.VCC, RL: S.RL, beta: S.beta, Q: m, pmax: true });
      ({ ctx } = cr); CSE.label(ctx, ZN[m.zona][0] + ' · PT = ' + CSE.num(m.PT * 1e3, 0) + ' mW', 250, 40, { color: ZN[m.zona][1], font: '800 18px Archivo', bg: 'rgba(255,255,255,.9)' });
    }
    CSE.animar(root, dt => { if (S.play) S.fase = (S.fase + dt / 5) % 1; draw(); });
    calc();
  });

  /* =====================================================================
     3. IDENTIFICA LOS TERMINALES CON EL POLÍMETRO
     ===================================================================== */
  CSE.registrar('bjt-polimetro', (root) => {
    let S;
    const nuevo = () => { const perm = ['B', 'C', 'E'].sort(() => Math.random() - .5); S = { tipo: Math.random() < .5 ? 'npn' : 'pnp', pin: perm, roja: 0, negra: 1, resuelto: false }; };
    nuevo();
    root.innerHTML = `<div class="ctl"><button class="btn sm verde nuevo">Nuevo transistor misterioso</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start"><div class="a"></div><div class="b"></div></div>`;
    root.querySelector('.nuevo').addEventListener('click', () => { nuevo(); draw(); root.querySelector('.res').innerHTML = ''; });
    function lectura() {
      if (S.roja === S.negra) return '---';
      const r = S.pin[S.roja], n = S.pin[S.negra];
      if (S.tipo === 'npn' && r === 'B' && n !== 'B') return n === 'E' ? '0.684' : '0.641';
      if (S.tipo === 'pnp' && n === 'B' && r !== 'B') return r === 'E' ? '0.679' : '0.636';
      return 'OL';
    }
    function draw() {
      const a = root.querySelector('.a'), L = lectura(), xs = [210, 290, 370];
      a.innerHTML = `<svg viewBox="0 0 580 420" style="width:100%;max-height:430px">${svgW}
        <rect x="160" y="40" width="260" height="150" rx="12" fill="#2e2a2a"/><circle cx="290" cy="80" r="16" fill="#777"/><text x="290" y="150" text-anchor="middle" style="font:800 22px Archivo;fill:#ddd">BD13?</text>
        ${xs.map((x, i) => `<rect x="${x - 8}" y="190" width="16" height="110" fill="#c9cdd6"/><text x="${x}" y="330" text-anchor="middle" class="b">${i + 1}</text>`).join('')}
        <path d="M${xs[S.roja]} 300 C ${xs[S.roja]} 360, 80 330, 60 390" stroke="#d23c4b" stroke-width="7" fill="none"/><path d="M${xs[S.negra]} 300 C ${xs[S.negra]} 370, 500 330, 520 390" stroke="#22223a" stroke-width="7" fill="none"/>
        <rect x="430" y="20" width="140" height="70" rx="8" fill="#c9d8b6" stroke="#22223a" stroke-width="2"/><text x="560" y="70" text-anchor="end" style="font:700 36px 'Courier New',monospace;fill:#1e2a10">${L}</text><text x="500" y="110" text-anchor="middle" style="font:700 14px 'Source Sans 3'">modo diodo</text></svg>
        <div class="ctl"><label>Punta roja en</label>${[0, 1, 2].map(i => `<button class="btn sm ${S.roja === i ? '' : 'sec'}" data-r="${i}">${i + 1}</button>`).join('')}<label>Punta negra en</label>${[0, 1, 2].map(i => `<button class="btn sm ${S.negra === i ? '' : 'sec'}" data-n="${i}">${i + 1}</button>`).join('')}</div>`;
      a.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { S.roja = +b.dataset.r; draw(); }));
      a.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => { S.negra = +b.dataset.n; draw(); }));
    }
    const b = root.querySelector('.b');
    b.innerHTML = `<div style="font-size:19px">Prueba las 6 combinaciones y deduce:</div>
      <div class="ctl"><label>La base es la patilla</label><select class="sb"><option>1</option><option>2</option><option>3</option></select></div>
      <div class="ctl"><label>Tipo</label><select class="st"><option>npn</option><option>pnp</option></select></div>
      <div class="ctl"><label>El emisor es la patilla</label><select class="se"><option>1</option><option>2</option><option>3</option></select></div>
      <button class="btn sm verde chk">Comprobar</button><div class="res" style="margin-top:8px"></div>
      <div class="msg info" style="margin-top:10px">Pista: dos lecturas bajas con una punta fija → esa punta está en la <b>base</b>. Roja fija: <b>npn</b>; negra fija: <b>pnp</b>. La unión B-E da una lectura algo <b>mayor</b> que la B-C.</div>`;
    b.querySelector('.chk').addEventListener('click', () => {
      const base = +b.querySelector('.sb').value - 1, em = +b.querySelector('.se').value - 1, t = b.querySelector('.st').value;
      const ok1 = S.pin[base] === 'B', ok2 = t === S.tipo, ok3 = S.pin[em] === 'E';
      b.querySelector('.res').innerHTML = `<div class="msg ${ok1 && ok2 && ok3 ? 'ok' : 'bad'}">Base ${ok1 ? '✓' : '✗'} · Tipo ${ok2 ? '✓' : '✗'} · Emisor ${ok3 ? '✓' : '✗'}${ok1 && ok2 && ok3 ? ' ¡Perfecto!' : ''} <br>Solución: patillas 1-2-3 = <b>${S.pin.join('-')}</b>, transistor <b>${S.tipo}</b>.</div>`;
    });
    draw();
  });

  /* =====================================================================
     4. PUERTAS LÓGICAS CON TRANSISTORES (RTL)
     ===================================================================== */
  CSE.registrar('rtl', (root) => {
    const S = { tipo: 'not', A: 0, B: 0 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.seg([['not', 'Inversor (NOT)'], ['nor', 'NOR con dos transistores']], 'not', v => { S.tipo = v; draw(); }));
    const bA = CSE.el('<button class="btn">Entrada A = 0</button>'), bB = CSE.el('<button class="btn">Entrada B = 0</button>');
    bA.addEventListener('click', () => { S.A ^= 1; draw(); }); bB.addEventListener('click', () => { S.B ^= 1; draw(); });
    c1.append(bA, bB);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:16px;align-items:center"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    root.append(c1, g);
    function draw() {
      const nor = S.tipo === 'nor'; bB.style.display = nor ? '' : 'none';
      bA.textContent = 'Entrada A = ' + S.A; bB.textContent = 'Entrada B = ' + S.B; bA.className = 'btn ' + (S.A ? 'verde' : 'sec'); bB.className = 'btn ' + (S.B ? 'verde' : 'sec');
      const t1 = S.A === 1, t2 = nor && S.B === 1, sal = (t1 || t2) ? 0 : 1, vout = sal ? 5 : 0.2;
      const col = on => on ? '#d23c4b' : '#9aa0ad';
      let svg = `<svg viewBox="0 0 640 380" style="width:100%">${svgW}
        <text x="300" y="30" text-anchor="middle" class="b" fill="#280091">V<tspan dy="5" font-size="14">CC</tspan><tspan dy="-5"> = 5 V</tspan></text><path d="M300 40 V60" class="w"/>${resV(300, 60, 80)}<text x="320" y="105" class="t">1 kΩ</text>
        <path d="M300 140 V170" class="w"/><circle cx="300" cy="170" r="6" fill="#22223a"/><path d="M300 170 H578" class="w"/>
        <circle cx="600" cy="170" r="22" fill="${sal ? '#f2c94c' : '#eee'}" stroke="#22223a" stroke-width="3"/><text x="600" y="215" text-anchor="middle" class="b">Y = ${sal}</text><text x="600" y="240" text-anchor="middle" class="t">${CSE.num(vout, 1)} V</text>`;
      const tr = (x, on, lab) => `<path d="M${x + 35} 170 V180" class="w"/>${npn(x, 220, col(on))}<path d="M${x + 35} 270 V320" class="w"/><path d="M${x - 20} 220 H${x - 50}" class="w"/>${resH(x - 150, 220, 100)}<path d="M${x - 150} 220 H${x - 170}" class="w"/><circle cx="${x - 176}" cy="220" r="10" fill="${lab[1] ? '#00b299' : '#fff'}" stroke="#22223a" stroke-width="3"/><text x="${x - 176}" y="200" text-anchor="middle" class="b">${lab[0]}</text><text x="${x - 70}" y="275" text-anchor="middle" class="t" fill="${col(on)}" style="font-size:16px">${on ? 'saturado' : 'corte'}</text>`;
      if (!nor) svg += tr(265, t1, ['A', S.A]);
      else { svg += `<path d="M300 170 H235 M300 170 H505" class="w"/>` + tr(200, t1, ['A', S.A]) + tr(470, t2, ['B', S.B]); }
      svg += `<path d="M120 320 H520 M290 320 v12 M276 332 h28 M282 340 h16" class="w"/></svg>`;
      a.innerHTML = svg;
      const filas = nor ? [[0, 0], [0, 1], [1, 0], [1, 1]] : [[0], [1]];
      b.innerHTML = `<table><thead><tr><th>A</th>${nor ? '<th>B</th>' : ''}<th>Y</th></tr></thead><tbody>${filas.map(f => { const y = f.some(v => v) ? 0 : 1; const act = f[0] === S.A && (!nor || f[1] === S.B); return `<tr style="${act ? 'outline:3px solid #00b299' : ''}"><td>${f[0]}</td>${nor ? `<td>${f[1]}</td>` : ''}<td><b>${y}</b></td></tr>`; }).join('')}</tbody></table>
        <div class="msg info" style="margin-top:10px">Un 1 (5 V) en la base <b>satura</b> el transistor: la salida cae a ≈ 0,2 V (un 0). Con un 0 queda en <b>corte</b> y la resistencia "tira" de la salida hacia 5 V (un 1). Así eran las puertas <b>RTL</b> de los primeros ordenadores, como el ordenador de guiado del Apolo.</div>`;
    }
    draw();
  });

  /* =====================================================================
     5. UN PIN GPIO CONTROLA UNA CARGA CON UN TRANSISTOR
     ===================================================================== */
  CSE.registrar('gpio-carga', (root) => {
    const S = { Vg: 3.3, IL: 100, beta: 100, k: 3 };
    root.innerHTML = '<div class="ctl c1"></div><div class="ctl c2"></div><div style="display:grid;grid-template-columns:520px 1fr;gap:18px;align-items:center"><div class="esq"></div><div class="res"></div></div>';
    root.querySelector('.c1').append(CSE.el('<label>Pin</label>'), CSE.seg([['3.3', '3,3 V (Raspberry, ESP32)'], ['5', '5 V (Arduino)']], '3.3', v => { S.Vg = +v; draw(); }));
    const sl = (sel, min, max, step, v, k, lab, u) => { const s = CSE.el(`<input type="range" min="${min}" max="${max}" step="${step}" value="${v}">`); const val = CSE.el(`<span class="val">${v} ${u}</span>`); s.addEventListener('input', () => { S[k] = +s.value; val.textContent = CSE.num(S[k]) + ' ' + u; draw(); }); root.querySelector(sel).append(CSE.el(`<label>${lab}</label>`), s, val); };
    sl('.c1', 10, 500, 10, S.IL, 'IL', 'Corriente de la carga (relé, motor, LEDs)', 'mA');
    sl('.c2', 40, 300, 10, S.beta, 'beta', 'β mínima (hoja de características)', ''); sl('.c2', 1, 5, 0.5, S.k, 'k', 'Margen de saturación', '×');
    function draw() {
      const IB = S.k * S.IL / 1000 / S.beta, RB = (S.Vg - 0.7) / IB, E12 = [...CSE.Rs].reverse().find(r => r <= RB) || 100, IBr = (S.Vg - 0.7) / E12;
      const lim = S.Vg === 5 ? 20 : 8, PT = 0.2 * S.IL / 1000;
      root.querySelector('.esq').innerHTML = `<svg viewBox="0 0 520 360" style="width:100%">${svgW}
        <rect x="10" y="150" width="110" height="120" rx="10" fill="#0e5a8a"/><text x="65" y="190" text-anchor="middle" style="font:800 16px Archivo;fill:#fff">GPIO</text><text x="65" y="214" text-anchor="middle" style="font:700 15px 'Source Sans 3';fill:#cfe">${CSE.num(S.Vg)} V</text>
        <path d="M120 210 H160 M260 210 H290" class="w"/>${resH(160, 210)}<text x="185" y="190" class="t">${CSE.fmtR(E12)}</text>${npn(310, 210)}
        <path d="M345 160 V140 M345 260 V320 M90 320 H460 M60 270 V320" class="w"/><rect x="315" y="60" width="60" height="80" rx="6" fill="#fff6e6" stroke="#22223a" stroke-width="3"/><text x="345" y="106" text-anchor="middle" class="t" style="font-size:15px">carga</text>
        <path d="M345 60 V30 H460 V320 M375 100 H420 M420 70 V130" class="w"/><path d="M405 120 h30 l-15 -22 z M405 98 h30" fill="#fff" stroke="#22223a" stroke-width="3"/><text x="440" y="96" class="t" style="font-size:14px">diodo</text>
        <text x="470" y="180" class="t">V</text><text x="350" y="300" class="t" style="font-size:16px">I<tspan dy="4" font-size="12">C</tspan><tspan dy="-4"> = ${CSE.num(S.IL)} mA</tspan></text><text x="150" y="250" class="t" style="font-size:16px" fill="#4c5cc5">I<tspan dy="4" font-size="12">B</tspan><tspan dy="-4"> = ${CSE.num(IBr * 1e3, 2)} mA</tspan></text></svg>`;
      root.querySelector('.res').innerHTML = `<div class="formula" style="font-size:22px">I<sub>B</sub> = ${CSE.num(S.k)}·I<sub>C</sub>/β = ${CSE.num(IB * 1e3, 2)} mA → R<sub>B</sub> = (${CSE.num(S.Vg)} − 0,7)/I<sub>B</sub> = <b>${CSE.fmtR(RB)}</b></div>
        <div style="margin-top:8px"><span class="kpi"><span class="k">R<sub>B</sub> comercial (por debajo)</span><span class="v">${CSE.fmtR(E12)}</span></span><span class="kpi"><span class="k">Corriente que da el pin</span><span class="v" style="color:${IBr * 1e3 > lim ? C.bad : C.indigo}">${CSE.num(IBr * 1e3, 2)} mA</span></span><span class="kpi"><span class="k">P en el transistor (V<sub>CE,sat</sub> = 0,2 V)</span><span class="v">${CSE.num(PT * 1e3, 0)} mW</span></span></div>
        ${IBr * 1e3 > lim ? `<div class="msg bad">El pin tendría que dar más de ${lim} mA: usa un transistor con más β, un Darlington o un MOSFET.</div>` : '<div class="msg ok">El pin sólo aporta la pequeña corriente de base; la corriente grande viene de la fuente a través del transistor <b>saturado</b>. Con un relé o un motor añade un <b>diodo de libre circulación</b> en paralelo con la bobina.</div>'}`;
    }
    draw();
  });

  /* =====================================================================
     6. ENTRENA EL EXAMEN (BJT en conmutación, 2021-2026)
     ===================================================================== */
  CSE.registrar('examen-p4', (root) => {
    const beta = 125, v = [];
    [['2021 Julio / 2023 Julio', 15, 1000, 100000, [0.5, 5, 15]], ['2021 Jun (bis) / 2022 Jul', 5, 1800, 560000, [0.5, 5, 15]], ['2024 Junio / 2026 Julio', 10, 1000, 10000, [0.5, 1.2, 5]]].forEach(([n, VCC, RL, RB, vb]) => {
      const qs = vb.map(x => CSE.qBJT(x, RB, VCC, RL, beta));
      const camp = []; qs.forEach((q, i) => { camp.push({ k: 'ic' + i, t: `I<sub>C</sub> con V<sub>BB</sub> = ${CSE.num(vb[i])} V (mA)`, sol: q.zona === 'saturacion' ? q.ICsat * 1e3 : q.zona === 'corte' ? 0 : beta * q.IB * 1e3, abs: q.zona === 'corte' ? 0.05 : undefined, tol: 0.05 }); camp.push({ k: 'v' + i, t: `V<sub>CE</sub> con V<sub>BB</sub> = ${CSE.num(vb[i])} V (V)`, sol: q.zona === 'saturacion' ? 0.2 : q.zona === 'corte' ? VCC : VCC - beta * q.IB * RL, abs: q.zona === 'saturacion' ? 0.15 : undefined, tol: 0.05 }); });
      v.push({ nombre: 'VBB continua · ' + n, enunciado: `<b style="color:#280091">Examen de laboratorio · ${n}</b><br>Transistor BD137 (β = ${beta}) con V<sub>CC</sub> = <b>${VCC} V</b>, R<sub>L</sub> = <b>${CSE.fmtR(RL)}</b> y R<sub>B</sub> = <b>${CSE.fmtR(RB)}</b>. Calcula I<sub>C</sub> y V<sub>CE</sub> teóricos para cada V<sub>BB</sub> (V<sub>BE</sub> = 0,7 V, V<sub>CE,sat</sub> = 0,2 V) e indica la zona.`, campos: camp,
        solucion: qs.map((q, i) => `V<sub>BB</sub> = ${CSE.num(vb[i])} V: I<sub>B</sub> = ${fI(q.IB)}, β·I<sub>B</sub> = ${fI(beta * q.IB)} frente a I<sub>C,sat</sub> = ${fI(q.ICsat)} → <b>${ZN[q.zona][0]}</b>`).join(' · ') });
    });
    [['2022 Jun / 2024 Jun', 15, 1000, 15000, 20], ['2022 Sep / 2023 Jul', 15, 1000, 12000, 10], ['2024 Julio', 10, 1000, 10000, 5], ['2025 Jun/Jul/Sep · 2026 Jun', 10, 1000, 10000, 20]].forEach(([n, VCC, RL, RB, Vpp]) => {
      const ICs = (VCC - 0.2) / RL, vs = 0.7 + ICs / beta * RB, pm = VCC * VCC / 4 / RL;
      v.push({ nombre: 'VBB senoidal · ' + n, enunciado: `<b style="color:#280091">Examen de laboratorio · ${n}</b><br>V<sub>BB</sub> senoidal de <b>${Vpp} Vpp</b> y 100 Hz, V<sub>CC</sub> = <b>${VCC} V</b>, R<sub>L</sub> = <b>${CSE.fmtR(RL)}</b>, R<sub>B</sub> = <b>${CSE.fmtR(RB)}</b>, β = ${beta}. Se representan V<sub>CE</sub> e I<sub>C</sub> y se marcan las zonas.`,
        campos: [{ k: 'ics', t: 'I<sub>C,sat</sub> (mA)', sol: ICs * 1e3 }, { k: 'vs', t: 'V<sub>BB</sub> a partir de la que satura (V)', sol: vs }, { k: 'pm', t: 'Potencia máxima en el transistor (mW)', sol: pm * 1e3 }, { k: 'vp', t: 'V<sub>CE</sub> en el punto de disipación máxima (V)', sol: VCC / 2 }, { k: 'vc', t: 'V<sub>CE</sub> en corte (V)', sol: VCC }],
        solucion: `I<sub>C,sat</sub> = (${VCC} − 0,2)/${CSE.fmtR(RL)} = <b>${CSE.num(ICs * 1e3, 2)} mA</b> · satura cuando β·I<sub>B</sub> ≥ I<sub>C,sat</sub>: V<sub>BB</sub> ≥ 0,7 + R<sub>B</sub>·I<sub>C,sat</sub>/β = <b>${CSE.num(vs, 2)} V</b>${vs > Vpp / 2 ? ' (con esta amplitud <b>no llega a saturar</b>)' : ''} · P<sub>T,max</sub> = V<sub>CC</sub>²/(4R<sub>L</sub>) = <b>${CSE.num(pm * 1e3, 1)} mW</b> en V<sub>CE</sub> = <b>${VCC / 2} V</b> · en corte V<sub>CE</sub> = <b>${VCC} V</b>.` });
    });
    CSE.entrenador(root, v);
  });
})();
