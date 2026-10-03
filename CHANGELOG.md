# Changelog

## 1.9.3 — Pattern SVG jadi union, bayangan frame dihapus

- **Pattern vektor (SVG) kini diratakan**: hasil yang ditaruh di kanvas tidak lagi berupa tumpukan master/tile/instance, melainkan **satu bentuk gabungan (union)**. Bila motif berwarna banyak, union dilakukan **per warna** (satu bentuk per warna); dengan tint satu warna jadi satu bentuk. Frame hasil tetap memotong sisa pola di tepinya. Penggabungan memakai union berpasangan sehingga cepat (±0,3–0,6 detik untuk pola 3–4 motif).
- **Bayangan tampilan di frame dihapus** (bukan fitur Shadow): bayangan lembut di sekeliling frame ikut tersimpan di cache latar saat menyeret sehingga kadang tertinggal di posisi lama. Alas frame tetap digambar, tanpa bayangan.

## 1.9.2 — Perbaikan garis pada bayangan hasil Warp gambar

- Warp gambar yang punya area semi-transparan (mis. bayangan lantai pada hasil 3D) tidak lagi menampakkan garis-garis jaring: segitiga yang tumpang tindih di sambungan sebelumnya menumpuk alfa dua kali; kini tiap segitiga menimpa (bukan menumpuk) hasil tetangganya.

## 1.9.1 — 3D lebih mulus, sambungan outline tidak lagi runcing

- **3D Maker: relief tidak lagi bercak.** Bagian relief kini ditentukan dari tepi warna yang tegas (daerah terhubung yang dibatasi perubahan warna mendadak), bukan pengelompokan warna. Teks bergradasi emas dengan outline hitam tetap satu bagian emas yang halus (tidak terpecah jadi pita-pita), dan gambar yang tidak memiliki bagian terpisah otomatis rata.
- **Outline sambungan runcing tidak lagi membentuk paku**: batas sambungan teks 2,2 (sudut yang lebih tajam otomatis jadi bevel) di kanvas dan SVG.
- **Lebih cepat**: peta bentuk 3D dibuat lebih ringan (≈30% sisi dibanding 34% sebelumnya, sehingga mesh lebih sedikit), blur dan pelabelan bagian dioptimalkan, pencahayaan permukaan datar dihitung sekali per segitiga, dan perhitungan sorotan dilewati bila tak terlihat. Roket HD dengan relief: ±2,4 detik (sebelumnya ±3,4 detik) di Chrome tanpa GPU.

## 1.9.0 — Warp gambar, outline teks, mask PNG, 3D relief

- **Warp untuk gambar/foto**: alat Warp kini bisa dipakai pada gambar (tunggal, atau bercampur dengan bentuk/grup). Gambar dibagi jaring segitiga yang titiknya dipetakan oleh envelope yang sama; saat menyeret memakai pratinjau resolusi rendah di memori (±20 ms/frame), saat dilepas hasil penuh disimpan sebagai aset baru (efek gambar ikut ter-bake, undo tetap jalan, warp selalu dihitung dari gambar asli sehingga tidak turun kualitas).
- **Outline teks berfungsi penuh**: posisi garis (dalam / tengah / luar), sambungan (runcing / bulat / bevel), ujung garis, dan pola putus-putus/titik kini dihormati pada teks (kanvas dan ekspor SVG). Garis dalam/tengah dihitung dari siluet huruf, jadi kontur yang tumpang tindih pada font variabel tidak lagi memperlihatkan garis di dalam huruf.
- **Mask PNG membaca bentuknya**: bila objek mask berupa gambar (PNG/foto bertransparansi) atau teks, hasilnya dipotong oleh alfa/piksel objek itu (ala alpha mask Figma), bukan kotak bbox-nya. Ikon PNG berlubang membentuk mask sesuai bentuk dan lubangnya. SVG diekspor dengan `<mask>` berbasis alfa.
- **3D Maker lebih detail**: pilihan **Detail warna** (Rata / Timbul / Cekung). Bagian berwarna berbeda di dalam objek (mis. jendela roket, sirip, api) dikelompokkan otomatis dan ditinggikan atau dicekungkan dengan tepi membulat, bukan hanya tepi luarnya yang di-3D-kan. Beberapa objek terpilih tetap digabung menjadi satu 3D. Gambar bergradasi/foto tidak dipecah (otomatis rata). Preview contoh ikut menampilkan relief.
- Kecepatan: pembuatan peta jarak 3D dipercepat (blur tanpa loop dalam), render 2D tidak berubah, uji stres 1.200 objek tetap sama.

