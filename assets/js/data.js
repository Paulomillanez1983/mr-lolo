/* ==========================================================================
   MR. LOLO — Datos de la tienda
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que hace falta tocar para cambiar la tienda.
   Todo lo demás (diseño, carrito, juego, QR) se adapta solo a estos datos.
   ========================================================================== */

export const TIENDA = {
  /* --- Identidad -------------------------------------------------------- */
  nombre: 'Mr. LOLO',
  bajada: 'Golosinas del recreo, a un toque 🍬',
  firma: 'GOLOSINAS DEL RECREO',
  version: '2.0',

  /* --- Contacto y pago -------------------------------------------------- */
  // WhatsApp con código de país, solo números (Argentina: 549 + área + número).
  whatsapp: '5493516862674',
  // Alias de Mercado Pago para cobrar.
  alias: 'LOLOMILLANEZ',
  // Nombre que aparece en el botón de contacto directo.
  atiende: 'Lorenzo',

  /* --- Logística -------------------------------------------------------- */
  retiro: ['Primer recreo', 'Segundo recreo', 'A la salida'],
  pieDePagina: '🏫 RETIRO EN EL COLE • 💳 PAGO POR MERCADO PAGO • 💬 PEDIDO POR WHATSAPP',

  /* --- Estado de la tienda --------------------------------------------- */
  abierta: true,
  // Aviso que ve el cliente arriba del catálogo. Vacío = no se muestra.
  aviso: '',

  /* --- Promos y premios ------------------------------------------------ */
  // Descuento por cantidad: llevando {cantidad} o más, {porcentaje}% off.
  promo: { cantidad: 0, porcentaje: 0 },
  // Premio del juego "Lluvia de caramelos".
  premio: { caramelos: 0, texto: '' },

  /* --- Secciones -------------------------------------------------------- */
  trivia: true,
  juego: true,

  /* --- Dominio final (se usa para el QR) -------------------------------- */
  // Dejalo vacío y el QR usa la dirección real desde donde se abrió la tienda.
  urlPublica: '',
};

/* --- Categorías ---------------------------------------------------------- */
export const CATEGORIAS = [
  { id: 'dulces', nombre: 'Dulces', icono: '🍬' },
  { id: 'snacks', nombre: 'Snacks', icono: '🥨' },
  { id: 'bebidas', nombre: 'Bebidas', icono: '🥤' },
];

/* --- Productos ----------------------------------------------------------- */
/* orden = posición en la góndola. El código (A1, A2, B1...) se calcula solo.
   stock: null = sin límite | agotado: true lo saca de circulación.          */
export const PRODUCTOS = [
  {
    orden: 1,
    nombre: 'Alfajor Havanna',
    precio: 1200,
    categoria: 'dulces',
    imagen: 'assets/img/alfajor-havanna.webp',
    color: '#7A4A2A',
    icono: '🍫',
    stock: null,
    agotado: false,
  },
  {
    orden: 2,
    nombre: 'Mogul',
    precio: 1000,
    categoria: 'dulces',
    imagen: 'assets/img/mogul-gomitas.webp',
    color: '#E94A7A',
    icono: '🍬',
    stock: null,
    agotado: false,
  },
  {
    orden: 3,
    nombre: 'Lays Clásicas',
    precio: 1500,
    categoria: 'snacks',
    imagen: 'assets/img/lays-clasicas.webp',
    color: '#FFC300',
    icono: '🥨',
    stock: null,
    agotado: false,
  },
  {
    orden: 4,
    nombre: 'Coca-Cola Lata',
    precio: 1300,
    categoria: 'bebidas',
    imagen: 'assets/img/coca-cola-lata.webp',
    color: '#D32F2F',
    icono: '🥤',
    stock: null,
    agotado: false,
  },
  {
    orden: 5,
    nombre: 'Oreo Pack',
    precio: 1100,
    categoria: 'dulces',
    imagen: 'assets/img/oreo-pack.webp',
    color: '#1E40AF',
    icono: '🍪',
    stock: null,
    agotado: false,
  },
  {
    orden: 6,
    nombre: 'Beldent',
    precio: 900,
    categoria: 'dulces',
    imagen: 'assets/img/beldent.webp',
    color: '#00B1EA',
    icono: '🍬',
    stock: null,
    agotado: false,
  },
];

/* --- Trivia -------------------------------------------------------------- */
/* 7 días, un tema por día (índice 0 = domingo).
   Formato de cada pregunta: "pregunta|correcta|opción|opción|opción"            */
