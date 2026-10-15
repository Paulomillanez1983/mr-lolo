/* ==========================================================================
   MR. LOLO — Aplicación
   --------------------------------------------------------------------------
   Reescritura moderna de la tienda. Cambios grandes respecto de la versión
   anterior del artefacto:

   · Sin dependencias externas: no hay Google Fonts ni scripts de CDN.
   · Los diálogos usan <dialog> nativo (foco atrapado, Esc, backdrop).
   · Se eliminó la dependencia de `window.claude` (API del artefacto de
     Claude) y se reemplazó por un panel de administración local con
     exportar/importar JSON, para poder mantener la tienda sin Claude.
   · Se eliminaron alert/confirm nativos, JSON.parse(JSON.stringify()) y
     el polyfill de backdrop-filter.
   · Service Worker + manifest: se instala como app y funciona sin conexión.
   ========================================================================== */

import { TIENDA, CATEGORIAS, PRODUCTOS, TRIVIA } from './data.js';
// El generador de QR se carga con import() dinámico, solo cuando alguien abre
// el cartel: así no pesa en la primera visita.

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

const num = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const dinero = (n) => '$' + num.format(Math.round(+n || 0));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clonar = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

const vibrar = (ms) => {
  if (navigator.vibrate) {
    try { navigator.vibrate(ms); } catch { /* ignorado */ }
  }
};

const almacen = {
  get(clave, porDefecto = '') {
    try {
      const v = localStorage.getItem(clave);
      return v === null ? porDefecto : v;
    } catch { return porDefecto; }
  },
  set(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch { /* modo privado */ }
  },
  json(clave, porDefecto = null) {
    try {
      const v = localStorage.getItem(clave);
      return v ? JSON.parse(v) : porDefecto;
    } catch { return porDefecto; }
  },
  borrar(clave) {
    try { localStorage.removeItem(clave); } catch { /* ignorado */ }
  },
};

const CLAVES = {
  config: 'mrlolo.config',
  carrito: 'mrlolo.carrito',
  ultimo: 'mrlolo.ultimoPedido',
  nombre: 'mrlolo.nombre',
  retiro: 'mrlolo.retiro',
  sonido: 'mrlolo.sonido',
  puntos: 'mrlolo.puntos',
  triviaDia: 'mrlolo.triviaDia',
  triviaHechos: 'mrlolo.triviaHechos',
  juegoRecord: 'mrlolo.juegoRecord',
  panel: 'mrlolo.panelAbierto',
};

/* --------------------------------------------------------------------------
   Estado
   -------------------------------------------------------------------------- */
const estado = {
  tienda: clonar(TIENDA),
  productos: clonar(PRODUCTOS),
  carrito: {},
  categoria: 'all',
  busqueda: '',
  retiro: almacen.get(CLAVES.retiro, '') || TIENDA.retiro[0],
  nombre: almacen.get(CLAVES.nombre, ''),
  nota: '',
  sonido: almacen.get(CLAVES.sonido, '1') !== '0',
  puntos: Number(almacen.get(CLAVES.puntos, '0')) || 0,
  previa: false,
};

/* Configuración editada desde el panel local (tiene prioridad sobre data.js) */
function aplicarConfigGuardada() {
  const guardado = almacen.json(CLAVES.config, null);
  if (!guardado) return;
  if (guardado.tienda) Object.assign(estado.tienda, guardado.tienda);
  if (Array.isArray(guardado.productos) && guardado.productos.length) estado.productos = guardado.productos;
  if (!estado.tienda.retiro?.includes(estado.retiro)) estado.retiro = estado.tienda.retiro[0];
}

const guardarConfig = () =>
  almacen.set(CLAVES.config, JSON.stringify({ tienda: estado.tienda, productos: estado.productos }));

/* --------------------------------------------------------------------------
   Cálculos
   -------------------------------------------------------------------------- */
const codigo = (i) => String.fromCharCode(65 + Math.floor(i / 3)) + ((i % 3) + 1);

const stockDe = (p) => (p.stock === null || p.stock === undefined || p.stock === '' ? Infinity : Number(p.stock));
const agotado = (p) => Boolean(p.agotado) || stockDe(p) <= 0;

const unidades = () => Object.values(estado.carrito).reduce((a, b) => a + b, 0);
const bruto = () => Object.entries(estado.carrito).reduce((a, [i, q]) => a + q * estado.productos[i].precio, 0);

function descuento() {
  const pr = estado.tienda.promo || {};
  if (!(pr.cantidad > 0) || !(pr.porcentaje > 0)) return 0;
  if (unidades() < pr.cantidad) return 0;
  return Math.round((bruto() * pr.porcentaje) / 100);
}
const total = () => bruto() - descuento();

const productosVisibles = () =>
  estado.productos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const okCat = estado.categoria === 'all' || p.categoria === estado.categoria;
      const okTxt = !estado.busqueda || p.nombre.toLowerCase().includes(estado.busqueda);
      return okCat && okTxt;
    });

const hayCategorias = () => new Set(estado.productos.map((p) => p.categoria)).size > 1;

/* --------------------------------------------------------------------------
   Sonido
   -------------------------------------------------------------------------- */
let ctxAudio = null;

function sonar(frec = 660, dur = 0.08, tipo = 'square') {
  if (!estado.sonido) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctxAudio = ctxAudio || new AC();
    if (ctxAudio.state === 'suspended') ctxAudio.resume();
    const osc = ctxAudio.createOscillator();
    const gan = ctxAudio.createGain();
    osc.type = tipo;
    osc.frequency.value = frec;
    gan.gain.value = 0.05;
    osc.connect(gan);
    gan.connect(ctxAudio.destination);
    osc.start();
    gan.gain.exponentialRampToValueAtTime(0.0001, ctxAudio.currentTime + dur);
    osc.stop(ctxAudio.currentTime + dur);
  } catch { /* audio no disponible */ }
}

/* --------------------------------------------------------------------------
   Avisos flotantes
   -------------------------------------------------------------------------- */
function toast(texto, ms = 2600) {
  const cont = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = texto;
  cont.append(el);
  setTimeout(() => el.remove(), ms);
}

/* --------------------------------------------------------------------------
   Diálogos
   -------------------------------------------------------------------------- */
function abrirDialogo(id) {
  const d = document.getElementById(id);
  if (d && !d.open) d.showModal();
  return d;
}
const cerrarDialogo = (id) => document.getElementById(id)?.close();

/* Cerrar al tocar el fondo */
$$('dialog').forEach((d) => {
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
});
$('#dlg-trivia')?.addEventListener('close', () => {
  try { window.speechSynthesis?.cancel(); } catch { /* ignorado */ }
});

/* --------------------------------------------------------------------------
   Pintado: cabecera y textos
   -------------------------------------------------------------------------- */
function pintarTextos() {
  const t = estado.tienda;
  $$('[data-t="nombre"]').forEach((el) => (el.textContent = t.nombre));
  $$('[data-t="firma"]').forEach((el) => (el.textContent = t.firma));
  $$('[data-t="version"]').forEach((el) => (el.textContent = t.version));
  $$('[data-t="pie"]').forEach((el) => (el.textContent = t.pieDePagina));
  $$('[data-t="bajada"]').forEach((el) => (el.innerHTML = esc(t.bajada).replace(/\*(.+?)\*/g, '<em>$1</em>')));
  $$('[data-t="aliasLabel"]').forEach((el) => (el.textContent = 'PAGÁ A ESTE ALIAS'));
  document.title = `${t.nombre} 🍬 Golosinas del recreo, a un toque`;

  $('#alias').textContent = t.alias || '—';
  const wa = $('#btn-wa');
  wa.href = `https://wa.me/${t.whatsapp}`;
  wa.textContent = `💬 Escribir a ${t.atiende}`;

  const abierta = t.abierta !== false;
  const estadoEl = $('#estado');
  estadoEl.classList.toggle('status--off', !abierta);
  $('span', estadoEl).textContent = abierta ? 'ABIERTO' : 'CERRADO';

  const aviso = $('#aviso');
  aviso.hidden = !t.aviso;
  if (t.aviso) aviso.textContent = '📣 ' + t.aviso;

  const pts = $('#puntos');
  pts.hidden = !estado.tienda.trivia;
  $('b', pts).textContent = estado.puntos;
}

/* --------------------------------------------------------------------------
   Pintado: cinta de precios
   -------------------------------------------------------------------------- */
function pintarTicker() {
  const partes = estado.productos.map((p) => `<span>${esc(p.nombre.toUpperCase())} ${dinero(p.precio)}</span>`);
  const bloque = partes.join('<span aria-hidden="true">✦</span>') + '<span aria-hidden="true">✦</span>';
  $('#ticker').innerHTML = bloque + bloque;
}

/* --------------------------------------------------------------------------
   Pintado: categorías
   -------------------------------------------------------------------------- */
function pintarCategorias() {
  const cont = $('#cats');
  if (!hayCategorias()) {
    cont.innerHTML = '';
    return;
  }
  const usadas = CATEGORIAS.filter((c) => estado.productos.some((p) => p.categoria === c.id));
  const items = [{ id: 'all', nombre: 'Todo', icono: '✨' }, ...usadas];
  cont.innerHTML = items
    .map(
      (c) =>
        `<button type="button" role="tab" data-cat="${c.id}" aria-selected="${estado.categoria === c.id}">${c.icono} ${esc(c.nombre)}</button>`
    )
    .join('');
}

/* --------------------------------------------------------------------------
   Pintado: grilla de productos
   -------------------------------------------------------------------------- */
