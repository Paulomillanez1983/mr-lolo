/* ==========================================================================
   MR. LOLO — SALA ARCADE
   --------------------------------------------------------------------------
   La casa de los juegos: perfil del jugador, XP, fichas, logros, ranking
   entre todos los que abren la tienda y los gabinetes para jugar.

   Los juegos nuevos viven en su propio archivo y se cargan con import()
   recién cuando alguien los abre (no pesan en la primera visita).
   ========================================================================== */

import { FX } from './fx.js';

const CLAVE_PERFIL = 'mrlolo.perfil';
const CLAVE_RETO = 'mrlolo.reto';

const AVATARES = ['🍭', '🍬', '🍫', '🍪', '🧁', '🍩', '👾', '🦊'];

const JUEGOS = [
  {
    id: 'arkanoid',
    nombre: 'Rompe Golosinas',
    corto: 'ARKANOID',
    icono: '🧱',
    color: '#00B1EA',
    tag: 'ARCADE',
    desc: 'Rebotá la pelota, rompé todo y no pierdas la paleta.',
    puntos: '40 por ladrillo',
    cargar: () => import('./arkanoid.js').then((m) => m.iniciarArkanoid),
  },
  {
    id: 'quiz',
    nombre: 'Quiz Show',
    corto: 'QUIZ',
    icono: '🎬',
    color: '#FF9500',
    tag: 'TV SHOW',
    desc: 'Imagen grande, pregunta y tres opciones. La barra corre: pensá rápido.',
    puntos: '100 + bonus por velocidad',
    cargar: () => import('./quiz.js').then((m) => m.iniciarQuiz),
  },
  {
    id: 'snake',
    nombre: 'Serpiente Golosa',
    corto: 'SNAKE',
    icono: '🐍',
    color: '#00FF88',
    tag: 'RETRO',
    desc: 'Comé golosinas y crecé sin chocar contra nada.',
    puntos: '10 por golosina',
    cargar: () => import('./snake.js').then((m) => m.iniciarSnake),
  },
  {
    id: 'memoria',
    nombre: 'Memoria Golosa',
    corto: 'MEMORIA',
    icono: '🧠',
    color: '#C24BFF',
    tag: 'MENTE',
    desc: 'Encontrá los 8 pares con la menor cantidad de intentos.',
    puntos: '1000 − intentos − tiempo',
    cargar: () => import('./memoria.js').then((m) => m.iniciarMemoria),
  },
  {
    id: 'tetris',
    nombre: 'Tetris de Golosinas',
    corto: 'TETRIS',
    icono: '🧊',
    color: '#FF5C7A',
    tag: 'CLÁSICO',
    desc: 'Armá líneas con caramelos y aguantá la velocidad.',
    puntos: '100 por línea',
    cargar: null,
  },
  {
    id: 'caramelos',
    nombre: 'Lluvia de Caramelos',
    corto: 'LLUVIA',
    icono: '🍬',
    color: '#FFE600',
    tag: 'REFLEJOS',
    desc: 'Atrapá caramelos con la galera y esquivá el brócoli.',
    puntos: '1 por caramelo · 5 estrellas',
    cargar: null,
  },
];