export const TRIVIA = [
  {
    icono: '🍬',
    tema: 'Cultura general y golosinas',
    preguntas: [
      '¿Qué ingrediente principal tiene el dulce de leche?|Leche|Banana|Maíz|Manzana',
      '¿Cuántos colores tiene el arcoíris?|7|5|6|8',
      '¿Qué color se forma al mezclar azul y amarillo?|Verde|Naranja|Violeta|Marrón',
      '¿Cuántos meses tienen 28 días?|Todos|Solo febrero|Ninguno|Dos',
      '¿Qué planeta es el más cercano al Sol?|Mercurio|Venus|Marte|Tierra',
      '¿Qué gas necesitamos para respirar?|Oxígeno|Helio|Hidrógeno|Humo',
      '¿De qué planta sale el chocolate?|Cacao|Café|Vainilla|Maní',
      '¿Cuántos lados tiene un hexágono?|6|5|8|7',
    ],
  },
  {
    icono: '🗺️',
    tema: 'Capitales de provincias',
    preguntas: [
      '¿Cuál es la capital de Santa Fe?|Santa Fe|Rosario|Rafaela|Venado Tuerto',
      '¿Cuál es la capital de Tucumán?|San Miguel de Tucumán|Tafí Viejo|Concepción|Yerba Buena',
      '¿Cuál es la capital de Chubut?|Rawson|Comodoro Rivadavia|Trelew|Esquel',
      '¿Cuál es la capital de Misiones?|Posadas|Oberá|Eldorado|Puerto Iguazú',
      '¿Cuál es la capital de Jujuy?|San Salvador de Jujuy|Palpalá|Humahuaca|Tilcara',
      '¿Cuál es la capital de Santa Cruz?|Río Gallegos|Caleta Olivia|El Calafate|Puerto Deseado',
      '¿Cuál es la capital de Entre Ríos?|Paraná|Concordia|Gualeguaychú|Colón',
      '¿Cuál es la capital de la provincia de Buenos Aires?|La Plata|Mar del Plata|Bahía Blanca|Buenos Aires',
    ],
  },
  {
    icono: '🔢',
    tema: 'Matemática rápida',
    preguntas: [
      '¿Cuánto es 7 × 8?|56|54|48|63',
      '¿Cuánto es 9 × 6?|54|56|45|63',
      '¿Cuánto es 12 + 19?|31|29|32|41',
      '¿Cuánto es 100 − 37?|63|67|73|57',
      '¿Cuál es la mitad de 90?|45|40|35|50',
      '¿Cuánto es 8 × 8?|64|56|72|48',
      '¿Cuál es el doble de 35?|70|65|60|75',
      '¿Cuánto es 144 ÷ 12?|12|14|11|16',
    ],
  },
  {
    icono: '🐾',
    tema: 'Animales y naturaleza',
    preguntas: [
      '¿Cuál es el animal más grande del mundo?|Ballena azul|Elefante|Jirafa|Tiburón ballena',
      '¿Cuántas patas tiene una araña?|8|6|10|4',
      '¿Cuál es el ave nacional de Argentina?|Hornero|Cóndor|Ñandú|Tero',
      '¿Cuántos corazones tiene un pulpo?|3|1|2|8',
      '¿Cuál es el animal terrestre más rápido?|Guepardo|León|Caballo|Tigre',
      '¿Qué insecto produce la miel?|Abeja|Hormiga|Mariposa|Mosca',
      '¿Qué mamífero puede volar?|Murciélago|Águila|Mariposa|Loro',
      '¿Cómo se llama el hogar de las abejas?|Colmena|Nido|Madriguera|Cueva',
    ],
  },
  {
    icono: '🏛️',
    tema: 'Historia argentina',
    preguntas: [
      '¿En qué año fue la Revolución de Mayo?|1810|1816|1853|1780',
      '¿Quién creó la bandera argentina?|Manuel Belgrano|José de San Martín|Domingo Sarmiento|Juan Manuel de Rosas',
      '¿En qué ciudad se declaró la Independencia?|San Miguel de Tucumán|Buenos Aires|Córdoba|Mendoza',
      '¿Qué día es el Día de la Independencia?|9 de julio|25 de mayo|20 de junio|17 de agosto',
      '¿Qué día es el Día de la Bandera?|20 de junio|9 de julio|25 de mayo|12 de octubre',
      '¿Quién cruzó los Andes con su ejército libertador?|José de San Martín|Manuel Belgrano|Mariano Moreno|Bernardino Rivadavia',
      '¿En qué año se sancionó la Constitución Nacional?|1853|1810|1816|1880',
      '¿Qué se recuerda el 25 de mayo?|La Revolución de Mayo|La Independencia|La Bandera|La Constitución',
    ],
  },
  {
    icono: '⚽',
    tema: 'Deportes',
    preguntas: [
      '¿En qué año ganó Argentina el Mundial de Qatar?|2022|2018|2014|2010',
      '¿Quién fue el capitán de la selección argentina campeona en Qatar?|Lionel Messi|Ángel Di María|Emiliano Martínez|Julián Álvarez',
      '¿Cuántos jugadores juegan por equipo en la cancha de fútbol?|11|9|10|12',
      '¿Cuántos jugadores de un equipo hay en la cancha en básquet?|5|6|7|4',
      '¿Cuál es el deporte nacional de Argentina?|Pato|Fútbol|Rugby|Tenis',
      '¿Qué deporte se juega en Wimbledon?|Tenis|Golf|Rugby|Polo',
      '¿Cuántos aros tiene la bandera olímpica?|5|4|6|7',
      '¿Qué país ganó el primer Mundial de fútbol, en 1930?|Uruguay|Argentina|Brasil|Italia',
    ],
  },
  {
    icono: '🌍',
    tema: 'Geografía del mundo',
    preguntas: [
      '¿Cuál es la capital de Brasil?|Brasilia|Río de Janeiro|San Pablo|Salvador',
      '¿Cuál es la capital de Chile?|Santiago|Valparaíso|Concepción|Lima',
      '¿Cuál es la capital de Australia?|Canberra|Sídney|Melbourne|Perth',
      '¿Cuál es la capital de Japón?|Tokio|Osaka|Kioto|Nagoya',
      '¿Cuál es la capital de Canadá?|Ottawa|Toronto|Montreal|Vancouver',
      '¿Cuál es el océano más grande?|Pacífico|Atlántico|Índico|Ártico',
      '¿Cuál es el río más largo de Sudamérica?|Amazonas|Paraná|Orinoco|Magdalena',
      '¿Cuál es el país más grande de Sudamérica?|Brasil|Argentina|Perú|Colombia',
    ],
  },
];