function pintarGrilla() {
  const visibles = productosVisibles();
  const grilla = $('#grilla');
  const vacio = $('#vacio');

  vacio.hidden = visibles.length > 0;
  vacio.innerHTML = '<b>🔎</b>No encontramos esa golosina. Probá con otra palabra.';

  grilla.innerHTML = visibles
    .map(({ p, i }) => {
      const q = estado.carrito[i] || 0;
      const sinStock = agotado(p);
      const quedan = stockDe(p);
      const ultimas = !sinStock && quedan <= 3;
      // Ojo: los controles internos NO pueden ir anidados dentro de un <button>
      // (HTML no permite botones dentro de botones: el parser rompe la tarjeta).
      // Por eso la tarjeta es un <div> y el área táctil es un <button> hermano.
      return `
      <div class="card${q ? ' card--sel' : ''}${sinStock ? ' card--out' : ''}"
           data-card="${i}" style="--c:${esc(p.color || '#00B1EA')}">
        <img class="card__img" src="${esc(p.imagen)}" alt="" width="480" height="480" loading="lazy" decoding="async">
        <span class="card__scrim" aria-hidden="true"></span>
        <button class="card__hit" type="button" data-agregar="${i}"
                aria-label="Agregar ${esc(p.nombre)}, ${dinero(p.precio)}${sinStock ? ', agotado' : ''}${q ? `, ${q} ya en el pedido` : ''}"></button>
        <span class="card__code">${codigo(i)}</span>
        ${ultimas ? `<span class="card__stock">¡ÚLTIMAS ${quedan}!</span>` : ''}
        ${
          q
            ? `<span class="card__step">
                 <button type="button" data-menos="${i}" aria-label="Quitar uno de ${esc(p.nombre)}">−</button>
                 <b aria-label="${q} en el pedido">${q}</b>
                 <button type="button" data-mas="${i}" aria-label="Agregar uno de ${esc(p.nombre)}">+</button>
               </span>`
            : `<span class="card__plus" aria-hidden="true">+</span>`
        }
        ${sinStock ? '<span class="card__out">AGOTADO</span>' : ''}
        <span class="card__foot">
          <span class="card__name">${esc(p.nombre)}</span>
          <span class="card__price">${dinero(p.precio)}</span>
        </span>
      </div>`;
    })
    .join('');
}

/* --------------------------------------------------------------------------
   Pintado: panel derecho (Mercado Pago, alias, bandeja)
   -------------------------------------------------------------------------- */
function pintarPanel() {
  const cantidad = unidades();
  $('#monto').textContent = dinero(total());
  $('#seleccion').textContent = cantidad ? `${cantidad} ITEM${cantidad > 1 ? 'S' : ''}` : '—';

  const d = descuento();
  $('#fila-descuento').hidden = !d;
  if (d) $('#descuento').textContent = '-' + dinero(d);

  pintarBandeja();
  pintarBarra();
  pintarPromo();
}

function pintarBandeja() {
  const cont = $('#bandeja-items');
  const items = Object.entries(estado.carrito)
    .filter(([, q]) => q > 0)
    .map(([i, q]) => {
      const p = estado.productos[i];
      return `<span class="tchip"><img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" width="48" height="48" loading="lazy"><u>${q}</u></span>`;
    });
  cont.innerHTML = items.length ? items.join('') : '▼ ESPERANDO PRODUCTO…';
}

function pintarPromo() {
  const el = $('#promo');
  const pr = estado.tienda.promo || {};
  if (!(pr.cantidad > 0) || !(pr.porcentaje > 0)) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const c = unidades();
  const ok = c >= pr.cantidad;
  el.classList.toggle('promo--ok', ok);
  const texto = ok
    ? `🎉 ¡Descuento aplicado! Ahorrás ${dinero(descuento())}`
    : c
      ? `Agregá ${pr.cantidad - c} más y ahorrás ${pr.porcentaje}% 🎁`
      : `🎁 Llevá ${pr.cantidad} o más y pagá ${pr.porcentaje}% menos`;
  el.innerHTML = `${texto}<i style="width:${Math.min(100, (c / pr.cantidad) * 100)}%"></i>`;
}

function pintarBarra() {
  const boton = $('#btn-pedido');
  const c = unidades();
  const abierta = estado.tienda.abierta !== false;
  boton.disabled = !c || !abierta;
  boton.textContent = !abierta
    ? '🔒 CERRADO POR AHORA'
    : c
      ? `🛒 VER MI PEDIDO • ${c} • ${dinero(total())}`
      : 'ELEGÍ TUS GOLOSINAS';
}

/* --------------------------------------------------------------------------
   Carrito
   -------------------------------------------------------------------------- */
function agregar(i, delta = 1) {
  const p = estado.productos[i];
  if (!p) return;
  const abierta = estado.tienda.abierta !== false;
  if (abierta === false) { toast('Estamos cerrados por ahora 🔒'); return; }
  if (agotado(p)) { toast('Ese se agotó 😢'); return; }

  const actual = estado.carrito[i] || 0;
  const nuevo = actual + delta;

  if (nuevo > stockDe(p)) { toast('No quedan más 😅'); return; }

  if (nuevo <= 0) delete estado.carrito[i];
  else estado.carrito[i] = nuevo;

  almacen.set(CLAVES.carrito, JSON.stringify(estado.carrito));
  if (delta > 0) { sonar(900, 0.05); vibrar(12); }
  pintarPanel();
  pintarGrilla();
  if (delta > 0) animarAlaBandeja(i);
}

function animarAlaBandeja(i) {
  const tarjeta = $(`.card[data-card="${i}"]`);
  const bandeja = $('#bandeja');
  if (!tarjeta || !bandeja || !tarjeta.animate) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const a = tarjeta.getBoundingClientRect();
  const b = bandeja.getBoundingClientRect();
  const p = estado.productos[i];

  const globo = document.createElement('div');
  globo.style.cssText = `position:fixed;z-index:80;left:${a.left + a.width / 2 - 24}px;top:${a.top + a.height / 2 - 24}px;width:48px;height:48px;border-radius:12px;overflow:hidden;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.5)`;
  globo.innerHTML = `<img src="${esc(p.imagen)}" alt="" style="width:100%;height:100%;object-fit:cover">`;
  document.body.append(globo);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);

  globo
    .animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(.35) rotate(200deg)`, opacity: 0.2 },
      ],
      { duration: 520, easing: 'cubic-bezier(.5,0,1,.7)' }
    )
    .finished.finally(() => {
      globo.remove();
      bandeja.classList.remove('tray--bump');
      void bandeja.offsetWidth;
      bandeja.classList.add('tray--bump');
    });
}

function repetirUltimo() {
  const ultimo = almacen.json(CLAVES.ultimo, null);
  if (!ultimo) return;
  const nuevo = {};
  ultimo.forEach(([nombre, cantidad]) => {
    const i = estado.productos.findIndex((p) => p.nombre === nombre);
    if (i > -1 && !agotado(estado.productos[i])) {
      nuevo[i] = Math.min(cantidad, stockDe(estado.productos[i]));
    }
  });
  estado.carrito = nuevo;
  almacen.set(CLAVES.carrito, JSON.stringify(nuevo));
  pintarPanel();
  pintarGrilla();
  sonar(900, 0.05);
}

/* --------------------------------------------------------------------------
   Trivia: tarjeta de la portada
   -------------------------------------------------------------------------- */
const hoy = () => {
  const n = new Date();
  return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`;
};

function pintarTrivia() {
  const cont = $('#trivia');
  if (!estado.tienda.trivia) {
    cont.hidden = true;
    return;
  }
  cont.hidden = false;

  const n = new Date();
  const dia = TRIVIA[n.getDay()];
  const hechos = almacen.json(CLAVES.triviaHechos, {}) || {};
  const dow = (n.getDay() + 6) % 7;

  $('#trivia-tema').textContent = `${dia.icono} ${dia.tema}`;

  let cumplidos = 0;
  const semana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((letra, k) => {
    const fecha = new Date(n.getFullYear(), n.getMonth(), n.getDate() - dow + k);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
    const ok = Boolean(hechos[clave]);
    if (ok) cumplidos++;
    return `<li${k === dow ? ' data-hoy' : ''}${ok ? ' data-ok' : ''}>${letra}${ok ? ' ✓' : ''}</li>`;
  });
  $('#trivia-semana').innerHTML = semana.join('');
  $('#trivia-sub').textContent = `${estado.tienda.nombre} te pregunta · ${cumplidos}/7 días esta semana`;
}
/* --------------------------------------------------------------------------
   Pedido: armar el mensaje de WhatsApp
   -------------------------------------------------------------------------- */
function lineasPedido() {
  const lineas = [];
  Object.entries(estado.carrito)
    .filter(([, q]) => q > 0)
    .forEach(([i, q]) => {
      const p = estado.productos[i];
      lineas.push({ i: Number(i), nombre: p.nombre, cantidad: q, unitario: p.precio, subtotal: q * p.precio, imagen: p.imagen });
    });
  return lineas;
}

function construirMensaje(lineas, datos) {
  const t = estado.tienda;
  const detalle = lineas.map((l) => `• ${l.cantidad} x ${l.nombre} (${dinero(l.subtotal)})`);
  const partes = [`¡Hola! Quiero hacer un pedido en ${t.nombre}:`, '', ...detalle];

  const d = descuento();
  if (d) partes.push('', `Descuento: -${dinero(d)}`);

  partes.push('', `Total: ${dinero(total())}`);
  partes.push(`Nombre: ${datos.nombre}`);
  partes.push(`Retiro: ${datos.retiro}`);
  if (datos.nota) partes.push(`Comentarios: ${datos.nota}`);
  partes.push(`Pago por Mercado Pago al alias ${t.alias}`);

  return partes.join('\n');
}

const enlaceWhatsApp = (mensaje) => `https://wa.me/${estado.tienda.whatsapp}?text=${encodeURIComponent(mensaje)}`;

/* --------------------------------------------------------------------------
   Pedido: diálogo
   -------------------------------------------------------------------------- */
