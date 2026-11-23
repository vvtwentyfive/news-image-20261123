// THE DAILY WORLD — news-image-20261123
// "Sum up 23 November's world news in one image"
// Node 22+ stdlib only. Draws a 1024x1024 newspaper front page procedurally
// (bitmap font + vector shapes) and writes /output/entry.png.
// No network, no randomness, no clock: two runs are byte-identical.
//
// 42 stories, all happened or first reported on Monday 23 November 2026.
// Sources: Reuters, AP, AFP, Arab News, Dawn, Jagran Josh, Observer Voice,
// The Daily Jagran, SportzCraazy, The True Story, SalonVision, Bizen-Art,
// Zot.news, Medianet, MeteoWeb, CDS News, Sportradar, HPE IR, The Star.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- font: 5x7
// Each glyph: 7 rows, 5 bits (bit 4 = leftmost pixel). Uppercase rendering:
// input is upper-cased before drawing; lowercase maps to the same glyphs.
const FONT: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  '"': [0b01010, 0b01010, 0b01010, 0b00000, 0b00000, 0b00000, 0b00000],
  '#': [0b01010, 0b01010, 0b11111, 0b01010, 0b11111, 0b01010, 0b01010],
  '$': [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  '%': [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  '&': [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  '(': [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ')': [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  '*': [0b00000, 0b00100, 0b10101, 0b01110, 0b10101, 0b00100, 0b00000],
  '+': [0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0b00000],
  ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b00100, 0b01000],
  '-': [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  '/': [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ':': [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  ';': [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b00100, 0b01000],
  '<': [0b00010, 0b00100, 0b01000, 0b10000, 0b01000, 0b00100, 0b00010],
  '=': [0b00000, 0b00000, 0b11111, 0b00000, 0b11111, 0b00000, 0b00000],
  '>': [0b01000, 0b00100, 0b00010, 0b00001, 0b00010, 0b00100, 0b01000],
  '?': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b00000, 0b00100],
  '@': [0b01110, 0b10001, 0b10111, 0b10101, 0b10110, 0b10000, 0b01110],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '[': [0b01110, 0b01000, 0b01000, 0b01000, 0b01000, 0b01000, 0b01110],
  '\\': [0b10000, 0b01000, 0b01000, 0b00100, 0b00010, 0b00010, 0b00001],
  ']': [0b01110, 0b00010, 0b00010, 0b00010, 0b00010, 0b00010, 0b01110],
  '^': [0b00100, 0b01010, 0b10001, 0b00000, 0b00000, 0b00000, 0b00000],
  _: [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b11111],
  '`': [0b00100, 0b00100, 0b00010, 0b00000, 0b00000, 0b00000, 0b00000],
  '{': [0b00110, 0b01000, 0b01000, 0b01110, 0b01000, 0b01000, 0b00110],
  '|': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  '}': [0b01100, 0b00010, 0b00010, 0b01110, 0b00010, 0b00010, 0b01100],
  '~': [0b00000, 0b00000, 0b01001, 0b10110, 0b00000, 0b00000, 0b00000],
};

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const buf = Buffer.alloc(W * H * 3);
type RGB = [number, number, number];

const CREAM: RGB = [246, 239, 220];
const INK: RGB = [26, 26, 26];
const RED: RGB = [164, 30, 34];
const BLUE: RGB = [31, 78, 121];
const GOLD: RGB = [176, 141, 63];
const GREY: RGB = [110, 105, 90];
const LIGHT: RGB = [232, 222, 196];
const WHITE: RGB = [255, 255, 255];
const SKY: RGB = [178, 214, 235];
const SEA: RGB = [64, 120, 165];
const GREEN: RGB = [46, 125, 70];
const SAND: RGB = [222, 196, 138];
const ORANGE: RGB = [216, 110, 40];
const NAVY: RGB = [18, 38, 66];
const TEAL: RGB = [38, 130, 120];

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) px(xx, yy, c);
  }
}
function hline(x: number, y: number, w: number, c: RGB, t = 1): void {
  for (let i = 0; i < t; i++) fillRect(x, y + i, w, 1, c);
}
function vline(x: number, y: number, h: number, c: RGB, t = 1): void {
  for (let i = 0; i < t; i++) fillRect(x + i, y, 1, h, c);
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
  const dx = x1 - x0, dy = y1 - y0;
  const n = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + (dx * i) / n), y = Math.round(y0 + (dy * i) / n);
    fillRect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
  }
}
function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -w; x <= w; x++) px(cx + x, cy + y, c);
  }
}
function circle(cx: number, cy: number, r: number, c: RGB, t = 1): void {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    fillRect(Math.round(cx + r * Math.cos(rad)) - Math.floor(t / 2),
      Math.round(cy + r * Math.sin(rad)) - Math.floor(t / 2), t, t, c);
  }
}
// Even-odd scanline polygon fill. pts: [x,y][]
function fillPoly(pts: number[][], c: RGB): void {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.ceil(xs[i]); x <= Math.floor(xs[i + 1]); x++) px(x, y, c);
    }
  }
}
function polyLine(pts: number[][], c: RGB, t = 1): void {
  for (let i = 0; i + 1 < pts.length; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, t);
}

