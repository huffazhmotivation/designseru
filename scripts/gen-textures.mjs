/* Membuat tekstur PNG plastik & kertas yang terlihat seperti foto asli.
   Bukan gambar gradien biasa: tiap piksel dihitung dari peta relief (height map) → normal → pencahayaan
   (pantulan softbox untuk plastik, cahaya samping untuk kertas), jadi kerutan, lipatan, dan serat berperilaku seperti benda nyata.
   Jalankan:  node scripts/gen-textures.mjs [nama ...]   → menulis ke public/textures/
   Tambahkan `--preview` untuk juga membuat pratinjau di atas latar gelap (preview-*.png di folder yang sama dengan skrip). */
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'public', 'textures');
const args = process.argv.slice(2);
const preview = args.includes('--preview');
const only = args.filter((a) => !a.startsWith('--'));

/* ---------------- util ---------------- */
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}
function makeNoise(seed) {
  const r = rng(seed);
  const a = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = a[i & 255];
  const gx = new Float32Array(256),
    gy = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = r() * Math.PI * 2;
    gx[i] = Math.cos(t);
    gy[i] = Math.sin(t);
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x),
      yi = Math.floor(y),
      xf = x - xi,
      yf = y - yi;
    const g = (ix, iy, dx, dy) => {
      const h = perm[(perm[ix & 255] + iy) & 255];
      return gx[h] * dx + gy[h] * dy;
    };
    const u = fade(xf),
      v = fade(yf);
    return mix(mix(g(xi, yi, xf, yf), g(xi + 1, yi, xf - 1, yf), u), mix(g(xi, yi + 1, xf, yf - 1), g(xi + 1, yi + 1, xf - 1, yf - 1), u), v) * 1.4;
  };
}
const fbm = (n, x, y, oct = 5, lac = 2, gain = 0.5) => {
  let s = 0,
    a = 1,
    f = 1,
    norm = 0;
  for (let i = 0; i < oct; i++) {
    s += n(x * f + i * 17.3, y * f - i * 9.1) * a;
    norm += a;
    a *= gain;
    f *= lac;
  }
  return s / norm;
};
/** punggungan tajam di garis nol noise → garis lipatan */
const ridge = (v, sharp = 1.6) => {
  const t = clamp(1 - Math.abs(v) * sharp);
  return t * t;
};

