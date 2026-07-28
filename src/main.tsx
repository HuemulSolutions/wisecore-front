import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';

import '@/i18n'
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { AppErrorBoundary } from '@/components/error-boundary/app-error-boundary'
import { ErrorDetailsDialog } from '@/components/error-boundary/error-details-dialog'
import './index.css'                       // Tailwind (globals)
import '@mdxeditor/editor/style.css'       // CSS del MDXEditor
import './mdx-editor.css'
import App from './App.tsx'

// Suprimir errores de extensiones del navegador
window.addEventListener('error', (event) => {
  if (
    event.error?.message?.includes('message channel closed') ||
    event.error?.message?.includes('listener indicated an asynchronous response') ||
    event.message?.includes('runtime.lastError') ||
    event.message?.includes('message channel closed') ||
    event.message?.includes('listener indicated an asynchronous response')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  // No suprimir nada más: en particular, event.filename === '' o
  // event.filename?.includes('extension') se suprimían antes sin loguear,
  // lo que tapaba errores legítimos re-lanzados por React (p.ej. el
  // NotFoundError de removeChild que rompe la app al cambiar de org).
  logger.warn('[window.error]', event.message, event.filename);
});

// Suprimir promesas rechazadas de extensiones
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || '';
  if (
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('listener indicated an asynchronous response') ||
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('Could not establish connection')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Suprimir errores específicos de runtime.lastError
if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
  try {
    const chrome = (window as any).chrome;
    const originalAddListener = chrome.runtime.onMessage?.addListener;
    if (originalAddListener) {
      chrome.runtime.onMessage.addListener = function(...args: any[]) {
        try {
          return originalAddListener.apply(this, args);
        } catch {
          // Silently ignore chrome extension errors
          return false;
        }
      };
    }
  } catch {
    // Ignore any errors in chrome runtime access
  }
}

// Suprimir logs de console.error relacionados con extensiones
// eslint-disable-next-line no-console
const originalConsoleError = console.error;
// eslint-disable-next-line no-console
console.error = function(...args) {
  const message = args.join(' ');
  if (
    message.includes('runtime.lastError') ||
    message.includes('message channel closed') ||
    message.includes('listener indicated an asynchronous response') ||
    message.includes('Extension context invalidated')
  ) {
    return; // No mostrar estos errores
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster richColors />
      <ErrorDetailsDialog />
      <AppErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
