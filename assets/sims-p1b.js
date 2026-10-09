/* Simuladores de la Práctica 1 (2): osciloscopio, decibelios, eje logarítmico, PWM, examen y montaje */
(function () {
  const CSE = window.CSE, C = CSE.col;

  /* =====================================================================
     5. OSCILOSCOPIO VIRTUAL con el circuito RC
     ===================================================================== */
  CSE.registrar('scope', (root, ds) => {
    const S = { tipo: ds.tipo || 'hp', onda: 'senoidal', f: 284, A: 1, R: 56000, Cap: 10e-9, v1: 0.5, v2: 0.5, tdiv: 0.5e-3, cur: true, c1: 1, c2: 1.5, sel: null, sol: false };
    const fo = () => 1 / (2 * Math.PI * S.R * S.Cap);
    let sim = null, simKey = '';
    const VD = CSE.secuencia125(0.001, 10), TD = CSE.secuencia125(1e-6, 0.05);
    root.innerHTML = '';
    const g = CSE.el('<div style="display:grid;grid-template-columns:760px 1fr;gap:18px;align-items:start"></div>');
    const a = document.createElement('div'), b = document.createElement('div'); g.append(a, b); root.append(g);
    const sc = CSE.canvas(a, 820, 660, { label: 'Pantalla del osciloscopio' });
    sc.cv.style.background = '#0b1030'; sc.cv.style.borderRadius = '10px';
    const fmtVd = v => v >= 1 ? CSE.num(v) + ' V' : CSE.num(v * 1000) + ' mV';
    const fmtTd = t => t >= 1e-3 ? CSE.num(t * 1e3) + ' ms' : CSE.num(t * 1e6) + ' µs';

    const segC = CSE.seg([['hp', 'Diferenciador'], ['lp', 'Integrador']], S.tipo, v => { S.tipo = v; draw(); });
    const segO = CSE.seg([['senoidal', 'Senoidal'], ['cuadrada', 'Cuadrada'], ['triangular', 'Triangular']], S.onda, v => { S.onda = v; draw(); });
    const sf = CSE.logSlider(10, 20000, S.f, v => { S.f = v; draw(); }); sf.style.width = '240px';
    const vf = CSE.el('<span class="val"></span>');
    const pres = CSE.el('<span></span>');
    [['fo/10', 0.1], ['fo', 1], ['10·fo', 10]].forEach(([t, k]) => { const bt = CSE.el(`<button class="btn sm sec" style="margin-right:4px">${t}</button>`); bt.addEventListener('click', () => { S.f = fo() * k; sf.set(S.f); autoset(); }); pres.append(bt); });
    const selA = CSE.select([0.5, 1, 2, 5, 10], S.A, v => { S.A = v; draw(); }, v => CSE.num(v) + ' V (amplitud)');
    const selR = CSE.select(CSE.Rs, S.R, v => { S.R = v; draw(); }, CSE.fmtR);
    const selCp = CSE.select(CSE.Cs, S.Cap, v => { S.Cap = v; draw(); }, CSE.fmtC);
    const s1 = CSE.select(VD, S.v1, v => { S.v1 = v; draw(); }, v => 'CH1 ' + fmtVd(v) + '/div');
    const s2 = CSE.select(VD, S.v2, v => { S.v2 = v; draw(); }, v => 'CH2 ' + fmtVd(v) + '/div');
    const st = CSE.select(TD, S.tdiv, v => { S.tdiv = v; draw(); }, v => fmtTd(v) + '/div');
    const bAuto = CSE.el('<button class="btn sm verde">AUTOSET</button>'); bAuto.addEventListener('click', autoset);
    const bCur = CSE.el('<button class="btn sm sec" aria-pressed="true">Cursores de tiempo</button>');
    bCur.addEventListener('click', () => { S.cur = !S.cur; bCur.setAttribute('aria-pressed', S.cur); draw(); });
    const bSol = CSE.el('<button class="btn sm sec" aria-pressed="false">Ver valores teóricos</button>');
    bSol.addEventListener('click', () => { S.sol = !S.sol; bSol.setAttribute('aria-pressed', S.sol); draw(); });
    const fila = (lab, ...els) => { const d = CSE.el('<div class="ctl"></div>'); if (lab) d.append(CSE.el(`<label style="min-width:96px">${lab}</label>`)); d.append(...els); return d; };
    const meds = CSE.el('<div style="margin-top:8px"></div>');
    b.append(fila('Circuito', segC), fila('R · C', selR, selCp), fila('Generador', segO), fila('', selA), fila('Frecuencia', sf, vf), fila('', pres),
      fila('Escalas', s1, s2), fila('', st, bAuto), fila('Medir', bCur, bSol), meds);

    function autoset() {
      ensure();
      const pp = arr => { let mn = 1e9, mx = -1e9; arr.forEach(v => { mn = Math.min(mn, v); mx = Math.max(mx, v); }); return mx - mn; };
      const pick = (lst, x) => lst.find(v => v >= x) || lst[lst.length - 1];
      S.v1 = pick(VD, pp(sim.vin) / 6); S.v2 = pick(VD, pp(sim.vout) / 6); S.tdiv = pick(TD, 2.5 / S.f / 10);
      s1.value = S.v1; s2.value = S.v2; st.value = S.tdiv; draw();
    }
    function ensure() {
      const k = [S.tipo, S.onda, S.f, S.A, S.R, S.Cap].join('|');
      if (k !== simKey) { sim = CSE.simRC(S.tipo, S.onda, S.f, S.A, S.R * S.Cap, 2000); simKey = k; }
    }
    const X0 = 10, Y0 = 10, DIV = 80, cx = X0 + 5 * DIV, cy = Y0 + 4 * DIV;
    function draw() {
      ensure(); vf.textContent = CSE.fmtF(S.f);
      const { ctx, W, H } = sc; ctx.clearRect(0, 0, W, H);
      // retícula
      ctx.strokeStyle = 'rgba(159,227,230,.18)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(X0 + i * DIV, Y0); ctx.lineTo(X0 + i * DIV, Y0 + 8 * DIV); ctx.stroke(); }
      for (let j = 0; j <= 8; j++) { ctx.beginPath(); ctx.moveTo(X0, Y0 + j * DIV); ctx.lineTo(X0 + 10 * DIV, Y0 + j * DIV); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(159,227,230,.35)';
      for (let i = 0; i <= 50; i++) { const x = X0 + i * DIV / 5; ctx.beginPath(); ctx.moveTo(x, cy - 4); ctx.lineTo(x, cy + 4); ctx.stroke(); }
      for (let j = 0; j <= 40; j++) { const y = Y0 + j * DIV / 5; ctx.beginPath(); ctx.moveTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.stroke(); }
      // trazas (disparo en el flanco de subida de CH1, situado a 1 división del borde)
      const traza = (arr, vdiv, col) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.beginPath();
        for (let px = 0; px <= 10 * DIV; px++) { const t = (px / DIV - 1) * S.tdiv; let y = cy - sim.at(arr, t) / vdiv * DIV; y = Math.max(Y0 - 2, Math.min(Y0 + 8 * DIV + 2, y)); px ? ctx.lineTo(X0 + px, y) : ctx.moveTo(X0 + px, y); }
        ctx.stroke(); ctx.restore();
      };
      traza(sim.vin, S.v1, C.ch1); traza(sim.vout, S.v2, C.ch2);
      ctx.fillStyle = C.ch1; ctx.font = '800 18px Archivo'; ctx.fillText('1▶', X0 - 2, cy - 2);
      ctx.fillStyle = C.ch1; ctx.beginPath(); ctx.moveTo(X0 + DIV, Y0); ctx.lineTo(X0 + DIV - 7, Y0 - 1); ctx.lineTo(X0 + DIV, Y0 + 10); ctx.lineTo(X0 + DIV + 7, Y0 - 1); ctx.fill();
      // cursores
      let dt = null;
      if (S.cur) {
        [S.c1, S.c2].forEach((c, i) => { const x = X0 + c * DIV; ctx.save(); ctx.strokeStyle = '#ff9f6b'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y0 + 8 * DIV); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#ff9f6b'; ctx.font = '800 17px Archivo'; ctx.fillText(i ? 'b' : 'a', x + 4, Y0 + 16); });
        dt = Math.abs(S.c2 - S.c1) * S.tdiv;
        ctx.fillStyle = '#ff9f6b'; ctx.font = '700 18px "Source Sans 3"'; ctx.fillText('Δt = ' + CSE.fmtT(dt) + '   1/Δt = ' + CSE.fmtF(1 / dt), X0 + 480, Y0 + 8 * DIV - 12);
      }
      const yl = Y0 + 8 * DIV - 12; ctx.fillStyle = C.ch1; ctx.font = '700 18px "Source Sans 3"'; ctx.fillText('CH1 ' + fmtVd(S.v1) + '/div', X0 + 8, yl);
      ctx.fillStyle = C.ch2; ctx.fillText('CH2 ' + fmtVd(S.v2) + '/div', X0 + 150, yl);
      ctx.fillStyle = '#fff'; ctx.fillText('M ' + fmtTd(S.tdiv) + '/div', X0 + 300, yl);
      ctx.fillText('f = ' + CSE.fmtF(S.f), X0 + 640, Y0 + 24);
      // medidas
      const pp = arr => { let mn = 1e9, mx = -1e9; arr.forEach(v => { mn = Math.min(mn, v); mx = Math.max(mx, v); }); return mx - mn; };
      const p1 = pp(sim.vin), p2 = pp(sim.vout), T = 1 / S.f;
      const fasePeriodo = S.cur ? 360 * dt / T : null;
      const per = 10 * S.tdiv / T;
      let aviso = '';
      if (per < 1) aviso = 'Se ve menos de un periodo: aumenta el tiempo por división.'; else if (per > 12) aviso = 'Se ven demasiados periodos: reduce el tiempo por división.';
      if (p1 / S.v1 > 8.2 || p2 / S.v2 > 8.2) aviso += ' Alguna señal se sale de la pantalla: aumenta los V/div.';
      const teo = CSE.rc(S.tipo, S.f, fo());
      meds.innerHTML = `<div>
        <span class="kpi"><span class="k">CH1 Vpp</span><span class="v" style="color:#b58b00">${CSE.fmtV(p1)}</span></span>
        <span class="kpi"><span class="k">CH2 Vpp</span><span class="v" style="color:#0aa3ab">${CSE.fmtV(p2)}</span></span>
        <span class="kpi"><span class="k">G = Vs/Ve</span><span class="v">${CSE.num(p2 / p1, 3)}</span></span>
        <span class="kpi"><span class="k">20·log G</span><span class="v">${CSE.num(CSE.dB(p2 / p1), 1)} dB</span></span></div>
        ${S.cur ? `<div style="margin-top:6px"><span class="kpi"><span class="k">φ = 360°·Δt/T (cursores)</span><span class="v">${CSE.num(fasePeriodo, 1)}°</span></span><span class="kpi"><span class="k">fo teórica</span><span class="v">${CSE.fmtF(fo())}</span></span></div>
        <div class="tiny" style="font-size:17px;color:#6b6f86;margin-top:4px">Arrastra los cursores a y b sobre dos pasos por cero equivalentes de CH1 y CH2.</div>` : ''}
        ${S.sol && S.onda === 'senoidal' ? `<div class="msg ok">Teórico a ${CSE.fmtF(S.f)}: |G| = ${CSE.num(teo.mag, 3)} (${CSE.num(CSE.dB(teo.mag), 1)} dB), φ = ${CSE.num(teo.fase, 1)}° → Δt = ${CSE.fmtT(Math.abs(teo.fase) / 360 * T)}</div>` : ''}
        ${S.sol && S.onda !== 'senoidal' ? `<div class="msg info">Con ondas no senoidales la "ganancia" depende de la forma: el diferenciador da picos (derivada) y el integrador una onda triangular (integral). τ = RC = ${CSE.fmtT(S.R * S.Cap)}.</div>` : ''}
        ${aviso ? `<div class="msg bad">${aviso}</div>` : ''}`;
    }
    sc.cv.addEventListener('pointerdown', e => { if (!S.cur) return; const p = CSE.pos(sc.cv, e, sc.W, sc.H); const d = (p.x - X0) / DIV; S.sel = Math.abs(d - S.c1) < Math.abs(d - S.c2) ? 'c1' : 'c2'; S[S.sel] = Math.max(0, Math.min(10, d)); sc.cv.setPointerCapture(e.pointerId); draw(); });
    sc.cv.addEventListener('pointermove', e => { const p = CSE.pos(sc.cv, e, sc.W, sc.H); const d = (p.x - X0) / DIV; sc.cv.style.cursor = S.cur ? 'ew-resize' : 'default'; if (S.sel) { S[S.sel] = Math.max(0, Math.min(10, d)); draw(); } });
    sc.cv.addEventListener('pointerup', () => S.sel = null);
    autoset();
  });

  /* =====================================================================
     6. CALCULADORA DE DECIBELIOS
     ===================================================================== */
  CSE.registrar('db', (root) => {
    const S = { g: 0.707 };
    root.innerHTML = `<div class="ctl"><label>G = Vs/Ve</label></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center;margin-top:6px">
        <div class="cv"></div>
        <div><div class="kpi" style="width:100%"><span class="k">Ganancia en decibelios</span><span class="v big" style="font-size:57px"></span></div>
        <div class="ctl" style="margin-top:10px"><label>…o escribe los dB</label><input type="number" step="1" style="width:110px" class="indb"></div>
        <div class="msg info expl"></div></div></div>
      <div class="ctl atajos" style="margin-top:6px"><label>Atajos:</label></div>`;
    const sl = CSE.logSlider(0.001, 10, S.g, v => { S.g = v; draw(); }); sl.style.width = '420px';
    const vg = CSE.el('<span class="val"></span>');
    root.querySelector('.ctl').append(sl, vg);
    const cv = CSE.canvas(root.querySelector('.cv'), 560, 260, { label: 'Amplitud de entrada y salida' });
    const indb = root.querySelector('.indb');
    indb.addEventListener('input', () => { const d = parseFloat(indb.value); if (isFinite(d)) { S.g = Math.pow(10, d / 20); sl.set(S.g); draw(true); } });
    [[1, '0 dB'], [0.7071, '−3 dB'], [0.5, '−6 dB'], [0.1, '−20 dB'], [0.01, '−40 dB'], [2, '+6 dB']].forEach(([g, t]) => { const b = CSE.el(`<button class="btn sm sec">${t}</button>`); b.addEventListener('click', () => { S.g = g; sl.set(g); draw(); }); root.querySelector('.atajos').append(b); });
    function draw(desdeDb) {
      const d = CSE.dB(S.g); vg.textContent = CSE.num(S.g, S.g < 0.01 ? 4 : 3);
      root.querySelector('.big').textContent = (d > 0.05 ? '+' : '') + CSE.num(d, 1) + ' dB';
      if (!desdeDb) indb.value = Math.round(d * 10) / 10;
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const ty = CSE.linMap(-1.25, 1.25, H - 10, 10), tx = CSE.linMap(0, 2, 10, W - 10);
      const k = Math.min(1, 1 / Math.max(1, S.g));
      const pe = [], ps = []; for (let x = 10; x <= W - 10; x++) { const t = tx.inv(x); pe.push([x, ty(k * Math.sin(2 * Math.PI * t))]); ps.push([x, ty(k * S.g * Math.sin(2 * Math.PI * t))]); }
      CSE.line(ctx, [[10, ty(0)], [W - 10, ty(0)]], '#dfe3f3', 1);
      CSE.line(ctx, pe, C.lavanda, 2.5); CSE.line(ctx, ps, C.teal, 3.5);
      CSE.label(ctx, '━ Ve', 14, 22, { color: C.lavanda, font: '800 17px Archivo' }); CSE.label(ctx, '━ Vs', 84, 22, { color: C.teal, font: '800 17px Archivo' });
      root.querySelector('.expl').innerHTML = S.g > 1.001 ? 'G > 1: la señal se <b>amplifica</b> (dB positivos). Un filtro pasivo nunca lo hace.' : S.g > 0.69 ? 'Atenuación pequeña. En −3 dB (0,707) la potencia es la mitad: ahí está la <b>frecuencia de corte</b>.' : S.g > 0.09 ? 'Cada −20 dB la amplitud se divide por 10; cada −6 dB, por 2.' : 'La salida es menos de la décima parte de la entrada: la componente está prácticamente <b>bloqueada</b>.';
    }
    draw();
  });

  /* =====================================================================
     7. JUEGO: sitúa la frecuencia en el eje logarítmico
     ===================================================================== */
  CSE.registrar('logjuego', (root) => {
    const LISTA = [20, 30, 50, 75, 150, 200, 284, 300, 500, 700, 1500, 2000, 3500, 5000, 6000, 12000, 25000, 60000];
    const S = { ronda: 0, pts: 0, obj: null, clic: null, hecho: false };
    root.innerHTML = `<div class="ctl"><span class="kpi"><span class="k">Sitúa en el eje</span><span class="v obj"></span></span>
      <span class="kpi"><span class="k">Ronda</span><span class="v ron"></span></span><span class="kpi"><span class="k">Puntos</span><span class="v pts"></span></span>
      <button class="btn sm verde sig">Siguiente</button><button class="btn sm sec rei">Reiniciar</button></div><div class="cv"></div><div class="msg info m">Haz clic en el eje donde creas que está esa frecuencia.</div>`;
    const cv = CSE.canvas(root.querySelector('.cv'), 1400, 190, { label: 'Eje logarítmico de frecuencias' });
    const fx = CSE.logMap(10, 1e5, 40, 1360);
    const nueva = () => { let f; do { f = LISTA[Math.floor(Math.random() * LISTA.length)]; } while (f === S.obj); S.obj = f; S.clic = null; S.hecho = false; S.ronda++; draw(); };
    root.querySelector('.sig').addEventListener('click', () => { if (S.ronda >= 5 && S.hecho) { S.ronda = 0; S.pts = 0; } nueva(); });
    root.querySelector('.rei').addEventListener('click', () => { S.ronda = 0; S.pts = 0; nueva(); });
    cv.cv.style.cursor = 'crosshair';
    cv.cv.addEventListener('click', e => {
      if (S.hecho) return; const p = CSE.pos(cv.cv, e, cv.W, cv.H); if (p.x < 40 || p.x > 1360) return;
      S.clic = fx.inv(p.x); S.hecho = true;
      const err = Math.abs(Math.log10(S.clic) - Math.log10(S.obj)); const ganados = Math.max(0, Math.round(100 - err * 300)); S.pts += ganados;
      root.querySelector('.m').innerHTML = `Has marcado ${CSE.fmtF(S.clic)} (objetivo ${CSE.fmtF(S.obj)}): ${ganados} puntos. ${err < 0.05 ? '¡Clavado!' : err < 0.15 ? 'Muy cerca.' : 'Recuerda: entre 100 y 1000, el 200 está al 30 % de la década, el 300 al 48 % y el 500 al 70 %.'}` + (S.ronda >= 5 ? ` <b>Fin: ${S.pts} / 500 puntos.</b>` : '');
      draw();
    });
    function draw() {
      root.querySelector('.obj').textContent = S.obj ? CSE.fmtF(S.obj) : '–'; root.querySelector('.ron').textContent = Math.min(S.ronda, 5) + ' / 5'; root.querySelector('.pts').textContent = S.pts;
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const y = 110; CSE.gridLog(ctx, fx, 10, 1e5, 20, y, { noLabels: true }); for (let d = 1; d <= 5; d++) CSE.label(ctx, CSE.fmtF(Math.pow(10, d)), fx(Math.pow(10, d)), y + 42, { align: 'center', color: C.azul, font: '800 20px Archivo' });
      CSE.line(ctx, [[40, y], [1360, y]], C.azul, 3);
      for (let d = 1; d <= 5; d++) for (let m = 1; m <= 9; m++) { const f = m * Math.pow(10, d); if (f > 1e5) continue; const x = fx(f); CSE.line(ctx, [[x, y - (m === 1 ? 14 : 7)], [x, y + (m === 1 ? 14 : 7)]], C.azul, m === 1 ? 3 : 1.5); }
      if (S.clic) { const x = fx(S.clic); ctx.fillStyle = C.naranja; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x - 10, y - 26); ctx.lineTo(x + 10, y - 26); ctx.fill(); }
      if (S.hecho) { const x = fx(S.obj); ctx.fillStyle = C.verde; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); CSE.label(ctx, CSE.fmtF(S.obj), x, y - 34, { align: 'center', color: C.teal, font: '800 21px Archivo' }); }
    }
    nueva();
  });

  /* =====================================================================
     8. APLICACIÓN INFORMÁTICA: PWM de Arduino + filtro paso bajo RC
     ===================================================================== */
  CSE.registrar('pwm', (root) => {
    const S = { D: 0.5, fp: 490, R: 10000, Cap: 1e-6, V: 5 };
    root.innerHTML = '';
    const c1 = CSE.el('<div class="ctl"></div>');
    const sD = CSE.el('<input type="range" min="0" max="100" value="50">'); const vD = CSE.el('<span class="val"></span>');
    sD.addEventListener('input', () => { S.D = sD.value / 100; draw(); });
    const sfp = CSE.seg([['490', '490 Hz (pines 3, 9, 10, 11)'], ['980', '980 Hz (pines 5 y 6)']], '490', v => { S.fp = +v; draw(); });
    c1.append(CSE.el('<label>Ciclo de trabajo D</label>'), sD, vD, sfp);
    const c2 = CSE.el('<div class="ctl"></div>');
    c2.append(CSE.el('<label>R</label>'), CSE.select(CSE.Rs, S.R, v => { S.R = v; draw(); }, CSE.fmtR), CSE.el('<label>C</label>'), CSE.select(CSE.Cs, S.Cap, v => { S.Cap = v; draw(); }, CSE.fmtC));
    const kp = CSE.el('<span></span>'); c2.append(kp);
    const cv = CSE.canvas(root, 1400, 380, { label: 'Señal PWM y salida filtrada' });
    const msg = CSE.el('<div class="msg info"></div>');
    root.prepend(c1, c2); root.append(msg);
    function draw() {
      vD.textContent = Math.round(S.D * 100) + ' %';
      const tau = S.R * S.Cap, Tp = 1 / S.fp, fo = 1 / (2 * Math.PI * tau);
      const Tw = Math.min(0.4, Math.max(8 * Tp, 6 * tau));
      const n = 6000, dt = Tw / n; let vc = 0; const out = new Float32Array(n), inn = new Float32Array(n);
      const sub = Math.max(1, Math.ceil(dt / (tau / 20))), h = dt / sub, k = 1 - Math.exp(-h / tau);
      for (let i = 0; i < n; i++) { for (let s = 0; s < sub; s++) { const t = (i + (s + .5) / sub) * dt; const u = (t / Tp) % 1; vc += ((u < S.D ? S.V : 0) - vc) * k; } const t = (i + 1) * dt; inn[i] = ((t / Tp) % 1) < S.D ? S.V : 0; out[i] = vc; }
      const iUlt = Math.max(0, n - Math.ceil(Tp / dt)); let mn = 1e9, mx = -1e9; for (let i = iUlt; i < n; i++) { mn = Math.min(mn, out[i]); mx = Math.max(mx, out[i]); }
      const rip = mx - mn;
      kp.innerHTML = `<span class="kpi"><span class="k">fo del filtro</span><span class="v">${CSE.fmtF(fo)}</span></span><span class="kpi"><span class="k">Media = D·5 V</span><span class="v">${CSE.num(S.D * 5, 2)} V</span></span><span class="kpi"><span class="k">Rizado pico-pico</span><span class="v">${CSE.fmtV(rip)}</span></span><span class="kpi"><span class="k">Se estabiliza en ≈ 5τ</span><span class="v">${CSE.fmtT(5 * tau)}</span></span>`;
      const { ctx, W, H } = cv; ctx.clearRect(0, 0, W, H);
      const tx = CSE.linMap(0, Tw, 60, W - 14), ty = CSE.linMap(-0.3, 5.6, H - 28, 14);
      CSE.gridY(ctx, ty, [0, 1, 2, 3, 4, 5], 60, W - 14, v => v + ' V', { zero: true });
      const pin = [], po = []; for (let i = 0; i < n; i += 1) { const x = tx((i + 1) * dt); pin.push([x, ty(inn[i])]); po.push([x, ty(out[i])]); }
      CSE.line(ctx, pin, 'rgba(122,134,217,.55)', 1.5); CSE.line(ctx, po, C.teal, 3.5);
      CSE.line(ctx, [[60, ty(S.D * 5)], [W - 14, ty(S.D * 5)]], C.naranja, 2, [8, 6]);
      CSE.label(ctx, 'Ventana: ' + CSE.fmtT(Tw), W - 16, H - 8, { align: 'right', color: C.gris, font: '700 16px "Source Sans 3"' });
      CSE.label(ctx, '━ PWM (salida digital)', 64, 30, { color: C.lavanda, font: '800 17px Archivo' }); CSE.label(ctx, '━ Tensión filtrada (salida "analógica")', 300, 30, { color: C.teal, font: '800 17px Archivo' }); CSE.label(ctx, '- - valor medio D·5 V', 700, 30, { color: C.naranja, font: '800 17px Archivo' });
      const ratio = S.fp / fo;
      msg.innerHTML = ratio < 5 ? `<b>Filtro demasiado "rápido"</b> (f<sub>o</sub> cerca de la frecuencia PWM): la salida sigue los pulsos y el rizado es grande. Aumenta R o C.`
        : 5 * tau > 0.2 ? `<b>Filtro muy "lento"</b>: casi no hay rizado, pero tarda ${CSE.fmtT(5 * tau)} en llegar al valor final. Para un LED da igual; para controlar un motor quizá sea demasiado.`
        : `<b>Buen compromiso</b>: la componente de ${S.fp} Hz cae unos ${CSE.num(-CSE.dB(CSE.rc('lp', S.fp, fo).mag), 0)} dB y la tensión media (D·5 V) llega en ${CSE.fmtT(5 * tau)}. Así se fabrica una salida analógica con un pin digital.`;
    }
    draw();
  });

  /* =====================================================================
     9. ENTRENA EL EXAMEN con los enunciados reales 2021-2026
     ===================================================================== */
  CSE.registrar('examen', (root) => {
    const V = [
      ['hp', '2021 Junio', 5600, 150e-9, '2 V'], ['hp', '2021 Julio', 2200, 150e-9, '3 V'], ['hp', '2022 Junio', 4700, 22e-9, '6 Vpp'], ['hp', '2022 Julio', 18000, 22e-9, '10 Vpp'],
      ['hp', '2023 Junio', 18000, 22e-9, '3 V'], ['hp', '2023 Julio', 10000, 22e-9, '4 V'], ['hp', '2024 Junio', 10000, 33e-9, '5 V'], ['hp', '2024 Julio/Sept.', 10000, 33e-9, '8 Vpp'],
      ['hp', '2025 Junio', 10000, 33e-9, '10 Vpp'], ['hp', '2025 Julio/Sept.', 6800, 33e-9, '10 Vpp'], ['hp', '2026 Junio', 1000, 470e-9, '10 Vpp'], ['hp', '2026 Julio/Sept.', 2200, 100e-9, '20 Vpp'],
      ['lp', '2021 Junio', 5600, 150e-9, '2 V'], ['lp', '2021 Julio', 2200, 150e-9, '3 V'], ['lp', '2022 Junio', 4700, 22e-9, '6 Vpp'], ['lp', '2022 Julio', 18000, 22e-9, '10 Vpp'],
      ['lp', '2022 Septiembre', 1800, 150e-9, '2 V'], ['lp', '2023 Junio', 18000, 22e-9, '2 V'], ['lp', '2023 Julio', 10000, 22e-9, '5 V'], ['lp', '2024 Junio', 10000, 33e-9, '3 V'],
      ['lp', '2024 Julio/Sept.', 10000, 33e-9, '5 Vpp'], ['lp', '2025 Junio', 10000, 33e-9, '6 Vpp'], ['lp', '2025 Julio/Sept.', 6800, 33e-9, '6 Vpp'], ['lp', '2026 Junio', 1000, 470e-9, '6 Vpp'], ['lp', '2026 Julio/Sept.', 2200, 100e-9, '20 Vpp']
    ];
    const TD = CSE.secuencia125(1e-6, 0.05);
    let cur = null;
    root.innerHTML = `<div class="ctl"><label>Convocatoria</label><select class="sel"></select><button class="btn sm verde azar">Enunciado al azar</button></div>
      <div class="card enun" style="font-size:23px;border-top-color:#00b299;margin:8px 0"></div>
      <table><thead><tr><th>Apartado</th><th>Tu respuesta</th><th>Comprobación</th></tr></thead><tbody></tbody></table>
      <div class="ctl" style="margin-top:8px"><button class="btn sm verde chk">Comprobar</button><button class="btn sm sec sol">Ver solución</button></div><div class="res"></div>`;
    const sel = root.querySelector('.sel');
    V.forEach((v, i) => { const o = document.createElement('option'); o.value = i; o.textContent = (v[0] === 'hp' ? 'Diferenciador · ' : 'Integrador · ') + v[1]; sel.appendChild(o); });
    const filas = [['fc', 'Frecuencia de corte f<sub>c</sub> (Hz)'], ['db', 'Ganancia en f<sub>c</sub> (dB)'], ['ph', 'Fase en f<sub>c</sub> (°)'], ['vs', 'Vs en f<sub>c</sub> (mismas unidades que Ve)'], ['td', 'Time/div para ver 2 periodos en f<sub>c</sub> (ms)']];
    const tb = root.querySelector('tbody');
    filas.forEach(([k, t]) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${t}</td><td><input class="cell" style="width:120px" data-k="${k}" inputmode="decimal"></td><td class="ck" data-k="${k}"></td>`; tb.appendChild(tr); });
    const num = s => parseFloat(String(s).replace(',', '.'));
    function carga(i) {
      cur = V[i]; sel.value = i; const [t, conv, R, Cp, Ve] = cur;
      root.querySelector('.enun').innerHTML = `<b style="color:#280091">Examen de laboratorio · ${conv}</b><br>Monta un circuito <b>${t === 'hp' ? 'diferenciador (RC en el que la salida se toma en la resistencia)' : 'integrador (RC en el que la salida se toma en el condensador)'}</b> con R = <b>${CSE.fmtR(R)}</b> y C = <b>${CSE.fmtC(Cp)}</b>, alimentado con una señal senoidal de <b>${Ve}</b>. Identifica el circuito, calcula los valores teóricos en la frecuencia de corte y elige la base de tiempos.`;
      tb.querySelectorAll('input').forEach(x => x.value = ''); tb.querySelectorAll('.ck').forEach(x => x.innerHTML = ''); root.querySelector('.res').innerHTML = '';
    }
    function sol() { const [t, , R, Cp, Ve] = cur; const fc = 1 / (2 * Math.PI * R * Cp); const ve = num(Ve); return { fc, db: -3.01, ph: t === 'hp' ? 45 : -45, vs: 0.7071 * ve, td: 2 / fc / 10 * 1000, ve, unidad: /pp/.test(Ve) ? 'Vpp' : 'V' }; }
    root.querySelector('.chk').addEventListener('click', () => {
      const s = sol(); let ok = 0;
      tb.querySelectorAll('input').forEach(inp => {
        const k = inp.dataset.k, v = num(inp.value), ck = tb.querySelector(`.ck[data-k="${k}"]`); let bien = false, nota = '';
        if (!isFinite(v)) { ck.innerHTML = ''; return; }
        if (k === 'fc') bien = Math.abs(v - s.fc) / s.fc < 0.03;
        if (k === 'db') bien = Math.abs(v - s.db) < 0.3;
        if (k === 'ph') { bien = Math.abs(v - s.ph) < 2; if (!bien && Math.abs(v + s.ph) < 2) nota = ' (¡revisa el signo!)'; }
        if (k === 'vs') bien = Math.abs(v - s.vs) / s.vs < 0.03;
        if (k === 'td') { const per = 10 * v / 1000 * s.fc; bien = per >= 1.8 && per <= 6; nota = ` (se verían ${CSE.num(per, 1)} periodos)`; }
        if (bien) ok++;
        ck.innerHTML = `<span class="pill ${bien ? 'ok' : 'bad'}">${bien ? 'Bien' : 'Revisa'}</span>${nota}`;
      });
      root.querySelector('.res').innerHTML = `<div class="msg ${ok === 5 ? 'ok' : 'info'}">${ok} de 5 apartados correctos.${ok === 5 ? ' ¡Listo para el examen!' : ''}</div>`;
    });
    root.querySelector('.sol').addEventListener('click', () => {
      const s = sol(); const td = TD.find(x => x >= 2.2 / s.fc / 10) || TD[TD.length - 1];
      root.querySelector('.res').innerHTML = `<div class="msg ok"><b>Solución.</b> f<sub>c</sub> = 1/(2πRC) = <b>${CSE.fmtF(s.fc)}</b> · |G| = 0,707 → <b>−3 dB</b> · φ = <b>${s.ph > 0 ? '+' : ''}${s.ph}°</b> (${s.ph > 0 ? 'adelanto' : 'retraso'}) · Vs = 0,707·${CSE.num(s.ve)} = <b>${CSE.num(s.vs, 2)} ${s.unidad}</b> · T = ${CSE.fmtT(1 / s.fc)}: con <b>${td >= 1e-3 ? CSE.num(td * 1e3) + ' ms' : CSE.num(td * 1e6) + ' µs'}/div</b> se ven ${CSE.num(10 * td * s.fc, 1)} periodos.</div>`;
    });
    sel.addEventListener('change', () => carga(+sel.value));
    root.querySelector('.azar').addEventListener('click', () => carga(Math.floor(Math.random() * V.length)));
    carga(V.length - 1);
  });

  /* =====================================================================
     10. MONTAJE: esquema y conexión de las sondas
     ===================================================================== */
  CSE.registrar('montaje', (root, ds) => {
    let tipo = ds.tipo || 'hp';
    root.innerHTML = '<div class="ctl seg-h"></div><div class="svg"></div><div class="msg info nota"></div>';
    if (ds.tipo) root.querySelector('.seg-h').remove(); else root.querySelector('.seg-h').append(CSE.seg([['hp', 'Diferenciador (paso alto)'], ['lp', 'Integrador (paso bajo)']], tipo, v => { tipo = v; draw(); }));
    const resist = (x, y, vert) => vert ? `<path d="M${x} ${y} v14 l-12 6 l24 10 l-24 10 l24 10 l-24 10 l12 6 v14" class="w"/>` : `<path d="M${x} ${y} h14 l6 -12 l10 24 l10 -24 l10 24 l10 -24 l6 12 h14" class="w"/>`;
    const cond = (x, y, vert) => vert ? `<path d="M${x} ${y} v34 M${x - 20} ${y + 34} h40 M${x - 20} ${y + 46} h40 M${x} ${y + 46} v34" class="w"/>` : `<path d="M${x} ${y} h34 M${x + 34} ${y - 20} v40 M${x + 46} ${y - 20} v40 M${x + 46} ${y} h34" class="w"/>`;
    function draw() {
      const hp = tipo === 'hp';
      const serie = hp ? cond(260, 90) : resist(260, 90);
      const shunt = hp ? resist(470, 140, true) : cond(470, 140, true);
      root.querySelector('.svg').innerHTML = `<svg viewBox="0 0 760 380" style="width:100%;max-height:520px" role="img" aria-label="Esquema del ${hp ? 'diferenciador' : 'integrador'} con las sondas">
        <style>.w{fill:none;stroke:#22223a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.t{font:700 20px 'Source Sans 3',sans-serif;fill:#22223a}.b{font:800 25px Archivo,sans-serif}</style>
        <circle cx="110" cy="200" r="42" class="w"/><path d="M84 200 q13 -22 26 0 t26 0" class="w"/>
        <text x="40" y="275" class="t">Generador</text>
        <path d="M110 158 V90 H260" class="w"/>${serie}<path d="M340 90 H600" class="w"/>
        <path d="M470 90 V140" class="w"/>${shunt}<path d="M470 220 V300" class="w"/>
        <path d="M110 242 V300 H600" class="w"/>
        <path d="M350 300 v14 M334 314 h32 M340 322 h20 M346 330 h8" class="w"/>
        <text x="${hp ? 268 : 270}" y="${hp ? 58 : 66}" class="b" fill="#280091">${hp ? 'C = 10 nF' : 'R = 56 kΩ'}</text>
        <text x="455" y="187" class="b" fill="#280091" text-anchor="end">${hp ? 'R = 56 kΩ' : 'C = 10 nF'}</text>
        <circle cx="200" cy="90" r="9" fill="#f2c94c" stroke="#22223a" stroke-width="2"/><text x="170" y="128" class="b" fill="#b58b00">CH1 · Ve</text>
        <circle cx="600" cy="90" r="9" fill="#3fcfd5" stroke="#22223a" stroke-width="2"/><text x="610" y="80" class="b" fill="#0a8a92">CH2 · Vs</text>
        <path d="M600 99 V300" class="w" style="stroke-dasharray:6 6;stroke:#6b6f86"/>
        <circle cx="600" cy="300" r="8" fill="#22223a"/><text x="560" y="345" class="t">masas de CH1 y CH2</text>
        <text x="618" y="205" class="t">Vs</text>
      </svg>`;
      root.querySelector('.nota').innerHTML = hp ? '<b>Diferenciador:</b> el condensador va en <b>serie</b> y la salida se toma en la <b>resistencia</b>. A baja frecuencia C "corta" la señal: <b>paso alto</b>, fase positiva (adelanto).' : '<b>Integrador:</b> la resistencia va en <b>serie</b> y la salida se toma en el <b>condensador</b>. A alta frecuencia C "cortocircuita" la salida: <b>paso bajo</b>, fase negativa (retraso).';
    }
    draw();
  });
})();
