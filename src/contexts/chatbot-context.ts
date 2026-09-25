import { createContext, useContext, useEffect } from 'react';
import type { ChatbotContextValue, ChatView, UseChatbotScreenContextOptions } from '@/types/chatbot';
export type { ChatView, ChatbotContextValue }

// Contexto separado del componente ChatbotProvider (ver chatbot-provider.tsx) a
// propósito: un archivo que exporta un componente Y hooks no puede ser
// auto-aceptado por react-refresh (ver warning `react-refresh/only-export-components`).
// Eso hacía que un hot update re-evaluara este módulo y createContext(...)
// devolviera un objeto de contexto nuevo mientras el <ChatbotProvider> ya
// montado seguía escribiendo en el viejo — el consumidor leía undefined y
// useChatbotContext (estricto) tiraba "must be used within a ChatbotProvider".
export const ChatbotContext = createContext<ChatbotContextValue | undefined>(undefined);

export function useChatbotContext() {
  const context = useContext(ChatbotContext);

  if (context === undefined) {
    throw new Error('useChatbotContext must be used within a ChatbotProvider');
  }

  return context;
}

export function useOptionalChatbotContext() {
  return useContext(ChatbotContext);
}

export function useChatbotScreenContext({
  sourceKey,
  references,
  enabled = true,
  priority = 0,
}: UseChatbotScreenContextOptions) {
  // Opcional a propósito: si por algún desync de HMR (o un futuro call site)
  // no hay <ChatbotProvider> arriba, esto debe degradar a no-op en vez de
  // tirar la app entera (a diferencia de useChatbotContext, que sí exige provider).
  const context = useOptionalChatbotContext();
  const registerReferenceSource = context?.registerReferenceSource;
  const unregisterReferenceSource = context?.unregisterReferenceSource;

  useEffect(() => {
    if (!registerReferenceSource || !unregisterReferenceSource) {
      return;
    }

    if (!enabled) {
      unregisterReferenceSource(sourceKey);
      return;
    }

    registerReferenceSource(sourceKey, references, priority);

    return () => {
      unregisterReferenceSource(sourceKey);
    };
  }, [enabled, priority, references, registerReferenceSource, sourceKey, unregisterReferenceSource]);
}
