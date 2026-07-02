import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/** Production build — Silver Legacy survey only (no Nexo marketplace) */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'gathering-public',
  build: {
    outDir: 'deploy/silver-legacy-site',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'gathering/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
})
