/* Votaciones en directo con QR (Firebase Realtime Database vía REST, sin librerías).
   Uso en la presentación:  <div class="poll-widget" data-p="P1" data-b="inicial"></div>
   Ruta de los datos:       /cse/<práctica>/<bloque>/<sesión>/<id> = { r: [respuestas], t: fecha }  */
(function () {
  const CFG = window.CSE_CONFIG || {};
  const FB = (CFG.firebaseURL || '').replace(/\/+$/, '');
  const LETRAS = 'ABCDEFGH';
  const DEMO = {};

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function hoy() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function limpiaSesion(s) { return (s || '').trim().replace(/[.#$\[\]\/\s]+/g, '-').slice(0, 40) || hoy(); }

  function urlVoto(p, b, s) {
    let base = CFG.voteBaseURL;
    if (!base) base = location.href.replace(/[#?].*$/, '').replace(/[^\/]*$/, '');
    if (!/\/$/.test(base)) base += '/';
    return base + 'vota.html?p=' + encodeURIComponent(p) + '&b=' + encodeURIComponent(b) + '&s=' + encodeURIComponent(s);
  }

  function qrSVG(texto, color) {
    const q = qrcode(0, 'M'); q.addData(texto); q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }).replace(/fill="black"/g, `fill="${color || '#280091'}"`);
  }

  /* ---------- fuente de datos: Firebase en directo o demo ---------- */
  function suscribir(ruta, cb, onEstado) {
    let votos = {}; let cerrado = false; let es = null; let timer = null;
    const emit = () => cb(Object.values(votos).filter(Boolean));
    if (!FB) {
      onEstado('demo');
      const st = DEMO[ruta] = DEMO[ruta] || { votos: {}, subs: new Set() };
      const f = () => cb(Object.values(st.votos));
      st.subs.add(f); f();
      const all = () => st.subs.forEach(g => g());
      return { demo: true, add(v) { st.votos['d' + Math.random()] = v; all(); }, reset() { st.votos = {}; all(); }, close() { st.subs.delete(f); } };
    }
    const url = FB + '/' + ruta + '.json';
    function polling() {
      onEstado('live');
      const tick = () => fetch(url).then(r => r.json()).then(d => { votos = d || {}; emit(); }).catch(() => onEstado('err'));
      tick(); timer = setInterval(() => { if (!cerrado) tick(); }, 3000);
    }
    try {
      es = new EventSource(url); let abierto = false;
      es.onopen = () => { abierto = true; onEstado('live'); };
      const handler = ev => {
        const m = JSON.parse(ev.data); if (!m) return;
        const parts = (m.path || '/').split('/').filter(Boolean);
        if (ev.type === 'put') {
          if (parts.length === 0) votos = m.data || {};
          else if (parts.length === 1) { if (m.data === null) delete votos[parts[0]]; else votos[parts[0]] = m.data; }
        } else if (ev.type === 'patch' && parts.length === 0) Object.assign(votos, m.data || {});
        emit();
      };
      es.addEventListener('put', handler); es.addEventListener('patch', handler);
      es.onerror = () => { if (!abierto) { es.close(); polling(); } };
    } catch (e) { polling(); }
    return {
      demo: false,
      add(v) { return fetch(url, { method: 'POST', body: JSON.stringify(v) }); },
      reset() { return fetch(url, { method: 'DELETE' }).then(() => { votos = {}; emit(); }); },
      close() { cerrado = true; if (es) es.close(); if (timer) clearInterval(timer); }
    };
  }

  function resumen(banco, votos) {
    const qs = banco.preguntas;
    const cuentas = qs.map(q => q.opts.map(() => 0));
    let aciertos = 0, evaluables = 0, conf = [], n = votos.length;
    votos.forEach(v => (v.r || []).forEach((r, i) => {
      if (!qs[i] || r === null || r === undefined || r < 0) return;
      cuentas[i][r] = (cuentas[i][r] || 0) + 1;
      if (qs[i].tipo === 'confianza') conf.push(r + 1);
      else if (qs[i].ok !== null && qs[i].ok !== undefined) { evaluables++; if (r === qs[i].ok) aciertos++; }
    }));
    return { n, cuentas, pctAcierto: evaluables ? 100 * aciertos / evaluables : null, confianza: conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : null };
  }

  const widgets = [];
  function sesionActual(p) { return limpiaSesion(ls('cse_sesion_' + p) || hoy()); }

  function montar(el) {
    const p = el.dataset.p, b = el.dataset.b;
    const banco = (window.CSE_PREGUNTAS[p] || {})[b];
    if (!banco) { el.innerHTML = '<p>No hay preguntas definidas para ' + p + ' / ' + b + '.</p>'; return; }
    el.classList.add('poll');
    let qi = 0, sub = null, subIni = null, ultimos = [], resIni = null, armadoReset = false;

    el.innerHTML = `
      <div class="qrbox">
        <div class="qr" title="Pulsa para ampliar" style="cursor:zoom-in"></div>
        <div class="url"></div>
        <div class="count">0<small>respuestas</small></div>
        <span class="estado"></span>
        <div class="sesion">Sesión / grupo: <input type="text" aria-label="Nombre de la sesión"></div>
      </div>
      <div class="res">
        <div class="qnav"></div>
        <div class="enun"></div>
        <div class="bars"></div>
        <div class="explica"></div>
        <div class="acciones">
          <button class="btn sm verde b-sol">Mostrar solución</button>
          <button class="btn sm sec b-prev">◀ Anterior</button>
          <button class="btn sm sec b-next">Siguiente ▶</button>
          <a class="btn sm sec b-abrir" target="_blank" rel="noopener">Abrir página de voto</a>
          <button class="btn sm sec b-demo">Simular 5 votos</button>
          <button class="btn sm sec b-reset">Reiniciar</button>
        </div>
        <div class="compara" hidden></div>
      </div>`;
    const $ = s => el.querySelector(s);
    const inp = $('.sesion input');

    banco.preguntas.forEach((q, i) => {
      const bt = document.createElement('button');
      bt.textContent = q.tipo === 'confianza' ? 'Confianza' : 'P' + (i + 1);
      bt.addEventListener('click', () => { qi = i; pintar(); });
      $('.qnav').appendChild(bt);
    });
    $('.b-sol').addEventListener('click', () => { el.classList.toggle('sol'); $('.b-sol').textContent = el.classList.contains('sol') ? 'Ocultar solución' : 'Mostrar solución'; });
    $('.b-prev').addEventListener('click', () => { qi = (qi - 1 + banco.preguntas.length) % banco.preguntas.length; pintar(); });
    $('.b-next').addEventListener('click', () => { qi = (qi + 1) % banco.preguntas.length; pintar(); });
    $('.b-demo').addEventListener('click', () => {
      for (let k = 0; k < 5; k++) sub.add({ r: banco.preguntas.map(q => {
        if (q.ok === null || q.ok === undefined) { const m = b === 'final' ? 3.6 : 2.3; return Math.max(0, Math.min(q.opts.length - 1, Math.round(m - 1 + (Math.random() - .5) * 2.4))); }
        const pAcierto = b === 'final' ? .78 : .45;
        return Math.random() < pAcierto ? q.ok : Math.floor(Math.random() * q.opts.length);
      }), t: Date.now(), demo: true });
    });
    $('.b-reset').addEventListener('click', () => {
      const bt = $('.b-reset');
      if (!armadoReset) { armadoReset = true; bt.textContent = '¿Seguro? Pulsa otra vez'; setTimeout(() => { armadoReset = false; bt.textContent = 'Reiniciar'; }, 3000); return; }
      armadoReset = false; bt.textContent = 'Reiniciar'; sub.reset();
    });
    $('.qr').addEventListener('click', () => {
      const d = document.createElement('div'); d.className = 'qr-full';
      d.innerHTML = `<div class="t">${banco.titulo}</div>${qrSVG(urlVoto(p, b, sesionActual(p)))}<div class="t" style="font-size:2.4vh;color:#6b6f86">Escanea con la cámara del móvil · pulsa para cerrar</div>`;
      d.addEventListener('click', () => d.remove()); document.body.appendChild(d);
    });
    inp.addEventListener('change', () => { ls('cse_sesion_' + p, limpiaSesion(inp.value)); widgets.filter(w => w.p === p).forEach(w => w.conectar()); });

    function estado(e) {
      const s = $('.estado'); s.className = 'estado ' + e;
      const local = location.protocol === 'file:' && !CFG.voteBaseURL;
      s.textContent = e === 'live' ? '● En directo' : e === 'demo' ? 'Modo demo (sin Firebase)' : 'Sin conexión con Firebase';
      if (local && e !== 'err') s.textContent += ' · el QR apunta a un archivo local';
      $('.b-demo').hidden = e !== 'demo';
    }

    function pintar() {
      const R = resumen(banco, ultimos);
      $('.count').firstChild.nodeValue = R.n;
      [...$('.qnav').children].forEach((x, i) => x.classList.toggle('on', i === qi));
      const q = banco.preguntas[qi];
      $('.enun').innerHTML = `<span style="color:var(--teal);font:800 .7em Archivo">${q.tipo === 'confianza' ? 'CONFIANZA' : 'PREGUNTA ' + (qi + 1)}</span><br>${q.q}`;
      const tot = R.cuentas[qi].reduce((a, c) => a + c, 0) || 0;
      $('.bars').innerHTML = q.opts.map((o, j) => {
        const c = R.cuentas[qi][j] || 0, pc = tot ? Math.round(100 * c / tot) : 0;
        return `<div class="bar ${j === q.ok ? 'correcta' : ''}"><div class="fill" style="width:${pc}%"></div>
          <div class="lab"><span class="l">${LETRAS[j]}</span>${o}</div><div class="pct">${pc}% · ${c}</div></div>`;
      }).join('');
      $('.explica').innerHTML = q.exp ? '<b>Solución:</b> ' + q.exp : (q.tipo === 'confianza' && R.confianza ? `Confianza media: <b>${R.confianza.toFixed(1)}</b> / 5` : '');
      if (b === 'final' && resIni) {
        const c = $('.compara'); c.hidden = false;
        const f = x => x === null ? '–' : Math.round(x) + '%', g = x => x === null ? '–' : x.toFixed(1);
        c.innerHTML = `Comparativa de la sesión · Aciertos medios: <b>${f(resIni.pctAcierto)}</b> al inicio → <b style="color:var(--teal)">${f(R.pctAcierto)}</b> al final &nbsp;·&nbsp; Confianza: <b>${g(resIni.confianza)}</b> → <b style="color:var(--teal)">${g(R.confianza)}</b>`;
      }
    }

    const w = {
      p, conectar() {
        const s = sesionActual(p); inp.value = s;
        const u = urlVoto(p, b, s);
        $('.qr').innerHTML = qrSVG(u); $('.url').textContent = u.replace(/^https?:\/\//, ''); $('.b-abrir').href = u;
        if (sub) sub.close(); if (subIni) subIni.close();
        sub = suscribir(`cse/${p}/${b}/${s}`, v => { ultimos = v; pintar(); }, estado);
        if (b === 'final' && (window.CSE_PREGUNTAS[p] || {}).inicial) {
          subIni = suscribir(`cse/${p}/inicial/${s}`, v => { resIni = resumen(window.CSE_PREGUNTAS[p].inicial, v); pintar(); }, () => {});
        }
      }
    };
    widgets.push(w); w.conectar();
  }

  function init() { document.querySelectorAll('.poll-widget').forEach(montar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
