import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrganizationProvider } from './contexts/organization-context.ts';
import { Toaster } from "@/components/ui/sonner"
import { ApiError } from '@/types/api-error';
import { handleApiError } from '@/lib/error-utils';
import './index.css'                       // Tailwind (globals)
import '@mdxeditor/editor/style.css'       // CSS del MDXEditor
import './mdx-editor.css'   
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimizaciones para reducir re-fetches innecesarios
      staleTime: 2 * 60 * 1000, // 2 minutos - datos considerados frescos
      gcTime: 5 * 60 * 1000, // 5 minutos - tiempo en cache
      refetchOnWindowFocus: false, // No re-fetch al enfocar ventana
      refetchOnMount: false, // No re-fetch al montar si hay datos frescos
      retry: (failureCount, error: unknown) => {
        // No reintentar errores del cliente (4xx)
        if (ApiError.isApiError(error) && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        // Fallback para errores no-ApiError con status
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // No reintentar mutaciones por defecto
      onError: (error) => handleApiError(error), // Manejo global de errores
    },
  },
});

// Suprimir errores de extensiones del navegador
window.addEventListener('error', (event) => {
  if (
    event.error?.message?.includes('message channel closed') ||
    event.error?.message?.includes('listener indicated an asynchronous response') ||
    event.message?.includes('runtime.lastError') ||
    event.message?.includes('message channel closed') ||
    event.message?.includes('listener indicated an asynchronous response') ||
    event.filename?.includes('extension') ||
    event.filename === ''
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
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
const originalConsoleError = console.error;
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
      <OrganizationProvider>
      <Toaster richColors />
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </OrganizationProvider>
    </QueryClientProvider>
  </StrictMode>,
)