function pintarPedido() {
  const lineas = lineasPedido();
  const d = descuento();
  const ultimo = almacen.json(CLAVES.ultimo, null);

  const filas = lineas
    .map(
      (l) => `
      <div class="line">
        <span class="line__ph"><img src="${esc(l.imagen)}" alt="" width="48" height="48" loading="lazy"></span>
        <span class="line__txt">
          <b>${esc(l.nombre)}</b>
          <small>${dinero(l.unitario)} c/u</small>
        </span>
        <span class="line__right">
          <span class="stepper">
            <button type="button" data-menos="${l.i}" aria-label="Quitar uno de ${esc(l.nombre)}">−</button>
            <b>${l.cantidad}</b>
            <button type="button" data-mas="${l.i}" aria-label="Agregar uno de ${esc(l.nombre)}">+</button>
          </span>
          <span class="line__total">${dinero(l.subtotal)}</span>
        </span>
      </div>`
    )
    .join('');

  const retiros = estado.tienda.retiro
    .map(
      (r) =>
        `<button type="button" data-retiro="${esc(r)}" aria-pressed="${r === estado.retiro}">${esc(r)}</button>`
    )
    .join('');

  $('#pedido-cuerpo').innerHTML = `
    <div class="dlg-head">
      <h2 id="pedido-titulo">🛒 Tu pedido</h2>
      <button class="dlg-close" type="button" data-cerrar aria-label="Cerrar">✕</button>
    </div>

    <div class="lines">${filas}</div>

    ${d ? `<div class="line" style="border:0"><span></span><span>🎁 Descuento ${estado.tienda.promo.porcentaje}%</span><span class="line__total" style="color:var(--g)">-${dinero(d)}</span></div>` : ''}

    <div class="total"><span>Total</span><span>${dinero(total())}</span></div>

    <div class="field">
      <label>¿CUÁNDO LO RETIRÁS?</label>
      <div class="seg">${retiros}</div>
    </div>

    <div class="field">
      <label for="quien">TU NOMBRE Y GRADO</label>
      <input id="quien" value="${esc(estado.nombre)}" placeholder="Ej: Sofi, 5° B" autocomplete="name" enterkeyhint="done">
    </div>

    <div class="field">
      <label for="nota">COMENTARIOS (OPCIONAL)</label>
      <input id="nota" value="${esc(estado.nota)}" placeholder="Sin nueces, bien fríos…">
    </div>

    <div class="paybox">
      💳 Pagá por Mercado Pago<br>
      Alias: <b>${esc(estado.tienda.alias)}</b>
      <button class="btn btn--ghost" type="button" data-copiar-alias style="padding:.35rem .7rem;min-height:0;font-size:var(--fs-xs);margin-left:.4rem">COPIAR</button>
    </div>

    <div class="dlg-actions">
      <button class="btn btn--wa" type="button" data-enviar="texto">💬 Enviar el pedido por WhatsApp</button>
      <button class="btn btn--primary" type="button" data-enviar="foto">📸 Enviar como foto (ticket)</button>
      ${!lineas.length && ultimo ? '<button class="btn btn--ghost" type="button" data-repetir>🔁 Repetir mi último pedido</button>' : ''}
      <button class="btn btn--ghost" type="button" data-cerrar>Seguir eligiendo</button>
    </div>

    <p class="field__hint" style="text-align:center;margin-top:.8rem">
      Al enviar se abre WhatsApp con el pedido escrito. Después pagás el alias y mostrás el comprobante al retirar.
    </p>
  `;
}

function abrirPedido() {
  pintarPedido();
  abrirDialogo('dlg-pedido');
  setTimeout(() => $('#quien')?.focus(), 120);
}

/* --------------------------------------------------------------------------
   Ticket como imagen
   -------------------------------------------------------------------------- */
function cargarImagen(src) {
  return new Promise((resolver) => {
    if (!src) { resolver(null); return; }
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => resolver(null);
    img.src = src;
  });
}

function rectRedondeado(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

async function generarTicket(datos) {
  const lineas = datos.lineas;
  const W = 760;
  const P = 44;
  const altoFila = 104;
  const H = 600 + lineas.length * altoFila + (datos.descuento ? 58 : 0);

  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');

  const [logo, ...fotos] = await Promise.all([
    cargarImagen('assets/img/logo.svg'),
    ...lineas.map((l) => cargarImagen(l.imagen)),
  ]);

  const fondo = c.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0, '#0B1626');
  fondo.addColorStop(1, '#05070F');
  c.fillStyle = fondo;
  c.fillRect(0, 0, W, H);

  const franja = c.createLinearGradient(0, 0, W, 0);
  franja.addColorStop(0, '#00B1EA');
  franja.addColorStop(1, '#FFE600');
  c.fillStyle = franja;
  c.fillRect(0, 0, W, 16);

  let y = 52;
  if (logo) {
    c.save();
    rectRedondeado(c, P, y, 96, 96, 22);
    c.clip();
    c.drawImage(logo, P, y, 96, 96);
    c.restore();
  }
  c.fillStyle = '#fff';
  c.font = '800 46px system-ui, sans-serif';
  c.fillText(estado.tienda.nombre.toUpperCase(), P + 118, y + 50);
  c.fillStyle = 'rgba(255,255,255,.6)';
  c.font = '600 23px ui-monospace, monospace';
  c.fillText(`PEDIDO #${datos.id} · ${datos.hora}`, P + 118, y + 88);

  y = 196;
  c.fillStyle = '#FFE600';
  c.font = '800 30px system-ui, sans-serif';
  c.fillText(`Pedido de ${datos.nombre}`, P, y + 30);
  y += 66;

  lineas.forEach((l, k) => {
    const foto = fotos[k];
    c.save();
    rectRedondeado(c, P, y, 80, 80, 18);
    c.clip();
    c.fillStyle = '#fff';
    c.fillRect(P, y, 80, 80);
    if (foto) c.drawImage(foto, P, y, 80, 80);
    c.restore();

    c.fillStyle = '#FFE600';
    rectRedondeado(c, P - 9, y - 9, 50, 36, 18);
    c.fill();
    c.fillStyle = '#000';
    c.font = '800 20px ui-monospace, monospace';
    c.textAlign = 'center';
    c.fillText('×' + l.cantidad, P + 16, y + 17);
    c.textAlign = 'left';

    c.fillStyle = '#fff';
    c.font = '700 30px system-ui, sans-serif';
    c.fillText(l.nombre, P + 106, y + 36);
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.font = '21px system-ui, sans-serif';
    c.fillText(dinero(l.unitario) + ' c/u', P + 106, y + 68);
    c.textAlign = 'right';
    c.fillStyle = '#fff';
    c.font = '800 30px ui-monospace, monospace';
    c.fillText(dinero(l.subtotal), W - P, y + 46);
    c.textAlign = 'left';

    c.fillStyle = 'rgba(255,255,255,.14)';
    c.fillRect(P, y + 94, W - 2 * P, 2);
    y += altoFila;
  });

  y += 6;
  if (datos.descuento) {
    c.fillStyle = '#00FF88';
    c.font = '700 26px ui-monospace, monospace';
    c.fillText('Descuento', P, y + 26);
    c.textAlign = 'right';
    c.fillText('-' + dinero(datos.descuento), W - P, y + 26);
    c.textAlign = 'left';
    y += 58;
  }

  c.fillStyle = '#fff';
  c.font = '800 38px system-ui, sans-serif';
  c.fillText('TOTAL', P, y + 40);
  c.fillStyle = '#FFE600';
  c.font = '800 56px ui-monospace, monospace';
  c.textAlign = 'right';
  c.fillText(dinero(datos.total), W - P, y + 44);
  c.textAlign = 'left';
  y += 92;

  c.fillStyle = 'rgba(255,255,255,.08)';
  rectRedondeado(c, P, y, W - 2 * P, 158, 22);
  c.fill();
  c.fillStyle = '#fff';
  c.font = '25px system-ui, sans-serif';
  const metas = [`Retiro: ${datos.retiro}`, `Pago: Mercado Pago · alias ${estado.tienda.alias}`];
  if (datos.nota) metas.push(`Comentarios: ${datos.nota}`);
  metas.forEach((t, i) => c.fillText(t, P + 26, y + 48 + i * 42));

  c.fillStyle = 'rgba(255,255,255,.38)';
  c.font = '21px ui-monospace, monospace';
  c.textAlign = 'center';
  c.fillText(`Hecho con ${estado.tienda.nombre}`, W / 2, H - 30);

  return new Promise((resolver) => cv.toBlob((b) => resolver(b), 'image/jpeg', 0.92));
}

/* --------------------------------------------------------------------------
   Enviar el pedido
   -------------------------------------------------------------------------- */
async function enviarPedido(modo) {
  const nombre = ($('#quien')?.value || '').trim();
  if (!nombre) {
    $('#quien')?.focus();
    toast('Poné tu nombre y grado 🙂');
    return;
  }
  const nota = ($('#nota')?.value || '').trim();
  const lineas = lineasPedido();
  if (!lineas.length) { toast('Todavía no elegiste nada 🍬'); return; }

  estado.nombre = nombre;
  almacen.set(CLAVES.nombre, nombre);
  almacen.set(CLAVES.ultimo, JSON.stringify(lineas.map((l) => [l.nombre, l.cantidad])));

  const mensaje = construirMensaje(lineas, { nombre, retiro: estado.retiro, nota });
  const datos = {
    id: Math.floor(10000 + Math.random() * 90000),
    hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    nombre,
    nota,
    retiro: estado.retiro,
    lineas,
    descuento: descuento(),
    total: total(),
    mensaje,
  };

  // Se vacía el carrito: el pedido ya quedó registrado en el ticket.
  estado.carrito = {};
  estado.nota = '';
  almacen.set(CLAVES.carrito, '{}');
  pintarPanel();
  pintarGrilla();

  pintarTicket(datos);
  abrirDialogo('dlg-ticket');
  sonar(660, 0.12);
  vibrar(30);

  const url = enlaceWhatsApp(mensaje);

  if (modo === 'foto') {
    try {
      const blob = await generarTicket(datos);
      const archivo = new File([blob], `pedido-${datos.id}.jpg`, { type: 'image/jpeg' });
      datos.foto = URL.createObjectURL(blob);
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: estado.tienda.nombre, text: `Pedido de ${nombre}` });
        return;
      }
      const enlace = document.createElement('a');
      enlace.href = datos.foto;
      enlace.download = archivo.name;
      enlace.click();
      toast('Guardamos la foto 📸 Abrilo y mandalo por WhatsApp');
      window.open(url, '_blank', 'noopener');
      return;
    } catch {
      toast('No se pudo armar la foto. Mandalo como mensaje 💬');
    }
  }

  window.open(url, '_blank', 'noopener');
}

