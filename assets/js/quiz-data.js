/* ==========================================================================
   MR. LOLO — Banco de preguntas "EL DESAFÍO"
   --------------------------------------------------------------------------
   Cultura general al estilo PlayQuiz: fútbol, literatura, mundo, ciencia,
   arte e historia. Cada pregunta tiene una imagen real y un dato para
   aprender después de responder.

   Las imágenes son de Wikipedia/Wikimedia Commons. El detalle de cada una
   está en assets/img/quiz/creditos.json.
   ========================================================================== */

export const CATEGORIAS = [
  { id: 'futbol', nombre: 'FÚTBOL', icono: '⚽', color: '#00FF88', desc: 'Mundiales, cracks y récords' },
  { id: 'literatura', nombre: 'LITERATURA', icono: '📚', color: '#C24BFF', desc: 'Libros y autores eternos' },
  { id: 'mundo', nombre: 'MUNDO', icono: '🌍', color: '#00B1EA', desc: 'Países, ríos y maravillas' },
  { id: 'ciencia', nombre: 'CIENCIA', icono: '🔬', color: '#FF5C7A', desc: 'Universo y cuerpo humano' },
  { id: 'arte', nombre: 'ARTE', icono: '🎨', color: '#FF9500', desc: 'Pintura y música' },
  { id: 'historia', nombre: 'HISTORIA', icono: '🏛️', color: '#FFE600', desc: 'Fechas que cambiaron todo' },
];

const img = (n) => `assets/img/quiz/${n}.jpg`;

