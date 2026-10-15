/* ==========================================================================
   MR. LOLO — Tetris de golosinas
   --------------------------------------------------------------------------
   Segundo juego de la tienda. Se carga solo cuando alguien lo abre
   (import() dinámico), así no pesa en la primera visita.

   Tetris clásico: 7 piezas, tablero de 10×18, líneas que se completan y se
   borran, niveles y velocidad creciente. Cada pieza se dibuja como caramelo.
   ========================================================================== */

const COLUMNAS = 10;
const FILAS = 18;

/* Las 7 piezas clásicas. Girar = rotar la matriz. */
const PIEZAS = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
};

const NOMBRES = Object.keys(PIEZAS);

/* Colores de caramelo, tomados de la paleta de la tienda. */
const COLORES = {
  I: '#00B1EA',
  J: '#4C6FFF',
  L: '#FF9500',
  O: '#FFE600',
  S: '#00D96B',
  T: '#C24BFF',
  Z: '#FF4757',
};

const PUNTOS_LINEA = [0, 100, 300, 500, 800];

/* Puntos que suman las líneas `n` al nivel `nivel`. */
const puntaje = (n, nivel) => PUNTOS_LINEA[n] * nivel;

/* --------------------------------------------------------------------------
   Arranca una partida. Devuelve un objeto para cerrarla desde afuera.
   -------------------------------------------------------------------------- */
