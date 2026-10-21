# Mr. LOLO 4.0 — Guía rápida

Esta versión convierte la tienda en una app **en vivo** y le agrega una **sala de juegos** completa.
Todo sigue funcionando sin instalar nada y sin pagar hosting.

---

## 1. Lo nuevo, en una lista

| Antes (3.1) | Ahora (4.0) |
|---|---|
| Las fotos quedaban en el celular hasta publicar en GitHub | Se suben a la nube y **aparecen en todos los celulares en segundos** |
| Los cambios se veían recién al publicar | Se sincronizan solos mientras la tienda está abierta |
| 2 juegos (Lluvia y Tetris) | **6 juegos** con perfil, XP, fichas, logros y ranking |
| Sin ranking | **Los mejores**: tabla general y por juego, entre todos los dispositivos |
| Panel con 4 secciones | Se suman **📸 Fotos** (estudio) y **☁️ Nube** |

---

## 2. Cargar fotos (lo que hace Lorenzo)

1. Abrí la tienda y tocá **⚙️ Panel**.
2. Clave inicial: **2580** (se puede cambiar en Datos).
3. Entrá a **📸 Fotos**.
4. Tocá la foto del producto que querés cambiar → se abre la cámara o la galería.
5. La foto se recorta cuadrada, se achica sola y se sube.
6. Si la nube está conectada, en unos segundos todos ven la foto nueva.

La **PORTADA** es la foto grande que abre la tienda. Se cambia igual, desde la primera tarjeta.

> Las fotos se comprimen en el celular antes de subirse. Una foto de 4 MB termina pesando ~60 KB.

---

## 3. Activar la nube (5 minutos, una sola vez)

Sin esto, la app funciona igual pero cada celular ve su propia copia.

### Con Supabase (recomendado por simplicidad)

1. Entrá a <https://supabase.com/dashboard> y creá un proyecto **gratis** (no pide tarjeta).
2. En **SQL Editor**, tocá **New query**, pegá el SQL que está en **Panel → ☁️ Nube → Ver el SQL** y dale **Run**.
3. En **Storage**, creá un bucket llamado `fotos` y marcalo **Public**.
4. En **Project Settings → API**, copiá:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key**
5. En la app: **Panel → ☁️ Nube**, pegá los dos datos y tocá **Conectar**.

Listo. El chip de arriba cambia a **● EN VIVO**.

### Qué pasa cuando conectás

- Si la nube está vacía, sube la tienda tal como está en ese celular.
- Si ya había datos, **usa los de la nube** para no pisar cambios de otro dispositivo.
- Desde ahí, cada cambio del panel se publica solo (con una pequeña demora para no saturar).

### Límites del plan gratis

- 500 MB de base, 1 GB de fotos, 5 GB de salida por mes.
- El proyecto se **pausa si pasa una semana sin uso**. Se reactiva desde el panel de Supabase con un botón.
- Para este uso (una tienda de cole) sobra.

---

## 4. ¿Y si no querés Supabase?

La app habla con la nube a través de un solo archivo (`assets/js/nube.js`), así que se puede cambiar de proveedor sin tocar el resto.

| Opción | Fotos | Tiempo real | Gratis | Contra |
|---|---|---|---|---|
| **Supabase** | 1 GB | Sí (polling 4 s) | Sí, sin tarjeta | Se pausa a la semana sin uso |
| **Appwrite Cloud** | 2 GB | Sí (WebSocket) | Sí, sin tarjeta | También se pausa; límite 5 GB/mes de tráfico |
| **PocketBase propio** | Disco del server | Sí (SSE) | Sí, para siempre | Hay que mantener un servidor (sirve Oracle Always Free) |
| **Firebase** | Requiere plan Blaze (tarjeta) | Excelente | Firestore sí; Storage no | Dos servicios o tarjeta |

**Recomendación:** si querés olvidarte de servidores, quedate con Supabase o Appwrite.
Si querés que no dependa de nadie y ya tenés Oracle Cloud Always Free, PocketBase es la opción más “para siempre”.

> Si decidís cambiar, avisá y se escribe el adaptador: la tienda, el panel y los juegos no cambian.

---

## 5. La sala de juegos

Botón **▶ ENTRAR A LA SALA** (o 🎮 Juegos en el pie).

| Juego | Cómo se juega | Puntaje |
|---|---|---|
| 🎬 **Quiz Show** | Imagen + pregunta + opciones A/B/C + barra de tiempo | 100 + bonus por velocidad y racha |
| 🧱 **Rompe Golosinas** (Arkanoid) | Paleta, pelota y ladrillos; power-ups A/M/S/L | 40 por ladrillo + nivel |
| 🐍 **Serpiente Golosa** | Swipe o flechas; cada golosina acelera | 10 por golosina |
| 🧠 **Memoria Golosa** | 8 pares, menos intentos = más puntos | 1000 − intentos − tiempo |
| 🧊 **Tetris de Golosinas** | El clásico, con caramelos | 100 por línea |
| 🍬 **Lluvia de Caramelos** | Atrapá caramelos y esquivá el brócoli | 1 por caramelo, 5 por estrella |

### Perfil y progreso

- Tocá tu avatar (arriba a la derecha de la sala) para poner nombre y elegir cara.
- Cada partida da **XP**, **fichas** y puede desbloquear **logros**.
- El **Reto del día** da 60 fichas extra.
- Los puntajes se guardan en el dispositivo y, con nube, se comparten en **🏆 Los mejores**.

> El Quiz usa las fotos reales de la tienda: si cargás una golosina nueva, también aparece como pregunta.

---

## 6. Publicar en GitHub (para que quede online)

Los cambios de código se suben como siempre:

```bash
git add .
git commit -m "Version 4.0: nube en vivo, estudio de fotos y sala arcade"
git push
```

GitHub Pages tarda alrededor de un minuto. Después, en el celular, si ves la versión vieja, cerrá y abrí la app o recargá con fuerza.

**Ojo:** el token de GitHub y la clave de la nube **no** se suben al repositorio. Quedan solo en el navegador donde los pegaste.

---

## 7. Si algo no anda

| Síntoma | Qué mirar |
|---|---|
| El chip dice **LOCAL** | Falta conectar la nube (Panel → Nube) |
| El chip dice **SIN SEÑAL** | Wifi, URL o clave mal; probá “Probar” en el panel |
| Las fotos no cambian en otro celular | Que la nube esté **EN VIVO** en los dos y que el bucket sea público |
| “No encuentro la tabla” | Falta correr el SQL en Supabase |
| El ranking está vacío | Todavía nadie jugó, o la nube no está conectada |
| Se ve la versión anterior | Service Worker: recargá; si sigue, borrá datos del sitio |

---

Hecho para el recreo. 🍬
