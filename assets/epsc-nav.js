/* Navegación por pestañas y elementos comunes de las presentaciones CSE (estilo EPSC)
   Cristina Martínez Ruedas · Dpto. Ingeniería Electrónica y de Computadores · UCO */
(function () {
  const BASE = (document.currentScript && document.currentScript.src.replace(/epsc-nav\.js.*$/, '')) || 'assets/';
  window.CSE_BASE = BASE;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function construirPortadillas() {
    document.querySelectorAll('.reveal .slides section.seccion').forEach((sec, i) => {
      if (sec.querySelector('.seccion-wrap')) return;
      const h1 = sec.querySelector('h1');
      const titulo = sec.dataset.titulo || (h1 ? h1.textContent : '');
      if (h1) h1.style.display = 'none';
      const stack = sec.parentElement;
      const items = [...stack.querySelectorAll(':scope > section.level2 h2')].map(h => { const c = h.cloneNode(true); c.querySelectorAll('.sub').forEach(x => x.remove()); return c.innerHTML.trim(); });
      const w = document.createElement('div');
      w.className = 'seccion-wrap';
      w.innerHTML = `<img class="tri" src="${BASE}img/mosaico-sup.png" alt="">
        <div class="num">${sec.dataset.num || ''}</div><h1>${titulo}</h1>
        <div class="desc">${sec.dataset.desc || ''}</div>
        <ul class="indice">${items.map(t => `<li>${t}</li>`).join('')}</ul>`;
      sec.prepend(w);
      sec.setAttribute('data-background-gradient', 'linear-gradient(120deg, #280091 0%, #4c5cc5 60%, #7a86d9 100%)');
    });
    document.querySelectorAll('.reveal .slides section.portada > h1').forEach(h => h.style.display = 'none');
  }

  function construirBarra(R) {
    const horiz = R.getHorizontalSlides();
    const bar = document.createElement('nav');
    bar.id = 'epsc-tabbar';
    bar.setAttribute('aria-label', 'Secciones de la presentación');
    bar.innerHTML = `<div class="brand"><img src="${BASE}img/logo-epsc.png" alt="EPSC"></div><div class="tabs" role="tablist"></div><div class="mosaic"><img src="${BASE}img/mosaico-sup.png" alt=""></div>`;
    const tabs = bar.querySelector('.tabs');
    horiz.forEach((h, i) => {
      const first = h.tagName === 'SECTION' && h.classList.contains('stack') ? h.querySelector('section') : h;
      const label = h.dataset.tab || first.dataset.tab || (first.querySelector('h1') || {}).textContent || ('Sección ' + i);
      const b = document.createElement('button');
      b.className = 'tab'; b.setAttribute('role', 'tab');
      b.innerHTML = `<span class="n">${i}</span>${label.trim()}`;
      b.addEventListener('click', () => R.slide(i, 0));
      tabs.appendChild(b);
    });
    document.body.appendChild(bar);

    const foot = document.createElement('div');
    foot.id = 'epsc-footer';
    foot.innerHTML = `<img src="${BASE}img/logo-uco.png" alt="UCO"> <span>${document.body.dataset.pie || document.title}</span>`;
    document.body.appendChild(foot);

    function marcar() {
      const ix = R.getIndices().h;
      [...tabs.children].forEach((b, i) => { b.classList.toggle('active', i === ix); b.setAttribute('aria-selected', i === ix); });
      const act = tabs.children[ix]; if (act) act.scrollIntoView({ block: 'nearest', inline: 'center' });
      document.body.classList.toggle('epsc-portada', ix === 0 && R.getIndices().v === 0);
    }
    R.on('slidechanged', marcar); marcar();
  }

  function interactividadComun() {
    // tarjetas que se giran
    document.querySelectorAll('.reveal .flip').forEach(f => {
      f.setAttribute('tabindex', '0');
      const t = () => f.classList.toggle('on');
      f.addEventListener('click', t);
      f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
    });
    // listas de comprobación
    document.querySelectorAll('.reveal ul.check').forEach((ul, n) => {
      const key = 'cse_check_' + location.pathname + '_' + n;
      let estado = {}; try { estado = JSON.parse(store(key) || '{}'); } catch (e) {}
      const barra = ul.previousElementSibling && ul.previousElementSibling.classList.contains('progreso') ? ul.previousElementSibling.firstElementChild : null;
      const lis = [...ul.querySelectorAll('li')];
      const upd = () => { const d = lis.filter(l => l.classList.contains('done')).length; if (barra) barra.style.width = (100 * d / lis.length) + '%'; };
      lis.forEach((li, i) => {
        if (!li.querySelector('.box')) li.innerHTML = `<span class="box"></span><span class="txt">${li.innerHTML}</span>`;
        if (estado[i]) li.classList.add('done');
        li.addEventListener('click', () => { li.classList.toggle('done'); estado[i] = li.classList.contains('done'); store(key, JSON.stringify(estado)); upd(); });
      });
      upd();
    });
    // botones "ir a"
    document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => {
      const [h, v] = b.dataset.goto.split(',').map(Number); window.Reveal.slide(h, v || 0);
    }));
  }

  function init() {
    const R = window.Reveal;
    R.configure({ navigationMode: 'linear' });
    construirPortadillas();
    R.sync();
    construirBarra(R);
    interactividadComun();
    document.dispatchEvent(new CustomEvent('cse:ready'));
  }

  function esperar() {
    if (window.Reveal && window.Reveal.isReady && window.Reveal.isReady()) init();
    else if (window.Reveal && window.Reveal.on) window.Reveal.on('ready', init);
    else setTimeout(esperar, 50);
  }
  esperar();
})();
