/* ==========================================================================
   MR. LOLO — Joystick táctil flotante
   --------------------------------------------------------------------------
   Control tipo consola / Roblox: apoyás el pulgar en cualquier parte de la
   zona y el stick aparece justo ahí. No hay flechitas fijas.

   Uso:
     const stick = crearJoystick(zona, {
       onDireccion: ({x, y}) => girar(x, y),   // 4 direcciones, solo al cambiar
       onMover: (x, y) => moverPaleta(x),      // analógico, -1..1
       onFin: () => {},
     });
     stick.destruir();
   ========================================================================== */

export function crearJoystick(zona, opciones = {}) {
  const {
    onDireccion = null,
    onMover = null,
    onFin = null,
    umbral = 0.34,
    radio = 54,
  } = opciones;

  if (!zona) return { destruir() {} };

  const anillo = document.createElement('div');
  anillo.className = 'joy';
  anillo.setAttribute('aria-hidden', 'true');
  anillo.innerHTML = '<span class="joy__aro"></span><span class="joy__perilla"></span>';
  const perilla = anillo.querySelector('.joy__perilla');
  document.body.append(anillo);

  let id = null;
  let origenX = 0;
  let origenY = 0;
  let ultimaDir = null;

  const pintar = (dx, dy) => {
    perilla.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const mostrar = (x, y) => {
    anillo.style.left = `${x}px`;
    anillo.style.top = `${y}px`;
    anillo.classList.add('joy--on');
  };

  const ocultar = () => {
    anillo.classList.remove('joy--on');
    pintar(0, 0);
  };

  const cuantizar = (nx, ny) => {
    if (Math.hypot(nx, ny) < umbral) return null;
    if (Math.abs(nx) > Math.abs(ny)) return { x: nx > 0 ? 1 : -1, y: 0 };
    return { x: 0, y: ny > 0 ? 1 : -1 };
  };

  const alBajar = (e) => {
    if (id !== null || e.button > 0) return;
    id = e.pointerId;
    origenX = e.clientX;
    origenY = e.clientY;
    mostrar(origenX, origenY);
    pintar(0, 0);
    try { zona.setPointerCapture(id); } catch { /* ignorado */ }
    onMover?.(0, 0);
    e.preventDefault();
  };

  const alMoverPuntero = (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - origenX;
    let dy = e.clientY - origenY;
    const dist = Math.hypot(dx, dy);
    if (dist > radio) {
      dx = (dx / dist) * radio;
      dy = (dy / dist) * radio;
    }
    pintar(dx, dy);
    const nx = dx / radio;
    const ny = dy / radio;
    onMover?.(nx, ny);

    const dir = cuantizar(nx, ny);
    if (dir) {
      if (!ultimaDir || dir.x !== ultimaDir.x || dir.y !== ultimaDir.y) {
        ultimaDir = dir;
        onDireccion?.(dir);
        if (navigator.vibrate) { try { navigator.vibrate(6); } catch { /* ignorado */ } }
      }
    } else {
      ultimaDir = null;
    }
    e.preventDefault();
  };

  const alSoltar = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    ultimaDir = null;
    ocultar();
    try { zona.releasePointerCapture(e.pointerId); } catch { /* ignorado */ }
    onFin?.();
  };

  zona.style.touchAction = 'none';
  zona.addEventListener('pointerdown', alBajar);
  zona.addEventListener('pointermove', alMoverPuntero);
  zona.addEventListener('pointerup', alSoltar);
  zona.addEventListener('pointercancel', alSoltar);

  return {
    destruir() {
      zona.removeEventListener('pointerdown', alBajar);
      zona.removeEventListener('pointermove', alMoverPuntero);
      zona.removeEventListener('pointerup', alSoltar);
      zona.removeEventListener('pointercancel', alSoltar);
      anillo.remove();
    },
  };
}