function pintarTicket(datos) {
  $('#ticket-cuerpo').innerHTML = `
    <div class="ticket__bar" aria-hidden="true"></div>
    <div class="dlg-head">
      <span style="font-size:.68rem;letter-spacing:.2em;opacity:.55;font-weight:700">TICKET • ${esc(estado.tienda.nombre.toUpperCase())}</span>
      <button class="dlg-close" type="button" data-cerrar aria-label="Cerrar">✕</button>
    </div>
    <p class="ticket__title">¡Gracias, ${esc(datos.nombre)}! 🙌</p>
    <div style="margin:.9rem 0">
      ${datos.lineas
        .map(
          (l) => `<div class="ticket__row"><span>${l.cantidad} × ${esc(l.nombre)}</span><b>${dinero(l.subtotal)}</b></div>`
        )
        .join('')}
      ${datos.descuento ? `<div class="ticket__row"><span>🎁 Descuento</span><b>-${dinero(datos.descuento)}</b></div>` : ''}
      <div class="ticket__row ticket__row--total"><span>TOTAL</span><span>${dinero(datos.total)}</span></div>
      <div class="ticket__row"><span style="opacity:.55">Retiro</span><span>${esc(datos.retiro)}</span></div>
      <div class="ticket__row"><span style="opacity:.55">Alias MP</span><b>${esc(estado.tienda.alias)}</b></div>
    </div>
    <div class="ticket__tip">
      <b>Tip:</b> pagá al alias y mostrale el comprobante a quien atiende. ¡Gracias por comprar en ${esc(estado.tienda.nombre)}!
    </div>
    <div class="dlg-actions" style="margin-top:1rem">
      <a class="btn btn--wa" id="ticket-wa" href="${esc(enlaceWhatsApp(datos.mensaje))}" target="_blank" rel="noopener">💬 Abrir WhatsApp</a>
      <button class="btn btn--ghost" type="button" data-copiar-pedido="${esc(datos.mensaje)}">📋 Copiar el pedido</button>
      <button class="btn btn--ghost" type="button" data-alias>Solo el alias</button>
      <button class="btn btn--ghost" type="button" data-cerrar>Seguir comprando</button>
    </div>
    <p class="ticket__meta">PEDIDO #${datos.id} • ${esc(datos.hora)}</p>
  `;
}

/* --------------------------------------------------------------------------
   Copiar / compartir
   -------------------------------------------------------------------------- */
async function copiar(texto, aviso = 'Copiado ✅') {
  try {
    await navigator.clipboard.writeText(texto);
    toast(aviso);
  } catch {
    toast(texto);
  }
}

const enlaceTienda = () => estado.tienda.urlPublica || location.href;

async function compartirTienda() {
  const datos = {
    title: `${estado.tienda.nombre} 🍬`,
    text: 'Pedí golosinas para el recreo 🍬',
    url: enlaceTienda(),
  };
  if (navigator.share) {
    try { await navigator.share(datos); return; } catch { /* cancelado */ }
  }
  copiar(enlaceTienda(), 'Link copiado 📋');
}

/* --------------------------------------------------------------------------
   Cartel para imprimir con QR
   -------------------------------------------------------------------------- */
async function abrirCartel() {
  const url = enlaceTienda();
  $('#cartel-cuerpo').innerHTML = `
    <div class="dlg-head no-print">
      <h2 id="cartel-titulo">🖨️ Cartel con QR</h2>
      <button class="dlg-close" type="button" data-cerrar aria-label="Cerrar">✕</button>
    </div>
    <div style="text-align:center">
      <div class="poster__logo"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#i-logo"/></svg></div>
      <h2>${esc(estado.tienda.nombre.toUpperCase())}</h2>
      <p style="color:#555;margin-top:.2rem">Golosinas del recreo 🍬</p>
      <canvas class="poster__qr" id="qr-lienzo" aria-label="Código QR de la tienda"></canvas>
      <div class="poster__steps">
        <span>1️⃣ Escaneá el código con la cámara</span>
        <span>2️⃣ Elegí tus golosinas</span>
        <span>3️⃣ Mandá el pedido por WhatsApp</span>
      </div>
      <p style="font-weight:750">${esc(url.replace(/^https?:\/\//, ''))}</p>
    </div>
    <div class="dlg-actions no-print" style="margin-top:1rem">
      <button class="btn btn--primary" type="button" data-imprimir>🖨️ Imprimir el cartel</button>
      <button class="btn btn--ghost" type="button" data-cerrar>Cerrar</button>
    </div>
    ${location.protocol === 'file:' && !estado.tienda.urlPublica
      ? '<p class="field__hint field__hint--warn" style="text-align:center">Estás abriendo el archivo directamente: el QR apuntará a una dirección local. Cargá la dirección real en el Panel → Tienda.</p>'
      : ''}
  `;
  abrirDialogo('dlg-cartel');
  try {
    const { drawQrToCanvas } = await import('./qr.js');
    drawQrToCanvas($('#qr-lienzo'), url, { scale: 8, quiet: 3, foreground: '#05070F' });
  } catch {
    toast('No pudimos generar el QR');
  }
}
/* --------------------------------------------------------------------------
   Trivia
   -------------------------------------------------------------------------- */
let ronda = null;
let tecleando = null;

