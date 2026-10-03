# DesignSeru

Editor desain vektor di browser — React 18 + TypeScript + Vite + Zustand, render Canvas 2D dengan jalur cepat WebGL2.

## Fitur utama
- Vektor: pen, pencil (auto close-path), brush, node/bezier (Cmd+drag segmen = lengkung), boolean, warp, shape builder, gradien isi & garis tepi
- Teks: campuran font, ketebalan & warna dalam satu teks; font lokal
- Gambar: hapus background (AI di browser), trace ke vektor, upscale, blur & glassmorphism (GPU)
- Import PDF (pilih halaman), SVG, banyak file sekaligus (tertata otomatis)
- Pustaka elemen 600+: pemandangan, ilustrasi anak (berwarna & mewarnai), doodle & doodle estetik; 10 jenis vector brush
- 3D Maker: objek apa pun jadi gambar 3D HD lewat tombol Jadikan 3D, dengan preview contoh (renderer perangkat lunak, tanpa WebGL)
- Warp juga untuk gambar/foto; outline teks lengkap; mask PNG berbentuk alfa; 3D relief timbul/cekung
- Smooth (mode Node): pilih banyak titik → kontur bergerigi jadi kurva mulus bertitik sedikit
- Pattern maker (gambar atau vektor editable), mockup foto (perangkat, cetakan, kemasan), logo grid builder, guideline per frame
- Pintasan keyboard yang bisa diatur (menu logo → Pintasan keyboard), multi-halaman, riwayat versi, autosave

## Menjalankan
Butuh Node.js 18+.

```bash
npm install                  # juga menyiapkan runtime ONNX & tekstur (scripts/prepare-assets.mjs)
cp .env.example .env.local   # opsional: isi VITE_PEXELS_API_KEY untuk tab Foto
npm run dev                  # http://localhost:5173
```

Produksi:

```bash
npm run build                # tsc --noEmit + vite build → dist/
npm run preview              # cek hasil build secara lokal
```

`dist/` adalah situs statis — bisa di-deploy ke Vercel, Netlify, Cloudflare Pages atau GitHub Pages
(build command `npm run build`, output `dist`).

## Struktur
```
src/engine   render kanvas, geometri, hit-test, efek (blur/kaca/WebGL), teks, impor SVG
src/tools    interaksi alat (select, pen, node, warp, shape builder), keymap
src/lib      fitur (pattern, mockup, AI, PDF, ekspor, persist/autosave, pustaka)
src/ui       panel & dialog React
public/      ikon/brand, mockup (foto & lapisan), model AI kecil
scripts/     prepare-assets.mjs (otomatis), gen-textures.mjs
tools/       pipeline pembuatan aset mockup (opsional, lihat tools/README.md)
```

## Catatan
- Model AI besar (BiRefNet, Real-ESRGAN, SAM) diunduh dari Hugging Face saat pertama dipakai; U²-Net-p ikut di `public/ai`.
- `.env.local` tidak ikut repo (lihat `.gitignore`).
- Riwayat optimasi: [CHANGELOG.md](CHANGELOG.md).
