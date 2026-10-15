/* ==========================================================================
   MR. LOLO — Generador de códigos QR (propio, sin dependencias externas)
   --------------------------------------------------------------------------
   Reemplaza al script de CDN `qrcode-generator` que usaba la versión anterior:
   ahora la tienda no depende de ningún servidor de terceros.

   Implementa el estándar ISO/IEC 18004: modo byte, versiones 1–10,
   niveles de corrección L / M / Q / H, y las 8 máscaras con su puntaje.

   Uso:
     import { qrMatrix } from './qr.js';
     const { size, modules } = qrMatrix('https://mi-tienda.com', 'M');
     // modules[y][x] === true  ->  módulo oscuro
   ========================================================================== */

const EC_FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };

/* Tabla de bloques Reed-Solomon: [ecPorBloque, bloques1, datos1, bloques2, datos2] */
const RS_BLOCKS = {
  1: { L: [7, 1, 19, 0, 0], M: [10, 1, 16, 0, 0], Q: [13, 1, 13, 0, 0], H: [17, 1, 9, 0, 0] },
  2: { L: [10, 1, 34, 0, 0], M: [16, 1, 28, 0, 0], Q: [22, 1, 22, 0, 0], H: [28, 1, 16, 0, 0] },
  3: { L: [15, 1, 55, 0, 0], M: [26, 1, 44, 0, 0], Q: [18, 2, 17, 0, 0], H: [22, 2, 13, 0, 0] },
  4: { L: [20, 1, 80, 0, 0], M: [18, 2, 32, 0, 0], Q: [26, 2, 24, 0, 0], H: [16, 4, 9, 0, 0] },
  5: { L: [26, 1, 108, 0, 0], M: [24, 2, 43, 0, 0], Q: [18, 2, 15, 2, 16], H: [22, 2, 11, 2, 12] },
  6: { L: [18, 2, 68, 0, 0], M: [16, 4, 27, 0, 0], Q: [24, 4, 19, 0, 0], H: [28, 4, 15, 0, 0] },
  7: { L: [20, 2, 78, 0, 0], M: [18, 4, 31, 0, 0], Q: [18, 2, 14, 4, 15], H: [26, 4, 13, 1, 14] },
  8: { L: [24, 2, 97, 0, 0], M: [22, 2, 38, 2, 39], Q: [22, 4, 18, 2, 19], H: [26, 4, 14, 2, 15] },
  9: { L: [30, 2, 116, 0, 0], M: [22, 3, 36, 2, 37], Q: [20, 4, 16, 4, 17], H: [24, 4, 12, 4, 13] },
  10: { L: [18, 2, 68, 2, 69], M: [26, 4, 43, 1, 44], Q: [24, 6, 19, 2, 20], H: [28, 6, 15, 2, 16] },
};

const MAX_VERSION = 10;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

/* --- GF(256) ------------------------------------------------------------- */
function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = ((z << 1) ^ ((z >>> 7) * 0x11d)) & 0xff;
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree) {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data, divisor) {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let i = 0; i < divisor.length; i++) result[i] ^= gfMul(divisor[i], factor);
  }
  return result;
}

/* --- Bit buffer ---------------------------------------------------------- */
function appendBits(buffer, val, len) {
  for (let i = len - 1; i >= 0; i--) buffer.push((val >>> i) & 1);
}

function utf8Bytes(text) {
  const out = [];
  const encoded = encodeURIComponent(text);
  for (let i = 0; i < encoded.length; i++) {
    if (encoded.charAt(i) !== '%') out.push(encoded.charCodeAt(i));
    else {
      out.push(parseInt(encoded.substring(i + 1, i + 3), 16));
      i += 2;
    }
  }
  return out;
}

function charCountBits(version) {
  return version <= 9 ? 8 : 16;
}

function dataCodewords(version, ec) {
  const [ecPerBlock, b1, d1, b2, d2] = RS_BLOCKS[version][ec];
  return b1 * d1 + b2 * d2 + (ecPerBlock * (b1 + b2) - ecPerBlock * (b1 + b2));
}

function totalDataCodewords(version, ec) {
  const s = RS_BLOCKS[version][ec];
  return s[1] * s[2] + s[3] * s[4];
}

/* --- Segmento en modo byte ---------------------------------------------- */
function makeSegment(text, version) {
  const bytes = utf8Bytes(text);
  const ccBits = charCountBits(version);
  const capacityBits = totalDataCodewords(version, 'L') * 8; // cota superior segura
  const bits = [];
  appendBits(bits, 0x4, 4); // modo byte
  appendBits(bits, bytes.length, ccBits);
  for (const b of bytes) appendBits(bits, b, 8);
  return { bits, numChars: bytes.length };
}

