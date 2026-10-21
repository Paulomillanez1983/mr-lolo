/* ==========================================================================
   MR. LOLO — "EL DESAFÍO" (Quiz v5)
   --------------------------------------------------------------------------
   Formato PlayQuiz: imagen grande, pregunta, 3 opciones, barra de tiempo,
   revelación con dato. Ruleta de temas, 3 modos, vidas y combo.

   Temas: fútbol, literatura, mundo, ciencia, arte e historia.
   Sin productos de la tienda. Contenido de cultura general.
   ========================================================================== */

import { FX } from './fx.js';
import { CATEGORIAS, PREGUNTAS, NIVELES } from './quiz-data.js';

const LETRAS = ['A', 'B', 'C'];

const CLAVE_PERFIL = 'mrlolo.quiz.perfil';

/* La dificultad no se elige: sale del historial del jugador.
   Nivel 1 = arranque · Nivel 4 = experto. */
function modoParaNivel(n) {
  const nivel = Math.max(1, Math.min(4, n));
  return {
    id: 'auto',
    nombre: `NIVEL ${nivel}`,
    nivel,
    tiempo: 16 - nivel * 2,          // 14 · 12 · 10 · 8 segundos
    mult: 1 + (nivel - 1) * 0.5,     // x1 · x1,5 · x2 · x2,5
    vidas: nivel >= 4 ? 2 : 3,
  };
}

function cargarPerfilJuego() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_PERFIL) || '{}');
    return {
      skill: Number.isFinite(guardado.skill) ? guardado.skill : 50,
      vistos: Array.isArray(guardado.vistos) ? guardado.vistos : [],
    };
  } catch {
    return { skill: 50, vistos: [] };
  }
}

function guardarPerfilJuego(perfil) {
  try { localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil)); } catch { /* sin storage */ }
}

