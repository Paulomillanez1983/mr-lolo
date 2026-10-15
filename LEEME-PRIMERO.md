# MR. LOLO — Tu tienda

## ✅ Ya está publicada, y funciona

**Link para compartir: https://paulomillanez1983.github.io/mr-lolo/**

Con HTTPS gratis incluido. Ese es el link que Lorenzo manda a los grupos, a la familia
y a los amigos. Está online en GitHub Pages, dentro de tu propia cuenta de GitHub
(`Paulomillanez1983/mr-lolo`), así que podés actualizarla cuando quieras.

**Versión 3.0** — se sumaron: trivia con **cronómetro** y **120 preguntas** en 15 temas,
un sistema que **aprende de tus errores** (tipo Preguntados) con pantalla de progreso,
un **Tetris de golosinas** y **carga de fotos de productos** desde el panel.

---

## Cómo actualizar precios, productos y fotos (lo que vas a hacer seguido)

1. Abrí la tienda, andá al pie de página y tocá **⚙️ Panel**.
2. La clave es **2580**.
3. En la pestaña *Productos* podés cambiar nombre, precio, stock y categoría, agregar
   golosinas nuevas, reordenarlas o marcarlas como agotadas.
4. **Para cambiar la foto**: tocá el 📷 que está sobre la miniatura y elegí una foto del
   celular o de la compu. La tienda la recorta cuadrada y la achica sola (queda en unos
   60 KB), así que podés sacarle la foto a la golosina con el teléfono y subirla directo.
5. Tocá **💾 Guardar cambios**.
6. Andá a la pestaña *Datos* y tocá **⬇️ Descargar data.js**.
7. Subilo a GitHub: entrá a
   `https://github.com/Paulomillanez1983/mr-lolo/tree/main/assets/js`, tocá **Add file →
   Upload files**, arrastrá el `data.js` que descargaste y confirmá con **Commit changes**.
   (Si subís un archivo con el mismo nombre, reemplaza al anterior.)
8. En un minuto, la tienda online ya muestra todo nuevo. 🎉

> Las fotos que subís van **dentro** del `data.js`. Por eso conviene que sean fotos
> normales de celular y no imágenes gigantes: así el archivo pesa poco y sube rápido.

---

## Si algún día la querés mover a otro hosting

La carpeta `tienda-mr-lolo` **es** la tienda completa. No hay nada que instalar ni que
compilar: se sube tal cual está, y funciona igual en cualquier hosting estático.

### Opción A — Netlify Drop (la más fácil, sin cuenta para empezar)

1. Entrá a **https://app.netlify.com/drop**
2. Arrastrá **el archivo `tienda-mr-lolo.zip`** (o la carpeta entera) a la zona que dice
   *"Drag and drop your site output folder here"*.
3. En unos segundos te da una dirección tipo `https://algo-random.netlify.app` **con HTTPS
   incluido y gratis**.
4. Ese es el link que Lorenzo manda a los grupos, a la familia y a los amigos. 🎉
5. Creá la cuenta gratuita (con tu email) cuando te la ofrezca, así la tienda queda
   guardada y la podés actualizar cuando cambien los precios.

> Si querés una dirección más linda, en Netlify se puede cambiar el nombre del sitio
> por algo como `mr-lolo-golosinas` (queda `https://mr-lolo-golosinas.netlify.app`).

### Opción B — Cloudflare Pages (la mejor a largo plazo)

En la comparación de hostings estáticos gratuitos de 2026, Cloudflare Pages es el único
que **no tiene tope de ancho de banda** (Netlify y Vercel sí tienen límites mensuales,
aunque para una tienda del colegio no los vas a tocar nunca).

1. Entrá a **https://pages.cloudflare.com** y creá una cuenta gratis.
2. *Create a project → Direct Upload* (subida directa, sin GitHub).
3. Subí la carpeta `tienda-mr-lolo` completa.
4. Te queda en `https://tu-nombre.pages.dev` con HTTPS gratis.

### Opción C — GitHub Pages

Ideal si ya usás GitHub. Subís la carpeta a un repositorio y activás Pages en
*Settings → Pages*. Te queda en `https://tu-usuario.github.io/nombre-del-repo/`.
Funciona igual porque todas las rutas del sitio son relativas.