## 1.8.0 — 3D Maker baru, Smooth node, ekspor tidak terpotong

- **3D Maker dirombak total**: geometri kini dibentuk dari medan jarak ke tepi (bukan ekstrusi bevel yang rapuh), sehingga tepi tegas dan rata, ujung runcing/huruf sempit tidak lagi rusak, tidak ada bagian hitam, dan bagian tipis hanya menjadi lebih rendah. Warna diambil langsung dari gambar asli dan pencahayaan dikalibrasi supaya muka depan sama persis dengan warna asli (tepi transparan tidak lagi menggelapkan).
- **Pengaturan disederhanakan**: papan Arah hadap (9 panah, atau geser pada contoh), Ketebalan (Tipis/Sedang/Tebal), Tepi (Tegas/Halus/Bulat), Bahan, Kualitas, Bayangan. Ada **preview contoh** (bukan objek asli) yang langsung mengikuti pengaturan.
- **Tidak lagi memproses saat tombol dock diklik**: objek asli baru diproses ketika tombol **Jadikan 3D** ditekan.
- **Smooth di mode Node**: pilih banyak titik (mis. Ctrl+A), muncul popup kecil "Smooth" yang mengubah kontur bergerigi menjadi kurva Bézier mulus dengan titik seminimal mungkin (sudut tajam dipertahankan; bisa di-undo). Lingkaran bergerigi 200 titik → 3 titik, kotak bergerigi 160 titik → 4 titik.
- **Ekspor PNG/SVG tidak lagi memotong garis tepi luar, bayangan, dan blur** (frame yang memotong isinya tetap persis).

## 1.7.0 — 3D Maker, panel kiri, duplikat Alt

- **3D Maker** (dock bawah kanan, di samping Pattern): sekali klik, objek terpilih (bentuk, teks, gambar, grup) diekstrusi jadi 3D berbevel dan dirender HD, lalu otomatis ditaruh di sebelah objek asal sebagai gambar PNG transparan. Panelnya punya kedalaman (otomatis menurut ketebalan objek), bevel, putar, miring, 3 material (Plastik, Clay, Logam), bayangan lantai, resolusi (Cepat 1024 / HD 2048 / Maks 3072) dan tombol unduh PNG; mengubah pengaturan memperbarui gambar 3D yang sama.
  - Mesin sendiri: siluet → kontur (marching squares) → ekstrusi + bevel → **renderer perangkat lunak di Web Worker**. Tidak butuh WebGL, jadi jalan di Chrome yang GPU-nya dimatikan; UI tetap responsif.
  - Waktu (Chrome tanpa GPU): klik → gambar HD siap ±2,4 detik, render HD 2048 ±1,5 detik, Maks 3072 ±3,6 detik. Dimuat lazy, tidak menambah chunk utama.
- **Pattern**: klik di luar kotak dialog (backdrop) menutup panel; kotak dialog sedikit diperkecil sehingga area luar terlihat.
- **Panel kiri**: Guide naik ke bawah Frame; fitur Template disembunyikan sementara (kodenya masih ada).
- **Duplikat Alt-drag responsif**: Alt boleh ditekan sebelum klik, setelah klik, atau di tengah geser (objek asli langsung kembali ke tempatnya dan salinan mengikuti pointer; tidak perlu menunggu gerakan berikutnya). Shift+Alt = duplikat lurus.

## 1.6.0 — Kelompok elemen & brush baru

