/* ==========================================================================
   MR. LOLO — ARKANOID "Rompe Golosinas"
   --------------------------------------------------------------------------
   Tercer juego de la sala. Canvas puro, sin dependencias.
   Controles: dedo / mouse / flechas. Se lanza con un toque o con espacio.
   Power-ups: A = paleta ancha · M = multibola · S = bola lenta · L = vida.
   ========================================================================== */

/* Safari viejo no tiene roundRect: lo completamos para que el juego se vea
   igual en cualquier celular. */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 0) {
    const radio = Math.min(Number(r) || 0, Math.abs(w) / 2, Math.abs(h) / 2);
    this.beginPath();
    this.moveTo(x + radio, y);
    this.arcTo(x + w, y, x + w, y + h, radio);
    this.arcTo(x + w, y + h, x, y + h, radio);
    this.arcTo(x, y + h, x, y, radio);
    this.arcTo(x, y, x + w, y, radio);
    this.closePath();
    return this;
  };
}

const COLORES = ['#FFE600', '#00B1EA', '#FF5C7A', '#00FF88', '#C24BFF', '#FF9500'];
const TIPOS_ESPECIALES = {
  A: { nombre: 'Paleta ancha', color: '#00FF88', icono: '↔' },
  M: { nombre: 'Multibola', color: '#00B1EA', icono: '●●●' },
  S: { nombre: 'Bola lenta', color: '#C24BFF', icono: '🐢' },
  L: { nombre: 'Vida extra', color: '#FF5C7A', icono: '❤' },
};

const LIMITE = { arriba: 74, lateral: 8, abajo: 8 };

