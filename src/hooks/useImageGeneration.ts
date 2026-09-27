import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateImage } from '@/services/image-generation'
import { mediaQueryKeys } from '@/hooks/useMedia'
import type { GenerateImageRequest } from '@/types/image-generation'

/**
 * Mutación de generación de imágenes. Invalida el listado y el picker de
 * media tras cada generación exitosa, así la galería de fondo se refresca
 * sin esperar a que el usuario cierre el sheet (ver src/pages/media.tsx).
 */
export function useImageGenerationMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const generateImageMutation = useMutation({
    mutationFn: (body: GenerateImageRequest) => generateImage(organizationId, body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.listBase() })
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.pickerBase() })
    },
  })

  return { generateImage: generateImageMutation }
}
