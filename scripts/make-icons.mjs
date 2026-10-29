/**
 * Genera los PNG del icono de la app a partir del mismo dibujo que public/icon.svg.
 * Sin dependencias: dibuja en un buffer RGBA (con supersampling) y escribe el PNG a mano.
 *
 *   node scripts/make-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const SS = 4; // supersampling para que los bordes salgan suaves

const BLUE = [0, 113, 227, 255];
const WHITE = [255, 255, 255, 255];

function canvas(size) {
  return { size, data: Buffer.alloc(size * size * 4) };
}

function blend(target, index, color) {
  const [r, g, b, a] = color;
  const alpha = a / 255;
  target[index] = Math.round(target[index] * (1 - alpha) + r * alpha);
  target[index + 1] = Math.round(target[index + 1] * (1 - alpha) + g * alpha);
  target[index + 2] = Math.round(target[index + 2] * (1 - alpha) + b * alpha);
  target[index + 3] = Math.round(target[index + 3] + a * (1 - target[index + 3] / 255));
}

function roundedRect(c, x, y, w, h, radius, color) {
  const r = Math.min(radius, w / 2, h / 2);
  for (let py = Math.max(0, Math.floor(y)); py < Math.min(c.size, Math.ceil(y + h)); py++) {
    for (let px = Math.max(0, Math.floor(x)); px < Math.min(c.size, Math.ceil(x + w)); px++) {
      // distancia a la caja interior: si cae dentro del radio en una esquina, se recorta
      const dx = Math.max(x + r - px - 0.5, 0, px + 0.5 - (x + w - r));
      const dy = Math.max(y + r - py - 0.5, 0, py + 0.5 - (y + h - r));
      if (dx * dx + dy * dy > r * r) continue;
      blend(c.data, (py * c.size + px) * 4, color);
    }
  }
}

function circle(c, cx, cy, r, color) {
  roundedRect(c, cx - r, cy - r, r * 2, r * 2, r, color);
}

/** El dibujo del icono en un lienzo de 512x512 logicos. */
function drawArtwork(c, scale, offset) {
  const at = (v) => v * scale + offset;
  const size = (v) => v * scale;

  const rows = [
    { y: 170, end: 370 },
    { y: 256, end: 370 },
    { y: 342, end: 290 },
  ];
  for (const row of rows) {
    circle(c, at(96), at(row.y), size(16), WHITE);
    const barHeight = size(30);
    roundedRect(c, at(150), at(row.y) - barHeight / 2, size(row.end - 150), barHeight, barHeight / 2, WHITE);
  }
}

function downsample(big, size) {
  const out = canvas(size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * big.size + x * SS + sx) * 4;
          r += big.data[i];
          g += big.data[i + 1];
          b += big.data[i + 2];
          a += big.data[i + 3];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      out.data[i] = Math.round(r / n);
      out.data[i + 1] = Math.round(g / n);
      out.data[i + 2] = Math.round(b / n);
      out.data[i + 3] = Math.round(a / n);
    }
  }
  return out;
}

/**
 * @param {number} size  lado del PNG
 * @param {"rounded"|"square"} shape  fondo con esquinas redondeadas o cuadrado (maskable / iOS)
 * @param {number} inset  cuanto achica el dibujo dentro del lienzo (zona segura del maskable)
 */
function render(size, shape, inset = 0) {
  const big = canvas(size * SS);
  const full = size * SS;
  const radius = shape === "rounded" ? full * 0.22 : 0;
  roundedRect(big, 0, 0, full, full, radius, BLUE);

  const artScale = (full / 512) * (1 - inset);
  drawArtwork(big, artScale, (full - 512 * artScale) / 2);

  return downsample(big, size);
}

// --- PNG ---

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function toPng(c) {
  const stride = c.size * 4;
  const raw = Buffer.alloc((stride + 1) * c.size);
  for (let y = 0; y < c.size; y++) {
    raw[y * (stride + 1)] = 0; // filtro "none"
    c.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.size, 0);
  ihdr.writeUInt32BE(c.size, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const files = [
  ["icon-192.png", render(192, "rounded")],
  ["icon-512.png", render(512, "rounded")],
  ["icon-maskable-512.png", render(512, "square", 0.3)],
  ["apple-touch-icon.png", render(180, "square")],
];

mkdirSync(PUBLIC_DIR, { recursive: true });
for (const [name, image] of files) {
  const png = toPng(image);
  writeFileSync(join(PUBLIC_DIR, name), png);
  console.log(name, (png.length / 1024).toFixed(1) + " KB");
}
