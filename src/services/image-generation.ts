import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  GenerateImageRequest,
  GeneratedImage,
  GenerateImageResponse,
  ImageGenerationTestResult,
} from "@/types/image-generation";

const BASE_URL = `${backendUrl}/image-generation`;

/**
 * Prueba el flujo de generación de imágenes de la organización.
 * No recibe llm_id: el backend resuelve automáticamente el primer LLM
 * configurado con capability `image_output` y genera una imagen de prueba
 * descartable (no se guarda en storage).
 */
export async function testImageGenerationConnection(): Promise<ImageGenerationTestResult> {
  const response = await httpClient.post(`${BASE_URL}/test_connection`, {});
  const data = await response.json();
  const result = data.data || data;
  if (!result?.ok) throw new Error();
  return result;
}

/**
 * Genera una imagen a partir de un prompt y la persiste como Media real de la
 * organización (level "organization", origin "wisecore", prompt como name/summary
 * por defecto, o `name` si se especifica). Acepta `llm_id` para elegir el modelo
 * (por defecto el primer LLM `image_output` configurado) y `media_id` +
 * `save_as_new_version` para versionar una Media existente en vez de crear una
 * nueva. Puede tardar decenas de segundos.
 */
export async function generateImage(
  organizationId: string,
  body: GenerateImageRequest,
): Promise<GeneratedImage> {
  const response = await httpClient.post(`${BASE_URL}/generate`, body, {
    headers: { "X-Org-Id": organizationId },
  });
  const raw = (await response.json()) as GenerateImageResponse | GeneratedImage;
  // Desenvoltura defensiva: mismo patrón que testImageGenerationConnection,
  // por si el backend no envuelve la respuesta en { data }.
  return ((raw as GenerateImageResponse).data ?? raw) as GeneratedImage;
}

export type { GeneratedImage, GenerateImageRequest };
