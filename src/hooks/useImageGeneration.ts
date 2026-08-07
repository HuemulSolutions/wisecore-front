import { useMutation } from '@tanstack/react-query'
import { generateImage } from '@/services/image-generation'
import type { GenerateImageRequest } from '@/types/image-generation'

/**
 * Mutación de generación de imágenes. No invalida las queries de media aquí:
 * la galería se refresca al cerrar el sheet de generación, para no re-renderizar
 * la grilla de fondo mientras el usuario itera el prompt (ver src/pages/media.tsx).
 */
export function useImageGenerationMutations(organizationId: string) {
  const generateImageMutation = useMutation({
    mutationFn: (body: GenerateImageRequest) => generateImage(organizationId, body),
    retry: false,
  })

  return { generateImage: generateImageMutation }
}
