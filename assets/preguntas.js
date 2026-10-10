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

window.CSE_PREGUNTAS.P2 = {
  titulo: "Práctica 2 · El diodo",
  inicial: {
    titulo: "¿Qué sabes ya? (antes de empezar)",
    preguntas: [
      { q: "Un diodo deja pasar la corriente…",
        opts: ["En los dos sentidos por igual", "Sólo de ánodo a cátodo", "Sólo de cátodo a ánodo", "Sólo con corriente alterna"], ok: 1,
        exp: "Es la &quot;válvula antirretorno&quot; de la electrónica: conduce de ánodo a cátodo cuando V<sub>A</sub> − V<sub>K</sub> ≥ 0,7 V." },
      { q: "En el encapsulado de un diodo, la franja marca…",
        opts: ["El ánodo", "El cátodo", "La potencia máxima", "Que es un Zener"], ok: 1,
        exp: "La franja indica el cátodo, igual que la barra del símbolo." },
      { q: "¿A partir de qué tensión aproximada conduce un diodo de silicio?",
        opts: ["0,2 V", "0,7 V", "5,1 V", "12 V"], ok: 1,
        exp: "La tensión umbral del silicio es de unos 0,6 a 0,7 V." },
      { q: "En la curva característica de un componente, el eje vertical representa…",
        opts: ["El tiempo", "La tensión", "La corriente", "La potencia"], ok: 2,
        exp: "Eje X: tensión en el componente. Eje Y: corriente que lo atraviesa." },
      { q: "¿Cuál de estos dispositivos es un diodo?",
        opts: ["Un LED", "Un condensador", "Una bobina", "Un potenciómetro"], ok: 0,
        exp: "LED = Light Emitting Diode: un diodo que emite luz al conducir." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes con los diodos y su curva característica?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  },
  final: {
    titulo: "¿Qué has aprendido? (al terminar)",
    preguntas: [
      { q: "Con V = 5 V, R = 1 kΩ y un diodo en directa (Vγ = 0,7 V), la corriente es…",
        opts: ["5 mA", "4,3 mA", "0,7 mA", "0 mA"], ok: 1,
        exp: "I = (5 − 0,7)/1000 = 4,3 mA." },
      { q: "Un diodo 1N4007 tiene V<sub>D</sub> = −3 V. ¿Qué corriente circula?",
        opts: ["Prácticamente 0", "3 mA", "Muy grande: se destruye", "0,7 mA"], ok: 0,
        exp: "Está en inversa sin llegar a la ruptura (zona 3): bloquea." },
      { q: "Un Zener de 5,1 V en inversa, con 10 V y R = 1 kΩ. La tensión en la resistencia es…",
        opts: ["10 V", "5,1 V", "4,9 V", "0,7 V"], ok: 2,
        exp: "El Zener fija 5,1 V; el resto, 10 − 5,1 = 4,9 V, cae en la resistencia." },
      { q: "Con el polímetro en modo diodo lees OL en los dos sentidos. El diodo está…",
        opts: ["Bien", "En cortocircuito", "Abierto", "Al revés"], ok: 2,
        exp: "Si nunca conduce, está abierto. Un diodo bueno da 0,5-0,7 V en directa y OL en inversa." },
      { q: "En modo XY ves la curva del diodo &quot;al revés&quot;. ¿Qué te falta?",
        opts: ["Cambiar la base de tiempos", "Invertir el canal 2", "Poner acoplamiento AC", "Subir la amplitud"], ok: 1,
        exp: "CH2 mide −V<sub>R</sub> porque la masa está entre el diodo y la resistencia: hay que invertir el canal." },
      { q: "¿Para qué se usa un diodo Zener?",
        opts: ["Para rectificar a alta frecuencia", "Para fijar una tensión de referencia", "Para emitir luz", "Para almacenar carga"], ok: 1,
        exp: "En ruptura mantiene V<sub>Z</sub> casi constante: referencias y reguladores sencillos." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes ahora con los diodos y su curva característica?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  }
};

window.CSE_PREGUNTAS.P3 = {
  titulo: "Práctica 3 · Rectificadores",
  inicial: {
    titulo: "¿Qué sabes ya? (antes de empezar)",
    preguntas: [
      { q: "La red eléctrica de un enchufe en España es…",
        opts: ["Continua de 230 V", "Alterna de 230 V y 50 Hz", "Alterna de 5 V", "Continua de 12 V"], ok: 1,
        exp: "Alterna de 230 V eficaces (unos 325 V de pico) y 50 Hz." },
      { q: "Los circuitos digitales de un ordenador necesitan…",
        opts: ["Tensión alterna", "Tensión continua", "Corriente de 50 Hz", "Da igual"], ok: 1,
        exp: "Necesitan continua (12 V, 5 V, 3,3 V…): por eso todo cargador rectifica y filtra." },
      { q: "¿Qué componente convierte la alterna en una tensión de un solo sentido?",
        opts: ["El condensador", "El transformador", "El diodo (rectificador)", "La resistencia"], ok: 2,
        exp: "Los diodos sólo dejan pasar la corriente en un sentido: rectifican." },
      { q: "El valor que mide el polímetro en la escala DC es…",
        opts: ["El valor de pico", "El valor medio", "El valor eficaz", "El valor pico a pico"], ok: 1,
        exp: "En DC el polímetro mide la componente continua: el valor medio." },
      { q: "¿Para qué sirve el transformador de una fuente de alimentación?",
        opts: ["Para rectificar", "Para reducir la tensión", "Para filtrar", "Para aumentar la frecuencia"], ok: 1,
        exp: "Reduce los 230 V de la red a una tensión más baja (por ejemplo, 12 V)." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes con los rectificadores y las fuentes de alimentación?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  },
  final: {
    titulo: "¿Qué has aprendido? (al terminar)",
    preguntas: [
      { q: "Para 10 V de pico, el valor medio ideal de un rectificador de media onda es…",
        opts: ["10 V", "6,37 V", "3,18 V", "5 V"], ok: 2,
        exp: "V<sub>med</sub> = V<sub>max</sub>/π = 10/π ≈ 3,18 V." },
      { q: "En un puente de Graetz, ¿cuántos diodos conducen a la vez?",
        opts: ["1", "2", "3", "4"], ok: 1,
        exp: "Dos en serie en cada semiciclo: la caída es de unos 2·0,7 = 1,4 V." },
      { q: "¿Por qué el rizado de un puente tiene el doble de frecuencia que la red?",
        opts: ["Porque usa cuatro diodos", "Porque aprovecha los dos semiciclos", "Por el condensador", "Por el transformador"], ok: 1,
        exp: "Hay dos picos por periodo: 100 Hz con una red de 50 Hz." },
      { q: "Si aumentas el condensador del filtro, el rizado…",
        opts: ["Aumenta", "Disminuye", "No cambia", "Se duplica la frecuencia"], ok: 1,
        exp: "V<sub>r</sub> ≈ I<sub>med</sub>/(2fC): cuanto mayor es C, menor es el rizado." },
      { q: "En el puente, la masa del osciloscopio en un punto equivocado…",
        opts: ["No pasa nada", "Cortocircuita un diodo o el generador", "Mejora la medida", "Sólo cambia la escala"], ok: 1,
        exp: "Las masas del generador y del osciloscopio están unidas por tierra: usa CH1 − CH2 o una fuente aislada." },
      { q: "Una resistencia de 1 kΩ con V<sub>rms</sub> = 5 V disipa…",
        opts: ["5 mW", "25 mW", "250 mW", "5 W"], ok: 1,
        exp: "P = V<sub>rms</sub>²/R = 25/1000 = 25 mW." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes ahora con los rectificadores y las fuentes de alimentación?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  }
};

window.CSE_PREGUNTAS.P4 = {
  titulo: "Práctica 4 · Transistor bipolar I",
  inicial: {
    titulo: "¿Qué sabes ya? (antes de empezar)",
    preguntas: [
      { q: "¿Cuántos terminales tiene un transistor bipolar?",
        opts: ["Dos", "Tres", "Cuatro", "Depende del modelo"], ok: 1,
        exp: "Base (B), colector (C) y emisor (E)." },
      { q: "La idea fundamental del transistor es que…",
        opts: ["Almacena carga", "Una corriente pequeña en la base controla una mucho mayor", "Deja pasar la corriente en un solo sentido", "Mantiene la tensión constante"], ok: 1,
        exp: "I<sub>C</sub> = β·I<sub>B</sub>: por eso sirve de interruptor y de amplificador." },
      { q: "Un procesador moderno usa los transistores sobre todo como…",
        opts: ["Amplificadores de audio", "Interruptores (0 y 1)", "Resistencias", "Condensadores"], ok: 1,
        exp: "Miles de millones de transistores conmutando entre corte y conducción." },
      { q: "En el símbolo del transistor, la flecha está en…",
        opts: ["La base", "El colector", "El emisor", "No tiene flecha"], ok: 2,
        exp: "La flecha está siempre en el emisor y apunta en el sentido de la corriente." },
      { q: "Si la ganancia β = 100 e I<sub>B</sub> = 0,1 mA, en zona activa I<sub>C</sub> vale…",
        opts: ["0,1 mA", "1 mA", "10 mA", "100 mA"], ok: 2,
        exp: "I<sub>C</sub> = β·I<sub>B</sub> = 100·0,1 mA = 10 mA." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes con el transistor y sus zonas de trabajo?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  },
  final: {
    titulo: "¿Qué has aprendido? (al terminar)",
    preguntas: [
      { q: "Con V<sub>CC</sub> = 10 V y R<sub>L</sub> = 1 kΩ, los extremos de la recta de carga son…",
        opts: ["(10 V; 0) y (0; 10 mA)", "(10 V; 10 mA) y (0; 0)", "(0,7 V; 0) y (10 V; 10 mA)", "(5 V; 5 mA)"], ok: 0,
        exp: "Corte con el eje V<sub>CE</sub>: (V<sub>CC</sub>; 0). Con el eje I<sub>C</sub>: (0; V<sub>CC</sub>/R<sub>L</sub>)." },
      { q: "Con V<sub>BB</sub> = 0,5 V el transistor está en…",
        opts: ["Corte", "Activa", "Saturación", "Ruptura"], ok: 0,
        exp: "No se supera la tensión de la unión base-emisor (0,7 V): I<sub>B</sub> = 0." },
      { q: "En saturación, V<sub>CE</sub> vale aproximadamente…",
        opts: ["V<sub>CC</sub>", "V<sub>CC</sub>/2", "0,2 V", "0,7 V"], ok: 2,
        exp: "Se comporta como un interruptor cerrado con una pequeña caída de unos 0,2 V." },
      { q: "¿Dónde disipa más potencia el transistor?",
        opts: ["En corte", "En saturación", "En el centro de la recta de carga (activa)", "Igual en todas"], ok: 2,
        exp: "P<sub>T</sub> = V<sub>CE</sub>·I<sub>C</sub> es máxima en V<sub>CE</sub> = V<sub>CC</sub>/2." },
      { q: "Con la punta roja fija obtienes dos lecturas bajas. Has encontrado…",
        opts: ["El emisor de un pnp", "La base de un npn", "El colector de un npn", "Un transistor averiado"], ok: 1,
        exp: "Las dos uniones conducen desde la base: base de un npn." },
      { q: "¿Qué cambia al aumentar R<sub>B</sub>?",
        opts: ["La recta de carga", "La corriente de base (Q baja hacia corte)", "V<sub>CC</sub>", "β"], ok: 1,
        exp: "La malla de entrada fija I<sub>B</sub>; la recta de carga sólo depende de V<sub>CC</sub> y R<sub>L</sub>." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes ahora con el transistor y sus zonas de trabajo?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  }
};

window.CSE_PREGUNTAS.P5 = {
  titulo: "Práctica 5 · Transistor bipolar II",
  inicial: {
    titulo: "¿Qué sabes ya? (antes de empezar)",
    preguntas: [
      { q: "El punto de trabajo Q de un transistor es…",
        opts: ["El valor de β", "El par (V<sub>CE</sub>, I<sub>C</sub>) sin señal", "La tensión de la fuente", "La potencia máxima"], ok: 1,
        exp: "Q es el punto de la recta de carga en el que trabaja el transistor en ausencia de señal." },
      { q: "Para amplificar, el transistor debe estar en…",
        opts: ["Corte", "Zona activa", "Saturación", "Da igual"], ok: 1,
        exp: "En activa I<sub>C</sub> = β·I<sub>B</sub>: la salida sigue a la entrada." },
      { q: "La β de un transistor…",
        opts: ["Es exactamente igual en todos los del mismo modelo", "Cambia de un transistor a otro y con la temperatura", "Sólo depende de V<sub>CC</sub>", "Vale siempre 100"], ok: 1,
        exp: "Tiene mucha dispersión y aumenta con la temperatura: por eso hace falta una buena polarización." },
      { q: "¿Qué ocurre si Q está muy cerca de saturación y llega una señal?",
        opts: ["Nada", "La salida se recorta", "Aumenta la ganancia", "El transistor se apaga"], ok: 1,
        exp: "Una parte de la señal lleva el transistor a saturación y la salida queda recortada." },
      { q: "Polarizar un transistor significa…",
        opts: ["Conectarlo al revés", "Fijar su punto de trabajo con tensiones continuas", "Medir su β", "Calentarlo"], ok: 1,
        exp: "Con una fuente y una red de resistencias se fija el punto Q de origen." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes con la polarización del transistor?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  },
  final: {
    titulo: "¿Qué has aprendido? (al terminar)",
    preguntas: [
      { q: "¿Qué montaje es prácticamente independiente de β?",
        opts: ["Polarización fija", "Fija con R. de emisor", "Realimentación de colector", "Divisor de tensión"], ok: 3,
        exp: "V<sub>B</sub> la fijan R<sub>1</sub> y R<sub>2</sub> y R<sub>E</sub> corrige: si β se duplica, I<sub>C</sub> apenas sube un 6 %." },
      { q: "Si β se duplica en la polarización fija, I<sub>C</sub>…",
        opts: ["No cambia", "Sube un 6 %", "Se duplica (y puede saturar)", "Baja a la mitad"], ok: 2,
        exp: "I<sub>C</sub> = β·I<sub>B</sub> con I<sub>B</sub> fija: depende totalmente de β." },
      { q: "¿Qué montaje no puede llegar a saturación?",
        opts: ["Fija", "Realimentación de colector", "Divisor de tensión", "Fija con R. de emisor"], ok: 1,
        exp: "Aunque R<sub>B</sub> = 0, V<sub>CE</sub> = V<sub>BE</sub> ≈ 0,7 V." },
      { q: "En el divisor, ¿por qué se hace circular por R<sub>1</sub> unas 10 veces I<sub>B</sub>?",
        opts: ["Para ahorrar energía", "Para que V<sub>B</sub> apenas dependa de I<sub>B</sub> (ni de β)", "Para saturar", "Para aumentar la ganancia"], ok: 1,
        exp: "Así el divisor se comporta casi como una fuente de tensión fija." },
      { q: "Con V<sub>CC</sub> = 15 V, V<sub>C</sub> = 7 V e I<sub>C</sub> = 9,75 mA, R<sub>C</sub> vale…",
        opts: ["≈ 820 Ω", "≈ 1,5 kΩ", "≈ 220 Ω", "≈ 7 kΩ"], ok: 0,
        exp: "R<sub>C</sub> = (15 − 7)/9,75 mA ≈ 820 Ω." },
      { q: "¿Por qué la polarización fija se usa sobre todo en conmutación?",
        opts: ["Porque es muy estable", "Porque en corte y saturación da igual que Q dependa de β", "Porque no necesita resistencias", "Porque amplifica más"], ok: 1,
        exp: "Como interruptor sólo importa estar bien en corte o bien en saturación." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes ahora con la polarización del transistor?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  }
};

window.CSE_PREGUNTAS.P6 = {
  titulo: "Práctica 6 · Amplificador operacional",
  inicial: {
    titulo: "¿Qué sabes ya? (antes de empezar)",
    preguntas: [
      { q: "Un amplificador operacional se comercializa como…",
        opts: ["Un transistor suelto", "Un circuito integrado", "Una resistencia variable", "Un condensador"], ok: 1,
        exp: "Es un circuito integrado (en la práctica, el LM741 de 8 patillas)." },
      { q: "La ganancia en lazo abierto de un operacional es…",
        opts: ["Exactamente 1", "Unas 10 veces", "Muy grande (≈ 200 000)", "Negativa"], ok: 2,
        exp: "Idealmente infinita; en el 741, unas 200 000 veces." },
      { q: "El LM741 de la práctica se alimenta con…",
        opts: ["+5 V sólo", "±15 V (fuente simétrica)", "230 V", "Una pila de 1,5 V"], ok: 1,
        exp: "Necesita +15 V, 0 V y −15 V: la fuente en modo serie con el punto medio a masa." },
      { q: "Si una señal se amplifica ×10 e invierte su signo, la ganancia es…",
        opts: ["10", "−10", "0,1", "20 dB positivos y fase 0°"], ok: 1,
        exp: "Ganancia negativa: misma forma, 10 veces mayor y desfasada 180°." },
      { q: "¿Qué ocurre si la salida de un amplificador debería superar la alimentación?",
        opts: ["Sigue subiendo", "Se recorta (satura)", "Se invierte", "Cambia de frecuencia"], ok: 1,
        exp: "No puede superar ≈ 90 % de la alimentación: la señal se recorta." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes con el amplificador operacional?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  },
  final: {
    titulo: "¿Qué has aprendido? (al terminar)",
    preguntas: [
      { q: "La ganancia de un inversor con R₁ = 1 kΩ y R₂ = 10 kΩ es…",
        opts: ["10", "−10", "11", "−11"], ok: 1,
        exp: "A<sub>v</sub> = −R₂/R₁ = −10." },
      { q: "Para un no inversor con A<sub>v</sub> = 23 usarías…",
        opts: ["R₁ = 1 kΩ, R₂ = 22 kΩ", "R₁ = 22 kΩ, R₂ = 1 kΩ", "R₁ = 1 kΩ, R₂ = 23 kΩ", "R₁ = 10 kΩ, R₂ = 22 kΩ"], ok: 0,
        exp: "A<sub>v</sub> = 1 + R₂/R₁ = 1 + 22 = 23." },
      { q: "En un inversor que funciona bien, la entrada inversora está a…",
        opts: ["V<sub>e</sub>", "≈ 0 V (masa virtual)", "+15 V", "V<sub>s</sub>"], ok: 1,
        exp: "Cortocircuito virtual: V<sub>−</sub> ≈ V<sub>+</sub> = 0." },
      { q: "Si quitas la resistencia de realimentación…",
        opts: ["La ganancia vale 1", "La salida satura (casi cuadrada)", "No cambia nada", "La salida se anula"], ok: 1,
        exp: "En lazo abierto la enorme ganancia satura la salida a ±V<sub>sat</sub>." },
      { q: "¿Para qué sirve un seguidor de tensión (A<sub>v</sub> = 1)?",
        opts: ["Para nada", "Para adaptar impedancias sin cargar la fuente", "Para invertir la señal", "Para rectificar"], ok: 1,
        exp: "Entrada de impedancia muy alta y salida muy baja: conecta un sensor débil a una carga." },
      { q: "Con un 741 (GBW ≈ 1 MHz) y A<sub>v</sub> = 10, la ganancia empieza a caer hacia…",
        opts: ["1 kHz", "10 kHz", "100 kHz", "10 MHz"], ok: 2,
        exp: "f<sub>c</sub> ≈ GBW/A<sub>v</sub> = 1 MHz/10 = 100 kHz." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes ahora con el amplificador operacional?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  }
};

window.CSE_PREGUNTAS.P0 = {
  titulo: "Práctica 0 · Manejo de equipos",
  inicial: {
    titulo: "¿Qué sabes ya? (antes de empezar)",
    preguntas: [
      { q: "Para medir una tensión, el voltímetro se conecta…",
        opts: ["En serie", "En paralelo", "Fuera del circuito", "Da igual"], ok: 1,
        exp: "La tensión es una diferencia entre dos puntos: el voltímetro va en paralelo." },
      { q: "Una señal de 50 Hz tiene un periodo de…",
        opts: ["50 s", "20 ms", "2 ms", "0,5 s"], ok: 1,
        exp: "T = 1/f = 1/50 = 0,02 s = 20 ms." },
      { q: "La red eléctrica es de 230 V. Ese valor es…",
        opts: ["El valor de pico", "El valor eficaz", "El valor pico a pico", "El valor medio"], ok: 1,
        exp: "Es el eficaz; el de pico es 230·√2 ≈ 325 V." },
      { q: "Una resistencia de 2,2 kΩ con 5 V: ¿qué corriente circula?",
        opts: ["11 mA", "2,27 mA", "0,44 mA", "5 A"], ok: 1,
        exp: "Ley de Ohm: I = V/R = 5/2200 ≈ 2,27 mA." },
      { q: "¿Qué instrumento dibuja la tensión frente al tiempo?",
        opts: ["El polímetro", "La fuente", "El osciloscopio", "El generador"], ok: 2,
        exp: "El osciloscopio representa la tensión de la sonda respecto a su masa frente al tiempo." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes manejando los equipos del laboratorio?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  },
  final: {
    titulo: "¿Qué has aprendido? (al terminar)",
    preguntas: [
      { q: "Con 0,5 V/div, una senoidal ocupa 6 divisiones de pico a pico. Su amplitud es…",
        opts: ["3 V", "1,5 V", "6 V", "0,75 V"], ok: 1,
        exp: "V<sub>pp</sub> = 6 × 0,5 = 3 V; V<sub>p</sub> = 1,5 V." },
      { q: "Un periodo ocupa 4 divisiones con 0,2 ms/div. La frecuencia es…",
        opts: ["250 Hz", "1,25 kHz", "800 Hz", "5 kHz"], ok: 1,
        exp: "T = 0,8 ms ⇒ f = 1,25 kHz." },
      { q: "Las pinzas de masa de las dos sondas deben ir…",
        opts: ["En puntos distintos", "Al mismo punto", "Sin conectar", "A +15 V"], ok: 1,
        exp: "Están unidas internamente: en puntos distintos provocarías un cortocircuito." },
      { q: "Para ver un rizado de 50 mV sobre 12 V continuos, el acoplamiento debe ser…",
        opts: ["DC", "AC", "GND", "XY"], ok: 1,
        exp: "AC quita la continua y permite ampliar el rizado con una escala de 10-20 mV/div." },
      { q: "Te piden 1 V de amplitud en el generador. ¿Qué introduces?",
        opts: ["1 Vpp", "2 Vpp", "0,5 Vpp", "1,41 Vpp"], ok: 1,
        exp: "El generador trabaja en Vpp: 1 V de pico son 2 Vpp (con la carga en High Z)." },
      { q: "La fuente muestra CC encendido y la tensión ha caído. ¿Qué pasa?",
        opts: ["Todo va bien", "Está limitando la corriente: hay un cortocircuito o el límite es bajo", "La fuente está estropeada", "Falta el offset"], ok: 1,
        exp: "CC = corriente constante: la fuente protege al circuito limitando la corriente." },
      { tipo: "confianza", q: "¿Cómo de seguro te sientes ahora manejando los equipos del laboratorio?",
        opts: ["1 · Nada", "2", "3", "4", "5 · Mucho"], ok: null }
    ]
  }
};