const mezclar = (lista) => {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function hablar(texto) {
  if (!estado.sonido || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  try {
    const limpio = String(texto)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(limpio);
    u.lang = 'es-AR';
    u.rate = 1.05;
    u.pitch = 1.4;
    speechSynthesis.speak(u);
  } catch { /* voz no disponible */ }
}

function iniciarTrivia() {
  const hoyClave = hoy();
  const visto = almacen.json(CLAVES.triviaDia, null);
  const hecho = visto && visto.dia === hoyClave ? visto : { dia: hoyClave, indices: [], rondas: 0 };

  const tema = TRIVIA[new Date().getDay()];
  let disponibles = tema.preguntas.map((_, i) => i).filter((i) => !hecho.indices.includes(i));
  if (disponibles.length < 5) {
    hecho.indices = [];
    disponibles = tema.preguntas.map((_, i) => i);
  }

  const elegidas = mezclar(disponibles).slice(0, 5);
  hecho.indices = [...hecho.indices, ...elegidas];
  almacen.set(CLAVES.triviaDia, JSON.stringify(hecho));

  ronda = {
    tema,
    conPuntos: hecho.rondas < 2,
    indice: 0,
    correctas: 0,
    puntos: 0,
    bloqueado: true,
    preguntas: elegidas.map((i) => {
      const trozos = tema.preguntas[i].split('|');
      const opciones = mezclar(trozos.slice(1));
      return { texto: trozos[0], opciones, correcta: opciones.indexOf(trozos[1]) };
    }),
  };
  hecho.rondas += 1;
  almacen.set(CLAVES.triviaDia, JSON.stringify(hecho));

  mostrarPregunta();
  abrirDialogo('dlg-trivia');
}

function mostrarPregunta() {
  const q = ronda.preguntas[ronda.indice];
  ronda.bloqueado = true;

  $('#trivia-cuerpo').innerHTML = `
    <div class="qtop">
      <span>${ronda.tema.icono} ${esc(ronda.tema.tema)}</span>
      <span>${ronda.indice + 1}/5</span>
      <button class="dlg-close" type="button" data-cerrar-trivia aria-label="Cerrar">✕</button>
    </div>
    <div class="qbar"><i style="width:${ronda.indice * 20}%"></i></div>
    <div class="qhost">
      <span class="qhost__face" id="trivia-cara"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#i-logo"/></svg></span>
      <span class="qhost__bubble" id="trivia-dialogo" aria-live="polite"></span>
    </div>
    <div class="qopts" id="trivia-opciones"></div>
    <p class="qfoot" id="trivia-puntos">${ronda.conPuntos ? `⭐ +${ronda.puntos} en esta ronda` : 'Modo práctica (sin puntos)'}</p>
  `;

  hablar(q.texto);
  escribir($('#trivia-dialogo'), q.texto, () => {
    if (!ronda || ronda.preguntas[ronda.indice] !== q) return;
    $('#trivia-opciones').innerHTML = q.opciones
      .map((o, i) => `<button type="button" data-respuesta="${i}">${esc(o)}</button>`)
      .join('');
    ronda.bloqueado = false;
  });
}

function escribir(el, texto, alTerminar) {
  clearInterval(tecleando);
  if (!el) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = texto;
    alTerminar();
    return;
  }
  let i = 0;
  tecleando = setInterval(() => {
    i += 1;
    el.textContent = texto.slice(0, i);
    if (i >= texto.length) {
      clearInterval(tecleando);
      alTerminar();
    }
  }, 22);
}

function responder(indice) {
  if (!ronda || ronda.bloqueado) return;
  ronda.bloqueado = true;

  const q = ronda.preguntas[ronda.indice];
  const botones = $$('#trivia-opciones button');
  const acerto = indice === q.correcta;

  botones[q.correcta]?.setAttribute('data-good', '');
  if (!acerto) botones[indice]?.setAttribute('data-bad', '');

  const cara = $('#trivia-cara');
  const dialogo = $('#trivia-dialogo');

  if (acerto) {
    ronda.correctas += 1;
    if (ronda.conPuntos) {
      const bonus = Date.now() - (ronda.t0 || Date.now()) < 6000 ? 5 : 0;
      const suma = 10 + bonus;
      ronda.puntos += suma;
      estado.puntos += suma;
      almacen.set(CLAVES.puntos, String(estado.puntos));
      $('b', $('#puntos')).textContent = estado.puntos;
      $('#trivia-puntos').textContent = `⭐ +${ronda.puntos} en esta ronda`;
    }
    cara?.style.setProperty('filter', 'drop-shadow(0 0 14px var(--g))');
    sonar(880, 0.06);
    setTimeout(() => sonar(1320, 0.1), 70);
    vibrar(15);
  } else {
    cara?.style.setProperty('filter', 'grayscale(.4)');
    sonar(200, 0.2);
  }

  const elogios = ['¡Eso es! 🎉', '¡Genio! 🧠', '¡Perfecto! ✨', '¡Muy bien! 👏', '¡Sabés mucho! 😎'];
  const respuesta = acerto ? elogios[Math.floor(Math.random() * elogios.length)] : `¡Casi! 😅 Era: ${q.opciones[q.correcta]}`;
  if (dialogo) dialogo.textContent = respuesta;
  hablar(respuesta);

  setTimeout(() => {
    if (!ronda) return;
    ronda.indice += 1;
    if (ronda.indice < 5) mostrarPregunta();
    else terminarTrivia();
  }, 1500);
}

function terminarTrivia() {
  const perfecto = ronda.correctas === 5;
  let bonus = 0;
  if (perfecto && ronda.conPuntos) {
    bonus = 20;
    estado.puntos += bonus;
    almacen.set(CLAVES.puntos, String(estado.puntos));
    $('b', $('#puntos')).textContent = estado.puntos;
  }

  const hechos = almacen.json(CLAVES.triviaHechos, {}) || {};
  hechos[hoy()] = 1;
  almacen.set(CLAVES.triviaHechos, JSON.stringify(hechos));

  const confeti = Array.from({ length: perfecto ? 26 : 0 }, (_, g) => {
    const color = ['#FFE600', '#00B1EA', '#fff'][g % 3];
    return `<span style="position:fixed;top:-12px;left:${(g * 13) % 100}%;width:9px;height:9px;border-radius:2px;background:${color};animation:caer ${1.6 + (g % 5) * 0.25}s linear ${g * 40}ms forwards"></span>`;
  }).join('');

  const titulo = perfecto ? '¡5 de 5! ¡Sos un crack! 🏆' : ronda.correctas >= 3 ? '¡Muy bien! 🎉' : '¡Buen intento! Mañana hay otro tema 💪';

  $('#trivia-cuerpo').innerHTML = `
    ${confeti}
    <div class="sheet--center">
      <div class="qhost__face" style="margin:0 auto 1rem;width:96px;height:96px">
        <svg viewBox="0 0 120 120" aria-hidden="true"><use href="#i-logo"/></svg>
      </div>
      <p style="font-weight:800;font-size:var(--fs-lg)">${titulo}</p>
      <h2 style="margin:.4rem 0">${ronda.correctas} de 5 correctas</h2>
      <p style="font-size:var(--fs-2xl);color:var(--y);font-weight:800;margin:.3rem 0">
        ${ronda.conPuntos ? `+${ronda.puntos + bonus} ⭐` : 'Práctica'}
      </p>
      <p class="sheet__sub" style="margin-bottom:1rem">
        ${ronda.conPuntos
          ? `Tenés ${estado.puntos} puntos en total. ¡Más adelante los vamos a usar para premios!`
          : 'Hoy ya sumaste puntos en 2 rondas. ¡Volvé mañana por más!'}
      </p>
      <div class="dlg-actions">
        <button class="btn btn--primary" type="button" data-trivia-otra>🔁 Jugar otra vez</button>
        <button class="btn btn--ghost" type="button" data-cerrar-trivia>Seguir comprando</button>
      </div>
    </div>
  `;
  ronda = null;
  pintarTrivia();
  sonar(660, 0.12);
}

/* --------------------------------------------------------------------------
   Juego: lluvia de caramelos
   -------------------------------------------------------------------------- */
let juego = null;

const CARAMELOS = ['🍬', '🍭', '🍫', '🍪'];

function iniciarJuego() {
  if (juego) return;

  const capa = document.createElement('div');
  capa.id = 'capa-juego';
  capa.style.cssText = 'position:fixed;inset:0;z-index:75;touch-action:none;background:#05070F';
  capa.innerHTML = `
    <canvas id="lienzo-juego" style="display:block"></canvas>
    <div style="position:absolute;top:calc(10px + env(safe-area-inset-top,0px));left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;font:800 16px ui-monospace,monospace;pointer-events:none">
      <span id="j-vidas" style="background:rgba(0,0,0,.6);border:1px solid var(--line);border-radius:999px;padding:.5rem .8rem">❤️❤️❤️</span>
      <b id="j-puntos" style="background:rgba(0,0,0,.6);border:1px solid var(--line);border-radius:999px;padding:.5rem .8rem">🍬 0</b>
      <span id="j-tiempo" style="background:rgba(0,0,0,.6);border:1px solid var(--line);border-radius:999px;padding:.5rem .8rem">45s</span>
      <button id="j-salir" type="button" aria-label="Salir del juego" style="pointer-events:auto;width:38px;height:38px;border-radius:50%;background:#fff;color:#000;font-weight:900;border:0">✕</button>
    </div>
    <div id="j-mensaje" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8rem;text-align:center;padding:1.5rem;background:rgba(5,7,15,.88)">
      <h2 style="font-size:var(--fs-xl);font-weight:800">🍬 Lluvia de caramelos</h2>
      <p style="color:var(--muted);max-width:320px">Movete con el dedo o las flechas y atrapá los caramelos con la galera. ¡Esquivá los brócolis! 🥦</p>
      <button class="btn btn--primary" id="j-jugar" type="button">▶ JUGAR</button>
    </div>
  `;
  document.body.append(capa);

  const lienzo = $('#lienzo-juego');
  const ctx = lienzo.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let ancho = window.innerWidth;
  let alto = window.innerHeight;

  const ajustar = () => {
    ancho = window.innerWidth;
    alto = window.innerHeight;
    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
    lienzo.style.width = ancho + 'px';
    lienzo.style.height = alto + 'px';
  };
  ajustar();

  juego = {
    ctx, dpr, ancho, alto, lienzo,
    x: ancho / 2, objetivo: ancho / 2,
    items: [], chispas: [], puntos: 0, vidas: 3, tiempo: 45,
    corriendo: false, ultimo: 0, raf: 0, espera: 0, estadoAnimo: 'idle', animoHasta: 0,
    record: Number(almacen.get(CLAVES.juegoRecord, '0')) || 0,
    sprites: {},
  };

  ['idle', 'sad', 'contento'].forEach((m) => {
    const img = new Image();
    img.src = 'assets/img/logo.svg';
    juego.sprites[m] = img;
  });

  const mover = (e) => {
    const p = e.touches ? e.touches[0] : e;
    juego.objetivo = Math.max(38, Math.min(ancho - 38, p.clientX));
  };
  lienzo.addEventListener('pointermove', mover);
  lienzo.addEventListener('pointerdown', mover);
  lienzo.addEventListener('touchmove', (e) => { e.preventDefault(); mover(e); }, { passive: false });

  juego.teclas = (e) => {
    if (!juego) return;
    if (e.key === 'ArrowLeft') juego.objetivo = Math.max(38, juego.objetivo - 80);
    if (e.key === 'ArrowRight') juego.objetivo = Math.min(ancho - 38, juego.objetivo + 80);
  };
  document.addEventListener('keydown', juego.teclas);

  dibujarJuego();
}

function correrJuego() {
  const m = $('#j-mensaje');
  if (m) m.style.display = 'none';
  Object.assign(juego, { items: [], chispas: [], puntos: 0, vidas: 3, tiempo: 45, corriendo: true, espera: 0 });
  juego.ultimo = performance.now();
  actualizarHud();
  cancelAnimationFrame(juego.raf);
  juego.raf = requestAnimationFrame(bucleJuego);
}

function actualizarHud() {
  if (!juego) return;
  $('#j-vidas').textContent = '❤️'.repeat(Math.max(0, juego.vidas));
  $('#j-puntos').textContent = '🍬 ' + juego.puntos;
  $('#j-tiempo').textContent = Math.max(0, Math.ceil(juego.tiempo)) + 's';
}

function bucleJuego(ahora) {
  if (!juego) return;
  // Con la pestaña en segundo plano no hace falta seguir animando.
  if (document.hidden) {
    juego.ultimo = ahora;
    juego.raf = requestAnimationFrame(bucleJuego);
    return;
  }
  const dt = Math.min(0.05, (ahora - juego.ultimo) / 1000);
  juego.ultimo = ahora;

  if (juego.corriendo) {
    juego.tiempo -= dt;
    juego.espera -= dt;
    const nivel = 1 + juego.puntos / 18;

    if (juego.espera <= 0) {
      juego.espera = Math.max(0.32, 0.85 - juego.puntos * 0.012);
      const r = Math.random();
      const tipo = r < 0.16 ? 'brocoli' : r < 0.21 ? 'estrella' : 'caramelo';
      juego.items.push({
        tipo,
        emoji: tipo === 'brocoli' ? '🥦' : tipo === 'estrella' ? '⭐' : CARAMELOS[Math.floor(Math.random() * 4)],
        x: 26 + Math.random() * (juego.ancho - 52),
        y: -30,
        vel: (150 + Math.random() * 60) * nivel,
        giro: Math.random() * 6,
        usado: false,
      });
    }

    juego.x += (juego.objetivo - juego.x) * Math.min(1, dt * 14);
    const altura = juego.alto - 130;

    juego.items.forEach((it) => {
      it.y += it.vel * dt;
      it.giro += dt * 2;
      if (!it.usado && it.y > altura - 18 && it.y < altura + 32 && Math.abs(it.x - juego.x) < 46) {
        it.usado = true;
        if (it.tipo === 'brocoli') {
          juego.vidas -= 1;
          juego.estadoAnimo = 'sad';
          juego.animoHasta = 0.5;
          sonar(180, 0.2);
          vibrar(45);
        } else {
          const suma = it.tipo === 'estrella' ? 5 : 1;
          juego.puntos += suma;
          juego.chispas.push({ x: it.x, y: it.y - 20, texto: '+' + suma, alfa: 1 });
          sonar(it.tipo === 'estrella' ? 1320 : 880, 0.06);
        }
        actualizarHud();
      }
    });

    juego.items = juego.items.filter((it) => !it.usado && it.y < juego.alto + 40);

    if (juego.animoHasta > 0) {
      juego.animoHasta -= dt;
      if (juego.animoHasta <= 0) juego.estadoAnimo = 'idle';
    }

    if (juego.vidas <= 0 || juego.tiempo <= 0) {
      terminarJuego();
      return;
    }
    actualizarHud();
  }

  dibujarJuego();
  juego.raf = requestAnimationFrame(bucleJuego);
}

function dibujarJuego() {
  const { ctx, dpr, ancho, alto } = juego;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const fondo = ctx.createLinearGradient(0, 0, 0, alto);
  fondo.addColorStop(0, '#1B1038');
  fondo.addColorStop(1, '#05070F');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ancho, alto);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '30px system-ui, sans-serif';
  juego.items.forEach((it) => {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(Math.sin(it.giro) * 0.4);
    ctx.fillText(it.emoji, 0, 0);
    ctx.restore();
  });

  const sprite = juego.sprites[juego.estadoAnimo === 'sad' ? 'sad' : juego.estadoAnimo === 'idle' ? 'idle' : 'contento'];
  if (sprite?.complete && sprite.naturalWidth) {
    const tam = 88;
    ctx.save();
    ctx.translate(juego.x, alto - 122);
    if (juego.estadoAnimo === 'sad') ctx.rotate(-0.1);
    ctx.drawImage(sprite, -tam / 2, -tam / 2, tam, tam);
    ctx.restore();
  }

  ctx.font = '800 18px ui-monospace, monospace';
  juego.chispas = juego.chispas.filter((c) => c.alfa > 0);
  juego.chispas.forEach((c) => {
    c.y -= 1.1;
    c.alfa -= 0.025;
    ctx.globalAlpha = Math.max(0, c.alfa);
    ctx.fillStyle = '#FFE600';
    ctx.fillText(c.texto, c.x, c.y);
    ctx.globalAlpha = 1;
  });
}