---

## 2. El link ya está configurado para verse lindo (hecho)

Cuando mandes `https://paulomillanez1983.github.io/mr-lolo/` por WhatsApp, va a aparecer
una tarjeta con el logo, el nombre y los precios — no un link pelado. Eso ya quedó
configurado en `index.html` (canonical, og:url, og:image, twitter:image y los datos para
Google) y la imagen que se usa es `assets/img/portada.jpg`.

**Solo tenés que volver a tocarlo si algún día cambiás de dirección.** En ese caso, en
`index.html` buscá y reemplazá `paulomillanez1983.github.io/mr-lolo` por la dirección nueva,
sin `https://` y sin barra al final. Son 7 apariciones: una es un comentario y las otras 6
son los datos reales.

> Ojo: hay que esperar unos minutos después de publicar para que WhatsApp refresque la
> vista previa del link. Si ya lo mandaste antes, puede quedar cacheada la versión vieja.

---

## 3. Cómo cambiar precios y productos

Tenés dos caminos. Los dos funcionan.

### Camino rápido: el Panel (sin tocar archivos)

1. Abrí la tienda y bajá hasta el pie de página.
2. Tocá **⚙️ Panel**.
3. La clave inicial es **2580** (la podés cambiar en *Datos*).
4. Ahí podés editar nombre, precios, stock, categorías, fotos, el aviso para los clientes,
   el descuento por cantidad y el premio del juego.
5. Tocá **💾 Guardar cambios**. Los cambios se ven **en tu navegador** al instante.
6. Para que los vean todos, entrá a *Datos → ⬇️ Descargar data.js* y subí ese archivo
   reemplazando `assets/js/data.js` en el hosting.

> ⚠️ El Panel guarda en el navegador donde lo abriste, no en el servidor. Es una herramienta
> de comodidad para que puedas probar cambios sin romper nada, no una barrera de seguridad.
> La clave es simplemente para que los chicos no toquen los precios.

### Camino directo: el archivo `assets/js/data.js`

Abrilo con cualquier editor de texto. Arriba de todo está `TIENDA` (nombre, WhatsApp, alias,
retiro, aviso, promos) y abajo `PRODUCTOS`, una lista donde cada golosina es un bloque:

```js
{
  orden: 1,
  nombre: 'Alfajor Havanna',
  precio: 1200,
  categoria: 'dulces',
  imagen: 'assets/img/alfajor-havanna.webp',
  color: '#7A4A2A',
  icono: '🍫',
  stock: null,        // null = sin límite; un número = unidades disponibles
  agotado: false,     // true = se muestra como AGOTADO y no se puede pedir
},
```

**Todos los demás archivos se adaptan solos**: el catálogo, los códigos A1/A2/B1…, la cinta
de precios, el carrito y el mensaje de WhatsApp.

Para una golosina nueva: copiá un bloque, cambiá el nombre, el precio y la foto (poné la
imagen en `assets/img/` y escribí la ruta). No hace falta tocar nada más.

---

## 3.5. La trivia y los juegos, explicados (nuevo en la versión 3.0)

### La trivia ahora enseña
- **15 temas y 120 preguntas** (antes eran 7 temas y 56 preguntas).
- Cada ronda mezcla preguntas de **todos** los temas, así nunca es siempre lo mismo.
- Tenés **20 segundos** por pregunta (se cambia desde el Panel, si querés más o menos).
- Cuanto más rápido contestás, más puntos: **100 por acierto + hasta 50 por velocidad**.
  Las primeras 2 rondas del día suman puntos; después se juega en modo práctica.
- Al responder te dice **cuál era la respuesta correcta y un dato para aprender**.
- Al final de la ronda te arma una lista **"📌 Para repasar"** con las que fallaste.

### El sistema que aprende con vos (tipo Preguntados)
La trivia guarda en el navegador cómo te fue en cada pregunta y después elige sola:

| Situación de la pregunta | Qué hace |
|---|---|
| Nunca te la preguntó | Aparece seguido |
| La fallaste la última vez | Vuelve pronto, es prioridad |
| La fallaste varias veces | Aumenta la prioridad |
| La acertaste 2 veces seguidas | Se marca **dominada** y aparece menos |
| Pasó mucho tiempo sin verla | Vuelve, para que no se te olvide |