const LOGROS = [
  { id: 'primera', icono: '🎮', nombre: 'Primera partida', desc: 'Jugaste tu primer juego en la sala.', comprobar: (p) => p.jugadas >= 1 },
  { id: 'cinco', icono: '🕹️', nombre: 'Cinco seguidas', desc: 'Jugaste 5 partidas.', comprobar: (p) => p.jugadas >= 5 },
  { id: 'veinte', icono: '👑', nombre: 'Vicio sano', desc: 'Jugaste 25 partidas.', comprobar: (p) => p.jugadas >= 25 },
  { id: 'mil', icono: '🚀', nombre: 'Mil puntos', desc: 'Hiciste 1.000 puntos en una sola partida.', comprobar: (p) => Object.values(p.records).some((r) => r.puntos >= 1000) },
  { id: 'cincomil', icono: '💎', nombre: 'Cinco mil', desc: 'Acumulaste 5.000 puntos entre todos los juegos.', comprobar: (p) => p.total >= 5000 },
  { id: 'todos', icono: '🌈', nombre: 'Probador oficial', desc: 'Jugaste todos los juegos de la sala.', comprobar: (p) => JUEGOS.every((j) => p.records[j.id]?.puntos > 0) },
  { id: 'nivel3', icono: '🧱', nombre: 'Muro roto', desc: 'Llegaste al nivel 3 del Arkanoid.', comprobar: (p) => (p.records.arkanoid?.nivel || 0) >= 3 },
  { id: 'serpiente', icono: '🐍', nombre: 'Serpiente larga', desc: 'Hiciste 200 puntos en la Serpiente.', comprobar: (p) => (p.records.snake?.puntos || 0) >= 200 },
  { id: 'memoria', icono: '🧠', nombre: 'Memoria de acero', desc: 'Ganaste la Memoria con 12 intentos o menos.', comprobar: (p) => (p.records.memoria?.intentos || 999) <= 12 },
  { id: 'tetris500', icono: '🧊', nombre: 'Arquitecto', desc: 'Hiciste 500 puntos en el Tetris.', comprobar: (p) => (p.records.tetris?.puntos || 0) >= 500 },
];

/* --------------------------------------------------------------------------
   Estado del módulo
   -------------------------------------------------------------------------- */
let deps = null;
let raiz = null;
let tab = 'arcade';
let perfil = null;
let activo = null;
let resultado = null;
let rankingCache = new Map();
let rankingJuego = 'general';
let esperandoRanking = false;

const $ = (sel, base = document) => base.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => new Intl.NumberFormat('es-AR').format(Math.round(+n || 0));

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/* --------------------------------------------------------------------------
   Perfil
   -------------------------------------------------------------------------- */
function perfilNuevo() {
  return {
    nombre: '',
    avatar: '🍭',
    xp: 0,
    fichas: 0,
    jugadas: 0,
    total: 0,
    records: {},
    logros: [],
    creado: Date.now(),
  };
}

function cargarPerfil() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_PERFIL) || 'null');
    perfil = { ...perfilNuevo(), ...(guardado || {}) };
    perfil.records = perfil.records || {};
    perfil.logros = Array.isArray(perfil.logros) ? perfil.logros : [];
  } catch {
    perfil = perfilNuevo();
  }
  return perfil;
}

function guardarPerfil() {
  try { localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil)); } catch { /* sin espacio */ }
}

const nivelDe = (xp) => 1 + Math.floor(xp / 300);
const xpDelNivel = (xp) => xp % 300;
const nombreJugador = () => perfil.nombre || 'Invitado';

/* --------------------------------------------------------------------------
   Reto del día
   -------------------------------------------------------------------------- */
