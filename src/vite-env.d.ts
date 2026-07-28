/// <reference types="vite/client" />

/** Version de package.json embebida en build time (vite.config.ts define). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SHOW_IN_CONSOLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