const mezclar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function iniciarQuiz(opciones = {}) {
  const {
    sonar = () => {},
    vibrar = () => {},
    alTerminar = () => {},
    alSalir = () => {},
    record = 0,
  } = opciones;

  const raiz = document.createElement('div');
  raiz.className = 'quiz quiz--v5';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'El Desafío de Mr. LOLO');
  raiz.innerHTML = `
    <div class="quiz__fondo" aria-hidden="true"><span></span><span></span><span></span></div>

    <header class="quiz__top">
      <span class="quiz__brand">🧠 EL DESAFÍO</span>
      <div class="quiz__vidas" data-quiz="vidas" hidden></div>
      <div class="quiz__marcador" data-quiz="marcador" hidden><b data-quiz="puntos">0</b><small>PTS</small></div>
      <span class="quiz__racha" data-quiz="racha" hidden>🔥 x2</span>
      <button class="quiz__x" type="button" data-quiz="salir" aria-label="Salir">✕</button>
    </header>

    <section class="quiz__rueda" data-quiz="rueda">
      <span class="quiz__kicker">GIRÁ EL DESTINO</span>
      <h1>EL DESAFÍO</h1>
      <div class="quiz__wheel-wrap">
        <span class="quiz__pointer" aria-hidden="true">▼</span>
        <div class="quiz__wheel" data-quiz="wheel">
          ${CATEGORIAS.map((t, i) => `<span style="--a:${i * 60 + 30}deg"><i>${t.icono} ${t.nombre}</i></span>`).join('')}
          <b class="quiz__hub">MR<br>LOLO</b>
        </div>
        <button class="quiz__girar" type="button" data-quiz="girar">GIRAR</button>
      </div>
      <p class="quiz__rueda-msg" data-quiz="rueda-msg">6 temas · 5 preguntas · 2 vidas</p>
      <small class="quiz__credito">Imágenes: Wikimedia Commons</small>
    </section>

    <section class="quiz__modos" data-quiz="modos" hidden>
      <span class="quiz__kicker">TE TOCÓ</span>
      <h2 data-quiz="tema-nombre">FÚTBOL</h2>
      <p data-quiz="tema-desc">Mundiales, cracks y récords</p>
      <div class="quiz__modos-lista" data-quiz="modos-lista"></div>
      <button class="quiz__volver" type="button" data-quiz="girar-otra">↺ Girar de nuevo</button>
    </section>

    <section class="quiz__juego" data-quiz="juego" hidden>
      <div class="quiz__barra-ronda">
        <span data-quiz="ronda-nombre">FÚTBOL</span>
        <div class="quiz__pips" data-quiz="pips"></div>
        <em data-quiz="ronda-mult">x1</em>
      </div>
      <div class="quiz__escenario">
        <div class="quiz__imagen" data-quiz="imagen"></div>
        <span class="quiz__marca" data-quiz="marca">FÚTBOL</span>
      </div>
      <div class="quiz__panel">
        <h2 class="quiz__pregunta" data-quiz="pregunta">—</h2>
        <div class="quiz__opciones" data-quiz="opciones"></div>
        <div class="quiz__timer">
          <div class="quiz__barra"><u data-quiz="barra"></u></div>
          <span class="quiz__reloj" data-quiz="reloj">15s</span>
          <button class="quiz__comodin" type="button" data-quiz="cincuenta">50/50 <b>1</b></button>
        </div>
        <div class="quiz__feedback" data-quiz="feedback" aria-live="polite"></div>
      </div>
    </section>

    <div class="quiz__corte" data-quiz="corte" hidden>
      <span></span><span></span><span></span><span></span><span></span>
      <b data-quiz="corte-txt">FÚTBOL</b>
    </div>
  `;
  document.body.append(raiz);

  const buscar = (n) => raiz.querySelector(`[data-quiz="${n}"]`);
  const elRueda = buscar('rueda');
  const elWheel = buscar('wheel');
  const elGirar = buscar('girar');
  const elRuedaMsg = buscar('rueda-msg');
  const elModos = buscar('modos');
  const elTemaNombre = buscar('tema-nombre');
  const elTemaDesc = buscar('tema-desc');
  const elModosLista = buscar('modos-lista');
  const elJuego = buscar('juego');
  const elImagen = buscar('imagen');
  const elMarca = buscar('marca');
  const elPregunta = buscar('pregunta');
  const elOpciones = buscar('opciones');
  const elBarra = buscar('barra');
  const elReloj = buscar('reloj');
  const elPuntos = buscar('puntos');
  const elMarcador = buscar('marcador');
  const elRacha = buscar('racha');
  const elVidas = buscar('vidas');
  const elFeedback = buscar('feedback');
  const elPips = buscar('pips');
  const elRondaNombre = buscar('ronda-nombre');
  const elRondaMult = buscar('ronda-mult');
  const btnCincuenta = buscar('cincuenta');
  const elCorte = buscar('corte');
  const elCorteTxt = buscar('corte-txt');

  let tema = null;
  let nivelJugador = 2;
  let modo = modoParaNivel(2);
  let cola = [];
  let indice = 0;
  let puntos = 0;
  let aciertos = 0;
  let respondidas = 0;
  let racha = 0;
  let mejorRacha = 0;
  let vidas = 2;
  let comodin = 1;
  let usadoComodin = false;
  let restante = 15;
  let corriendo = false;
  let raf = 0;
  let ultimo = 0;
  let ultimoTick = 99;
  let bloqueado = true;
  let avanzar = null;
  let cerrado = false;
  let girando = false;

  /* --- Ruleta ------------------------------------------------------------ */
  function girar() {
    if (girando || cerrado) return;
    girando = true;
    elGirar.disabled = true;
    elRuedaMsg.textContent = 'Girando…';
    FX.sfx('whoosh');
    const elegido = Math.floor(Math.random() * CATEGORIAS.length);
    tema = CATEGORIAS[elegido];
    const centro = elegido * 60 + 30;
    const objetivo = 360 * 6 + (360 - centro);
    elWheel.style.transition = 'transform 3.2s cubic-bezier(.12,.72,.12,1)';
    elWheel.style.transform = `rotate(${objetivo}deg)`;
    sonar(220, 0.4, 'sawtooth');
    setTimeout(() => {
      if (cerrado) return;
      girando = false;
      mostrarModos();
    }, 3350);
  }

  function mostrarModos() {
    const perfil = cargarPerfilJuego();
    nivelJugador = 1 + Math.min(3, Math.floor(perfil.skill / 25));
    modo = modoParaNivel(nivelJugador);

    elRueda.hidden = true;
    elModos.hidden = false;
    elTemaNombre.textContent = tema.nombre;
    elTemaNombre.style.color = tema.color;
    elTemaDesc.textContent = `${tema.desc} · dificultad automática`;
    elModosLista.innerHTML = `
      <button type="button" class="quiz__modo" data-modo="auto" style="--c:${tema.color}">
        <b>NIVEL ${modo.nivel}</b>
        <small>${modo.tiempo}s por pregunta · ${modo.vidas} vidas · x${modo.mult}</small>
      </button>`;
    FX.sfx('moneda');
  }

  function elegirModo() {
    modo = modoParaNivel(nivelJugador);
    elModos.hidden = true;
    elCorte.hidden = false;
    elCorteTxt.textContent = `${tema.icono} ${tema.nombre}`;
    elCorteTxt.style.color = tema.color;
    FX.sfx('start');
    setTimeout(() => {
      elCorte.hidden = true;
      empezarJuego();
    }, 900);
  }

  /* --- Contenido --------------------------------------------------------- */
  function construirPreguntas(temaId) {
    const categoria = CATEGORIAS.find((c) => c.id === temaId);
    const perfil = cargarPerfilJuego();
    const recientes = new Set(perfil.vistos);

    const banco = (PREGUNTAS[temaId] || []).map((q, i) => ({
      ...q,
      sujeto: q.img,
      nivel: NIVELES[temaId]?.[i] || 2,
      tiempo: modo.tiempo,
    }));

    // Nunca dos preguntas con la misma imagen en la misma partida.
    let pool = banco.filter((q) => !recientes.has(q.sujeto));
    if (pool.length < 5) pool = banco;

    // Mezcla de niveles: dos del nivel actual, una de repaso y dos de desafío.
    const objetivos = [
      nivelJugador,
      nivelJugador,
      Math.min(4, nivelJugador + 1),
      Math.max(1, nivelJugador - 1),
      Math.min(4, nivelJugador + 1),
    ];
    const libres = [...pool];
    const elegidas = [];
    const usados = new Set();

    objetivos.forEach((objetivo) => {
      const candidatas = libres.filter((q) => !usados.has(q.sujeto));
      if (!candidatas.length) return;
      const delNivel = candidatas.filter((q) => q.nivel === objetivo);
      const grupo = delNivel.length ? delNivel : candidatas;
      const elegida = grupo[Math.floor(Math.random() * grupo.length)];
      elegidas.push(elegida);
      usados.add(elegida.sujeto);
    });

    // Si faltara alguna, completamos con sujetos distintos.
    mezclar(libres).forEach((q) => {
      if (elegidas.length >= 5 || usados.has(q.sujeto)) return;
      elegidas.push(q);
      usados.add(q.sujeto);
    });

    // La partida arranca fácil y sube: orden por dificultad.
    elegidas.sort((a, b) => a.nivel - b.nivel);

    return elegidas.slice(0, 5).map((q) => {
      const pares = mezclar(q.opciones.map((texto, i) => ({ texto, ok: i === q.correcta })));
      return {
        tema: categoria?.nombre || '',
        pregunta: q.pregunta,
        visual: { tipo: 'escena', img: q.img },
        opciones: pares.map((p) => p.texto),
        correctaIdx: pares.findIndex((p) => p.ok),
        dato: q.dato,
        sujeto: q.sujeto,
        nivel: q.nivel,
        tiempo: q.tiempo,
      };
    });
  }

  function empezarJuego() {
    cola = construirPreguntas(tema.id);
    indice = 0;
    puntos = 0;
    aciertos = 0;
    respondidas = 0;
    racha = 0;
    mejorRacha = 0;
    vidas = modo.vidas;
    comodin = 1;
    elJuego.hidden = false;
    elMarcador.hidden = false;
    elVidas.hidden = false;
    elPuntos.textContent = '0';
    elRacha.hidden = true;
    elRondaNombre.textContent = `${tema.nombre} · NV ${nivelJugador}`;
    elRondaMult.textContent = `x${modo.mult}`;
    actualizarVidas();
    actualizarComodin();
    mostrarPregunta();
  }

  function actualizarVidas() {
    elVidas.innerHTML = Array.from({ length: modo.vidas }, (_, i) => `<i class="${i < vidas ? 'on' : ''}">${i < vidas ? '♥' : '♡'}</i>`).join('');
  }

  function actualizarComodin() {
    btnCincuenta.querySelector('b').textContent = comodin;
    btnCincuenta.disabled = comodin <= 0 || usadoComodin || bloqueado;
  }

  /* --- Visual ------------------------------------------------------------ */
  function pintarVisual(q) {
    const v = q.visual;
    elImagen.innerHTML = '';
    elImagen.className = 'quiz__imagen quiz__imagen--escena';
    elImagen.style.background = '#080B16';

    const escena = document.createElement('div');
    escena.className = 'quiz__escena';

    const fondo = document.createElement('img');
    fondo.src = v.img;
    fondo.alt = '';
    fondo.className = 'quiz__escena-fondo';
    fondo.setAttribute('aria-hidden', 'true');

    const frente = document.createElement('img');
    frente.src = v.img;
    frente.alt = 'Imagen de la pregunta';
    frente.className = 'quiz__foto quiz__foto--escena';

    escena.append(fondo, frente);
    elImagen.append(escena);
  }

  /* --- Pregunta ---------------------------------------------------------- */
  function mostrarPregunta() {
    if (indice >= cola.length) {
      terminar();
      return;
    }
    bloqueado = false;
    usadoComodin = false;
    const q = cola[indice];

    elFeedback.className = 'quiz__feedback';
    elFeedback.innerHTML = '';
    elMarca.textContent = q.tema;
    elPregunta.textContent = q.pregunta;
    pintarVisual(q);

    elOpciones.innerHTML = q.opciones
      .map(
        (texto, i) => `
        <button class="quiz__opcion" type="button" data-opcion="${i}">
          <span class="quiz__letra">${LETRAS[i]}</span>
          <span class="quiz__texto">${esc(texto)}</span>
          <span class="quiz__luz" aria-hidden="true"></span>
        </button>`
      )
      .join('');

    elPips.innerHTML = cola.map((_, i) => `<i class="${i < indice ? 'hecha' : i === indice ? 'on' : ''}"></i>`).join('');

    restante = q.tiempo || modo.tiempo;
    ultimoTick = 99;
    pintarReloj();
    actualizarComodin();
    corriendo = true;
    ultimo = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(bucle);
  }

  function pintarReloj() {
    const total = cola[indice]?.tiempo || modo.tiempo;
    const proporcion = Math.max(0, Math.min(1, restante / total));
    elBarra.style.transform = `scaleX(${proporcion})`;
    elBarra.classList.toggle('quiz__barra--baja', proporcion < 0.3);
    elReloj.textContent = `${Math.max(0, Math.ceil(restante))}s`;
    elReloj.classList.toggle('quiz__reloj--baja', proporcion < 0.3);
  }

  function bucle(ahora) {
    if (cerrado) return;
    const dt = Math.min(0.08, (ahora - ultimo) / 1000 || 0.016);
    ultimo = ahora;
    if (corriendo && !document.hidden) {
      restante -= dt;
      pintarReloj();
      const seg = Math.ceil(restante);
      if (seg <= 3 && seg > 0 && seg !== ultimoTick) {
        ultimoTick = seg;
        sonar(520, 0.04, 'square');
      }
      if (restante <= 0) {
        responder(-1);
        return;
      }
    }
    raf = requestAnimationFrame(bucle);
  }

  function usarCincuenta() {
    if (comodin <= 0 || usadoComodin || bloqueado) return;
    const q = cola[indice];
    const malas = [...elOpciones.querySelectorAll('[data-opcion]')].filter(
      (b) => Number(b.dataset.opcion) !== q.correctaIdx && !b.disabled
    );
    if (!malas.length) return;
    const fuera = malas[Math.floor(Math.random() * malas.length)];
    fuera.classList.add('quiz__opcion--fuera');
    fuera.disabled = true;
    comodin -= 1;
    usadoComodin = true;
    sonar(660, 0.06);
    FX.sfx('moneda');
    actualizarComodin();
  }

  function responder(elegida) {
    if (bloqueado || cerrado) return;
    bloqueado = true;
    corriendo = false;
    cancelAnimationFrame(raf);

    const q = cola[indice];
    if (!q) return;
    const acierto = elegida === q.correctaIdx;
    let ganados = 0;

    elOpciones.querySelectorAll('[data-opcion]').forEach((b) => {
      const i = Number(b.dataset.opcion);
      b.disabled = true;
      if (i === q.correctaIdx) b.classList.add('quiz__opcion--ok');
      if (i === elegida && !acierto) b.classList.add('quiz__opcion--mal');
    });

    respondidas += 1;

    // El motor aprende: aciertos y velocidad suben el nivel; errores lo bajan.
    const perfil = cargarPerfilJuego();
    const velocidad = Math.max(0, restante) / (q.tiempo || modo.tiempo);
    perfil.skill = Math.max(0, Math.min(100, perfil.skill + (acierto ? (velocidad > 0.5 ? 8 : 6) : -6)));
    perfil.vistos = [q.sujeto, ...perfil.vistos.filter((s) => s !== q.sujeto)].slice(0, 12);
    guardarPerfilJuego(perfil);

    if (acierto) {
      aciertos += 1;
      racha += 1;
      mejorRacha = Math.max(mejorRacha, racha);
      const bonusVel = Math.round((Math.max(0, restante) / (q.tiempo || modo.tiempo)) * 60);
      const combo = Math.min(5, 1 + Math.floor(racha / 2));
      ganados = Math.round((100 + bonusVel) * modo.mult * combo);
      puntos += ganados;
      elPuntos.textContent = puntos;
      elPuntos.classList.remove('quiz__marcador--pop');
      void elPuntos.offsetWidth;
      elPuntos.classList.add('quiz__marcador--pop');
      elRacha.hidden = racha < 2;
      elRacha.textContent = `🔥 x${combo}`;
      sonar(880, 0.06);
      setTimeout(() => sonar(1180, 0.08), 80);
      vibrar(15);
      FX.sfx('acierto');
      FX.destello('0,255,136', 0.12);
      if (racha >= 3) FX.confeti(22, [tema.color, '#FFE600', '#FFFFFF']);
    } else {
      racha = 0;
      elRacha.hidden = true;
      sonar(180, 0.18, 'sawtooth');
      vibrar([40, 50]);
      FX.sfx('error');
      FX.destello('255,70,70', 0.22);
      FX.sacudir(raiz, 8);
      vidas = Math.max(0, vidas - 1);
      actualizarVidas();
    }

    const letra = LETRAS[q.correctaIdx];
    elFeedback.className = `quiz__feedback quiz__feedback--on ${acierto ? 'quiz__feedback--ok' : 'quiz__feedback--mal'}`;
    elFeedback.innerHTML = `
      <b>${acierto ? '¡CORRECTO!' : elegida === -1 ? '¡SE ACABÓ EL TIEMPO!' : '¡ERROR!'}</b>
      <span>${acierto ? `+${ganados} puntos` : `La correcta era ${letra}: <strong>${esc(q.opciones[q.correctaIdx])}</strong>`}</span>
      ${q.dato ? `<small>${esc(q.dato)}</small>` : ''}
    `;

    if (vidas <= 0) {
      setTimeout(() => { if (!cerrado) terminar(); }, 1500);
      return;
    }

    avanzar = setTimeout(() => {
      if (cerrado) return;
      indice += 1;
      mostrarPregunta();
    }, acierto ? 1300 : 2000);
  }

  function terminar() {
    corriendo = false;
    cancelAnimationFrame(raf);
    clearTimeout(avanzar);
    alTerminar(puntos, {
      aciertos,
      total: respondidas,
      mejorRacha,
      tema: tema?.nombre || '',
      modo: modo.nombre,
      record,
    });
  }

  /* --- Eventos ----------------------------------------------------------- */
  raiz.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-quiz]')?.dataset.quiz;
    if (accion === 'salir') { cerrar(); return; }
    if (accion === 'girar' || accion === 'girar-otra') {
      elModos.hidden = true;
      elRueda.hidden = false;
      elWheel.style.transition = 'none';
      elWheel.style.transform = 'rotate(0deg)';
      elRuedaMsg.textContent = '6 temas · 5 preguntas · 2 vidas';
      elGirar.disabled = false;
      setTimeout(girar, 60);
      return;
    }
    if (accion === 'cincuenta') { usarCincuenta(); return; }

    const modoBtn = e.target.closest('[data-modo]');
    if (modoBtn) { elegirModo(modoBtn.dataset.modo); return; }

    const opcion = e.target.closest('[data-opcion]');
    if (opcion && !bloqueado) responder(Number(opcion.dataset.opcion));
  });

  const alTeclear = (e) => {
    if (e.key === 'Escape') { cerrar(); return; }
    if (!elRueda.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); girar(); }
      return;
    }
    if (e.key === 'q') { usarCincuenta(); return; }
    const mapa = { a: 0, b: 1, c: 2, '1': 0, '2': 1, '3': 2 };
    const i = mapa[e.key.toLowerCase()];
    if (i !== undefined && !bloqueado) {
      e.preventDefault();
      responder(i);
    }
  };
  document.addEventListener('keydown', alTeclear);

  function cerrar() {
    cerrado = true;
    corriendo = false;
    cancelAnimationFrame(raf);
    clearTimeout(avanzar);
    document.removeEventListener('keydown', alTeclear);
    raiz.remove();
    alSalir();
  }

  return { cerrar, raiz, pausar: () => { corriendo = false; } };
}