/* ---------------- PNG ---------------- */
const crcT = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcT[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
/** rgba: Uint8ClampedArray w*h*4 (tidak premultiplied) */
function encodePNG(w, h, rgba, opaque = false) {
  const ch = opaque ? 3 : 4;
  const raw = Buffer.alloc((w * ch + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * ch + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4,
        o = y * (w * ch + 1) + 1 + x * ch;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
      if (!opaque) raw[o + 3] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = opaque ? 2 : 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------------- height map → normal ---------------- */
function normals(H, w, h, k) {
  const N = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const xm = Math.max(0, x - 1),
        xp = Math.min(w - 1, x + 1),
        ym = Math.max(0, y - 1),
        yp = Math.min(h - 1, y + 1);
      const dx = (H[y * w + xp] - H[y * w + xm]) * 0.5 * k,
        dy = (H[yp * w + x] - H[ym * w + x]) * 0.5 * k;
      const l = 1 / Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 3;
      N[i] = -dx * l;
      N[i + 1] = -dy * l;
      N[i + 2] = l;
    }
  return N;
}
/** blur kotak 2 lintasan (murah) */
function blur(src, w, h, r, passes = 2) {
  let a = src,
    b = new Float32Array(src.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[y * w + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = s / (2 * r + 1);
        s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += b[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = s / (2 * r + 1);
        s += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
    if (a === src) a = new Float32Array(src);
  }
  return a;
}

/* ---------------- lingkungan studio untuk pantulan plastik ---------------- */
const box = (tx, ty, cx, cy, hw, hh, soft) => smooth(hw + soft, hw - soft, Math.abs(tx - cx)) * smooth(hh + soft, hh - soft, Math.abs(ty - cy));
/** intensitas cahaya dari arah pantul (tx,ty = rx/rz, ry/rz) */
function studioEnv(tx, ty, style = 0) {
  let e = 0.03;
  if (style === 0) {
    e += 1.0 * box(tx, ty, -0.85, -0.75, 0.38, 0.5, 0.16); // jendela besar kiri-atas
    e += 0.8 * box(tx, ty, 0.95, 0.15, 0.09, 0.95, 0.06); // strip kanan
    e += 0.65 * box(tx, ty, 0.1, -1.25, 0.6, 0.07, 0.05); // strip atas
    e += 0.3 * box(tx, ty, 0.75, 0.85, 0.5, 0.22, 0.2); // pantulan lemah kanan-bawah
  } else {
    // jendela berkaca empat (untuk lembar kaca/plastik rata)
    const inWin = box(tx, ty, -0.35, -0.3, 0.75, 0.6, 0.05);
    const mullion = 1 - box(tx, ty, -0.35, -0.3, 0.035, 0.7, 0.02) - box(tx, ty, -0.35, -0.3, 0.85, 0.035, 0.02);
    e += 1.05 * inWin * clamp(mullion, 0.12, 1);
    e += 0.45 * box(tx, ty, 1.2, 0.6, 0.15, 0.9, 0.12);
  }
  return e;
}

/** plastik bening: alpha dari pantulan spekular + sedikit bayangan refraksi di lereng */
function renderPlastic({ w, h, height, slopeK, style = 0, gain = 1, shadowAmt = 0.16, tint = [232, 242, 255], shadowCol = [64, 76, 92], extraAlpha, extraLight }) {
  const H = height;
  const N = normals(H, w, h, slopeK);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const nx = N[i * 3],
      ny = N[i * 3 + 1],
      nz = N[i * 3 + 2];
    // pantulan: R = 2(N·V)N − V, V = (0,0,1)
    const rx = 2 * nz * nx,
      ry = 2 * nz * ny,
      rz = 2 * nz * nz - 1;
    const tx = rx / Math.max(0.2, rz + 1.2), // proyeksi ke ruang lampu (rz+1 mengurangi ledakan di lereng curam)
      ty = ry / Math.max(0.2, rz + 1.2);
    const env = studioEnv(tx * 1.9, ty * 1.9, style);
    const F = 0.05 + 0.95 * Math.pow(1 - nz, 4);
    let spec = clamp((env * (0.55 + 0.45 * F) + F * 0.28) * gain);
    spec = Math.pow(spec, 0.92);
    // bayangan refraksi: sisi lereng yang membelakangi cahaya
    const away = clamp(-(nx * -0.62 + ny * -0.78) * 1.6);
    const slope = clamp(Math.hypot(nx, ny) * 2.2);
    let as = shadowAmt * slope * (0.35 + 0.65 * away);
    let ah = spec;
    if (extraLight) ah = clamp(ah + extraLight[i] * (1 - ah));
    if (extraAlpha) as += extraAlpha[i];
    const a = ah + as * (1 - ah);
    const o = i * 4;
    if (a < 0.002) continue;
    const wr = (tint[0] * ah + shadowCol[0] * as * (1 - ah)) / a;
    const wg = (tint[1] * ah + shadowCol[1] * as * (1 - ah)) / a;
    const wb = (tint[2] * ah + shadowCol[2] * as * (1 - ah)) / a;
    out[o] = wr;
    out[o + 1] = wg;
    out[o + 2] = wb;
    out[o + 3] = clamp(a) * 255;
  }
  return out;
}

/* ---------------- daftar tekstur ---------------- */
const SZ = 800;

const gens = {
  /* plastik bening berkerut (kresek/pembungkus): lipatan tajam banyak arah */
  'plastic-wrap-1': () => {
    const w = SZ,
      h = SZ;
    const n1 = makeNoise(11),
      n2 = makeNoise(23),
      n3 = makeNoise(37),
      n4 = makeNoise(41);
    const H = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const wx = x + fbm(n4, x * 0.004, y * 0.004, 3) * 140,
          wy = y + fbm(n4, x * 0.004 + 9, y * 0.004 + 4, 3) * 140;
        let v = fbm(n1, wx * 0.0042, wy * 0.0042, 4) * 34; // lengkung besar
        v += ridge(fbm(n2, wx * 0.0075, wy * 0.0075, 3), 1.5) * 15 * (0.5 + 0.5 * smooth(-0.3, 0.4, fbm(n1, x * 0.003 + 5, y * 0.003, 2)));
        v += ridge(fbm(n3, wx * 0.017, wy * 0.017, 3), 1.9) * 5.5;
        v += fbm(n2, x * 0.05, y * 0.05, 3) * 1.6; // kerutan halus
        H[y * w + x] = v;
      }
    return { w, h, rgba: renderPlastic({ w, h, height: H, slopeK: 0.75, style: 0, gain: 1.25, shadowAmt: 0.22 }) };
  },

  /* plastik bening kilap: gelombang lebar mulus + beberapa lipatan */
  'plastic-wrap-2': () => {
    const w = SZ,
      h = SZ;
    const n1 = makeNoise(51),
      n2 = makeNoise(63),
      n3 = makeNoise(77);
    const H = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const wx = x + fbm(n3, x * 0.003, y * 0.003, 3) * 200,
          wy = y + fbm(n3, x * 0.003 + 7, y * 0.003 + 2, 3) * 200;
        let v = fbm(n1, wx * 0.0028, wy * 0.0028, 3) * 62;
        v += ridge(fbm(n2, wx * 0.0052, wy * 0.0052, 2), 1.3) * 9;
        v += fbm(n2, x * 0.02, y * 0.02, 2) * 1.1;
        H[y * w + x] = v;
      }
    return { w, h, rgba: renderPlastic({ w, h, height: H, slopeK: 1.5, style: 0, gain: 1.3, shadowAmt: 0.16, tint: [236, 246, 255] }) };
  },

  /* bubble wrap */
  'plastic-bubble-wrap': () => {
    const w = SZ,
      h = SZ;
    const r = 34,
      dx = r * 2 + 3,
      dy = dx * 0.866;
    const n = makeNoise(88);
    const H = new Float32Array(w * h);
    const rim = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const row = Math.round(y / dy);
        let best = 1e9,
          bestD = 0;
        for (let rr = row - 1; rr <= row + 1; rr++) {
          const off = rr & 1 ? dx / 2 : 0;
          const cy = rr * dy;
          const col = Math.round((x - off) / dx);
          for (let cc = col - 1; cc <= col + 1; cc++) {
            const cx = cc * dx + off;
            const d = Math.hypot(x - cx, y - cy);
            if (d < best) {
              best = d;
              bestD = rr * 131 + cc * 17;
            }
          }
        }
        const t = best / r;
        const bub = t < 1 ? Math.sqrt(1 - t * t) : 0;
        const jitter = 1 + (((bestD * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.12;
        H[y * w + x] = bub * r * 0.62 * jitter + fbm(n, x * 0.02, y * 0.02, 2) * 0.7;
        // cincin tepi gelembung: bayangan lipatan film di antara gelembung
        rim[y * w + x] = smooth(0.86, 1.0, t) * smooth(1.12, 0.98, t) * 0.14 + (t >= 1 ? 0.03 : 0);
      }
    return { w, h, rgba: renderPlastic({ w, h, height: H, slopeK: 0.55, style: 0, gain: 1.1, shadowAmt: 0.12, tint: [240, 248, 255], extraAlpha: rim }) };
  },

  /* lembar kaca/plastik kilap: pantulan jendela terdistorsi + goresan + sidik jari */
  'plastic-glare-sheet': () => {
    const w = SZ,
      h = SZ;
    const n1 = makeNoise(101),
      n2 = makeNoise(113),
      n3 = makeNoise(127);
    const H = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let v = fbm(n1, x * 0.0017, y * 0.0017, 2) * 26 + 0.0016 * ((x - 250) ** 2 + (y - 320) ** 2); // lengkung lebar + kemiringan umum menuju jendela
        v += fbm(n2, x * 0.012, y * 0.012, 3) * 0.9; // riak mikro
        H[y * w + x] = v;
      }
    const extra = new Float32Array(w * h);
    // goresan halus
    const r = rng(9);
    const draw = (x0, y0, x1, y1, a) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      for (let t = 0; t <= len; t += 0.7) {
        const x = Math.round(x0 + ((x1 - x0) * t) / len),
          y = Math.round(y0 + ((y1 - y0) * t) / len);
        if (x >= 0 && x < w && y >= 0 && y < h) extra[y * w + x] = Math.max(extra[y * w + x], a * (0.6 + 0.4 * Math.sin(t * 0.3)));
      }
    };
    for (let i = 0; i < 46; i++) {
      const x0 = r() * w,
        y0 = r() * h,
        ang = -0.9 + (r() - 0.5) * 0.7,
        L = 30 + r() * 190;
      draw(x0, y0, x0 + Math.cos(ang) * L, y0 + Math.sin(ang) * L, 0.05 + r() * 0.13);
    }
    // noda sidik jari: bercak lembut
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) extra[y * w + x] += smooth(0.28, 0.75, fbm(n3, x * 0.009, y * 0.009, 4)) * 0.045;
    const rgba = renderPlastic({ w, h, height: H, slopeK: 0.3, style: 1, gain: 0.7, shadowAmt: 0.0, tint: [246, 251, 255], extraLight: extra });
    return { w, h, rgba };
  },

  /* kertas krem */
  'paper-cream': () => paperSheet({ base: [244, 236, 220], fiber: 0.55, seed: 201, tone: 0.045, speck: 0.35 }),
  /* kertas kraft */
  'paper-kraft': () => paperSheet({ base: [184, 143, 98], fiber: 1.0, seed: 211, tone: 0.09, speck: 1.0, dark: true }),

  /* kertas kusut: relief lipatan bertingkat (lekukan besar + punggungan tajam bersilang) disinari cahaya samping */
  'paper-crumpled': () => {
    const w = SZ,
      h = SZ;
    const n1 = makeNoise(311),
      n2 = makeNoise(322),
      n3 = makeNoise(333),
      n4 = makeNoise(344),
      nw = makeNoise(355),
      ng = makeNoise(366);
    const H = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const wx = x + fbm(nw, x * 0.004, y * 0.004, 3) * 70,
          wy = y + fbm(nw, x * 0.004 + 9, y * 0.004 + 4, 3) * 70;
        let v = fbm(n1, wx * 0.0045, wy * 0.0045, 3) * 46;
        v += ridge(fbm(n2, wx * 0.0085, wy * 0.0085, 2), 1.45) * 26;
        v += ridge(fbm(n3, wx * 0.017, wy * 0.017, 2), 1.7) * 11;
        v += ridge(fbm(n4, wx * 0.034, wy * 0.034, 2), 1.9) * 3.4;
        H[y * w + x] = v;
      }
    const N = normals(H, w, h, 0.42);
    const out = new Uint8ClampedArray(w * h * 4);
    const L = (() => {
      const l = Math.hypot(-0.62, -0.5, 0.6);
      return [-0.62 / l, -0.5 / l, 0.6 / l];
    })();
    const lap = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) lap[y * w + x] = H[y * w + x - 1] + H[y * w + x + 1] + H[(y - 1) * w + x] + H[(y + 1) * w + x] - 4 * H[y * w + x];
    const lapB = blur(lap, w, h, 2, 2);
    for (let i = 0; i < w * h; i++) {
      const d = clamp(N[i * 3] * L[0] + N[i * 3 + 1] * L[1] + N[i * 3 + 2] * L[2]);
      let k = 0.42 + 0.72 * Math.pow(d, 1.1);
      k *= 1 - clamp(-lapB[i] * 0.9) * 0.3; // cekungan sedikit gelap
      const x = i % w,
        y = Math.floor(i / w);
      k *= 0.95 + 0.1 * (fbm(ng, x * 0.6, y * 0.6, 2) + 0.5); // butir kertas
      k = clamp(k, 0.3, 1.08);
      const o = i * 4;
      out[o] = clamp(250 * k, 0, 255);
      out[o + 1] = clamp(246 * k, 0, 255);
      out[o + 2] = clamp(236 * k, 0, 255);
      out[o + 3] = 255;
    }
    return { w, h, rgba: out, opaque: true };
  },

  /* kertas sobek: tepi robek berserat putih + bayangan lembut */
  'paper-torn': () => {
    const w = SZ,
      h = Math.round(SZ * 0.75);
    const n = makeNoise(401),
      n2 = makeNoise(402);
    const paper = paperSheet({ base: [243, 236, 222], fiber: 0.6, seed: 403, tone: 0.05, speck: 0.4, w, h, alpha: true });
    const out = new Uint8ClampedArray(w * h * 4);
    const mask = new Float32Array(w * h);
    const fringe = new Float32Array(w * h);
    const m = 46; // margin untuk bayangan
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        // jarak bertanda ke persegi panjang, dirusak noise multi-skala → tepi robek
        const dxr = Math.min(x - m, w - m - x),
          dyr = Math.min(y - m, h - m - y);
        const d = Math.min(dxr, dyr);
        const jag = fbm(n, x * 0.02, y * 0.02, 5) * 34 + fbm(n2, x * 0.11, y * 0.11, 3) * 5 + (Math.random() - 0.5) * 1.5;
        const dd = d + jag;
        mask[y * w + x] = smooth(-0.6, 0.9, dd);
        fringe[y * w + x] = smooth(11, 0, dd) * smooth(-3, 1.2, dd); // pita serat putih di tepi
      }
    const sh = blur(new Float32Array(mask), w, h, 9, 2);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          o = i * 4;
        const sx = clamp(x - 7, 0, w - 1),
          sy = clamp(y - 10, 0, h - 1);
        const shadow = sh[sy * w + sx] * 0.34;
        const pm = mask[i];
        const f = fringe[i] * (0.75 + 0.25 * Math.sin(x * 0.7 + y * 1.3));
        let r0 = paper.rgba[o],
          g0 = paper.rgba[o + 1],
          b0 = paper.rgba[o + 2];
        // serat tepi: lebih putih & sedikit lebih terang
        r0 = mix(r0, 252, f * 0.9);
        g0 = mix(g0, 251, f * 0.9);
        b0 = mix(b0, 248, f * 0.9);
        // kertas di atas bayangan
        const a = pm + shadow * (1 - pm);
        if (a < 0.003) continue;
        out[o] = (r0 * pm + 18 * shadow * (1 - pm)) / a;
        out[o + 1] = (g0 * pm + 16 * shadow * (1 - pm)) / a;
        out[o + 2] = (b0 * pm + 14 * shadow * (1 - pm)) / a;
        out[o + 3] = clamp(a) * 255;
      }
    return { w, h, rgba: out };
  },

  /* kardus: permukaan luar dengan riak gelombang & serat */
  'texture-cardboard': () => {
    const w = SZ,
      h = SZ;
    const n = makeNoise(501),
      n2 = makeNoise(502),
      n3 = makeNoise(503);
    const H = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const wob = fbm(n3, x * 0.004, y * 0.004, 3) * 6;
        const flute = Math.sin(((y + wob) / 13) * Math.PI * 2 + fbm(n, x * 0.01, y * 0.01, 2) * 2.2) * 0.3; // gelombang bergelombang tersembunyi di bawah lapisan
        const fib = fbm(n2, x * 0.25, y * 0.02, 3) * 0.7 + fbm(n2, x * 0.08 + 3, y * 0.55, 2) * 0.5;
        H[y * w + x] = flute * 1.7 + fib * 1.2 + fbm(n, x * 0.03, y * 0.03, 3) * 2.0;
      }
    const N = normals(H, w, h, 1.0);
    const out = new Uint8ClampedArray(w * h * 4);
    const rr = rng(5);
    const L = [-0.5, -0.65, 0.57];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          o = i * 4;
        const d = clamp(N[i * 3] * L[0] + N[i * 3 + 1] * L[1] + N[i * 3 + 2] * L[2]);
        const tone = 0.95 + 0.05 * fbm(n, x * 0.006, y * 0.006, 3) * 2;
        const speck = fbm(n2, x * 0.7, y * 0.7, 2) > 0.36 ? 0.78 : 1;
        const k = (0.72 + 0.4 * d) * tone * speck;
        out[o] = 190 * k;
        out[o + 1] = 146 * k;
        out[o + 2] = 96 * k;
        out[o + 3] = 255;
      }
    // serat panjang tipis
    for (let i = 0; i < 900; i++) {
      const x0 = rr() * w,
        y0 = rr() * h,
        L2 = 8 + rr() * 26,
        a = (rr() - 0.5) * 0.5,
        dark = rr() < 0.5;
      for (let t = 0; t < L2; t++) {
        const x = Math.round(x0 + Math.cos(a) * t),
          y = Math.round(y0 + Math.sin(a) * t);
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const o = (y * w + x) * 4;
        const k = dark ? 0.86 : 1.1;
        out[o] *= k;
        out[o + 1] *= k;
        out[o + 2] *= k;
      }
    }
    return { w, h, rgba: out, opaque: true };
  },
};

