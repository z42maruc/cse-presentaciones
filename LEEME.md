# Presentaciones interactivas CSE (Quarto + reveal.js, estilo EPSC)

Presentaciones de las prácticas de Circuitos y Sistemas Electrónicos que sustituyen a las de Genially.
Versión piloto: **Práctica 1 · Filtros pasivos**.

## 1. Abrir la presentación

- Haz doble clic en `P1_Filtros_pasivos.html`. Funciona **sin conexión**: tipografías, fórmulas y simuladores van incluidos.
- Pestañas superiores: saltan a cada sección. Teclado: flechas o barra espaciadora para avanzar, `F` pantalla completa, `Esc` vista general.
- La carpeta `P1_Filtros_pasivos_files` y la carpeta `assets` tienen que estar junto al archivo `.html`.

## 2. Estructura de la carpeta

| Archivo / carpeta | Para qué sirve |
|---|---|
| `P1_Filtros_pasivos.qmd` | Fuente de la presentación (texto en Markdown de Quarto). Es el archivo que se edita. |
| `P1_Filtros_pasivos.html` | Presentación generada. |
| `vota.html` | Página que abren los alumnos con el QR para votar desde el móvil. |
| `assets/config.js` | **Configuración de las votaciones** (Firebase y dirección pública). |
| `assets/preguntas.js` | Preguntas de las encuestas inicial y final de cada práctica. |
| `assets/epsc.scss` | Estilo EPSC (colores, tipografías, pestañas). |
| `assets/sims-*.js` | Simuladores interactivos. |
| `assets/img/` | Logotipos y mosaico corporativo. |

**Logo del departamento:** guarda el logotipo como `assets/img/logo-departamento.png` y aparecerá automáticamente en la portada, junto al de la EPSC.

## 3. Editar y volver a generar

1. Instala Quarto (gratuito): https://quarto.org/docs/get-started/
2. Edita `P1_Filtros_pasivos.qmd` (con RStudio, VS Code o el Bloc de notas).
3. En una terminal dentro de la carpeta: `quarto render P1_Filtros_pasivos.qmd`
   (o `quarto preview P1_Filtros_pasivos.qmd` para ver los cambios en directo).

Los simuladores se insertan con un bloque como este:

```
::: {data-sim="filterlab"}
:::
```

Disponibles en la P1: `fourier`, `impedancia`, `montaje`, `filterlab`, `logjuego`, `db`, `bode`, `scope`, `pwm`, `examen`.

## 4. Votaciones con QR y resultados en directo

Sin configurar nada, las encuestas funcionan en **modo demo** (botón "Simular 5 votos") para ensayar la clase.
Para que los alumnos voten de verdad hacen falta dos cosas, que se configuran **una sola vez para todas las prácticas**:

### 4.1. Crear la base de datos (Firebase, gratuito)

1. Entra en https://console.firebase.google.com con una cuenta de Google y pulsa **Crear proyecto** (por ejemplo, `cse-epsc`). Puedes desactivar Google Analytics.
2. En el menú **Compilación > Realtime Database**, pulsa **Crear base de datos**. Ubicación: **Bélgica (europe-west1)**. Empieza en **modo bloqueado**.
3. En la pestaña **Reglas**, pega estas reglas y pulsa **Publicar**:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "cse": {
      "$practica": { "$bloque": { "$sesion": {
        ".read": true,
        ".write": true,
        "$voto": { ".validate": "newData.hasChildren(['r', 't'])" }
      } } }
    }
  }
}
```

4. Copia la URL que aparece arriba en la pestaña **Datos** (algo como `https://cse-epsc-default-rtdb.europe-west1.firebasedatabase.app`) y pégala en `assets/config.js`, en `firebaseURL`.

Las respuestas son anónimas: sólo se guarda la opción elegida y la hora. El plan gratuito (Spark) sobra para varios grupos de clase.

### 4.2. Publicar la carpeta en internet

El QR tiene que llevar a una dirección que el móvil de los alumnos pueda abrir. Opciones:

- **GitHub Pages** (recomendado): crea un repositorio, sube el contenido de esta carpeta y activa *Settings > Pages*. La dirección será del tipo `https://usuario.github.io/cse-presentaciones/`.
- **Quarto Pub**: `quarto publish quarto-pub P1_Filtros_pasivos.qmd`.
- Un espacio web de la UCO, si dispones de él.

Pega esa dirección en `assets/config.js`, en `voteBaseURL`. Ya puedes proyectar la presentación desde tu ordenador o desde la web.

### 4.3. En clase

- Diapositiva **Encuesta**: los alumnos escanean el QR (pulsa sobre él para verlo a pantalla completa) y las barras se actualizan en directo.
- **Mostrar solución** resalta la respuesta correcta y la explicación. **Anterior / Siguiente** cambian de pregunta.
- **Sesión / grupo**: por defecto es la fecha del día. Escribe, por ejemplo, `2026-10-09-G1` para separar grupos. Las encuestas inicial y final de la misma sesión se comparan automáticamente (aciertos medios y confianza).
- **Reiniciar** borra las respuestas de esa sesión (pide confirmación con un segundo clic).

## 5. Contenido de la P1

Inicio · Encuesta inicial · Señales (tiempo y frecuencia, construcción de ondas con armónicos) · Filtros RC (impedancia del condensador, diferenciador, integrador, montaje y sondas) · Simulador de filtros (señales que pasan o no, audio y retos) · Bode (juego del eje logarítmico, calculadora de dB, Bode interactivo con tus medidas) · Osciloscopio virtual · Laboratorio (lista de comprobación, teórico frente a experimental, errores frecuentes) · Aplicaciones (filtros en informática, PWM de Arduino) · Examen (estructura y entrenador con enunciados reales 2021-2026) · Cierre (encuesta final, resumen, recursos).

Licencia: CC BY-NC-SA 4.0. Cristina Martínez Ruedas, Departamento de Ingeniería Electrónica y de Computadores, Universidad de Córdoba.
