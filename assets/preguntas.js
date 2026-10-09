/* Banco de preguntas de las votaciones con QR.
   Cada práctica tiene un bloque "inicial" (diagnóstico al empezar) y un bloque "final" (al terminar).
   ok: índice (empezando en 0) de la opción correcta; null si es una pregunta de opinión.
   tipo "confianza": escala 1-5 que se compara entre el inicio y el final. */
window.CSE_PREGUNTAS = window.CSE_PREGUNTAS || {};

window.CSE_PREGUNTAS.P1 = {
  titulo: "Práctica 1 · Filtros pasivos",
  inicial: {
    titulo: "¿Qué sabes ya? (antes de empezar)",
    preguntas: [
      { q: "Un condensador, a frecuencias muy altas, se comporta como…",
        opts: ["Un circuito abierto", "Un cortocircuito", "Una resistencia de valor R", "Una fuente de tensión"], ok: 1,
        exp: "Z<sub>C</sub> = 1/(jωC): si f crece, la impedancia tiende a 0 y el condensador &quot;deja pasar&quot; la señal como un cable." },
      { q: "Una señal de 1 kHz tiene un periodo de…",
        opts: ["1 s", "1 ms", "10 ms", "0,1 ms"], ok: 1,
        exp: "T = 1/f = 1/1000 Hz = 1 ms." },
      { q: "¿Qué instrumento muestra la señal en el dominio del tiempo?",
        opts: ["El osciloscopio", "El polímetro", "El analizador de espectros", "La fuente de alimentación"], ok: 0,
        exp: "El osciloscopio dibuja v(t). El analizador de espectros (o la FFT) muestra el dominio de la frecuencia." },
      { q: "Si la salida de un circuito es la mitad que la entrada, la ganancia en dB es…",
        opts: ["−3 dB", "−6 dB", "−20 dB", "+6 dB"], ok: 1,
        exp: "20·log<sub>10</sub>(0,5) ≈ −6 dB. Los −3 dB corresponden a 0,707." },
      { q: "Quieres eliminar un pitido agudo (10 kHz) de una grabación de voz. Usarías un filtro…",
        opts: ["Paso bajo", "Paso alto", "Ninguno: es imposible", "Da igual cuál"], ok: 0,
        exp: "La voz está por debajo de unos pocos kHz: un paso bajo deja pasar la voz y atenúa el pitido." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes con los filtros y el diagrama de Bode?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  },
  final: {
    titulo: "¿Qué has aprendido? (al terminar)",
    preguntas: [
      { q: "Con R = 56 kΩ y C = 10 nF, la frecuencia de corte teórica es…",
        opts: ["28 Hz", "284 Hz", "2,84 kHz", "1,78 kHz"], ok: 1,
        exp: "f<sub>o</sub> = 1/(2πRC) = 1/(2π·56·10³·10·10⁻⁹) ≈ 284 Hz." },
      { q: "Mides Ve = 2 V y Vs = 0,2 V. La ganancia experimental es…",
        opts: ["−10 dB", "−20 dB", "−6 dB", "−3 dB"], ok: 1,
        exp: "G = 0,2/2 = 0,1 → 20·log(0,1) = −20 dB." },
      { q: "En el integrador (paso bajo), a la frecuencia de corte la salida está…",
        opts: ["Adelantada 45°", "Retrasada 45°", "En fase", "Retrasada 90°"], ok: 1,
        exp: "θ = −arctg(f/f<sub>o</sub>) = −45° en f = f<sub>o</sub>: la salida va retrasada." },
      { q: "La frecuencia de corte EXPERIMENTAL se obtiene…",
        opts: ["Con fo = 1/(2πRC)", "Buscando la f a la que Vs = 0,707·Ve (o φ = ±45°)", "Midiendo R y C con el polímetro", "Con 20·log(R/C)"], ok: 1,
        exp: "La fórmula da el valor teórico. El experimental se busca midiendo en el osciloscopio." },
      { q: "Lejos de la frecuencia de corte, un filtro RC atenúa…",
        opts: ["3 dB por década", "6 dB por década", "20 dB por década", "40 dB por década"], ok: 2,
        exp: "Un filtro de primer orden cae 20 dB/década (6 dB/octava)." },
      { q: "Con onda cuadrada a fo/10, a la salida del diferenciador verás…",
        opts: ["Una onda triangular", "Picos en cada flanco", "La misma cuadrada", "Una senoidal"], ok: 1,
        exp: "El diferenciador responde a los cambios bruscos: aparecen picos que se descargan con τ = RC." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes ahora con los filtros y el diagrama de Bode?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  }
};