function terminarJuego() {
  if (!juego) return;
  juego.corriendo = false;
  cancelAnimationFrame(juego.raf);

  const recordPrevio = juego.record;
  if (juego.puntos > recordPrevio) {
    almacen.set(CLAVES.juegoRecord, String(juego.puntos));
    juego.record = juego.puntos;
  }

  const premio = estado.tienda.premio || {};
  const gano = premio.caramelos > 0 && premio.texto && juego.puntos >= premio.caramelos;

  const m = $('#j-mensaje');
  m.style.display = 'flex';
  m.innerHTML = `
    <h2 style="font-size:var(--fs-xl);font-weight:800">${juego.vidas <= 0 ? '¡Ay, un brócoli! 🥦' : '¡Se acabó el tiempo! ⏱️'}</h2>
    <p style="font-size:1.5rem;font-weight:800">🍬 ${juego.puntos} caramelos</p>
    <p style="color:var(--muted)">${juego.puntos > recordPrevio ? '¡Nuevo récord! 🏆' : `Tu récord es ${juego.record}`}</p>
    ${gano ? `<p style="color:var(--y);font-weight:800">🎁 ¡Ganaste ${esc(premio.texto)}!<br>Mostrale esta pantalla a quien atiende.</p>` : ''}
    <button class="btn btn--primary" id="j-jugar" type="button">🔁 Jugar otra vez</button>
    <button class="btn btn--ghost" id="j-cerrar" type="button">Seguir comprando</button>
  `;
  dibujarJuego();
  sonar(660, 0.1);
}

function cerrarJuego() {
  if (!juego) return;
  cancelAnimationFrame(juego.raf);
  document.removeEventListener('keydown', juego.teclas);
  $('#capa-juego')?.remove();
  juego = null;
}
/* --------------------------------------------------------------------------
   Panel de administración (local, para el dueño de la tienda)
   --------------------------------------------------------------------------
   Reemplaza al panel del artefacto de Claude, que dependía de la API
   `window.claude`. Ahora los cambios se guardan en el navegador y se pueden
   exportar como JSON o como un `data.js` listo para volver a publicar.
   Aclaración: es una herramienta de comodidad, no una barrera de seguridad.
   -------------------------------------------------------------------------- */
const PIN_POR_DEFECTO = '2580';
const CLAVE_PIN = 'mrlolo.pin';

let panel = { abierto: false, seccion: 'productos', desbloqueado: false };

const pinActual = () => almacen.get(CLAVE_PIN, PIN_POR_DEFECTO);

function abrirPanel() {
  try { panel.desbloqueado = sessionStorage.getItem(CLAVES.panel) === '1'; } catch { panel.desbloqueado = false; }
  panel.seccion = 'productos';
  pintarPanelAdmin();
  abrirDialogo('dlg-panel');
}