Es el mismo principio del **repaso espaciado**: los intervalos se van duplicando
(1 día, 2, 4, 8…). En **📊 Mi progreso** (dentro de la trivia) ves las barras por tema,
cuántas preguntas dominaste y cuántas te faltan.

### Los dos juegos
- **🍬 Lluvia de caramelos**: atrapá los caramelos y esquivá el brócoli. 45 segundos, 3 vidas.
- **🧱 Tetris de golosinas**: el clásico, con caramelos de colores. 10×18 casilleros,
  líneas que se borran y velocidad que sube por nivel. Se maneja con las **flechas**
  (← → mover, ↑ girar, ↓ bajar, espacio soltar, P pausa) o con los **botones grandes**
  de abajo, pensados para el celular.

Los dos guardan tu **récord** en el propio dispositivo. Se abren desde el pie de página
(**🎮 Juegos**) o con dos toques seguidos en el logo de Mr. LOLO.

### Si querés apagar algo
En el Panel → *Tienda* tenés los interruptores para apagar la trivia, la lluvia de
caramelos o el Tetris, y los campos para cambiar los segundos por pregunta, cuántas
preguntas por ronda y cuántas rondas por día suman puntos.

---

## 4. Qué se mejoró respecto de la versión anterior

### 🎨 Visual

- Identidad propia: logo vectorial (SVG) de Mr. LOLO con galera, monóculo y moño, animado —
  se usa en el ícono de la app, en el cartel y en la portada de los links.
- Sistema de diseño con tokens de color, tipografía fluida (`clamp()`), sombras en capas,
  vidrio, degradados y aro de selección animado con `conic-gradient`.
- Tarjetas de producto más grandes y legibles: código de góndola, precio en píldora blanca,
  aviso de "¡ÚLTIMAS N!", estado AGOTADO y foto real del producto.
- Fondo con halos de color y grilla sutil, cinta de precios animada, confeti al acertar
  la trivia y globo de diálogo cuando tocás el logo.
- Imagen de portada `portada.jpg` (1200×630) para que el link se vea bien al compartirlo.

### ⚡ Performance

| | Versión anterior | Esta versión |
|---|---|---|
| Pedidos a servidores de terceros | 2 (Google Fonts + CDN del QR) | **0** — nada que dependa de que otro servicio esté online |
| Estructura | un solo documento de **215 KB** con las fotos metidas en base64 adentro del HTML | 22 archivos, **454 KB** en total, pero separados: cada uno se cachea por su cuenta y solo se baja lo que hace falta |
| Tipografía | Google Fonts, con el truco `media="print" onload` para que no bloqueara | tipografía del sistema: cero pedidos, cero espera |
| Imágenes | en base64 dentro del HTML (no se pueden cachear aparte y atrasan el render) | `.webp` de 480×480, `loading="lazy"`, `decoding="async"`, con ancho y alto declarados (sin saltos de layout). En total **124 KB** |
| Generador de QR | 20 KB de un CDN, se cargaban siempre | **15 KB que solo se descargan si abrís el cartel** (`import()` dinámico) |
| Navegación | cada visita vuelve a bajar todo | Service Worker: **abre al instante** y funciona **sin conexión**. Además el HTML, el CSS y el JS se sirven "red primero", así que si cambiás un precio **se ve en el acto** |
| Navegador en la primera visita | bloqueaba el pintado con el documento entero | CSS crítico en un archivo chico + `modulepreload` + imágenes diferidas |

**Beneficios extra de tener cero pedidos externos:** más rápido, más privado (no le contás a
Google quién visita la tienda de tu hijo) y funciona aunque el colegio tenga internet lento.

### 🧠 Experiencia de usuario

- **Buscador** de golosinas por nombre (nuevo).
- **Carrito persistente**: si cierra el navegador y vuelve, su pedido sigue ahí.
- **Stepper (+/−) en la tarjeta** para ajustar cantidades sin abrir nada.
- **Diálogos nativos** (`<dialog>`): foco atrapado, cierre con `Esc`, tap en el fondo. Antes
  eran `div` simulados que rompían la accesibilidad.
- **Se instala como app** en el celular (manifest + Service Worker) y con el botón
  "📲 Instalar la app" cuando el navegador lo ofrece.
