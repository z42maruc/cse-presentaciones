/* =====================================================================
   CONFIGURACIÓN DE LAS VOTACIONES (editar sólo este archivo)
   ---------------------------------------------------------------------
   firebaseURL: URL de tu Realtime Database de Firebase (sin barra final).
                Ejemplo: "https://cse-epsc-default-rtdb.europe-west1.firebasedatabase.app"
                Si se deja vacía, las votaciones funcionan en MODO DEMO
                (puedes simular votos para probar la presentación).
   voteBaseURL: Dirección pública donde está publicada esta carpeta
                (GitHub Pages, Quarto Pub, servidor de la UCO...).
                Ejemplo: "https://cristina.github.io/cse-presentaciones/"
                Es la dirección que codifica el QR para que los alumnos voten
                desde el móvil. Si se deja vacía se usa la misma dirección
                desde la que se abre la presentación.
   ===================================================================== */
window.CSE_CONFIG = {
  firebaseURL: "https://cse-epsc-default-rtdb.europe-west1.firebasedatabase.app/",
  voteBaseURL: "",
  asignatura: "Circuitos y Sistemas Electrónicos",
  curso: "2026/2027"
};
