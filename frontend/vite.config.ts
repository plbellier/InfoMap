import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'fix-three-exports',
      resolveId(id) {
        if (id === 'three/webgpu') {
          return 'three/build/three.webgpu.js';
        }
        if (id === 'three/tsl') {
          return 'three/build/three.tsl.js';
        }
      }
    }
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    exclude: ['three']
  }
})
