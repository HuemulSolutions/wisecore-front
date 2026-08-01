import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Version de la app embebida en build time, para reportes de error.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    chunkSizeWarningLimit: 1600, // Increase limit to 1.6MB to reduce warnings
    sourcemap: 'hidden', // stacks legibles en prod sin exponer el fuente al público
    rollupOptions: {
      output: {
        // Agrupa las librerías pesadas compartidas en chunks propios para
        // que no se dupliquen entre las páginas que las importan (lazy).
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return
          if (id.includes('platejs') || id.includes('@udecode/cn')) return 'plate'
          if (id.includes('@mdxeditor/editor')) return 'mdx'
          if (id.includes('@xyflow/react')) return 'flow'
          if (id.includes('react-player') || id.includes('react-tweet') || id.includes('react-lite-youtube-embed')) return 'media'
          if (id.includes('react-router-dom') || id.includes('/react-dom/') || id.includes('/react/')) return 'react-vendor'
        },
      },
    },
  }
})