function pintarPanelAdmin() {
  const cont = $('#panel-cuerpo');

  if (!panel.desbloqueado) {
    cont.innerHTML = `
      <div class="dlg-head">
        <h2 id="panel-titulo">⚙️ Panel de ${esc(estado.tienda.nombre)}</h2>
        <button class="dlg-close" type="button" data-cerrar aria-label="Cerrar">✕</button>
      </div>
      <div class="field">
        <label for="pin">CLAVE DEL PANEL</label>
        <input id="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="••••">
        <span class="field__hint">La clave inicial es ${PIN_POR_DEFECTO}. Podés cambiarla abajo, en la sección Datos.</span>
      </div>
      <div class="dlg-actions">
        <button class="btn btn--primary" type="button" data-desbloquear>Entrar</button>
      </div>
    `;
    setTimeout(() => $('#pin')?.focus(), 120);
    return;
  }

  const t = estado.tienda;
  const tabs = [
    ['productos', '📦 Productos'],
    ['tienda', '🏪 Tienda'],
    ['promos', '🎁 Promos'],
    ['datos', '💾 Datos'],
  ];

  let cuerpo = '';

  if (panel.seccion === 'productos') {
    const sinStock = estado.productos.filter(agotado).length;
    cuerpo = `
      <div class="admin__stats">
        <span>${estado.productos.length} PRODUCTOS</span>
        <span>${sinStock} AGOTADOS</span>
        <span>STOCK VACÍO = SIN LÍMITE</span>
      </div>
      <div class="admin">
        ${estado.productos
          .map(
            (p, i) => `
          <div class="admin__row${agotado(p) ? ' admin__row--off' : ''}">
            <div class="admin__thumb">
              <img src="${esc(p.imagen)}" alt="" width="76" height="76" loading="lazy">
            </div>
            <div class="admin__fields">
              <input data-campo="nombre" data-i="${i}" value="${esc(p.nombre)}" placeholder="Nombre">
              <div class="admin__grid2">
                <input data-campo="precio" data-i="${i}" type="text" inputmode="numeric" value="${p.precio}" placeholder="Precio $">
                <input data-campo="stock" data-i="${i}" type="text" inputmode="numeric" value="${p.stock ?? ''}" placeholder="Stock">
              </div>
              <select data-campo="categoria" data-i="${i}">
                <option value="">Sin categoría</option>
                ${CATEGORIAS.map((c) => `<option value="${c.id}"${p.categoria === c.id ? ' selected' : ''}>${c.icono} ${esc(c.nombre)}</option>`).join('')}
              </select>
              <input data-campo="imagen" data-i="${i}" value="${esc(p.imagen)}" placeholder="Ruta o URL de la foto">
              <div class="admin__acts">
                <button type="button" data-mover="${i}:-1" aria-label="Subir">↑</button>
                <button type="button" data-mover="${i}:1" aria-label="Bajar">↓</button>
                <button type="button" data-duplicar="${i}">📄</button>
                <button type="button" data-agotar="${i}">${p.agotado ? '✅ Hay' : '🚫 Agotado'}</button>
                <button type="button" data-borrar="${i}" aria-label="Borrar" style="color:#ff8a8a">🗑️</button>
              </div>
            </div>
          </div>`
          )
          .join('')}
      </div>
      <button class="btn btn--ghost btn--block" type="button" data-agregar-producto>➕ Agregar golosina</button>
    `;
  } else if (panel.seccion === 'tienda') {
    cuerpo = `
      <div class="admin">
        <div class="field"><label>NOMBRE DE LA TIENDA</label><input data-tienda="nombre" value="${esc(t.nombre)}"></div>
        <div class="field"><label>BAJADA</label><input data-tienda="bajada" value="${esc(t.bajada)}"></div>
        <div class="field">
          <label>WHATSAPP (CON CÓDIGO DE PAÍS)</label>
          <input data-tienda="whatsapp" inputmode="numeric" value="${esc(t.whatsapp)}">
          <span class="field__hint ${/^\d{10,15}$/.test(t.whatsapp) ? '' : 'field__hint--warn'}">
            ${/^\d{10,15}$/.test(t.whatsapp) ? '✅ Los pedidos llegan a +' + esc(t.whatsapp) : '⚠️ Revisá el número: en Argentina empieza con 549'}
          </span>
        </div>
        <div class="field"><label>ALIAS DE MERCADO PAGO</label><input data-tienda="alias" value="${esc(t.alias)}"></div>
        <div class="field"><label>NOMBRE DE QUIEN ATIENDE</label><input data-tienda="atiende" value="${esc(t.atiende)}"></div>
        <div class="field">
          <label>DIRECCIÓN DE LA TIENDA (PARA EL QR)</label>
          <input data-tienda="urlPublica" value="${esc(t.urlPublica || '')}" placeholder="https://…">
          <span class="field__hint">Si la dejás vacía, el QR usa la dirección desde la que se abrió la tienda.</span>
        </div>
        <div class="field"><label>AVISO PARA LOS CLIENTES</label><input data-tienda="aviso" value="${esc(t.aviso || '')}" placeholder="Ej: Hoy vendo en el 2° recreo"></div>
        <div class="field"><label>MOMENTOS DE RETIRO (SEPARADOS POR COMA)</label><input data-tienda="retiro" value="${esc((t.retiro || []).join(', '))}"></div>
        <div class="field"><label>TEXTO DEL PIE</label><input data-tienda="pieDePagina" value="${esc(t.pieDePagina)}"></div>
        <div class="field"><label>VERSIÓN PUBLICADA</label><input data-tienda="version" value="${esc(t.version)}"></div>
        <div class="seg" style="margin-top:.3rem">
          <button type="button" data-alternar="abierta" aria-pressed="${t.abierta !== false}">${t.abierta !== false ? '🟢 Tienda abierta' : '🔒 Tienda cerrada'}</button>
          <button type="button" data-alternar="trivia" aria-pressed="${Boolean(t.trivia)}">${t.trivia ? '🧠 Trivia activa' : '⏸️ Trivia apagada'}</button>
        </div>
      </div>
    `;
  } else if (panel.seccion === 'promos') {
    cuerpo = `
      <div class="admin">
        <div class="field">
          <label>DESCUENTO POR CANTIDAD — LLEVANDO CUÁNTOS</label>
          <input data-promo="cantidad" type="text" inputmode="numeric" value="${t.promo?.cantidad || ''}" placeholder="Ej: 3">
          <span class="field__hint">Dejalo vacío o en 0 para no ofrecer descuento.</span>
        </div>
        <div class="field">
          <label>PORCENTAJE DE DESCUENTO</label>
          <input data-promo="porcentaje" type="text" inputmode="numeric" value="${t.promo?.porcentaje || ''}" placeholder="Ej: 10">
        </div>
        <div class="field">
          <label>PREMIO DEL JUEGO — CARAMELOS NECESARIOS</label>
          <input data-premio="caramelos" type="text" inputmode="numeric" value="${t.premio?.caramelos || ''}" placeholder="Ej: 25">
        </div>
        <div class="field">
          <label>PREMIO DEL JUEGO — TEXTO</label>
          <input data-premio="texto" value="${esc(t.premio?.texto || '')}" placeholder="Ej: un chupetín">
          <span class="field__hint">El cliente te muestra la pantalla para recibirlo.</span>
        </div>
      </div>
    `;
  } else {
    cuerpo = `
      <div class="admin">
        <div class="field">
          <label>EXPORTAR PRODUCTOS Y CONFIGURACIÓN</label>
          <span class="field__hint">Descargá <code>data.js</code> actualizado y reemplazá el archivo del sitio para que los cambios queden fijos para todos.</span>
        </div>
        <div class="dlg-actions">
          <button class="btn btn--primary" type="button" data-exportar-data>⬇️ Descargar data.js</button>
          <button class="btn btn--ghost" type="button" data-exportar-json>⬇️ Descargar copia JSON</button>
          <button class="btn btn--ghost" type="button" data-importar>⬆️ Importar copia JSON</button>
        </div>
        <div class="field" style="margin-top:1rem">
          <label>CAMBIAR LA CLAVE DEL PANEL</label>
          <input data-nuevo-pin type="password" inputmode="numeric" value="${esc(pinActual())}">
        </div>
        <div class="field">
          <label>VOLVER TODO AL ORIGINAL</label>
          <span class="field__hint">Borra los cambios guardados en este navegador y restaura los datos de <code>data.js</code>.</span>
          <button class="btn btn--ghost btn--block" type="button" data-restablecer style="color:#ff9a9a;margin-top:.4rem">♻️ Restablecer todo</button>
        </div>
        <input type="file" id="archivo-importar" accept=".json,application/json" hidden>
      </div>
    `;
  }

  cont.innerHTML = `
    <div class="dlg-head">
      <h2 id="panel-titulo">⚙️ Panel de ${esc(estado.tienda.nombre)}</h2>
      <button class="dlg-close" type="button" data-cerrar aria-label="Cerrar">✕</button>
    </div>
    <div class="cats" role="tablist" aria-label="Secciones del panel">
      ${tabs.map(([id, nombre]) => `<button type="button" role="tab" data-panel-tab="${id}" aria-selected="${panel.seccion === id}">${nombre}</button>`).join('')}
    </div>
    ${cuerpo}
    <div class="dlg-actions" style="margin-top:1rem">
      <button class="btn btn--primary" type="button" data-guardar-panel>💾 Guardar cambios</button>
      <button class="btn btn--ghost" type="button" data-cerrar>Salir</button>
    </div>
  `;
}

function guardarPanel() {
  guardarConfig();
  if (!estado.tienda.retiro?.includes(estado.retiro)) estado.retiro = estado.tienda.retiro?.[0] || '';
  pintarTodo();
  toast('Cambios guardados ✅');
}

/* --- Exportaciones --- */
function descargar(nombre, contenido, tipo = 'application/json') {
  const blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportarDataJS() {
  const t = estado.tienda;
  const txt = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const productos = estado.productos
    .map(
      (p, i) => `  {
    orden: ${i + 1},
    nombre: ${txt(p.nombre)},
    precio: ${Number(p.precio) || 0},
    categoria: ${txt(p.categoria || '')},
    imagen: ${txt(p.imagen)},
    color: ${txt(p.color || '#00B1EA')},
    icono: ${txt(p.icono || '🍬')},
    stock: ${p.stock === null || p.stock === undefined || p.stock === '' ? 'null' : Number(p.stock)},
    agotado: ${Boolean(p.agotado)},
  }`
    )
    .join(',\n');

  const cabecera = `/* Generado desde el Panel de ${t.nombre} — ${new Date().toLocaleString('es-AR')} */
export const TIENDA = {
  nombre: ${txt(t.nombre)},
  bajada: ${txt(t.bajada)},
  firma: ${txt(t.firma)},
  version: ${txt(t.version)},
  whatsapp: ${txt(t.whatsapp)},
  alias: ${txt(t.alias)},
  atiende: ${txt(t.atiende)},
  retiro: [${(t.retiro || []).map(txt).join(', ')}],
  pieDePagina: ${txt(t.pieDePagina)},
  abierta: ${Boolean(t.abierta !== false)},
  aviso: ${txt(t.aviso || '')},
  promo: { cantidad: ${Number(t.promo?.cantidad) || 0}, porcentaje: ${Number(t.promo?.porcentaje) || 0} },
  premio: { caramelos: ${Number(t.premio?.caramelos) || 0}, texto: ${txt(t.premio?.texto || '')} },
  trivia: ${Boolean(t.trivia)},
  juego: ${Boolean(t.juego !== false)},
  urlPublica: ${txt(t.urlPublica || '')},
};
`;

  descargar(
    'data.js',
    `${cabecera}\nexport const PRODUCTOS = [\n${productos}\n];\n`,
    'text/javascript'
  );
  toast('data.js descargado ⬇️');
}

/* --------------------------------------------------------------------------
   Interacción global (delegación de eventos)
   -------------------------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-cat],[data-agregar],[data-mas],[data-menos],[data-retiro],[data-enviar],[data-cerrar],[data-cerrar-trivia],[data-repetir],[data-copiar-alias],[data-copiar-pedido],[data-alias],[data-respuesta],[data-trivia-otra],[data-imprimir],[data-panel-tab],[data-desbloquear],[data-guardar-panel],[data-mover],[data-duplicar],[data-agotar],[data-borrar],[data-agregar-producto],[data-alternar],[data-exportar-data],[data-exportar-json],[data-importar],[data-restablecer]');
  if (!el) return;

  const d = el.dataset;

  // --- Cerrar diálogos ---
  if ('cerrar' in d) { el.closest('dialog')?.close(); return; }
  if ('cerrarTrivia' in d) { cerrarDialogo('dlg-trivia'); return; }

  // --- Catálogo ---
  if ('cat' in d) { estado.categoria = d.cat; pintarCategorias(); pintarGrilla(); return; }
  if ('mas' in d) { agregar(Number(d.mas), 1); if ($('#dlg-pedido')?.open) pintarPedido(); return; }
  if ('menos' in d) { agregar(Number(d.menos), -1); if ($('#dlg-pedido')?.open) pintarPedido(); return; }
  if ('agregar' in d) { agregar(Number(d.agregar), 1); return; }

  // --- Pedido ---
  if ('retiro' in d) { estado.retiro = d.retiro; almacen.set(CLAVES.retiro, d.retiro); pintarPedido(); return; }
  if ('enviar' in d) { enviarPedido(d.enviar); return; }
  if ('repetir' in d) { repetirUltimo(); pintarPedido(); return; }
  if ('copiarAlias' in d || 'alias' in d) { copiar(estado.tienda.alias, 'Alias copiado ✅'); return; }
  if ('copiarPedido' in d) { copiar(d.copiarPedido, 'Pedido copiado 📋'); return; }
  if ('imprimir' in d) { window.print(); return; }

  // --- Trivia ---
  if ('respuesta' in d) { responder(Number(d.respuesta)); return; }
  if ('triviaOtra' in d) { cerrarDialogo('dlg-trivia'); setTimeout(iniciarTrivia, 200); return; }

  // --- Panel ---
  if ('panelTab' in d) { panel.seccion = d.panelTab; pintarPanelAdmin(); return; }
  if ('desbloquear' in d) {
    const valor = ($('#pin')?.value || '').trim();
    if (valor === pinActual()) {
      panel.desbloqueado = true;
      try { sessionStorage.setItem(CLAVES.panel, '1'); } catch { /* ignorado */ }
      pintarPanelAdmin();
    } else {
      toast('Clave incorrecta 🔒');
      sonar(200, 0.15);
    }
    return;
  }
  if ('guardarPanel' in d) { guardarPanel(); return; }
  if ('alternar' in d) {
    const campo = d.alternar;
    estado.tienda[campo] = !estado.tienda[campo];
    guardarPanel();
    pintarPanelAdmin();
    return;
  }
  if ('agregarProducto' in d) {
    estado.productos.push({
      orden: estado.productos.length + 1, nombre: 'Nueva golosina', precio: 500,
      categoria: CATEGORIAS[0].id, imagen: 'assets/img/logo.svg', color: '#00B1EA', icono: '🍬',
      stock: null, agotado: false,
    });
    estado.carrito = {};
    guardarPanel();
    pintarPanelAdmin();
    return;
  }
  if ('mover' in d) {
    const [a, b] = d.mover.split(':').map(Number);
    const destino = a + b;
    if (destino >= 0 && destino < estado.productos.length) {
      [estado.productos[a], estado.productos[destino]] = [estado.productos[destino], estado.productos[a]];
      estado.carrito = {};
      guardarPanel();
      pintarPanelAdmin();
    }
    return;
  }
  if ('duplicar' in d) {
    const i = Number(d.duplicar);
    const copia = clonar(estado.productos[i]);
    copia.nombre += ' (copia)';
    estado.productos.splice(i + 1, 0, copia);
    guardarPanel();
    pintarPanelAdmin();
    return;
  }
  if ('agotar' in d) {
    const p = estado.productos[Number(d.agotar)];
    p.agotado = !p.agotado;
    estado.carrito = {};
    guardarPanel();
    pintarPanelAdmin();
    return;
  }
  if ('borrar' in d) {
    estado.productos.splice(Number(d.borrar), 1);
    estado.carrito = {};
    guardarPanel();
    pintarPanelAdmin();
    return;
  }
  if ('exportarData' in d) { exportarDataJS(); return; }
  if ('exportarJson' in d) {
    descargar('mr-lolo-copia.json', JSON.stringify({ tienda: estado.tienda, productos: estado.productos }, null, 2));
    toast('Copia descargada ⬇️');
    return;
  }
  if ('importar' in d) { $('#archivo-importar')?.click(); return; }
  if ('restablecer' in d) {
    almacen.borrar(CLAVES.config);
    almacen.borrar(CLAVES.carrito);
    estado.tienda = clonar(TIENDA);
    estado.productos = clonar(PRODUCTOS);
    estado.carrito = {};
    pintarTodo();
    pintarPanelAdmin();
    toast('Todo volvió al original ♻️');
    return;
  }
});