export const PREGUNTAS = {
  futbol: [
    {
      img: img('messi'),
      pregunta: '¿Cuántos Balones de Oro ganó Lionel Messi?',
      opciones: ['8', '6', '7'],
      correcta: 0,
      dato: 'El último lo ganó en 2023, después del Mundial de Qatar.',
    },
    {
      img: img('mbappe'),
      pregunta: '¿En qué país nació Kylian Mbappé?',
      opciones: ['Francia', 'Bélgica', 'Camerún'],
      correcta: 0,
      dato: 'Nació en Bondy, cerca de París. Su papá es camerunés.',
    },
    {
      img: img('maradona'),
      pregunta: '¿Qué número usaba Maradona en el Mundial de 1986?',
      opciones: ['10', '9', '7'],
      correcta: 0,
      dato: 'Con la 10 hizo el gol del siglo contra Inglaterra.',
    },
    {
      img: img('ronaldo'),
      pregunta: '¿En qué club juega Cristiano Ronaldo desde 2023?',
      opciones: ['Al-Nassr', 'Al-Hilal', 'Sporting de Lisboa'],
      correcta: 0,
      dato: 'Se mudó a Arabia Saudita después de su paso por Manchester United.',
    },
    {
      img: img('trofeo'),
      pregunta: '¿Cada cuántos años se juega el Mundial de fútbol?',
      opciones: ['4 años', '2 años', '5 años'],
      correcta: 0,
      dato: 'El primero fue en 1930, en Uruguay.',
    },
    {
      img: img('trofeo'),
      pregunta: '¿Qué selección ganó el Mundial de 2022?',
      opciones: ['Argentina', 'Francia', 'Brasil'],
      correcta: 0,
      dato: 'Argentina le ganó a Francia por penales en Qatar.',
    },
  ],

  literatura: [
    {
      img: img('cervantes'),
      pregunta: '¿Quién escribió "Don Quijote de la Mancha"?',
      opciones: ['Miguel de Cervantes', 'Lope de Vega', 'Federico García Lorca'],
      correcta: 0,
      dato: 'Se publicó en 1605 y es una de las obras más traducidas del mundo.',
    },
    {
      img: img('quijote'),
      pregunta: '¿Contra qué creyó luchar Don Quijote?',
      opciones: ['Molinos de viento', 'Dragones', 'Ejércitos romanos'],
      correcta: 0,
      dato: 'Los confundió con gigantes por culpa de su imaginación.',
    },
    {
      img: img('shakespeare'),
      pregunta: '¿Quién escribió "Romeo y Julieta"?',
      opciones: ['William Shakespeare', 'Charles Dickens', 'George Orwell'],
      correcta: 0,
      dato: 'La escribió alrededor de 1595, en Londres.',
    },
    {
      img: img('garcia-marquez'),
      pregunta: '¿Quién escribió "Cien años de soledad"?',
      opciones: ['Gabriel García Márquez', 'Mario Vargas Llosa', 'Julio Cortázar'],
      correcta: 0,
      dato: 'Se publicó en 1967 y es la obra clave del realismo mágico.',
    },
    {
      img: img('garcia-marquez'),
      pregunta: '¿En qué país nació Gabriel García Márquez?',
      opciones: ['Colombia', 'México', 'Venezuela'],
      correcta: 0,
      dato: 'Nació en Aracataca, un pueblo de la costa colombiana.',
    },
    {
      img: img('shakespeare'),
      pregunta: '¿Quién escribió "Hamlet"?',
      opciones: ['William Shakespeare', 'Miguel de Cervantes', 'Dante Alighieri'],
      correcta: 0,
      dato: '"Ser o no ser" es una de sus frases más famosas.',
    },
  ],

  mundo: [
    {
      img: img('torre-eiffel'),
      pregunta: '¿En qué ciudad está la Torre Eiffel?',
      opciones: ['París', 'Roma', 'Londres'],
      correcta: 0,
      dato: 'Se construyó para la Exposición Universal de 1889.',
    },
    {
      img: img('machu-picchu'),
      pregunta: '¿Qué civilización construyó Machu Picchu?',
      opciones: ['Inca', 'Maya', 'Azteca'],
      correcta: 0,
      dato: 'Está a 2.430 metros de altura, en los Andes peruanos.',
    },
    {
      img: img('amazonas'),
      pregunta: '¿Cuál es el río más caudaloso del mundo?',
      opciones: ['Amazonas', 'Nilo', 'Misisipi'],
      correcta: 0,
      dato: 'Lleva más agua que los siguientes siete ríos juntos.',
    },
    {
      img: img('gran-muralla'),
      pregunta: '¿En qué país está la Gran Muralla?',
      opciones: ['China', 'Japón', 'India'],
      correcta: 0,
      dato: 'Mide más de 21.000 kilómetros sumando todas sus secciones.',
    },
    {
      img: img('piramides'),
      pregunta: '¿En qué país están las pirámides de Giza?',
      opciones: ['Egipto', 'México', 'Perú'],
      correcta: 0,
      dato: 'La Gran Pirámide fue la construcción más alta durante 3.800 años.',
    },
    {
      img: img('libertad'),
      pregunta: '¿En qué ciudad está la Estatua de la Libertad?',
      opciones: ['Nueva York', 'Washington', 'Boston'],
      correcta: 0,
      dato: 'Fue un regalo de Francia en 1886.',
    },
  ],

  ciencia: [
    {
      img: img('einstein'),
      pregunta: '¿Qué teoría formuló Albert Einstein?',
      opciones: ['La relatividad', 'La gravitación universal', 'La evolución'],
      correcta: 0,
      dato: 'Cambió la forma de entender el espacio y el tiempo.',
    },
    {
      img: img('luna'),
      pregunta: '¿Quién fue el primer humano en caminar sobre la Luna?',
      opciones: ['Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin'],
      correcta: 0,
      dato: 'Dijo: "Un pequeño paso para el hombre, un gran salto para la humanidad".',
    },
    {
      img: img('luna'),
      pregunta: '¿En qué año llegó el ser humano a la Luna?',
      opciones: ['1969', '1961', '1975'],
      correcta: 0,
      dato: 'Fue el 20 de julio, en la misión Apolo 11.',
    },
    {
      img: img('jupiter'),
      pregunta: '¿Cuál es el planeta más grande del sistema solar?',
      opciones: ['Júpiter', 'Saturno', 'Neptuno'],
      correcta: 0,
      dato: 'Podrían entrar más de 1.300 Tierras dentro de Júpiter.',
    },
    {
      img: img('esqueleto'),
      pregunta: '¿Cuántos huesos tiene el cuerpo humano adulto?',
      opciones: ['206', '208', '201'],
      correcta: 0,
      dato: 'Al nacer tenemos unos 300; algunos se fusionan con los años.',
    },
    {
      img: img('einstein'),
      pregunta: '¿En qué área ganó Einstein el Premio Nobel?',
      opciones: ['Física', 'Química', 'Medicina'],
      correcta: 0,
      dato: 'Lo ganó en 1921 por el efecto fotoeléctrico.',
    },
  ],

  arte: [
    {
      img: img('mona-lisa'),
      pregunta: '¿Quién pintó la Mona Lisa?',
      opciones: ['Leonardo da Vinci', 'Miguel Ángel', 'Rafael'],
      correcta: 0,
      dato: 'La pintó entre 1503 y 1519.',
    },
    {
      img: img('mona-lisa'),
      pregunta: '¿En qué museo se exhibe la Mona Lisa?',
      opciones: ['El Louvre', 'El Prado', 'Los Uffizi'],
      correcta: 0,
      dato: 'Está en París y recibe millones de visitantes por año.',
    },
    {
      img: img('van-gogh'),
      pregunta: '¿Quién pintó "La noche estrellada"?',
      opciones: ['Vincent van Gogh', 'Claude Monet', 'Pablo Picasso'],
      correcta: 0,
      dato: 'La pintó en 1889 mientras estaba en un sanatorio.',
    },
    {
      img: img('mozart'),
      pregunta: '¿Quién compuso "La flauta mágica"?',
      opciones: ['Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Johann Sebastian Bach'],
      correcta: 0,
      dato: 'Se estrenó en Viena en 1791, el mismo año de su muerte.',
    },
    {
      img: img('van-gogh'),
      pregunta: '¿En qué país nació Vincent van Gogh?',
      opciones: ['Países Bajos', 'Bélgica', 'Francia'],
      correcta: 0,
      dato: 'Nació en Zundert, en 1853.',
    },
    {
      img: img('mozart'),
      pregunta: '¿En qué país nació Mozart?',
      opciones: ['Austria', 'Alemania', 'Italia'],
      correcta: 0,
      dato: 'Nació en Salzburgo, en 1756.',
    },
  ],

  historia: [
    {
      img: img('piramides'),
      pregunta: '¿Qué civilización construyó las pirámides de Giza?',
      opciones: ['La egipcia', 'La romana', 'La griega'],
      correcta: 0,
      dato: 'Se construyeron hace más de 4.500 años.',
    },
    {
      img: img('machu-picchu'),
      pregunta: '¿En qué país está Machu Picchu?',
      opciones: ['Perú', 'Bolivia', 'Chile'],
      correcta: 0,
      dato: 'Fue declarado Patrimonio de la Humanidad en 1983.',
    },
    {
      img: img('muro-berlin'),
      pregunta: '¿En qué año cayó el Muro de Berlín?',
      opciones: ['1989', '1991', '1985'],
      correcta: 0,
      dato: 'El 9 de noviembre de 1989 se abrieron los pasos.',
    },
    {
      img: img('titanic'),
      pregunta: '¿En qué año se hundió el Titanic?',
      opciones: ['1912', '1905', '1920'],
      correcta: 0,
      dato: 'Chocó con un iceberg en su viaje inaugural.',
    },
    {
      img: img('muro-berlin'),
      pregunta: '¿En qué ciudad estaba el Muro que cayó en 1989?',
      opciones: ['Berlín', 'Viena', 'Praga'],
      correcta: 0,
      dato: 'Dividió la ciudad durante 28 años.',
    },
    {
      img: img('titanic'),
      pregunta: '¿En qué océano se hundió el Titanic?',
      opciones: ['Atlántico', 'Pacífico', 'Índico'],
      correcta: 0,
      dato: 'Se hundió a unos 600 km de la costa de Terranova.',
    },
  ],
};