- **Pedido como foto**: además del mensaje de texto, genera un **ticket con imagen** de los
  productos y lo comparte con el menú nativo del celular (`navigator.share`).
- **Repetir mi último pedido** con un toque.
- **Cartel con QR generado en el propio sitio** (ya no depende de un CDN) listo para imprimir.
- **Accesibilidad**: `lang="es-AR"`, landmarks, `aria-label` en todos los controles, `aria-live`
  en avisos y trivia, foco visible, y **se respeta `prefers-reduced-motion`** (quien pide menos
  animaciones, las recibe apagadas).
- **Sin `alert()` ni `confirm()`** del navegador: avisos propios, no bloqueantes.
- **Sin errores de consola**: la prueba automatizada no registró ni un error ni un 404.

### 🧹 Deprecaciones eliminadas

| Antes | Ahora |
|---|---|
| `window.claude.use("artifact")` para publicar (solo funcionaba dentro de Claude) | Panel local + exportar `data.js`; la tienda es un sitio propio, sin depender de Claude |
| Script de `qrcode-generator` desde jsdelivr | Codificador de QR propio (ISO/IEC 18004, verificado con dos lectores independientes: jsQR y OpenCV, 10/10) |
| Google Fonts con el hack `media="print" onload` | Tipografía del sistema |
| `div` simulando modales | `<dialog>` nativo |
| `JSON.parse(JSON.stringify())` | `structuredClone()` |
| `alert()`, `confirm()` | Diálogos y avisos propios |
| `document.execCommand`-style / `navigator.clipboard` sin respaldo | `navigator.clipboard` con alternativa y aviso al usuario |
| `-webkit-backdrop-filter` como único mecanismo | `backdrop-filter` estándar, y sin depender de él para el diseño |
| Datos embebidos en el HTML (imposible de cachear o editar) | Archivos separados: `data.js`, `app.js`, `app.css`, `qr.js` |
| HTML sin `lang`, sin meta descripción, sin Open Graph | HTML semántico, `lang="es-AR"`, Open Graph, Twitter Card y datos estructurados `schema.org/Store` |
| `<button>` dentro de `<button>` (rompía la grilla) | Tarjeta `<div>` con área táctil hermano — HTML válido |

---

## 5. Lo que se mantuvo igual (todo tu contenido)

- **Las 6 golosinas** con sus precios: Alfajor Havanna $1.200 · Mogul $1.000 · Lays Clásicas
  $1.500 · Coca-Cola Lata $1.300 · Oreo Pack $1.100 · Beldent $900.
- **Las fotos reales** de cada producto (las mismas de la versión original, optimizadas).
- **WhatsApp +54 9 351 686-2674** y **alias de Mercado Pago LOLOMILLANEZ**.
- **El mensaje de pedido** con el mismo formato (productos, total, nombre, retiro, comentarios).
- **La trivia completa**: las 56 preguntas originales siguen ahí, con su tema y su respuesta
  correcta. A la versión 3.0 se le agregaron 64 más (15 temas en total), un dato para aprender
  en cada una y el cronómetro. Nada se borró.
- **Retiro en el cole**: Primer recreo · Segundo recreo · A la salida.
- **La trivia**: 7 temas, uno por día (cultura general, capitales, matemática, animales,
  historia argentina, deportes y geografía), 8 preguntas por tema, 5 al azar por ronda,
  puntos y 2 rondas con puntaje por día.
- **El juego "Lluvia de caramelos"** con récord guardado y premio configurable.
- Los códigos de góndola **A1, A2, A3, B1, B2, B3**.
- El descuento por cantidad y el aviso para los clientes (vienen desactivados).

---

## 6. Cosas a tener en cuenta (te las digo derecho)

- **Ya está publicada**: quedó online en `https://paulomillanez1983.github.io/mr-lolo/`,
  dentro de tu cuenta de GitHub (`Paulomillanez1983/mr-lolo`), con HTTPS forzado y gratis.
- **El repositorio es público**: GitHub Pages con HTTPS gratis solo funciona así en cuentas
  gratuitas. Como la tienda es para compartir igual, no hay problema. Si algún día querés
  que no se vea el código, hay que pasar a un plan pago de GitHub o mover el sitio a otro
  hosting (Netlify o Cloudflare Pages, que sí permiten repositorios privados).
