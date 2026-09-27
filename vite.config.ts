import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
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
  test: {
    // Ver `ia context/testing-guide.md` y `docs/sso-frontend.md`.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    // Con un worker por archivo la máquina se satura y los tests con user-event pasan de 5 s.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // `src/config.ts` lee VITE_API_URL al importar; los handlers msw se arman con ese valor.
    env: { VITE_API_URL: 'http://api.test/api/v1' },
    // Dependencias que importan CSS (Node no sabe cargarlo fuera de Vite): se inlinean para que
    // Vite las transforme igual que en el bundle.
    server: { deps: { inline: ['react-tweet'] } },
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
