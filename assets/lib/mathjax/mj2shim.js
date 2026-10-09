/* Puente: el plugin de reveal.js que usa Quarto espera la API de MathJax 2 (Hub.Config / Hub.Queue).
   Este archivo la imita y carga MathJax 3 local, para que las fórmulas funcionen también sin conexión. */
(function () {
  var base = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  var pendientes = [], listo = false;
  var hub = {
    Config: function () {},
    Queue: function (a) {
      var el = (a && a[2] && a[2].nodeType) ? a[2] : document.body;
      if (listo) window.MathJax.typesetPromise([el]).catch(function () {}); else pendientes.push(el);
    }
  };
  window.MathJax = {
    tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']], processEscapes: true },
    options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
    startup: {
      ready: function () {
        window.MathJax.startup.defaultReady();
        window.MathJax.Hub = hub;
        window.MathJax.startup.promise.then(function () {
          listo = true;
          pendientes.forEach(function (el) { window.MathJax.typesetPromise([el]).catch(function () {}); });
          pendientes = [];
          if (window.Reveal && window.Reveal.layout) window.Reveal.layout();
        });
      }
    },
    Hub: hub
  };
  var s = document.createElement('script'); s.src = base + 'tex-chtml.js'; s.async = true; document.head.appendChild(s);
})();