- **El link de GitHub es largo**. Si querés algo más corto y lindo para el grupo de WhatsApp
  (por ejemplo `mr-lolo-golosinas.netlify.app`), se puede mover el sitio a Netlify o
  Cloudflare Pages en 5 minutos y queda igual de gratis. Avisame y lo hacemos.
- **Verificá el WhatsApp y el alias**: los saqué tal cual de la app original
  (`5493516862674` y `LOLOMILLANEZ`). Si cambiaron, se editan en el Panel → *Tienda*.
- **Si abrís `index.html` con doble clic** vas a ver un aviso: los módulos de JavaScript
  necesitan `http(s)`. Para verla en tu compu hay que publicarla o levantarla con un servidor
  local (`python -m http.server` dentro de la carpeta).
- **Al reemplazar archivos en el hosting**, subí el número `VERSION` en `sw.js`
  (hoy dice `mrlolo-v3`; pasalo a `mrlolo-v4`). Así los celulares que ya visitaron la tienda
  descartan la copia vieja. Con los precios ya se refresca solo, pero es buena práctica.
- **La clave del Panel (2580) no es seguridad real**: es solo para que los chicos no cambien
  los precios en su propio celular. Cualquiera con conocimientos puede leer el código.
- **Aviso legal chico**: si la tienda crece y querés facturar, consultá cómo emitir
  comprobantes. Hoy es una tienda informal del colegio, como estaba planteada.

---

## 7. Estructura de la carpeta

```
tienda-mr-lolo/
├── index.html              ← la tienda (el archivo que se abre)
├── manifest.webmanifest    ← hace que se pueda instalar como app
├── sw.js                   ← Service Worker: sin conexión y carga instantánea
├── robots.txt
├── LEEME-PRIMERO.md        ← este archivo (podés borrarlo del hosting si querés)
└── assets/
    ├── css/app.css         ← estilos, en capas (@layer)
    ├── js/
    │   ├── data.js         ← ⭐ ACÁ se editan productos, precios y la trivia
    │   ├── app.js          ← la lógica (carrito, pedido, trivia, juegos, panel)
    │   ├── tetris.js       ← el Tetris (se descarga solo si lo abrís)
    │   └── qr.js           ← generador de códigos QR propio
    └── img/                ← fotos de productos, logo e íconos
```

---

## 8. Recursos gratuitos: qué usa la tienda

Preguntaste si se pueden usar recursos gratuitos. La respuesta corta: **la tienda ya está
construida para no necesitar ninguno externo**, y eso es a propósito.

| Recurso | Qué usa la tienda | Por qué |
|---|---|---|
| Hosting + HTTPS | GitHub Pages (tu cuenta) | Gratis, con candado de seguridad |
| Tipografías | Las del propio dispositivo | Cero descargas, cero demoras, sin licencias que revisar |
| Iconos y dibujos | Emoji del sistema + el logo en SVG hecho a medida | No hay que comprar ni atribuir nada |
| Sonidos | Generados con el navegador (Web Audio) | No hay archivos de audio ni derechos de autor |
| Código QR | Generador propio | Antes venía de un servicio externo; ahora no depende de nadie |
| Fotos | Las de ustedes | 100% propias |

**¿Y si más adelante quieren agregar cosas?** Todo lo que se puede usar gratis y sin
problemas legales:

- **Fotos e imágenes**: Pixabay y Unsplash (licencias que permiten uso libre, incluido
  comercial). Para las fotos de las golosinas, lo mejor sigue siendo la foto real.
- **Sonidos**: Freesound y Pixabay Audio (muchos son de dominio público o CC0).
- **Tipografías**: Google Fonts (licencia OFL, se pueden usar comercialmente). Igual, para
  este caso conviene quedarse con las del sistema: no hay descargas.
- **Íconos**: cualquiera de licencia OFL/CC0.

La regla práctica: si el recurso dice **CC0, dominio público u OFL**, se puede usar sin
pedir permiso. Si dice **CC-BY**, se puede usar pero hay que dar el crédito. Y si dice
**"solo uso personal"**, mejor no usarlo en una tienda.

---

Hecho para Lorenzo. 🍬
