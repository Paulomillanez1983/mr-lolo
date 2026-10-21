/* ==========================================================================
   MR. LOLO — MEMORIA DE GOLOSINAS
   --------------------------------------------------------------------------
   Quinto juego. Encontrá los pares con la menor cantidad de intentos.
   Puntaje = 1000 − intentos − segundos, con bonus por racha.
   ========================================================================== */

const DULCES = ['🍬', '🍭', '🍫', '🍪', '🧁', '🍩', '🍿', '🍦', '🥨', '🍮'];
const PARES = 8;   // 16 cartas = 4×4

export function iniciarMemoria(opciones = {}) {
  const {
    sonar = () => {},
    vibrar = () => {},
    alTerminar = () => {},
    alSalir = () => {},
    record = 0,
  } = opciones;

  const raiz = document.createElement('div');
  raiz.className = 'mem';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'Memoria de golosinas');
  raiz.innerHTML = `
    <div class="mem__top">
      <span class="mem__brand">🧠 MEMORIA GOLOSA</span>
      <div class="mem__hud">
        <span>PARES <b data-mem="pares">0/${PARES}</b></span>
        <span>INTENTOS <b data-mem="intentos">0</b></span>
        <span>TIEMPO <b data-mem="tiempo">0s</b></span>
      </div>
      <button class="mem__x" type="button" data-mem="salir" aria-label="Salir">✕</button>
    </div>
    <div class="mem__stage">
      <div class="mem__tablero" data-mem="tablero"></div>
      <div class="mem__capa" data-mem="capa" hidden></div>
    </div>
    <p class="mem__tip">Tocá dos cartas. Si son iguales, quedan destapadas. Récord: ${record || 0}</p>
  `;
  document.body.append(raiz);

  const buscar = (n) => raiz.querySelector(`[data-mem="${n}"]`);
  const tablero = buscar('tablero');
  const capa = buscar('capa');
  const hudPares = buscar('pares');
  const hudIntentos = buscar('intentos');
  const hudTiempo = buscar('tiempo');

  let cartas = [];
  let primera = null;
  let segunda = null;
  let bloqueo = false;
  let intentos = 0;
  let pares = 0;
  let racha = 0;
  let mejorRacha = 0;
  let puntosExtra = 0;
  let inicio = 0;
  let reloj = 0;
  let terminado = false;

  function mezclar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function armar() {
    const elegidos = mezclar(DULCES).slice(0, PARES);
    const mazo = mezclar([...elegidos, ...elegidos]).map((emoji, i) => ({
      id: i,
      emoji,
      abierta: false,
      resuelta: false,
    }));
    cartas = mazo;
    tablero.innerHTML = mazo
      .map(
        (c) => `
        <button class="mem__carta" type="button" data-carta="${c.id}" aria-label="Carta">
          <span class="mem__cara mem__cara--atras">🍬</span>
          <span class="mem__cara mem__cara--frente">${c.emoji}</span>
        </button>`
      )
      .join('');
  }

  function pintarCarta(c) {
    const el = tablero.querySelector(`[data-carta="${c.id}"]`);
    if (!el) return;
    el.classList.toggle('mem__carta--abierta', c.abierta || c.resuelta);
    el.classList.toggle('mem__carta--ok', c.resuelta);
    el.setAttribute('aria-label', c.abierta || c.resuelta ? `Golosina ${c.emoji}` : 'Carta dada vuelta');
  }

  function actualizarHud() {
    hudPares.textContent = `${pares}/${PARES}`;
    hudIntentos.textContent = intentos;
    hudTiempo.textContent = `${Math.floor((Date.now() - inicio) / 1000) || 0}s`;
  }

  function arrancarReloj() {
    if (reloj) return;
    inicio = Date.now();
    reloj = setInterval(() => {
      if (!terminado) actualizarHud();
    }, 500);
  }

  function tocar(id) {
    if (bloqueo || terminado) return;
    const c = cartas.find((x) => x.id === id);
    if (!c || c.abierta || c.resuelta) return;

    arrancarReloj();
    c.abierta = true;
    pintarCarta(c);
    sonar(740, 0.05);

    if (!primera) {
      primera = c;
      return;
    }
    segunda = c;
    intentos += 1;
    actualizarHud();
    bloqueo = true;

    if (primera.emoji === segunda.emoji) {
      const a = primera;
      const b = segunda;
      setTimeout(() => {
        a.resuelta = true;
        b.resuelta = true;
        a.abierta = false;
        b.abierta = false;
        pintarCarta(a);
        pintarCarta(b);
        pares += 1;
        racha += 1;
        mejorRacha = Math.max(mejorRacha, racha);
        puntosExtra += 40 + racha * 15;
        primera = null;
        segunda = null;
        bloqueo = false;
        actualizarHud();
        sonar(980, 0.07);
        setTimeout(() => sonar(1320, 0.1), 90);
        vibrar(14);
        if (pares === PARES) ganar();
      }, 340);
    } else {
      racha = 0;
      sonar(240, 0.1);
      setTimeout(() => {
        primera.abierta = false;
        segunda.abierta = false;
        pintarCarta(primera);
        pintarCarta(segunda);
        primera = null;
        segunda = null;
        bloqueo = false;
      }, 720);
    }
  }

  function ganar() {
    terminado = true;
    clearInterval(reloj);
    const segundos = Math.max(1, Math.round((Date.now() - inicio) / 1000));
    const base = Math.max(120, 1000 - intentos * 28 - segundos * 8);
    const puntos = base + puntosExtra + mejorRacha * 25;
    sonar(880, 0.1);
    setTimeout(() => sonar(1180, 0.1), 120);
    setTimeout(() => sonar(1480, 0.18), 240);
    vibrar([30, 50, 30]);
    alTerminar(puntos, { intentos, segundos, pares, mejorRacha });
  }

  function dibujarCapa(html) {
    capa.hidden = false;
    capa.innerHTML = html;
  }

  tablero.addEventListener('click', (e) => {
    const b = e.target.closest('[data-carta]');
    if (b) tocar(Number(b.dataset.carta));
  });

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mem]');
    if (!b) return;
    const a = b.dataset.mem;
    if (a === 'salir' || a === 'salir-fin') cerrar();
    else if (a === 'otra') reiniciar();
  });

  function reiniciar() {
    terminado = false;
    primera = null;
    segunda = null;
    bloqueo = false;
    intentos = 0;
    pares = 0;
    racha = 0;
    mejorRacha = 0;
    puntosExtra = 0;
    inicio = 0;
    clearInterval(reloj);
    reloj = 0;
    capa.hidden = true;
    capa.innerHTML = '';
    armar();
    actualizarHud();
  }

  function cerrar() {
    terminado = true;
    clearInterval(reloj);
    raiz.remove();
    alSalir();
  }

  armar();
  actualizarHud();

  return { cerrar, raiz, reiniciar };
}
