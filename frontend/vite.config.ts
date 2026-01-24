import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      'three': path.resolve(__dirname, './node_modules/three'),
    }
  },
  optimizeDeps: {
    exclude: ['three', 'react-globe.gl', 'three-globe'],
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})
