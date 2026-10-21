/* ==========================================================================
   MR. LOLO — Datos de la tienda
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que hace falta tocar para cambiar la tienda.
   Todo lo demás (diseño, carrito, juegos, QR) se adapta solo a estos datos.
   ========================================================================== */

export const TIENDA = {
  /* --- Identidad -------------------------------------------------------- */
  nombre: 'Mr. LOLO',
  bajada: 'Golosinas del recreo, a un toque 🍬',
  firma: 'GOLOSINAS DEL RECREO',
  version: '5.2',
  // Revisión interna: cambia cuando se publica desde el panel. Sirve para
  // detectar si en un celular quedaron cambios guardados de una versión vieja.
  revision: 'r5.2',

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

  /* --- Trivia ----------------------------------------------------------- */
  trivia: true,
  // Segundos que tenés para responder cada pregunta.
  triviaSegundos: 20,
  // Cuántas preguntas tiene cada ronda.
  triviaPorRonda: 5,
  // Rondas por día que suman puntos (después se juega en modo práctica).
  triviaRondasConPuntos: 2,

  /* --- Juegos ----------------------------------------------------------- */
  juego: true,
  tetris: true,

  /* --- Stock ------------------------------------------------------------ */
  // Avisar cuando queden estas unidades o menos.
  stockBajo: 3,

  /* --- Publicación (para el botón "Publicar" del panel) ----------------- */
  publicacion: {
    usuario: 'Paulomillanez1983',
    repo: 'mr-lolo',
    rama: 'main',
    url: 'https://mr-lolo.vercel.app/',
  },

  /* --- Portada ---------------------------------------------------------- */
  // Foto grande de la tienda (la carga el panel, sección Fotos).
  portada: '',

  /* --- Nube en vivo ----------------------------------------------------- */
  // Proyecto de Supabase. La "anon key" es pública por diseño: está protegida
  // por las políticas (RLS) de la base. No pongas acá la service_role key.
  nube: {
    url: 'https://pvvsaevtgaehbqkituvb.supabase.co',
    clave: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dnNhZXZ0Z2FlaGJxa2l0dXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MTUyNTAsImV4cCI6MjEwODE5MTI1MH0.i-6UkOVsxCRxw6GgiQ3dwIJbllHzWk2dcq2xcP_TeAo',
    bucket: 'fotos',
  },

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
/* 15 temas. Cada ronda mezcla preguntas de TODOS los temas, y el sistema
   elige más seguido las que te costaron (ver app.js, `pesoPregunta`).

   Formato de cada pregunta, separado por "|":
     pregunta | respuesta correcta | opción | opción | opción | dato para aprender
   El "dato" es opcional pero recomendado: es lo que se muestra al responder. */
export const TRIVIA = [
  {
    icono: '🍬',
    tema: 'Cultura general y golosinas',
    preguntas: [
      '¿Qué ingrediente principal tiene el dulce de leche?|Leche|Banana|Maíz|Manzana|Se hace cocinando leche con azúcar durante horas.',
      '¿Cuántos colores tiene el arcoíris?|7|5|6|8|Rojo, naranja, amarillo, verde, celeste, azul y violeta.',
      '¿Qué color se forma al mezclar azul y amarillo?|Verde|Naranja|Violeta|Marrón|Los primarios de la pintura son rojo, azul y amarillo.',
      '¿Cuántos meses tienen 28 días?|Todos|Solo febrero|Ninguno|Dos|Todos los meses tienen al menos 28 días.',
      '¿Qué planeta es el más cercano al Sol?|Mercurio|Venus|Marte|Tierra|Mercurio está a unos 58 millones de kilómetros del Sol.',
      '¿Qué gas necesitamos para respirar?|Oxígeno|Helio|Hidrógeno|Humo|El aire que respiramos tiene un 21% de oxígeno.',
      '¿De qué planta sale el chocolate?|Cacao|Café|Vainilla|Maní|El cacao crece en vainas y el chocolate sale de sus semillas.',
      '¿Cuántos lados tiene un hexágono?|6|5|8|7|"Hexa" en griego significa seis.',
    ],
  },
  {
    icono: '🗺️',
    tema: 'Capitales de provincias',
    preguntas: [
      '¿Cuál es la capital de Santa Fe?|Santa Fe|Rosario|Rafaela|Venado Tuerto|Rosario es la más poblada, pero la capital es Santa Fe.',
      '¿Cuál es la capital de Tucumán?|San Miguel de Tucumán|Tafí Viejo|Concepción|Yerba Buena|Ahí se declaró la independencia en 1816.',
      '¿Cuál es la capital de Chubut?|Rawson|Comodoro Rivadavia|Trelew|Esquel|La fundaron colonos galeses en 1865.',
      '¿Cuál es la capital de Misiones?|Posadas|Oberá|Eldorado|Puerto Iguazú|Está a orillas del río Paraná, frente a Encarnación.',
      '¿Cuál es la capital de Jujuy?|San Salvador de Jujuy|Palpalá|Humahuaca|Tilcara|La Quebrada de Humahuaca es Patrimonio de la Humanidad.',
      '¿Cuál es la capital de Santa Cruz?|Río Gallegos|Caleta Olivia|El Calafate|Puerto Deseado|Es la capital de provincia más austral del país.',
      '¿Cuál es la capital de Entre Ríos?|Paraná|Concordia|Gualeguaychú|Colón|La ciudad está rodeada por el río Paraná.',
      '¿Cuál es la capital de la provincia de Buenos Aires?|La Plata|Mar del Plata|Bahía Blanca|Buenos Aires|La Plata se fundó en 1882 con un diseño de cuadrado perfecto.',
    ],
  },
  {
    icono: '🔢',
    tema: 'Matemática rápida',
    preguntas: [
      '¿Cuánto es 7 × 8?|56|54|48|63|8 × 8 = 64, así que 7 × 8 es 8 menos: 56.',
      '¿Cuánto es 9 × 6?|54|56|45|63|Truco del 9: restale 1 al 6 (5) y completá hasta 9 (4): 54.',
      '¿Cuánto es 12 + 19?|31|29|32|41|Podés sumar 20 y restar 1: 12 + 20 − 1 = 31.',
      '¿Cuánto es 100 − 37?|63|67|73|57|Comprobación: 63 + 37 vuelve a dar 100.',
      '¿Cuál es la mitad de 90?|45|40|35|50|45 + 45 = 90.',
      '¿Cuánto es 8 × 8?|64|56|72|48|Es un cuadrado perfecto: 8² = 64.',
      '¿Cuál es el doble de 35?|70|65|60|75|El doble de 30 es 60 y el de 5 es 10: 60 + 10 = 70.',
      '¿Cuánto es 144 ÷ 12?|12|14|11|16|12 × 12 = 144, así que la cuenta da 12.',
    ],
  },
  {
    icono: '🐾',
    tema: 'Animales y naturaleza',
    preguntas: [
      '¿Cuál es el animal más grande del mundo?|Ballena azul|Elefante|Jirafa|Tiburón ballena|Puede medir 30 metros y pesar como 20 elefantes.',
      '¿Cuántas patas tiene una araña?|8|6|10|4|Los insectos tienen 6 patas; las arañas, 8.',
      '¿Cuál es el ave nacional de Argentina?|Hornero|Cóndor|Ñandú|Tero|Le dicen "el pájaro albañil" por su nido de barro.',
      '¿Cuántos corazones tiene un pulpo?|3|1|2|8|Dos bombean sangre a las branquias y uno al resto del cuerpo.',
      '¿Cuál es el animal terrestre más rápido?|Guepardo|León|Caballo|Tigre|Alcanza los 110 km/h, pero solo por unos segundos.',
      '¿Qué insecto produce la miel?|Abeja|Hormiga|Mariposa|Mosca|Para un kilo de miel visitan millones de flores.',
      '¿Qué mamífero puede volar?|Murciélago|Águila|Mariposa|Loro|Es el único mamífero que vuela de verdad.',
      '¿Cómo se llama el hogar de las abejas?|Colmena|Nido|Madriguera|Cueva|En una colmena pueden vivir más de 50.000 abejas.',
    ],
  },
  {
    icono: '🏛️',
    tema: 'Historia argentina',
    preguntas: [
      '¿En qué año fue la Revolución de Mayo?|1810|1816|1853|1780|El 25 de mayo de 1810 se formó el primer gobierno patrio.',
      '¿Quién creó la bandera argentina?|Manuel Belgrano|José de San Martín|Domingo Sarmiento|Juan Manuel de Rosas|Belgrano la izó por primera vez en Rosario, en 1812.',
      '¿En qué ciudad se declaró la Independencia?|San Miguel de Tucumán|Buenos Aires|Córdoba|Mendoza|Fue el 9 de julio de 1816, en la Casa de Tucumán.',
      '¿Qué día es el Día de la Independencia?|9 de julio|25 de mayo|20 de junio|17 de agosto|Ese día se firmó el acta en Tucumán.',
      '¿Qué día es el Día de la Bandera?|20 de junio|9 de julio|25 de mayo|12 de octubre|Se eligió por la fecha de la muerte de Belgrano, en 1820.',
      '¿Quién cruzó los Andes con su ejército libertador?|José de San Martín|Manuel Belgrano|Mariano Moreno|Bernardino Rivadavia|En 1817 cruzó con unos 5.000 soldados.',
      '¿En qué año se sancionó la Constitución Nacional?|1853|1810|1816|1880|Se aprobó en la ciudad de Santa Fe.',
      '¿Qué se recuerda el 25 de mayo?|La Revolución de Mayo|La Independencia|La Bandera|La Constitución|Ese día asumió la Primera Junta de gobierno.',
    ],
  },
  {
    icono: '⚽',
    tema: 'Deportes',
    preguntas: [
      '¿En qué año ganó Argentina el Mundial de Qatar?|2022|2018|2014|2010|En la final le ganó a Francia por penales.',
      '¿Quién fue el capitán de la selección argentina campeona en Qatar?|Lionel Messi|Ángel Di María|Emiliano Martínez|Julián Álvarez|Messi levantó la tercera Copa del Mundo de Argentina.',
      '¿Cuántos jugadores juegan por equipo en la cancha de fútbol?|11|9|10|12|Son 10 jugadores de campo y el arquero.',
      '¿Cuántos jugadores de un equipo hay en la cancha en básquet?|5|6|7|4|En el fútbol son 11 y en el básquet, 5.',
      '¿Cuál es el deporte nacional de Argentina?|Pato|Fútbol|Rugby|Tenis|El pato se juega a caballo y es deporte nacional desde 1953.',
      '¿Qué deporte se juega en Wimbledon?|Tenis|Golf|Rugby|Polo|Es el torneo de tenis más antiguo del mundo.',
      '¿Cuántos aros tiene la bandera olímpica?|5|4|6|7|Representan las partes habitadas del mundo.',
      '¿Qué país ganó el primer Mundial de fútbol, en 1930?|Uruguay|Argentina|Brasil|Italia|Uruguay le ganó la final a Argentina 4 a 2, en Montevideo.',
    ],
  },
  {
    icono: '🌍',
    tema: 'Geografía del mundo',
    preguntas: [
      '¿Cuál es la capital de Brasil?|Brasilia|Río de Janeiro|San Pablo|Salvador|Se construyó en 1960 y tiene forma de avión.',
      '¿Cuál es la capital de Chile?|Santiago|Valparaíso|Concepción|Lima|Valparaíso es la sede del Congreso, pero la capital es Santiago.',
      '¿Cuál es la capital de Australia?|Canberra|Sídney|Melbourne|Perth|No es Sídney: la capital es Canberra.',
      '¿Cuál es la capital de Japón?|Tokio|Osaka|Kioto|Nagoya|Antes de 1868 la capital era Kioto.',
      '¿Cuál es la capital de Canadá?|Ottawa|Toronto|Montreal|Vancouver|Toronto es más grande, pero la capital es Ottawa.',
      '¿Cuál es el océano más grande?|Pacífico|Atlántico|Índico|Ártico|Cubre más superficie que todos los continentes juntos.',
      '¿Cuál es el río más largo de Sudamérica?|Amazonas|Paraná|Orinoco|Magdalena|También es el río más caudaloso del mundo.',
      '¿Cuál es el país más grande de Sudamérica?|Brasil|Argentina|Perú|Colombia|Ocupa casi la mitad del continente.',
    ],
  },
  {
    icono: '🧠',
    tema: 'Ciencia y cuerpo humano',
    preguntas: [
      '¿Cuántos huesos tiene el cuerpo humano adulto?|206|300|150|256|Al nacer tenemos unos 300 y algunos se fusionan con el tiempo.',
      '¿Cuál es el órgano más grande del cuerpo?|La piel|El hígado|El cerebro|Los pulmones|La piel de un adulto pesa unos 4 kilos.',
      '¿Qué órgano bombea la sangre?|El corazón|El hígado|El estómago|Los riñones|Late unas 100.000 veces por día.',
      '¿Cuántos dientes de leche tiene un chico?|20|32|24|16|Después vienen 32 dientes definitivos.',
      '¿Con qué parte del cuerpo sentimos los sabores?|La lengua|La nariz|Los dientes|El paladar|La lengua tiene miles de papilas gustativas.',
      '¿Qué líquido rojo transporta el oxígeno?|La sangre|La saliva|La bilis|El plasma|Un adulto tiene unos 5 litros de sangre.',
      '¿Cuál es el animal más alto del mundo?|La jirafa|El elefante|El camello|El avestruz|Una jirafa puede medir 5,5 metros.',
      '¿Qué tenemos que tomar todos los días para estar bien hidratados?|Agua|Gaseosa|Jugo en polvo|Café|El cuerpo es un 60% agua y hay que reponerla.',
    ],
  },
  {
    icono: '🎬',
    tema: 'Cine y dibujos animados',
    preguntas: [
      '¿Cómo se llama el ratón más famoso de Disney?|Mickey Mouse|Donald|Goofy|Pluto|Mickey debutó en 1928, en el corto "Steamboat Willie".',
      '¿Cómo se llama el pato amigo de Mickey Mouse?|El Pato Donald|Pluto|Goofy|El Pato Lucas|Donald apareció por primera vez en 1934.',
      '¿Qué come Popeye para tener fuerza?|Espinaca|Zanahoria|Tomate|Lechuga|Popeye apareció en 1929 y hizo famosa la espinaca.',
      '¿En qué película animada aparece Simba?|El Rey León|Tarzán|Aladdín|Bambi|"El Rey León" es de 1994.',
      '¿Cómo se llama el muñeco vaquero amigo de Buzz Lightyear?|Woody|Jessie|Rex|Slinky|"Toy Story" (1995) fue la primera película animada por computadora.',
      '¿Qué superhéroe trepa paredes como una araña?|Spider-Man|Batman|Superman|Hulk|Apareció en un cómic en 1962.',
      '¿De qué color es la capa de Superman?|Roja|Azul|Negra|Verde|Superman nació en 1938, en un cómic.',
      '¿Cómo se llama la ciudad donde vive Batman?|Gotham|Metrópolis|Central City|Star City|Metrópolis es la ciudad de Superman.',
    ],
  },
  {
    icono: '🎵',
    tema: 'Música',
    preguntas: [
      '¿Cuántas cuerdas tiene una guitarra clásica?|6|4|7|12|La guitarra eléctrica también tiene 6 cuerdas.',
      '¿Cuántas teclas tiene un piano común?|88|76|96|64|Son 52 blancas y 36 negras.',
      '¿Qué instrumento se toca con baquetas?|La batería|El violín|La flauta|El piano|Se toca con baquetas o con escobillas.',
      '¿Cuál de estos es un instrumento de viento?|La trompeta|El violín|La guitarra|El tambor|El sonido sale del aire que vibra dentro del instrumento.',
      '¿Qué grupo musical grabó "Help!"?|The Beatles|Rolling Stones|Queen|ABBA|Los Beatles eran cuatro: John, Paul, George y Ringo.',
      '¿Cuántos músicos hay en un cuarteto?|4|3|5|6|"Cuarteto" viene de cuatro; en Córdoba también es un género musical.',
      '¿Cómo se llama el conjunto de cinco líneas donde se escriben las notas?|El pentagrama|El compás|La partitura|La clave|"Penta" significa cinco.',
      '¿Qué instrumento tiene muchas cuerdas y se toca con los dedos, no con arco?|El arpa|El violín|El chelo|El contrabajo|Un arpa de concierto tiene alrededor de 47 cuerdas.',
    ],
  },
  {
    icono: '🍕',
    tema: 'Comidas del mundo',
    preguntas: [
      '¿De qué país es típica la pizza?|Italia|Francia|Grecia|España|La pizza napolitana nació en Nápoles.',
      '¿De qué país es típico el sushi?|Japón|China|Tailandia|Corea|Se prepara con arroz y pescado.',
      '¿De qué país son los tacos?|México|Perú|España|Brasil|Se hacen con tortillas de maíz o de trigo.',
      '¿Con qué fruta se hace el vino?|Uva|Manzana|Pera|Durazno|Argentina es uno de los mayores productores de vino del mundo.',
      '¿De dónde sale el aceite de oliva?|De la aceituna|Del girasol|Del maíz|Del maní|La aceituna es el fruto del olivo.',
      '¿En qué países se toma mucho mate?|En Argentina, Uruguay y Paraguay|En Brasil|En Chile|En México|Se toma con una bombilla y yerba, no es un té.',
      '¿Qué alimento sale de la vaca y se usa para hacer queso?|La leche|La harina|El azúcar|La sal|Con leche y cuajo se hacen quesos como el criollo.',
      '¿Qué harina se usa para amasar pizza y pan?|La de trigo|La de maíz|La de arroz|La de mandioca|La harina de trigo tiene gluten, que hace que la masa crezca.',
    ],
  },
  {
    icono: '📚',
    tema: 'Lengua y ortografía',
    preguntas: [
      '¿Cuántas letras tiene el alfabeto español?|27|26|25|29|Son 27, contando la Ñ.',
      '¿Cuál está bien escrita?|Buenísimo|Buenisimo|Buenicimo|Buenizimo|Las palabras esdrújulas siempre llevan tilde.',
      '¿Qué signo va antes de una pregunta?|¿|¡|.|,|El español es el único idioma que abre las preguntas.',
      '¿Cómo se escribe el plural de "lápiz"?|Lápices|Lápizes|Lapices|Lápizs|Las palabras terminadas en -z hacen el plural en -ces.',
      '¿Cuál es el femenino de "actor"?|Actriz|Actora|Actresa|Actoreza|Pasa lo mismo con emperador y emperatriz.',
      '¿Qué palabra significa lo mismo que "contento"?|Feliz|Triste|Enojado|Cansado|Los sinónimos son palabras con significado parecido.',
      '¿Qué palabra significa lo contrario de "día"?|Noche|Mañana|Tarde|Semana|Los antónimos son palabras con significado opuesto.',
      '¿En cuántas sílabas se separa "mariposa"?|4|3|5|2|Ma-ri-po-sa: cuatro sílabas.',
    ],
  },
  {
    icono: '🚀',
    tema: 'Inventos y tecnología',
    preguntas: [
      '¿Quién inventó la bombilla eléctrica práctica?|Thomas Edison|Albert Einstein|Isaac Newton|Alexander Bell|Edison logró que funcionara muchas horas seguidas.',
      '¿Quién patentó el teléfono?|Alexander Graham Bell|Thomas Edison|Los hermanos Lumière|Nikola Tesla|Lo patentó en 1876.',
      '¿Qué inventaron los hermanos Lumière?|El cine|El teléfono|La radio|La televisión|En 1895 hicieron la primera proyección pública.',
      '¿Quiénes hicieron el primer vuelo en avión?|Los hermanos Wright|Los hermanos Lumière|Edison|Da Vinci|Fue en 1903, en Estados Unidos.',
      '¿Quién formuló las leyes de la gravedad?|Isaac Newton|Galileo|Einstein|Darwin|Las publicó en 1687, en el libro "Principia".',
      '¿Qué máquina hace cálculos muy rápido?|La computadora|La impresora|El módem|El escáner|Las primeras computadoras ocupaban una habitación entera.',
      '¿Para qué sirve un panel solar?|Para transformar la luz del sol en electricidad|Para enfriar la casa|Para dar sombra|Para calentar agua con gas|Es una energía renovable y no contamina.',
      '¿Qué invento sirve para conservar la comida en frío?|La heladera|El ventilador|La tostadora|El microondas|Antes se usaba hielo traído en barcos.',
    ],
  },
  {
    icono: '🎨',
    tema: 'Arte y colores',
    preguntas: [
      '¿Quién pintó la Mona Lisa?|Leonardo da Vinci|Miguel Ángel|Picasso|Van Gogh|Está en el museo del Louvre, en París.',
      '¿Cuáles son los colores primarios de la pintura?|Rojo, azul y amarillo|Rojo, verde y azul|Blanco y negro|Naranja y violeta|Mezclándolos se obtienen los demás colores.',
      '¿Qué colores se mezclan para obtener naranja?|Rojo y amarillo|Azul y amarillo|Rojo y azul|Verde y azul|Por eso el naranja es un color secundario.',
      '¿Quién esculpió "El David"?|Miguel Ángel|Rodin|Picasso|Dalí|La terminó en 1504, en Florencia.',
      '¿Cómo se llama el lugar donde se exponen cuadros?|Museo|Teatro|Biblioteca|Cine|El museo más visitado del mundo es el Louvre.',
      '¿Qué color resulta de mezclar blanco y negro?|Gris|Marrón|Violeta|Beige|El blanco, el negro y el gris se llaman colores neutros.',
      '¿Quién pintó "La noche estrellada"?|Vincent van Gogh|Claude Monet|Salvador Dalí|Picasso|La pintó en 1889, mirando el cielo desde un sanatorio.',
      '¿Con qué se pinta un cuadro al óleo?|Con pintura y pinceles|Con lápiz|Con tiza|Con marcador|Los óleos tardan días en secarse.',
    ],
  },
  {
    icono: '🏆',
    tema: 'Récords y curiosidades',
    preguntas: [
      '¿Cuál es la montaña más alta del mundo?|El Everest|El Aconcagua|El Kilimanjaro|Los Alpes|Mide 8.849 metros.',
      '¿Cuál es la montaña más alta de América?|El Aconcagua|El Everest|El Chimborazo|El Cotopaxi|Está en Mendoza y mide 6.961 metros.',
      '¿Cuál es el desierto cálido más grande del mundo?|El Sahara|El Gobi|El Atacama|El Kalahari|Es casi tan grande como Estados Unidos.',
      '¿Qué océano está entre América y Europa?|El Atlántico|El Pacífico|El Índico|El Ártico|Cristóbal Colón lo cruzó en 1492.',
      '¿Cuál es el país más poblado del mundo?|India|China|Estados Unidos|Indonesia|En 2023 India superó a China en población.',
      '¿Cuántas cámaras tiene el corazón humano?|4|2|3|1|Son dos aurículas y dos ventrículos.',
      '¿Qué animal cambia de color para esconderse?|El camaleón|El león|El oso|El pez payaso|Cambia según su ánimo y la temperatura.',
      '¿Cuál es la catarata más alta del mundo?|El Salto del Ángel|Las Cataratas del Iguazú|Las del Niágara|Las Victoria|Está en Venezuela y mide casi 1.000 metros.',
    ],
  },
];
