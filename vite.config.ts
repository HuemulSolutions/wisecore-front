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
    // Blinda contra un ambiente de deploy que resuelva dos copias de react.
    dedupe: ['react', 'react-dom'],
  },
  define: {
    // Version de la app embebida en build time, para reportes de error.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    chunkSizeWarningLimit: 1600, // Increase limit to 1.6MB to reduce warnings
    sourcemap: 'hidden', // stacks legibles en prod sin exponer el fuente al público
    // Sin manualChunks a proposito: agrupar a mano react/plate/mdx creaba
    // ciclos entre chunks y React llegaba undefined en produccion.
    // Rollup calcula el grafo solo y el code-splitting por ruta (React.lazy
    // en src/App.tsx) sigue funcionando igual.
  }
})