- **Aset orang tanpa wajah dihapus seluruhnya.** Pemandangan (16) kini masuk kelompok "Ilustrasi warna". Doodle estetik digabung ke kelompok **Doodle** (bersama Doodle & objek). "Anak · berwarna" dan "Anak · mewarnai" digabung menjadi satu kelompok **Anak**.
- **Pilihan brush berupa daftar turun**: klik tombol brush untuk membuka daftar yang bisa digulir, tiap baris memuat pratinjau goresan yang dibuat oleh mesin brush yang sama.
- **6 preset brush baru** dari proyek font terlampir (parameter taper, tekanan, jitter, dan karakter tepi disamakan), dibangun di mesin brush yang ringan (kontur vektor tertutup, dihitung sekali per goresan dan di-cache; stroke 3000 px: 4–26 ms):
  - **Calligraphic**: nib pipih 45°, tebal-tipis mengikuti arah goresan.
  - **Rough**: lebar tetap, tepi kasar, bintik berlubang padat.
  - **Grunge**: kuas kering, tepi tergerus, celah bulu kuas, bintik, ujung tapering.
  - **Oil Brush**: badan halus dengan gelombang sobek lebar dan ujung memudar.
  - **Strong**: goresan tebal, ujung tumpul, satu sisi tenang dan satu sisi sobek bertetesan, lubang jarum.
  - **Tape Brush**: strip lebar tetap, kedua ujung sobek, tiga garis serat putus-putus.
  Memilih preset baru mengisi ukuran, stabilizer, dan tekanan bawaannya; jenis brush juga bisa diganti di panel properti.

## 1.5.0 — Pembulat sudut langsung, crop, pen lurus, ePDF HD

- **Pembulat sudut tanpa pindah alat**: bentuk/path bersudut yang terpilih menampilkan titik bulat di tiap sudut pada alat Pilih dan Node. Seret untuk membulatkan (Alt = satu sudut). Titik hanya muncul pada bentuk yang cukup besar di layar, tidak mengganggu pegangan ubah-ukuran.
- **Objek raksasa tidak lagi "tertelan" frame**: objek hanya masuk frame bila ≥ 25% luasnya berada di frame (dulu cukup titik tengahnya, sehingga objek raksasa yang hanya ±5% menyentuh frame ikut terpotong).
- **Klik/marquee di area kosong** tidak lagi memilih objek di dalam frame yang sebagian besar sudah terpotong (di luar frame); hitung marquee kini memakai bagian yang terlihat saja.
- **Pen + Shift**: titik baru dikunci ke kelipatan 45° (horizontal, vertikal, diagonal) dari titik sebelumnya, termasuk garis putus-putus pratinjau.
- **Crop gambar**: ikon crop di panel properti (di samping kanan Rotasi). Mode crop menampilkan gambar penuh, bingkai dengan 8 pegangan, garis bagi tiga, pilihan rasio (Bebas, Asli, 1:1, 4:5, 3:2, 16:9, 9:16), Reset/Batal/Terapkan (Enter/Esc/klik ganda). Aset asli disimpan sehingga crop bisa dibuka lagi dan dilebarkan; mendukung gambar yang diputar dan dicerminkan; undo penuh.
- **ePDF HD**: sisi terpanjang ≈ 3000 px (desain kecil diperbesar sampai 3×, desain raksasa dibatasi 4000 px) dengan JPEG 86%, tetap terkompres. Contoh frame 1080×1350 → halaman 2400×3000 px, 51 KB untuk isi sederhana.

## 1.4.0 — Teks, font favorit, tempel, impor

- **Teks di atas shape** tidak lagi otomatis menjadi teks-pada-path. Alat Teks punya tombol **"Teks pada path"** (mati secara bawaan); hanya saat dinyalakan, klik garis/bentuk membuat teks yang mengikuti garisnya. Menu klik kanan "Teks pada path" tetap ada.
- **Font favorit**: bintang di ujung kanan tiap nama font (pink bila difavoritkan, tersimpan di browser). Di samping kotak cari ada bintang filter yang menampilkan hanya font favorit, seperti di Affinity.
- **Tempel di sini** (klik kanan): isi clipboard ditaruh dengan pusatnya tepat di titik klik kanan, masuk ke frame yang ada di titik itu.
- **Tempel lintas frame**: menyalin objek di frame A lalu menempel dengan frame B (atau objek di dalamnya) terpilih menaruhnya di x,y yang sama relatif terhadap frame B. Menempel ke frame yang sama tetap bergeser sedikit.
- **Impor gambar selalu ukuran asli**, termasuk saat mengimpor banyak file sekaligus (dulu dikecilkan ke 600 px). Uji: 6 foto 4000–5000 px diimpor 196 ms, pan/zoom 2–4 ms.

