/* ==========================================================================
   MR. LOLO — Motor de efectos "next-gen"
   --------------------------------------------------------------------------
   Sin librerías ni archivos de audio: todo se sintetiza en el navegador.

   · Música de fondo por juego (secuenciador WebAudio)
   · Confeti, destellos y sacudidas
   · Transición cinematográfica al abrir un juego
   · Arranque de la sala tipo consola
   ========================================================================== */

const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;

const TEMAS = {
  sala: {
    bpm: 104,
    bajo: [55, 55, 82.41, 55, 65.41, 65.41, 98, 65.41],
    lead: [440, 0, 554.37, 659.25, 0, 554.37, 493.88, 0],
    tipo: 'triangle',
    brillo: 0.5,
  },
  quiz: {
    bpm: 124,
    bajo: [65.41, 65.41, 98, 65.41, 73.42, 73.42, 110, 73.42],
    lead: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46],
    tipo: 'square',
    brillo: 0.42,
  },
  arkanoid: {
    bpm: 132,
    bajo: [49, 49, 73.42, 49, 55, 55, 82.41, 55],
    lead: [392, 0, 523.25, 0, 587.33, 0, 659.25, 783.99],
    tipo: 'sawtooth',
    brillo: 0.32,
  },
  snake: {
    bpm: 118,
    bajo: [43.65, 43.65, 65.41, 43.65, 49, 49, 73.42, 49],
    lead: [349.23, 392, 440, 392, 349.23, 293.66, 261.63, 293.66],
    tipo: 'triangle',
    brillo: 0.4,
  },
  memoria: {
    bpm: 92,
    bajo: [58.27, 58.27, 87.31, 58.27, 65.41, 65.41, 98, 65.41],
    lead: [466.16, 0, 587.33, 0, 698.46, 0, 587.33, 466.16],
    tipo: 'sine',
    brillo: 0.55,
  },
  tetris: {
    bpm: 128,
    bajo: [55, 82.41, 55, 82.41, 65.41, 98, 65.41, 98],
    lead: [659.25, 493.88, 523.25, 587.33, 659.25, 783.99, 880, 783.99],
    tipo: 'square',
    brillo: 0.34,
  },
  caramelos: {
    bpm: 112,
    bajo: [61.74, 61.74, 92.5, 61.74, 69.3, 69.3, 103.83, 69.3],
    lead: [493.88, 587.33, 739.99, 587.33, 554.37, 659.25, 830.61, 659.25],
    tipo: 'triangle',
    brillo: 0.46,
  },
};

class MotorFX {
  constructor() {
    this.ctx = null;
    this.maestro = null;
    this.comp = null;
    this.tema = null;
    this.paso = 0;
    this.reloj = null;
    this.silenciado = localStorage.getItem('mrlolo.sonido') === 'off';
    this.ruido = null;
    this.ultimo = 0;
    this.oyentes = new Set();
  }

  /* --- Audio ------------------------------------------------------------- */
  iniciar() {
    if (this.ctx || !AudioCtx) return;
    try {
      this.ctx = new AudioCtx();
      this.maestro = this.ctx.createGain();
      this.maestro.gain.value = this.silenciado ? 0 : 0.085;
      this.comp = this.ctx.createDynamicsCompressor();
      this.maestro.connect(this.comp).connect(this.ctx.destination);
      this.prepararRuido();
    } catch {
      this.ctx = null;
    }
  }

