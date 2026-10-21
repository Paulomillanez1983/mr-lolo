/* ==========================================================================
   MR. LOLO — QUIZ SHOW (v2)
   --------------------------------------------------------------------------
   Rehecho de cero. Formato de programa de TV:
     · Pantalla de inicio con reglas
     · 10 preguntas, 3 opciones (A/B/C) y 12 segundos por pregunta
     · La respuesta correcta se calcula por ÍNDICE, no por texto
     · Revela la correcta, explica el dato y avanza solo
     · Puntaje: 100 base + bonus por velocidad + bonus por racha

   Las fotos reales de la tienda se usan como preguntas.
   ========================================================================== */

import { FX } from './fx.js';

const BANCO = [
  { emoji: '🦒', fondo: '#B45309', tema: 'ANIMALES', pregunta: '¿Qué animal tiene el cuello más largo?', correcta: 'Jirafa', otros: ['Cebra', 'Avestruz'], dato: 'La jirafa puede medir hasta 5,5 metros.' },
  { emoji: '🐘', fondo: '#475569', tema: 'ANIMALES', pregunta: '¿Cuál es el animal terrestre más grande?', correcta: 'Elefante', otros: ['Rinoceronte', 'Hipopótamo'], dato: 'El elefante africano pesa como 6 autos.' },
  { emoji: '🍫', fondo: '#78350F', tema: 'COMIDA', pregunta: '¿De qué planta sale el chocolate?', correcta: 'Cacao', otros: ['Café', 'Vainilla'], dato: 'Sale de las semillas del cacao.' },
  { emoji: '🌈', fondo: '#1D4ED8', tema: 'CIENCIA', pregunta: '¿Cuántos colores tiene el arcoíris?', correcta: '7', otros: ['5', '9'], dato: 'Rojo, naranja, amarillo, verde, celeste, azul y violeta.' },
  { emoji: '🕷️', fondo: '#1F2937', tema: 'ANIMALES', pregunta: '¿Cuántas patas tiene una araña?', correcta: '8', otros: ['6', '10'], dato: 'Los insectos tienen 6; las arañas, 8.' },
  { emoji: '🐙', fondo: '#7E22CE', tema: 'ANIMALES', pregunta: '¿Cuántos corazones tiene un pulpo?', correcta: '3', otros: ['1', '8'], dato: 'Dos bombean a las branquias y uno al resto del cuerpo.' },
  { emoji: '🇦🇷', fondo: '#0369A1', tema: 'ARGENTINA', pregunta: '¿Qué día se celebra la Independencia?', correcta: '9 de julio', otros: ['25 de mayo', '20 de junio'], dato: 'Fue en Tucumán, en 1816.' },
  { emoji: '🏔️', fondo: '#334155', tema: 'GEOGRAFÍA', pregunta: '¿Cuál es la montaña más alta de América?', correcta: 'Aconcagua', otros: ['Everest', 'Chimborazo'], dato: 'El Aconcagua mide casi 7.000 metros.' },
  { emoji: '🧮', fondo: '#047857', tema: 'MATEMÁTICA', pregunta: '¿Cuánto es 7 × 8?', correcta: '56', otros: ['54', '48'], dato: '8 × 8 = 64, así que 7 × 8 es 8 menos.' },
  { emoji: '➗', fondo: '#0E7490', tema: 'MATEMÁTICA', pregunta: '¿Cuánto es 144 ÷ 12?', correcta: '12', otros: ['14', '11'], dato: '12 × 12 = 144.' },
  { emoji: '🥛', fondo: '#A16207', tema: 'COMIDA', pregunta: '¿Qué ingrediente principal tiene el dulce de leche?', correcta: 'Leche', otros: ['Maíz', 'Banana'], dato: 'Se hace cocinando leche con azúcar por horas.' },
  { emoji: '🪐', fondo: '#3730A3', tema: 'ESPACIO', pregunta: '¿Cuál es el planeta más cercano al Sol?', correcta: 'Mercurio', otros: ['Venus', 'Marte'], dato: 'Mercurio está a unos 58 millones de km.' },
  { emoji: '🌊', fondo: '#075985', tema: 'GEOGRAFÍA', pregunta: '¿Cuál es el océano más grande?', correcta: 'Pacífico', otros: ['Atlántico', 'Índico'], dato: 'El Pacífico cubre un tercio del planeta.' },
  { emoji: '🐝', fondo: '#B45309', tema: 'ANIMALES', pregunta: '¿Qué insecto produce la miel?', correcta: 'Abeja', otros: ['Avispa', 'Hormiga'], dato: 'Para un kilo visitan millones de flores.' },
  { emoji: '🎸', fondo: '#9F1239', tema: 'MÚSICA', pregunta: '¿Cuántas cuerdas tiene una guitarra clásica?', correcta: '6', otros: ['4', '12'], dato: 'Do, re, mi, sol, si y mi.' },
  { emoji: '⚽', fondo: '#166534', tema: 'DEPORTE', pregunta: '¿Cuántos jugadores tiene un equipo de fútbol en cancha?', correcta: '11', otros: ['9', '10'], dato: 'Diez de campo y el arquero.' },
  { emoji: '🌡️', fondo: '#9F1239', tema: 'CIENCIA', pregunta: '¿A cuántos grados hierve el agua?', correcta: '100 °C', otros: ['50 °C', '200 °C'], dato: 'A nivel del mar.' },
  { emoji: '🏙️', fondo: '#78350F', tema: 'ARGENTINA', pregunta: '¿Cuál es la capital de la provincia de Córdoba?', correcta: 'Córdoba', otros: ['Rosario', 'Villa Carlos Paz'], dato: 'Es la segunda ciudad más poblada del país.' },
  { emoji: '🦉', fondo: '#1F2937', tema: 'ANIMALES', pregunta: '¿Qué animal sale de caza de noche?', correcta: 'Búho', otros: ['Gallina', 'Mariposa'], dato: 'Sus ojos están adaptados a la oscuridad.' },
  { emoji: '🍋', fondo: '#A16207', tema: 'SALUD', pregunta: '¿Qué vitamina tiene el limón?', correcta: 'Vitamina C', otros: ['Vitamina A', 'Vitamina D'], dato: 'Ayuda a las defensas del cuerpo.' },
  { emoji: '🚀', fondo: '#1E3A8A', tema: 'ESPACIO', pregunta: '¿Quién fue el primero en caminar sobre la Luna?', correcta: 'Neil Armstrong', otros: ['Yuri Gagarin', 'Buzz Aldrin'], dato: 'Fue el 20 de julio de 1969.' },
  { emoji: '🎨', fondo: '#3730A3', tema: 'ARTE', pregunta: '¿Qué color sale de mezclar azul y amarillo?', correcta: 'Verde', otros: ['Naranja', 'Violeta'], dato: 'En pintura, el verde es secundario.' },
  { emoji: '🐧', fondo: '#075985', tema: 'ANIMALES', pregunta: '¿En qué hemisferio viven los pingüinos?', correcta: 'Sur', otros: ['Norte', 'En los dos por igual'], dato: 'Casi todos viven en el hemisferio sur.' },
  { emoji: '📖', fondo: '#78350F', tema: 'LIBROS', pregunta: '¿Quién escribió "El Principito"?', correcta: 'Antoine de Saint-Exupéry', otros: ['Julio Verne', 'J. K. Rowling'], dato: 'Lo publicó en 1943.' },
  { emoji: '🌞', fondo: '#B45309', tema: 'ESPACIO', pregunta: '¿Qué astro nos da luz y calor?', correcta: 'El Sol', otros: ['La Luna', 'Marte'], dato: 'La Luna solo refleja la luz del Sol.' },
  { emoji: '🧊', fondo: '#0E7490', tema: 'CIENCIA', pregunta: '¿Qué le pasa al agua cuando se congela?', correcta: 'Se expande', otros: ['Se achica', 'No cambia'], dato: 'Por eso el hielo flota.' },
];

