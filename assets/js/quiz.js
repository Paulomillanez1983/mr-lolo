/* ==========================================================================
   MR. LOLO — "EL DESAFÍO" (Quiz v4)
   --------------------------------------------------------------------------
   El juego que pidió el usuario:
     1. Ruleta que gira y cae en un tema
     2. Elegís el modo (rápida / intensa / muerte súbita)
     3. Frame de impacto
     4. Adivinanzas con imagen bien encuadrada
     5. Termina y vuelve a la sala

   Temas: MISTERIO · PRECIOS · LA CUENTA · MEMORIA · MÚSICA · LA TIENDA
   Todo con los productos y precios reales. Sin preguntas de relleno.
   ========================================================================== */

import { FX } from './fx.js';

const LETRAS = ['A', 'B', 'C'];

const TEMAS = [
  { id: 'misterio', nombre: 'MISTERIO', icono: '🔍', color: '#C24BFF', desc: 'Adiviná por la pista' },
  { id: 'precios', nombre: 'PRECIOS', icono: '💸', color: '#00FF88', desc: 'Cuentas del recreo' },
  { id: 'cuenta', nombre: 'LA CUENTA', icono: '🧾', color: '#00B1EA', desc: 'Sumá la cesta' },
  { id: 'memoria', nombre: 'MEMORIA', icono: '🧠', color: '#FF5C7A', desc: 'Mirá y recordá' },
  { id: 'musica', nombre: 'MÚSICA', icono: '🎵', color: '#FF9500', desc: 'Adiviná la melodía' },
  { id: 'tienda', nombre: 'LA TIENDA', icono: '🏪', color: '#FFE600', desc: 'Conocé la góndola' },
];

const MODOS = [
  { id: 'rapida', nombre: 'RÁPIDA', tiempo: 15, mult: 1, vidas: 2, detalle: '5 preguntas · 15s · x1' },
  { id: 'intensa', nombre: 'INTENSA', tiempo: 9, mult: 2, vidas: 2, detalle: '5 preguntas · 9s · x2' },
  { id: 'letal', nombre: 'MUERTE SÚBITA', tiempo: 6, mult: 3, vidas: 1, detalle: '5 preguntas · 6s · x3' },
];

const ACERTIJOS = [
  { producto: 'Alfajor Havanna', texto: 'Dos tapas, dulce de leche y un baño de chocolate. Soy el clásico argentino del recreo.', visual: 'zoom' },
  { producto: 'Mogul', texto: 'Somos ositos de colores, masticables y frutales. Venimos en bolsa.', visual: 'sombra' },
  { producto: 'Lays Clásicas', texto: 'Soy salada, crocante y vengo en una bolsa amarilla.', visual: 'zoom' },
  { producto: 'Coca-Cola Lata', texto: 'Soy negra, con burbujas y siempre fría.', visual: 'sombra' },
  { producto: 'Oreo Pack', texto: 'Dos galletas negras con crema blanca en el medio.', visual: 'zoom' },
  { producto: 'Beldent', texto: 'Soy chicle de menta y vengo en una cajita.', visual: 'sombra' },
];

const TIENDA = [
  { texto: 'Soy el más caro de la góndola. ¿Cuál soy?', correcta: 'Lays Clásicas', otros: ['Alfajor Havanna', 'Coca-Cola Lata'] },
  { texto: 'Soy el más barato. ¿Cuál soy?', correcta: 'Beldent', otros: ['Mogul', 'Oreo Pack'] },
  { texto: 'Tengo burbujas y soy negro. ¿Cuál soy?', correcta: 'Coca-Cola Lata', otros: ['Mogul', 'Oreo Pack'] },
  { texto: 'Vengo en caja y soy de menta. ¿Cuál soy?', correcta: 'Beldent', otros: ['Alfajor Havanna', 'Lays Clásicas'] },
  { texto: 'Soy de chocolate y tengo crema blanca. ¿Cuál soy?', correcta: 'Oreo Pack', otros: ['Mogul', 'Lays Clásicas'] },
  { texto: 'Tengo dulce de leche y galletas. ¿Cuál soy?', correcta: 'Alfajor Havanna', otros: ['Oreo Pack', 'Beldent'] },
];

const NOTAS = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392, A: 440, B: 493.88, C5: 523.25 };

