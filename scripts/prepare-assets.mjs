/* Menyiapkan aset besar yang sengaja tidak disimpan di repo (dijalankan otomatis oleh `npm run dev` / `npm run build`):
   1) runtime ONNX (wasm) disalin dari node_modules/onnxruntime-web → public/ai/
   2) tekstur plastik & kertas dibuat oleh scripts/gen-textures.mjs → public/textures/ (hanya bila belum ada) */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'node_modules', 'onnxruntime-web', 'dist');
const out = path.join(root, 'public', 'ai');
const files = ['ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.asyncify.wasm', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm', 'ort.wasm.min.mjs', 'ort.webgpu.min.mjs'];

if (fs.existsSync(dist)) {
  fs.mkdirSync(out, { recursive: true });
  for (const f of files) {
    const to = path.join(out, f);
    if (!fs.existsSync(to) && fs.existsSync(path.join(dist, f))) fs.copyFileSync(path.join(dist, f), to);
  }
} else console.warn('[prepare-assets] node_modules/onnxruntime-web belum terpasang — jalankan `npm install` dulu.');

const tex = path.join(root, 'public', 'textures');
if (!fs.existsSync(tex) || !fs.readdirSync(tex).some((f) => f.endsWith('.png'))) {
  console.log('[prepare-assets] membuat tekstur…');
  fs.mkdirSync(tex, { recursive: true });
  spawnSync(process.execPath, [path.join(root, 'scripts', 'gen-textures.mjs')], { stdio: 'inherit' });
}