/* --- Entradas de texto --- */
document.addEventListener('input', (e) => {
  const el = e.target;
  const d = el.dataset;

  if (el.id === 'buscar') {
    estado.busqueda = el.value.trim().toLowerCase();
    pintarGrilla();
    return;
  }
  if (el.id === 'quien') { estado.nombre = el.value; almacen.set(CLAVES.nombre, el.value); return; }
  if (el.id === 'nota') { estado.nota = el.value; return; }
  if ('nuevoPin' in d) { almacen.set(CLAVE_PIN, el.value.trim() || PIN_POR_DEFECTO); return; }

  if ('campo' in d) {
    const p = estado.productos[Number(d.i)];
    if (!p) return;
    const campo = d.campo;
    if (campo === 'precio') p.precio = Number(String(el.value).replace(/\D/g, '')) || 0;
    else if (campo === 'stock') p.stock = el.value.trim() === '' ? null : Number(String(el.value).replace(/\D/g, ''));
    else p[campo] = el.value;
    guardarConfig();
    return;
  }
  if ('tienda' in d) {
    const campo = d.tienda;
    if (campo === 'whatsapp') estado.tienda.whatsapp = el.value.replace(/\D/g, '');
    else if (campo === 'retiro') estado.tienda.retiro = el.value.split(',').map((s) => s.trim()).filter(Boolean);
    else estado.tienda[campo] = el.value;
    guardarConfig();
    return;
  }
  if ('promo' in d) {
    estado.tienda.promo = estado.tienda.promo || { cantidad: 0, porcentaje: 0 };
    estado.tienda.promo[d.promo] = Number(String(el.value).replace(/\D/g, '')) || 0;
    guardarConfig();
    return;
  }
  if ('premio' in d) {
    estado.tienda.premio = estado.tienda.premio || { caramelos: 0, texto: '' };
    estado.tienda.premio[d.premio] = d.premio === 'caramelos' ? Number(String(el.value).replace(/\D/g, '')) || 0 : el.value;
    guardarConfig();
  }
});

/* --- Importar copia JSON --- */
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'archivo-importar' || !e.target.files?.[0]) return;
  try {
    const texto = await e.target.files[0].text();
    const datos = JSON.parse(texto);
    if (datos.tienda) Object.assign(estado.tienda, datos.tienda);
    if (Array.isArray(datos.productos)) estado.productos = datos.productos;
    estado.carrito = {};
    guardarConfig();
    pintarTodo();
    pintarPanelAdmin();
    toast('Copia importada ✅');
  } catch {
    toast('No pudimos leer ese archivo');
  }
});

/* --------------------------------------------------------------------------
   Botones principales
   -------------------------------------------------------------------------- */
$('#btn-pedido').addEventListener('click', abrirPedido);
$('#btn-trivia').addEventListener('click', iniciarTrivia);
$('#btn-copiar-alias').addEventListener('click', () => copiar(estado.tienda.alias, 'Alias copiado ✅'));
$('#btn-compartir').addEventListener('click', compartirTienda);
$('#btn-cartel').addEventListener('click', abrirCartel);
$('#btn-panel').addEventListener('click', abrirPanel);

$('#btn-sonido').addEventListener('click', (e) => {
  estado.sonido = !estado.sonido;
  almacen.set(CLAVES.sonido, estado.sonido ? '1' : '0');
  e.currentTarget.textContent = estado.sonido ? '🔊' : '🔇';
  e.currentTarget.setAttribute('aria-pressed', String(estado.sonido));
  if (estado.sonido) sonar(660, 0.08);
});

/* Toque en el logo: saluda; dos toques empiezan el juego */
let toques = 0;
let temporizadorToques = null;

$('#btn-logo').addEventListener('click', (e) => {
  toques += 1;
  const boton = e.currentTarget;

  if (toques === 1) {
    saludar(boton);
    temporizadorToques = setTimeout(() => { toques = 0; }, 1600);
    return;
  }

  clearTimeout(temporizadorToques);
  toques = 0;
  boton.querySelector('.bub')?.remove();
  if (estado.tienda.juego === false) {
    toast('El juego está apagado por ahora');
    return;
  }
  iniciarJuego();
});

function saludar(boton) {
  boton.querySelector('.bub')?.remove();
  const b = document.createElement('div');
  b.className = 'bub';
  b.textContent = `¡Hola! Soy ${estado.tienda.nombre} 🍬`;
  boton.append(b);
  setTimeout(() => b.remove(), 1800);

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let i = 0; i < 10; i++) {
      const chispa = document.createElement('span');
      chispa.textContent = ['✨', '🍬', '⭐'][i % 3];
      chispa.style.cssText = 'position:absolute;left:50%;top:50%;font-size:16px;pointer-events:none';
      boton.append(chispa);
      const a = (i / 10) * 6.283;
      const r = 70 + (i % 3) * 14;
      chispa
        .animate(
          [
            { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r}px)) scale(.4) rotate(180deg)`, opacity: 0 },
          ],
          { duration: 800, easing: 'ease-out' }
        )
        .finished.finally(() => chispa.remove());
    }
  }
  sonar(660, 0.08);
  setTimeout(() => sonar(880, 0.08), 90);
  setTimeout(() => sonar(1320, 0.14), 180);
}

/* Botones internos del juego (se reemplazan al terminar la partida) */
document.addEventListener('click', (e) => {
  const id = e.target.id;
  if (id === 'j-jugar') correrJuego();
  else if (id === 'j-salir' || id === 'j-cerrar') cerrarJuego();
});

/* Escape cierra el juego */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && juego) cerrarJuego();
});

/* --------------------------------------------------------------------------
   Pintado completo
   -------------------------------------------------------------------------- */
function pintarTodo() {
  pintarTextos();
  pintarTicker();
  pintarCategorias();
  pintarGrilla();
  pintarPanel();
  pintarTrivia();
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */
function iniciar() {
  aplicarConfigGuardada();

  const guardado = almacen.json(CLAVES.carrito, null);
  if (guardado && typeof guardado === 'object') {
    Object.entries(guardado).forEach(([i, q]) => {
      const p = estado.productos[i];
      if (p && !agotado(p)) estado.carrito[i] = Math.min(q, stockDe(p));
    });
  }

  $('#btn-sonido').textContent = estado.sonido ? '🔊' : '🔇';
  $('#btn-sonido').setAttribute('aria-pressed', String(estado.sonido));

  pintarTodo();

  // Service Worker: la tienda queda disponible sin conexión y se puede instalar.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* sin soporte */ });
    });
  }

  // Instalación como app (Android/Chrome)
  let promptInstalar = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptInstalar = e;
    const cont = $('.foot__links');
    if (!cont || $('#btn-instalar')) return;
    const b = document.createElement('button');
    b.className = 'btn btn--ghost';
    b.id = 'btn-instalar';
    b.type = 'button';
    b.textContent = '📲 Instalar la app';
    b.addEventListener('click', async () => {
      promptInstalar.prompt();
      await promptInstalar.userChoice;
      b.remove();
    });
    cont.append(b);
  });
}

iniciar();
