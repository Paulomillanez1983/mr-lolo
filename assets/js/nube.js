/* ==========================================================================
   MR. LOLO — Nube en vivo
   --------------------------------------------------------------------------
   Sincroniza la tienda entre todos los celulares que abren el link.

   · Funciona con Supabase (plan gratuito): una tablita para los datos, un
     bucket para las fotos y otra tabla para el ranking de la sala de juegos.
   · Si no está configurada, la app sigue funcionando igual que siempre
     (todo guardado en el navegador). Nada se rompe.
   · Sin librerías: se habla con la API REST de Supabase a mano.

   Cómo se usa desde app.js:
     nube.configurar({ url, clave, bucket, tabla })
     await nube.guardar({ tienda, productos, portada })
     nube.suscribir((datos, revision) => { … })
     await nube.subirFoto(dataUrl, 'alfajor')
   ========================================================================== */

const CLAVE_CFG = 'mrlolo.nube';
const CLAVE_PENDIENTE = 'mrlolo.nube.pendiente';
const CLAVE_ULTIMA = 'mrlolo.nube.ultimaRevision';

const ESPERA_RED = 14000;   // ms antes de dar una request por perdida
const RITMO = 4000;         // ms entre consultas cuando la app está abierta

/* --------------------------------------------------------------------------
   Utilidades internas
   -------------------------------------------------------------------------- */
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const limpiaUrl = (valor) => {
  const v = String(valor || '').trim().replace(/\/+$/, '');
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) return '';
  return v;
};

const slug = (texto) =>
  String(texto || 'foto')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'foto';

const leerJson = (clave, porDefecto = null) => {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : porDefecto;
  } catch { return porDefecto; }
};

const escribirJson = (clave, valor) => {
  try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch { return false; }
};

const borrarClave = (clave) => {
  try { localStorage.removeItem(clave); } catch { /* ignorado */ }
};

