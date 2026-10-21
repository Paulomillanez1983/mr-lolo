/* ==========================================================================
   MR. LOLO — QUIZ SHOW
   --------------------------------------------------------------------------
   El formato de los canales de preguntas: una imagen grande, la pregunta,
   tres opciones A / B / C y una barra de tiempo que se vacía.

   · 10 preguntas por ronda.
   · Las fotos que carga la tienda se usan como preguntas ("¿cuál es?").
   · Puntaje: 100 por acierto + bonus por velocidad + bonus por racha.
   ========================================================================== */

import { FX } from './fx.js';

const BANCO = [
  { emoji: '🦒', fondo: '#FFB300', pregunta: '¿Qué animal tiene el cuello más largo?', opciones: ['Jirafa', 'Cebra', 'Avestruz'], dato: 'La jirafa puede medir hasta 5,5 metros.' },
  { emoji: '🐘', fondo: '#7A8B99', pregunta: '¿Cuál es el animal terrestre más grande?', opciones: ['Elefante', 'Rinoceronte', 'Hipopótamo'], dato: 'El elefante africano pesa como 6 autos.' },
  { emoji: '🍫', fondo: '#7A4A2A', pregunta: '¿De qué planta sale el chocolate?', opciones: ['Cacao', 'Café', 'Vainilla'], dato: 'El chocolate sale de las semillas del cacao.' },
  { emoji: '🌈', fondo: '#4C6FFF', pregunta: '¿Cuántos colores tiene el arcoíris?', opciones: ['7', '5', '9'], dato: 'Rojo, naranja, amarillo, verde, celeste, azul y violeta.' },
  { emoji: '🕷️', fondo: '#2B2B3A', pregunta: '¿Cuántas patas tiene una araña?', opciones: ['8', '6', '10'], dato: 'Los insectos tienen 6; las arañas, 8.' },
  { emoji: '🐙', fondo: '#C24BFF', pregunta: '¿Cuántos corazones tiene un pulpo?', opciones: ['3', '1', '8'], dato: 'Dos bombean a las branquias y uno al resto del cuerpo.' },
  { emoji: '🇦🇷', fondo: '#00B1EA', pregunta: '¿Qué día se celebra la Independencia?', opciones: ['9 de julio', '25 de mayo', '20 de junio'], dato: 'Fue en Tucumán, en 1816.' },
  { emoji: '🏔️', fondo: '#5C6B7A', pregunta: '¿Cuál es la montaña más alta de América?', opciones: ['Aconcagua', 'Everest', 'Chimborazo'], dato: 'El Aconcagua mide casi 7.000 metros.' },
  { emoji: '🧮', fondo: '#00FF88', pregunta: '¿Cuánto es 7 × 8?', opciones: ['56', '54', '48'], dato: '8 × 8 = 64, así que 7 × 8 es 8 menos.' },
  { emoji: '➗', fondo: '#00B1EA', pregunta: '¿Cuánto es 144 ÷ 12?', opciones: ['12', '14', '11'], dato: '12 × 12 = 144.' },
  { emoji: '🥛', fondo: '#FFE600', pregunta: '¿Qué ingrediente principal tiene el dulce de leche?', opciones: ['Leche', 'Maíz', 'Banana'], dato: 'Se hace cocinando leche con azúcar por horas.' },
  { emoji: '🪐', fondo: '#4C6FFF', pregunta: '¿Cuál es el planeta más cercano al Sol?', opciones: ['Mercurio', 'Venus', 'Marte'], dato: 'Mercurio está a unos 58 millones de km.' },
  { emoji: '🌊', fondo: '#0090C8', pregunta: '¿Cuál es el océano más grande?', opciones: ['Pacífico', 'Atlántico', 'Índico'], dato: 'El Pacífico cubre un tercio del planeta.' },
  { emoji: '🐝', fondo: '#FFB300', pregunta: '¿Qué insecto produce la miel?', opciones: ['Abeja', 'Avispa', 'Hormiga'], dato: 'Para un kilo visitan millones de flores.' },
  { emoji: '🎸', fondo: '#FF5C7A', pregunta: '¿Cuántas cuerdas tiene una guitarra clásica?', opciones: ['6', '4', '12'], dato: 'Do, re, mi, sol, si y mi.' },
  { emoji: '⚽', fondo: '#00FF88', pregunta: '¿Cuántos jugadores tiene un equipo de fútbol en cancha?', opciones: ['11', '9', '10'], dato: 'Diez de campo y el arquero.' },
  { emoji: '🌡️', fondo: '#FF5C7A', pregunta: '¿A cuántos grados hierve el agua?', opciones: ['100 °C', '50 °C', '200 °C'], dato: 'A nivel del mar, claro.' },
  { emoji: '🏙️', fondo: '#7A4A2A', pregunta: '¿Cuál es la capital de la provincia de Córdoba?', opciones: ['Córdoba', 'Rosario', 'Villa Carlos Paz'], dato: 'Es la segunda ciudad más poblada del país.' },
  { emoji: '🦉', fondo: '#2B2B3A', pregunta: '¿Qué animal sale de caza de noche?', opciones: ['Búho', 'Gallina', 'Mariposa'], dato: 'El búho tiene ojos adaptados a la oscuridad.' },
  { emoji: '🍋', fondo: '#FFE600', pregunta: '¿Qué vitamina tiene el limón?', opciones: ['Vitamina C', 'Vitamina A', 'Vitamina D'], dato: 'Ayuda a las defensas del cuerpo.' },
  { emoji: '🚀', fondo: '#0A2A4A', pregunta: '¿Quién fue el primero en caminar sobre la Luna?', opciones: ['Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin'], dato: 'Fue el 20 de julio de 1969.' },
  { emoji: '🎨', fondo: '#4C6FFF', pregunta: '¿Qué color sale de mezclar azul y amarillo?', opciones: ['Verde', 'Naranja', 'Violeta'], dato: 'En pintura, el verde es secundario.' },
  { emoji: '🐧', fondo: '#0090C8', pregunta: '¿En qué hemisferio viven los pingüinos?', opciones: ['Sur', 'Norte', 'En los dos por igual'], dato: 'Casi todos viven en el hemisferio sur.' },
  { emoji: '📖', fondo: '#7A4A2A', pregunta: '¿Quién escribió "El Principito"?', opciones: ['Antoine de Saint-Exupéry', 'Julio Verne', 'J. K. Rowling'], dato: 'Lo publicó en 1943.' },
  { emoji: '🍬', fondo: '#FF5C7A', pregunta: '¿Qué le pasa a un caramelo si lo dejás mucho tiempo en agua?', opciones: ['Se disuelve', 'Se congela', 'Explota'], dato: 'El azúcar se disuelve en el agua.' },
  { emoji: '🌞', fondo: '#FFB300', pregunta: '¿Qué astro nos da luz y calor?', opciones: ['El Sol', 'La Luna', 'Marte'], dato: 'La Luna solo refleja la luz del Sol.' },
];

