import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.JSDOM_PATH);
const raiz = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.com/', pretendToBeVisual: true });
const { window } = dom;
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
window.HTMLCanvasElement.prototype.getContext = () => null;

const { PRODUCTOS } = await import(`file:///${path.join(raiz, 'assets/js/data.js').replace(/\\/g, '/')}`);
const { iniciarQuiz } = await import(`file:///${path.join(raiz, 'assets/js/quiz.js').replace(/\\/g, '/')}`);

let fin = null;
const juego = iniciarQuiz({ alTerminar: (p, e) => { fin = { p, e }; }, productos: PRODUCTOS, record: 0 });

document.querySelector('[data-quiz="empezar"]').click();
await new Promise((r) => setTimeout(r, 2200));

const vidas = () => document.querySelector('[data-quiz="vidas"]')?.textContent.trim();
const pregunta = () => document.querySelector('[data-quiz="pregunta"]')?.textContent.trim();
const ronda = () => document.querySelector('[data-quiz="ronda-nombre"]')?.textContent.trim();
console.log('ronda1:', ronda(), '| vidas:', vidas(), '| pregunta:', pregunta());
console.log('opciones:', document.querySelectorAll('[data-opcion]').length, '| imagen hija:', document.querySelector('[data-quiz="imagen"]')?.children.length);

// Comodín 50/50
document.querySelector('[data-quiz="cincuenta"]')?.click();
console.log('opciones fuera tras 50/50:', document.querySelectorAll('.quiz__opcion--fuera').length);

// Contesta hasta terminar
let vueltas = 0;
while (!fin && vueltas < 40) {
  vueltas += 1;
  const op = [...document.querySelectorAll('[data-opcion]')].find((b) => !b.disabled && !b.classList.contains('quiz__opcion--fuera'));
  op?.click();
  await new Promise((r) => setTimeout(r, 2100));
  if (vueltas % 5 === 0) console.log('...', ronda(), pregunta()?.slice(0, 40));
}

console.log('fin:', fin);
console.log('vueltas:', vueltas);
process.exit(0);
