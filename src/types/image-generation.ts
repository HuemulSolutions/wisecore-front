export const IMAGE_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number]

export interface GenerateImageRequest {
  prompt: string
  aspect_ratio: ImageAspectRatio
  /** LLM con capability `image_output`. Ausente = el backend usa el primero configurado. */
  llm_id?: string
  /** Nombre visible de la Media + base del original_filename. Ausente = preview del prompt. */
  name?: string
  /** Media existente a versionar. Requerido si `save_as_new_version` es true. */
  media_id?: string
  /** true = nueva versión de `media_id`. false/ausente = crea una Media nueva. */
  save_as_new_version?: boolean
}

/** Imagen ya persistida como Media (level organization, origin "wisecore"). */
export interface GeneratedImage {
  media_id: string
  file_identifier: string
  url: string
  aspect_ratio: string
  /**
   * 1 = Media nueva; >1 = versión nueva de una existente. Opcional por
   * compatibilidad con backends aún no desplegados; la UI cae a 1.
   */
  version_number?: number
}

export interface GenerateImageResponse {
  data: GeneratedImage
  transaction_id: string
}

export interface ImageGenerationTestResult {
  ok: boolean
}