/* data:image/webp;base64,… → Blob, sin pasar por red */
function dataUrlABlob(dataUrl) {
  const [cabecera, datos] = String(dataUrl).split(',');
  const tipo = /data:([^;]+)/.exec(cabecera)?.[1] || 'image/webp';
  const binario = atob(datos || '');
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

function explicarError(e, respuesta) {
  if (respuesta) {
    if (respuesta.status === 401 || respuesta.status === 403) {
      return 'La clave no autoriza esta operación. Revisá la anon key y las políticas (RLS).';
    }
    if (respuesta.status === 404) {
      return 'No encuentro la tabla o el bucket. ¿Corriste el SQL de la guía?';
    }
    if (respuesta.status === 409) {
      return 'Ese dato ya existe. Probá de nuevo en un segundo.';
    }
    if (respuesta.status === 413) {
      return 'La foto es muy grande para el plan gratuito.';
    }
    if (respuesta.status >= 500) {
      return 'Supabase está teniendo un problema. Probá en un rato.';
    }
  }
  if (e?.name === 'AbortError') return 'La conexión tardó demasiado. Mirá el wifi.';
  if (e instanceof TypeError) return 'No hay conexión o la dirección de la nube está mal.';
  return e?.message || 'Algo salió mal con la nube.';
}

/* --------------------------------------------------------------------------
   El objeto nube
   -------------------------------------------------------------------------- */
class Nube extends EventTarget {
  constructor() {
    super();
    this.cfg = { url: '', clave: '', bucket: 'fotos', tabla: 'tienda', ranking: 'puntajes' };
    this.estado = 'local';       // local | conectando | vivo | error
    this.ultimoError = '';
    this.revision = '';
    this.ultimaVez = 0;          // timestamp del último dato recibido
    this.enviando = false;
    this.pendiente = null;
    this.temporizador = null;
    this.oyentesDatos = new Set();
    this.canal = null;
    this.leyendo = false;
    this.restaurar();
  }

  /* --- Configuración ----------------------------------------------------- */
  restaurar() {
    const guardada = leerJson(CLAVE_CFG, null);
    if (!guardada?.url || !guardada?.clave) return;
    this.cfg = { ...this.cfg, ...guardada, url: limpiaUrl(guardada.url) };
    this.revision = leerJson(CLAVE_ULTIMA, '') || '';
    if (this.cfg.url && this.cfg.clave) this.estado = 'vivo';
  }

  configurar(cfg = {}) {
    this.cfg = {
      ...this.cfg,
      ...cfg,
      url: limpiaUrl(cfg.url ?? this.cfg.url),
      clave: String(cfg.clave ?? this.cfg.clave ?? '').trim(),
      bucket: String(cfg.bucket ?? this.cfg.bucket ?? 'fotos').trim() || 'fotos',
      tabla: String(cfg.tabla ?? this.cfg.tabla ?? 'tienda').trim() || 'tienda',
      ranking: String(cfg.ranking ?? this.cfg.ranking ?? 'puntajes').trim() || 'puntajes',
    };
    if (this.cfg.url && this.cfg.clave) {
      escribirJson(CLAVE_CFG, this.cfg);
      this.estado = 'vivo';
      this.ultimoError = '';
    } else {
      borrarClave(CLAVE_CFG);
      this.estado = 'local';
    }
    this.avisar();
    return this.cfg;
  }

  desconectar() {
    this.detener();
    this.cfg = { ...this.cfg, url: '', clave: '' };
    borrarClave(CLAVE_CFG);
    borrarClave(CLAVE_ULTIMA);
    this.revision = '';
    this.estado = 'local';
    this.ultimoError = '';
    this.avisar();
  }

  activa() {
    return Boolean(this.cfg.url && this.cfg.clave);
  }

  /* --- Comunicación ------------------------------------------------------ */
  cabeceras(extra = {}) {
    return {
      apikey: this.cfg.clave,
      Authorization: `Bearer ${this.cfg.clave}`,
      ...extra,
    };
  }

  async pedir(ruta, opciones = {}) {
    if (!this.activa()) throw new Error('La nube no está configurada');
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), ESPERA_RED);
    let respuesta;
    try {
      respuesta = await fetch(`${this.cfg.url}${ruta}`, { ...opciones, signal: control.signal });
    } catch (e) {
      clearTimeout(reloj);
      const mensaje = explicarError(e);
      this.fallar(mensaje);
      throw new Error(mensaje);
    }
    clearTimeout(reloj);

    if (!respuesta.ok) {
      let detalle = '';
      try { detalle = (await respuesta.text()).slice(0, 220); } catch { /* nada */ }
      const mensaje = explicarError(null, respuesta);
      this.fallar(mensaje);
      const error = new Error(mensaje);
      error.detalle = detalle;
      error.status = respuesta.status;
      throw error;
    }
    return respuesta;
  }

  fallar(mensaje) {
    this.estado = 'error';
    this.ultimoError = mensaje;
    this.avisar();
  }

  avisar(extra = {}) {
    this.dispatchEvent(new CustomEvent('estado', {
      detail: {
        estado: this.estado,
        error: this.ultimoError,
        revision: this.revision,
        ultimaVez: this.ultimaVez,
        activa: this.activa(),
        ...extra,
      },
    }));
  }

  /* --- Lectura / escritura ---------------------------------------------- */
  async leer() {
    const r = await this.pedir(
      `/rest/v1/${this.cfg.tabla}?id=eq.1&select=datos,revision`,
      { headers: this.cabeceras({ Accept: 'application/json' }) }
    );
    const filas = await r.json();
    const fila = Array.isArray(filas) ? filas[0] : null;
    if (!fila?.datos) return null;
    this.estado = 'vivo';
    this.ultimoError = '';
    this.revision = fila.revision || '';
    this.ultimaVez = Date.now();
    escribirJson(CLAVE_ULTIMA, this.revision);
    return { datos: fila.datos, revision: this.revision };
  }

  async guardar(datos) {
    if (!this.activa()) return { ok: false, motivo: 'sin-config' };
    const revision = new Date().toISOString();
    const cuerpo = JSON.stringify([{ id: 1, datos, revision }]);
    this.enviando = true;
    try {
      await this.pedir(`/rest/v1/${this.cfg.tabla}`, {
        method: 'POST',
        headers: this.cabeceras({
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: cuerpo,
      });
      this.estado = 'vivo';
      this.ultimoError = '';
      this.revision = revision;
      this.ultimaVez = Date.now();
      escribirJson(CLAVE_ULTIMA, revision);
      borrarClave(CLAVE_PENDIENTE);
      this.pendiente = null;
      this.avisar({ recienGuardado: true });
      return { ok: true, revision };
    } catch (e) {
      // Guardamos la copia para reintentar cuando vuelva el wifi.
      escribirJson(CLAVE_PENDIENTE, { datos, cuando: Date.now() });
      this.pendiente = datos;
      return { ok: false, motivo: e.message };
    } finally {
      this.enviando = false;
    }
  }

  async reintentarPendiente() {
    if (!this.activa()) return false;
    const pend = this.pendiente || leerJson(CLAVE_PENDIENTE, null)?.datos;
    if (!pend) return false;
    const r = await this.guardar(pend);
    return Boolean(r.ok);
  }

  /* Sube una foto comprimida (data URI) y devuelve la URL pública. */
  async subirFoto(dataUrl, nombre = 'foto') {
    if (!this.activa()) throw new Error('La nube no está configurada');
    const blob = dataUrlABlob(dataUrl);
    const tipo = blob.type || 'image/webp';
    const extension = tipo.includes('png') ? 'png' : tipo.includes('jpeg') ? 'jpg' : 'webp';
    const ruta = `${slug(nombre)}-${Date.now().toString(36)}.${extension}`;
    await this.pedir(`/storage/v1/object/${this.cfg.bucket}/${ruta}`, {
      method: 'POST',
      headers: this.cabeceras({
        'Content-Type': tipo,
        'cache-control': '3600',
        'x-upsert': 'true',
      }),
      body: blob,
    });
    return `${this.cfg.url}/storage/v1/object/public/${this.cfg.bucket}/${ruta}`;
  }

  /* --- Tiempo real ------------------------------------------------------- */
  suscribir(oyente) {
    this.oyentesDatos.add(oyente);
    this.escucharPestanas();
    this.arrancar();
    // Apenas abre, se trae lo último que hay en la nube.
    this.refrescar().catch(() => { /* el estado ya quedó marcado */ });
    return () => this.oyentesDatos.delete(oyente);
  }

  arrancar() {
    if (this.temporizador || !this.activa()) return;
    this.temporizador = setInterval(() => {
      if (document.hidden) return;
      this.refrescar().catch(() => { /* silencioso: ya hay aviso */ });
    }, RITMO);
    document.addEventListener('visibilitychange', this.alVolver = () => {
      if (!document.hidden) this.refrescar().catch(() => {});
    });
  }

  detener() {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
    if (this.alVolver) document.removeEventListener('visibilitychange', this.alVolver);
    this.oyentesDatos.clear();
  }

  async refrescar() {
    if (!this.activa() || this.leyendo) return null;
    this.leyendo = true;
    try {
      const r = await this.pedir(
        `/rest/v1/${this.cfg.tabla}?id=eq.1&select=revision`,
        { headers: this.cabeceras({ Accept: 'application/json' }) }
      );
      const filas = await r.json();
      const revision = Array.isArray(filas) ? filas[0]?.revision || '' : '';
      this.estado = 'vivo';
      this.ultimoError = '';
      this.ultimaVez = Date.now();
      this.avisar();

      if (revision && revision !== this.revision) {
        const completo = await this.leer();
        if (completo?.datos) {
          this.revision = completo.revision;
          this.avisar({ datosNuevos: true });
          this.oyentesDatos.forEach((fn) => {
            try { fn(completo.datos, completo.revision); } catch { /* oyente roto */ }
          });
        }
      }
      return revision;
    } catch {
      return null;
    } finally {
      this.leyendo = false;
    }
  }

  /* Otras pestañas del mismo celular: se avisan al instante sin ir a la red. */
  escucharPestanas() {
    if (this.canal || typeof BroadcastChannel === 'undefined') return;
    try {
      this.canal = new BroadcastChannel('mrlolo-vivo');
      this.canal.onmessage = (e) => {
        if (e.data?.tipo === 'datos' && e.data.datos) {
          this.oyentesDatos.forEach((fn) => {
            try { fn(e.data.datos, e.data.revision || ''); } catch { /* ignorado */ }
          });
        }
      };
    } catch { this.canal = null; }
  }

  avisarPestanas(datos, revision) {
    try { this.canal?.postMessage({ tipo: 'datos', datos, revision }); } catch { /* ignorado */ }
  }

  /* --- Ranking de la sala ------------------------------------------------ */
  async ranking(juego, limite = 10) {
    if (!this.activa()) return [];
    const filtro = juego ? `&juego=eq.${encodeURIComponent(juego)}` : '';
    const r = await this.pedir(
      `/rest/v1/${this.cfg.ranking}?select=nombre,avatar,puntos,juego,creado_en${filtro}&order=puntos.desc&limit=${limite}`,
      { headers: this.cabeceras({ Accept: 'application/json' }) }
    );
    const filas = await r.json();
    return Array.isArray(filas) ? filas : [];
  }

  async enviarPuntaje({ juego, puntos, nombre, avatar }) {
    if (!this.activa()) return { ok: false, motivo: 'sin-config' };
    try {
      await this.pedir(`/rest/v1/${this.cfg.ranking}`, {
        method: 'POST',
        headers: this.cabeceras({
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        }),
        body: JSON.stringify([{
          juego: String(juego),
          nombre: String(nombre || 'Invitado').slice(0, 24),
          avatar: String(avatar || '🍬').slice(0, 8),
          puntos: Math.max(0, Math.round(Number(puntos) || 0)),
        }]),
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, motivo: e.message };
    }
  }

  /* Prueba de conexión desde el panel: no rompe nada si falla. */
  async probar(cfg) {
    const previa = this.cfg;
    const estadoPrevio = this.estado;
    if (cfg) this.cfg = { ...this.cfg, ...cfg, url: limpiaUrl(cfg.url) };
    try {
      const r = await this.pedir(
        `/rest/v1/${this.cfg.tabla}?id=eq.1&select=revision`,
        { headers: this.cabeceras({ Accept: 'application/json' }) }
      );
      const filas = await r.json();
      const hayFila = Array.isArray(filas) && filas.length > 0;
      return { ok: true, hayFila };
    } catch (e) {
      return { ok: false, motivo: e.message, detalle: e.detalle || '' };
    } finally {
      // Probar no cambia la configuración: solo avisa si anda.
      this.cfg = previa;
      this.estado = estadoPrevio;
    }
  }

  /* Texto corto para el chip de la cabecera. */
  etiqueta() {
    if (!this.activa()) return 'LOCAL';
    if (this.estado === 'error') return 'SIN SEÑAL';
    if (this.enviando) return 'GUARDANDO…';
    return 'EN VIVO';
  }

  haceCuanto() {
    if (!this.ultimaVez) return '';
    const seg = Math.max(0, Math.round((Date.now() - this.ultimaVez) / 1000));
    if (seg < 5) return 'recién';
    if (seg < 60) return `hace ${seg}s`;
    const min = Math.round(seg / 60);
    return `hace ${min} min`;
  }
}

export const nube = new Nube();

/* Atajo para probar en la consola del navegador */
if (typeof window !== 'undefined') window.__mrloloNube = nube;

/* Al volver la conexión, mandamos lo que quedó pendiente. */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    nube.reintentarPendiente().catch(() => {});
  });
}

export { dormir };