/** lembar kertas polos: serat, butir, bercak, dan pencahayaan tipis dari relief serat */
function paperSheet({ base, fiber, seed, tone, speck, dark = false, w = SZ, h = SZ, alpha = false }) {
  const n = makeNoise(seed),
    n2 = makeNoise(seed + 1),
    n3 = makeNoise(seed + 2);
  const H = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // relief: butir halus + serat memanjang acak arah lokal
      const ang = fbm(n3, x * 0.004, y * 0.004, 2) * 5;
      const u = x * Math.cos(ang) + y * Math.sin(ang),
        v = -x * Math.sin(ang) + y * Math.cos(ang);
      H[y * w + x] = fbm(n, x * 0.5, y * 0.5, 2) * 0.9 + fbm(n2, u * 0.05, v * 0.7, 3) * 1.1 * fiber + fbm(n, x * 0.02, y * 0.02, 3) * 1.2;
    }
  const N = normals(H, w, h, 0.9);
  const out = new Uint8ClampedArray(w * h * 4);
  const L = [-0.55, -0.6, 0.58];
  const rr = rng(seed);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x,
        o = i * 4;
      const d = clamp(N[i * 3] * L[0] + N[i * 3 + 1] * L[1] + N[i * 3 + 2] * L[2]);
      const cloud = fbm(n3, x * 0.005 + 20, y * 0.005, 4) * 2; // awan tone
      let k = 0.9 + 0.2 * d + cloud * tone;
      // vignette halus cahaya
      const vx = x / w - 0.5,
        vy = y / h - 0.5;
      k *= 1.03 - (vx * vx + vy * vy) * 0.12;
      const sp = fbm(n2, x * 0.35, y * 0.35, 2) > 0.34 ? 1 - 0.12 * speck : 1;
      k *= sp;
      out[o] = base[0] * k;
      out[o + 1] = base[1] * k;
      out[o + 2] = base[2] * k;
      out[o + 3] = 255;
    }
  // serat panjang lembut
  const nf = Math.round(700 * fiber);
  for (let i = 0; i < nf; i++) {
    let x = rr() * w,
      y = rr() * h,
      a = rr() * Math.PI * 2;
    const len = 10 + rr() * 34,
      light = rr() < (dark ? 0.35 : 0.5),
      amt = (dark ? 0.16 : 0.07) * (0.5 + rr());
    for (let t = 0; t < len; t++) {
      a += (rr() - 0.5) * 0.28;
      x += Math.cos(a);
      y += Math.sin(a);
      const xi = Math.round(x),
        yi = Math.round(y);
      if (xi < 0 || xi >= w || yi < 0 || yi >= h) break;
      const o = (yi * w + xi) * 4;
      const k = light ? 1 + amt : 1 - amt;
      out[o] = clamp(out[o] * k, 0, 255);
      out[o + 1] = clamp(out[o + 1] * k, 0, 255);
      out[o + 2] = clamp(out[o + 2] * k, 0, 255);
    }
  }
  return { w, h, rgba: out, opaque: !alpha };
}