const MELODIAS = [
  { nombre: 'Estrellita', notas: ['C', 'C', 'G', 'G', 'A', 'A', 'G', 'F', 'F', 'E', 'E', 'D', 'D', 'C'] },
  { nombre: 'Cumpleaños feliz', notas: ['G', 'G', 'A', 'G', 'C5', 'B', 'G', 'G', 'A', 'G', 'D', 'C5'] },
  { nombre: 'María tenía un corderito', notas: ['E', 'D', 'C', 'D', 'E', 'E', 'E', 'D', 'D', 'D', 'E', 'G', 'G'] },
  { nombre: 'Jingle Bells', notas: ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'G', 'C', 'D', 'E'] },
  { nombre: 'El granjero', notas: ['G', 'G', 'G', 'D', 'E', 'E', 'D', 'B', 'B', 'A', 'A', 'G'] },
];

const mezclar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dinero = (n) => `$${new Intl.NumberFormat('es-AR').format(Math.round(n))}`;
const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];

export function iniciarQuiz(opciones = {}) {
  const {
    sonar = () => {},
    vibrar = () => {},
    alTerminar = () => {},
    alSalir = () => {},
    record = 0,
    productos = [],
  } = opciones;

  const catalogo = productos.filter((p) => p?.nombre && Number(p.precio) > 0);
  const porNombre = (n) => catalogo.find((p) => p.nombre === n);

  const raiz = document.createElement('div');
  raiz.className = 'quiz quiz--v4';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'El Desafío de Mr. LOLO');
  raiz.innerHTML = `
    <div class="quiz__fondo" aria-hidden="true"><span></span><span></span><span></span></div>

    <header class="quiz__top">
      <span class="quiz__brand">🍬 EL DESAFÍO</span>
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
          ${TEMAS.map((t, i) => `<span style="--a:${i * 60 + 30}deg"><i>${t.icono} ${t.nombre}</i></span>`).join('')}
          <b class="quiz__hub">MR<br>LOLO</b>
        </div>
        <button class="quiz__girar" type="button" data-quiz="girar">GIRAR</button>
      </div>
      <p class="quiz__rueda-msg" data-quiz="rueda-msg">6 temas · 5 preguntas · 2 vidas</p>
    </section>

    <section class="quiz__modos" data-quiz="modos" hidden>
      <span class="quiz__kicker" data-quiz="tema-kicker">TE TOCÓ</span>
      <h2 data-quiz="tema-nombre">MISTERIO</h2>
      <p data-quiz="tema-desc">Adiviná por la pista</p>
      <div class="quiz__modos-lista" data-quiz="modos-lista"></div>
      <button class="quiz__volver" type="button" data-quiz="girar-otra">↺ Girar de nuevo</button>
    </section>

    <section class="quiz__juego" data-quiz="juego" hidden>
      <div class="quiz__barra-ronda">
        <span data-quiz="ronda-nombre">MISTERIO</span>
        <div class="quiz__pips" data-quiz="pips"></div>
        <em data-quiz="ronda-mult">x1</em>
      </div>
      <div class="quiz__escenario">
        <div class="quiz__imagen" data-quiz="imagen"></div>
        <span class="quiz__marca" data-quiz="marca">PISTA</span>
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
      <b data-quiz="corte-txt">MISTERIO</b>
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
  let modo = MODOS[0];
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
  let timersAudio = [];
  let cerrado = false;
  let girando = false;

  /* --- Utilidades -------------------------------------------------------- */
  function opcionesTexto(correcta, otras) {
    const opciones = mezclar([correcta, ...otras.filter((o) => o !== correcta)]);
    return { opciones, correctaIdx: opciones.indexOf(correcta) };
  }

  function opcionesNumero(correcta, deltas = [100, 200, 300]) {
    const valores = new Set([correcta]);
    for (const d of mezclar(deltas)) {
      if (valores.size >= 3) break;
      const v = correcta + (Math.random() < 0.5 ? -d : d);
      if (v > 0) valores.add(v);
    }
    let extra = 50;
    while (valores.size < 3) { valores.add(correcta + extra); extra += 50; }
    const opciones = mezclar([...valores].slice(0, 3));
    return { opciones, correctaIdx: opciones.indexOf(correcta) };
  }

  function qVisual(producto, tipo = 'foto') {
    return { tipo, producto };
  }

  /* --- Contenido por tema ------------------------------------------------ */
  function preguntasMisterio() {
    return mezclar(ACERTIJOS).slice(0, 5).map((a) => {
      const p = porNombre(a.producto) || alAzar(catalogo);
      const otros = mezclar(catalogo.filter((x) => x.nombre !== p.nombre)).slice(0, 2).map((x) => x.nombre);
      const { opciones, correctaIdx } = opcionesTexto(p.nombre, otros);
      return {
        tema: 'MISTERIO',
        pregunta: `“${a.texto}” ¿Quién soy?`,
        visual: qVisual(p, a.visual),
        opciones, correctaIdx,
        dato: `Era ${p.nombre}, ${dinero(p.precio)}.`,
        pista: 'La imagen está recortada a propósito.',
      };
    });
  }

  function preguntasTienda() {
    return mezclar(TIENDA).slice(0, 5).map((t) => {
      const p = porNombre(t.correcta) || alAzar(catalogo);
      const { opciones, correctaIdx } = opcionesTexto(t.correcta, t.otros);
      const elegidos = opciones.map((n) => porNombre(n)).filter(Boolean);
      return {
        tema: 'LA TIENDA',
        pregunta: t.texto,
        visual: { tipo: 'estante', productos: elegidos },
        opciones, correctaIdx,
        dato: `${p.nombre} sale ${dinero(p.precio)}.`,
      };
    });
  }

  function preguntasPrecios() {
    const lista = [];
    const p1 = alAzar(catalogo);
    const pago1 = p1.precio <= 1000 ? 2000 : 2000;
    const vuelto1 = pago1 - p1.precio;
    {
      const { opciones, correctaIdx } = opcionesNumero(p1.precio, [100, 300, 500]);
      lista.push({
        tema: 'PRECIOS',
        pregunta: `Pagué con ${dinero(pago1)} y me dieron ${dinero(vuelto1)} de vuelto. ¿Qué compré?`,
        visual: qVisual(p1, 'foto'),
        opciones: opciones.map(dinero), correctaIdx,
        dato: `${dinero(pago1)} − ${dinero(vuelto1)} = ${dinero(p1.precio)}.`,
      });
    }
    {
      const p = alAzar(catalogo);
      const total = p.precio * 2;
      const { opciones, correctaIdx } = opcionesNumero(total, [100, 200, 400]);
      lista.push({
        tema: 'PRECIOS',
        pregunta: `Compré 2 ${p.nombre}. ¿Cuánto gasté?`,
        visual: qVisual(p, 'foto'),
        opciones: opciones.map(dinero), correctaIdx,
        dato: `${dinero(p.precio)} × 2 = ${dinero(total)}.`,
      });
    }
    {
      const caros = mezclar(catalogo).slice(0, 3);
      const caro = [...caros].sort((a, b) => b.precio - a.precio)[0];
      const opciones = mezclar(caros.map((p) => p.nombre));
      lista.push({
        tema: 'PRECIOS',
        pregunta: '¿Cuál de estos tres sale más caro?',
        visual: { tipo: 'grupo', productos: caros },
        opciones, correctaIdx: opciones.indexOf(caro.nombre),
        dato: `${caro.nombre}: ${dinero(caro.precio)}.`,
      });
    }
    {
      const barato = [...catalogo].sort((a, b) => a.precio - b.precio)[0];
      const otros = mezclar(catalogo.filter((p) => p.nombre !== barato.nombre)).slice(0, 2);
      const opciones = mezclar([barato, ...otros].map((p) => p.nombre));
      lista.push({
        tema: 'PRECIOS',
        pregunta: `Con ${dinero(1000)} alcanza justo para uno solo. ¿Cuál?`,
        visual: { tipo: 'grupo', productos: [barato, ...otros] },
        opciones, correctaIdx: opciones.indexOf(barato.nombre),
        dato: `${barato.nombre} sale ${dinero(barato.precio)}.`,
      });
    }
    {
      const caro = [...catalogo].sort((a, b) => b.precio - a.precio)[0];
      const barato = [...catalogo].sort((a, b) => a.precio - b.precio)[0];
      const dif = caro.precio - barato.precio;
      const { opciones, correctaIdx } = opcionesNumero(dif, [100, 200, 300]);
      lista.push({
        tema: 'PRECIOS',
        pregunta: `¿Cuánto más sale ${caro.nombre} que ${barato.nombre}?`,
        visual: { tipo: 'grupo', productos: [caro, barato] },
        opciones: opciones.map(dinero), correctaIdx,
        dato: `${dinero(caro.precio)} − ${dinero(barato.precio)} = ${dinero(dif)}.`,
      });
    }
    return lista;
  }

  function preguntasCuenta() {
    const lista = [];
    for (let i = 0; i < 5; i += 1) {
      const items = mezclar(catalogo).slice(0, 2);
      const cantidades = [1 + (i % 2), 1 + ((i + 1) % 2)];
      const total = items.reduce((s, p, k) => s + p.precio * cantidades[k], 0);
      const { opciones, correctaIdx } = opcionesNumero(total, [100, 200, 400]);
      lista.push({
        tema: 'LA CUENTA',
        pregunta: `Llevás ${cantidades[0]} ${items[0].nombre} y ${cantidades[1]} ${items[1].nombre}. ¿Cuánto pagás?`,
        visual: { tipo: 'grupo', productos: items, cantidades },
        opciones: opciones.map(dinero), correctaIdx,
        dato: `La cuenta da ${dinero(total)}.`,
      });
    }
    return mezclar(lista).slice(0, 5);
  }

  function preguntasMemoria() {
    return mezclar(catalogo).slice(0, 5).map((p) => {
      const otros = mezclar(catalogo.filter((x) => x.nombre !== p.nombre)).slice(0, 2).map((x) => x.nombre);
      const { opciones, correctaIdx } = opcionesTexto(p.nombre, otros);
      return {
        tema: 'MEMORIA',
        pregunta: 'La viste un segundo y medio. ¿Cuál era?',
        visual: qVisual(p, 'flash'),
        opciones, correctaIdx,
        dato: `Era ${p.nombre}.`,
      };
    });
  }

  function preguntasMusica() {
    return mezclar(MELODIAS).slice(0, 5).map((m, i) => {
      const otras = mezclar(MELODIAS.filter((x) => x.nombre !== m.nombre)).slice(0, 2).map((x) => x.nombre);
      const { opciones, correctaIdx } = opcionesTexto(m.nombre, otras);
      return {
        tema: 'MÚSICA',
        pregunta: 'Escuchá la melodía. ¿Cuál es?',
        visual: { tipo: 'musica', indice: i, melodia: m },
        opciones, correctaIdx,
        dato: `Era “${m.nombre}”.`,
        melodia: m,
      };
    });
  }

  function construirPreguntas(temaId) {
    if (temaId === 'misterio') return preguntasMisterio();
    if (temaId === 'tienda') return preguntasTienda();
    if (temaId === 'precios') return preguntasPrecios().slice(0, 5);
    if (temaId === 'cuenta') return preguntasCuenta();
    if (temaId === 'memoria') return preguntasMemoria();
    return preguntasMusica();
  }

  /* --- Ruleta ------------------------------------------------------------ */
  function girar() {
    if (girando || cerrado) return;
    girando = true;
    elGirar.disabled = true;
    elRuedaMsg.textContent = 'Girando…';
    FX.sfx('whoosh');
    const elegido = Math.floor(Math.random() * TEMAS.length);
    tema = TEMAS[elegido];
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
    elRueda.hidden = true;
    elModos.hidden = false;
    elTemaNombre.textContent = tema.nombre;
    elTemaNombre.style.color = tema.color;
    elTemaDesc.textContent = tema.desc;
    elModosLista.innerHTML = MODOS
      .map(
        (m) => `
        <button type="button" class="quiz__modo" data-modo="${m.id}" style="--c:${tema.color}">
          <b>${m.nombre}</b>
          <small>${m.detalle}</small>
        </button>`
      )
      .join('');
    FX.sfx('moneda');
  }

  function elegirModo(id) {
    modo = MODOS.find((m) => m.id === id) || MODOS[0];
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

  /* --- Juego ------------------------------------------------------------- */
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
    elRondaNombre.textContent = tema.nombre;
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

  function pintarVisual(q) {
    const v = q.visual;
    elImagen.innerHTML = '';
    elImagen.className = 'quiz__imagen';
    elImagen.style.background = `radial-gradient(circle at 50% 32%, ${(v.producto?.color || tema.color)}55, #080B16 72%)`;

    const img = (p, clase = 'quiz__foto') => {
      const el = document.createElement('img');
      el.src = p.imagen;
      el.alt = p.nombre;
      el.className = clase;
      return el;
    };

    if (v.tipo === 'foto' || v.tipo === 'flash') {
      const caja = document.createElement('div');
      caja.className = 'quiz__producto';
      caja.append(img(v.producto));
      elImagen.append(caja);
      if (v.tipo === 'flash') {
        elImagen.classList.add('quiz__imagen--flash');
        flashTimer = setTimeout(() => elImagen.classList.add('quiz__imagen--velada'), 1500);
      }
    } else if (v.tipo === 'zoom') {
      const caja = document.createElement('div');
      caja.className = 'quiz__producto quiz__producto--zoom';
      const im = img(v.producto, 'quiz__foto quiz__foto--zoom');
      im.style.transform = `scale(${2.6 + Math.random() * 0.8})`;
      im.style.transformOrigin = `${25 + Math.random() * 50}% ${25 + Math.random() * 50}%`;
      caja.append(im);
      elImagen.append(caja);
      elImagen.classList.add('quiz__imagen--zoom');
    } else if (v.tipo === 'sombra') {
      const caja = document.createElement('div');
      caja.className = 'quiz__producto';
      caja.append(img(v.producto, 'quiz__foto quiz__foto--sombra'));
      elImagen.append(caja);
    } else if (v.tipo === 'grupo') {
      const fila = document.createElement('div');
      fila.className = 'quiz__grupo';
      v.productos.forEach((p, i) => {
        const caja = document.createElement('div');
        caja.className = 'quiz__grupo-item';
        caja.append(img(p));
        const cant = v.cantidades?.[i];
        if (cant > 1) {
          const badge = document.createElement('span');
          badge.textContent = `x${cant}`;
          caja.append(badge);
        }
        fila.append(caja);
      });
      elImagen.append(fila);
      elImagen.classList.add('quiz__imagen--grupo');
    } else if (v.tipo === 'estante') {
      const fila = document.createElement('div');
      fila.className = 'quiz__grupo quiz__estante';
      v.productos.forEach((p) => {
        const caja = document.createElement('div');
        caja.className = 'quiz__grupo-item';
        caja.append(img(p, 'quiz__foto quiz__foto--borrosa'));
        fila.append(caja);
      });
      elImagen.append(fila);
      elImagen.classList.add('quiz__imagen--grupo');
    } else if (v.tipo === 'musica') {
      const caja = document.createElement('div');
      caja.className = 'quiz__musica';
      caja.innerHTML = `
        <span class="quiz__vinilo"></span>
        <div class="quiz__eq">${Array.from({ length: 7 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
        <button class="quiz__play" type="button" data-quiz="play">🔊 ESCUCHAR</button>`;
      elImagen.append(caja);
      elImagen.classList.add('quiz__imagen--musica');
      tocarMelodia(v.melodia);
    }
  }

  let flashTimer = null;

  function tocarMelodia(m) {
    if (!m) return;
    timersAudio.forEach(clearTimeout);
    timersAudio = [];
    m.notas.forEach((n, i) => {
      timersAudio.push(setTimeout(() => sonar(NOTAS[n] || 440, 0.3, 'triangle'), i * 330));
    });
  }

  function mostrarPregunta() {
    if (indice >= cola.length) {
      terminar();
      return;
    }
    bloqueado = false;
    usadoComodin = false;
    clearTimeout(flashTimer);
    timersAudio.forEach(clearTimeout);
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

    restante = modo.tiempo;
    ultimoTick = 99;
    pintarReloj();
    actualizarComodin();
    corriendo = true;
    ultimo = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(bucle);
  }

  function pintarReloj() {
    const proporcion = Math.max(0, Math.min(1, restante / modo.tiempo));
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
    const fuera = alAzar(malas);
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
    timersAudio.forEach(clearTimeout);

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

    if (acierto) {
      aciertos += 1;
      racha += 1;
      mejorRacha = Math.max(mejorRacha, racha);
      const bonusVel = Math.round((Math.max(0, restante) / modo.tiempo) * 60);
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
      setTimeout(() => { if (!cerrado) terminar(); }, 1400);
      return;
    }

    avanzar = setTimeout(() => {
      if (cerrado) return;
      indice += 1;
      mostrarPregunta();
    }, acierto ? 1150 : 1850);
  }

  function terminar() {
    corriendo = false;
    cancelAnimationFrame(raf);
    clearTimeout(avanzar);
    clearTimeout(flashTimer);
    timersAudio.forEach(clearTimeout);
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
    if (accion === 'play') {
      tocarMelodia(cola[indice]?.melodia);
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
    clearTimeout(flashTimer);
    timersAudio.forEach(clearTimeout);
    document.removeEventListener('keydown', alTeclear);
    raiz.remove();
    alSalir();
  }

  return { cerrar, raiz, pausar: () => { corriendo = false; } };
}