const TOTAL = 10;
const SEGUNDOS = 12;
const LETRAS = ['A', 'B', 'C'];

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
    productos = [],
  } = opciones;

  const raiz = document.createElement('div');
  raiz.className = 'quiz';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'Quiz Show');
  raiz.innerHTML = `
    <div class="quiz__fondo" aria-hidden="true"><span></span><span></span><span></span></div>

    <header class="quiz__top">
      <span class="quiz__brand">🎬 QUIZ SHOW</span>
      <div class="quiz__marcador"><b data-quiz="puntos">0</b><small>PTS</small></div>
      <span class="quiz__racha" data-quiz="racha" hidden>🔥 x2</span>
      <button class="quiz__x" type="button" data-quiz="salir" aria-label="Salir">✕</button>
    </header>

    <div class="quiz__dots" data-quiz="dots" aria-hidden="true"></div>

    <section class="quiz__intro" data-quiz="intro">
      <span class="quiz__intro-ico">🎬</span>
      <h1>QUIZ SHOW</h1>
      <p class="quiz__intro-sub">10 preguntas · 12 segundos · 3 opciones</p>
      <button class="btn btn--primary quiz__btn" type="button" data-quiz="empezar">▶ EMPEZAR</button>
      <small>Cuanto más rápido contestás, más puntos ganás.</small>
    </section>

    <section class="quiz__juego" data-quiz="juego" hidden>
      <div class="quiz__escenario">
        <div class="quiz__imagen" data-quiz="imagen"></div>
        <span class="quiz__marca" data-quiz="marca">¿QUIÉN ES?</span>
      </div>

      <div class="quiz__panel">
        <h2 class="quiz__pregunta" data-quiz="pregunta">—</h2>
        <div class="quiz__opciones" data-quiz="opciones"></div>

        <div class="quiz__timer">
          <div class="quiz__barra"><u data-quiz="barra"></u></div>
          <span class="quiz__reloj" data-quiz="reloj">${SEGUNDOS}s</span>
        </div>

        <div class="quiz__feedback" data-quiz="feedback" aria-live="polite"></div>
      </div>
    </section>
  `;
  document.body.append(raiz);

  const buscar = (n) => raiz.querySelector(`[data-quiz="${n}"]`);
  const elIntro = buscar('intro');
  const elJuego = buscar('juego');
  const elDots = buscar('dots');
  const elImagen = buscar('imagen');
  const elMarca = buscar('marca');
  const elPregunta = buscar('pregunta');
  const elOpciones = buscar('opciones');
  const elBarra = buscar('barra');
  const elReloj = buscar('reloj');
  const elPuntos = buscar('puntos');
  const elRacha = buscar('racha');
  const elFeedback = buscar('feedback');

  let preguntas = [];
  let indice = 0;
  let puntos = 0;
  let aciertos = 0;
  let racha = 0;
  let mejorRacha = 0;
  let restante = SEGUNDOS;
  let corriendo = false;
  let raf = 0;
  let ultimo = 0;
  let ultimoTick = 99;
  let bloqueado = false;
  let avanzar = null;
  let cerrado = false;

  /* --- Ronda ------------------------------------------------------------- */
  function preguntaDeFoto(usados) {
    const conFoto = productos.filter(
      (p) => p?.imagen && !/logo\.(svg|png)|icono/i.test(p.imagen) && !usados.has(p.nombre)
    );
    if (conFoto.length < 4) return null;
    const elegidos = mezclar(conFoto).slice(0, 3);
    const protagonista = elegidos[Math.floor(Math.random() * elegidos.length)];
    usados.add(protagonista.nombre);
    const opciones = mezclar(elegidos.map((p) => p.nombre));
    return {
      tipo: 'foto',
      foto: protagonista.imagen,
      fondo: protagonista.color || '#0B1020',
      marca: '¿CUÁL ES ESTA GOLOSINA?',
      tema: 'LA TIENDA',
      pregunta: 'Mirá la foto y elegí el nombre correcto.',
      opciones,
      correctaIdx: opciones.indexOf(protagonista.nombre),
      dato: protagonista.precio ? `En la tienda sale $${protagonista.precio}.` : '',
    };
  }

  function armarRonda() {
    const usados = new Set();
    const fotos = [];
    for (let i = 0; i < 3; i += 1) {
      const p = preguntaDeFoto(usados);
      if (p) fotos.push(p);
    }

    const banco = mezclar(BANCO)
      .slice(0, TOTAL - fotos.length)
      .map((q) => {
        const opciones = mezclar([q.correcta, ...q.otros]);
        return {
          tipo: 'emoji',
          emoji: q.emoji,
          fondo: q.fondo,
          tema: q.tema,
          marca: q.tema,
          pregunta: q.pregunta,
          opciones,
          correctaIdx: opciones.indexOf(q.correcta),
          dato: q.dato,
        };
      });

    preguntas = mezclar([...fotos, ...banco]).slice(0, TOTAL);
    // Red de seguridad: si alguna pregunta quedó sin índice válido, la sacamos.
    preguntas = preguntas.filter((p) => p.correctaIdx >= 0 && p.correctaIdx < p.opciones.length);

    indice = 0;
    puntos = 0;
    aciertos = 0;
    racha = 0;
    mejorRacha = 0;
    elPuntos.textContent = '0';
    elRacha.hidden = true;
    elDots.innerHTML = preguntas.map(() => '<i></i>').join('');
  }

  /* --- Mostrar ----------------------------------------------------------- */
  function mostrarPregunta() {
    if (indice >= preguntas.length) {
      terminar();
      return;
    }
    bloqueado = false;
    const p = preguntas[indice];

    elFeedback.className = 'quiz__feedback';
    elFeedback.innerHTML = '';
    elMarca.textContent = p.marca;
    elPregunta.textContent = p.pregunta;
    elImagen.innerHTML = '';
    elImagen.style.background = p.fondo || '#0B1020';
    elImagen.classList.toggle('quiz__imagen--foto', p.tipo === 'foto');

    if (p.tipo === 'foto') {
      const img = document.createElement('img');
      img.src = p.foto;
      img.alt = 'Foto de la golosina';
      img.className = 'quiz__foto';
      elImagen.append(img);
    } else {
      const span = document.createElement('span');
      span.className = 'quiz__emoji';
      span.textContent = p.emoji;
      span.setAttribute('aria-hidden', 'true');
      elImagen.append(span);
      const halo = document.createElement('span');
      halo.className = 'quiz__halo';
      halo.setAttribute('aria-hidden', 'true');
      elImagen.append(halo);
    }

    elOpciones.innerHTML = p.opciones
      .map(
        (texto, i) => `
        <button class="quiz__opcion" type="button" data-opcion="${i}">
          <span class="quiz__letra">${LETRAS[i]}</span>
          <span class="quiz__texto">${esc(texto)}</span>
          <span class="quiz__luz" aria-hidden="true"></span>
        </button>`
      )
      .join('');

    elDots.querySelectorAll('i').forEach((d, i) => {
      d.classList.toggle('on', i === indice);
      d.classList.toggle('hecha', i < indice);
    });

    restante = SEGUNDOS;
    ultimoTick = 99;
    pintarReloj();
    corriendo = true;
    ultimo = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(bucle);
  }

  function pintarReloj() {
    const proporcion = Math.max(0, Math.min(1, restante / SEGUNDOS));
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

  /* --- Responder --------------------------------------------------------- */
  function responder(elegida) {
    if (bloqueado || cerrado) return;
    bloqueado = true;
    corriendo = false;
    cancelAnimationFrame(raf);

    const p = preguntas[indice];
    if (!p) return;
    const acierto = elegida === p.correctaIdx;
    let ganados = 0;
    const correctaTexto = p.opciones[p.correctaIdx];

    elOpciones.querySelectorAll('[data-opcion]').forEach((b) => {
      const i = Number(b.dataset.opcion);
      b.disabled = true;
      if (i === p.correctaIdx) b.classList.add('quiz__opcion--ok');
      if (i === elegida && !acierto) b.classList.add('quiz__opcion--mal');
    });

    if (acierto) {
      aciertos += 1;
      racha += 1;
      mejorRacha = Math.max(mejorRacha, racha);
      const bonusTiempo = Math.round((Math.max(0, restante) / SEGUNDOS) * 60);
      const bonusRacha = Math.min(4, racha - 1) * 20;
      ganados = 100 + bonusTiempo + bonusRacha;
      puntos += ganados;
      elPuntos.textContent = puntos;
      elPuntos.classList.remove('quiz__marcador--pop');
      void elPuntos.offsetWidth;
      elPuntos.classList.add('quiz__marcador--pop');
      elRacha.hidden = racha < 2;
      elRacha.textContent = `🔥 x${racha}`;

      sonar(880, 0.06);
      setTimeout(() => sonar(1180, 0.08), 80);
      vibrar(15);
      FX.sfx('acierto');
      FX.destello('0,255,136', 0.14);
      if (racha >= 2) FX.confeti(26, ['#00FF88', '#FFE600', '#FFFFFF']);
    } else {
      racha = 0;
      elRacha.hidden = true;
      sonar(180, 0.18, 'sawtooth');
      vibrar([40, 50]);
      FX.sfx('error');
      FX.destello('255,70,70', 0.22);
    }

    const letra = LETRAS[p.correctaIdx];
    elFeedback.className = `quiz__feedback quiz__feedback--on ${acierto ? 'quiz__feedback--ok' : 'quiz__feedback--mal'}`;
    elFeedback.innerHTML = `
      <b>${acierto ? '¡CORRECTO!' : elegida === -1 ? '¡SE ACABÓ EL TIEMPO!' : '¡CASI!'}</b>
      <span>${acierto ? 'Sumaste' : `La correcta era ${letra}:`} <strong>${acierto ? `+${ganados} pts` : esc(correctaTexto)}</strong></span>
      ${p.dato ? `<small>${esc(p.dato)}</small>` : ''}
    `;

    avanzar = setTimeout(() => {
      if (cerrado) return;
      indice += 1;
      mostrarPregunta();
    }, acierto ? 1500 : 2300);
  }

  function terminar() {
    corriendo = false;
    cancelAnimationFrame(raf);
    alTerminar(puntos, { aciertos, total: preguntas.length, mejorRacha, record });
  }

  /* --- Eventos ----------------------------------------------------------- */
  function empezar() {
    elIntro.hidden = true;
    elJuego.hidden = false;
    armarRonda();
    mostrarPregunta();
    FX.sfx('start');
  }

  raiz.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-quiz]')?.dataset.quiz;
    if (accion === 'salir') { cerrar(); return; }
    if (accion === 'empezar') { empezar(); return; }
    const opcion = e.target.closest('[data-opcion]');
    if (opcion && !bloqueado) responder(Number(opcion.dataset.opcion));
  });

  const alTeclear = (e) => {
    if (e.key === 'Escape') { cerrar(); return; }
    if (!elIntro.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); empezar(); }
      return;
    }
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

  armarRonda();
  elJuego.hidden = true;

  return { cerrar, raiz, pausar: () => { corriendo = false; } };
}