## 1.3.0 — Aset ilustrasi baru & label frame

- **Label nama frame** lebih besar: font 16 px (tadinya 15), tinggi 32, dan saat zoom-out mengecil lebih pelan (akar zoom, minimum 70%). Pada zoom 50% huruf 11 px, tadinya 7,5 px.
- **Orang tanpa wajah** (31 ilustrasi, kategori baru "Orang & pemandangan"): bayi (duduk, merangkak, main bola), balita, anak (berlari, melompat, membaca, ke sekolah, layang-layang, berhijab), remaja, dewasa (ayah, ibu berhijab, menggendong bayi, bekerja, membaca) dan lansia (kakek bertongkat, nenek berbunga, nenek berhijab, kakek bersarung), plus adegan keluarga, kakek-cucu, ibu-anak membaca, dan nenek memangku bayi. Beragam warna kulit dan rambut. Gaya datar bulat ala buku anak, dibangun dari kerangka pose (`elements/people.ts`) sehingga mudah menambah pose.
- **Pemandangan** (16 adegan 400×260): bukit, pantai, hutan pinus, malam berbintang, sawah & gunung, kota, desa, taman bermain, bawah laut, danau, gurun, kebun bunga, salju, kamar tidur, ruang kelas, senja.
- **Doodle estetik** (30, kategori baru): kopi, tunas daun, ranting, kupu-kupu, bulan & bintang, mata mistis, telapak tangan bintang, gugus kilau, kaset, piringan hitam, polaroid, pita, ceri, petir, matahari berwajah, lilin, bulu, tanaman pot, pelangi, kristal, dan lain-lain. Monokrom, bisa diwarnai ulang.
- Semua elemen masuk ke kanvas sebagai vektor yang bisa diedit. Pemandangan ditaruh 560 px, orang 280 px. Data berada di chunk `elements` yang dimuat lazy, jadi muat awal tidak berubah.

## 1.2.1 — Mockup apparel dihapus

- Mockup kaos & tote bag (foto asli) dihapus beserta asetnya, grup "Apparel", latar "Foto asli", shader & jalur 2D khusus apparel, dan pembangun 3D lama kaos/tote. Mockup perangkat, cetak & kemasan tidak berubah.
- Aset lama disimpan di `.backup_cleanup/apparel/` (tidak ikut repo) bila ingin dikembalikan.

## 1.2.0 — Pekerjaan berat dipindah dari thread UI

Diukur di Chrome mode software (tanpa GPU) dengan PerformanceObserver `longtask`. Long task = UI beku lebih dari 50 ms.

| Aksi | 1.1.0 | 1.2.0 |
|---|---|---|
| Geser slider blur gambar (semua jenis) | long task 50–360 ms | **0 long task**, hasil penuh 0,19–0,29 dtk setelah dilepas |
| Buka mockup berlapis (mug, box, HP, laptop) | 0,9–3,1 dtk, long task s.d. 1,9 dtk | pratinjau 0,14–0,45 dtk, **0 long task** (build produksi) |
| Ganti sudut mockup | ±1 dtk UI beku | 0 long task |
| Buka tab Mockup (16 thumbnail) | 15 long task | 1 long task |
| Drag kartu kaca | 21–29 ms/frame | median 20 ms (p90 26 ms) |
| Mockup kaos/totebag tanpa GPU | warp desain 81 ms | 44 ms |

- **Efek gambar di Web Worker** (`engine/imagefx.worker.ts` + `imagefx-core.ts`, OffscreenCanvas):
  - Gambar sumber dikirim sekali per gambar, lalu disimpan di Worker.
  - Antrean "yang terbaru menang" per node; selama hasil baru dihitung, hasil terakhir tetap tampil (tidak berkedip).
  - Hasil identik piksel dengan thread utama (diuji untuk gaussian, gerak, zoom, putar, DoF, halftone, grade).
  - Cadangan otomatis ke thread utama bila Worker/OffscreenCanvas tidak tersedia.
- **Komposit mockup berlapis di Web Worker** (`mockup/cpu.ts` + `cpu.worker.ts`):
  - Worker men-dekode lapisan sendiri, lalu menghitung warna, desain, dan bayangan. Thread UI hanya menerima bitmap.
  - Tampilan progresif: versi kecil tampil dulu, lalu dipertajam.
  - Unduh/taruh di kanvas menunggu hasil kualitas penuh (`ready()`).
  - Hasil identik piksel dengan jalur lama. Jalur thread utama tetap ada sebagai cadangan.