const TOTAL = 10;
const SEGUNDOS = 12;

const mezclar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

const LETRAS = ['A', 'B', 'C'];

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
    <div class="quiz__top">
      <span class="quiz__brand">🎬 QUIZ SHOW</span>
      <div class="quiz__hud">
        <span data-quiz="progreso">1/${TOTAL}</span>
        <b data-quiz="puntos">0</b>
        <span class="quiz__racha" data-quiz="racha" hidden>🔥 x2</span>
      </div>
      <button class="quiz__x" type="button" data-quiz="salir" aria-label="Salir">✕</button>
    </div>

    <div class="quiz__escenario">
      <div class="quiz__imagen" data-quiz="imagen"></div>
      <span class="quiz__marca" data-quiz="marca">¿QUIÉN ES?</span>
    </div>

    <h2 class="quiz__pregunta" data-quiz="pregunta">—</h2>

    <div class="quiz__opciones" data-quiz="opciones"></div>

    <div class="quiz__timer">
      <div class="quiz__barra"><u data-quiz="barra"></u></div>
      <span class="quiz__reloj" data-quiz="reloj">${SEGUNDOS}s</span>
    </div>

    <div class="quiz__feedback" data-quiz="feedback" hidden></div>
  `;
  document.body.append(raiz);

  const buscar = (n) => raiz.querySelector(`[data-quiz="${n}"]`);
  const elImagen = buscar('imagen');
  const elMarca = buscar('marca');
  const elPregunta = buscar('pregunta');
  const elOpciones = buscar('opciones');
  const elBarra = buscar('barra');
  const elReloj = buscar('reloj');
  const elPuntos = buscar('puntos');
  const elProgreso = buscar('progreso');
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

  /* --- Armado de la ronda ------------------------------------------------ */
  function preguntaDeFoto() {
    const conFoto = productos.filter((p) => p?.imagen && !/logo\.svg|logo\.png/i.test(p.imagen));
    if (conFoto.length < 3) return null;
    const elegidos = mezclar(conFoto).slice(0, 3);
    const protagonista = elegidos[Math.floor(Math.random() * elegidos.length)];
    const opciones = mezclar(elegidos.map((p) => p.nombre));
    return {
      tipo: 'foto',
      foto: protagonista.imagen,
      fondo: protagonista.color || '#0A0E1B',
      marca: '¿CUÁL ES ESTA GOLOSINA?',
      pregunta: 'Mirá la foto y elegí el nombre correcto.',
      opciones,
      correcta: protagonista.nombre,
      dato: protagonista.precio ? `En la tienda sale $${protagonista.precio}.` : '',
    };
  }

  function armarRonda() {
    const fotos = [];
    for (let i = 0; i < 3; i += 1) {
      const p = preguntaDeFoto();
      if (p) fotos.push(p);
    }
    const banco = mezclar(BANCO)
      .slice(0, TOTAL - fotos.length)
      .map((q) => {
        const opciones = mezclar(q.opciones);
        return {
          tipo: 'emoji',
          emoji: q.emoji,
          fondo: q.fondo,
          marca: '¿QUÉ VES?',
          pregunta: q.pregunta,
          opciones,
          correcta: q.opciones[0],
          dato: q.dato,
        };
      });
    preguntas = mezclar([...fotos, ...banco]).slice(0, TOTAL);
    indice = 0;
    puntos = 0;
    aciertos = 0;
    racha = 0;
    mejorRacha = 0;
    actualizarHud();
    mostrarPregunta();
  }

  /* --- Mostrar ----------------------------------------------------------- */
  function mostrarPregunta() {
    if (indice >= preguntas.length) {
      terminar();
      return;
    }
    bloqueado = false;
    const p = preguntas[indice];
    elFeedback.hidden = true;
    elFeedback.className = 'quiz__feedback';
    elProgreso.textContent = `${indice + 1}/${preguntas.length}`;
    elMarca.textContent = p.marca;
    elPregunta.textContent = p.pregunta;
    elImagen.innerHTML = '';
    elImagen.style.background = p.fondo || '#0A0E1B';

    if (p.tipo === 'foto') {
      const img = document.createElement('img');
      img.src = p.foto;
      img.alt = 'Foto de la golosina';
      img.className = 'quiz__foto';
      elImagen.append(img);
      elImagen.classList.add('quiz__imagen--foto');
    } else {
      elImagen.classList.remove('quiz__imagen--foto');
      const span = document.createElement('span');
      span.className = 'quiz__emoji';
      span.textContent = p.emoji;
      span.setAttribute('aria-hidden', 'true');
      elImagen.append(span);
    }

    elOpciones.innerHTML = p.opciones
      .map(
        (texto, i) => `
        <button class="quiz__opcion" type="button" data-opcion="${i}" data-letra="${LETRAS[i]}">
          <span class="quiz__letra">${LETRAS[i]}</span>
          <span class="quiz__texto">${texto}</span>
        </button>`
      )
      .join('');

    restante = SEGUNDOS;
    ultimoTick = 99;
    pintarReloj();
    corriendo = true;
    ultimo = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(bucle);
  }

  function actualizarHud() {
    elPuntos.textContent = puntos;
    elRacha.hidden = racha < 2;
    elRacha.textContent = `🔥 x${Math.min(5, racha)}`;
  }

  function pintarReloj() {
    const proporcion = Math.max(0, Math.min(1, restante / SEGUNDOS));
    elBarra.style.transform = `scaleX(${proporcion})`;
    elBarra.classList.toggle('quiz__barra--baja', proporcion < 0.28);
    elReloj.textContent = `${Math.max(0, Math.ceil(restante))}s`;
  }

  function bucle(ahora) {
    const dt = Math.min(0.1, (ahora - ultimo) / 1000 || 0.016);
    ultimo = ahora;
    if (corriendo) {
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
    if (bloqueado) return;
    bloqueado = true;
    corriendo = false;
    cancelAnimationFrame(raf);

    const p = preguntas[indice];
    const correcta = p.opciones.indexOf(p.correcta);
    const acierto = elegida === correcta;

    raiz.querySelectorAll('[data-opcion]').forEach((b) => {
      const i = Number(b.dataset.opcion);
      b.disabled = true;
      if (i === correcta) b.classList.add('quiz__opcion--ok');
      if (i === elegida && !acierto) b.classList.add('quiz__opcion--mal');
    });

    if (acierto) {
      aciertos += 1;
      racha += 1;
      mejorRacha = Math.max(mejorRacha, racha);
      const bonusTiempo = Math.round((restante / SEGUNDOS) * 60);
      const bonusRacha = Math.min(4, racha - 1) * 20;
      puntos += 100 + bonusTiempo + bonusRacha;
      sonar(880, 0.07);
      setTimeout(() => sonar(1180, 0.09), 90);
      vibrar(15);
      FX.sfx('acierto');
      FX.destello('0,255,136', 0.16);
      if (racha >= 2) FX.confeti(28, ['#00FF88', '#FFE600', '#FFFFFF']);
    } else {
      racha = 0;
      sonar(180, 0.18, 'sawtooth');
      vibrar([40, 50]);
      FX.sfx('error');
      FX.destello('255,70,70', 0.28);
    }

    actualizarHud();
    elFeedback.hidden = false;
    elFeedback.className = `quiz__feedback ${acierto ? 'quiz__feedback--ok' : 'quiz__feedback--mal'}`;
    elFeedback.innerHTML = `
      <b>${acierto ? '¡CORRECTO!' : elegida === -1 ? '¡SE ACABÓ EL TIEMPO!' : '¡CASI!'}</b>
      ${p.dato ? `<span>${p.dato}</span>` : ''}
    `;

    setTimeout(() => {
      if (!raiz.isConnected) return;
      indice += 1;
      mostrarPregunta();
    }, acierto ? 1250 : 1750);
  }

  function terminar() {
    corriendo = false;
    cancelAnimationFrame(raf);
    elFeedback.hidden = true;
    alTerminar(puntos, { aciertos, total: preguntas.length, mejorRacha, record });
  }

  /* --- Entradas ---------------------------------------------------------- */
  elOpciones.addEventListener('click', (e) => {
    const b = e.target.closest('[data-opcion]');
    if (!b || bloqueado) return;
    responder(Number(b.dataset.opcion));
  });

  const alTeclear = (e) => {
    if (e.key === 'Escape') { cerrar(); return; }
    const mapa = { a: 0, b: 1, c: 2, '1': 0, '2': 1, '3': 2 };
    const i = mapa[e.key.toLowerCase()];
    if (i !== undefined && !bloqueado) {
      e.preventDefault();
      responder(i);
    }
  };
  document.addEventListener('keydown', alTeclear);

  raiz.addEventListener('click', (e) => {
    if (e.target.closest('[data-quiz="salir"]')) cerrar();
  });

  function cerrar() {
    corriendo = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', alTeclear);
    raiz.remove();
    alSalir();
  }

  /* --- Arranque ---------------------------------------------------------- */
  armarRonda();

  return { cerrar, raiz, pausar: () => { corriendo = false; } };
}