function retoDeHoy() {
  const dia = Math.floor(Date.now() / 86400000);
  const juego = JUEGOS[dia % JUEGOS.length];
  const meta = 250 + (dia % 4) * 100;
  let hecho = null;
  try { hecho = JSON.parse(localStorage.getItem(CLAVE_RETO) || 'null'); } catch { hecho = null; }
  return {
    juego,
    meta,
    premio: 60,
    cumplido: Boolean(hecho && hecho.fecha === hoy() && hecho.juego === juego.id),
  };
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */
export function configurarSala(opciones = {}) {
  deps = opciones;
  cargarPerfil();
  // Si el nombre quedó guardado en la tienda, lo usamos como sugerencia.
  if (!perfil.nombre && deps.nombreSugerido) perfil.nombre = deps.nombreSugerido;
  return { perfil };
}

export function abrirSala() {
  if (!deps) return;
  if (!raiz) construir();
  raiz.hidden = false;
  document.body.classList.add('sin-scroll');
  render();
  raiz.classList.add('sala--on');
  FX.despertar();
  FX.musica('sala');
  document.addEventListener('keydown', alTeclear);
}

export function cerrarSala() {
  if (!raiz) return;
  cerrarJuegoActual();
  quitarResultado();
  raiz.classList.remove('sala--on');
  raiz.hidden = true;
  document.body.classList.remove('sin-scroll');
  document.removeEventListener('keydown', alTeclear);
  FX.pararMusica();
}

function alTeclear(e) {
  if (e.key === 'Escape' && raiz && !activo && !resultado) cerrarSala();
}

function construir() {
  raiz = document.createElement('div');
  raiz.className = 'sala';
  raiz.hidden = true;
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-labelledby', 'sala-titulo');
  raiz.innerHTML = `
    <div class="sala__bg" aria-hidden="true"></div>
    <header class="sala__top">
      <div class="sala__marca">
        <span class="sala__logo" aria-hidden="true">🕹️</span>
        <div>
          <b id="sala-titulo">SALA ARCADE</b>
          <small>MR. LOLO · ZONA GAMER</small>
        </div>
      </div>
      <div class="sala__yo">
        <button class="sala__avatar" type="button" data-sala="perfil" aria-label="Mi perfil">🍭</button>
        <div class="sala__nivel">
          <span><b data-sala-txt="nivel">Nv. 1</b><i data-sala-txt="xp">0 XP</i></span>
          <span class="sala__barra"><u data-sala-barra></u></span>
        </div>
        <span class="sala__fichas" data-sala-txt="fichas">🪙 0</span>
      </div>
      <button class="sala__x sala__x--sonido" type="button" data-sala="sonido" aria-label="Activar o silenciar el sonido">${FX.silenciado ? '🔇' : '🔊'}</button>
      <button class="sala__x" type="button" data-sala="cerrar" aria-label="Cerrar la sala">✕</button>
    </header>
    <nav class="sala__tabs" aria-label="Secciones de la sala">
      <button type="button" data-tab="arcade">🕹️ Arcade</button>
      <button type="button" data-tab="ranking">🏆 Los mejores</button>
      <button type="button" data-tab="logros">🎖️ Logros</button>
    </nav>
    <div class="sala__cuerpo" data-sala-cuerpo></div>
    <div class="sala__pie">
      <span data-sala-live>● SALA LOCAL</span>
      <span>Hecho para jugar en el recreo 🍬</span>
    </div>
  `;
  document.body.append(raiz);
  engancharSala();
}

/* --------------------------------------------------------------------------
   Render general
   -------------------------------------------------------------------------- */
function render() {
  if (!raiz) return;
  const cuerpo = $('[data-sala-cuerpo]', raiz);

  $('[data-sala="perfil"]', raiz).textContent = perfil.avatar;
  $('[data-sala-txt="nivel"]', raiz).textContent = `Nv. ${nivelDe(perfil.xp)}`;
  $('[data-sala-txt="xp"]', raiz).textContent = `${num(xpDelNivel(perfil.xp))}/300 XP`;
  $('[data-sala-txt="fichas"]', raiz).textContent = `🪙 ${num(perfil.fichas)}`;
  $('[data-sala-barra]', raiz).style.width = `${Math.min(100, (xpDelNivel(perfil.xp) / 300) * 100)}%`;
  const vivo = deps?.nube?.activa?.();
  $('[data-sala-live]', raiz).innerHTML = vivo
    ? `<b class="on">● EN VIVO</b> · ranking compartido`
    : `● SALA LOCAL <em>· conectá la nube para competir</em>`;

  raiz.querySelectorAll('[data-tab]').forEach((b) => {
    b.classList.toggle('on', b.dataset.tab === tab);
    b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });

  if (tab === 'arcade') cuerpo.innerHTML = vistaArcade();
  else if (tab === 'ranking') { cuerpo.innerHTML = vistaRanking(); cargarRanking(); }
  else cuerpo.innerHTML = vistaLogros();
}

function vistaArcade() {
  const reto = retoDeHoy();
  return `
    <section class="reto${reto.cumplido ? ' reto--ok' : ''}">
      <div class="reto__ico">${reto.cumplido ? '✅' : '🎯'}</div>
      <div class="reto__txt">
        <b>RETO DE HOY${reto.cumplido ? ' · COMPLETADO' : ''}</b>
        <p>Jugá <strong>${esc(reto.juego.nombre)}</strong> y hacé <strong>${num(reto.meta)}</strong> puntos.</p>
      </div>
      <div class="reto__premio"><span>🪙</span><b>+${reto.premio}</b><small>fichas</small></div>
      <button class="btn btn--primary btn--mini" type="button" data-jugar="${reto.juego.id}"${reto.cumplido ? ' disabled' : ''}>
        ${reto.cumplido ? 'Hecho' : 'Ir a jugar'}
      </button>
    </section>

    <div class="sala__seccion">
      <h3>ELEGÍ TU GABINETE</h3>
      <span>${JUEGOS.length} juegos · todos gratis</span>
    </div>

    <div class="cabinets">
      ${JUEGOS.map((j, i) => {
        const rec = perfil.records[j.id];
        const jugado = rec && rec.puntos > 0;
        return `
        <button class="cab${jugado ? ' cab--jugado' : ''}" type="button" data-jugar="${j.id}" style="--c:${j.color}">
          <span class="cab__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="cab__tag">${j.tag}</span>
          <span class="cab__ico" aria-hidden="true">${j.icono}</span>
          <b class="cab__nombre">${esc(j.nombre)}</b>
          <small class="cab__desc">${esc(j.desc)}</small>
          <span class="cab__pie">
            <em>${rec ? `🏆 ${num(rec.puntos)}` : 'Sin jugar'}</em>
            <u>JUGAR <span aria-hidden="true">▶</span></u>
          </span>
          <span class="cab__glow" aria-hidden="true"></span>
        </button>`;
      }).join('')}
    </div>

    <p class="sala__nota">
      🕹️ Se juega con el dedo o con las flechas. Los puntajes se guardan en este dispositivo${
        deps?.nube?.activa?.() ? ' y se comparten con la sala global.' : '.'
      }
    </p>
  `;
}

function vistaRanking() {
  const opciones = [{ id: 'general', nombre: 'TOP GENERAL', icono: '🌟' }, ...JUEGOS.map((j) => ({ id: j.id, nombre: j.corto, icono: j.icono }))];
  return `
    <div class="sala__seccion">
      <h3>LOS MEJORES</h3>
      <span>${deps?.nube?.activa?.() ? 'entre todos los que juegan' : 'en este dispositivo'}</span>
    </div>
    <div class="cats cats--sala">
      ${opciones.map((o) => `<button type="button" role="tab" data-ranking="${o.id}" aria-selected="${rankingJuego === o.id}">${o.icono} ${o.nombre}</button>`).join('')}
    </div>
    <div class="ranking" data-ranking-lista>
      <p class="ranking__cargando">Buscando los puntajes…</p>
    </div>
    <div class="ranking__pie">
      <button class="btn btn--ghost btn--mini" type="button" data-sala="refrescar">🔄 Actualizar</button>
      ${deps?.nube?.activa?.()
        ? '<span>Tardan unos segundos en aparecer.</span>'
        : '<span>Para competir entre celulares, conectá la nube en ⚙️ Panel → Nube.</span>'}
    </div>
  `;
}

function vistaLogros() {
  const ganados = LOGROS.filter((l) => perfil.logros.includes(l.id)).length;
  return `
    <div class="sala__seccion">
      <h3>LOGROS</h3>
      <span>${ganados}/${LOGROS.length} desbloqueados</span>
    </div>
    <div class="logros">
      ${LOGROS.map((l) => {
        const ok = perfil.logros.includes(l.id);
        return `
        <div class="logro${ok ? ' logro--ok' : ''}">
          <span class="logro__ico">${ok ? l.icono : '🔒'}</span>
          <div><b>${esc(l.nombre)}</b><small>${esc(l.desc)}</small></div>
          ${ok ? '<em>✓</em>' : ''}
        </div>`;
      }).join('')}
    </div>
    <div class="perfil-caja">
      <div class="perfil-caja__fila"><span>Partidas jugadas</span><b>${num(perfil.jugadas)}</b></div>
      <div class="perfil-caja__fila"><span>Puntos totales</span><b>${num(perfil.total)}</b></div>
      <div class="perfil-caja__fila"><span>Fichas</span><b>${num(perfil.fichas)}</b></div>
      <div class="perfil-caja__fila"><span>Nombre</span><b>${esc(nombreJugador())}</b></div>
      <button class="btn btn--ghost btn--mini" type="button" data-sala="perfil">✏️ Editar mi perfil</button>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   Ranking
   -------------------------------------------------------------------------- */
async function cargarRanking() {
  const cont = $('[data-ranking-lista]', raiz);
  if (!cont || esperandoRanking) return;
  esperandoRanking = true;
  const clave = rankingJuego;
  const cache = rankingCache.get(clave);
  if (cache && Date.now() - cache.cuando < 30000) {
    cont.innerHTML = tablaRanking(cache.filas);
    esperandoRanking = false;
    return;
  }

  let filas = [];
  if (deps?.nube?.activa?.()) {
    try {
      if (clave === 'general') {
        const crudo = await deps.nube.ranking('', 60);
        filas = agruparGeneral(crudo);
      } else {
        filas = await deps.nube.ranking(clave, 12);
      }
    } catch {
      filas = [];
    }
  }

  if (!filas.length) filas = rankingLocal(clave);
  rankingCache.set(clave, { filas, cuando: Date.now() });
  if (cont.isConnected && rankingJuego === clave) cont.innerHTML = tablaRanking(filas, clave);
  esperandoRanking = false;
}

function agruparGeneral(filas) {
  const porNombre = new Map();
  filas.forEach((f) => {
    const clave = `${f.nombre || 'Invitado'}`;
    const actual = porNombre.get(clave) || { nombre: f.nombre, avatar: f.avatar, puntos: 0, juegos: 0 };
    actual.puntos += Number(f.puntos) || 0;
    actual.juegos += 1;
    porNombre.set(clave, actual);
  });
  return [...porNombre.values()].sort((a, b) => b.puntos - a.puntos).slice(0, 10);
}

function rankingLocal(juego) {
  if (juego === 'general') {
    return Object.entries(perfil.records)
      .map(([id, r]) => {
        const spec = JUEGOS.find((j) => j.id === id);
        return { nombre: nombreJugador(), avatar: perfil.avatar, juego: spec?.nombre || id, puntos: r.puntos };
      })
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 10);
  }
  const r = perfil.records[juego];
  if (!r) return [];
  return [{ nombre: nombreJugador(), avatar: perfil.avatar, puntos: r.puntos }];
}

function tablaRanking(filas, clave = rankingJuego) {
  if (!filas.length) {
    return `
      <div class="ranking__vacio">
        <b>🏅 Todavía no hay puntajes</b>
        <p>${clave === 'general' ? 'Jugá una partida y quedate con el primer puesto.' : 'Sé el primero en dejar tu marca en este juego.'}</p>
        <button class="btn btn--primary btn--mini" type="button" data-jugar="${clave === 'general' ? 'arkanoid' : clave}">Jugar ahora</button>
      </div>`;
  }
  return `
    <ol class="ranking__lista">
      ${filas.map((f, i) => {
        const medalla = ['🥇', '🥈', '🥉'][i] || `<span>${i + 1}</span>`;
        const mio = (f.nombre || '') === nombreJugador();
        return `
        <li class="${mio ? 'ranking__yo' : ''}">
          <em class="ranking__puesto">${medalla}</em>
          <span class="ranking__avatar">${esc(f.avatar || '🍬')}</span>
          <b>${esc(f.nombre || 'Invitado')}</b>
          ${f.juego && clave === 'general' ? `<small>${esc(f.juego)}</small>` : ''}
          <u>${num(f.puntos)}</u>
        </li>`;
      }).join('')}
    </ol>
    ${clave !== 'general' && perfil.records[clave]
      ? `<p class="ranking__mio">Tu mejor: <b>${num(perfil.records[clave].puntos)}</b> puntos</p>`
      : ''}
  `;
}

/* --------------------------------------------------------------------------
   Jugar
   -------------------------------------------------------------------------- */
async function jugar(id) {
  const spec = JUEGOS.find((j) => j.id === id);
  if (!spec || activo) return;
  if (resultado) quitarResultado();

  raiz.classList.add('sala--jugando');
  await FX.cine({
    icono: spec.icono,
    titulo: spec.nombre.toUpperCase(),
    color: spec.color,
    sub: spec.tag,
  });
  FX.musica(spec.id);
  const recordPrevio = perfil.records[id]?.puntos || 0;

  let controles = null;
  const comunes = {
    sonar: deps.sonar,
    vibrar: deps.vibrar,
    record: recordPrevio,
    productos: deps.productos?.() || [],
    alTerminar: (puntos, extra = {}) => alTerminarPartida(spec, puntos, extra),
    alSalir: () => {
      if (activo === controles) {
        activo = null;
        raiz.classList.remove('sala--jugando');
        FX.musica('sala');
      }
    },
  };

  try {
    if (spec.cargar) {
      const iniciar = await spec.cargar();
      controles = iniciar(comunes);
    } else if (id === 'tetris') {
      controles = await deps.iniciarTetris?.(comunes);
    } else if (id === 'caramelos') {
      controles = deps.iniciarCaramelos?.(comunes);
    }
    if (!controles) throw new Error('sin juego');
    activo = controles;
    deps.sonar?.(520, 0.06);
  } catch {
    raiz.classList.remove('sala--jugando');
    deps.toast?.('No pudimos abrir ese juego 😕 Probá de nuevo.');
  }
}

function cerrarJuegoActual() {
  const j = activo;
  activo = null;
  try { j?.cerrar?.(); } catch { /* ignorado */ }
  raiz?.classList.remove('sala--jugando');
  FX.musica('sala');
}

function alTerminarPartida(spec, puntos, extra = {}) {
  const limpio = Math.max(0, Math.round(Number(puntos) || 0));
  const anterior = perfil.records[spec.id]?.puntos || 0;
  const nuevoRecord = limpio > anterior;

  // Cerrar el juego sin volver a entrar en alSalir.
  const j = activo;
  activo = null;
  try { j?.cerrar?.(); } catch { /* ignorado */ }
  raiz.classList.remove('sala--jugando');

  const nivelExtra = Number(extra.nivel) || 0;
  if (limpio > 0 || nivelExtra) {
    perfil.records[spec.id] = {
      puntos: Math.max(limpio, anterior),
      nivel: Math.max(nivelExtra, perfil.records[spec.id]?.nivel || 0),
      intentos: extra.intentos || perfil.records[spec.id]?.intentos,
      fecha: Date.now(),
    };
  }

  const xp = Math.max(10, Math.round(limpio / 8) + (nuevoRecord ? 25 : 0));
  const fichas = Math.max(2, Math.round(limpio / 18) + (nuevoRecord ? 10 : 0));
  perfil.xp += xp;
  perfil.fichas += fichas;
  perfil.jugadas += 1;
  perfil.total += limpio;

  const reto = retoDeHoy();
  let retoHecho = false;
  if (!reto.cumplido && reto.juego.id === spec.id && limpio >= reto.meta) {
    perfil.fichas += reto.premio;
    retoHecho = true;
    try {
      localStorage.setItem(CLAVE_RETO, JSON.stringify({ fecha: hoy(), juego: spec.id }));
    } catch { /* ignorado */ }
  }

  const antes = [...perfil.logros];
  LOGROS.forEach((l) => {
    if (!perfil.logros.includes(l.id)) {
      try {
        if (l.comprobar(perfil)) perfil.logros.push(l.id);
      } catch { /* comprobación rota */ }
    }
  });
  const nuevos = perfil.logros.filter((id) => !antes.includes(id));

  guardarPerfil();
  resultado = {
    juego: spec,
    puntos: limpio,
    anterior,
    nuevoRecord,
    mejor: perfil.records[spec.id]?.puntos || limpio,
    xp,
    fichas,
    nivel: nivelDe(perfil.xp),
    logros: nuevos.map((id) => LOGROS.find((l) => l.id === id)).filter(Boolean),
    retoHecho,
    premio: deps.premioActual?.() || null,
  };

  if (limpio > 0 && deps?.nube?.activa?.()) {
    deps.nube.enviarPuntaje({
      juego: spec.id,
      puntos: limpio,
      nombre: nombreJugador(),
      avatar: perfil.avatar,
    }).catch(() => { /* si falla, queda local */ });
    rankingCache.delete(spec.id);
    rankingCache.delete('general');
  }

  // Efectos de festejo
  if (nuevoRecord && limpio > 0) {
    deps.sonar?.(880, 0.09);
    setTimeout(() => deps.sonar?.(1180, 0.09), 110);
    setTimeout(() => deps.sonar?.(1480, 0.16), 220);
    deps.vibrar?.([25, 40, 25, 40, 60]);
    FX.sfx('record');
    FX.confeti(110, [spec.color, '#FFE600', '#FFFFFF', '#00FF88']);
    FX.destello('255,230,0', 0.42);
  }

  FX.musica('sala');
  render();
  mostrarResultado();
}

/* --------------------------------------------------------------------------
   Resultado
   -------------------------------------------------------------------------- */
function mostrarResultado() {
  if (!resultado || !raiz) return;
  const r = resultado;
  raiz.querySelector('.res')?.remove();
  const capa = document.createElement('div');
  capa.className = 'res';
  capa.innerHTML = `
    <div class="res__card" role="dialog" aria-modal="true" aria-label="Resultado de la partida">
      <div class="res__brillo" aria-hidden="true"></div>
      <span class="res__etiqueta">${r.nuevoRecord ? '🏆 NUEVO RÉCORD' : 'PARTIDA TERMINADA'}</span>
      <span class="res__ico" style="--c:${r.juego.color}">${r.juego.icono}</span>
      <h3>${esc(r.juego.nombre)}</h3>
      <p class="res__puntos">${num(r.puntos)}</p>
      <p class="res__mejor">${r.nuevoRecord ? `¡Superaste tu marca de ${num(r.anterior)}!` : `Tu récord sigue en ${num(r.mejor)}`}</p>
      <div class="res__stats">
        <span><b>+${num(r.xp)}</b><small>XP</small></span>
        <span><b>+${num(r.fichas)}</b><small>FICHAS</small></span>
        <span><b>${r.nivel}</b><small>NIVEL</small></span>
      </div>
      ${r.retoHecho ? `<p class="res__reto">🎯 ¡Reto del día completado! +60 fichas</p>` : ''}
      ${r.logros.length
        ? `<div class="res__logros">${r.logros.map((l) => `<span>${l.icono} ${esc(l.nombre)}</span>`).join('')}</div>`
        : ''}
      ${r.premio?.caramelos > 0 && r.puntos >= r.premio.caramelos
        ? `<p class="res__premio">🎁 ¡Ganaste ${esc(r.premio.texto || 'un premio')}! Mostrale la pantalla a quien atiende.</p>`
        : ''}
      <div class="res__acciones">
        <button class="btn btn--primary" type="button" data-res="otra">🔁 Jugar otra vez</button>
        <button class="btn btn--ghost" type="button" data-res="ranking">🏆 Ver ranking</button>
        <button class="btn btn--ghost" type="button" data-res="volver">Volver a la sala</button>
      </div>
    </div>`;
  raiz.append(capa);
  requestAnimationFrame(() => capa.classList.add('res--on'));
  capa.querySelector('[data-res="otra"]')?.focus();
}

function quitarResultado() {
  raiz?.querySelector('.res')?.remove();
  resultado = null;
}

/* --------------------------------------------------------------------------
   Perfil editable
   -------------------------------------------------------------------------- */
function abrirPerfil() {
  if (!raiz) return;
  const capa = document.createElement('div');
  capa.className = 'perfil';
  capa.innerHTML = `
    <div class="perfil__card" role="dialog" aria-modal="true" aria-label="Mi perfil">
      <div class="dlg-head">
        <h2>Mi perfil</h2>
        <button class="dlg-close" type="button" data-perfil="cerrar" aria-label="Cerrar">✕</button>
      </div>
      <div class="field">
        <label for="perfil-nombre">¿CÓMO TE LLAMÁS?</label>
        <input id="perfil-nombre" maxlength="18" value="${esc(perfil.nombre)}" placeholder="Tu nombre o apodo" autocomplete="nickname">
        <span class="field__hint">Aparece en el ranking cuando jugás con la nube conectada.</span>
      </div>
      <div class="field">
        <label>ELEGÍ TU CARA</label>
        <div class="perfil__avatares">
          ${AVATARES.map((a) => `<button type="button" data-avatar="${a}" class="${perfil.avatar === a ? 'on' : ''}" aria-label="Avatar ${a}">${a}</button>`).join('')}
        </div>
      </div>
      <div class="perfil__resumen">
        <span>Nv. ${nivelDe(perfil.xp)}</span>
        <span>${num(perfil.xp)} XP</span>
        <span>🪙 ${num(perfil.fichas)}</span>
        <span>${num(perfil.jugadas)} partidas</span>
      </div>
      <div class="dlg-actions">
        <button class="btn btn--primary" type="button" data-perfil="guardar">Guardar</button>
        <button class="btn btn--ghost" type="button" data-perfil="cerrar">Listo</button>
      </div>
    </div>`;
  raiz.append(capa);
  requestAnimationFrame(() => capa.classList.add('perfil--on'));
  setTimeout(() => capa.querySelector('#perfil-nombre')?.focus(), 80);

  capa.addEventListener('input', (e) => {
    if (e.target.id === 'perfil-nombre') perfil.nombre = e.target.value.slice(0, 18);
  });
  capa.addEventListener('click', (e) => {
    const avatar = e.target.closest('[data-avatar]');
    if (avatar) {
      perfil.avatar = avatar.dataset.avatar;
      capa.querySelectorAll('[data-avatar]').forEach((b) => b.classList.toggle('on', b === avatar));
      return;
    }
    const accion = e.target.closest('[data-perfil]')?.dataset.perfil;
    if (!accion) return;
    if (accion === 'guardar') {
      guardarPerfil();
      deps.toast?.('Perfil guardado ✅');
      capa.remove();
      render();
    } else if (accion === 'cerrar') {
      guardarPerfil();
      capa.remove();
      render();
    }
  });
}

/* --------------------------------------------------------------------------
   Delegación de eventos
   -------------------------------------------------------------------------- */
export function engancharSala() {
  if (!raiz) return;
  raiz.addEventListener('click', (e) => {
    const jugarBtn = e.target.closest('[data-jugar]');
    if (jugarBtn) {
      jugar(jugarBtn.dataset.jugar);
      return;
    }

    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      tab = tabBtn.dataset.tab;
      render();
      return;
    }

    const rankingBtn = e.target.closest('[data-ranking]');
    if (rankingBtn) {
      rankingJuego = rankingBtn.dataset.ranking;
      render();
      return;
    }

    const accion = e.target.closest('[data-sala]')?.dataset.sala;
    if (accion === 'cerrar') cerrarSala();
    else if (accion === 'sonido') {
      const apagado = FX.alternarSonido();
      const boton = raiz.querySelector('[data-sala="sonido"]');
      if (boton) boton.textContent = apagado ? '🔇' : '🔊';
    } else if (accion === 'perfil') abrirPerfil();
    else if (accion === 'refrescar') {
      rankingCache.clear();
      render();
    }

    const res = e.target.closest('[data-res]')?.dataset.res;
    if (res) {
      const juegoId = resultado?.juego?.id;
      quitarResultado();
      if (res === 'otra' && juegoId) jugar(juegoId);
      else if (res === 'ranking') { tab = 'ranking'; render(); }
      else render();
    }
  });
}

export { JUEGOS, LOGROS };