// ---------------------------------------------------------------- text
function glyph(ch: string): number[] {
  return FONT[ch.toUpperCase()] ?? FONT['?'];
}
function textWidth(s: string, scale: number): number {
  return s.length === 0 ? 0 : s.length * 6 * scale - scale;
}
function drawText(s: string, x: number, y: number, scale: number, c: RGB, bold = false): void {
  let cx = Math.round(x);
  const top = Math.round(y);
  for (const ch of s.toUpperCase()) {
    const g = glyph(ch);
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if ((g[r] >> (4 - col)) & 1) {
          fillRect(cx + col * scale, top + r * scale, scale, scale, c);
          if (bold) fillRect(cx + col * scale + 1, top + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}
function drawTextC(s: string, cx: number, y: number, scale: number, c: RGB, bold = false): void {
  drawText(s, cx - textWidth(s, scale) / 2, y, scale, c, bold);
}
function drawTextR(s: string, rx: number, y: number, scale: number, c: RGB, bold = false): void {
  drawText(s, rx - textWidth(s, scale), y, scale, c, bold);
}
// Greedy word wrap; returns lines that fit maxW. Hard-splits over-long words.
function wrap(s: string, maxW: number, scale: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    if (textWidth(trial, scale) <= maxW) { cur = trial; continue; }
    if (cur) lines.push(cur);
    if (textWidth(w, scale) > maxW) {
      let part = '';
      for (const ch of w) {
        if (textWidth(part + ch, scale) > maxW) { lines.push(part); part = ch; }
        else part += ch;
      }
      cur = part;
    } else cur = w;
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawLines(lines: string[], x: number, y: number, scale: number, c: RGB, lh: number, bold = false): void {
  lines.forEach((ln, i) => drawText(ln, x, y + i * lh, scale, c, bold));
}

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0; // filter: None
    buf.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- data
// 42 stories, Monday 23 November 2026. Region counts: N. America 6, Latin
// America 3, Europe 8, Middle East 6, Africa 2, Asia 12, Oceania 5 = 42.
type Story = { n: number; region: string; head: string; src: string; art: string };
const HEROES: Story[] = [
  { n: 1, region: 'EUROPE', head: 'COP31 TALKS COLLAPSE WITH NO DEAL', src: 'REUTERS', art: 'cop' },
  { n: 2, region: 'LATIN AMERICA', head: "'EL CHAPO ISIDRO' CAPTURED IN SINALOA", src: 'AP', art: 'cuffs' },
  { n: 3, region: 'N. AMERICA', head: 'AI WIPEOUT: TAIWAN -17% IN A WEEK', src: 'REUTERS', art: 'chart' },
];
const GRID: Story[] = [
  { n: 4, region: 'N. AMERICA', head: 'NATO MEETS AFTER MISSILES HIT POLAND', src: 'AP', art: 'nato' },
  { n: 5, region: 'EUROPE', head: 'RUSSIAN SHIP STILL BURNING OFF FINLAND', src: 'REUTERS', art: 'ship' },
  { n: 6, region: 'EUROPE', head: 'KYIV STRIKE: 14 MISSING IN RUBBLE', src: 'REUTERS', art: 'drone' },
  { n: 7, region: 'ASIA', head: 'JAVA FIRE: 50 STILL MISSING', src: 'DAWN', art: 'fire' },
  { n: 8, region: 'ASIA', head: 'NEPAL PM SHAH IN DELHI TALKS', src: 'OBSERVER VOICE', art: 'talks' },
  { n: 9, region: 'ASIA', head: 'SEOUL MINISTER QUITS OVER AI CHEATING', src: 'REUTERS', art: 'cap' },
  { n: 10, region: 'ASIA', head: 'MYANMAR SLAMS ASEAN RULING', src: 'JAGRAN', art: 'asean' },
  { n: 11, region: 'MIDDLE EAST', head: 'HOUTHI MISSILE DOWN OVER SAUDI', src: 'AFP', art: 'missile' },
  { n: 12, region: 'MIDDLE EAST', head: 'TANKER INCIDENT IN GULF OF OMAN', src: 'ARAB NEWS', art: 'tanker' },
  { n: 13, region: 'OCEANIA', head: "ALBANESE: COP31 SHOWS 'HARD TIMES'", src: 'AFP', art: 'parliament' },
];
const INDEX: Story[] = [
  { n: 14, region: 'N. AMERICA', head: 'US INTEL CHIEF: PUTIN "NOT A FRIEND"', src: 'THE TRUE STORY', art: '' },
  { n: 15, region: 'N. AMERICA', head: 'HPE HOLDS Q4 CALL; AI SERVERS IN FOCUS', src: 'HPE IR', art: '' },
  { n: 16, region: 'N. AMERICA', head: 'MONDAY NIGHT: COMMANDERS HOST BENGALS', src: 'SPORTRADAR', art: '' },
  { n: 17, region: 'N. AMERICA', head: 'BESSENT WANTS ANSWERS ON NVIDIA CHIPS', src: 'ARAB NEWS', art: '' },
  { n: 18, region: 'LATIN AMERICA', head: 'PERU QUAKE 6.7; NO CASUALTIES REPORTED', src: 'AP', art: '' },
  { n: 19, region: 'LATIN AMERICA', head: 'HAITI-EL SALVADOR PRISON DEAL SIGNED', src: 'THE STAR', art: '' },
  { n: 20, region: 'EUROPE', head: 'THOUSANDS MARCH IN LISBON OVER PRICES', src: 'JAGRAN', art: '' },
  { n: 21, region: 'EUROPE', head: 'ITALY: 140 KM/H GALES THREATEN FERRIES', src: 'METEOWEB', art: '' },
  { n: 22, region: 'EUROPE', head: "CENTRICA BOSS FEARS SOARING ENERGY BILLS", src: 'CDS NEWS', art: '' },
  { n: 23, region: 'EUROPE', head: 'UN: KILLER-ROBOT RULES TO BE SET BY 2028', src: 'SALONVISION', art: '' },
  { n: 24, region: 'EUROPE', head: 'POLAND: RAPPER "TWICE TARGETED" BY RUSSIA', src: 'AP', art: '' },
  { n: 25, region: 'MIDDLE EAST', head: 'HORMUZ CONFLICT ENTERS "CRUCIAL STAGE"', src: 'OBSERVER VOICE', art: '' },
  { n: 26, region: 'MIDDLE EAST', head: 'BRITON SWIMS LENGTH OF HORMUZ STRAIT', src: 'THE TRUE STORY', art: '' },
  { n: 27, region: 'MIDDLE EAST', head: 'BAHRAIN: TWO HURT IN IRANIAN STRIKES', src: 'BIZEN-ART', art: '' },
  { n: 28, region: 'MIDDLE EAST', head: 'SAUDI DOWNS DRONE AND MISSILE', src: 'BIZEN-ART', art: '' },
  { n: 29, region: 'AFRICA', head: 'S. SUDAN ATTACK LEAVES 24 CIVILIANS DEAD', src: 'AFP', art: '' },
  { n: 30, region: 'AFRICA', head: 'WHO: FIGHTING HITS CONGO EBOLA RESPONSE', src: 'ARAB NEWS', art: '' },
  { n: 31, region: 'ASIA', head: 'TATA STEEL IN RS 28,000-CRORE DEAL', src: 'OBSERVER VOICE', art: '' },
  { n: 32, region: 'ASIA', head: 'JEE MAIN 2027 REGISTRATION CLOSES TODAY', src: 'JAGRAN', art: '' },
  { n: 33, region: 'ASIA', head: 'NEET PG: 10,105 MEDICAL SEATS BLOCKED', src: 'JAGRAN', art: '' },
  { n: 34, region: 'ASIA', head: 'NVIDIA ROW: HUANG "CLOSE TO CHIP RING"', src: 'THE DAILY JAGRAN', art: '' },
  { n: 35, region: 'ASIA', head: 'INDIA-EU TRADE PACT SET FOR DEC 16', src: 'JAGRAN', art: '' },
  { n: 36, region: 'ASIA', head: 'OIL AND GAS IMPORT BILL UP 60% IN OCT', src: 'JAGRAN', art: '' },
  { n: 37, region: 'ASIA', head: 'KOTA PILGRIM CRASH KILLS NINE', src: 'THE DAILY JAGRAN', art: '' },
  { n: 38, region: 'ASIA', head: 'GOOGLE GIVES $5M TO IIT KHARAGPUR AI', src: 'JAGRAN', art: '' },
  { n: 39, region: 'OCEANIA', head: "70% OF AUSSIE MPS SAY POLITICS HURT HEALTH", src: 'ZOT.NEWS', art: '' },
  { n: 40, region: 'OCEANIA', head: 'SCIENCE PEAKS URGE SENATE ON R&D TAX', src: 'MEDIANET', art: '' },
  { n: 41, region: 'OCEANIA', head: 'WELLINGTON TEST HEADS TO FINAL DAY', src: 'SPORTZCRAAZY', art: '' },
  { n: 42, region: 'OCEANIA', head: 'AUSTRALIA REBUKES US OVER AUKUS REMARK', src: 'BIZEN-ART', art: '' },
];
const KPIS: { big: string; label: string }[] = [
  { big: '-17%', label: 'TAIWAN SHARES, ONE WEEK' },
  { big: '24', label: 'DEAD IN S. SUDAN ATTACK' },
  { big: '50', label: 'MISSING IN JAVA FACTORY FIRE' },
  { big: '14', label: 'MISSING AFTER KYIV STRIKE' },
  { big: '28,000', label: 'RS CRORE: TATA-APL DEAL' },
  { big: '70%', label: "AUSSIE MPS SAY POLITICS HURT HEALTH" },
];
const REGIONS: { name: string; count: number }[] = [
  { name: 'N. AMERICA', count: 6 },
  { name: 'LATIN AMERICA', count: 3 },
  { name: 'EUROPE', count: 8 },
  { name: 'MIDDLE EAST', count: 6 },
  { name: 'AFRICA', count: 2 },
  { name: 'ASIA', count: 12 },
  { name: 'OCEANIA', count: 5 },
];
// Map pins 1-13 (lon, lat) -> hero + grid stories.
const PINS: { n: number; lon: number; lat: number; label: string }[] = [
  { n: 1, lon: 36.9, lat: 30.7, label: 'ANTALYA: COP31 FAILS' },
  { n: 2, lon: -107.4, lat: 25.8, label: 'SINALOA: CARTEL BOSS HELD' },
  { n: 3, lon: 121.5, lat: 25.0, label: 'TAIPEI: SHARES -17%' },
  { n: 4, lon: 4.35, lat: 50.85, label: 'BRUSSELS: NATO MEETS' },
  { n: 5, lon: 21.0, lat: 60.0, label: 'FINLAND: SHIP BURNS' },
  { n: 6, lon: 30.5, lat: 50.45, label: 'KYIV: 14 MISSING' },
  { n: 7, lon: 106.8, lat: -6.2, label: 'JAVA: FACTORY FIRE' },
  { n: 8, lon: 77.2, lat: 28.6, label: 'DELHI: NEPAL TALKS' },
  { n: 9, lon: 127.0, lat: 37.5, label: 'SEOUL: MINISTER QUITS' },
  { n: 10, lon: 96.2, lat: 19.75, label: 'MYANMAR: ASEAN ROW' },
  { n: 11, lon: 46.7, lat: 24.6, label: 'RIYADH: MISSILE DOWN' },
  { n: 12, lon: 59.0, lat: 25.0, label: 'GULF OF OMAN: TANKER' },
  { n: 13, lon: 149.1, lat: -35.3, label: 'CANBERRA: COP31 ROW' },
];
const DATE_CHECK =
  'DATE CHECK - LEFT OUT ON PURPOSE: LIVERPOOL 4-0 MAN UTD (22 NOV) - VERSTAPPEN WINS LAS VEGAS GP (22 NOV) - INDIA 720/9 DECLARED (22 NOV) - DEMOCRATS 258 HOUSE SEATS (22 NOV) - DELTA 1,000+ FLIGHTS DELAYED (22 NOV) - ICE ARRESTS AT SEA-TAC (21 NOV) - FBI DATABASE BREACH (21 NOV) - UK-EU RESET DEAL (20 NOV) - UN SUDAN DRONE TOLL (17 NOV) - AMAZON LEO LAUNCH NOT YET FLOWN.';

// ---------------------------------------------------------------- art
function badge(x: number, y: number, n: number): void {
  fillCircle(x + 11, y + 11, 11, RED);
  circle(x + 11, y + 11, 11, WHITE, 1);
  drawTextC(String(n), x + 11, y + 7, 1, WHITE, true);
}
// Hero illustrations, each inside (x, y, w, h).
function artHero(kind: string, x: number, y: number, w: number, h: number): void {
  if (kind === 'cop') {
    fillRect(x, y, w, h, SKY);
    // sun
    fillCircle(x + w - 42, y + 26, 16, GOLD);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      line(x + w - 42 + Math.cos(a) * 20, y + 26 + Math.sin(a) * 20,
        x + w - 42 + Math.cos(a) * 27, y + 26 + Math.sin(a) * 27, GOLD, 2);
    }
    // globe
    const cx = x + 78, cy = y + 58, r = 40;
    fillCircle(cx, cy, r, SEA);
    fillPoly([[cx - 30, cy - 18], [cx - 8, cy - 26], [cx + 6, cy - 10], [cx - 6, cy + 2], [cx - 26, cy + 2]], GREEN);
    fillPoly([[cx + 12, cy + 6], [cx + 30, cy + 2], [cx + 34, cy + 18], [cx + 16, cy + 26], [cx + 6, cy + 16]], GREEN);
    circle(cx, cy, r, INK, 2);
    line(cx - r, cy, cx + r, cy, INK, 1);
    // red crack across the globe
    polyLine([[cx - 34, cy - 30], [cx - 12, cy - 8], [cx - 22, cy + 8], [cx + 4, cy + 22], [cx + 26, cy + 34]], RED, 3);
    // factory
    fillRect(x + w - 96, y + h - 34, 52, 34, INK);
    fillRect(x + w - 92, y + h - 52, 8, 18, INK);
    fillRect(x + w - 78, y + h - 46, 8, 12, INK);
    fillCircle(x + w - 88, y + h - 58, 3, GREY);
    fillCircle(x + w - 80, y + h - 64, 4, GREY);
    // NO DEAL stamp
    fillRect(x + 8, y + h - 26, 96, 20, RED);
    drawText('NO DEAL', x + 14, y + h - 21, 1, WHITE, true);
  } else if (kind === 'cuffs') {
    fillRect(x, y, w, h, SAND);
    // mountains
    fillPoly([[x, y + h], [x + 60, y + 30], [x + 120, y + h]], [150, 110, 70]);
    fillPoly([[x + 90, y + h], [x + 170, y + 42], [x + 250, y + h]], [120, 88, 55]);
    // sun
    fillCircle(x + w - 40, y + 24, 14, ORANGE);
    // handcuffs
    const cy = y + 62;
    circle(x + 120, cy, 20, INK, 4);
    circle(x + 188, cy, 20, INK, 4);
    line(x + 140, cy - 8, x + 168, cy + 8, INK, 4);
    line(x + 140, cy + 8, x + 168, cy - 8, INK, 4);
    fillCircle(x + 120, cy, 6, GOLD);
    fillCircle(x + 188, cy, 6, GOLD);
    // badge star
    fillPoly([[x + 30, y + 78], [x + 36, y + 92], [x + 51, y + 92], [x + 39, y + 101], [x + 44, y + 115], [x + 30, y + 107], [x + 16, y + 115], [x + 21, y + 101], [x + 9, y + 92], [x + 24, y + 92]], GOLD);
    fillRect(x + 8, y + h - 20, 148, 14, CREAM);
    drawText('11 DEAD IN GUNFIGHT', x + 12, y + h - 17, 1, RED, true);
  } else {
    // chart: AI wipeout
    fillRect(x, y, w, h, NAVY);
    // chip
    fillRect(x + 30, y + 26, 54, 54, INK);
    fillRect(x + 40, y + 36, 34, 34, TEAL);
    drawText('AI', x + 48, y + 44, 2, WHITE, true);
    for (let i = 0; i < 4; i++) {
      fillRect(x + 22, y + 32 + i * 12, 8, 3, GOLD);
      fillRect(x + 84, y + 32 + i * 12, 8, 3, GOLD);
    }
    // crashing line
    polyLine([[x + 110, y + 22], [x + 150, y + 34], [x + 185, y + 30], [x + 225, y + 58], [x + 265, y + 66], [x + 300, y + 96]], RED, 4);
    // arrow head
    fillPoly([[x + 300, y + 96], [x + 282, y + 88], [x + 292, y + 108]], RED);
    fillRect(x + 126, y + 74, 178, 18, NAVY);
    drawText('-17% IN A WEEK', x + 130, y + 78, 2, RED, true);
    fillRect(x + 126, y + 94, 178, 12, NAVY);
    drawText('KOSPI -3% MONDAY', x + 130, y + 98, 1, WHITE, true);
  }
}
// Small grid illustrations, inside (x, y, w, h) where h ~30.
function artMini(kind: string, x: number, y: number, w: number, h: number): void {
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === 'nato') {
    fillRect(x, y, w, h, BLUE);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6 - Math.PI / 2;
      fillCircle(Math.round(cx + Math.cos(a) * 11), Math.round(cy + Math.sin(a) * 11), 2, WHITE);
    }
    fillCircle(cx, cy, 3, GOLD);
  } else if (kind === 'ship') {
    fillRect(x, y, w, h, SEA);
    fillRect(x + 8, y + 14, 46, 8, INK);
    fillRect(x + 18, y + 6, 14, 8, INK);
    fillCircle(x + 46, y + 8, 4, ORANGE);
    fillCircle(x + 52, y + 4, 3, RED);
    line(x, y + 24, x + w, y + 24, WHITE, 1);
    line(x + 6, y + 27, x + w - 6, y + 27, WHITE, 1);
  } else if (kind === 'drone') {
    fillRect(x, y, w, h, SKY);
    fillRect(x + 8, y + 18, 26, 10, GREY);
    fillRect(x + 12, y + 10, 4, 8, INK);
    line(x + 4, y + 12, x + 38, y + 12, INK, 2);
    fillCircle(x + 4, y + 12, 3, INK);
    fillCircle(x + 38, y + 12, 3, INK);
    fillRect(x + 46, y + 8, 10, 20, INK);
    fillCircle(x + 51, y + 4, 3, RED);
  } else if (kind === 'fire') {
    fillRect(x, y, w, h, [250, 220, 170]);
    fillPoly([[cx - 16, y + h - 4], [cx - 10, y + 8], [cx - 2, y + 16], [cx + 4, y + 4], [cx + 12, y + 14], [cx + 16, y + h - 4]], ORANGE);
    fillPoly([[cx - 8, y + h - 4], [cx - 4, y + 16], [cx + 2, y + 20], [cx + 8, y + h - 4]], RED);
    fillRect(x, y + h - 4, w, 4, INK);
  } else if (kind === 'talks') {
    fillRect(x, y, w, h, CREAM);
    fillPoly([[x + 8, y + 4], [x + 30, y + 4], [x + 30, y + 16], [x + 8, y + 16]], [255, 153, 51]);
    fillPoly([[x + 8, y + 16], [x + 30, y + 16], [x + 30, y + 26], [x + 8, y + 26]], [19, 136, 8]);
    fillPoly([[x + 34, y + 4], [x + 56, y + 4], [x + 56, y + 16], [x + 34, y + 16]], [220, 20, 60]);
    fillPoly([[x + 34, y + 16], [x + 56, y + 16], [x + 56, y + 26], [x + 34, y + 26]], [0, 56, 147]);
    line(x + 30, y + 4, x + 30, y + 28, INK, 1);
    line(x + 34, y + 4, x + 34, y + 28, INK, 1);
  } else if (kind === 'cap') {
    fillRect(x, y, w, h, NAVY);
    fillPoly([[cx - 22, cy - 4], [cx, cy - 12], [cx + 22, cy - 4], [cx, cy + 4]], INK);
    fillPoly([[cx - 10, cy - 2], [cx - 10, cy + 8], [cx + 10, cy + 8], [cx + 10, cy - 2]], GOLD);
    line(cx + 22, cy - 4, cx + 22, cy + 8, GOLD, 2);
    fillCircle(cx + 22, cy + 10, 2, GOLD);
  } else if (kind === 'asean') {
    fillRect(x, y, w, h, [200, 40, 40]);
    fillRect(x, y + 10, w, 10, WHITE);
    fillRect(x, y + 20, w, 10, [0, 40, 120]);
    fillCircle(cx, cy, 6, GOLD);
  } else if (kind === 'missile') {
    fillRect(x, y, w, h, SKY);
    fillPoly([[x + 30, y + 8], [x + 44, y + 14], [x + 30, y + 20], [x + 26, y + 14]], INK);
    line(x + 26, y + 14, x + 8, y + 18, GREY, 2);
    fillCircle(x + 8, y + 18, 2, ORANGE);
    fillCircle(x + 14, y + 20, 2, RED);
    fillRect(x + 48, y + 24, 10, 4, GREEN);
  } else if (kind === 'tanker') {
    fillRect(x, y, w, h, SEA);
    fillRect(x + 6, y + 12, 48, 10, [180, 60, 40]);
    fillRect(x + 14, y + 4, 12, 8, WHITE);
    fillRect(x + 32, y + 6, 10, 6, WHITE);
    line(x, y + 24, x + w, y + 24, WHITE, 1);
    line(x + 8, y + 27, x + w - 8, y + 27, WHITE, 1);
  } else {
    // parliament
    fillRect(x, y, w, h, LIGHT);
    fillPoly([[cx - 20, y + 4], [cx, y - 2], [cx + 20, y + 4]], INK);
    fillRect(cx - 20, y + 4, 40, 4, INK);
    for (let i = 0; i < 4; i++) fillRect(cx - 18 + i * 11, y + 8, 4, 18, INK);
    fillRect(cx - 22, y + 26, 44, 3, INK);
  }
}

// ---------------------------------------------------------------- world map
// Equirectangular: lon -170..190 -> x0..x1 ; lat 75..-55 -> y0..y1
function lonlat(lon: number, lat: number, x0: number, x1: number, y0: number, y1: number): [number, number] {
  return [x0 + ((lon + 170) / 360) * (x1 - x0), y0 + ((75 - lat) / 130) * (y1 - y0)];
}
const CONTINENTS: number[][][] = [
  // North America
  [[-168, 66], [-140, 70], [-125, 72], [-110, 73], [-95, 80], [-85, 70], [-75, 62], [-65, 60], [-55, 52], [-60, 45], [-70, 42], [-75, 35], [-80, 26], [-85, 20], [-90, 15], [-95, 18], [-105, 20], [-115, 28], [-125, 40], [-125, 49], [-140, 60], [-155, 58], [-165, 60]],
  // South America
  [[-80, 10], [-75, 5], [-60, 0], [-50, 0], [-35, -8], [-40, -20], [-48, -28], [-58, -38], [-65, -45], [-70, -54], [-73, -40], [-75, -20], [-80, -5]],
  // Africa
  [[-17, 15], [-10, 30], [0, 35], [10, 37], [20, 32], [30, 31], [35, 28], [40, 15], [43, 11], [48, 10], [51, 0], [40, -10], [35, -20], [30, -30], [20, -35], [15, -30], [12, -18], [9, -5], [9, 4], [-8, 5], [-17, 12]],
  // Eurasia
  [[-10, 36], [-9, 43], [-2, 48], [0, 50], [5, 53], [8, 57], [18, 56], [21, 55], [24, 59], [30, 60], [30, 70], [40, 68], [55, 69], [70, 72], [90, 75], [110, 76], [130, 72], [150, 70], [170, 66], [178, 65], [170, 60], [162, 56], [158, 50], [142, 45], [135, 42], [127, 40], [122, 38], [120, 32], [110, 20], [105, 10], [100, 8], [95, 15], [90, 22], [80, 20], [75, 8], [72, 20], [65, 25], [58, 25], [52, 26], [48, 29], [43, 12], [40, 15], [35, 28], [30, 36], [26, 38], [22, 37], [18, 40], [12, 44], [3, 43], [-2, 37], [-9, 37]],
  // Australia
  [[113, -22], [114, -30], [115, -35], [120, -34], [129, -32], [132, -32], [137, -35], [140, -38], [145, -38], [150, -37], [153, -32], [153, -27], [150, -23], [146, -19], [142, -15], [142, -11], [137, -12], [135, -15], [132, -12], [130, -13], [126, -14], [122, -17], [118, -20]],
];
function drawMap(x0: number, y0: number, x1: number, y1: number): void {
  fillRect(x0, y0, x1 - x0, y1 - y0, [214, 232, 240]);
  // graticule
  for (let lon = -150; lon <= 180; lon += 30) {
    const [gx] = lonlat(lon, 0, x0, x1, y0, y1);
    vline(Math.round(gx), y0, y1 - y0, [190, 205, 215], 1);
  }
  for (let lat = 60; lat >= -45; lat -= 30) {
    const [, gy] = lonlat(0, lat, x0, x1, y0, y1);
    hline(x0, Math.round(gy), x1 - x0, [190, 205, 215], 1);
  }
  for (const cont of CONTINENTS) {
    fillPoly(cont.map(([lo, la]) => lonlat(lo, la, x0, x1, y0, y1)), [214, 196, 150]);
    const pts = cont.map(([lo, la]) => lonlat(lo, la, x0, x1, y0, y1));
    polyLine([...pts, pts[0]], [120, 105, 70], 1);
  }
  // UK, Japan, NZ blobs
  const [ukx, uky] = lonlat(-2, 54, x0, x1, y0, y1);
  fillRect(Math.round(ukx) - 3, Math.round(uky) - 5, 6, 10, [214, 196, 150]);
  const [jpx, jpy] = lonlat(139, 38, x0, x1, y0, y1);
  fillRect(Math.round(jpx) - 2, Math.round(jpy) - 7, 5, 14, [214, 196, 150]);
  const [nzx, nzy] = lonlat(172, -41, x0, x1, y0, y1);
  fillRect(Math.round(nzx) - 2, Math.round(nzy) - 6, 4, 12, [214, 196, 150]);
  drawText('ATLANTIC', x0 + 150, y0 + 62, 1, [120, 140, 155]);
  drawText('PACIFIC', x0 + 22, y0 + 62, 1, [120, 140, 155]);
  drawText('INDIAN OCEAN', x0 + 420, y0 + 88, 1, [120, 140, 155]);
  // pins
  for (const p of PINS) {
    const [pxx, pyy] = lonlat(p.lon, p.lat, x0, x1, y0, y1);
    fillCircle(Math.round(pxx), Math.round(pyy), 8, RED);
    circle(Math.round(pxx), Math.round(pyy), 8, WHITE, 1);
    drawTextC(String(p.n), Math.round(pxx), Math.round(pyy) - 4, 1, WHITE, true);
  }
}

// ---------------------------------------------------------------- layout
function frame(): void {
  fillRect(0, 0, W, H, CREAM);
  fillRect(0, 0, W, 4, INK);
  fillRect(0, H - 4, W, 4, INK);
  fillRect(0, 0, 4, H, INK);
  fillRect(W - 4, 0, 4, H, INK);
  hline(10, 10, W - 20, INK, 1);
  hline(10, H - 11, W - 20, INK, 1);
  vline(10, 10, H - 20, INK, 1);
  vline(W - 11, 10, H - 20, INK, 1);
}

function main(): void {
  frame();
  const MX = 12, MW = 1000; // content margins
  // ---- kicker
  drawTextC('THE WORLD IN ONE PAGE  |  MONDAY 23 NOVEMBER 2026  |  42 STORIES  |  7 REGIONS  |  ALL SOURCED',
    W / 2, 16, 1, INK, true);
  // ---- masthead
  drawText('EST. 2026', MX + 2, 46, 1, GREY);
  drawTextR('ONE DAY, ONE PAGE', MX + MW - 2, 46, 1, GREY);
  drawTextC('THE DAILY WORLD', W / 2, 26, 8, INK, true);
  hline(MX, 88, MW, INK, 3);
  // ---- giant date headline (readable at 300px)
  drawTextC('MONDAY 23 NOVEMBER 2026', W / 2, 96, 6, RED, true);
  hline(MX, 142, MW, RED, 3);
  drawTextC('THE NEWS OF THE DAY, IN ONE PICTURE - EVERY STORY NAMED AND SOURCED',
    W / 2, 150, 1, INK);
  // ---- KPI strip: 6 big numbers
  const kw = 160, kg = 8;
  KPIS.forEach((k, i) => {
    const x = MX + i * (kw + kg);
    fillRect(x, 164, kw, 62, LIGHT);
    hline(x, 164, kw, INK, 2);
    hline(x, 224, kw, INK, 2);
    vline(x, 164, 62, INK, 1);
    vline(x + kw - 1, 164, 62, INK, 1);
    drawTextC(k.big, x + kw / 2, 170, 4, RED, true);
    const lab = wrap(k.label, kw - 10, 1);
    drawLines(lab, x + 5, 202, 1, INK, 9);
  });
  // ---- region bar
  drawText('7 REGIONS:', MX, 236, 1, INK, true);
  const rw = 128, rg = 2;
  REGIONS.forEach((r, i) => {
    const x = MX + 76 + i * (rw + rg);
    fillRect(x, 232, rw, 22, i % 2 ? LIGHT : WHITE);
    hline(x, 232, rw, INK, 1);
    hline(x, 253, rw, INK, 1);
    drawTextC(`${r.name} ${r.count}`, x + rw / 2, 238, 1, INK, true);
  });
  // ---- heroes
  let y = 262;
  drawText('TOP STORIES', MX, y, 1, RED, true);
  drawTextR('ILLUSTRATED', MX + MW, y, 1, GREY);
  hline(MX, y + 10, MW, INK, 2);
  y += 16;
  const hw = 326, hg = 11;
  HEROES.forEach((s, i) => {
    const x = MX + i * (hw + hg);
    artHero(s.art, x, y, hw, 104);
    hline(x, y, hw, INK, 2);
    hline(x, y + 104, hw, INK, 1);
    vline(x, y, 104, INK, 1);
    vline(x + hw - 1, y, 104, INK, 1);
    badge(x + 4, y + 4, s.n);
    const lines = wrap(s.head, hw - 8, 2);
    drawLines(lines, x + 4, y + 110, 2, INK, 15, true);
    drawText(`${s.n}  |  ${s.region}  |  ${s.src}`, x + 4, y + 110 + lines.length * 15 + 2, 1, GREY);
  });
  y += 104 + 2 * 15 + 18;
  hline(MX, y, MW, INK, 2);
  y += 8;
  // ---- grid: 10 illustrated items, 5 x 2
  drawText('AROUND THE WORLD - 10 MORE', MX, y, 1, RED, true);
  drawTextR('EACH WITH ITS OWN PICTURE', MX + MW, y, 1, GREY);
  hline(MX, y + 10, MW, INK, 2);
  y += 16;
  const cw = 196, cg = 5, ch = 72;
  GRID.forEach((s, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = MX + col * (cw + cg), yy = y + row * (ch + 6);
    artMini(s.art, x, yy, cw, 30);
    hline(x, yy, cw, INK, 1);
    hline(x, yy + 30, cw, INK, 1);
    const lines = wrap(s.head, cw - 4, 1).slice(0, 2);
    drawLines(lines, x + 2, yy + 34, 1, INK, 10, true);
    drawText(`${s.n}  ${s.region}  |  ${s.src}`, x + 2, yy + 56, 1, GREY);
  });
  y += 2 * ch + 6 + 6;
  hline(MX, y, MW, INK, 2);
  y += 8;
  // ---- index: 29 more stories, numbered 14-42, two columns
  drawText('THE DAY IN FULL - 29 MORE STORIES', MX, y, 1, RED, true);
  drawTextR('NUMBERED 14 TO 42', MX + MW, y, 1, GREY);
  hline(MX, y + 10, MW, INK, 2);
  y += 16;
  const left = INDEX.slice(0, 15), right = INDEX.slice(15);
  left.forEach((s, i) => {
    drawText(`${s.n}. ${s.head} - ${s.src}`, MX, y + i * 11, 1, INK);
  });
  right.forEach((s, i) => {
    drawText(`${s.n}. ${s.head} - ${s.src}`, MX + 500, y + i * 11, 1, INK);
  });
  y += 15 * 11 + 6;
  hline(MX, y, MW, INK, 2);
  y += 8;
  // ---- world map + pins 1-13
  drawText('WHERE IT HAPPENED - 13 PINS ON THE MAP', MX, y, 1, RED, true);
  drawTextR('PINS 1-13 ARE THE HERO AND GRID STORIES', MX + MW, y, 1, GREY);
  hline(MX, y + 10, MW, INK, 2);
  y += 16;
  const mapY0 = y, mapY1 = y + 106;
  drawMap(MX, mapY0, MX + 648, mapY1);
  // pin key, two columns
  drawText('PIN KEY', MX + 660, mapY0, 1, INK, true);
  const keyL = PINS.slice(0, 7), keyR = PINS.slice(7);
  keyL.forEach((p, i) => drawText(`${p.n} ${p.label}`, MX + 660, mapY0 + 12 + i * 13, 1, INK));
  keyR.forEach((p, i) => drawText(`${p.n} ${p.label}`, MX + 830, mapY0 + 12 + i * 13, 1, INK));
  y = mapY1 + 8;
  hline(MX, y, MW, INK, 2);
  y += 6;
  // ---- DATE CHECK box
  const dcLines = wrap(DATE_CHECK, MW - 20, 1);
  const dcH = dcLines.length * 9 + 12;
  fillRect(MX, y, MW, dcH, LIGHT);
  for (let t = 0; t < 2; t++) { hline(MX, y + t, MW, RED, 1); hline(MX, y + dcH - 1 - t, MW, RED, 1); }
  vline(MX, y, dcH, RED, 2);
  vline(MX + MW - 2, y, dcH, RED, 2);
  drawLines(dcLines, MX + 10, y + 6, 1, INK, 9);
  y += dcH + 6;
  // ---- footer attestation
  drawTextC('EVERY STORY HAPPENED, OR WAS FIRST REPORTED, ON MONDAY 23 NOVEMBER 2026.',
    W / 2, y, 1, INK, true);
  y += 10;
  drawTextC('THE DAILY WORLD - MONDAY 23 NOVEMBER 2026 - 42 STORIES - 7 REGIONS',
    W / 2, y, 1, GREY);

  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'entry.png'), encodePNG());
}
main();
