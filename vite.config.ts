import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

/**
 * Runtime de React. Tres invariantes de este grupo:
 *
 * 1. Todo el runtime va en UN solo chunk (react/react-dom/scheduler comparten
 *    estado interno).
 * 2. Ese chunk tiene que ser una HOJA del grafo de chunks: no puede importar
 *    ningun otro chunk. react y react-dom son CommonJS, asi que rollup los
 *    envuelve en un `requireReact()` que escribe sobre un objeto
 *    `{ exports: {} }` declarado en el top-level del chunk. Si el chunk entra
 *    en un ciclo, otro chunk puede invocar ese require antes de que la
 *    declaracion se evalue y en produccion explota con
 *    "Cannot set properties of undefined (setting 'Children')".
 * 3. Para agregar un paquete aca: solo se admite si TODAS sus dependencias de
 *    runtime ya estan en esta lista (cierre cerrado = hoja).
 */
const REACT_RUNTIME = [
  'react',
  'react-dom',
  'scheduler',
  'react-is',
  'use-sync-external-store',
  'react-router',
  'react-router-dom',
]

const PLATE = ['platejs', '@platejs/', '@udecode/']
const MDX = ['@mdxeditor/']
const FLOW = ['@xyflow/']
const MEDIA = ['react-player', 'react-tweet', 'react-lite-youtube-embed']

/**
 * Match por segmento de ruta completo `/node_modules/<nombre>/`. Un nombre
 * terminado en '/' matchea todo el scope (ej. '@platejs/').
 *
 * NUNCA usar substrings sueltos tipo `id.includes('/react/')`: tambien matchean
 * @base-ui/react, @lexical/react, @ariakit/react, @xyflow/react y
 * @floating-ui/react-dom. Eso metia ~500 KB de librerias ajenas (y su cierre
 * transitivo) dentro de react-vendor, volviendolo un nodo intermedio del grafo
 * y creando ciclos react-vendor <-> plate / mdx / media.
 */
const owns = (file: string, names: string[]) =>
  names.some((name) =>
    file.includes(name.endsWith('/') ? `/node_modules/${name}` : `/node_modules/${name}/`),
  )

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Defensa en profundidad: no es el fix del bug de chunking, pero cada
    // deploy corre su propio `npm install` y esto blinda contra un ambiente
    // que resuelva dos copias de react.
    dedupe: ['react', 'react-dom'],
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
        // que no se dupliquen entre las páginas que las importan (lazy) y para
        // que sobrevivan en la cache del browser entre deploys.
        //
        // REGLA: los grupos tienen que ser disjuntos y no importarse
        // mutuamente. Si dos chunks manuales se importan en ambos sentidos, el
        // orden de evaluacion de ESM deja bindings sin inicializar en runtime.
        // Rollup NO avisa de ciclos entre chunks manuales: verificar a mano
        // con el script de deteccion de ciclos.
        manualChunks: (id) => {
          const file = id.replace(/\\/g, '/')
          if (!file.includes('/node_modules/')) return
          if (owns(file, PLATE)) return 'plate'
          if (owns(file, MDX)) return 'mdx'
          if (owns(file, FLOW)) return 'flow'
          if (owns(file, MEDIA)) return 'media'
          if (owns(file, REACT_RUNTIME)) return 'react-vendor'
        },
      },
    },
  }
})