/* --- Construcción de la matriz ------------------------------------------ */
class QrCode {
  constructor(version, ec, dataCodewordsArr, forcedMask) {
    this.version = version;
    this.ec = ec;
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
    this.drawFunctionPatterns();
    const all = this.addEccAndInterleave(dataCodewordsArr);
    this.drawCodewords(all);

    let bestMask = 0;
    if (forcedMask == null) {
      let minPenalty = Infinity;
      for (let i = 0; i < 8; i++) {
        this.applyMask(i);
        this.drawFormatBits(i);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestMask = i;
        }
        this.applyMask(i);
      }
    } else {
      bestMask = forcedMask;
    }
    this.applyMask(bestMask);
    this.drawFormatBits(bestMask);
  }

  setFunctionModule(x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  drawFunctionPatterns() {
    // Patrones de posición + separadores
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    // Patrones de alineación (la versión 1 no lleva ninguno)
    if (this.version > 1) {
      const numAlign = Math.floor(this.version / 7) + 2;
      const step = this.version === 32 ? 26 : Math.ceil((this.size - 13) / (numAlign * 2 - 2)) * 2;
      const pos = [6];
      for (let i = numAlign - 1, p = this.size - 7; i >= 1; i--, p -= step) pos.splice(1, 0, p);
      for (let i = 0; i < numAlign; i++) {
        for (let j = 0; j < numAlign; j++) {
          if ((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0)) continue;
          this.drawAlignmentPattern(pos[i], pos[j]);
        }
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  }

  drawFinderPattern(x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  drawAlignmentPattern(x, y) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  drawFormatBits(mask) {
    const data = (EC_FORMAT_BITS[this.ec] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = (((data << 10) | rem) ^ 0x5412) & 0x7fff;

    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));

    for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    this.setFunctionModule(8, this.size - 8, true);
  }

  drawVersion() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  addEccAndInterleave(data) {
    const spec = RS_BLOCKS[this.version][this.ec];
    const numBlocks = spec[1] + spec[3];
    const blockEccLen = spec[0];
    const rawCodewords = Math.floor(getNumRawDataModules(this.version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks = [];
    const rsDiv = rsDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      const dat = data.slice(k, k + datLen);
      k += datLen;
      const ecc = rsRemainder(dat, rsDiv);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(Array.from(ecc)));
    }

    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
      });
    }
    return result;
  }

  drawCodewords(data) {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  applyMask(mask) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = false;
        }
        if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  getPenaltyScore() {
    let result = 0;

    const scan = (get) => {
      for (let a = 0; a < this.size; a++) {
        let runColor = false;
        let runLen = 0;
        const hist = [0, 0, 0, 0, 0, 0, 0];
        for (let b = 0; b < this.size; b++) {
          const color = get(a, b);
          if (color === runColor) {
            runLen++;
            if (runLen === 5) result += PENALTY_N1;
            else if (runLen > 5) result++;
          } else {
            this.finderPenaltyAddHistory(runLen, hist);
            if (!runColor) result += this.finderPenaltyCountPatterns(hist) * PENALTY_N3;
            runColor = color;
            runLen = 1;
          }
        }
        result += this.finderPenaltyTerminateAndCount(runColor, runLen, hist) * PENALTY_N3;
      }
    };
    scan((y, x) => this.modules[y][x]);
    scan((x, y) => this.modules[y][x]);

    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const c = this.modules[y][x];
        if (c === this.modules[y][x + 1] && c === this.modules[y + 1][x] && c === this.modules[y + 1][x + 1]) result += PENALTY_N2;
      }
    }

    let dark = 0;
    for (const row of this.modules) for (const c of row) if (c) dark++;
    const total = this.size * this.size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;
    return result;
  }

  finderPenaltyCountPatterns(h) {
    const n = h[1];
    const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
    return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
  }

  finderPenaltyAddHistory(currentRunLength, h) {
    if (h[0] === 0) currentRunLength += this.size;
    h.pop();
    h.unshift(currentRunLength);
  }

  finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, h) {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, h);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, h);
    return this.finderPenaltyCountPatterns(h);
  }
}

function getNumRawDataModules(ver) {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

function getBit(x, i) {
  return ((x >>> i) & 1) !== 0;
}

/* --- API pública --------------------------------------------------------- */
export function qrMatrix(text, ec = 'M', opts = {}) {
  const bytes = utf8Bytes(text);
  let version = -1;
  for (let v = 1; v <= MAX_VERSION; v++) {
    const cap = totalDataCodewords(v, ec) * 8;
    if (4 + charCountBits(v) + bytes.length * 8 <= cap) {
      version = v;
      break;
    }
  }
  if (version === -1) {
    // Último intento con el nivel de corrección más permisivo.
    for (let v = 1; v <= MAX_VERSION; v++) {
      const cap = totalDataCodewords(v, 'L') * 8;
      if (4 + charCountBits(v) + bytes.length * 8 <= cap) {
        version = v;
        ec = 'L';
        break;
      }
    }
  }
  if (version === -1) throw new Error('Texto demasiado largo para el QR');

  const ccBits = charCountBits(version);
  const bits = [];
  appendBits(bits, 0x4, 4);
  appendBits(bits, bytes.length, ccBits);
  for (const b of bytes) appendBits(bits, b, 8);

  const capacity = totalDataCodewords(version, ec) * 8;
  appendBits(bits, 0, Math.min(4, capacity - bits.length));
  appendBits(bits, 0, (8 - (bits.length % 8)) % 8);

  const padBytes = [0xec, 0x11];
  for (let i = 0; bits.length < capacity; i++) appendBits(bits, padBytes[i % 2], 8);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    codewords.push(b);
  }

  const qr = new QrCode(version, ec, codewords, opts.mask);
  return { size: qr.size, modules: qr.modules, version };
}

/* --- Render en canvas ---------------------------------------------------- */
export function drawQrToCanvas(canvas, text, opts = {}) {
  const { size, modules } = qrMatrix(text, opts.ec || 'M');
  const quiet = opts.quiet == null ? 4 : opts.quiet;
  const scale = opts.scale || 6;
  const total = (size + quiet * 2) * scale;
  canvas.width = total;
  canvas.height = total;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = opts.background || '#ffffff';
  ctx.fillRect(0, 0, total, total);
  ctx.fillStyle = opts.foreground || '#000000';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules[y][x]) ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
    }
  }
  return canvas;
}