/* ---------------- jalankan ---------------- */
function composite(rgba, w, h, opaque, bg) {
  // pratinjau di atas latar bergradasi + garis agar terlihat transparansi
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const t = y / h;
      let br, bg2, bb;
      if (bg === 'photo') {
        br = mix(24, 214, x / w) * (1 - t * 0.5) + 20;
        bg2 = mix(48, 92, t) + 10;
        bb = mix(96, 150, x / w) + 20;
        // teks kabur sederhana
        if ((y > h * 0.4 && y < h * 0.5 && x > w * 0.12 && x < w * 0.86) || (y > h * 0.56 && y < h * 0.6 && x > w * 0.12 && x < w * 0.6)) {
          br = 250;
          bg2 = 244;
          bb = 232;
        }
      } else {
        br = bg2 = bb = 46;
      }
      const a = opaque ? 1 : rgba[i + 3] / 255;
      out[i] = rgba[i] * a + br * (1 - a);
      out[i + 1] = rgba[i + 1] * a + bg2 * (1 - a);
      out[i + 2] = rgba[i + 2] * a + bb * (1 - a);
      out[i + 3] = 255;
    }
  return out;
}

const names = Object.keys(gens).filter((k) => !only.length || only.includes(k));
for (const name of names) {
  const t0 = Date.now();
  const { w, h, rgba, opaque } = gens[name]();
  fs.writeFileSync(path.join(OUT, name + '.png'), encodePNG(w, h, rgba, !!opaque));
  if (preview) {
    const pv = composite(rgba, w, h, !!opaque, 'photo');
    fs.writeFileSync(path.join(here, 'preview-' + name + '.png'), encodePNG(w, h, pv, true));
  }
  console.log(name, `${w}x${h}`, Date.now() - t0 + 'ms', Math.round(fs.statSync(path.join(OUT, name + '.png')).size / 1024) + 'KB');
}
