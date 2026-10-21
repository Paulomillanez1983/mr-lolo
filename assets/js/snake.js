/* ==========================================================================
   MR. LOLO — SERPIENTE GOLOSA
   --------------------------------------------------------------------------
   Cuarto juego de la sala. Neón, swipe y flechas.
   Cada golosina suma 10 puntos y la serpiente va más rápido.
   ========================================================================== */

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

export function iniciarSnake(opciones = {}) {
  const {
    sonar = () => {},
    vibrar = () => {},
    alTerminar = () => {},
    alSalir = () => {},
    record = 0,
  } = opciones;

  const raiz = document.createElement('div');
  raiz.className = 'snk';
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'Serpiente golosa');
  raiz.innerHTML = `
    <div class="snk__top">
      <span class="snk__brand">🐍 SERPIENTE GOLOSA</span>
      <div class="snk__hud">
        <span>PUNTOS <b data-snk="puntos">0</b></span>
        <span>RÉCORD <b data-snk="record">${record}</b></span>
      </div>
      <button class="snk__x" type="button" data-snk="salir" aria-label="Salir">✕</button>
    </div>
    <div class="snk__stage" data-snk="stage">
      <canvas data-snk="lienzo"></canvas>
      <div class="snk__capa" data-snk="capa"></div>
    </div>
    <div class="snk__pad">
      <button type="button" data-snk="arriba" aria-label="Arriba">▲</button>
      <button type="button" data-snk="izq" aria-label="Izquierda">◀</button>
      <button type="button" data-snk="abajo" aria-label="Abajo">▼</button>
      <button type="button" data-snk="der" aria-label="Derecha">▶</button>
    </div>
  `;
  document.body.append(raiz);

  const buscar = (n) => raiz.querySelector(`[data-snk="${n}"]`);
  const stage = buscar('stage');
  const lienzo = buscar('lienzo');
  const ctx = lienzo.getContext('2d');
  const capa = buscar('capa');
  const hudPuntos = buscar('puntos');
  const hudRecord = buscar('record');
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const COLUMNAS = 17;
  let filas = 22;
  let celda = 16;
  let ancho = 300;
  let alto = 400;

  let cuerpo = [];
  let direccion = { x: 1, y: 0 };
  let proxima = { x: 1, y: 0 };
  let comida = { x: 5, y: 5, tipo: 0 };
  let puntos = 0;
  let mejor = Number(record) || 0;
  let estado = 'jugando';     // jugando | pausa | fin
  let acumulado = 0;
  let ultimo = 0;
  let raf = 0;
  let chispas = [];
  let pulso = 0;
  let swipe = null;
  let aviso = '';
  let avisoHasta = 0;
  let cerrado = false;

  const SABORES = ['#FFE600', '#FF5C7A', '#00B1EA', '#00FF88', '#C24BFF'];

  function medir() {
    const r = stage.getBoundingClientRect();
    ancho = Math.max(240, Math.round(r.width));
    alto = Math.max(280, Math.round(r.height));
    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
    lienzo.style.width = `${ancho}px`;
    lienzo.style.height = `${alto}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    celda = Math.floor(Math.min(ancho / COLUMNAS, alto / 24));
    filas = Math.floor(alto / celda);
    if (cuerpo.length) {
      cuerpo = cuerpo.map((s) => ({ x: Math.min(s.x, COLUMNAS - 1), y: Math.min(s.y, filas - 1) }));
      comida.x = Math.min(comida.x, COLUMNAS - 1);
      comida.y = Math.min(comida.y, filas - 1);
    }
  }

  function reiniciar() {
    const medio = Math.floor(filas / 2);
    cuerpo = [
      { x: 5, y: medio },
      { x: 4, y: medio },
      { x: 3, y: medio },
    ];
    direccion = { x: 1, y: 0 };
    proxima = { x: 1, y: 0 };
    puntos = 0;
    acumulado = 0;
    chispas = [];
    estado = 'jugando';
    aviso = '';
    sembrarComida();
    actualizarHud();
    ocultarCapa();
    ultimo = performance.now();
  }

  function sembrarComida() {
    let intentos = 0;
    do {
      comida = {
        x: Math.floor(Math.random() * COLUMNAS),
        y: Math.floor(Math.random() * filas),
        tipo: Math.floor(Math.random() * SABORES.length),
      };
      intentos += 1;
    } while (intentos < 60 && cuerpo.some((s) => s.x === comida.x && s.y === comida.y));
  }

  function actualizarHud() {
    hudPuntos.textContent = puntos;
    hudRecord.textContent = Math.max(mejor, puntos);
  }

  function velocidad() {
    // Arranca cómoda y acelera de a poco: 6,2 → 13 celdas por segundo.
    return Math.min(13, 6.2 + puntos * 0.018);
  }

  function girar(x, y) {
    if (estado !== 'jugando') return;
    if (direccion.x === -x && direccion.y === -y) return;
    if (direccion.x === 0 && x === 0 && direccion.y === 0) return;
    proxima = { x, y };
  }

  function paso() {
    direccion = proxima;
    const cabeza = {
      x: cuerpo[0].x + direccion.x,
      y: cuerpo[0].y + direccion.y,
    };

    if (cabeza.x < 0 || cabeza.y < 0 || cabeza.x >= COLUMNAS || cabeza.y >= filas) {
      return morir();
    }
    if (cuerpo.some((s, i) => i < cuerpo.length - 1 && s.x === cabeza.x && s.y === cabeza.y)) {
      return morir();
    }

    cuerpo.unshift(cabeza);
    if (cabeza.x === comida.x && cabeza.y === comida.y) {
      puntos += 10;
      pulso = 1;
      for (let i = 0; i < 10; i += 1) {
        chispas.push({
          x: comida.x * celda + celda / 2,
          y: comida.y * celda + celda / 2,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          vida: 0.5,
          color: SABORES[comida.tipo],
        });
      }
      sembrarComida();
      sonar(880 + Math.random() * 180, 0.06);
      vibrar(10);
      actualizarHud();
    } else {
      cuerpo.pop();
    }
  }

  function morir() {
    estado = 'fin';
    cancelAnimationFrame(raf);
    sonar(140, 0.3, 'sawtooth');
    vibrar([50, 60, 50]);
    if (puntos > mejor) mejor = puntos;
    dibujar();
    alTerminar(puntos, { largo: cuerpo.length, record: mejor });
  }

  function pausar() {
    if (estado === 'jugando') {
      estado = 'pausa';
      mostrarCapa(`
        <p class="snk__titulo">PAUSA</p>
        <p class="snk__sub">Respirá que hay más golosinas 🍬</p>
        <div class="snk__acciones">
          <button class="btn btn--primary" type="button" data-snk="seguir">Seguir</button>
          <button class="btn btn--ghost" type="button" data-snk="salir">Salir</button>
        </div>`);
    } else if (estado === 'pausa') {
      estado = 'jugando';
      ultimo = performance.now();
      ocultarCapa();
    }
  }

  function mostrarCapa(html) {
    capa.innerHTML = html;
    capa.classList.add('snk__capa--on');
  }
  function ocultarCapa() {
    capa.innerHTML = '';
    capa.classList.remove('snk__capa--on');
  }

  /* --- Dibujo ------------------------------------------------------------ */
  function dibujar(ahora = performance.now()) {
    const fondo = ctx.createLinearGradient(0, 0, 0, alto);
    fondo.addColorStop(0, '#071426');
    fondo.addColorStop(1, '#05070F');
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);

    // Grilla tenue
    ctx.strokeStyle = 'rgba(0,177,234,.10)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLUMNAS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * celda + 0.5, 0);
      ctx.lineTo(x * celda + 0.5, alto);
      ctx.stroke();
    }
    for (let y = 0; y <= filas; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * celda + 0.5);
      ctx.lineTo(ancho, y * celda + 0.5);
      ctx.stroke();
    }

    // Comida con pulso
    pulso = Math.max(0, pulso - 0.04);
    const brillo = 1 + Math.sin(ahora / 180) * 0.08 + pulso * 0.25;
    const cx = comida.x * celda + celda / 2;
    const cy = comida.y * celda + celda / 2;
    ctx.save();
    ctx.shadowColor = SABORES[comida.tipo];
    ctx.shadowBlur = 18;
    ctx.fillStyle = SABORES[comida.tipo];
    ctx.beginPath();
    ctx.arc(cx, cy, (celda * 0.34) * brillo, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath();
    ctx.arc(cx - celda * 0.08, cy - celda * 0.1, celda * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Serpiente
    cuerpo.forEach((s, i) => {
      const t = i / Math.max(1, cuerpo.length - 1);
      const x = s.x * celda + 1.5;
      const y = s.y * celda + 1.5;
      const lado = celda - 3;
      ctx.save();
      if (i === 0) {
        ctx.shadowColor = '#FFE600';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#FFE600';
      } else {
        const grad = ctx.createLinearGradient(x, y, x + lado, y + lado);
        grad.addColorStop(0, '#00FF88');
        grad.addColorStop(1, `rgba(0,177,234,${0.85 - t * 0.35})`);
        ctx.fillStyle = grad;
      }
      ctx.beginPath();
      ctx.roundRect(x, y, lado, lado, i === 0 ? 7 : 5);
      ctx.fill();
      ctx.restore();
    });

    // Ojos de la cabeza
    if (cuerpo[0]) {
      const h = cuerpo[0];
      const cxp = h.x * celda + celda / 2;
      const cyp = h.y * celda + celda / 2;
      const off = celda * 0.17;
      const dx = direccion.y !== 0 ? off : 0;
      const dy = direccion.x !== 0 ? off : 0;
      ctx.fillStyle = '#05070F';
      ctx.beginPath();
      ctx.arc(cxp + dx - (direccion.x < 0 ? off : 0), cyp + dy - (direccion.y < 0 ? off : 0), celda * 0.11, 0, Math.PI * 2);
      ctx.arc(cxp - dx + (direccion.x > 0 ? off : 0), cyp - dy + (direccion.y > 0 ? off : 0), celda * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chispas
    chispas.forEach((c) => {
      c.x += c.vx * 0.016;
      c.y += c.vy * 0.016;
      c.vida -= 0.016;
      ctx.globalAlpha = Math.max(0, c.vida / 0.5);
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, 3, 3);
    });
    ctx.globalAlpha = 1;
    chispas = chispas.filter((c) => c.vida > 0);

    if (aviso && ahora < avisoHasta) {
      ctx.globalAlpha = Math.min(1, (avisoHasta - ahora) / 300);
      ctx.fillStyle = '#FFE600';
      ctx.font = '800 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(aviso, ancho / 2, 46);
      ctx.globalAlpha = 1;
    }
  }

  function bucle(ahora) {
    if (cerrado) return;
    const dt = Math.min(0.05, (ahora - ultimo) / 1000 || 0.016);
    ultimo = ahora;
    if (!document.hidden && estado === 'jugando') {
      acumulado += dt;
      const intervalo = 1 / velocidad();
      let vueltas = 0;
      while (acumulado >= intervalo && vueltas < 4 && estado === 'jugando') {
        acumulado -= intervalo;
        paso();
        vueltas += 1;
      }
    }
    if (!cerrado) dibujar(ahora);
    if (cerrado || estado === 'fin') return;
    raf = requestAnimationFrame(bucle);
  }

  /* --- Entradas ---------------------------------------------------------- */
  const alTeclear = (e) => {
    const mapa = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    };
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key === 'p' || e.key === 'P') { pausar(); return; }
    const dir = mapa[e.key] || mapa[e.key.toLowerCase()];
    if (dir) {
      e.preventDefault();
      girar(dir[0], dir[1]);
    }
  };

  const alBajar = (e) => { swipe = { x: e.clientX, y: e.clientY }; };
  const alSoltar = (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) girar(dx > 0 ? 1 : -1, 0);
    else girar(0, dy > 0 ? 1 : -1);
  };

  stage.addEventListener('pointerdown', alBajar);
  stage.addEventListener('pointerup', alSoltar);
  document.addEventListener('keydown', alTeclear);
  window.addEventListener('resize', medir);

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-snk]');
    if (!b) return;
    const a = b.dataset.snk;
    if (a === 'salir') cerrar();
    else if (a === 'seguir') pausar();
    else if (a === 'arriba') girar(0, -1);
    else if (a === 'abajo') girar(0, 1);
    else if (a === 'izq') girar(-1, 0);
    else if (a === 'der') girar(1, 0);
  });

  function cerrar() {
    cerrado = true;
    cancelAnimationFrame(raf);
    stage.removeEventListener('pointerdown', alBajar);
    stage.removeEventListener('pointerup', alSoltar);
    document.removeEventListener('keydown', alTeclear);
    window.removeEventListener('resize', medir);
    raiz.remove();
    alSalir();
  }

  /* --- Arranque ---------------------------------------------------------- */
  medir();
  reiniciar();
  if (mejor > 0) {
    aviso = `Récord: ${mejor}`;
    avisoHasta = performance.now() + 1600;
  }
  dibujar();
  raf = requestAnimationFrame(bucle);

  return { cerrar, raiz, pausar };
}