- **Metadata slot mockup** untuk opsi bawaan (`mockup/slotmeta.json` + `slotwrap.ts`): membuka mockup tidak lagi memuat three.js (±600 ms evaluasi di perangkat lama). Opsi geometri lain tetap memakai pembangun model, dan mode dev memberi peringatan bila tabel tidak cocok dengan `models.ts`.
- **Kaca**:
  - Mask & medan tepi di-cache selama drag/slider.
  - Capture + blur digabung jadi satu langkah di resolusi turun.
  - Kanvas kerja dipakai ulang, sehingga tidak ada lonjakan GC. Hasil saat diam identik (selisih rata-rata 0,1/255).
- **Tekstur desain mockup**: skala 0,7–1,5× memakai bilinear (5× lebih ringan, visual sama). Warp apparel 2D hanya membaca potongan sumber per segitiga.
- **Ekspor PNG/JPG**: status "Mengekspor…" tampil sebelum render, jadi ekspor besar (mis. 8000×6000 ±0,7 dtk) terlihat berjalan.

Terukur & sudah cepat: ekspor SVG 1.200 layer 40 ms, PDF 0,2 dtk, 30 halaman (ganti halaman 14–29 ms, heap 39 MB), gambar 8K (taruh 11 ms, pan 3–5 ms, zoom 3–4 ms, drag 1–2 ms).

## 1.1.0 — Cepat juga di perangkat tanpa akselerasi GPU

Diuji di Chrome dengan Canvas, Compositing dan WebGL "Software only" (GPU lama yang di-blocklist Chrome, mis. MacBook 2012). Di kondisi ini jalur WebGL tidak tersedia, jadi semua efek berjalan di CPU. Perilaku dan hasil tetap sama.

| Aksi | Sebelum | Sesudah |
|---|---|---|
| Blur Gerak / Zoom / Putar (gambar 1600 px) | 1.400–2.300 ms | 230–270 ms (draf saat slider: 27–45 ms) |
| Blur DoF | 400–1.160 ms | 185–260 ms (draf 43–65 ms) |
| Glassmorphism: geser slider | 60–550 ms/frame | ±24 ms/frame |
| Glassmorphism: drag objek kaca | 50–78 ms/frame | 21–29 ms/frame |
| Slider blur/efek | kanvas menunggu jeda 90 ms | ikut tiap frame |
| Mockup (mug/HP/box): ganti warna | 450–660 ms | 60–85 ms saat digeser, hasil akhir identik piksel |
| Mockup apparel: ganti warna | ±90 ms | 55–70 ms |
| Shape Builder / grid: pan & zoom (ribuan sel) | ±225 ms/frame | 7 ms (kotak), 15 ms (hex) |
| Chunk JS utama | 900 kB | 634 kB (gzip 327 → 220 kB) |

- **Blur Gerak/Zoom/Putar** memakai *recursive doubling*: 6 pass, bukan 36–64 kali gambar ulang, dengan rata-rata premultiplied yang tepat.
- **DoF**: per-piksel diganti compositing gradient mask. Level blur dikomposit di resolusi turun, hanya lapisan tajam di resolusi penuh.
- **Gaussian besar** diolah di resolusi turun lalu di-upscale (identik secara visual).
- **Glassmorphism**: saat drag/slider diproses di resolusi pratinjau, lalu kualitas penuh begitu dilepas. Area raksasa juga dibatasi.
- **Mockup berlapis**:
  - Ganti warna tidak lagi memuat ulang sudut, membangun geometri, atau membaca ulang tekstur desain.
  - Konversi warna lapisan foto dihitung sekali.
  - Saat warna digeser cepat, pratinjau setengah resolusi, lalu dipertajam 250 ms setelah berhenti.
- **Grid** kotak & segitiga digambar sebagai garis lurus. Hex/poligon memakai path yang di-cache selama pan. Sel Shape Builder disimpan sebagai satu Path2D.
- **Lazy load tambahan**:
  - Panel Hapus BG / Trace / Upscale beserta mesin AI-nya, panel Blur/Shadow/Efek, dan pustaka elemen SVG (143 kB) kini dimuat saat dibuka.
  - Aksi AI di menu klik kanan & command palette memuat modulnya saat dipakai.

