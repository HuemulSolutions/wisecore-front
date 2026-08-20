import { useQuery } from '@tanstack/react-query'
import { getAllLLMs } from '@/services/llms'
import { hasCapability } from '@/lib/llm-capabilities'

export const imageLlmsQueryKey = ['llms', 'image-output'] as const

/**
 * LLMs con capability `image_output`, para el selector de modelo del sheet de
 * generación de imágenes. No hay endpoint dedicado: se reutiliza `getAllLLMs`
 * (mismo catálogo que usan assets-execute-sheet, mass-execution-form, etc.) y
 * se filtra en el cliente, igual que hace `resolveConnectionTests` en models.tsx.
 * Catálogo de formulario: exento de botón de refresh (ver refresh-button-guide.md).
 */
export function useImageLlms(enabled: boolean) {
  return useQuery({
    queryKey: imageLlmsQueryKey,
    queryFn: getAllLLMs,
    enabled,
    staleTime: 5 * 60 * 1000,
    select: (llms) => llms.filter((llm) => hasCapability(llm, 'image_output')),
  })
}