export function iniciarTetris(opciones = {}) {
  const {
    sonar = () => {},
    vibrar = () => {},
    alSalir = () => {},
    recordInicial = 0,
    alGuardarRecord = () => {},
    premio = {},
    atiende = 'la tienda',
  } = opciones;

  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Estructura -------------------------------------------------------- */
  const raiz = document.createElement('div');
  raiz.className = 'tet';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'Tetris de golosinas');
  raiz.innerHTML = `
    <div class="tet__top">
      <span class="tet__brand">🍬 TETRIS DE GOLOSINAS</span>
      <button class="tet__x" type="button" data-tet="salir" aria-label="Cerrar">✕</button>
    </div>
    <div class="tet__hud">
      <span>PUNTOS <b data-tet="puntos">0</b></span>
      <span>LÍNEAS <b data-tet="lineas">0</b></span>
      <span>NIVEL <b data-tet="nivel">1</b></span>
      <span>RÉCORD <b data-tet="record">${recordInicial}</b></span>
    </div>
    <div class="tet__stage">
      <div class="tet__marco">
        <canvas data-tet="lienzo"></canvas>
      </div>
      <div class="tet__lado">
        <span class="tet__lbl">SIGUE</span>
        <canvas data-tet="siguiente" width="96" height="96" aria-hidden="true"></canvas>
        <span class="tet__ayuda">← → mover<br>↑ girar<br>↓ bajar<br>espacio: soltar<br>P: pausa</span>
      </div>
      <div class="tet__over" data-tet="capa" hidden></div>
    </div>
    <div class="tet__pad">
      <button type="button" data-tet="izq" aria-label="Mover a la izquierda">◀</button>
      <button type="button" data-tet="rotar" aria-label="Girar">⟳</button>
      <button type="button" data-tet="der" aria-label="Mover a la derecha">▶</button>
      <button type="button" data-tet="soltar" aria-label="Soltar">⤓</button>
      <button type="button" data-tet="bajar" aria-label="Bajar">▼</button>
      <button type="button" data-tet="pausa" aria-label="Pausa">⏸</button>
    </div>
  `;
  document.body.append(raiz);

  const buscar = (nombre) => raiz.querySelector(`[data-tet="${nombre}"]`);
  const lienzo = buscar('lienzo');
  const ctx = lienzo.getContext('2d');
  const siguiente = buscar('siguiente');
  const ctxSig = siguiente.getContext('2d');
  const capa = buscar('capa');
  const hudPuntos = buscar('puntos');
  const hudLineas = buscar('lineas');
  const hudNivel = buscar('nivel');
  const hudRecord = buscar('record');

  /* --- Estado de la partida --------------------------------------------- */
  let tablero = [];        // FILAS × COLUMNAS, con el color de cada casillero
  let actual = null;       // { matriz, tipo, x, y }
  let proxima = null;
  let puntos = 0;
  let lineas = 0;
  let nivel = 1;
  let record = Number(recordInicial) || 0;
  let celda = 24;
  let caida = 0;           // acumulador en segundos hasta el próximo descenso
  let corriendo = false;
  let pausado = false;
  let terminado = false;
  let ultimo = 0;
  let raf = 0;

  const vaciar = () => Array.from({ length: FILAS }, () => new Array(COLUMNAS).fill(null));

  const velocidad = () => Math.max(0.09, 0.62 - (nivel - 1) * 0.055);

  /* --- Geometría --------------------------------------------------------- */
  function medir() {
    const marco = raiz.querySelector('.tet__marco');
    const escenario = raiz.querySelector('.tet__stage');
    const anchoDisponible = Math.min(marco.clientWidth || 300, 340);
    // El tablero también se limita por alto: si no, en pantallas bajas
    // (o el celular acostado) las 18 filas no entrarían.
    const altoDisponible = Math.max(150, (escenario?.clientHeight || 400) - 4);
    const porAncho = Math.floor(anchoDisponible / COLUMNAS);
    const porAlto = Math.floor(altoDisponible / FILAS);
    celda = Math.max(9, Math.min(porAncho, porAlto));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lienzo.width = COLUMNAS * celda * dpr;
    lienzo.height = FILAS * celda * dpr;
    lienzo.style.width = COLUMNAS * celda + 'px';
    lienzo.style.height = FILAS * celda + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* --- Piezas ------------------------------------------------------------ */
  function piezaAleatoria() {
    const tipo = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
    return { tipo, matriz: PIEZAS[tipo].map((f) => f.slice()) };
  }

  function girar(matriz) {
    const n = matriz.length;
    const salida = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let f = 0; f < n; f++) {
      for (let c = 0; c < n; c++) salida[c][n - 1 - f] = matriz[f][c];
    }
    return salida;
  }

  function choca(matriz, x, y) {
    for (let f = 0; f < matriz.length; f++) {
      for (let c = 0; c < matriz[f].length; c++) {
        if (!matriz[f][c]) continue;
        const cx = x + c;
        const cy = y + f;
        if (cx < 0 || cx >= COLUMNAS || cy >= FILAS) return true;
        if (cy >= 0 && tablero[cy][cx]) return true;
      }
    }
    return false;
  }

  function aparecer() {
    actual = { ...proxima, x: Math.floor((COLUMNAS - proxima.matriz.length) / 2), y: proxima.matriz[0][0] ? 0 : -1 };
    proxima = piezaAleatoria();
    dibujarSiguiente();
    if (choca(actual.matriz, actual.x, actual.y)) terminar();
  }

  /* --- Dibujo ------------------------------------------------------------ */
  function redondo(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function caramelo(c, px, py, tam, color, alfa = 1) {
    const m = Math.max(1, tam * 0.07);
    const x = px + m;
    const y = py + m;
    const w = tam - m * 2;
    const h = tam - m * 2;
    c.save();
    c.globalAlpha = alfa;

    c.fillStyle = color;
    redondo(c, x, y, w, h, tam * 0.26);
    c.fill();

    const g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,255,255,.42)');
    g.addColorStop(0.45, 'rgba(255,255,255,.06)');
    g.addColorStop(1, 'rgba(0,0,0,.22)');
    c.fillStyle = g;
    redondo(c, x, y, w, h, tam * 0.26);
    c.fill();

    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath();
    c.ellipse(x + w * 0.32, y + h * 0.28, w * 0.13, h * 0.09, -0.5, 0, 6.283);
    c.fill();

    c.restore();
  }

  function capaPieza(c, matriz, ox, oy, tipo, alfa = 1) {
    for (let f = 0; f < matriz.length; f++) {
      for (let col = 0; col < matriz[f].length; col++) {
        if (!matriz[f][col]) continue;
        const py = oy + f;
        if (py < 0) continue;
        caramelo(c, ox * celda + col * celda, py * celda, celda, COLORES[tipo], alfa);
      }
    }
  }

  /* Dónde va a caer la pieza: se dibuja translúcida. */
  function dibujarGuia(c) {
    if (!actual) return;
    let y = actual.y;
    while (!choca(actual.matriz, actual.x, y + 1)) y += 1;
    if (y !== actual.y) capaPieza(c, actual.matriz, actual.x, y, actual.tipo, 0.16);
  }

  function dibujar() {
    const ancho = COLUMNAS * celda;
    const alto = FILAS * celda;

    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = '#080C18';
    ctx.fillRect(0, 0, ancho, alto);

    // Cuadriculado suave
    ctx.strokeStyle = 'rgba(255,255,255,.045)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLUMNAS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * celda, 0);
      ctx.lineTo(c * celda, alto);
      ctx.stroke();
    }
    for (let f = 1; f < FILAS; f++) {
      ctx.beginPath();
      ctx.moveTo(0, f * celda);
      ctx.lineTo(ancho, f * celda);
      ctx.stroke();
    }

    for (let f = 0; f < FILAS; f++) {
      for (let c = 0; c < COLUMNAS; c++) {
        if (tablero[f][c]) caramelo(ctx, c * celda, f * celda, celda, tablero[f][c]);
      }
    }

    dibujarGuia(ctx);
    if (actual) capaPieza(ctx, actual.matriz, actual.x, actual.y, actual.tipo);
  }

  function dibujarSiguiente() {
    const w = siguiente.width;
    ctxSig.clearRect(0, 0, w, w);
    if (!proxima) return;
    const celdas = [];
    proxima.matriz.forEach((fila, f) => fila.forEach((v, c) => { if (v) celdas.push([f, c]); }));
    if (!celdas.length) return;
    const minF = Math.min(...celdas.map(([f]) => f));
    const maxF = Math.max(...celdas.map(([f]) => f));
    const minC = Math.min(...celdas.map(([, c]) => c));
    const maxC = Math.max(...celdas.map(([, c]) => c));
    const cols = maxC - minC + 1;
    const filas = maxF - minF + 1;
    const tam = Math.floor(Math.min(w / (cols + 0.6), w / (filas + 0.6)));
    const ox = Math.round((w - cols * tam) / 2 - minC * tam);
    const oy = Math.round((w - filas * tam) / 2 - minF * tam);
    capaPiezaCon(ctxSig, proxima.matriz, ox, oy, proxima.tipo, tam);
  }

  /* Igual que capaPieza pero con tamaño de celda propio (para el "sigue"). */
  function capaPiezaCon(c, matriz, ox, oy, tipo, tam) {
    const guardado = celda;
    celda = tam;
    capaPieza(c, matriz, ox / tam, oy / tam, tipo);
    celda = guardado;
  }

  /* --- HUD --------------------------------------------------------------- */
  function actualizarHud() {
    hudPuntos.textContent = puntos;
    hudLineas.textContent = lineas;
    hudNivel.textContent = nivel;
    hudRecord.textContent = record;
  }

  /* --- Jugadas ------------------------------------------------------------ */
  function fijar() {
    actual.matriz.forEach((fila, f) => {
      fila.forEach((v, c) => {
        if (!v) return;
        const cy = actual.y + f;
        if (cy >= 0) tablero[cy][actual.x + c] = COLORES[actual.tipo];
      });
    });

    let borradas = 0;
    for (let f = FILAS - 1; f >= 0; f--) {
      if (tablero[f].every(Boolean)) {
        tablero.splice(f, 1);
        tablero.unshift(new Array(COLUMNAS).fill(null));
        borradas += 1;
        f += 1;
      }
    }

    if (borradas) {
      puntos += puntaje(borradas, nivel);
      lineas += borradas;
      nivel = 1 + Math.floor(lineas / 8);
      sonar(borradas >= 4 ? 1320 : 880, borradas >= 4 ? 0.22 : 0.12);
      vibrar(borradas >= 4 ? 70 : 25);
    } else {
      sonar(180, 0.05, 'triangle');
    }
    actualizarHud();
    aparecer();
  }

  function mover(dx) {
    if (!corriendo || pausado || terminado || !actual) return;
    if (!choca(actual.matriz, actual.x + dx, actual.y)) {
      actual.x += dx;
      sonar(520, 0.03, 'triangle');
      dibujar();
    }
  }

  function girarActual() {
    if (!corriendo || pausado || terminado || !actual) return;
    const nueva = girar(actual.matriz);
    // Si al girar choca, se prueba correrla un poco a los costados.
    for (const desplazamiento of [0, -1, 1, -2, 2]) {
      if (!choca(nueva, actual.x + desplazamiento, actual.y)) {
        actual.matriz = nueva;
        actual.x += desplazamiento;
        sonar(700, 0.05, 'triangle');
        dibujar();
        return;
      }
    }
  }

  function paso(manual = false) {
    if (!actual) return;
    if (!choca(actual.matriz, actual.x, actual.y + 1)) {
      actual.y += 1;
      if (manual) puntos += 1;
      return true;
    }
    fijar();
    return false;
  }

  function soltar() {
    if (!corriendo || pausado || terminado || !actual) return;
    let celdas = 0;
    while (!choca(actual.matriz, actual.x, actual.y + 1)) {
      actual.y += 1;
      celdas += 1;
    }
    puntos += celdas * 2;
    sonar(320, 0.1);
    vibrar(15);
    fijar();
    dibujar();
  }

  function pausar(estadoPausa) {
    if (!corriendo || terminado) return;
    pausado = estadoPausa ?? !pausado;
    if (pausado) {
      capa.hidden = false;
      capa.innerHTML = `
        <p class="tet__titulo">PAUSA</p>
        <p class="tet__sub">Tomate un respiro 🍭</p>
        <div class="tet__over-acciones">
          <button class="btn btn--primary" type="button" data-tet="seguir">Seguir jugando</button>
        </div>`;
    } else {
      capa.hidden = true;
      capa.innerHTML = '';
      ultimo = performance.now();
    }
  }

  /* --- Fin de la partida -------------------------------------------------- */
  function terminar() {
    terminado = true;
    corriendo = false;
    cancelAnimationFrame(raf);

    const nuevoRecord = puntos > record;
    if (nuevoRecord) {
      record = puntos;
      hudRecord.textContent = record;
      alGuardarRecord(record);
    }
    if (puntos > 0) sonar(160, 0.3, 'sawtooth');
    vibrar(nuevoRecord ? [30, 60, 30] : 30);

    const meta = Number(premio?.caramelos) || 0;
    const gano = meta > 0 && puntos >= meta;
    const titulo = nuevoRecord ? '¡NUEVO RÉCORD! 🏆' : gano ? '¡GANASTE UN PREMIO! 🎁' : 'Se apilaron las golosinas 😅';

    capa.hidden = false;
    capa.innerHTML = `
      <p class="tet__titulo">${titulo}</p>
      <p class="tet__marca">${puntos}</p>
      <p class="tet__sub">
        ${lineas} línea${lineas === 1 ? '' : 's'} · nivel ${nivel}
        ${nuevoRecord ? '' : `· récord ${record}`}
      </p>
      ${meta > 0
        ? `<p class="tet__premio">${gano
            ? `¡Mostrale esta pantalla a ${atiende} para tu premio${premio?.texto ? ': ' + premio.texto : ''}!`
            : `Te faltaron ${meta - puntos} puntos para el premio${premio?.texto ? ' (' + premio.texto + ')' : ''}.`}</p>`
        : ''}
      <div class="tet__over-acciones">
        <button class="btn btn--primary" type="button" data-tet="otra">🔁 Jugar otra vez</button>
        <button class="btn btn--ghost" type="button" data-tet="salir">Salir</button>
      </div>`;
  }

  /* --- Ciclo ------------------------------------------------------------- */
  function bucle(ahora) {
    if (!corriendo || terminado) return;
    if (document.hidden) {
      ultimo = ahora;
      raf = requestAnimationFrame(bucle);
      return;
    }
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;

    if (!pausado) {
      caida += dt;
      if (caida >= velocidad()) {
        caida = 0;
        paso();
      }
      dibujar();
      if (puntos !== Number(hudPuntos.textContent)) actualizarHud();
    }
    raf = requestAnimationFrame(bucle);
  }

  function reiniciar() {
    tablero = vaciar();
    puntos = 0;
    lineas = 0;
    nivel = 1;
    caida = 0;
    terminado = false;
    pausado = false;
    capa.hidden = true;
    capa.innerHTML = '';
    medir();
    actualizarHud();
    proxima = piezaAleatoria();
    aparecer();
    actualizarHud();
    dibujar();
    ultimo = performance.now();
    corriendo = true;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(bucle);
  }

  function cerrar() {
    corriendo = false;
    terminado = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', alTeclear);
    window.removeEventListener('resize', medir);
    raiz.remove();
    alSalir();
  }

  /* --- Entradas ----------------------------------------------------------- */
  function alTeclear(e) {
    if (e.key === 'Escape') { cerrar(); return; }
    if (!corriendo) return;
    const teclas = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P'];
    if (!teclas.includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') mover(-1);
    else if (e.key === 'ArrowRight') mover(1);
    else if (e.key === 'ArrowDown') { if (paso(true)) actualizarHud(); dibujar(); }
    else if (e.key === 'ArrowUp') girarActual();
    else if (e.key === ' ') soltar();
    else pausar();
  }

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tet]');
    if (!b) return;
    const accion = b.dataset.tet;
    if (accion === 'salir') cerrar();
    else if (accion === 'izq') mover(-1);
    else if (accion === 'der') mover(1);
    else if (accion === 'rotar') girarActual();
    else if (accion === 'bajar') { if (paso(true)) actualizarHud(); dibujar(); }
    else if (accion === 'soltar') soltar();
    else if (accion === 'pausa') pausar();
    else if (accion === 'seguir') pausar(false);
    else if (accion === 'otra') reiniciar();
  });

  document.addEventListener('keydown', alTeclear);
  window.addEventListener('resize', medir);

  /* --- Arranque ----------------------------------------------------------- */
  medir();
  reiniciar();

  return {
    cerrar,
    raiz,
    pausar: () => pausar(true),
    reiniciar,
  };
}