### Perbaikan
- **Spasi horizontal/vertikal (panel properti)** sekarang seperti Figma. Seleksi berbentuk grid (beberapa baris & kolom) dirapikan menjadi grid: kolom sejajar kiri, baris sejajar atas. Jarak yang diketik berlaku per sumbu, dan sumbu lain mempertahankan jaraknya. Sebelumnya semua objek dirantai di satu sumbu sehingga jadi diagonal.

## 1.0.0 — Optimasi produksi

Tanpa perubahan fitur atau perilaku; file proyek, autosave dan riwayat versi lama tetap terbaca.

### Muat awal
| | Sebelum | Sesudah |
|---|---|---|
| JS awal (minified) | 1.960 kB | 1.313 kB (dibagi 4 chunk ter-cache) |
| JS awal (gzip) | 551 kB | 458 kB |
| Chunk aplikasi utama | 1.960 kB | 900 kB |

- Set ikon Lucide lengkap (1.700+ ikon, 620 kB) dipindah ke chunk lazy, dimuat saat browser senggang atau saat panel Ikon dibuka. Ikon yang dipakai template tetap dibundel, jadi template tetap sinkron.
- Mockup Studio, Pattern Studio, Logo grid dan dialog Pintasan dimuat saat pertama dibuka (`React.lazy`).
- Vendor dipisah ke `vendor-react`, `vendor-paper` dan `vendor-ui-icons` supaya tetap ter-cache antar rilis.

### Autosave & versi (proyek dengan banyak gambar)
- Autosave tidak lagi menyalin seluruh dokumen beserta semua gambar base64 setiap kali ada edit. Gambar disimpan sekali per aset di IndexedDB (`designseru:img:<id>`) dan proyek hanya menyimpan rujukannya.
  Uji 12 foto (29 MB): tiap simpan menulis 17 kB, bukan 29 MB (sebelumnya ~240 ms structured clone di main thread per simpan).
- Simpan berjalan berurutan, dan aset lama baru dihapus setelah proyek baru tersimpan, jadi aman kalau tab tertutup di tengah simpan.
- Riwayat versi: tiap versi disimpan di kuncinya sendiri, ditambah indeks kecil. Sebelumnya, setiap simpan versi menulis ulang sampai 40 dokumen lengkap. Versi dari sesi lalu baru dimuat saat dipulihkan, jadi memori saat start lebih hemat. Format lama dimigrasi otomatis sekali.

### Render (dari iterasi sebelumnya, dipertahankan)
- View cache dengan overscan dan refresh berkala untuk zoom/pan, mipmap gambar saat interaksi, sprite cache
- Blur dan glassmorphism lewat GPU (`ctx.filter` / shader WebGL2) dengan fallback CPU
- Warp (prep cache dan draft density), shape builder (layer inkremental), pattern, mockup dikomposit di WebGL2

### Pembersihan
- Halaman debug/benchmark (`b*.html`, `bperf-scn.js`), gambar uji `public/__test`, modul yang tidak dipakai (`lib/support.ts`, `lib/graphicmatte.ts`) dan instrumentasi debug dihapus
- `@types/*` dipindah ke devDependencies; runtime ONNX & tekstur dibuat otomatis oleh `scripts/prepare-assets.mjs`, tidak disimpan di repo

### Hasil uji (Chrome headless, SwiftShader, 1.200 layer)
render penuh 22 ms · hover ter-cache 0,5 ms · langkah zoom 0,8 ms · seleksi 60 layer 3,3 ms · langkah drag 7,3 ms ·
hit-test 0,2 ms · marquee 4,9 ms · undo/redo 0,9/0,7 ms · duplikat 9 ms · salin 8 ms · ganti halaman 0,3 ms · heap 33 MB (sebelumnya 42 MB)

Regresi yang diuji: autosave lalu reload (node dan gambar utuh), migrasi versi format lama, pulihkan versi lalu undo,
Mockup/Pattern/Logo grid/Pintasan yang dimuat lazy, drop ikon dari pustaka, `tsc` dan `vite build` bersih, build produksi tanpa error konsol.
