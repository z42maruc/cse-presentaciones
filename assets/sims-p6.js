/* Simuladores de la Práctica 6 · Amplificador operacional */
(function () {
  const CSE = window.CSE, C = CSE.col;
  const svgW = `<style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 18px 'Source Sans 3',sans-serif;fill:#22223a}.b{font:800 19px Archivo,sans-serif}</style>`;
  const resH = (x, y, w, txt) => `<path d="M${x} ${y} h${(w - 60) / 2} l5 -12 l10 24 l10 -24 l10 24 l10 -24 l10 24 l5 -12 h${(w - 60) / 2}" class="w"/><text x="${x + w / 2}" y="${y - 18}" text-anchor="middle" class="t">${txt}</text>`;
  const resV = (x, y, h, txt) => `<path d="M${x} ${y} v${(h - 60) / 2} l-12 5 l24 10 l-24 10 l24 10 l-24 10 l24 10 l-12 5 v${(h - 60) / 2}" class="w"/><text x="${x + 18}" y="${y + h / 2 + 6}" class="t">${txt}</text>`;
  const GBW = 1e6, SR = 0.5e6, A0 = 2e5; // 741: 1 MHz, 0,5 V/µs

  // simulación temporal: polo de lazo cerrado, slew rate y saturación
  CSE.simAO = (o) => {
    const { tipo, R1, R2, Vp, f, Vcc } = o; const Vsat = 0.9 * Vcc, T = 1 / f, N = 1000;
    const ideal = tipo === 'inv' ? -R2 / R1 : tipo === 'noinv' ? 1 + R2 / R1 : tipo === 'seg' ? 1 : A0;
    const ng = tipo === 'inv' ? 1 + R2 / R1 : tipo === 'abierto' ? 1 : Math.abs(ideal);
    const wc = 2 * Math.PI * (tipo === 'abierto' ? 5 : GBW / ng);
    const sub = Math.max(1, Math.ceil(wc * T / N / 0.2)); const dt = T / N / sub;
    let vo = 0; const vin = new Float32Array(N), vout = new Float32Array(N);
    for (let p = 0; p < 6; p++) for (let i = 0; i < N; i++) {
      for (let s = 0; s < sub; s++) { const t = (i + s / sub) * T / N; const raw = ideal * Vp * Math.sin(2 * Math.PI * t / T), target = tipo === 'abierto' ? raw : Math.max(-Vsat * 1.05, Math.min(Vsat * 1.05, raw)); let d = (target - vo) * wc * dt; d = Math.max(-SR * dt, Math.min(SR * dt, d)); vo = Math.max(-Vsat, Math.min(Vsat, vo + d)); }
      if (p === 5) { vin[i] = Vp * Math.sin(2 * Math.PI * i / N); vout[i] = vo; }
    }
    const at = (arr, t) => { let u = (t / T) % 1; if (u < 0) u += 1; return arr[Math.floor(u * N) % N]; };
    let mx = -1e9, mn = 1e9; vout.forEach(v => { mx = Math.max(mx, v); mn = Math.min(mn, v); });
    return { T, vin, vout, at, ideal, ng, Vsat, pp: mx - mn, sat: mx >= Vsat * 0.999 || mn <= -Vsat * 0.999, bw: GBW / ng };
  };

  function circuito(tipo, R1, R2, conR2 = true) {
    let s = `<svg viewBox="0 0 560 300" style="width:100%">${svgW}
      <path d="M260 70 V230 L380 150 Z" fill="#f4f6fd" stroke="#22223a" stroke-width="3.5" stroke-linejoin="round"/>
      <text x="270" y="${tipo === 'inv' ? 112 : 196}" class="b">−</text><text x="270" y="${tipo === 'inv' ? 196 : 112}" class="b">+</text>
      <path d="M380 150 H480" class="w"/><circle cx="480" cy="150" r="6" fill="#22223a"/><text x="490" y="140" class="b" fill="#009e91">V<tspan dy="5" font-size="13">s</tspan></text>
      <text x="300" y="58" class="t" style="font-size:15px">+15 V</text><text x="300" y="258" class="t" style="font-size:15px">−15 V</text><path d="M320 95 V64 M320 205 V236" class="w" style="stroke-width:2.5"/>`;
    const gnd = (x, y) => `<path d="M${x} ${y} v12 M${x - 14} ${y + 12} h28 M${x - 8} ${y + 19} h16" class="w"/>`;
    if (tipo === 'inv') {
      s += `<circle cx="40" cy="105" r="6" fill="#22223a"/><text x="20" y="88" class="b" fill="#b58b00">V<tspan dy="5" font-size="13">e</tspan></text>` + resH(46, 105, 110, 'R₁ ' + CSE.fmtR(R1)) + `<path d="M156 105 H260 M200 105 V30 H260" class="w"/><circle cx="200" cy="105" r="5" fill="#22223a"/>`
        + (conR2 ? resH(260, 30, 120, 'R₂ ' + CSE.fmtR(R2)) + `<path d="M380 30 H440 V150" class="w"/>` : `<text x="320" y="24" text-anchor="middle" class="t" fill="#d23c4b">sin realimentación</text>`)
        + `<path d="M260 195 H220 V230" class="w"/>${gnd(220, 230)}<text x="196" y="130" class="t" style="font-size:15px" fill="#4c5cc5">masa virtual</text>`;
    } else if (tipo === 'noinv') {
      s += `<circle cx="40" cy="195" r="6" fill="#22223a"/><text x="20" y="178" class="b" fill="#b58b00">V<tspan dy="5" font-size="13">e</tspan></text><path d="M46 195 H260 M260 105 H200 V30" class="w"/><circle cx="200" cy="105" r="5" fill="#22223a"/>`
        + resH(90, 105, 110, 'R₁ ' + CSE.fmtR(R1)) + `<path d="M90 105 V118" class="w"/>` + gnd(90, 118)
        + (conR2 ? `<path d="M200 30 H260" class="w"/>` + resH(260, 30, 120, 'R₂ ' + CSE.fmtR(R2)) + `<path d="M380 30 H440 V150" class="w"/>` : `<text x="320" y="24" text-anchor="middle" class="t" fill="#d23c4b">sin realimentación</text>`);
    } else if (tipo === 'seg') {
      s += `<circle cx="40" cy="195" r="6" fill="#22223a"/><text x="20" y="178" class="b" fill="#b58b00">V<tspan dy="5" font-size="13">e</tspan></text><path d="M46 195 H260 M260 105 H220 V30 H440 V150" class="w"/>`;
    } else {
      s += `<circle cx="40" cy="195" r="6" fill="#22223a"/><text x="20" y="178" class="b" fill="#b58b00">V<tspan dy="5" font-size="13">e</tspan></text><path d="M46 195 H260 M260 105 H220 V130" class="w"/>${gnd(220, 130)}<text x="320" y="24" text-anchor="middle" class="t" fill="#d23c4b">lazo abierto: comparador</text>`;
    }
    return s + '</svg>';
  }

  /* =====================================================================
     1. LAS CONFIGURACIONES EN EL OSCILOSCOPIO
     ===================================================================== */
  CSE.registrar('ao-config', (root, ds) => {
    const S = { tipo: ds.tipo || 'inv', R1: 1000, R2: 10000, Vp: 0.1, f: 1000, Vcc: 15, fb: true };
    const ctl = document.createElement('div');
    const fila = (...els) => { const d = CSE.el('<div class="ctl"></div>'); d.append(...els); ctl.append(d); return d; };
    fila(CSE.seg([['inv', 'Inversor'], ['noinv', 'No inversor'], ['seg', 'Seguidor'], ['abierto', 'Lazo abierto']], S.tipo, v => { S.tipo = v; upd(); }));
    const RS = [1000, 2200, 4700, 10000, 22000, 47000, 100000];
    const fR = fila(CSE.el('<label>R₁</label>'), CSE.select(RS, S.R1, v => { S.R1 = v; upd(); }, CSE.fmtR), CSE.el('<label>R₂</label>'), CSE.select(RS, S.R2, v => { S.R2 = v; upd(); }, CSE.fmtR));
    const bFb = CSE.el('<button class="btn sm sec" aria-pressed="false">Quitar R₂ (sin realimentación)</button>'); bFb.addEventListener('click', () => { S.fb = !S.fb; bFb.setAttribute('aria-pressed', !S.fb); upd(); }); fR.append(bFb);
    const sV = CSE.logSlider(0.01, 5, S.Vp, v => { S.Vp = v; upd(); }); sV.style.width = '150px';
    const sF = CSE.logSlider(100, 500e3, S.f, v => { S.f = v; upd(); }); sF.style.width = '150px';
    fila(CSE.el('<label>V<sub>e</sub></label>'), sV, CSE.el('<span class="val vp"></span>'), CSE.el('<label>f</label>'), sF, CSE.el('<span class="val vf"></span>'), CSE.select([5, 12, 15], 15, v => { S.Vcc = v; upd(); }, v => '±' + v + ' V'));
    const esq = CSE.el('<div style="max-width:340px"></div>'); ctl.append(esq);
    let sim = null;
    const o = CSE.osciloscopio(root, {
      ancho: 620, controles: ctl, conCursores: false, compacto: true, inicial: { v1: 0.05, v2: 0.5, tdiv: 0.2e-3 },
      senales: () => ({ T: sim.T, ch1: t => sim.at(sim.vin, t), ch2: t => sim.at(sim.vout, t) }),
      extraMedidas: () => {
        const avm = sim.pp / (2 * S.Vp) * (sim.ideal < 0 ? -1 : 1), t = S.tipo, abierto = t === 'abierto' || ((t === 'inv' || t === 'noinv') && !S.fb);
        const vneg = t === 'inv' ? 'V<sub>−</sub> ≈ 0 V (masa virtual)' : t === 'abierto' || abierto ? 'Sin realimentación no hay cortocircuito virtual' : 'V<sub>−</sub> ≈ V<sub>+</sub> = V<sub>e</sub>';
        return `<div style="margin-top:6px"><span class="kpi"><span class="k">A<sub>v</sub> teórica</span><span class="v">${abierto ? '≈ 200 000' : CSE.num(sim.ideal, 2)}</span></span><span class="kpi"><span class="k">A<sub>v</sub> medida (Vpp)</span><span class="v">${CSE.num(avm, 2)}</span></span><span class="kpi"><span class="k">Fase</span><span class="v">${sim.ideal < 0 ? '180°' : '0°'}</span></span><span class="kpi"><span class="k">Z<sub>e</sub></span><span class="v">${t === 'inv' && S.fb ? '≈ R₁ = ' + CSE.fmtR(S.R1) : 'muy alta'}</span></span></div>
          <div class="msg ${sim.sat || abierto ? 'bad' : 'ok'}" style="margin-top:6px">${abierto ? 'Sin realimentación negativa el AO trabaja en <b>lazo abierto</b>: cualquier diferencia de entradas lo satura y la salida es casi cuadrada (±V<sub>sat</sub>).' : sim.sat ? `La salida se <b>recorta</b> en ±${CSE.num(sim.Vsat, 1)} V (≈ 90 % de la alimentación): baja V<sub>e</sub> o la ganancia. V<sub>e</sub> máxima sin recorte ≈ ${CSE.num(sim.Vsat / Math.abs(sim.ideal), 2)} V.` : S.f > sim.bw * 0.5 ? `A ${CSE.fmtF(S.f)} ya se nota el <b>ancho de banda</b>: f<sub>c</sub> ≈ GBW/(1 + R₂/R₁) = ${CSE.fmtF(sim.bw)}.` : vneg + '. Todo correcto: la salida es V<sub>e</sub> multiplicada por A<sub>v</sub>.'}</div>`;
      }
    });
    function upd() {
      const abierto = (S.tipo === 'inv' || S.tipo === 'noinv') && !S.fb;
      sim = CSE.simAO({ tipo: abierto ? 'abierto' : S.tipo, R1: S.R1, R2: S.R2, Vp: S.Vp, f: S.f, Vcc: S.Vcc });
      fR.style.display = S.tipo === 'inv' || S.tipo === 'noinv' ? '' : 'none';
      root.querySelector('.vp').textContent = S.Vp >= 1 ? CSE.num(S.Vp, 2) + ' V' : CSE.num(S.Vp * 1e3, 0) + ' mV';
      root.querySelector('.vf').textContent = CSE.fmtF(S.f);
      esq.innerHTML = circuito(S.tipo, S.R1, S.R2, S.fb);
      o.autoset();
    }
    upd();
  });

  /* =====================================================================
     2. EL CORTOCIRCUITO VIRTUAL: ¿por qué V+ ≈ V−?
     ===================================================================== */
  CSE.registrar('ao-virtual', (root) => {
    const S = { A: 2e5, R1: 1000, R2: 10000, Ve: 0.5 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sA = CSE.logSlider(10, 1e6, S.A, v => { S.A = v; draw(); }); sA.style.width = '360px';
    c1.append(CSE.el('<label>Ganancia en lazo abierto A</label>'), sA, CSE.el('<span class="val va"></span>'));
    [['10', 10], ['1000', 1000], ['741: 200 000', 2e5]].forEach(([t, v]) => { const b = CSE.el(`<button class="btn sm sec">${t}</button>`); b.addEventListener('click', () => { S.A = v; sA.set(v); draw(); }); c1.append(b); });
    const g = CSE.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    a.innerHTML = circuito('inv', S.R1, S.R2);
    root.append(c1, g);
    function draw() {
      root.querySelector('.va').textContent = CSE.num(S.A, 0);
      const ideal = -S.R2 / S.R1, real = ideal / (1 + (1 - ideal) / S.A), Vs = real * S.Ve, dif = -Vs / S.A;
      const err = Math.abs((real - ideal) / ideal) * 100;
      b.innerHTML = `<div class="formula" style="font-size:22px">V<sub>s</sub> = A·(V<sub>+</sub> − V<sub>−</sub>) ⇒ V<sub>+</sub> − V<sub>−</sub> = V<sub>s</sub>/A</div>
        <div style="margin-top:10px"><span class="kpi"><span class="k">V<sub>s</sub> con V<sub>e</sub> = 0,5 V</span><span class="v">${CSE.num(Vs, 3)} V</span></span><span class="kpi"><span class="k">V<sub>+</sub> − V<sub>−</sub></span><span class="v">${Math.abs(dif) >= 1e-3 ? CSE.num(dif * 1e3, 2) + ' mV' : CSE.num(dif * 1e6, 1) + ' µV'}</span></span></div>
        <div style="margin-top:10px"><span class="kpi"><span class="k">A<sub>v</sub> real</span><span class="v">${CSE.num(real, 3)}</span></span><span class="kpi"><span class="k">A<sub>v</sub> ideal = −R₂/R₁</span><span class="v">${CSE.num(ideal, 2)}</span></span><span class="kpi"><span class="k">Error</span><span class="v" style="color:${err > 5 ? C.bad : C.ok}">${CSE.num(err, err < 0.1 ? 3 : 1)} %</span></span></div>
        <div class="msg ${err > 5 ? 'bad' : 'ok'}" style="margin-top:10px">${err > 5 ? 'Con una A pequeña las entradas <b>no</b> están a la misma tensión y la ganancia se aleja de −R₂/R₁.' : 'Con una A enorme, V<sub>+</sub> − V<sub>−</sub> es de microvoltios: las entradas están "virtualmente" unidas (<b>cortocircuito virtual</b>) y la ganancia sólo depende de las resistencias.'}</div>
        <div class="caja idea" style="margin-top:10px"><span class="t">Las dos reglas</span><b>V<sub>+</sub> ≈ V<sub>−</sub></b> y <b>I<sub>+</sub> ≈ I<sub>−</sub> ≈ 0</b> (con realimentación negativa y sin saturar).</div>`;
    }
    draw();
  });

  /* =====================================================================
     3. ¿PARA QUÉ SIRVE UNA GANANCIA DE 1? El seguidor y las impedancias
     ===================================================================== */
  CSE.registrar('buffer', (root) => {
    const S = { RL: 1000, seg: false };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sR = CSE.logSlider(100, 1e6, S.RL, v => { S.RL = v; draw(); }); sR.style.width = '360px';
    const bS = CSE.el('<button class="btn sec" aria-pressed="false">Añadir seguidor de tensión</button>'); bS.addEventListener('click', () => { S.seg = !S.seg; bS.setAttribute('aria-pressed', S.seg); bS.textContent = S.seg ? 'Quitar el seguidor' : 'Añadir seguidor de tensión'; draw(); });
    c1.append(CSE.el('<label>Carga R<sub>L</sub></label>'), sR, CSE.el('<span class="val vr"></span>'), bS);
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:18px;align-items:center"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    root.append(c1, g);
    function draw() {
      root.querySelector('.vr').textContent = CSE.fmtR(S.RL);
      const Vth = 5, Rth = 5000, Vl = S.seg ? Vth * S.RL / (S.RL + 0.01) : Vth * S.RL / (S.RL + Rth);
      a.innerHTML = `<svg viewBox="0 0 600 300" style="width:100%">${svgW}<text x="20" y="30" class="b" fill="#280091">10 V</text><path d="M60 40 V50" class="w"/>${resV(60, 50, 80, '10 kΩ')}<path d="M60 130 V140" class="w"/>${resV(60, 140, 80, '10 kΩ')}<path d="M60 220 V260 H560" class="w"/>
        <circle cx="60" cy="135" r="5" fill="#22223a"/><text x="10" y="128" class="t" style="font-size:14px">"sensor"</text>
        ${S.seg ? `<path d="M60 135 H230 M330 135 H470 M210 135" class="w"/><path d="M230 90 V180 L330 135 Z" fill="#e6f7f2" stroke="#00b299" stroke-width="3.5" stroke-linejoin="round"/><text x="238" y="160" class="b">+</text><path d="M230 112 H210 V60 H350 V135" class="w"/><text x="240" y="122" class="b">−</text>` : `<path d="M60 135 H470" class="w"/>`}
        <path d="M470 135 V145" class="w"/>${resV(470, 145, 90, 'R<tspan dy="5" font-size="13">L</tspan>')}<path d="M470 235 V260" class="w"/>
        <text x="500" y="120" class="b" fill="#009e91">${CSE.num(Vl, 2)} V</text></svg>`;
      b.innerHTML = `<div class="kpi" style="width:100%;box-sizing:border-box"><span class="k">Tensión en la carga (debería ser 5 V)</span><span class="v" style="font-size:44px;color:${Vl < 4.5 ? C.bad : C.ok}">${CSE.num(Vl, 2)} V</span></div>
        <div class="msg ${S.seg ? 'ok' : Vl < 4.5 ? 'bad' : 'info'}" style="margin-top:10px">${S.seg ? 'Con el <b>seguidor</b> la carga recibe los 5 V aunque sea pequeña: su entrada no consume corriente (Z<sub>e</sub> muy alta) y su salida da la que haga falta (Z<sub>s</sub> muy baja).' : 'Sin seguidor, el divisor (Z<sub>s</sub> = 5 kΩ) y la carga forman otro divisor: con cargas pequeñas la tensión <b>cae</b>. Es lo que pasa al conectar un sensor débil a un convertidor.'}</div>
        <div class="caja" style="margin-top:10px"><span class="t">Método de la tensión mitad</span>Si ajustas R<sub>L</sub> hasta que la tensión cae a la mitad, R<sub>L</sub> = Z<sub>s</sub>: aquí, sin seguidor, en <b>5 kΩ</b>. Pruébalo con el deslizador.</div>`;
    }
    draw();
  });

  /* =====================================================================
     4. ANCHO DE BANDA: ganancia frente a frecuencia (GBW = 1 MHz)
     ===================================================================== */
  CSE.registrar('ao-bw', (root) => {
    const S = { av: 10 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    c1.append(CSE.el('<label>Ganancia |A<sub>v</sub>|</label>'), CSE.seg([['1', '1'], ['10', '10'], ['23', '23'], ['100', '100'], ['1000', '1000']], '10', v => { S.av = +v; draw(); }));
    const g = CSE.el('<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b);
    const cv = CSE.canvas(a, 900, 420, { label: 'Ganancia frente a frecuencia' });
    root.append(c1, g);
    function draw() {
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const x0 = 70, x1 = W - 16, y0 = 20, y1 = H - 40, fx = CSE.logMap(10, 1e7, x0, x1), fy = CSE.linMap(-20, 110, y1, y0);
      CSE.gridLog(ctx, fx, 10, 1e7, y0, y1); CSE.gridY(ctx, fy, [-20, 0, 20, 40, 60, 80, 100], x0, x1, v => v + ' dB', { zero: true });
      const lazo = []; for (let x = x0; x <= x1; x += 2) { const f = fx.inv(x); lazo.push([x, fy(CSE.dB(A0 / Math.sqrt(1 + Math.pow(f / 5, 2))))]); } CSE.line(ctx, lazo, 'rgba(122,134,217,.7)', 2.5, [6, 5]);
      const fc = GBW / S.av, pts = []; for (let x = x0; x <= x1; x += 2) { const f = fx.inv(x); pts.push([x, fy(CSE.dB(S.av / Math.sqrt(1 + Math.pow(f / fc, 2))))]); } CSE.line(ctx, pts, C.teal, 4);
      CSE.line(ctx, [[fx(fc), y0], [fx(fc), y1]], C.indigo, 2, [5, 5]); CSE.label(ctx, 'f_c = ' + CSE.fmtF(fc), fx(fc) + 6, fy(CSE.dB(S.av)) - 14, { color: C.indigo, font: '800 16px Archivo', bg: 'rgba(255,255,255,.9)' });
      CSE.label(ctx, '- - lazo abierto (A ≈ 200 000)', x0 + 10, y0 + 18, { color: C.lavanda, font: '800 15px Archivo' });
      const fs = [1e3, 1e4, 5e4, 1e5, 2e5];
      b.innerHTML = `<table><thead><tr><th>f</th><th>|A<sub>v</sub>|</th><th>Pérdida</th></tr></thead><tbody>${fs.map(f => { const v = S.av / Math.sqrt(1 + Math.pow(f / fc, 2)); return `<tr><td>${CSE.fmtF(f)}</td><td>${CSE.num(v, 2)}</td><td>${CSE.num(-CSE.dB(v / S.av), 1)} dB</td></tr>`; }).join('')}</tbody></table>
        <div class="msg info" style="margin-top:8px">Producto ganancia × ancho de banda ≈ <b>1 MHz</b>: con |A<sub>v</sub>| = ${S.av}, la ganancia empieza a caer hacia <b>${CSE.fmtF(fc)}</b>. Más ganancia, menos ancho de banda. Es el apartado 17 de la práctica.</div>`;
    }
    draw();
  });

  /* =====================================================================
     5. ADAPTA UN SENSOR AL CONVERTIDOR A/D
     ===================================================================== */
  CSE.registrar('adc-adapt', (root) => {
    const S = { Vs: 100, adc: 3.3, bits: 12 };
    root.innerHTML = '<div class="ctl c1"></div><div class="res"></div>';
    const c1 = root.querySelector('.c1');
    const s = CSE.el('<input type="range" min="5" max="1000" step="5" value="100">'); const v = CSE.el('<span class="val">100 mV</span>');
    s.addEventListener('input', () => { S.Vs = +s.value; v.textContent = S.Vs + ' mV'; draw(); });
    c1.append(CSE.el('<label>Señal máxima del sensor</label>'), s, v, CSE.el('<label>Convertidor</label>'), CSE.seg([['3.3', '0-3,3 V (ESP32)'], ['5', '0-5 V (Arduino)']], '3.3', x => { S.adc = +x; draw(); }), CSE.select([10, 12, 16], 12, x => { S.bits = x; draw(); }, x => x + ' bits'));
    function draw() {
      const Av = S.adc / (S.Vs / 1000) * 0.95, R2 = (Av - 1) * 1000; let best = CSE.Rs[0]; CSE.Rs.forEach(r => { if (r <= R2 && r > best) best = r; });
      const Avr = 1 + best / 1000, Vmax = Avr * S.Vs / 1000, lsb = S.adc / Math.pow(2, S.bits), sinA = S.Vs / 1000 / S.adc * 100;
      root.querySelector('.res').innerHTML = `<div class="formula" style="font-size:22px">A<sub>v</sub> ≈ ${CSE.num(S.adc)} V / ${S.Vs} mV ≈ <b>${CSE.num(Av, 1)}</b> → no inversor: R₁ = 1 kΩ, R₂ = <b>${CSE.fmtR(best)}</b> (A<sub>v</sub> = ${CSE.num(Avr, 1)})</div>
        <div style="margin-top:10px"><span class="kpi"><span class="k">Sin amplificar se usa</span><span class="v" style="color:${C.bad}">${CSE.num(sinA, 1)} % del rango</span></span><span class="kpi"><span class="k">Amplificando se usa</span><span class="v" style="color:${C.ok}">${CSE.num(Vmax / S.adc * 100, 0)} % del rango</span></span><span class="kpi"><span class="k">1 bit equivale a</span><span class="v">${CSE.num(lsb * 1e3, 2)} mV</span></span><span class="kpi"><span class="k">Resolución en el sensor</span><span class="v">${CSE.num(lsb / Avr * 1e6, 1)} µV</span></span></div>
        <div class="msg info" style="margin-top:8px">Amplificar antes de digitalizar aprovecha todos los niveles del convertidor. Se elige el no inversor (Z<sub>e</sub> muy alta, no carga al sensor) y un valor de R₂ por debajo para no saturar el convertidor.</div>`;
    }
    draw();
  });

  /* =====================================================================
     6. ENTRENA EL EXAMEN
     ===================================================================== */
  CSE.registrar('examen-p6', (root) => {
    const v = [];
    [['2019 (ej. 3) / 2023 Junio (ex. 3)', 150, 680, 2], ['2019 (ej. 6) / 2023 Junio (ex. 6)', 3900, 12000, 2], ['Propuesta N8', 1000, 10000, 0.5], ['Práctica: |A<sub>v</sub>| = 10', 1000, 10000, 0.1]].forEach(([n, R1, R2, Ve]) => {
      ['inv', 'noinv'].forEach(t => {
        const av = t === 'inv' ? -R2 / R1 : 1 + R2 / R1, vs = Math.min(13.5, Math.abs(av) * Ve);
        v.push({ nombre: (t === 'inv' ? 'Inversor · ' : 'No inversor · ') + n.replace(/<[^>]+>/g, ''),
          enunciado: `<b style="color:#280091">${n}</b><br>Amplificador <b>${t === 'inv' ? 'inversor' : 'no inversor'}</b> con LM741 a ±15 V, R₁ = <b>${CSE.fmtR(R1)}</b> y R₂ = <b>${CSE.fmtR(R2)}</b>. Entrada senoidal de <b>${CSE.num(Ve)} V</b> de amplitud. V<sub>sat</sub> ≈ ±13,5 V.`,
          campos: [{ k: 'av', t: 'Ganancia A<sub>v</sub> (con signo)', sol: av, signo: true }, { k: 'vs', t: 'Amplitud de la salida (V)', sol: vs }, { k: 'fase', t: 'Desfase entre V<sub>s</sub> y V<sub>e</sub> (°)', sol: t === 'inv' ? 180 : 0, abs: 1 }, { k: 'vmax', t: 'V<sub>e</sub> máxima sin recorte (V)', sol: 13.5 / Math.abs(av) }, { k: 'sin', t: 'Amplitud de V<sub>s</sub> sin realimentación (V)', sol: 13.5, tol: 0.08 }],
          solucion: `A<sub>v</sub> = ${t === 'inv' ? '−R₂/R₁' : '1 + R₂/R₁'} = <b>${CSE.num(av, 2)}</b> · V<sub>s</sub> = ${CSE.num(Math.abs(av), 2)} × ${CSE.num(Ve)} = <b>${CSE.num(Math.abs(av) * Ve, 2)} V</b>${Math.abs(av) * Ve > 13.5 ? ' → ¡se recorta en 13,5 V!' : ''} · desfase <b>${t === 'inv' ? '180°' : '0°'}</b> · V<sub>e,max</sub> = 13,5/|A<sub>v</sub>| = <b>${CSE.num(13.5 / Math.abs(av), 2)} V</b> · sin realimentación el AO satura: salida casi cuadrada de <b>±13,5 V</b>.` });
      });
    });
    CSE.entrenador(root, v);
  });
})();