export function iniciarArkanoid(opciones = {}) {
  const {
    sonar = () => {},
    vibrar = () => {},
    alTerminar = () => {},
    alSalir = () => {},
    record = 0,
  } = opciones;

  const raiz = document.createElement('div');
  raiz.className = 'ark';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'Arkanoid: Rompe Golosinas');
  raiz.innerHTML = `
    <div class="ark__top">
      <span class="ark__brand">🍬 ROMPE GOLOSINAS</span>
      <div class="ark__hud">
        <span>PUNTOS <b data-ark="puntos">0</b></span>
        <span>NIVEL <b data-ark="nivel">1</b></span>
        <span>VIDAS <b data-ark="vidas">❤❤❤</b></span>
      </div>
      <button class="ark__x" type="button" data-ark="salir" aria-label="Salir">✕</button>
    </div>
    <div class="ark__stage" data-ark="stage">
      <canvas data-ark="lienzo"></canvas>
      <div class="ark__capa" data-ark="capa"></div>
      <div class="ark__tip">Movés la paleta con el dedo · tocá para lanzar</div>
    </div>
  `;
  document.body.append(raiz);

  const buscar = (n) => raiz.querySelector(`[data-ark="${n}"]`);
  const stage = buscar('stage');
  const lienzo = buscar('lienzo');
  const ctx = lienzo.getContext('2d');
  const capa = buscar('capa');
  const hudPuntos = buscar('puntos');
  const hudNivel = buscar('nivel');
  const hudVidas = buscar('vidas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  let ancho = 360;
  let alto = 560;
  let paleta = { x: 0, w: 100, h: 14, objetivo: 0, anchoBase: 100 };
  let bolas = [];
  let ladrillos = [];
  let premios = [];
  let chispas = [];
  let puntos = 0;
  let nivel = 1;
  let vidas = 3;
  let estado = 'listo';        // listo | jugando | pausa | nivel | fin
  let raf = 0;
  let ultimo = 0;
  let sacudida = 0;
  let aviso = '';
  let avisoHasta = 0;
  let cerrado = false;
  const velocidadBase = 400;

  /* --- Medidas ----------------------------------------------------------- */
  function medir() {
    const r = stage.getBoundingClientRect();
    ancho = Math.max(280, Math.round(r.width));
    alto = Math.max(380, Math.round(r.height));
    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
    lienzo.style.width = `${ancho}px`;
    lienzo.style.height = `${alto}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paleta.w = Math.min(140, Math.max(74, ancho * 0.24));
    paleta.h = 13;
    paleta.x = paleta.x ? Math.min(paleta.x, ancho - paleta.w) : (ancho - paleta.w) / 2;
    paleta.objetivo = paleta.x;
    if (ladrillos.length) pintarLadrillos();
    if (estado === 'listo') acomodarBola();
  }

  /* --- Niveles ----------------------------------------------------------- */
  function armarLadrillos() {
    const columnas = 7;
    const margen = 8;
    const hueco = 5;
    const w = (ancho - margen * 2 - hueco * (columnas - 1)) / columnas;
    const h = Math.max(16, Math.min(26, w * 0.34));
    const filas = 4 + Math.min(3, Math.floor((nivel - 1) / 2));
    const patron = nivel % 3;
    const nuevos = [];
    for (let f = 0; f < filas; f += 1) {
      for (let c = 0; c < columnas; c += 1) {
        // Formas distintas por nivel para que no se sienta siempre igual.
        if (patron === 1 && (f + c) % 4 === 0) continue;
        if (patron === 2 && f > 0 && (c === 0 || c === columnas - 1) && f % 2 === 1) continue;
        const doble = nivel >= 3 && (f + c) % 6 === 0;
        nuevos.push({
          x: margen + c * (w + hueco),
          y: LIMITE.arriba + f * (h + hueco),
          w,
          h,
          hp: doble ? 2 : 1,
          color: COLORES[(f + c + nivel) % COLORES.length],
        });
      }
    }
    ladrillos = nuevos;
  }

  function pintarLadrillos() {
    // Reacomoda si cambió el ancho de pantalla (rotar el celular).
    if (!ladrillos.length) return;
    const columnas = 7;
    const margen = 8;
    const hueco = 5;
    const w = (ancho - margen * 2 - hueco * (columnas - 1)) / columnas;
    const filas = Math.max(...ladrillos.map((l) => l.y));
    const altoFila = Math.max(16, Math.min(26, w * 0.34));
    ladrillos.forEach((l) => {
      const col = Math.round((l.x - margen) / (w + hueco));
      const fila = Math.round((l.y - LIMITE.arriba) / (altoFila + hueco));
      l.x = margen + col * (w + hueco);
      l.y = LIMITE.arriba + fila * (altoFila + hueco);
      l.w = w;
      l.h = altoFila;
    });
    void filas;
  }

  function acomodarBola() {
    bolas = [{
      x: paleta.x + paleta.w / 2,
      y: alto - 78,
      vx: 0,
      vy: 0,
      r: 7,
      pegada: true,
    }];
  }

  function lanzar() {
    if (estado === 'pausa') { reanudar(); return; }
    if (estado !== 'listo') return;
    const b = bolas[0];
    if (!b) return;
    const angulo = (-60 + Math.random() * 30) * (Math.PI / 180);
    const vel = velocidadBase + (nivel - 1) * 22;
    b.vx = Math.sin(angulo) * vel * (Math.random() < 0.5 ? -1 : 1);
    b.vy = -Math.abs(Math.cos(angulo) * vel);
    b.pegada = false;
    estado = 'jugando';
    ocultarCapa();
    sonar(720, 0.07);
    vibrar(10);
  }

  /* --- Entradas ---------------------------------------------------------- */
  const moverA = (clienteX) => {
    const r = stage.getBoundingClientRect();
    const x = clienteX - r.left;
    paleta.objetivo = Math.max(0, Math.min(ancho - paleta.w, x - paleta.w / 2));
  };

  const alMover = (e) => {
    if (e.pointerType === 'mouse' && e.buttons === 0 && estado !== 'jugando') return;
    moverA(e.clientX);
  };
  const alTocar = (e) => {
    moverA(e.clientX);
    if (estado === 'listo') lanzar();
    else if (estado === 'pausa') reanudar();
  };
  const alTeclear = (e) => {
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'a') { paleta.objetivo = Math.max(0, paleta.objetivo - 34); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd') { paleta.objetivo = Math.min(ancho - paleta.w, paleta.objetivo + 34); e.preventDefault(); }
    if (e.key === ' ') { e.preventDefault(); lanzar(); }
    if (e.key === 'p' || e.key === 'P') { estado === 'pausa' ? reanudar() : pausar(); }
  };

  stage.addEventListener('pointermove', alMover);
  stage.addEventListener('pointerdown', alTocar);
  document.addEventListener('keydown', alTeclear);
  window.addEventListener('resize', medir);

  /* --- Capas de texto ---------------------------------------------------- */
  function mostrarCapa(html) {
    capa.innerHTML = html;
    capa.classList.add('ark__capa--on');
  }
  function ocultarCapa() {
    capa.classList.remove('ark__capa--on');
    capa.innerHTML = '';
  }

  function pausar() {
    if (estado !== 'jugando') return;
    estado = 'pausa';
    mostrarCapa(`
      <p class="ark__titulo">PAUSA</p>
      <p class="ark__sub">La golosina te espera 🍭</p>
      <div class="ark__acciones">
        <button class="btn btn--primary" type="button" data-ark="seguir">Seguir</button>
        <button class="btn btn--ghost" type="button" data-ark="salir">Salir</button>
      </div>`);
  }

  function reanudar() {
    if (estado !== 'pausa') return;
    estado = 'jugando';
    ultimo = performance.now();
    ocultarCapa();
  }

  function siguienteNivel() {
    nivel += 1;
    puntos += 150;
    aviso = `¡NIVEL ${nivel}!`;
    avisoHasta = performance.now() + 1600;
    armarLadrillos();
    acomodarBola();
    paleta.w = paleta.anchoBase;
    premios = [];
    estado = 'listo';
    actualizarHud();
    ocultarCapa();
    sonar(880, 0.08);
    setTimeout(() => sonar(1180, 0.12), 110);
  }

  function perderVida() {
    vidas -= 1;
    actualizarHud();
    sonar(180, 0.26, 'sawtooth');
    vibrar([40, 50, 40]);
    if (vidas <= 0) {
      terminar();
      return;
    }
    premios = [];
    paleta.w = paleta.anchoBase;
    acomodarBola();
    estado = 'listo';
    aviso = '¡Cuidado!';
    avisoHasta = performance.now() + 900;
  }

  function terminar() {
    estado = 'fin';
    cancelAnimationFrame(raf);
    dibujar();
    alTerminar(puntos, { nivel, record });
  }

  function actualizarHud() {
    hudPuntos.textContent = puntos;
    hudNivel.textContent = nivel;
    hudVidas.textContent = '❤'.repeat(Math.max(0, vidas)) || '—';
  }

  /* --- Física ------------------------------------------------------------ */
  function soltarPremio(x, y) {
    const suerte = Math.random();
    if (suerte > 0.24) return;
    const dados = [
      ['A', 0.34], ['M', 0.3], ['S', 0.22], ['L', 0.14],
    ];
    let r = Math.random();
    let tipo = 'A';
    for (const [t, p] of dados) {
      if (r < p) { tipo = t; break; }
      r -= p;
    }
    premios.push({ x, y, tipo, vy: 130 });
  }

  function aplicarPremio(tipo) {
    const info = TIPOS_ESPECIALES[tipo];
    aviso = `${info.icono} ${info.nombre}`;
    avisoHasta = performance.now() + 1200;
    if (tipo === 'A') paleta.w = Math.min(ancho * 0.55, paleta.w * 1.55);
    if (tipo === 'M') {
      const base = bolas.find((b) => b.vy) || bolas[0];
      if (base) {
        for (const desvio of [-0.55, 0.55]) {
          const vel = Math.hypot(base.vx, base.vy) || velocidadBase;
          const ang = Math.atan2(base.vy, base.vx) + desvio;
          bolas.push({ x: base.x, y: base.y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, r: base.r, pegada: false });
        }
      }
    }
    if (tipo === 'S') bolas.forEach((b) => { if (!b.pegada) { b.vx *= 0.72; b.vy *= 0.72; } });
    if (tipo === 'L') { vidas += 1; actualizarHud(); }
    puntos += 30;
    sonar(1040, 0.08);
    actualizarHud();
  }

  function golpearLadrillo(b, l) {
    const cercaX = Math.max(l.x, Math.min(b.x, l.x + l.w));
    const cercaY = Math.max(l.y, Math.min(b.y, l.y + l.h));
    const dx = b.x - cercaX;
    const dy = b.y - cercaY;
    const dist = Math.hypot(dx, dy);
    if (dist > b.r) return false;

    // Rebote según por dónde entró.
    const solapaX = b.r - Math.abs(dx);
    const solapaY = b.r - Math.abs(dy);
    if (solapaX < solapaY) b.vx *= -1;
    else b.vy *= -1;

    l.hp -= 1;
    if (l.hp <= 0) {
      const i = ladrillos.indexOf(l);
      if (i > -1) ladrillos.splice(i, 1);
      puntos += 40 + nivel * 5;
      soltarPremio(l.x + l.w / 2, l.y + l.h / 2);
      for (let k = 0; k < 7; k += 1) {
        chispas.push({
          x: l.x + Math.random() * l.w,
          y: l.y + Math.random() * l.h,
          vx: (Math.random() - 0.5) * 190,
          vy: (Math.random() - 0.5) * 190,
          vida: 0.45,
          color: l.color,
        });
      }
      sonar(560 + Math.random() * 220, 0.045);
      vibrar(6);
    } else {
      puntos += 12;
      sonar(320, 0.04);
    }
    actualizarHud();

    if (!ladrillos.length) siguienteNivel();
    return true;
  }

  function paso(dt) {
    // Paleta con easing: se siente moderna y no pierde precisión.
    paleta.x += (paleta.objetivo - paleta.x) * Math.min(1, dt * 22);

    if (estado === 'listo' && bolas[0]) {
      bolas[0].x = paleta.x + paleta.w / 2;
      bolas[0].y = alto - 44;
      return;
    }

    bolas.forEach((b) => {
      if (b.pegada) return;
      const pasos = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / 6));
      for (let s = 0; s < pasos; s += 1) {
        const sub = dt / pasos;
        b.x += b.vx * sub;
        b.y += b.vy * sub;

        if (b.x - b.r < LIMITE.lateral) { b.x = LIMITE.lateral + b.r; b.vx = Math.abs(b.vx); sonar(420, 0.03); }
        if (b.x + b.r > ancho - LIMITE.lateral) { b.x = ancho - LIMITE.lateral - b.r; b.vx = -Math.abs(b.vx); sonar(420, 0.03); }
        if (b.y - b.r < LIMITE.arriba) { b.y = LIMITE.arriba + b.r; b.vy = Math.abs(b.vy); sonar(420, 0.03); }

        // Paleta
        if (b.vy > 0 &&
            b.y + b.r >= alto - 34 &&
            b.y + b.r <= alto - 34 + paleta.h + 10 &&
            b.x >= paleta.x - b.r &&
            b.x <= paleta.x + paleta.w + b.r) {
          const rel = (b.x - (paleta.x + paleta.w / 2)) / (paleta.w / 2);
          const ang = rel * (Math.PI / 3);
          const vel = Math.min(760, Math.hypot(b.vx, b.vy) * 1.015 + 6);
          b.vx = Math.sin(ang) * vel;
          b.vy = -Math.abs(Math.cos(ang) * vel);
          b.y = alto - 34 - b.r;
          sonar(660, 0.05);
          vibrar(8);
        }

        for (const l of [...ladrillos]) {
          if (golpearLadrillo(b, l)) break;
        }
      }
    });

    bolas = bolas.filter((b) => b.y - b.r < alto + 30);

    // Premios que caen
    premios.forEach((p) => { p.y += p.vy * dt; });
    premios = premios.filter((p) => {
      if (p.y > alto - 40 && p.y < alto - 10 && p.x > paleta.x - 12 && p.x < paleta.x + paleta.w + 12) {
        aplicarPremio(p.tipo);
        return false;
      }
      return p.y < alto + 20;
    });

    if (!bolas.length) perderVida();

    chispas.forEach((c) => {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 240 * dt;
      c.vida -= dt;
    });
    chispas = chispas.filter((c) => c.vida > 0);

    if (sacudida > 0) sacudida = Math.max(0, sacudida - dt * 6);
  }

  /* --- Dibujo ------------------------------------------------------------ */
  function dibujar(ahora = performance.now()) {
    ctx.save();
    if (sacudida > 0) {
      ctx.translate((Math.random() - 0.5) * sacudida * 6, (Math.random() - 0.5) * sacudida * 6);
    }

    const fondo = ctx.createLinearGradient(0, 0, 0, alto);
    fondo.addColorStop(0, '#140A2E');
    fondo.addColorStop(0.55, '#0A0E1B');
    fondo.addColorStop(1, '#05070F');
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);

    // Estrellas suaves
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    for (let i = 0; i < 26; i += 1) {
      const x = ((i * 97) % ancho);
      const y = ((i * 53 + (ahora / 90)) % alto);
      ctx.fillRect(x, y, 1.6, 1.6);
    }

    // Ladrillos
    ladrillos.forEach((l) => {
      const grad = ctx.createLinearGradient(l.x, l.y, l.x, l.y + l.h);
      grad.addColorStop(0, l.color);
      grad.addColorStop(1, `${l.color}99`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(l.x, l.y, l.w, l.h, 6);
      ctx.fill();
      if (l.hp > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.beginPath();
      ctx.roundRect(l.x + 3, l.y + 2.5, Math.max(4, l.w - 6), 2.5, 2);
      ctx.fill();
    });

    // Premios
    premios.forEach((p) => {
      const info = TIPOS_ESPECIALES[p.tipo];
      ctx.save();
      ctx.shadowColor = info.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = info.color;
      ctx.beginPath();
      ctx.roundRect(p.x - 13, p.y - 9, 26, 18, 9);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#05070F';
      ctx.font = '800 11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.tipo, p.x, p.y + 0.5);
    });

    // Chispas
    chispas.forEach((c) => {
      ctx.globalAlpha = Math.max(0, c.vida / 0.45);
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    // Paleta
    const gradPaleta = ctx.createLinearGradient(paleta.x, 0, paleta.x + paleta.w, 0);
    gradPaleta.addColorStop(0, '#FFE600');
    gradPaleta.addColorStop(0.5, '#FFB300');
    gradPaleta.addColorStop(1, '#FFE600');
    ctx.save();
    ctx.shadowColor = '#FFE600';
    ctx.shadowBlur = 18;
    ctx.fillStyle = gradPaleta;
    ctx.beginPath();
    ctx.roundRect(paleta.x, alto - 34, paleta.w, paleta.h, 7);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.roundRect(paleta.x + 4, alto - 32, paleta.w - 8, 3, 2);
    ctx.fill();

    // Pelotas
    bolas.forEach((b) => {
      ctx.save();
      ctx.shadowColor = '#00B1EA';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#00B1EA';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    });

    // Aviso flotante
    if (aviso && ahora < avisoHasta) {
      ctx.globalAlpha = Math.min(1, (avisoHasta - ahora) / 300);
      ctx.fillStyle = '#FFE600';
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(aviso, ancho / 2, alto / 2 - 40);
      ctx.globalAlpha = 1;
    }

    if (estado === 'listo' && !aviso) {
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tocá la pantalla para lanzar', ancho / 2, alto - 60);
    }

    ctx.restore();
  }

  /* --- Ciclo ------------------------------------------------------------- */
  function bucle(ahora) {
    if (cerrado) return;
    const dt = Math.min(0.032, (ahora - ultimo) / 1000 || 0.016);
    ultimo = ahora;
    if (!document.hidden && estado !== 'pausa' && estado !== 'fin') paso(dt);
    if (!cerrado) dibujar(ahora);
    // Si terminó (o la sala ya lo cerró), no dejamos el bucle girando.
    if (cerrado || estado === 'fin') return;
    raf = requestAnimationFrame(bucle);
  }

  /* --- Salir / romper ---------------------------------------------------- */
  function cerrar() {
    cerrado = true;
    cancelAnimationFrame(raf);
    stage.removeEventListener('pointermove', alMover);
    stage.removeEventListener('pointerdown', alTocar);
    document.removeEventListener('keydown', alTeclear);
    window.removeEventListener('resize', medir);
    raiz.remove();
    alSalir();
  }

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ark]');
    if (!b) return;
    const accion = b.dataset.ark;
    if (accion === 'salir') cerrar();
    else if (accion === 'seguir') reanudar();
    else if (accion === 'pausa') { estado === 'pausa' ? reanudar() : pausar(); }
  });

  /* --- Arranque ---------------------------------------------------------- */
  medir();
  paleta.anchoBase = paleta.w;
  armarLadrillos();
  acomodarBola();
  actualizarHud();
  dibujar();
  ultimo = performance.now();
  raf = requestAnimationFrame(bucle);

  // Pequeña bienvenida con el record a la vista.
  if (record > 0) {
    aviso = `Récord: ${record}`;
    avisoHasta = performance.now() + 1800;
  }

  return { cerrar, raiz, pausar };
}
