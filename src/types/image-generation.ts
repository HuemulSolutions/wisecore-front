export const IMAGE_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number]

export interface GenerateImageRequest {
  prompt: string
  aspect_ratio: ImageAspectRatio
}

/** Imagen ya persistida como Media (level organization, origin "wisecore"). */
export interface GeneratedImage {
  media_id: string
  file_identifier: string
  url: string
  aspect_ratio: string
}

export interface GenerateImageResponse {
  data: GeneratedImage
  transaction_id: string
}

export interface ImageGenerationTestResult {
  ok: boolean
}