  prepararRuido() {
    if (!this.ctx) return;
    const largo = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, largo, this.ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < largo; i += 1) datos[i] = Math.random() * 2 - 1;
    this.ruido = buffer;
  }

  despertar() {
    this.iniciar();
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  tono(frec, dur = 0.12, tipo = 'square', vol = 0.5, cuando = 0, deslizar = 0) {
    if (!this.ctx || this.silenciado) return;
    const t = this.ctx.currentTime + cuando;
    const osc = this.ctx.createOscillator();
    const gan = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frec, t);
    if (deslizar) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frec + deslizar), t + dur);
    gan.gain.setValueAtTime(0, t);
    gan.gain.linearRampToValueAtTime(vol, t + 0.012);
    gan.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gan).connect(this.maestro);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  percusion(cuando = 0, vol = 0.12) {
    if (!this.ctx || !this.ruido || this.silenciado) return;
    const t = this.ctx.currentTime + cuando;
    const fuente = this.ctx.createBufferSource();
    fuente.buffer = this.ruido;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'highpass';
    filtro.frequency.value = 7000;
    const gan = this.ctx.createGain();
    gan.gain.setValueAtTime(vol, t);
    gan.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    fuente.connect(filtro).connect(gan).connect(this.maestro);
    fuente.start(t);
    fuente.stop(t + 0.06);
  }

  sfx(nombre) {
    if (!this.ctx || this.silenciado) return;
    switch (nombre) {
      case 'moneda':
        this.tono(987.77, 0.06, 'square', 0.3);
        this.tono(1318.5, 0.12, 'square', 0.28, 0.06);
        break;
      case 'start':
        [392, 523.25, 659.25, 783.99].forEach((f, i) => this.tono(f, 0.12, 'triangle', 0.3, i * 0.07));
        break;
      case 'acierto':
        [523.25, 659.25, 783.99].forEach((f, i) => this.tono(f, 0.18, 'triangle', 0.26, i * 0.05));
        break;
      case 'error':
        this.tono(196, 0.22, 'sawtooth', 0.22, 0, -60);
        this.tono(146.83, 0.24, 'square', 0.14, 0.04);
        break;
      case 'golpe':
        this.tono(110, 0.08, 'square', 0.3, 0, -40);
        this.percusion(0, 0.1);
        break;
      case 'nivel':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tono(f, 0.2, 'square', 0.22, i * 0.08));
        break;
      case 'record':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tono(f, 0.3, 'triangle', 0.24, i * 0.09));
        break;
      case 'whoosh':
        this.tono(220, 0.3, 'sawtooth', 0.12, 0, 600);
        break;
      default:
        break;
    }
  }

  musica(tema = 'sala') {
    const partitura = TEMAS[tema] || TEMAS.sala;
    if (this.tema === tema && this.reloj) return;
    this.pararMusica(false);
    this.iniciar();
    if (!this.ctx) return;
    this.despertar();
    // Si veníamos de un fade, devolvemos el volumen para que no arranque mudo.
    if (this.maestro) {
      const t = this.ctx.currentTime;
      this.maestro.gain.cancelScheduledValues(t);
      this.maestro.gain.setValueAtTime(this.silenciado ? 0 : 0.085, t);
    }
    this.tema = tema;
    this.paso = 0;
    const pasoMs = (60000 / partitura.bpm) / 2;
    this.reloj = setInterval(() => this.tick(partitura), pasoMs);
    this.tick(partitura);
  }

  tick(p) {
    if (!this.ctx || this.silenciado) return;
    const i = this.paso % 8;
    const bajo = p.bajo[i];
    if (i % 2 === 0) this.tono(bajo, 0.22, 'triangle', 0.32);
    const lead = p.lead[i];
    if (lead) this.tono(lead, 0.14, p.tipo, p.brillo * 0.5);
    this.percusion(0, i % 2 === 0 ? 0.09 : 0.05);
    if (i === 6) this.tono(bajo * 2, 0.1, p.tipo, p.brillo * 0.25);
    this.paso += 1;
  }

  pararMusica(bajar = true) {
    if (this.reloj) {
      clearInterval(this.reloj);
      this.reloj = null;
    }
    this.tema = null;
    if (bajar && this.maestro && this.ctx) {
      const t = this.ctx.currentTime;
      this.maestro.gain.cancelScheduledValues(t);
      this.maestro.gain.setValueAtTime(this.maestro.gain.value, t);
      this.maestro.gain.linearRampToValueAtTime(0, t + 0.25);
      setTimeout(() => {
        if (!this.reloj && this.maestro) this.maestro.gain.value = this.silenciado ? 0 : 0.085;
      }, 300);
    }
  }

  alternarSonido() {
    this.silenciado = !this.silenciado;
    localStorage.setItem('mrlolo.sonido', this.silenciado ? 'off' : 'on');
    if (this.maestro) this.maestro.gain.value = this.silenciado ? 0 : 0.085;
    if (!this.silenciado) {
      this.despertar();
      if (this.tema) { const t = this.tema; this.tema = null; this.musica(t); }
    }
    this.avisar();
    return this.silenciado;
  }

  avisar() {
    this.oyentes.forEach((fn) => {
      try { fn(this.silenciado); } catch { /* ignorado */ }
    });
  }

  observadorSonido(fn) {
    this.oyentes.add(fn);
    return () => this.oyentes.delete(fn);
  }

  /* --- Efectos visuales -------------------------------------------------- */
  vibrar(patron = 12) {
    if (navigator.vibrate && !this.silenciado) {
      try { navigator.vibrate(patron); } catch { /* ignorado */ }
    }
  }

  confeti(cantidad = 90, colores = ['#FFE600', '#00B1EA', '#FF5C7A', '#00FF88', '#C24BFF', '#FF9500']) {
    const lienzo = document.createElement('canvas');
    lienzo.className = 'fx-confeti';
    lienzo.width = window.innerWidth * Math.min(2, window.devicePixelRatio || 1);
    lienzo.height = window.innerHeight * Math.min(2, window.devicePixelRatio || 1);
    lienzo.style.width = '100%';
    lienzo.style.height = '100%';
    document.body.append(lienzo);
    const ctx = lienzo.getContext('2d');
    if (!ctx) { lienzo.remove(); return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    const piezas = Array.from({ length: cantidad }, () => ({
      x: ancho / 2 + (Math.random() - 0.5) * ancho * 0.8,
      y: alto * 0.35 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 520,
      vy: -Math.random() * 620 - 120,
      w: 5 + Math.random() * 7,
      h: 8 + Math.random() * 10,
      giro: Math.random() * Math.PI,
      va: (Math.random() - 0.5) * 12,
      color: colores[Math.floor(Math.random() * colores.length)],
      vida: 1.6 + Math.random() * 0.8,
    }));
    let ultimo = performance.now();
    const animar = (ahora) => {
      const dt = Math.min(0.04, (ahora - ultimo) / 1000);
      ultimo = ahora;
      ctx.clearRect(0, 0, ancho, alto);
      let vivos = 0;
      piezas.forEach((p) => {
        p.vida -= dt;
        if (p.vida <= 0) return;
        vivos += 1;
        p.vy += 1500 * dt;
        p.vx *= 0.992;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.giro += p.va * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.globalAlpha = Math.min(1, p.vida);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (vivos > 0) requestAnimationFrame(animar);
      else lienzo.remove();
    };
    requestAnimationFrame(animar);
  }

  destello(color = '255,255,255', fuerza = 0.5) {
    const capa = document.createElement('div');
    capa.className = 'fx-flash';
    capa.style.background = `radial-gradient(circle at 50% 45%, rgba(${color},${fuerza}), transparent 65%)`;
    document.body.append(capa);
    requestAnimationFrame(() => capa.classList.add('fx-flash--on'));
    setTimeout(() => capa.remove(), 420);
  }

  sacudir(elemento, fuerza = 6) {
    if (!elemento) return;
    elemento.style.setProperty('--fx-shake', `${fuerza}px`);
    elemento.classList.remove('fx-shake');
    void elemento.offsetWidth;
    elemento.classList.add('fx-shake');
    setTimeout(() => elemento.classList.remove('fx-shake'), 380);
  }

  /* --- Cine -------------------------------------------------------------- */
  cine({ icono = '🎮', titulo = 'JUGAR', color = '#FFE600', sub = 'MR. LOLO' } = {}) {
    return new Promise((resolver) => {
      const capa = document.createElement('div');
      capa.className = 'cine';
      capa.style.setProperty('--c', color);
      capa.innerHTML = `
        <div class="cine__rayos" aria-hidden="true"></div>
        <div class="cine__centro">
          <span class="cine__sub">${sub}</span>
          <span class="cine__ico">${icono}</span>
          <b class="cine__titulo">${titulo}</b>
          <span class="cine__carga"><u></u></span>
        </div>`;
      document.body.append(capa);
      this.sfx('start');
      requestAnimationFrame(() => capa.classList.add('cine--on'));
      setTimeout(() => {
        capa.classList.add('cine--fuera');
        setTimeout(() => { capa.remove(); resolver(); }, 260);
      }, 1050);
    });
  }
}

export const FX = new MotorFX();

/* Si la pestaña se oculta, la música se calla; al volver, sigue. */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!FX.ctx) return;
    if (document.hidden) FX.ctx.suspend().catch(() => {});
    else FX.ctx.resume().catch(() => {});
  });
}
