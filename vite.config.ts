import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  // three dimuat lazy (mockup 3D): daftarkan di sini agar Vite menyiapkannya sejak server dinyalakan,
  // bukan saat pertama kali dipakai (yang membuat impor dinamis gagal sampai halaman dimuat ulang)
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // vendor dipisah supaya ter-cache lintas rilis (kode aplikasi berubah, vendor tidak)
        manualChunks: mode === 'single' ? undefined : (id) => {
          // data SVG pustaka elemen (dimuat lazy); meta/kit tetap di chunk utama
          if (/\/src\/lib\/elements\/(?!meta|kit)/.test(id)) return 'elements';
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|scheduler|zustand|use-sync-external-store)\//.test(id)) return 'vendor-react';
          if (id.includes('node_modules/paper/')) return 'vendor-paper';
          if (id.includes('node_modules/lucide-react/')) return 'vendor-ui-icons';
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/controls/OrbitControls.js', 'three/examples/jsm/environments/RoomEnvironment.js', 'three/examples/jsm/geometries/RoundedBoxGeometry.js'],
  },
}));
