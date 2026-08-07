import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

/**
 * Prueba el flujo de generación de imágenes de la organización.
 * No recibe llm_id: el backend resuelve automáticamente el primer LLM
 * configurado con capability `image_output` y genera una imagen de prueba
 * descartable (no se guarda en storage).
 */
export async function testImageGenerationConnection(): Promise<{ ok: boolean }> {
  const response = await httpClient.post(`${backendUrl}/image-generation/test_connection`, {});
  const data = await response.json();
  const result = data.data || data;
  if (!result?.ok) throw new Error();
  return result;
}
